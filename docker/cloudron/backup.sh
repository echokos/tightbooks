#!/bin/bash
# Tight Books — Daily MySQL backup to Wasabi S3
#
# Runs at 09:00 UTC (03:00 CT) daily via /etc/cron.d/tightbooks-backup.
# Sources /app/data/cron-env.sh written by start.sh to inherit Cloudron addon
# environment variables (MYSQL_*, S3_*, BACKUP_S3_BUCKET, etc.).
#
# Required env vars (via Cloudron MySQL addon):
#   MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE
# Required env vars (set in Cloudron app config):
#   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
# Optional overrides:
#   BACKUP_S3_BUCKET    — backup destination bucket  (default: tightbooks-backups)
#   BACKUP_S3_REGION    — Wasabi region              (default: us-central-1)
#   BACKUP_S3_ENDPOINT  — Wasabi endpoint URL        (default: https://s3.us-central-1.wasabisys.com)
#   NTFY_BACKUP_PASS    — ntfy basic-auth password   (default: Pinsight/32)

set -euo pipefail

# Load Cloudron environment dumped by start.sh (cron runs with minimal env)
[[ -f /app/data/cron-env.sh ]] && source /app/data/cron-env.sh

DATE=$(date '+%Y-%m-%d')
BACKUP_FILE="tightbooks-${DATE}.sql.gz"
BUCKET="${BACKUP_S3_BUCKET:-tightbooks-backups}"
REGION="${BACKUP_S3_REGION:-us-central-1}"
ENDPOINT="${BACKUP_S3_ENDPOINT:-https://s3.us-central-1.wasabisys.com}"
TEMP_FILE="/tmp/${BACKUP_FILE}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] backup: $*"; }

fail() {
    log "ERROR: $*"
    curl -sf \
        -u "aurora:${NTFY_BACKUP_PASS:-Pinsight/32}" \
        -X POST "https://notify.servv.net/aurora-alerts" \
        -H "Title: Tight Books Backup FAILED" \
        -H "Priority: urgent" \
        -H "Tags: warning,x-mark" \
        -d "MySQL backup failed ${DATE}: $*" 2>/dev/null || true
    rm -f "${TEMP_FILE}"
    exit 1
}

export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="${REGION}"

log "Starting: ${MYSQL_DATABASE} → s3://${BUCKET}/${BACKUP_FILE}"

mysqldump \
    -h "${MYSQL_HOST}" \
    -P "${MYSQL_PORT:-3306}" \
    -u "${MYSQL_USERNAME}" \
    -p"${MYSQL_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --no-tablespaces \
    "${MYSQL_DATABASE}" \
    | gzip > "${TEMP_FILE}" || fail "mysqldump failed"

SIZE=$(du -sh "${TEMP_FILE}" | cut -f1)
log "Dump complete (${SIZE}). Uploading..."

aws s3 cp "${TEMP_FILE}" "s3://${BUCKET}/${BACKUP_FILE}" \
    --endpoint-url "${ENDPOINT}" \
    --no-progress || fail "S3 upload failed"

rm -f "${TEMP_FILE}"
log "Uploaded successfully."

# 30-day retention: delete backups older than cutoff
CUTOFF=$(date -d '30 days ago' '+%Y-%m-%d')
log "Pruning backups older than ${CUTOFF}..."

aws s3 ls "s3://${BUCKET}/" \
    --endpoint-url "${ENDPOINT}" \
    | awk '{print $4}' \
    | grep -E '^tightbooks-[0-9]{4}-[0-9]{2}-[0-9]{2}\.sql\.gz$' \
    | while read -r fname; do
        fdate="${fname#tightbooks-}"
        fdate="${fdate%.sql.gz}"
        if [[ "${fdate}" < "${CUTOFF}" ]]; then
            log "Deleting old backup: ${fname}"
            aws s3 rm "s3://${BUCKET}/${fname}" \
                --endpoint-url "${ENDPOINT}" \
                || log "Warning: failed to delete ${fname}"
        fi
    done

log "Backup complete."

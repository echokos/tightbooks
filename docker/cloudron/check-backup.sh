#!/bin/bash
# Tight Books — Daily backup verification
#
# Runs at 10:00 UTC (5:00 AM CT) daily via /etc/cron.d/tightbooks-check-backup.
# Sources /app/data/cron-env.sh written by start.sh to inherit Cloudron addon
# environment variables (S3_*, BACKUP_S3_BUCKET, etc.).
#
# Required env vars (set in Cloudron app config):
#   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
#   BACKUP_CHECK_WEBHOOK_URL   — full Paperclip webhook fire URL
#   BACKUP_CHECK_WEBHOOK_SECRET — Paperclip webhook bearer token
# Optional overrides:
#   BACKUP_S3_BUCKET    — backup destination bucket  (default: tightbooks-backups)
#   BACKUP_S3_REGION    — Wasabi region              (default: us-central-1)
#   BACKUP_S3_ENDPOINT  — Wasabi endpoint URL        (default: https://s3.us-central-1.wasabisys.com)

set -uo pipefail

# Load Cloudron environment dumped by start.sh (cron runs with minimal env)
[[ -f /app/data/cron-env.sh ]] && source /app/data/cron-env.sh

DATE=$(date '+%Y-%m-%d')
BACKUP_FILE="tightbooks-${DATE}.sql.gz"
BUCKET="${BACKUP_S3_BUCKET:-tightbooks-backups}"
REGION="${BACKUP_S3_REGION:-us-central-1}"
ENDPOINT="${BACKUP_S3_ENDPOINT:-https://s3.us-central-1.wasabisys.com}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] check-backup: $*"; }

fire_alert() {
    log "Firing Paperclip alert webhook..."
    if [[ -z "${BACKUP_CHECK_WEBHOOK_URL:-}" ]]; then
        log "ERROR: BACKUP_CHECK_WEBHOOK_URL is not set — cannot fire alert"
        return 1
    fi
    curl -sf -X POST "${BACKUP_CHECK_WEBHOOK_URL}" \
        -H "Authorization: Bearer ${BACKUP_CHECK_WEBHOOK_SECRET:-}" \
        -H "Content-Type: application/json" \
        --max-time 15 \
        && log "Alert webhook fired successfully." \
        || log "WARNING: Alert webhook request failed (Paperclip may be unreachable)"
}

export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:-}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:-}"
export AWS_DEFAULT_REGION="${REGION}"

log "Checking for backup: s3://${BUCKET}/${BACKUP_FILE}"

# Validate credentials exist
if [[ -z "${AWS_ACCESS_KEY_ID}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY}" ]]; then
    log "ERROR: S3 credentials missing (S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY not set)"
    fire_alert
    exit 1
fi

# Check if today's backup exists in S3
if aws s3 ls "s3://${BUCKET}/${BACKUP_FILE}" \
        --endpoint-url "${ENDPOINT}" > /dev/null 2>&1; then
    log "Backup verified: ${BACKUP_FILE} exists in s3://${BUCKET}/"
    exit 0
else
    log "ERROR: Backup missing — ${BACKUP_FILE} not found in s3://${BUCKET}/"
    fire_alert
    exit 1
fi

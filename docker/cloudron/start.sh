#!/bin/bash
# Tight Books — Cloudron container entrypoint
# Translates Cloudron addon env vars into BigCapital's expected env vars,
# generates a stable JWT secret, runs DB migrations, then hands off to
# supervisord which manages nginx + gotenberg + node.

set -euo pipefail

echo "[tightbooks] Starting Tight Books v0.1.0"

# ── Persistent data directory (only /app/data is writable in Cloudron) ────────
mkdir -p /app/data/uploads || true
mkdir -p /app/data/public/pdf || true

# ── Map Cloudron MySQL addon vars → BigCapital DB vars ────────────────────────
# Cloudron injects CLOUDRON_MYSQL_* (not MYSQL_* without prefix)
export DB_HOST="${CLOUDRON_MYSQL_HOST}"
export DB_USER="${CLOUDRON_MYSQL_USERNAME}"
export DB_PASSWORD="${CLOUDRON_MYSQL_PASSWORD}"
export DB_CHARSET="${DB_CHARSET:-utf8}"

# The Cloudron-provisioned database becomes the BigCapital system database.
# Tenant databases are created dynamically by BigCapital using this prefix.
export SYSTEM_DB_NAME="${CLOUDRON_MYSQL_DATABASE}"
export TENANT_DB_NAME_PERFIX="${CLOUDRON_MYSQL_DATABASE}_tenant_"

# ── Map Cloudron Redis addon vars → BigCapital redis/queue vars ───────────────
# Cloudron injects CLOUDRON_REDIS_* — BigCapital reads two separate configs:
#   redis.*  → REDIS_HOST / REDIS_PORT / REDIS_PASSWORD  (ioredis direct connection)
#   queue.*  → QUEUE_HOST / QUEUE_PORT                   (Bull job queues)
export REDIS_HOST="${CLOUDRON_REDIS_HOST}"
export REDIS_PORT="${CLOUDRON_REDIS_PORT}"
export REDIS_PASSWORD="${CLOUDRON_REDIS_PASSWORD:-}"
export QUEUE_HOST="${CLOUDRON_REDIS_HOST}"
export QUEUE_PORT="${CLOUDRON_REDIS_PORT}"

# ── S3 storage (required by BigCapital's Attachments module) ─────────────────
# Set S3_* env vars in Cloudron app settings for file attachment support.
# Without real credentials, the app runs but attachment uploads will fail.
# Supports any S3-compatible store (AWS, Backblaze B2, Wasabi, MinIO, etc.)
export S3_REGION="${S3_REGION:-us-east-1}"
export S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:-placeholder}"
export S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:-placeholder}"
export S3_BUCKET="${S3_BUCKET:-tightbooks}"
# export S3_ENDPOINT=  # set for non-AWS providers (e.g. https://s3.us-west-002.backblazeb2.com)
# export S3_FORCE_PATH_STYLE=true  # needed for MinIO / path-style endpoints

# ── Stable JWT secret ─────────────────────────────────────────────────────────
# Generated once on first boot and persisted in /app/data so it survives
# container restarts. Never changes unless the file is manually deleted.
JWT_SECRET_FILE="/app/data/jwt_secret"
if [ ! -f "${JWT_SECRET_FILE}" ]; then
    echo "[tightbooks] Generating JWT secret (first run)"
    node -e "process.stdout.write(require('crypto').randomBytes(64).toString('hex'))" > "${JWT_SECRET_FILE}"
    chmod 600 "${JWT_SECRET_FILE}"
fi
export JWT_SECRET="$(cat "${JWT_SECRET_FILE}")"

# ── Application URL ───────────────────────────────────────────────────────────
# Cloudron injects APP_DOMAIN (e.g. app.tightbooks.com)
export BASE_URL="https://${APP_DOMAIN:-localhost}"

# ── Gotenberg (PDF generation) ────────────────────────────────────────────────
export GOTENBERG_URL="http://127.0.0.1:3001"
export GOTENBERG_DOCS_URL="http://127.0.0.1:3002/public/"

# ── Production flags ──────────────────────────────────────────────────────────
export NODE_ENV="production"
export NEW_RELIC_NO_CONFIG_FILE="true"

# ── Database migrations ───────────────────────────────────────────────────────
# The CLI resolves migration paths relative to its own directory, so we must
# run it from the server package root where src/database/... exists.
echo "[tightbooks] Running system database migration..."
(cd /app/packages/server && node dist/cli.js system:migrate:latest)

echo "[tightbooks] Running tenant database migrations..."
(cd /app/packages/server && node dist/cli.js tenants:migrate:latest)

echo "[tightbooks] Migrations complete. Starting services..."

# ── Hand off to supervisord ───────────────────────────────────────────────────
# supervisord manages nginx (port 3000), gotenberg (3001), node (3002).
# All exported env vars above are inherited by child processes.
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/tightbooks.conf

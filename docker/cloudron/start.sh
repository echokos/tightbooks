#!/bin/bash
# Tight Books — Cloudron container entrypoint
# Translates Cloudron addon env vars into BigCapital's expected env vars,
# generates a stable JWT secret, runs DB migrations, then hands off to
# supervisord which manages nginx + gotenberg + node.

set -eo pipefail

echo "[tightbooks] Starting Tight Books v0.1.0"

# ── Diagnostic: log which Cloudron addon vars are present ────────────────────
echo "[tightbooks] Addon env check: CLOUDRON_MYSQL_HOST=${CLOUDRON_MYSQL_HOST:-<unset>} CLOUDRON_REDIS_HOST=${CLOUDRON_REDIS_HOST:-<unset>}"

# ── Persistent data directory (only /app/data is writable in Cloudron) ────────
mkdir -p /app/data/uploads
mkdir -p /app/data/public/pdf

# ── Map Cloudron MySQL addon vars → BigCapital DB vars ────────────────────────
# Cloudron injects: CLOUDRON_MYSQL_HOST, CLOUDRON_MYSQL_PORT, CLOUDRON_MYSQL_DATABASE,
#                   CLOUDRON_MYSQL_USERNAME, CLOUDRON_MYSQL_PASSWORD, CLOUDRON_MYSQL_URL
if [ -z "${CLOUDRON_MYSQL_HOST:-}" ]; then
  echo "[tightbooks] FATAL: CLOUDRON_MYSQL_HOST not set - MySQL addon not provisioned"
  exit 1
fi
export DB_HOST="${CLOUDRON_MYSQL_HOST}"
export DB_USER="${CLOUDRON_MYSQL_USERNAME}"
export DB_PASSWORD="${CLOUDRON_MYSQL_PASSWORD}"
export DB_CHARSET="${DB_CHARSET:-utf8}"

# The Cloudron-provisioned database becomes the BigCapital system database.
# Tenant databases are created dynamically by BigCapital using this prefix.
export SYSTEM_DB_NAME="${CLOUDRON_MYSQL_DATABASE}"
export TENANT_DB_NAME_PERFIX="${CLOUDRON_MYSQL_DATABASE}_tenant_"
# Route all tenants to the single Cloudron-provisioned database (single-DB mode).
# Per-tenant database creation requires elevated MySQL privileges that Cloudron's
# addon user does not have; using TENANT_DB_NAME keeps everything in one database.
export TENANT_DB_NAME="${CLOUDRON_MYSQL_DATABASE}"

# ── Map Cloudron Redis addon vars → BigCapital queue/cache vars ───────────────
# Cloudron injects: CLOUDRON_REDIS_HOST, CLOUDRON_REDIS_PORT, CLOUDRON_REDIS_PASSWORD
export REDIS_HOST="${CLOUDRON_REDIS_HOST}"
export REDIS_PORT="${CLOUDRON_REDIS_PORT}"
export REDIS_PASSWORD="${CLOUDRON_REDIS_PASSWORD:-}"
export QUEUE_HOST="${CLOUDRON_REDIS_HOST}"
export QUEUE_PORT="${CLOUDRON_REDIS_PORT}"

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

# ── Map Cloudron email addon vars → BigCapital mail vars ─────────────────────
# Cloudron injects: CLOUDRON_MAIL_SMTP_SERVER, CLOUDRON_MAIL_SMTP_PORT,
#                   CLOUDRON_MAIL_SMTP_USERNAME, CLOUDRON_MAIL_SMTP_PASSWORD,
#                   CLOUDRON_MAIL_FROM, CLOUDRON_MAIL_DOMAIN
# Cloudron email relay runs on port 25, no TLS (MAIL_SECURE=false).
export MAIL_HOST="${CLOUDRON_MAIL_SMTP_SERVER:-localhost}"
export MAIL_PORT="${CLOUDRON_MAIL_SMTP_PORT:-25}"
export MAIL_USERNAME="${CLOUDRON_MAIL_SMTP_USERNAME:-}"
export MAIL_PASSWORD="${CLOUDRON_MAIL_SMTP_PASSWORD:-}"
export MAIL_SECURE="false"
export MAIL_FROM_ADDRESS="${CLOUDRON_MAIL_FROM:-noreply@${APP_DOMAIN:-localhost}}"
export MAIL_FROM_NAME="${MAIL_FROM_NAME:-Tight Books}"

# ── Application URL ───────────────────────────────────────────────────────────
# Cloudron injects APP_DOMAIN (e.g. books.example.com)
export BASE_URL="https://${APP_DOMAIN:-localhost}"

# ── Gotenberg (PDF generation) ────────────────────────────────────────────────
export GOTENBERG_URL="http://127.0.0.1:3001"
export GOTENBERG_DOCS_URL="http://127.0.0.1:3002/public/"

# ── Production flags ──────────────────────────────────────────────────────────
export NODE_ENV="production"
export NEW_RELIC_NO_CONFIG_FILE="true"

# ── Database migrations ───────────────────────────────────────────────────────
# The CLI resolves migration paths relative to its own directory, so we must
# cd into packages/server so that ./src/database/... resolves correctly.
echo "[tightbooks] Running system database migration..."
(cd /app/packages/server && node dist/cli.js system:migrate:latest)

echo "[tightbooks] Running tenant database migrations..."
(cd /app/packages/server && node dist/cli.js tenants:migrate:latest)

echo "[tightbooks] Migrations complete. Starting services..."

# ── Hand off to supervisord ───────────────────────────────────────────────────
# supervisord manages nginx (port 3000), gotenberg (3001), node (3002).
# All exported env vars above are inherited by child processes.
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/tightbooks.conf

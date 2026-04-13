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

# ── Map Cloudron Redis addon vars → BigCapital queue/cache vars ───────────────
# Cloudron injects CLOUDRON_REDIS_* (not REDIS_* without prefix)
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
echo "[tightbooks] Running system database migration..."
node /app/packages/server/dist/cli.js system:migrate:latest

echo "[tightbooks] Running tenant database migrations..."
node /app/packages/server/dist/cli.js tenants:migrate:latest

echo "[tightbooks] Migrations complete. Starting services..."

# ── Hand off to supervisord ───────────────────────────────────────────────────
# supervisord manages nginx (port 3000), gotenberg (3001), node (3002).
# All exported env vars above are inherited by child processes.
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/tightbooks.conf

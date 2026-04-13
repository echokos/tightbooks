# =============================================================================
# Tight Books — Cloudron Dockerfile
# =============================================================================
# Three-stage build:
#   webapp-builder  → compiles the React / Vite frontend to static files
#   server-builder  → compiles the NestJS backend
#   production      → Debian slim runtime with nginx + supervisord + Gotenberg
#
# Cloudron addons:  mysql, redis
# httpPort:         3000  (nginx — serves SPA + proxies /api to Node on 3002)
# Internal ports:   3001  (gotenberg)  3002  (node/NestJS)
# Writable path:    /app/data  (jwt_secret, uploads, pdf output)
# =============================================================================

# ── Stage 1: Build the React webapp ──────────────────────────────────────────
FROM node:18.16.0-alpine AS webapp-builder

WORKDIR /app

RUN npm install -g pnpm@9.0.5
RUN apk add --no-cache python3 build-base
ENV PYTHON=/usr/bin/python3

# Copy workspace manifests first (for layer-cache efficiency)
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json ./
COPY --chown=node:node packages/webapp/package.json ./packages/webapp/
COPY --chown=node:node shared ./shared

RUN pnpm install --frozen-lockfile

# Copy webapp source and build
COPY --chown=node:node packages/webapp ./packages/webapp
RUN pnpm run build:webapp

# ── Stage 2: Build the NestJS server ─────────────────────────────────────────
FROM node:18.16.0-alpine AS server-builder
# Cache-bust: 2026-04-13

WORKDIR /app

RUN npm install -g pnpm@9.0.5
RUN apk add --no-cache python3 build-base
ENV PYTHON=/usr/bin/python3

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json ./
COPY --chown=node:node packages/server/package.json ./packages/server/
COPY --chown=node:node shared ./shared

RUN pnpm install --frozen-lockfile

COPY --chown=node:node packages/server ./packages/server
RUN pnpm run build:server --skip-nx-cache

# ── Stage 3: Production runtime ───────────────────────────────────────────────
FROM node:18.16.0-bullseye-slim AS production

# ── System packages ───────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    chromium \
    fonts-liberation \
    fontconfig \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Gotenberg looks for "google-chrome" in PATH; alias our system chromium.
RUN ln -sf /usr/bin/chromium /usr/local/bin/google-chrome

# Copy the pre-built gotenberg binary from the official image.
# Gotenberg 7 is a single Go binary; it uses the system Chrome we installed above.
COPY --from=gotenberg/gotenberg:7 /usr/bin/gotenberg /usr/local/bin/gotenberg

# ── Node production dependencies ─────────────────────────────────────────────
WORKDIR /app

RUN npm install -g pnpm@9.0.5

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node packages/server/package.json ./packages/server/
COPY --chown=node:node shared ./shared
COPY --chown=node:node .husky ./.husky

# husky is only needed so the prepare script doesn't fail; strip it afterwards.
RUN pnpm add -D -w husky && \
    pnpm install --prod --frozen-lockfile && \
    pnpm remove -w husky && \
    apt-get purge -y --auto-remove

# ── Copy built artefacts ──────────────────────────────────────────────────────
# Server
COPY --from=server-builder --chown=node:node /app/packages/server/dist      ./packages/server/dist
COPY --from=server-builder --chown=node:node /app/packages/server/src/i18n  ./packages/server/dist/i18n
COPY --from=server-builder --chown=node:node /app/packages/server/public    ./packages/server/public
COPY --from=server-builder --chown=node:node /app/packages/server/static    ./packages/server/static
COPY --from=server-builder --chown=node:node /app/packages/server/src/database ./packages/server/src/database
COPY --from=server-builder --chown=node:node /app/shared                    ./shared

# Webapp static files → served by nginx
COPY --from=webapp-builder /app/packages/webapp/dist /app/public/webapp

# ── Runtime configuration ─────────────────────────────────────────────────────
COPY docker/cloudron/nginx.conf       /etc/nginx/sites-enabled/default
COPY docker/cloudron/supervisord.conf /etc/supervisor/conf.d/tightbooks.conf
COPY docker/cloudron/start.sh         /app/start.sh
RUN chmod +x /app/start.sh

# Remove the default nginx site that ships with the package
RUN rm -f /etc/nginx/sites-enabled/default.conf 2>/dev/null || true

# Symlink nginx logs to stdout/stderr — Cloudron container fs is read-only except /app/data.
# nginx opens the error log before reading config, so symlinks are the only reliable fix.
RUN ln -sf /dev/stdout /var/log/nginx/access.log &&     ln -sf /dev/stderr /var/log/nginx/error.log

# Gotenberg requires several PDF tool binaries. We only use Chromium→PDF,
# so stub all others with /bin/true to satisfy module initialization.
# Gotenberg modules: chromium (used), libreoffice/unoconverter/pdftk/qpdf (stubbed).
RUN ln -sf /bin/true /usr/bin/soffice && \
    ln -sf /bin/true /usr/bin/unoconverter && \
    ln -sf /bin/true /usr/bin/pdftk && \
    ln -sf /bin/true /usr/bin/qpdf && \
    ln -sf /bin/true /usr/bin/pdfcpu

# ── Persistent data directory (Cloudron mounts /app/data as writable volume) ──
# VOLUME tells Docker this is an external mount point; RUN mkdir creates it.
RUN mkdir -p /app/data
VOLUME /app/data

# ── Environment defaults ──────────────────────────────────────────────────────
ENV NODE_ENV=production \
    NEW_RELIC_NO_CONFIG_FILE=true

EXPOSE 3000

CMD ["/app/start.sh"]


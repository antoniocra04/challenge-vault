
FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --- Dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --no-audit --no-fund

# --- Build ------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads \
    MIGRATIONS_DIR=/app/drizzle

RUN addgroup -S -g 1001 vault && adduser -S -u 1001 -G vault vault \
 && mkdir -p /data/uploads && chown -R vault:vault /data

COPY --from=builder --chown=vault:vault /app/public ./public
COPY --from=builder --chown=vault:vault /app/.next/standalone ./
COPY --from=builder --chown=vault:vault /app/.next/static ./.next/static
COPY --from=builder --chown=vault:vault /app/drizzle ./drizzle

USER vault
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

# Database migrations run automatically on startup (src/instrumentation.ts).
CMD ["node", "server.js"]

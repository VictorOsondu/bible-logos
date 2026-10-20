# syntax=docker/dockerfile:1

# Build: install, download the pinned sources, build data/bible.db and the standalone server.
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Compilers are only needed if better-sqlite3 has no prebuilt binary for this platform
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Downloaded sources are cached between builds; their checksums are verified either way
RUN --mount=type=cache,target=/app/data/sources npm run seed && npm run build

# Run: only the standalone server, static assets and the database.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/data/bible.db ./data/bible.db
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "server.js"]

# syntax=docker/dockerfile:1.7
#
# Image de pilote-nc. Le contexte de build DOIT être la racine du monorepo :
#   docker build -f apps/pilote-nc/Dockerfile -t pilote-nc .
#
# Cibles :
#   - runtime (défaut) : serveur Next.js "standalone", utilisateur non-root
#   - migrate          : image avec la CLI Prisma, pour `prisma migrate deploy`
#                        (et `prisma db seed` en démo) — jamais déployée en prod.

ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-bookworm-slim AS base
# openssl : requis par le moteur de requêtes Prisma.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /repo

# --------------------------------------------------------------------------
FROM base AS build
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile --filter "@pilote/nc..."
RUN pnpm --filter @pilote/nc exec prisma generate
# CI=true désactive le cache disque de Turbopack (inutile dans une image).
RUN CI=true NODE_OPTIONS="--max-old-space-size=2048" \
  pnpm --filter @pilote/nc exec next build

# --------------------------------------------------------------------------
FROM build AS migrate
WORKDIR /repo/apps/pilote-nc
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# --------------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
  PORT=3000 \
  HOSTNAME=0.0.0.0 \
  NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/pilote-nc/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/pilote-nc/.next/static ./apps/pilote-nc/.next/static
COPY --from=build --chown=node:node /repo/apps/pilote-nc/public ./apps/pilote-nc/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/connexion').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/pilote-nc/server.js"]

# syntax=docker/dockerfile:1.7
#
# One Dockerfile for every zone:
#   docker build --build-arg APP=shell -t bank-portal/shell .
#   docker build --build-arg APP=loans --build-arg HEALTH_PATH=/loans/healthz -t bank-portal/loans .
# Pin NODE_IMAGE to a digest in your registry for reproducible, scannable builds.

ARG NODE_IMAGE=node:22-alpine

# ---- base: toolchain ---------------------------------------------------------
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NUXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@12.4.2 && npm cache clean --force
WORKDIR /repo

# ---- deps: install once, cached by lockfile ---------------------------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/shell/package.json apps/shell/
COPY apps/loans/package.json apps/loans/
COPY layers/base/package.json layers/base/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ---- build: compile only the requested zone ---------------------------------
FROM deps AS build
ARG APP
RUN test -n "$APP" || (echo "Build arg APP is required (shell|loans)" && exit 1)
COPY . .
RUN pnpm --filter "@bank/${APP}" exec nuxt prepare \
 && pnpm --filter "@bank/${APP}" build

# ---- runtime: tiny, non-root, no package manager, no source -----------------
FROM ${NODE_IMAGE} AS runtime
ARG APP
ARG HEALTH_PATH=/healthz
LABEL org.opencontainers.image.title="bank-portal-${APP}" \
      org.opencontainers.image.source="https://github.com/your-org/bank-portal"
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    HEALTH_PATH=${HEALTH_PATH} \
    NUXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache tini
WORKDIR /app
# Nitro's .output is self-contained: no node_modules or source code ships.
COPY --from=build --chown=node:node /repo/apps/${APP}/.output ./.output
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}${HEALTH_PATH}" >/dev/null || exit 1
# tini forwards SIGTERM so in-flight requests (and SSE streams) close cleanly on rollout.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", ".output/server/index.mjs"]

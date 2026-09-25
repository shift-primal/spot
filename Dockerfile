FROM node:24-alpine AS base
RUN npm install -g pnpm@12.4.1
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json client/
COPY server/package.json server/
COPY shared/package.json shared/

FROM base AS build
RUN pnpm install --frozen-lockfile
COPY client client
COPY shared shared
RUN pnpm --filter client build

FROM base AS runtime
ENV NODE_ENV=production PORT=3000 TRUST_PROXY=1
RUN pnpm install --frozen-lockfile --prod --filter server... \
	&& mkdir -p server/data && chown node:node server/data
COPY shared shared
COPY server/src server/src
COPY --from=build /app/client/dist client/dist
USER node
WORKDIR /app/server
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1
CMD ["node", "src/index.ts"]

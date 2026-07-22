FROM node:24.12.0-bookworm-slim AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json vitest.config.ts ./
COPY apps ./apps
COPY packages ./packages
COPY adapters ./adapters
COPY tests ./tests

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:24.12.0-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app

ENTRYPOINT ["node", "apps/cli/dist/index.js"]
CMD ["--help"]

FROM node:24-bookworm-slim

WORKDIR /workspace

ENV CI=true
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

# Install dependencies before application source so Docker can reuse this layer
# when only workspace code changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY patches/ patches/
COPY apps/atlas/package.json apps/atlas/package.json
COPY apps/agents-bridge/package.json apps/agents-bridge/package.json
COPY packages/atlas-auth/package.json packages/atlas-auth/package.json
COPY packages/atlas-contracts/package.json packages/atlas-contracts/package.json
COPY packages/atlas-core/package.json packages/atlas-core/package.json
COPY packages/atlas-db/package.json packages/atlas-db/package.json
COPY packages/atlas-fixtures/package.json packages/atlas-fixtures/package.json
COPY packages/document-store/package.json packages/document-store/package.json
RUN corepack pnpm install --frozen-lockfile

COPY . .

EXPOSE 3001
EXPOSE 3002

# Migrations are idempotent, so every fresh Compose boot prepares the local
# database before the Atlas development server accepts traffic.
CMD ["sh", "-c", "corepack pnpm --filter @atlas/db migrate && corepack pnpm --filter @atlas/app run sources:sync && exec corepack pnpm --filter @atlas/app exec vinext dev --port 3001"]

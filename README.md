# Atlas workspace

The workspace currently contains the fixture-driven Atlas prototype and golden fixture package. Backend services and packages are added in dependency order through the BSS ticket set.

## Requirements

- Node.js `24.x`
- Corepack with pnpm `11.19.0` (the version declared by `packageManager`)
- Docker Engine with the Docker Compose v2 plugin (for the local PostgreSQL service)

## Commands

Run from the repository root:

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm dev`
- `corepack pnpm build`
- `corepack pnpm test`
- `corepack pnpm typecheck`
- `corepack pnpm lint`

The shared TypeScript defaults are in `tsconfig.base.json`. A workspace package opts into the recursive `typecheck` command by defining a `typecheck` script in its `package.json` and extending that shared configuration. Package-specific compiler settings can override the defaults where a framework or runtime requires them.

See [backend package ownership](docs/backend-package-ownership.md) for the planned responsibilities and boundaries.

## Local PostgreSQL

The local database uses the PostgreSQL 18 official image. Its data lives in the named, Compose-project-scoped `postgres-data` volume, not in the repository. Compose supplies local-only defaults, so a fresh clone can boot without an `.env` file. Copy `.env.example` to `.env` only when you need to override a port, database name, or local development credentials.

## Boot Atlas with Docker Compose

Boot the Atlas app, run the database migrations, and start PostgreSQL with one command:

```sh
docker compose up
```

Open <http://localhost:3001>. The first boot builds the app image; subsequent boots reuse it unless the Dockerfile or dependencies change. Use `docker compose up --build` after changing application dependencies or Docker configuration.

To inspect service health and follow the app logs:

```sh
docker compose ps
docker compose logs -f atlas
```

Set `ATLAS_PORT` in `.env` to use a different host port. The application always connects to the Compose PostgreSQL service internally, while `DATABASE_URL` on your host remains available for local commands and tests.

### PostgreSQL-only workflow

Start PostgreSQL without the Atlas app and wait until it reports healthy:

```sh
docker compose up -d postgres
docker compose ps
```

Using the sample database/user values from `.env.example`, verify readiness and a SQL connection:

```sh
docker compose exec postgres pg_isready -U atlas -d atlas_dev
docker compose exec postgres psql -U atlas -d atlas_dev -c "select 1"
```

To stop and restart while preserving data:

```sh
docker compose stop postgres
docker compose start postgres
```

To deliberately reset this database's data, remove the Compose project's declared volumes, then start it again. `postgres-data` is currently the only declared volume:

```sh
docker compose down --volumes
docker compose up -d postgres
```

The reset permanently deletes this Compose project's local PostgreSQL contents, but does not remove volumes belonging to other projects or repository files. Set `POSTGRES_PORT` in `.env` to change the host port, and update `DATABASE_URL` to match.

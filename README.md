# Atlas workspace

The workspace currently contains the fixture-driven Atlas prototype and golden fixture package. Backend services and packages are added in dependency order through the BSS ticket set.

## Requirements

- Node.js `24.x`
- Corepack with pnpm `11.19.0` (the version declared by `packageManager`)

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

# Atlas UI

The future-facing Atlas user interface. During prototype development it reads
only from `@atlas/fixtures`; live services will later replace that data boundary
without requiring a UI rewrite.

## Commands

Run commands from the repository root with `pnpm`:

- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `pnpm lint`

No Docker workflow is required for the fixture-only prototype. If one is added,
dependency downloads and caches must use named Docker volumes rather than the
repository root.

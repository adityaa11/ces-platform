# BSS-001: Runtime and workspace foundation

- **State:** `awaiting_review`
- **Review batch:** BSS-BATCH-01
- **Depends on:** None
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§2, 14, 17, 21; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2.md) — Core Principle, Cross-Cutting: Reasoning vs Deterministic Authority

## Outcome

Make the monorepo reproducible on the baseline Node.js and TypeScript toolchain while preserving the current Atlas prototype and preparing clear boundaries for backend packages.

## Scope

- Set Node.js 24 LTS as the workspace runtime and declare the supported major version in the root and app package metadata.
- Keep `pnpm` as the workspace package manager and preserve the existing lockfile as its dependency authority.
- Establish shared TypeScript compiler defaults and scripts needed to type-check the workspace as backend packages are added.
- Document the intended ownership boundaries for `apps/atlas`, `apps/agents-bridge`, `packages/atlas-core`, `packages/atlas-db`, `packages/atlas-contracts`, `packages/atlas-skills`, `packages/document-store`, and `packages/atlas-fixtures`.
- Limit changes to workspace/tooling setup; do not implement or validate UI and fixture scenarios in this ticket.

## Acceptance criteria

- The workspace declares Node.js `24.x` as its supported runtime without pinning a machine-specific patch release.
- `pnpm` remains the package manager and a frozen-lockfile install succeeds.
- Shared TypeScript configuration can be consumed by new backend packages without making Atlas Core depend on database or web frameworks.
- The package-boundary note identifies `atlas-fixtures` as test/golden data and records the intended production package ownership from the baseline.
- The current `apps/atlas` application builds under Node.js 24; fixture-suite and golden-data checks are excluded from this ticket's acceptance.
- No production service behavior, final database schema, final skill list, or provider integration is added.

## Validation

- Confirm `node --version` reports a supported Node.js 24 release.
- Run `corepack pnpm install --frozen-lockfile`.
- Run workspace type-check and the existing app build under Node.js 24.
- Do not gate BSS-001 on `@atlas/fixtures` tests, golden generation, PRD/PDF catalog checks, or fixture-driven UI scenario checks; those are owned by the separate AUI/GLF/SFE ticket sets.
- Confirm the root scripts and package boundaries document `atlas-fixtures` as test/golden material without introducing it as a production package.

## Review checkpoint

- **Review question:** Is the workspace reproducible on the selected Node and TypeScript toolchain while preserving the existing prototype?
- **Combined acceptance:** Runtime and package-manager versions are declared; a clean frozen install and workspace type-check pass; the existing UI can be built under Node.js 24; package ownership and the BSS fixture-suite exclusion are explicit.
- **Commit to review:** `5c93620`.

## Implementation checkpoint

The runtime declarations, shared compiler defaults, recursive package type-check command, and package ownership note are implemented. No backend service behavior or prototype scenario behavior is introduced.

Validation was run with Node.js `24.12.0` and pnpm `11.19.0`:

- Frozen-lockfile installation succeeds in an isolated workspace copy using the populated pnpm store. The active workspace install was prevented by a locked file under `node_modules`; dependency contents were not changed by the successful isolated validation.
- The shared TypeScript config compiled a temporary consumer package, and the recursive workspace type-check command ran that package successfully.
- The Atlas application build passes under Node.js 24.
- `git diff --check` passes.

The code, documentation, and BSS-scoped validation are complete. The ticket is ready for its committed review checkpoint.

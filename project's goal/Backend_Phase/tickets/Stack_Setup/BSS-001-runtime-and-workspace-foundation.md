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
- Keep the existing fixture-driven UI usable; do not migrate it to live services in this ticket.

## Acceptance criteria

- The workspace declares Node.js `24.x` as its supported runtime without pinning a machine-specific patch release.
- `pnpm` remains the package manager and a frozen-lockfile install succeeds.
- Shared TypeScript configuration can be consumed by new backend packages without making Atlas Core depend on database or web frameworks.
- The package-boundary note identifies `atlas-fixtures` as test/golden data and records the intended production package ownership from the baseline.
- The current `apps/atlas` build and tests continue to pass under Node.js 24.
- No production service behavior, final database schema, final skill list, or provider integration is added.

## Validation

- Confirm `node --version` reports a supported Node.js 24 release.
- Run `corepack pnpm install --frozen-lockfile`.
- Run workspace type-check, existing app build, and existing tests.
- Confirm the root scripts and package boundaries are documented and do not alter fixture behavior.

## Review checkpoint

- **Review question:** Is the workspace reproducible on the selected Node and TypeScript toolchain while preserving the existing prototype?
- **Combined acceptance:** Runtime and package-manager versions are declared; a clean frozen install and workspace type-check pass; the existing UI build and tests pass; package ownership and fixture boundaries are explicit.
- **Commit to review:** Pending final validation and commit.

## Implementation checkpoint

The runtime declarations, shared compiler defaults, recursive package type-check command, and package ownership note are implemented. The existing prototype validation blockers were repaired under [AUI-014](../../atlas-ui/AUI-014-prototype-validation-baseline.md), with the raw PDFs excluded from the golden test command and no runtime dependency on the old source paths.

Validation was run with Node.js `24.12.0` and pnpm `11.19.0`:

- Frozen-lockfile installation succeeds in an isolated workspace copy using the populated pnpm store. The active workspace install was prevented by a locked file under `node_modules`; dependency contents were not changed by the successful isolated validation.
- The shared TypeScript config compiled a temporary consumer package, and the recursive workspace type-check command ran that package successfully.
- The Atlas application build and all 9 Atlas app tests pass with both an empty `docs/PRD` and the current workspace-scoped PDFs.
- All 39 fixture package tests pass with an empty `docs/PRD`, including golden regeneration, current skill-contract validation, and negative publication cases.
- Atlas builds and its public root route returns HTTP 200 when `docs/PRD` contains no PDFs.
- The changed TypeScript and JavaScript files pass ESLint; the full app lint command still reports existing findings in unchanged files.
- `git diff --check` passes.

The code, documentation, validation, and rendered inspection are complete. The ticket is ready for its committed review checkpoint.

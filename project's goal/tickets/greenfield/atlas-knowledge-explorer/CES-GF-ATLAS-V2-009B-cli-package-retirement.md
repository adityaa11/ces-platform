# CES-GF-ATLAS-V2-009B - CLI and Package Retirement

**Status:** Implemented
**Depends on:** ATLAS-V2-009A

## Outcome

Remove unreachable V1 Atlas CLI assembly and retire packages that exist only to
produce workflow-only or fixed-detail output.

## Scope

- Delete V1 extraction, resume, graph, Mermaid, fixed-detail, and publication helpers.
- Wire V2 approval into the CLI before removing the V1 approval command.
- Preserve unrelated CES CLI commands and graph-neutral infrastructure.
- Remove retired package dependencies, source, tests, architecture assignments,
  and lockfile entries only after import scans prove no remaining consumers.

## Acceptance

- `atlas run`, V2 approval, and V2 inspection are the only Atlas CLI runtime paths.
- No V1 artifact name or compatibility fallback exists in CLI production source.
- Workspace typechecks and architecture checks pass without retired packages.

## Implementation Evidence

- The CLI exposes only `atlas run`, `atlas approve`, and `atlas inspect`; run and
  approval consume and publish Atlas V2 knowledge contracts.
- Removed the V1 CLI helpers, tests, qualification fixtures, architecture entries,
  and ten packages whose import graph contained no non-legacy consumers.
- Updated the workspace lockfile after reducing the workspace from 42 to 32 projects.
- `corepack pnpm typecheck` passes across the workspace.
- `corepack pnpm exec vitest run apps/cli/src/atlas-v2.test.ts tests/architecture.test.ts`
  passes, including deterministic V2 publication and approval coverage.

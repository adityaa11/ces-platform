# CES-GF-ATLAS-V2-000 - Legacy Runtime Quarantine and Removal Map

**Status:** Implemented
**Depends on:** None

## Outcome

Make the existing Atlas v1 runtime impossible to mistake for v2 architecture,
and maintain the exact removal ledger used by ATLAS-V2-001 through V2-009.
This ticket does not preserve v1 compatibility. It identifies what may be
temporarily kept only until its v2 replacement lands.

## Keep only as graph-neutral infrastructure

These components require focused validation before reuse:

- document ingestion, source-unit boundaries, and PDF locations;
- exact source representations and evidence tracing;
- canonical serialization, hashes, manifests, and atomic artifact publication;
- immutable review decisions, revision checks, and audit history;
- generic Agents Bridge execution, authentication, limits, and telemetry;
- React Flow and ELK only as replaceable UI rendering/layout adapters.

Passing an old test is not reuse evidence. A component is reusable only when it
depends on the ATLAS-V2 contract without a v1 compatibility branch.

## Rewrite ledger

- `packages/agent-provider-sdk`: replace Atlas request/result candidate arrays.
- `packages/atlas-extraction`: emit v2 semantic facts and exact evidence.
- Atlas extraction agents under `apps/agents-bridge/src/agents`: adopt the v2
  provider contract without an Atlas compatibility envelope.
- `packages/atlas-intent-graph`: replace workflow/focused projections with
  graph selection and recursive knowledge assembly.
- `packages/atlas-model-review-contracts`: replace workspace/detail/tab schemas
  with the recursive knowledge contract.
- proposed/approved project-model integration: consume and materialize v2
  canonical identities and hierarchy.
- Atlas orchestration in `apps/cli/src/index.ts`: replace both duplicated v1
  assembly paths with one v2 orchestrator.
- `apps/atlas-workflow-ui/lib`: read v2 knowledge artifacts and revisions.
- `apps/atlas-workflow-ui/app/graph-workspace.tsx`: implement the workspace in
  `graphs context.md` without fixed tabs or browser-owned semantics.

## Delete ledger

- workflow-only and focused-projection builders/renderers in
  `packages/atlas-intent-graph`;
- Mermaid artifact production as a required Atlas runtime path;
- v1 model-review workspace/detail/detail-index contracts;
- `proposed-workflow-detail-graphs.json`, workflow indexes, and per-workflow
  `flow.mmd` publication;
- `/api/atlas/detail-tabs` and v1 detail-index lookup;
- unused static/prototype UI under `apps/atlas-workflow-ui/src` and `index.html`;
- v1-only tests and fixtures that require deleted contracts or artifacts;
- duplicated CLI assembly and permanent compatibility fallbacks;
- Atlas-specific v1 compatibility handling in the Agents Bridge.

## Quarantine gates

- Add an executable denylist test for forbidden v1 imports, routes, artifact
  names, and contract names.
- New v2 modules may not import v1 graph/projection/detail contracts.
- V1 behavior may be removed incrementally only with its v2 replacement, but
  no new feature may be added to v1.
- Every temporary v1 dependency must name the ATLAS-V2 ticket that deletes it.
- ATLAS-V2-009 cannot pass while any ledger entry or compatibility fallback
  remains.

## Acceptance

- [x] Runtime dependency map identifies every producer and consumer listed
      above.
- [x] Denylist test fails on new v1 dependencies.
- [x] Each rewrite/delete entry is assigned to ATLAS-V2-001 through V2-009.
- [x] No ticket or product context authorizes v1 behavior.
- [x] The final repository scan reports zero active legacy paths.

The final zero-path criterion is intentionally closed by ATLAS-V2-009 after
all replacements land. The executable ledger is
`tests/fixtures/atlas-v2/legacy-runtime-ledger.json`; its quarantine gate is
`tests/atlas-v2-legacy-quarantine.test.ts`.

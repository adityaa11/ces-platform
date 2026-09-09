# Review: BATCH-19 - Golden fixture data contract

- Reviewed commit: `d5894bff4be07134fb5dc12a4e084161e24379a3`
- Ticket: GLF-003
- Baseline: Architecture Checkpoint sections 2, 4–12, 16–20, 22–24; UI/UX Prototype PRD 9.1, 9.4; Fixture Data-Intent Contract
- Result: `CHANGES_REQUESTED`
- Review round: 2

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Blocker | `apps/atlas/scripts/generate-golden-fixture.mjs:46-57,128-134` | GLF-003 scope and execution plan; the shared skill contracts require a provider-neutral adapter whose selected executor produces the declared structured response | Accepted | Add an explicit executor/adapter boundary for the five skills. The `codex` adapter must be the default, a future `agents_bridge` adapter must be substitutable without changing skill I/O, and the bundle must be built from the returned stage candidates/reports. Loading manifests and validating generator-owned callback objects does not execute the skill contracts; `SKILLS_MODE` currently changes provenance only, while `agents_bridge` cannot be supplied to the generator. |
| F-002 | Blocker | `apps/atlas/scripts/generate-golden-fixture.mjs:66-89,128-137` | GLF-003 acceptance and `atlas.fixture-verification`: publication is allowed only after full deterministic topology, provenance, evidence, dependency, and branch-isolation gates pass | Accepted | Validate all required repository/projection relationships, evidence/page references, supersession links, accepted assertion IDs, dependency targets, shared semantic values, and both branch projections. Pass the complete projection bundle to verification, and abort before writing when the verification response or any check is `fail`/`inconclusive`. The current validator covers only a subset of refs, verification receives `projections[0]`, and the hardcoded `status: "pass"` is never gate-checked. |
| F-003 | Important | `apps/atlas/scripts/generate-golden-fixture.mjs:16-24,93-94` | GLF-003 execution plan step 1 and acceptance: discover and process all checked-in PDFs under `docs/PRD/` in deterministic order | Accepted | Fixed in this commit: recursive PDF discovery is sorted, and artifact IDs/relative paths derive from discovered files. |
| F-004 | Important | `packages/atlas-fixtures/src/golden-fixture.ts:1-17`; `packages/atlas-fixtures/tests/golden-fixture.test.mjs:10-24` | GLF-003 validation: resolve Master and incremental branch data through one pure fixture read contract | Accepted | Fixed in this commit: the exported reader selects the branch, matching HEAD-keyed materialized state, and projection, and the branch-isolation tests use it. |
| F-005 | Important | `project's goal/Git-Like_Fixture_Phase/README.md:32-34` | Atlas delivery controls require prior approved checkpoints to be reflected consistently in the ticket-set state table | Accepted | Fixed in this commit: GLF-001/BATCH-17 and GLF-002/BATCH-18 now read `approved`, while GLF-003/BATCH-19 remains `awaiting_review`. |

## Decision

BATCH-19 remains `CHANGES_REQUESTED`. The fixture test suite passes 13/13, the
working diff is whitespace-clean, and F-003 through F-005 are resolved. The
checkpoint still does not execute the provider-neutral skill pipeline: its
responses are hardcoded in generator callbacks and then duplicated into the
bundle. Its deterministic gate is also incomplete and does not enforce the
verification result before publication. Resolve F-001 and F-002 in one
remediation commit, then re-run `ck`; do not begin GLF-004.

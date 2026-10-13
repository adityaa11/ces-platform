# CFC checkpoint — SEM-CUTOVER-005

- **Ticket:** `SEM-CUTOVER-005` — Provisional semantic accounting and replay-safe handoff
- **Batch:** `SEM-CUTOVER`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-005-provisional-accounting-and-replay-handoff.md`
- **CK authority:** `project's goal/feedback/SEM-CUTOVER-005-40e06c2-review.md` (`CHANGES_REQUIRED`)
- **Addressed frozen clauses:** `CK-001.a`, `CK-001.b`
- **Ticket/checkpoint state:** `awaiting_review`
- **Authorization:** first bounded CFC pass following the consolidated `CHANGES_REQUIRED` review; no HMN authorization is required or consumed.

## CFC closure progress

| Clause | Status | Closure evidence and frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `prepareProvisionalSemanticSidecar()` now accepts canonical candidate/question evidence only when every locator exactly matches a ready, independently owned request slot. Pending or contextual slots remain excluded from canonical inventory while `sourceAccounting` retains them. `tests/provisional-semantic-sidecar.test.ts` proves the valid path and rejects foreign candidate and question evidence. **Oracle passed.** |
| `CK-001.b` | `PROVEN` | The sidecar now retains `semanticProfileSha256` and the complete immutable relationship revision provenance, validates its deterministic revision hash, source/execution/bundle/document scope, exact source-slot/asset identity, and request-extension lineage/role/necessity/uncertainty/disposition before including it in the deterministic sidecar hash. Focused tests prove the retained profile/provenance and reject a mismatched profile or revision dependency. **Oracle passed.** |

## Required validation

| Command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/skills exec jiti tests/provisional-semantic-sidecar.test.ts` | PASS — 5/5. |
| `pnpm --filter @atlas/skills typecheck` | PASS. |
| `git diff --check -- packages/atlas-skills/src/provisional-semantic-sidecar.ts packages/atlas-skills/tests/provisional-semantic-sidecar.test.ts` | PASS. |

## Direct-regression boundary

The remediation changes only the pure provisional sidecar preparation/value
object and its focused tests. It does not touch provider dispatch, semantic
jobs, persistence, REL-03, admission, publication, Master mutation, Docker,
or deployment. Existing replay, stale-lease, staged-mismatch, wrong-source,
and duplicate-revision negatives remain in the focused suite and pass.

Internal readiness: READY_FOR_CK

This checkpoint is awaiting CK verification of the frozen clauses only.

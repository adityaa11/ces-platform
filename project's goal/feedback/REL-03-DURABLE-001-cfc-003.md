# CFC checkpoint — REL-03-DURABLE-001 predecessor contract repair

- **Ticket:** `REL-03-DURABLE-001`
- **State:** `awaiting_review`
- **Frozen CK artifact:** `project's goal/feedback/REL-03-DURABLE-001-041560b-review.md`
- **Consumed HMN authorization:** `HMN-REL-03-DURABLE-001-008`
- **Authorized boundary:** pure REL-03 / SEM-006 / SEM-005 predecessor preparation; no durable-stage, worker, provider, delivery, acknowledgement, accepted-context, publication, reconciliation, or Master work.

## CFC closure progress

| Frozen clause | Status | Closure evidence |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `projectQualifiedStepwiseSemanticResult()` now accepts deferred tuples only when their immutable REL-03 revision is supplied and verifies the derived ID, revision hash, exact owned/context locators, essential dependency, tuple membership, uncertainty, and proposal meaning. The focused SEM-006 test rejects foreign tuple, recomputed ID, and locator mutations before output. |
| `CK-001.b` | `PROVEN` | Qualified accounting retains `canonicalResultSha256: null` for wholly deferred meaning, rather than emitting an empty Semantic V1 placeholder; its accounting still has only qualified deferred/source/tuple coverage. The integrated handoff assertion observes the null representation. |
| `CK-002.a` | `PROVEN` | Qualified accounting persists its exact request and parsed provider proposal as immutable preparation context while deriving all source and candidate universes from those values. Re-running the same handoff is hash-stable; a source-result removal is rejected before accounting. |
| `CK-003.a` | `PROVEN` | Focused source-derived predecessor suites cover independent/canonical and wholly deferred projections, distinct execution identity, pending visual identity, foreign tuple, deferred-ID, locator, source-universe, and snapshot mutations. All paths are pure and return before any durable effect. |

## Validation

| Required command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/skills typecheck` | PASS |
| `pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-extraction-finalizer.sem-cutover-006.test.ts` | PASS — 4/4 |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` | PASS — 7/7 |
| `pnpm --filter @atlas/skills exec jiti tests/provisional-semantic-sidecar.test.ts` | PASS — 11/11 |
| `git diff --check` | PASS |

Resolved rows `RC-PRE-001` and `RC-PRE-004` were preserved; the focused
interoperability regression suite passed without redesigning them.

**Internal readiness: READY_FOR_CK**

This is one bounded CFC handoff for CK verification of only `CK-001.a`,
`CK-001.b`, `CK-002.a`, and `CK-003.a`. HMN authorization consumed:
`HMN-REL-03-DURABLE-001-008`.

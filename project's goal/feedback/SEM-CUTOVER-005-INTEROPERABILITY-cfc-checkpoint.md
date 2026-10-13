# CFC checkpoint — SEM-CUTOVER-005-INTEROPERABILITY

- **Ticket:** `SEM-CUTOVER-005-INTEROPERABILITY`
- **Batch:** `SEM-CUTOVER`
- **Frozen CK authority:** `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-afe885f-review.md`
- **Consumed HMN authorization:** `HMN-SEM-CUTOVER-005-INTEROPERABILITY-004`
- **Remediation target:** this bounded remediation commit.
- **Ticket/checkpoint state:** `awaiting_review`

## Working progress and closure evidence

| Frozen clause | Status | Corrective evidence locator | Required validation and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/tests/semantic-relationship-interoperability-bridge.test.ts`, `RC-INT-001` and `RC-INT-002/003`, now assert exact canonical source slots, distinct perception/semantic executions, immutable source SHA provenance, complete tuple/source accounting, and essential-deferred plus independent dispositions. | `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` — PASS, 6/6; both package typechecks — PASS. | Actual producer outputs reach the actual composite with exact identities and complete mixed accounting. |
| `CK-001.b` | `PROVEN` | The bridge focused test's `RC-INT-003` composes the actual REL-03 deferred descriptor into the actual composite, with no canonical candidate bound to its deferred tuple. | Focused bridge test — PASS, 6/6; both package typechecks — PASS. | Fully deferred meaning retains the exact REL-03 ID and has no fabricated canonical candidate state. |
| `CK-001.c` | `PROVEN` | The bridge focused test's `RC-INT-004` creates an actual first-response revision, projects it through a genuine request, prepares a distinct later current-response revision, and checks both retained provenance records in the composite. | Focused bridge test — PASS, 6/6; both package typechecks — PASS. | Projected history and current-response revisions remain separate, without execution reconciliation or provenance rewrite. |
| `CK-001.d` | `PROVEN` | `packages/atlas-skills/src/provisional-semantic-sidecar.ts` now requires a relationship revision's scope execution to equal its normalized-document execution. The bridge focused test recomputes a semantic-scoped tampered revision hash and proves rejection before composite preparation. | Focused bridge and sidecar tests — PASS, 6/6 and 11/11; both package typechecks — PASS. | Mismatched revision execution rejects, while genuine perception-scoped revisions compose under a distinct semantic execution. |
| `CK-001.e` | `PROVEN` | The bridge focused test's integrated replay invokes the same genuine bridge-to-composite input twice, compares composite hashes and complete outputs, and asserts the pure authority flags remain all false. | Focused bridge test — PASS, 6/6; REL-03 direct regression — PASS, 4/4. | Integrated replay is deterministic, and the bridge/composite result has no provider, repository, append, stage, database, Master, publication, acceptance, or production-job effect surface. |

## Direct regressions checked

| Command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` | PASS — 6/6. |
| `pnpm --filter @atlas/skills exec jiti tests/provisional-semantic-sidecar.test.ts` | PASS — 11/11. |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-finalizer.test.ts` | PASS — 4/4. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-extraction-request.test.ts` | PASS — 5/5. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS — 8/8. |
| `pnpm --filter @atlas/skills typecheck` | PASS. |
| `pnpm --filter @atlas/agents-bridge typecheck` | PASS. |
| `git diff --check` | PASS. |

Only the HMN-authorized bridge/composite production and focused-test paths, plus this required CFC handoff checkpoint, are included. Existing unrelated tracked and untracked work remains untouched.

Internal readiness: `READY_FOR_CK`.

## Handoff

HMN authorization consumed: `HMN-SEM-CUTOVER-005-INTEROPERABILITY-004`.

Request independent CK verification only for frozen clauses `CK-001.a` through
`CK-001.e`, this remediation diff, the evidence above, and direct regressions.
Do not reopen predecessor contracts or start another remediation cycle.

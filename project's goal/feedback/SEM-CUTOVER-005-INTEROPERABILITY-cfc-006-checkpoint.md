# CFC checkpoint — SEM-CUTOVER-005-INTEROPERABILITY

- **Ticket:** `SEM-CUTOVER-005-INTEROPERABILITY`
- **Batch:** `SEM-CUTOVER`
- **Workflow state:** `awaiting_review`
- **Consumed HMN authorization:** `HMN-SEM-CUTOVER-005-INTEROPERABILITY-006`
- **Current CK authority:** `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-9990121-verification.md`
- **Original frozen closure matrix:** `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-afe885f-review.md`
- **Authorized clause:** `CK-001.a` only
- **Changed-file boundary:** `apps/agents-bridge/tests/semantic-relationship-interoperability-bridge.test.ts` and this checkpoint only.

## Bounded remediation

The focused genuine producer-to-consumer composite test now observes the full
independently finalized tuple rather than dispositions alone. It asserts the
actual composite result contains `sourceSlot: "slot-000001"`,
`candidateIndex: 1`, `disposition: "independently_finalized"`, and
`canonicalCandidateId: "independent"`. The already-proven source, asset, and
mixed independent/deferred observations remain in the same scenario.

No production implementation file was modified. Original frozen clauses
`CK-001.b` through `CK-001.e` remain resolved and were not reopened.

## Frozen finding closure matrix

| Clause | Status | Evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/tests/semantic-relationship-interoperability-bridge.test.ts`, `RC-INT-002/003` | `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` — PASS, 6/6; `pnpm --filter @atlas/skills typecheck` — PASS; `pnpm --filter @atlas/agents-bridge typecheck` — PASS | The actual composite visibly contains exact source/asset/candidate identity and complete mixed independent/deferred accounting. The independently finalized tuple explicitly exposes the canonical candidate identity. |

## Direct regressions checked

| Command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/skills exec jiti tests/provisional-semantic-sidecar.test.ts` | PASS — 11/11. |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-finalizer.test.ts` | PASS — 4/4. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-extraction-request.test.ts` | PASS — 5/5. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS — 8/8. |
| `git diff --check -- apps/agents-bridge/tests/semantic-relationship-interoperability-bridge.test.ts` | PASS. |

## Readiness

Internal readiness: `READY_FOR_CK`.

HMN authorization consumed: `HMN-SEM-CUTOVER-005-INTEROPERABILITY-006`.

Handoff: independent CK verification of original `CK-001.a` and direct
regressions strictly within the frozen focused-test boundary only. CFC does
not issue `PASS`.

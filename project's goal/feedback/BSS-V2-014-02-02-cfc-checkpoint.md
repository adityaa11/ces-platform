# CFC checkpoint — BSS-V2-014-02-02

- **Ticket / batch:** `BSS-V2-014-02-02` / `BSS-V2-014`
- **State:** `awaiting_review`
- **Remediation base:** `83eb42e2e3bb0f9fb5f3ea7cfe8d45e117551a39`
- **Frozen CK authority:** [BSS-V2-014-02-02-83eb42e review](BSS-V2-014-02-02-83eb42e-review.md)
- **Remediated finding:** `CK-001`, clauses `CK-001.a`–`CK-001.d`
- **HMN authorization consumed:** none; this is the first user-authorized CFC pass for the consolidated CK review.

## Bounded remediation

The successor fixture now proves the two bindings retain their exact published
authority versions and that the plan stores one canonical allocation vector
and fingerprint. It adds the frozen foreign-domain and capacity-profile
negative cases, observing zero candidate and activation rows after every
pre-publication rejection.

The replacement activation aggregate qualifies its source column. A small
forward migration applies the same repair to databases that have already
recorded migration `0091`; the original migration is also correct for a fresh
install. The existing durable-recovery fixture now sets up the pre-existing
qualified route-binding invariant before creating its historical reservation;
it does not weaken or alter that invariant. No parent cutover, runtime policy,
provider, consumer, or resolver behavior was changed.

## Frozen Finding Closure Matrix

| Clause | Status | Exact evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `packages/atlas-db/tests/weighted-capacity-publication.integration.test.ts:81-86` asserts one allocation row with canonical vector/fingerprint and both exact authority versions. | `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts` — PASS (1/1). | Two bindings retain their exact immutable authority versions and one persisted canonical allocation/fingerprint identity. |
| `CK-001.b` | `PROVEN` | `packages/atlas-db/tests/weighted-capacity-publication.integration.test.ts:36-41,73-78` checks the foreign-domain and different-capacity-profile rejections, with zero candidate/activation rows after each pre-publication rejection. | Focused Docker fixture above — PASS (1/1). | Mismatched capacity-profile and foreign-domain authority reject before candidate publication or activation. |
| `CK-001.c` | `PROVEN` | `apps/agents-bridge/tests/durable-wakeup-convergence.integration.test.ts:75-102,119-143` publishes qualified immutable route bindings and retains the original plan identity for waiting/reserved work through successor revisions. | `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts` — PASS (1/1). | Existing recovery fixture completes with prior reservation/claimed-work liabilities intact while the successor fixture stays inactive. |
| `CK-001.d` | `PROVEN` | `packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql:264-266` qualifies the aggregate; `packages/atlas-db/migrations/0096_bssv20140202_activation_revision_resolution.sql:1-22` forwards it for installed databases. | `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check` — PASS; `... @atlas/db exec jiti tests/authorized-desired-plan-convergence.integration.test.ts` — PASS (1/1); focused successor fixture — PASS (1/1). | Historical activation/recovery executes without ambiguity, while successor premature activation remains rejected. |

## Direct regressions checked

```text
docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck
PASS (exit 0)

git diff --check
PASS (exit 0; no whitespace errors)
```

Internal readiness: READY_FOR_CK

This is one bounded remediation checkpoint. It does not issue CK `PASS`; CK
must verify only the frozen clauses, this remediation diff, and direct
regressions introduced by it.

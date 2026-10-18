# GO checkpoint — BSS-V2-006-05-05

- **Ticket:** `BSS-V2-006-05-05` — Policy-revision operational recovery
- **Review batch:** `BSS-V2-BATCH-06-05-05`
- **State:** `awaiting_review`
- **Authorized checkpoint:** explicit `GO BSS-V2-006-05-05`
- **Authority:** the frozen ticket, its incorporated BSS-V2-006-05 split-map contract, and `RC-00605-05` / `RC-00605-06` only.
- **Dependency gate:** `BSS-V2-006-05-04` CK `PASS` is recorded by `project's goal/feedback/BSS-V2-BATCH-06-05-04-bb36b323-verification.md`. No awaiting-review predecessor was consumed.

## Bounded implementation

Migration `0084_bssv20060505_policy_revision_operational_recovery` adds the
missing policy-revalidation fence to the existing durable activation-wakeup
consumer. After it claims a wakeup and verifies the active plan identity, it
validates that plan's immutable BSS-005 policy binding through the existing
effective-dimension authority. A stale, revoked, malformed, or inconsistent
binding returns a bounded `policyBlocked` result and rebases no waiting work.
It does not publish or repair policy, create a queue, or change reservation,
claim, transport, feedback, or recovery ownership.

Reserved and claimed work is deliberately outside the wakeup update: it keeps
its original plan revision, reservation revision, and physical RPM/TPM/
concurrency ledger liability. The pre-existing route-scoped ambiguous-429
path remains the sole pressure mechanism; it has no RPD daily value, reset,
numeric clamp, or plan-publication side effect.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and exact validation | Status |
| --- | --- | --- | --- |
| `RC-00605-05` | At-least-once wakeup/restart, retry, cancellation, ack loss, and concurrent workers have exact deduplicated attempts/reservations/claims/transports; stale or removed policy blocks new sends while historical liabilities persist. | `packages/atlas-db/tests/policy-aware-runtime-admission-fairness.integration.test.ts` uses an authenticated three-dimension (RPM/TPM/concurrency) policy with RPD `unknown/not_enforced`, revokes the policy after activation of a replacement desired plan, and proves the claimed wakeup does not rebase waiting work, replay is inert, waiting/cancelled work cannot dispatch, and an existing claimed reservation retains its original plan/revision and exactly its three ledger rows. `apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts` directly regresses pg-boss restart-before-claim, duplicate replay, feedback/admission race, rollback, concurrent admission, crash/ack loss after claim, and fresh-reservation retry. `apps/agents-bridge/tests/provider-wakeup-worker.integration.test.ts` directly regresses durable wakeup replay across worker restart. | `PROVEN` |
| `RC-00605-06` | An ambiguous 429 with RPD non-enforced creates scoped conservative cooldown/probe/recovery without a fictitious daily quota, reset, or BSS-005 publication. | The masked-policy fixture claims the existing transport stub, ingests qualified rate-limited feedback, and observes one route-scoped incident with `dimension_id`/`numeric_remaining_units` both null, a temporary public pressure block, no RPD ledger row, no added desired plan, and only matching recovery clearing the incident. `packages/atlas-db/tests/plan-wakeup-convergence.integration.test.ts` confirms pressure never creates a convergence intent. | `PROVEN` |
| `RC-00605-10` (direct regression boundary) | No direct transport, second scheduler/queue, policy publication from feedback, or historical relabeling is introduced. | Diff is a forward migration, migration registry entry, bounded policy lifecycle fixture, ticket status, and checkpoint only. Existing Bridge worker and the established claimed-send/feedback/pressure lanes pass unchanged. | `PROVEN` |

## Validation evidence

```text
packages/atlas-db> node --env-file=../../.env ./scripts/migrate.mjs
PASS — applied 0084_bssv20060505_policy_revision_operational_recovery.

packages/atlas-db> node --env-file=../../.env ./scripts/migrate.mjs --check
PASS.

packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/policy-aware-runtime-admission-fairness.integration.test.ts
PASS — 1/1.

packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/plan-wakeup-convergence.integration.test.ts
PASS — 1/1.

apps/agents-bridge> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/provider-admitted-worker.integration.test.ts
PASS — 1/1.

apps/agents-bridge> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/provider-wakeup-worker.integration.test.ts
PASS — 1/1.

packages/atlas-db> corepack pnpm typecheck
PASS.

apps/agents-bridge> corepack pnpm typecheck
PASS.

git diff --check
PASS.
```

No authority or environment limitation remains. This is an implementation
readiness checkpoint, not a self-issued CK `PASS`.

Internal readiness: READY_FOR_CK

# GO checkpoint — BSS-V2-006-05-04

- **Ticket:** `BSS-V2-006-05-04` — Policy-aware runtime admission and fairness
- **Review batch:** `BSS-V2-BATCH-06-05-04`
- **State:** `awaiting_review`
- **Authority:** frozen ticket `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-05-04-policy-aware-runtime-admission-fairness.md`, its incorporated BSS-V2-006-05 split-map contract, and rows `RC-00605-03`, `RC-00605-04`, and the admission/domain-mask portion of `RC-00605-07`.
- **Dependency gate:** BSS-V2-006-05-02 CK `PASS` is recorded in `project's goal/feedback/BSS-V2-BATCH-06-05-02-a54af78-verification.md`; the terminal BSS-V2-006-04 checkpoint is independently CK-approved. No awaiting-review predecessor was consumed.

## Bounded implementation

Added forward-only migration `0083_bssv20060504_policy_aware_runtime_admission_fairness` and its focused PostgreSQL integration fixture. The migration consumes the immutable desired-plan policy binding at the runtime boundary. It derives an exact enforced dimension set, keeps compatible unbound historical profiles four-dimensional, and rejects stale, revoked, malformed, or inconsistent effective policy bindings.

The admitted-work selector, direct route-aware admission, physical reservation ledger, operational usage, pressure clamp, runtime constraint read, background capacity calculation, fit predicate, and dominant-resource fairness calculation now iterate the selected dimensions. An excluded RPD has no fabricated capacity, reset, window state, usage ledger row, fit term, pressure capacity entry, or fairness denominator. Request envelopes remain four-dimensional and the existing pg-boss claimed-send lane, transaction fence, fairness state, weighted background scheduling, borrowing, and hard interactive reserve remain the only execution path.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and exact validation | Status |
| --- | --- | --- | --- |
| `RC-00605-03` | DB-backed runtime public constraint/admission independently fits RPM, TPM, and concurrency for a qualified Anoman-like effective policy; omitted RPD never becomes numeric; missing/nonactive policy fails closed. | `packages/atlas-db/tests/policy-aware-runtime-admission-fairness.integration.test.ts` publishes an immutable RPM/TPM/concurrency policy with unknown/not-enforced RPD, invokes `RuntimeCapacityConstraint/v1`'s database boundary and `ProviderWorkAdmission/v1`, and asserts the exact three-dimensional public capacity/window view plus a three-row runtime ledger. The existing provenance fixture covers absent, stale, forged, revoked, zero, and unknown-enforced policies. | `PROVEN` |
| `RC-00605-04` | Shared-domain background/interactive contention retains borrowing, hard interactive reserve, exact concurrency seats, atomic reservation, fair dominant ordering, and zero send after any enforced-dimension saturation. | The new fixture admits background work through the public admission boundary, admits interactive work using the retained reserve, then proves a saturated background attempt creates zero dispatch. `packages/atlas-db/tests/fair-admission-atomic-dispatch.integration.test.ts` directly regresses weighted fair ordering, borrowing, interactive protection, each-dimension saturation, atomic rollback, exact jobs/reservations, and claimed-send uniqueness. | `PROVEN` |
| `RC-00605-07` (admission/domain-mask portion) | One quota domain cannot weaken a shared known ceiling with a conflicting mask; independent domains stay isolated; no special Anoman branch. | `packages/atlas-db/tests/authorized-enforcement-policy-provenance.integration.test.ts` rejects a conflicting route mask for the same domain/profile and separately derives policies for independent domains. The runtime migration reads only the plan-bound domain policy and has no provider-specific branch. | `PROVEN` |
| `RC-00605-10` (direct regression boundary) | Established four-known-dimension planning/admission remains compatible; no direct provider send, planner/policy write, second scheduler/queue, or consumer parsing is introduced. | `packages/atlas-db/tests/effective-plan-publication-convergence.integration.test.ts`, `apps/agents-bridge/tests/runtime-capacity-constraint.integration.test.ts`, and `apps/agents-bridge/tests/provider-work-admission.integration.test.ts` pass unchanged. The migration is a forward-only runtime read/admission evolution only. | `PROVEN` |

## Validation evidence

```text
node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/policy-aware-runtime-admission-fairness.integration.test.ts
PASS — 1/1.

node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/authorized-enforcement-policy-provenance.integration.test.ts
PASS — 1/1.

node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/effective-plan-publication-convergence.integration.test.ts
PASS — 1/1.

node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/fair-admission-atomic-dispatch.integration.test.ts
PASS — 1/1.

node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/runtime-capacity-constraint.integration.test.ts
PASS — 1/1.

node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/provider-work-admission.integration.test.ts
PASS — 1/1.

node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/migrate.mjs --check
PASS.

corepack pnpm --filter @atlas/db typecheck
PASS.

corepack pnpm --filter @atlas/agents-bridge typecheck
PASS.

git diff --check -- packages/atlas-db/scripts/migrate.mjs packages/atlas-db/migrations/0083_bssv20060504_policy_aware_runtime_admission_fairness.sql packages/atlas-db/tests/policy-aware-runtime-admission-fairness.integration.test.ts
PASS.
```

No authority or environment limitation remains. This is an implementation readiness checkpoint only; it is not a self-issued CK `PASS`.

Internal readiness: READY_FOR_CK

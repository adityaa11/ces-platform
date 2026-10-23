# CK verification — BSS-V2-014-03

- **Ticket:** `BSS-V2-014-03` — Authenticated calculated-capacity handoff
- **Batch:** `BSS-V2-014`
- **Review type:** post-HMN-authorized CFC committed-checkpoint verification
- **Consumed CFC checkpoint:** [BSS-V2-014-03 CFC checkpoint](BSS-V2-014-03-cfc-002-checkpoint.md)
- **Original CK authority:** [BSS-V2-014-03 first review](BSS-V2-014-03-1d0c67c-review.md)
- **Prior post-CFC verification:** [BSS-V2-014-03 post-CFC CK verification](BSS-V2-014-03-df4fbf5-verification.md)
- **Consumed HMN authorization:** [HMN-BSS-V2-014-03-001](BSS-V2-014-03-hmn-001.md)
- **Reviewed commit:** `17df17b9b560fb30636fafdecd78293b73f8a690` (`fix(bss-v2): repair calculated capacity evidence fixture`)
- **Remediation base:** `df4fbf5deed93b1f69bd073acbba6c26e65e948e`
- **Ticket state:** `awaiting_review`
- **Decision:** `PASS`

## Review preconditions

The named ticket, current CFC checkpoint, original frozen CK matrix, prior
post-CFC verification, HMN authorization, and reviewed commit resolve uniquely.
The reviewed commit is a descendant of the remediation base and contains the
CFC checkpoint. The worktree contains unrelated modified and untracked paths,
but none overlap the ticket implementation, the committed CFC checkpoint, or
the remediation diff; the committed target is unambiguous.

This verification is bounded to the HMN-authorized original finding `CK-001`,
clauses `CK-001.a` through `CK-001.d`, the remediation diff, evidence required
by those frozen oracles, and direct regressions introduced by that remediation.
The previously proven `RC-01403-05` boundary is carried forward and was not
reopened.

## Frozen finding closure matrix

| Clause | Status | Frozen closure oracle | Verification evidence |
| --- | --- | --- | --- |
| `CK-001.a` | `RESOLVED` | The qualified response must exactly equal the persisted immutable candidate, authority, allocation, workload/profile, effective-mask, structural-bound, and canonical-fingerprint tuple with zero effects. | `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts:75-139` now selects `candidate.desired_profile_version`, joins `bridge.desired_admission_profile`, compares all returned revisions, allocation/effective mask, structural/output bounds, estimator/safety identities, policy, canonical fingerprint, and counters. The Bridge focused harness passed `2/2`; the DB focused harness also passed `2/2`. |
| `CK-001.b` | `RESOLVED` | Every named process/class/route/model, stale-authority/plan, missing-allocation, missing-bound, and route/workload mismatch must return typed non-qualified data with no numeric fallback and zero effects. | `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts:141-180` asserts typed non-qualified results, no allocation or sizing fallback, and unchanged counters for foreign/process/class/route mismatch, each oversized bound, model mismatch, stale authority, missing allocation, missing structural bound, and route/workload mismatch. The Bridge focused harness passed `2/2`; the DB focused harness also passed `2/2`. |
| `CK-001.c` | `RESOLVED` | Approved unknown-RPD provenance remains qualified; missing, revoked, and mismatched approval fail closed without numeric fallback. | `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts:73-74,181-188` proves approved unknown-RPD provenance without numeric RPD and exercises missing, mismatched, and revoked approvals through the existing transactional fixture. The Bridge focused harness passed `2/2`; the DB focused harness also passed `2/2`. |
| `CK-001.d` | `RESOLVED` | Complete demand must satisfy the frozen byte/input/context/output, reservation, estimator, baseline, and no-per-slot-ceiling oracle with typed unfit results. | `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts:126-168` compares the complete sizing tuple and pinned identities, tests each named oversized bound as typed `unfit`, and asserts the complete-request limit exceeds the TPM/concurrency quotient. The Bridge focused harness passed `2/2`; the DB focused harness also passed `2/2`. |

All four clauses are resolved against the pre-existing frozen closure oracles.
No new oracle, acceptance condition, finding, or required harness was added.

## Validation and direct-regression checks

Executed against the `atlas-canonical-perception` Docker Compose project:

```text
docker compose -p atlas-canonical-perception build atlas
PASS

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check
PASS — Atlas database migration check passed

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
PASS — 2/2

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
PASS — 2/2

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck
PASS — tsc -p tsconfig.json

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts
PASS — 1/1 historical v1 reader regression

git diff --check df4fbf5deed93b1f69bd073acbba6c26e65e948e HEAD
PASS — no whitespace errors
```

The remediation diff is limited to the focused evidence fixture and this CFC
checkpoint. It changes the fixture connection to the privileged transactional
test connection, corrects the persisted-profile join, and preserves the
production reader, schema, migrations, activation gate, and single-reader
boundary. No direct in-scope regression was identified.

## Scope-change observations

None. The bounded evidence repair satisfies the original frozen ticket
obligations. No ticket amendment, provider/runtime/deployment target,
architecture or policy decision, or predecessor reopening is required.

## Decision

`PASS`: `CK-001.a` through `CK-001.d` are all resolved against their frozen
closure oracles, the HMN-authorized remediation is committed and bounded, all
required validation passes, and no direct remediation regression remains.
This verification does not authorize production activation, IDSER
implementation, consumer cutover, or any later remediation cycle.

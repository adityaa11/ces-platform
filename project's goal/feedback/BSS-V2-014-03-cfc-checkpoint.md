# CFC checkpoint — BSS-V2-014-03

- **Ticket / batch:** `BSS-V2-014-03` / `BSS-V2-014`
- **State:** `awaiting_review`
- **Remediation base:** `1d0c67c8663b343aa4712d75166333a37563d284`
- **Frozen CK authority:** [BSS-V2-014-03-1d0c67c review](BSS-V2-014-03-1d0c67c-review.md)
- **Remediated finding:** `CK-001`, clauses `CK-001.a`–`CK-001.d`
- **HMN authorization consumed:** none; this is the first user-authorized CFC pass for the consolidated CK review.

## Bounded remediation

The existing isolated Bridge/PostgreSQL HTTP fixture now compares the qualified
v2 response to its persisted immutable candidate tuple: authority, all
revisions, calculated allocation and effective mask, structural/output bounds,
estimator and safety identities, effective policy, and the canonical
fingerprint composition. It retains the zero-side-effect counters.

The fixture also proves every frozen fail-closed case: foreign/process/class/
route/model mismatch, stale authority, missing allocation, missing structural
bound, route-to-workload mismatch, missing/revoked/mismatched Anoman approval,
and every named complete-request bound. Every negative result is a typed v2
non-qualified result with neither allocation nor sizing fallback and no
operational effects. The complete-request assertions retain persisted RPM/TPM
baselines and prove the maximum eligible request is not a TPM-per-concurrency
ceiling. No production activation, IDSER consumer, provider operation, adapter,
new endpoint, or second reader was introduced.

## Frozen Finding Closure Matrix

| Clause | Status | Exact evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts:71-133` compares persisted candidate revisions, calculated allocation/mask, full structural/output bounds, estimator/safety identities, effective policy, and canonical fingerprint; the counter assertion is at `:133`. | `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts` — PASS (2/2). | Qualified response exactly equals the persisted immutable candidate/authority/allocation/effective-policy tuple, with zero effects. |
| `CK-001.b` | `PROVEN` | Same fixture `:135-176`: `assertNonQualified` denies allocation/sizing and checks counters; its principal and savepoint cases cover foreign/process/class/route/model mismatch, stale authority, missing allocation, absent structural bound, and route-to-workload mismatch. | Focused Bridge/PostgreSQL HTTP command above — PASS (2/2). | Each named negative is typed non-qualified with no numeric fallback and zero effects. |
| `CK-001.c` | `PROVEN` | Same fixture `:69-70` retains approved unknown-RPD/no-numeric-RPD evidence; `:175-176,181-182` mutate missing, mismatched, and revoked approvals through the read-only seam. | Focused Bridge/PostgreSQL HTTP command above — PASS (2/2). | Approved unknown-RPD provenance remains qualified; missing, revoked, and mismatched approval fail closed without numeric fallback. |
| `CK-001.d` | `PROVEN` | Same fixture `:120-130` asserts byte/input/context/output, output reservation, estimator/safety identities, and `:150-162` covers per-bound typed `unfit`, persisted RPM/TPM baseline, and no per-slot-ceiling inequality. | Focused Bridge/PostgreSQL HTTP command above — PASS (2/2). | Complete demand is bounded by the frozen request/structural/allocation identity, with typed unfit results and no TPM-per-concurrency ceiling. |

## Direct regressions checked

```text
docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check
PASS — Atlas database migration check passed

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
PASS — 2/2

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
PASS — 2/2

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck
PASS — exit 0

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts
PASS — 1/1

git diff --check
PASS — no whitespace errors
```

Internal readiness: READY_FOR_CK

This is one bounded remediation checkpoint. It does not issue CK `PASS`; CK
must verify only the frozen clauses, this remediation diff, and direct
regressions introduced by it.

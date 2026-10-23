# CFC checkpoint — BSS-V2-014-03 (evidence remediation)

- **Ticket / batch:** `BSS-V2-014-03` / `BSS-V2-014`
- **State:** `awaiting_review`
- **Remediation base:** `df4fbf5deed93b1f69bd073acbba6c26e65e948e`
- **Frozen CK authority:** [BSS-V2-014-03 post-CFC CK verification](BSS-V2-014-03-df4fbf5-verification.md)
- **Original frozen matrix:** [BSS-V2-014-03 first CK review](BSS-V2-014-03-1d0c67c-review.md)
- **Remediated finding:** `CK-001`, clauses `CK-001.a`–`CK-001.d` only
- **HMN authorization consumed:** `HMN-BSS-V2-014-03-001` ([authorization record](BSS-V2-014-03-hmn-001.md))

## Bounded remediation

The focused isolated PostgreSQL/HTTP evidence fixture selected stale columns
from `bridge.desired_admission_profile_candidate`, so it aborted before every
frozen closure oracle ran. The fixture now reads `desired_profile_version` from
the candidate and joins `bridge.desired_admission_profile` for the capacity
profile version. Its deliberate malformed-state probes remain transactional;
they run through the privileged test connection with trigger replication
disabled locally because the production records are append-only. The actual
production reader, SQL projection, schema, migrations, activation gate, and
single-reader boundary are unchanged.

## Frozen Finding Closure Matrix

| Clause | Status | Exact evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts:75-139` joins the persisted candidate and desired profile, then compares all returned revisions, allocation/effective mask, structural/output bounds, estimator/safety identities, policy, canonical fingerprint, and zero-effect counters. | `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts` — PASS (2/2). | Qualified response exactly equals the persisted immutable candidate/authority/allocation/effective-policy tuple, with zero effects. |
| `CK-001.b` | `PROVEN` | Same fixture `:141-180` asserts no allocation/sizing fallback and zero effects for foreign/process/class/route/model mismatch, stale authority, missing allocation, missing structural bound, and route/workload mismatch. | Focused Bridge/PostgreSQL HTTP command above — PASS (2/2). | Each named negative is typed non-qualified with no numeric fallback and zero effects. |
| `CK-001.c` | `PROVEN` | Same fixture `:73-74,181-188` proves approved unknown-RPD provenance without numeric RPD and checks missing, mismatched, and revoked approvals fail closed. | Focused Bridge/PostgreSQL HTTP command above — PASS (2/2). | Approved unknown-RPD provenance remains qualified; missing, revoked, and mismatched approval fail closed without numeric fallback. |
| `CK-001.d` | `PROVEN` | Same fixture `:126-136,156-168` compares byte/input/context/output, reservation and estimator/safety identity, tests each oversized bound as typed `unfit`, and proves no per-slot ceiling. | Focused Bridge/PostgreSQL HTTP command above — PASS (2/2). | Complete demand is bounded by the frozen request/structural/allocation identity, with typed unfit results and no TPM-per-concurrency ceiling. |

## Direct regressions checked

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

git diff --check
PASS — no whitespace errors
```

Internal readiness: READY_FOR_CK

This is the one HMN-authorized evidence-remediation checkpoint. It does not
issue CK `PASS`; the ticket remains `awaiting_review` for fresh CK verification
of only `CK-001.a`–`CK-001.d` and any direct regression caused by this diff.

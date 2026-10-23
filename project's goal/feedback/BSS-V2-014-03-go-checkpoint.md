# GO checkpoint — BSS-V2-014-03

- **Ticket:** [BSS-V2-014-03 — Authenticated calculated-capacity handoff](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-03-authenticated-calculated-capacity-snapshot.md)
- **Batch:** `BSS-V2-014`
- **Authorized action:** explicit `GO BSS-V2-014-03` in this task on 2026-10-23.
- **Predecessors:** `BSS-V2-014-02-02` CK `PASS` at `7d7612b55cf49ba071ea3eb89d86f8aaff3992ce`; `BSS-V2-014-05` contract freeze 001; approved BSS-V2-005-05-02 authenticated-read boundary.
- **State:** `awaiting_review`.
- **Reviewed target:** this checkpoint's containing implementation commit. This checkpoint does not issue CK `PASS`.

## Bounded implementation

The existing `/v1/capacity-planning-snapshot` endpoint and authenticated reader
now support a server-bound `qualificationVersion: "v2"` principal. The client
cannot select it. That principal calls the same Bridge-owned read seam to
qualify the latest immutable shared-domain candidate without activating it;
existing v1 principals retain the historical reader until the parent-owned
cutover. The projection joins the immutable route/model authority, candidate
input, versioned workload profile, calculated allocation, and effective policy.
It returns typed non-qualified outcomes for incomplete, stale, revoked,
foreign, mismatched, or oversized input and performs no operational write.

The v2 response includes server-bound identity, authority and profile revisions,
effective allocation mask/baseline/weight/cap, complete-request byte/input/
context/output limits, estimator and safety identities, runtime-only borrowing
metadata, effective-policy provenance, and a canonical fingerprint. Anoman's
approved unknown/not-enforced RPD remains provenance and has no numeric
allocation. No endpoint, direct-table grant, active-reader switch, v1-to-v2
adapter, dual read/write, IDSER code, admission code, or provider operation was
added.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-01403-01` | Frozen ticket Binary Review Contract row 01 | Qualified v2 exactly joins the immutable candidate's route/model authority, workload/profile, calculated allocation, mask, structural bounds, and fingerprint with zero operational effects. | `packages/atlas-db/migrations/0097_bssv201403_authenticated_calculated_capacity_snapshot.sql`; `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts` qualified HTTP fixture and non-inert counters. | `PROVEN` |
| `RC-01403-02` | Frozen ticket Binary Review Contract row 02 | Foreign/mismatched principal or route and revoked/missing authority return typed non-qualified data without a numeric fallback. | Same fixture checks foreign and route-mismatch principals, then revokes the effective policy and observes `stale`; counters remain unchanged. | `PROVEN` |
| `RC-01403-03` | Frozen ticket Binary Review Contract row 03 | Anoman returns only `rpm`, `tpm`, `concurrency` allocation plus approved unknown-RPD provenance; revocation fails closed. | Same fixture asserts the exact approved unknown-RPD provenance and absence of an allocation `rpd`, then proves policy-revocation rejection. | `PROVEN` |
| `RC-01403-04` | Frozen ticket Binary Review Contract row 04 | Complete request honors request bytes, input/context/output, process baseline, and pinned estimator/safety identity; oversized demand is typed `unfit`. | Same fixture validates qualified request sizing and `complete_request_exceeds_qualified_bound`; the SQL projection rejects missing structural identities/bounds. | `PROVEN` |
| `RC-01403-05` | Frozen ticket Binary Review Contract row 05 | The one reader qualifies v2 only in isolation and rejects premature activation; no duplicate reader, adapter, or IDSER implementation appears. | Same fixture proves `qualification.productionActive=false`, parent-gate activation rejection, zero active plan rows, and static single-endpoint/source-boundary assertions. | `PROVEN` |

## Validation evidence

All database-backed commands ran through the `atlas-canonical-perception`
Docker Compose project against its PostgreSQL service:

```text
docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check
# PASS — Atlas database migration check passed

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
# PASS — 2/2

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
# PASS — 2/2

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck
# PASS — tsc -p tsconfig.json

docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts
# PASS — 1/1 (direct regression of the historical v1 reader)
```

## Scope and limitations

V2 is qualified only for an explicit server-owned principal and candidate;
production activation remains rejected until the BSS-V2-014 parent gate has the
later `-04` readiness and `-05` consumer replacement evidence. This checkpoint
does not activate v2, modify runtime admission, implement IDSER, or issue a CK
result.

Internal readiness: READY_FOR_CK

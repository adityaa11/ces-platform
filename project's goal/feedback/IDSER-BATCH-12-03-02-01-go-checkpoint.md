# GO checkpoint: IDSER-012-03-02-01 / IDSER-BATCH-12-03-02-01

- **Ticket:** `IDSER-012-03-02-01` — Authorized BSS prospective snapshot reader.
- **Batch:** `IDSER-BATCH-12-03-02-01`.
- **State:** `awaiting_review`.
- **Implementation commit:** `c80a819c` (`feat(idser): consume prospective BSS capacity snapshot`).
- **Dependency consumed:** `IDSER-012-03-01-03` CK `PASS` at `719b9d121340a5388805d284d6263c2a549a6790`; its approved `-01-01/02` predecessors remain preserved.

## Bounded implementation

`apps/agents-bridge/src/idser-prospective-capacity-snapshot.ts` adds the
server-composed IDSER consumer of the existing
`createCapacityPlanningSnapshotReader`. The only credential accepted by that
composition is supplied by trusted server construction; the consumer cannot
choose BSS domain, route, profile, policy, or principal. Every read passes
`prospective: true` and calls the existing Bridge-owned
`bridge.read_capacity_planning_snapshot` projection through the authenticated
reader.

The adapter accepts only `CapacityPlanningSnapshot/v1` with
`status='inactive'`, `reason='prospective_planning_only'`,
`view='prospective-planning-only'`, `readIsNotAdmissionPermit=true`, and
`plan=null`. It preserves the source, enforcement, background process,
workload structural bound, safety/output reservation, estimator, policy and
provenance revisions in a deep-frozen read result. It carries the exact BSS
`RequestResourceEnvelope` demand shape
`{requestUnits,tokenUnits,dayUnits,concurrencyUnits}` separately from the BSS
enforcement dimensions. In particular, positive `dayUnits` remains demand
when RPD is unknown but BSS-authorized `not_enforced`; no RPD limit is
invented.

The change adds neither direct BSS SQL nor an IDSER planner, profile/policy
publication, runtime capacity read, reservation, BSS plan write, durable Atlas
plan, GHR event, provider/SEM call, or reconciliation effect.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-012030201-01` | Frozen row 01: the intended consumer makes an authenticated prospective BSS read and accepts only the exact inactive planning-only projection with all structural/policy/estimator identities. | `idser-prospective-capacity-snapshot.ts` server credential composition and strict validator; `capacity-planning-snapshot.integration.test.ts` composes it with the real `createCapacityPlanningSnapshotReader` and `bridge.read_capacity_planning_snapshot`, observing the BSS source, enforcement, process, workload, structural-bound and estimator versions. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts` — PASS (1 test; real PostgreSQL). | `PROVEN` |
| `RC-012030201-02` | Frozen row 02: foreign, stale, unknown, alternate inactive, unfit, unsupported, known-zero and missing-provenance states fail closed; no valid read becomes active/admitted. | `idser-prospective-capacity-snapshot.test.ts` rejects qualified/alternate inactive/unknown/stale/unfit/foreign/missing-version/unsupported-dimension/known-zero/unauthorized-RPD mutations. The real integration also observes BSS `unfit`, unauthorized/foreign and stale-policy rejections. Accepted output fixes `status: inactive` and `plan: null`. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-prospective-capacity-snapshot.test.ts` — PASS (2 tests); real integration command above — PASS. | `PROVEN` |
| `RC-012030201-03` | Frozen row 03: preserve the exact BSS four-field envelope and dimension semantics, including positive `dayUnits` when RPD is authorized unknown/not-enforced, without fabricating provider capacity. | The adapter reuses `parseRequestResourceEnvelope`; focused test proves the exact four fields and no RPD limit; real integration supplies the BSS-authorized unknown/not-enforced RPD snapshot with positive `dayUnits`. | Focused command above — PASS; real integration command above — PASS. | `PROVEN` |
| `RC-012030201-04` | Frozen row 04: reads cause zero BSS plan/profile writes, attempts, reservations, jobs, sends, GHR effects, Atlas plan writes, SEM calls, or reconciliation effects. | Real integration records before/after durable counters for BSS capacity/enforcement/process/workload/profile-plan tables; BSS attempt/reservation/dispatch/send/quota rows; `pgboss.job`; semantic delivery/execution/result; and reconciliation result. Counters are unchanged for accepted and rejected reads. The adapter has no persistence, queue, provider, or execution dependency. | Real integration command above — PASS. | `PROVEN` |

## Validation

```text
corepack pnpm --filter @atlas/db migration:check
  PASS — Atlas database migration check passed
corepack pnpm --filter @atlas/agents-bridge typecheck
  PASS
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-prospective-capacity-snapshot.test.ts
  PASS — 2 tests, 0 failures
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts
  PASS — 1 test, 0 failures, real PostgreSQL
git diff --check -- <authorized paths>
  PASS
```

Internal readiness: READY_FOR_CK. This checkpoint is implementation readiness
only, not a self-issued CK `PASS`; control returns to CK for review of the
frozen ticket.

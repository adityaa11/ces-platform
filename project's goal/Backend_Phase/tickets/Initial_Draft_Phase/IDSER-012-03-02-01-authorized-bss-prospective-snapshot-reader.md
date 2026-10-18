# IDSER-012-03-02-01 — Authorized BSS prospective snapshot reader

- **State:** `planned`; GO requires IDSER-012-03-01-03 CK `PASS`.
- **Batch:** `IDSER-BATCH-12-03-02-01`.
- **Parent:** [IDSER-012-03-02 split map](IDSER-012-03-02-bss-effective-capacity-corpus-partition.md).
- **Dependencies:** `-03-01-03` CK `PASS` (with approved `-03-01-01/02` retained); callable authenticated BSS `createCapacityPlanningSnapshotReader` / `bridge.read_capacity_planning_snapshot` and server-authorized prospective semantic workload identity.

## Outcome

Qualify the IDSER consumer binding to the existing BSS `CapacityPlanningSnapshot/v1` planning read. It returns a validated immutable structural-policy snapshot and no corpus partition. **STOP before source estimation, BSS policy creation, BSS-006 runtime reads, reservations, durable plan writes, or execution.**

## Authorized scope

Call the existing reader using the BSS server-authorized principal and `prospective:true`. Accept only the exact usable inactive case: `status='inactive'`, `reason='prospective_planning_only'`, `view='prospective-planning-only'`, `readIsNotAdmissionPermit=true`, and `plan=null`, with qualified source, enforcement, process and workload data. Preserve profile/policy/route/source/estimator revisions, structural bound, safety/headroom, eligible dimensions, and exact `RequestResourceEnvelope` shape `{requestUnits,tokenUnits,dayUnits,concurrencyUnits}`.

Reject every other inactive reason plus unknown, stale, unfit, foreign, missing-version, unsupported required-dimension, known-zero, or unauthorized state. `dayUnits` remains request demand; it is never converted into an unknown provider RPD limit. Do not query BSS tables, install an IDSER planner, create profile metadata, infer quota availability, or use the read as a send permit.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| RC-012030201-01 | The intended consumer makes a real authenticated read and accepts only the exact BSS prospective-planning-only snapshot with all pinned structural/policy/estimator identities. |
| RC-012030201-02 | Foreign, stale, unknown, alternate inactive, unfit, unsupported, known-zero and missing-provenance responses fail closed; a valid read is not promoted to active/admitted. |
| RC-012030201-03 | Exact BSS envelope/dimension semantics, including positive `dayUnits` under authorized not-enforced RPD, are preserved without invented provider capacity. |
| RC-012030201-04 | Read tests create zero BSS plan/profile writes, attempts, reservations, jobs, sends, GHR effects, Atlas plan writes, SEM calls, or reconciliation effects. |

## Security Readiness

- `SR-012030201-T1`: server-authorized IDSER principal → BSS planning-only projection.
- `SR-012030201-C1`: no direct BSS SQL, read-as-permit, runtime quota inference, consumer-selected route, or policy/profile publication.
- `SR-012030201-R1`: CK proves the real consumer composition and exact negative status matrix with durable zero side-effect counters.

## Evidence and hard stop

Record the BSS principal path, snapshot revision identities, non-inert source/enforcement/workload evidence and all rejection dispositions. If the intended consumer cannot call this production boundary, STOP `BSS_CAPACITY_CONSUMER_READ_GAP` or `CAPACITY_PROFILE_BOOTSTRAP_GAP` to BSS. A fixture-only substitute is not completion.

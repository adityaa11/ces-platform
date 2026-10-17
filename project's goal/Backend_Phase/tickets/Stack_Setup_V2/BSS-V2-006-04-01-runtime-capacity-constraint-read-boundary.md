# BSS-V2-006-04-01 — Runtime capacity-constraint read boundary

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-04-01`
- **Parent:** [BSS-V2-006-04 split map](BSS-V2-006-04-integrated-provider-admission-runtime-checkpoint.md)
- **Dependencies:** family dependencies in the parent; no 006-04 child predecessor.

## Outcome

Expose authenticated, versioned `RuntimeCapacityConstraint/v1` from the existing 03A runtime without reserving, dispatching, mutating quota state, or granting a send permit.

## Authorized scope

Resolve server-authorized process/workload/route/quota-domain identity and return active-plan activation and effective-constraint revisions, structural versus transient status, safe window/cooldown/clamp state, interactive/background eligibility, and a typed conservative reason: `eligible_in_principle`, `temporarily_pressure_blocked`, `structurally_unfit`, `unknown_policy_blocked`, or `inactive_or_unauthorized`. Unknown, stale, unavailable, foreign, or wrong-domain state fails closed. It must not manufacture an available-token figure, copy BSS-005 planner logic, expose raw counters/secrets, or create an attempt.

`CapacityPlanningSnapshot/v1` remains a separate BSS-005 structural-policy read. This ticket projects current runtime state only and must explicitly distinguish policy revision from transient pressure.

## Review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00604-11` | A genuine authenticated external planning fixture reads BSS-005 policy identity and BSS-006 effective constraint versions/eligibility without changing counters, creating an attempt/reservation/pg-boss job, or sending transport. Stale, foreign, unknown, cooldown and unavailable snapshots answer conservatively; a read cannot authorize sending. |

## Required evidence

Use isolated PostgreSQL/pg-boss plus real Bridge read entrypoint; assert non-inert baseline state and exact zero deltas for attempts, reservations, jobs, claims, sends and quota mutation. Exercise qualified background and interactive registered identities plus forged class/domain and unknown-window negatives. No consumer adapter, provider call, semantic/reconciliation logic, or BSS-005 publication is authorized.

## Security Readiness

`SR-0401-T1`: authenticated caller identity to bounded operational projection. `SR-0401-C1`: prohibit read-as-permit and direct Bridge-table access. `SR-0401-R1`: CK verifies version fencing, conservative failure and zero mutation using durable counters.

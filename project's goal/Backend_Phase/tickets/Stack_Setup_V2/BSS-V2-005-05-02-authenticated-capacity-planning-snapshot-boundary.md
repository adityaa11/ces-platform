# BSS-V2-005-05-02 — Authenticated capacity-planning snapshot boundary

- **State:** `planned`; prospective executable child, not GO/CFC authority or CK PASS.
- **Review batch:** `BSS-V2-BATCH-05-05-02`.
- **Parent and frozen family authority:** [BSS-V2-005-05 split map](BSS-V2-005-05-process-agnostic-registry-and-plan-convergence.md).
- **Dependencies:** BSS-V2-005-05-01 CK `PASS`; BSS-V2-005-04 CK `PASS`; exact server-authorized consumer identities. It does not depend on BSS-V2-006-03A or BSS-V2-006-04.

## Outcome

Expose `CapacityPlanningSnapshot/v1`: one authenticated, versioned, process-neutral, read-only entrypoint that projects the active desired-plan identity and the bound qualified planning policy. It must return coherent process/workload/route/quota-domain, service-class, resource/window, structural/estimator/output/media, accounting/safety/protection, policy and activation versions plus typed `qualified`, `inactive`, `unknown`, `unfit`, or `stale` status. A read is planning information only, never runtime admission permission.

## Frozen review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-00505-10` | An **external authenticated read-only fixture** for two unrelated qualified process kinds uses the **same versioned** `CapacityPlanningSnapshot/v1` entrypoint and receives coherent process/workload/route/quota-domain/plan+activation identity, resource/window, structural/estimator/output/media, accounting/safety/protection versions and typed status; no second planner or direct Bridge-table rights. Non-inert counters prove **zero work attempts, quota mutation, reservations, provider jobs and transports** for both consumers. |
| `RC-00505-11` | Forged foreign process/quota/route scope or interactive class, inactive/unqualified dispatch, missing/stale plan, unknown/zero required quota and outdated estimator fail closed. An **explicitly authorized prospective/inactive planning-only view** may size a synthetic request without being confused with active eligibility; it cannot activate a route, register work, reserve, dispatch or grant a reusable admission permit. |

## Boundary and evidence

Use two independent authenticated fake consumers against isolated Bridge PostgreSQL/pg-boss. Assert response coherence and typed negatives, including foreign scope, forged class, stale/missing plan, unknown/zero dimension, outdated estimator, inactive dispatch, and prospective-only sizing. Prove non-inert zero counters for attempts, quota mutation, reservations, provider jobs, and transports; no consumer may receive direct Bridge table rights.

This child consumes the registry and immutable active-plan read seam; it neither republishes a plan nor implements runtime effective constraints, work registration, reservation, dispatch, feedback, consumer business logic, or a second planner. The family map's consumer-facing hard stop and STOP constraints are incorporated by reference. GO/CK/CFC/HMN are bounded to these two rows.

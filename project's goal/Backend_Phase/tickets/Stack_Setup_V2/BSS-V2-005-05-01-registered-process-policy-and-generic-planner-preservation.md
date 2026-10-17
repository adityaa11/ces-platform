# BSS-V2-005-05-01 — Registered process policy and generic planner preservation

- **State:** `awaiting_review`; GO implementation is complete and awaits independent CK review. This is not a CK `PASS`.
- **Review batch:** `BSS-V2-BATCH-05-05-01`.
- **GO checkpoint:** [BSS-V2-BATCH-05-05-01-go.md](../../../feedback/BSS-V2-BATCH-05-05-01-go.md).
- **Parent and frozen family authority:** [BSS-V2-005-05 split map](BSS-V2-005-05-process-agnostic-registry-and-plan-convergence.md).
- **Dependencies:** BSS-V2-005-01..04 CK `PASS`; exact server-authorized process/workload definitions. It does not depend on BSS-V2-006-03A or BSS-V2-006-04.

## Outcome

Replace the finite TypeScript `ProcessKind` assumption with a versioned, server-controlled registered process policy that binds only already-authorized capability, qualified route/quota domain, service class, fairness scope, workload/estimator/output/structural versions, and configured protection/weights/caps. Keep `planDesiredAdmissionProfile` generic and deterministic: no process-name branch, provider activation, credential grant, transient queue/usage/cooldown input, or runtime admission authority is added.

## Frozen review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-00505-01` | Add an invented but valid synthetic process kind through versioned server-side registration **without editing the generic capacity/allocation algorithm**; invalid/foreign/unqualified registry identity or capability fails closed. |
| `RC-00505-02` | Distinct process kinds share one quota domain and a different domain remains isolated. Active/inactive and workload/route/version updates recompute the same generic policy deterministically. |
| `RC-00505-04` | Planner preserves independent quota dimensions, versioned estimator/output/media/structural constraints, explicit weights/caps/headroom and hard interactive protection. Unknown/zero required capacity fails closed. |
| `RC-00505-06` | Transient queue depth/usage/cooldown causes no immutable plan churn: runtime BSS-V2-006 alone changes next-admitted work. Source/secret bytes absent from registry, plan and wakeup metadata. |
| `RC-00505-09` | Register an interactive `chat` consumer and background semantic consumer using generic server-authorized process/workload profiles; the **existing** planner emits identical hard reserve/background subtraction under registry extension, rejects background→interactive privilege forgery and requires no chatbot-specific allocation branch. |

## Boundary and evidence

Use synthetic versioned registry/capacity/workload fixtures to prove generic planning, shared-domain and isolated-domain behavior, active/inactive transitions, interactive-reserve preservation, every independent resource dimension, and fail-closed foreign/unknown/zero cases. Demonstrate that no generic planner file changes when adding the synthetic kind. No publication activation, snapshot endpoint, reservation, pg-boss work, provider transport, consumer truth, or provider-limit discovery belongs here.

The family map's process-neutral, interactive/background, and STOP constraints are incorporated by reference. A GO checkpoint must close every listed row with deterministic fixture/test locators and exact commands before `READY_FOR_CK`; CK/CFC/HMN may review or remediate only these five rows.

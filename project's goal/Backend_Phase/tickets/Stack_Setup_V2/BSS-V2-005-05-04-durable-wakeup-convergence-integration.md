# BSS-V2-005-05-04 — Durable wakeup convergence integration

- **State:** `approved` following CK `PASS` for reviewed commit `e76e43f`; **Review batch:** `BSS-V2-BATCH-05-05-04`.
- **GO checkpoint:** [BSS-V2-BATCH-05-05-04-go](../../../feedback/BSS-V2-BATCH-05-05-04-go.md).
- **Parent and frozen family authority:** [BSS-V2-005-05 split map](BSS-V2-005-05-process-agnostic-registry-and-plan-convergence.md).
- **Dependencies:** BSS-V2-005-05-01, `-02`, and `-03` CK `PASS`; BSS-V2-006-03A-01..06 CK `PASS`; BSS-V2-005-01..04 CK `PASS`. BSS-V2-006-04 remains a downstream consumer and is not a dependency.

## Outcome

Prove the narrow end-to-end boundary: a qualified process/policy revision and a separately authorized BSS-V2-005-01 capacity-profile revision both use the already-qualified generic planner and BSS-V2-005-04 activation seam, then cause exactly one effective real BSS-V2-006-03A durable wakeup. This child integrates existing seams only; it does not redesign the registry, snapshot, planner, publisher, worker, fairness engine, or runtime admission service.

## Frozen review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-00505-03` | An authorized, qualified **effective** process/workload/policy change publishes and atomically activates one new immutable desired plan through the 005-04 per-domain revision fence; repeated identical inputs yield **no new publication, activation revision or wakeup**. Concurrent stale changes fail/reconcile without lost updates; a registration alone is not activation authority. |
| `RC-00505-05` | One approved 005-04 activation emits **exactly one effective** 03A `active_desired_admission_profile_wakeup` / pg-boss delivery, consumed via the **actual existing** `provider-wakeup-worker.ts` and `bridge.consume_active_plan_wakeup`. Waiting work is revalidated, fairness converges, stale/replayed wakeups have no second effect, and in-flight identity/window liabilities stay on their old plan; no alternate consumer, provider send or semantic/Atlas truth mutation. |
| `RC-00505-07` | A **separately authorized, provenance-bound BSS-V2-005-01 capacity-profile version** (including a qualified lower limit) triggers deterministic desired-plan recomputation/005-04 activation and the existing 03A wakeup. A 03A `capacity_revision_request` or `owner_replan_required` intent is **not** evidence or authorization for a new provider limit; unattributable 429, transient pressure/cooldown and stale/high observations cannot mint or raise a numeric BSS-V2-005 policy. |
| `RC-00505-12` | Final CK proves **both** qualified process/policy and independently authorized provider-capacity revisions → existing deterministic planner → 005-04 immutable publication/atomic activation → **real 03A durable deduplicated worker consumption** and correct waiting/in-flight/fairness state. The frozen registry/snapshot/revision/negative-evidence handoff above is independently reusable by 006-04 **without adding a second planner/runtime**; no cyclic 006-01/02 dependency and no claim that 006-04 runtime consumer interfaces or production admission have passed. |

## Boundary and evidence

Use the actual BSS-V2-006-03A migration/pg-boss delivery, `provider-wakeup-worker.ts`, and `bridge.consume_active_plan_wakeup`, with isolated PostgreSQL and non-inert state/counters. Prove one effective delivery and waiting-work revalidation/fairness convergence for both permitted revision origins; replay/stale/identical input must create no second effective wakeup. Prove that an in-flight reservation retains its historical plan identity and physical-window liability. Record no provider send, semantic/Atlas truth mutation, alternate consumer, or new runtime path.

This final child consumes sibling CK-approved behavior rather than repeating their broad review. It terminally verifies the complete original `RC-00505-03` and `07` oracles whose scoped publication/input portions were established by `-05-03`; it does not redesign those mechanisms. It does not implement 006-04 consumer interfaces, authenticated runtime eligibility, work registration, reservation, provider execution, feedback, or any consumer-specific workload. Its CK `PASS` is the family completion consumed by BSS-V2-006-04. GO/CK/CFC/HMN are bounded to these four integration rows.

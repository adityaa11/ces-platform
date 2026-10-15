# BSS-V2-005-05 — Process-agnostic registry and automatic desired-plan convergence

- **State:** `planned`; new prospective executable child, **not** GO, CFC authority or CK PASS.
- **Parent:** [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md)
- **Dependencies:** BSS-V2-005-01..04 independent CK PASS; BSS-V2-006 plan-change/wakeup contracts for integrated activation proof; exact server-authorized process/workload definitions. Existing approved BSS-V2-005-01..04 contracts and review outcomes are preserved.
- **Motivation:** [October 16 process-neutral/planner handoff decision](../../../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md)

## Outcome

Make the **existing** capacity catalogue, `deriveDesiredAdmissionProfile`, and immutable plan-publication seam extensible to any **server-registered process kind**, rather than a fixed TypeScript enum requiring edits to the capacity algorithm for new process types. The registry selects capability, qualified route/quota domain, service class, fairness scope, versioned workload/request estimator/output reservation, configured protection/weights/caps, eligibility and activation policy. Admission resources are still independently measured as RPM/TPM/RPD/concurrency. The registry must not grant capabilities, credentials, source access, model-quality acceptance or provider quotas on the basis of an arbitrary name.

Process/workload configuration changes affecting an eligible quota domain cause **durable deduplicated recalculation, validation and immutable publication/activation of a new `DesiredAdmissionProfile` version**, followed by BSS-V2-006 plan-change notification. Do not update prior versions or overwrite in-flight reservation references. Unknown/unqualified process, inactive workload, route, quota source or estimator **fails closed**; no automatic activation of a provider/model simply because a process was registered.

## Process-neutral versus demand-driven responsibilities

- **BSS-V2-005:** compute policy and advertised resource ceiling from the **validated active process/profile set**, under explicit operator-controlled reserve/weights/safety rules; a new registration/configuration version may change desired allocation automatically. Its deterministic planner must **not** use transient queue depth, remaining TPM or runtime usage as planning input.
- **BSS-V2-006:** run-time actual work/attempt admission, per-domain pressure/cooldown, fair borrowing among backlogged eligible lanes, and one reservation per outbound attempt. Unused background allocation may be borrowed as permitted; **hard interactive reserve is never lent to background**. New queue activity can shift who gets admitted without constantly regenerating or rewriting the DesiredAdmissionProfile.
- **Consumers (including IDSER planner):** ask for an authenticated bounded budget/constraint view through versioned provider-neutral interfaces; they may size a request but not publish a capacity plan or reserve/dispatch provider work.
- **Policy:** dynamic adaptation is bounded by configured source-of-truth limits and explicit protection. No fabricated provider limits, implicit equal fairness, unbounded adaptive priority, or learned weights without approved policy.

## Binary review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-00505-01` | Add an invented but valid synthetic process kind through versioned server-side registration **without editing the generic capacity/allocation algorithm**; invalid/foreign/unqualified registry identity or capability fails closed. |
| `RC-00505-02` | Distinct process kinds share one quota domain and a different domain remains isolated. Active/inactive and workload/route/version updates recompute the same generic policy deterministically. |
| `RC-00505-03` | Active registered-process changes generate exactly one monotonic immutable desired-plan publication/change signal; repeated identical transitions are idempotent; concurrent stale writes fail/reconcile without lost updates. |
| `RC-00505-04` | Planner preserves independent quota dimensions, versioned estimator/output/media/structural constraints, explicit weights/caps/headroom and hard interactive protection. Unknown/zero required capacity fails closed. |
| `RC-00505-05` | One BSS-V2-006 durable plan-change wakeup observes the revised desired profile; in-flight reservations keep old identity, waiting work sees new policy, no provider transport or semantic/Atlas truth effects occur in BSS-V2-005. |
| `RC-00505-06` | Transient queue depth/usage/cooldown causes no immutable plan churn: runtime BSS-V2-006 alone changes next-admitted work. Source/secret bytes absent from registry, plan and wakeup metadata. |

**STOP** if the new registry bypasses existing route/quota authorization, creates a second planner/broker, changes previously approved profile semantics without a version, or relies on BSS-V2-006 behavior not yet CK-qualified. Preserve original BSS-V2-005 leaf approvals; this new leaf needs explicit GO and independent CK.

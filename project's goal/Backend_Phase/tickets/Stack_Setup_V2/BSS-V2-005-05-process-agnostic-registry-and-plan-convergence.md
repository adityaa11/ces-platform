# BSS-V2-005-05 — Process-agnostic registry and automatic desired-plan convergence

- **State:** `planned`; new prospective executable child, **not** GO, CFC authority or CK PASS.
- **Parent:** [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md)
- **Dependencies:** BSS-V2-005-01..04 independent CK PASS; **BSS-V2-006-03 CK PASS for actual plan-wakeup/convergence integration**; exact server-authorized process/workload definitions. The BSS-V2-005 read-only contract itself may be built and independently tested against approved -005-04 before -006-03 is implemented, but final -005-05 CK cannot claim the durable BSS-006 wakeup until -006-03 is CK-qualified. **BSS-V2-006-01..03 must not depend on BSS-V2-005-05** (avoid cyclic authority). Approved BSS-V2-005-01..04 records and CK outcomes remain untouched.
- **Motivation:** [October 16 process-neutral/planner handoff decision](../../../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md)

## Outcome

Make the **existing** capacity catalogue, `deriveDesiredAdmissionProfile`, and immutable plan-publication seam extensible to any **server-registered process kind**, rather than a fixed TypeScript enum requiring edits to the capacity algorithm for new process types. The registry selects capability, qualified route/quota domain, service class, fairness scope, versioned workload/request estimator/output reservation, configured protection/weights/caps, eligibility and activation policy. Admission resources are still independently measured as RPM/TPM/RPD/concurrency. The registry must not grant capabilities, credentials, source access, model-quality acceptance or provider quotas on the basis of an arbitrary name.

Process/workload configuration changes **and qualified, authorized BSS-V2-005 provider-capacity-profile revisions** affecting an eligible quota domain cause **durable deduplicated recalculation, validation and immutable publication/activation of a new `DesiredAdmissionProfile` version**, followed by BSS-V2-006 plan-change notification. Do not update prior versions or overwrite in-flight reservation references. Unknown/unqualified process, inactive workload, route, quota source or estimator **fails closed**; no automatic activation of a provider/model simply because a process was registered.

## Process-neutral versus demand-driven responsibilities

- **BSS-V2-005:** compute policy and advertised resource ceiling from the **validated active process/profile set**, under explicit operator-controlled reserve/weights/safety rules; a new registration/configuration version may change desired allocation automatically. Its deterministic planner must **not** use transient queue depth, remaining TPM or runtime usage as planning input.
- **BSS-V2-006:** run-time actual work/attempt admission, per-domain pressure/cooldown, fair borrowing among backlogged eligible lanes, and one reservation per outbound attempt. Unused background allocation may be borrowed as permitted; **hard interactive reserve is never lent to background**. New queue activity can shift who gets admitted without constantly regenerating or rewriting the DesiredAdmissionProfile.
- **Consumers (including IDSER planner):** ask for an authenticated bounded budget/constraint view through versioned provider-neutral interfaces; they may size a request but not publish a capacity plan or reserve/dispatch provider work.
- **Policy:** dynamic adaptation is bounded by configured source-of-truth limits and explicit protection. No fabricated provider limits, implicit equal fairness, unbounded adaptive priority, or learned weights without approved policy.

## Provider policy drift, separate from runtime pressure (prospective 2026-10-16)

The source of truth for an updated *lasting* external limit belongs to the existing **BSS-V2-005-01** immutable capacity catalogue; this prospective child only connects **valid new version activation** (whether triggered by operator/provider API/documented source or a BSS-V2-006 qualified lower-limit observation) to deterministic DesiredAdmissionProfile recomputation and durable runtime wakeup. Lower feedback is an immediate **BSS-V2-006 clamp**, not automatic license to overwrite capacity truth. Provider responses may expose no trusted numeric ceiling; in that case BSS-V2-006 holds/cools down conservatively while BSS-V2-005 retains its prior provenance-bound profile. Never use live queue depth or a guessed 429-derived RPM/RPD as deterministic BSS-V2-005 planner inputs.

If a newly qualified per-request limit makes a persisted semantic corpus physically unfit, notify the owning consumer to invalidate/replan **only under a versioned authority**; BSS cannot modify semantic content or perform source splitting itself.

## Preserve existing interactive/background contract (prospective 2026-10-16)

Confirmed **already implemented and CK-approved** in BSS-V2-005-02/03: `ServiceClass = interactive | background`; per-process service-class assignment; versioned `hardInteractiveProtection`; `PlannerPolicy.interactiveReserveTargets`; and planner derivation of `hardInteractiveReserve` plus `backgroundCapacity = usableGlobalCapacity - hardInteractiveReserve`. Existing `apps/agents-bridge/tests/capacity-planner.test.ts` checks that reserve is separated from background. **No new interactive quota algorithm is authorized here.**

Future `chat` request-response work must register via server-governed **interactive** profile and defined reserve/service target; semantic batch work is **background**. Neither the user's request metadata nor the generic registry may upgrade arbitrary work to interactive. This ticket extends process-kind registration and desired-plan convergence **without changing** the service-class meaning, vector subtraction, or hard-reserve non-lending; BSS-V2-006 owns time-bounded interactive admission/cancellation. Streaming/HTTP response handling and the actual chatbot integration remain a separate consumer responsibility.

## Consumer-facing Hard Stop A — authenticated CapacityPlanningSnapshot/v1 (planned)

In addition to the already approved BSS-V2-005-04 **immutable active `DesiredAdmissionProfile` publish/read hard stop**, this child must expose a stable, **read-only consumer contract** for independent processes, not only internal catalogue records. [Frozen consumer boundary and independent tests](../../bss-provider-consumer-contract-checkpoint-20261016.md).

A versioned and source-attributed snapshot must bind server-authorized process/workload/eligible route and quota domain, `serviceClass`, policy/activation revision, RPM/TPM/RPD/concurrency known/zero/unknown + window semantics, qualified **per-request** structural bounds (bytes, input/output tokens, media estimator), headroom, protected interactive reserve, safe background allowance and exact estimator/accounting/safety versions. Expose typed `qualified / inactive / unknown / unfit / stale` reason; do not collapse rate, structural and actual remaining-window capacity into a guessed single "available tokens" number. Cross-domain/forged interactive process reads fail closed; snapshot contains no provider secret/raw PRD and requires no direct Atlas role access to Bridge tables.

The snapshot may be used to size a stable semantic corpus, but **is never admission permission**, never decrements runtime quota and must not report live remaining RPM/RPD as a deterministic planning input. An explicitly eligible **inactive/prospective workload planning view** can break IDSER-012-02-01/-02-02 bootstrap without activating an unqualified semantic route; this view cannot authorize any provider job. Version change invalidates incompatible consumer snapshots; runtime eligibility remains solely BSS-V2-006-owned.

**Hard stop of -005-05:** independently qualified snapshot read + process-registration/immutable-plan convergence, **zero BSS reservations/provider transport/consumer truth effects**. BSS-V2-006-04 later proves actual admitted consumer execution; BSS-V2-005-05 must not depend on SEM-CUTOVER implementation to CK its planning surface.

## Binary review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-00505-01` | Add an invented but valid synthetic process kind through versioned server-side registration **without editing the generic capacity/allocation algorithm**; invalid/foreign/unqualified registry identity or capability fails closed. |
| `RC-00505-02` | Distinct process kinds share one quota domain and a different domain remains isolated. Active/inactive and workload/route/version updates recompute the same generic policy deterministically. |
| `RC-00505-03` | Active registered-process changes generate exactly one monotonic immutable desired-plan publication/change signal; repeated identical transitions are idempotent; concurrent stale writes fail/reconcile without lost updates. |
| `RC-00505-04` | Planner preserves independent quota dimensions, versioned estimator/output/media/structural constraints, explicit weights/caps/headroom and hard interactive protection. Unknown/zero required capacity fails closed. |
| `RC-00505-05` | One BSS-V2-006 durable plan-change wakeup observes the revised desired profile; in-flight reservations keep old identity, waiting work sees new policy, no provider transport or semantic/Atlas truth effects occur in BSS-V2-005. |
| `RC-00505-06` | Transient queue depth/usage/cooldown causes no immutable plan churn: runtime BSS-V2-006 alone changes next-admitted work. Source/secret bytes absent from registry, plan and wakeup metadata. |
| `RC-00505-07` | New **authorized** lower provider-capacity profile version, not only a changed process set, causes deterministic immutable desired-plan recomputation/activation and BSS-V2-006 wakeup; unknown/unattributable 429 never invents numeric BSS-V2-005 limits. |
| `RC-00505-08` | Domain/version-scoped downgraded structural constraints invalidate affected consumer request envelopes for explicit versioned replan; unrelated domains/eligible jobs remain live, and BSS never touches document corpus/Atlas truth. |
| `RC-00505-09` | Register an interactive `chat` consumer and background semantic consumer using generic server-authorized process/workload profiles; the **existing** planner emits identical hard reserve/background subtraction under registry extension, rejects background→interactive privilege forgery and requires no chatbot-specific allocation branch. |
| `RC-00505-10` | An **external read-only fixture consumer** obtains the coherent BSS-V2-005 `CapacityPlanningSnapshot/v1` with process/workload/route/quota-domain/active-revision/structural/estimator/output/media, independent resource and protection version bindings. Second distinct qualified process uses the same API without changes to the capacity algorithm. Counters prove **zero quota mutation, reservations, provider jobs and transports**. |
| `RC-00505-11` | Forged foreign quota/process scope, inactive or prospective-unqualified route dispatch, missing/stale plan, unknown/zero quota and outdated estimator fail conservatively. A specifically authorized **inactive planning view** can size a synthetic request but cannot activate a route or reserve work; active and prospective snapshots cannot be confused. |
| `RC-00505-12` | BSS-V2-005-05 final CK proves process or qualified provider-capacity revision → deterministic new immutable desired plan → **real BSS-V2-006-03** durable deduplicated wakeup; no cyclic dependency on -005-05 in BSS-V2-006-01..03, no false claim of -006-04 production admission. |

**STOP** if the new registry bypasses existing route/quota authorization, creates a second planner/broker, changes previously approved profile semantics without a version, or relies on BSS-V2-006 behavior not yet CK-qualified. Preserve original BSS-V2-005 leaf approvals; this new leaf needs explicit GO and independent CK.

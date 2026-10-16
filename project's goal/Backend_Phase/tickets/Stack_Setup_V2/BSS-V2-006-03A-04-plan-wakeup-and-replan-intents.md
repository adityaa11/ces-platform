# BSS-V2-006-03A-04 — Plan-activation wakeup and bounded convergence intents

- **State:** `awaiting_review`; GO implementation completed after 03A-03 CK `PASS`.
- **Batch:** `BSS-V2-BATCH-06-03A-04`.
- **Depends on:** 03A-01..03 CK `PASS`; existing BSS-V2-005-04 active-plan interface.
- **Original traceability:** RC10–12, E06 and applicable E08–09.

## Outcome and scope

Consume—not publish—the existing active-plan activation seam through one durable deduplicated pg-boss wakeup. Revalidate waiting work against the newly active plan, preserve in-flight attribution and old liabilities, rebase fairness without historic borrow debt, and emit only bounded durable intents for qualified structural downgrade or capacity revision.

It does not implement BSS-V2-005-05 registry or publication, alter settled accounting, or turn transient pressure into replan.

## Frozen review contract

| ID | CK PASS iff |
| --- | --- |
| RC-04-01 | Plan vN→vN+1 creates and consumes one effective deduplicated wakeup; replay cannot dispatch twice. |
| RC-04-02 | Waiting work is revalidated under the active plan, in-flight work retains original attribution/liability, and fairness has no carried historic borrow debt. |
| RC-04-03 | Only qualified immutable per-request structural downgrade creates one owner-replan-required intent; transient quota, cooldown, or pressure does not. |
| RC-04-04 | Only qualified lasting downgrade creates a provenance-bound BSS-005 revision-request intent; it never publishes or elevates policy. |

## Workflow and handoff

GO must use the 03A-03 incident and 03A-02 liabilities as inputs, not copies. CK validates one wakeup and all intent negative cases. CFC repairs only wakeup/revalidation/intent clauses. HMN may resolve an actual incompatibility in the already-approved activation seam, but cannot authorize BSS-005-05 publication or a new broker.

On PASS, hand off a claimed wakeup-consumer seam, revalidated waiting-work state, and immutable intent rows to 03A-05. Background admission uses that same seam; it must not consume intents as permission to reroute.

## Uncommitted-work allocation and SecurityReadiness

Move replan/revision-intent definitions out of the current mixed `0049` migration into this ticket’s migration, and allocate `0055`, `provider-wakeup-worker.ts`, and wakeup worker composition here. `SR-04-ACTIVATION` preserves active-plan consumption only; `SR-04-INTENT` prevents intent→publication coupling; `RB-05` requires duplicate/restart wakeup evidence.

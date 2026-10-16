# BSS-V2-006-03A-05 — Background route-aware admission with interactive protection

- **State:** `planned`; explicit GO required after 03A-04 CK `PASS`.
- **Batch:** `BSS-V2-BATCH-06-03A-05`.
- **Depends on:** 03A-01..04 CK `PASS`.
- **Original traceability:** RC13, E07 and applicable E08.

## Outcome and scope

Put background work through the same approved route-aware admission, pressure, exact-accounting, and wakeup authority used by targeted interactive work. Preserve protected interactive headroom, fair durable background behavior, cancellation/deadline fencing, and conservative maybe-sent restart state.

No separate background scheduler, reserve lending, public consumer contract, or semantic execution is allowed.

## Frozen review contract

| ID | CK PASS iff |
| --- | --- |
| RC-05-01 | Saturated background and interactive work use one admission authority and protected reserve; background cannot borrow it. |
| RC-05-02 | Pressure, cancellation, deadline expiry, and full concurrency produce bounded non-success with zero late send when transport has not begun. |
| RC-05-03 | Background fairness remains durable across restart and maybe-sent work preserves its exact 03A-02 liabilities. |

## Workflow and handoff

GO proves cross-class behavior using the actual admission entrypoints. CK does not accept a copied “background version” of the runtime. CFC remains ticket-local. HMN is required if predecessor fairness semantics cannot support a common authority; it cannot authorize a second scheduler.

On PASS, hand off the integrated two-class runtime to 03A-06 for destructive-path evidence. No new functional feature is handed off: 03A-06 only hardens and proves the composed behavior.

## SecurityReadiness

`SR-05-CLASS` prevents caller-forged service class; `SR-05-FAIRNESS` preserves predecessor fairness/reserve guarantees; `RB-06` requires cancel/deadline/restart proof with real durable rows.

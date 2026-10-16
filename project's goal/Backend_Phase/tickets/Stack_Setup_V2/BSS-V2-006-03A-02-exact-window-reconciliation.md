# BSS-V2-006-03A-02 — Exact physical-window reconciliation

- **State:** `approved`; accepted by CK `PASS` in `project's goal/feedback/BSS-V2-BATCH-06-03A-02-7ed97f1-review.md`.
- **Batch:** `BSS-V2-BATCH-06-03A-02`.
- **Depends on:** 03A-01 CK `PASS` and its handoff contract.
- **Original traceability:** RC05–06, E02–03 and applicable E08 restart proof.

## Outcome and scope

Extend the inherited typed terminal ingress into exact, domain-owned per-dimension physical-window accounting. It must preserve unknowns, distinguish definitely-not-sent from may-have-started, keep request/RPD and unknown TPM conservatively charged, release concurrency only with durable terminal completion, and carry compatible old-plan liabilities across activation.

No pressure incident, probe, wakeup, structural replan, background admission, public API, or new numeric capacity owner is in scope.

## Frozen review contract

| ID | CK PASS iff |
| --- | --- |
| RC-02-01 | Known under-use refunds only refundable held units in the same physical window; over-use persists a non-negative deficit that blocks the next fitting admission. |
| RC-02-02 | Mixed known/omitted dimensions settle independently; omission never becomes zero. Request/RPD transmission and unknown token holds remain charged correctly. |
| RC-02-03 | Definitely-not-sent releases once only when the durable claim fence permits it; may-have-started remains conservative until proven completion. |
| RC-02-04 | Distinct RPM/TPM/RPD window identities expire independently; incompatible/unknown reset and restart fail closed, and old-plan liabilities do not disappear or double charge. |

## Workflow and handoff

GO proves these rows through the 03A-01 ingress and common 006-02 admission authority, never manual-only accounting mutation. CK may pass only all four rows. CFC is restricted to failed reconciliation behavior. HMN is required if approved window-policy semantics cannot identify a safe physical boundary; it cannot invent a reset or release rule.

On PASS, hand off the stable operational usage query and exact liability semantics to 03A-03. Pressure may read the authoritative domain/window state but may not create a parallel route ledger or revise settled usage.

## Uncommitted-work allocation and SecurityReadiness

Candidate migrations are `0047–0048` and compatibility corrections `0052–0054`, with the physical-window portions of `provider-route-bound-operational-runtime.integration.test.ts`. They must be separated from pressure/wakeup migrations before any commit. `SR-02-LEDGER` preserves `(domain, policy version, dimension, physical window)` identity; `SR-02-UNKNOWN` forbids optimistic release; `RB-03` requires restart and cross-window evidence.

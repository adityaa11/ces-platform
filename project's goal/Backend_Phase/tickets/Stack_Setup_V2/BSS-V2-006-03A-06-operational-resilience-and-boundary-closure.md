# BSS-V2-006-03A-06 — Operational resilience and boundary closure

- **State:** `awaiting_review`; GO checkpoint recorded in `project's goal/feedback/BSS-V2-BATCH-06-03A-06-go.md`.
- **Batch:** `BSS-V2-BATCH-06-03A-06`.
- **Depends on:** 03A-01..05 CK `PASS`.
- **Original traceability:** RC14, E08–09, and cross-ticket final evidence for RC01–13.

## Outcome and scope

Close the split series with production-shaped failure and boundary proof against the already composed internal runtime: duplicate delivery, rollback, crash before/after claim, ack loss, restart, feedback/admission race, terminal replay, role isolation, redaction, fresh migration/upgrade, focused predecessor regressions, and no-live-transport evidence.

This ticket may make minimal hardening fixes required by a failing composed oracle, but may not add capability, revise prior RC meaning, provide an external API, or absorb BSS-V2-005-05/006-04 work.

## Frozen review contract

| ID | CK PASS iff |
| --- | --- |
| RC-06-01 | Actual PostgreSQL/pg-boss delivery proves at-most-once send and idempotent terminal accounting across rollback, crash, acknowledgement loss, replay, and concurrent feedback/admission. |
| RC-06-02 | Persisted rows prove non-inert reservation/job/claim/send/outcome/usage/pressure/wakeup behavior with no manual-only scheduler or accounting substitute. |
| RC-06-03 | Bridge role and redaction boundaries reject untrusted mutation and retain no raw headers, bodies, prompts, sources, credentials, or vendor tokens. |
| RC-06-04 | Fresh migration/bootstrap and upgrade paths, DB/Bridge typechecks, directly affected 005/006 suites, and `git diff --check` pass; no live provider request, secondary broker, BSS-007 analytics, or Atlas-truth write occurs. |

## Workflow and final handoff

GO runs the composed evidence matrix without weakening child contracts. CK returns the series-closing `PASS` only when every row above and every child’s passed handoff contract is demonstrably intact. CFC may remediate the cited composed defect but must return work to its owning child if it changes that child’s frozen behavior. HMN may authorize only an exact unresolved cross-ticket contract conflict; it may not waive evidence.

On CK PASS, this series supplies the internal 03A capability to BSS-V2-005-05’s final durable-wakeup proof and BSS-V2-006-04’s external two-consumer integration. It hands off no public API and no permission for provider calls.

## SecurityReadiness

`SR-06-REPLAY`, `SR-06-ROLE`, and `SR-06-REDACTION` are applicable. Review bindings `RB-07` through `RB-09` require real-worker fault injection, role-negative evidence, and migration/secret-free boundary evidence respectively.

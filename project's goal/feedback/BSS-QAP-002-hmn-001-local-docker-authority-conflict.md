# HMN authority-conflict diagnosis — BSS-QAP-002

- **Ticket:** `BSS-QAP-002` — R2 ID-free writer contract cutover
- **Batch:** `BSS-QAP-BATCH-02`
- **HMN record ID:** `HMN-BSS-QAP-002-001`
- **Invocation:** explicit user delegation of bounded planning authority for the
  stalled local-development evidence boundary
- **Current workflow state:** first CK returned `CHANGES_REQUIRED`; the first
  CFC pass is incomplete and `CFC_NOT_READY_FOR_CK`
- **Frozen ticket:**
  `project's goal/Backend_Phase/tickets/BSS_Cutover_reorganize/BSS-QAP-002-r2-id-free-writer-contract.md`
- **Current HEAD:** `6e74fd756130b0274ed5ff7f9d375f4fd97fc3a2`
- **Relevant GO commit:** `421800695d4dd4d3f179f06d1a1c976b6a0da209`
- **Relevant CK artifact:**
  `project's goal/feedback/BSS-QAP-BATCH-02-42180069-review.md`
- **Relevant CFC record:**
  `project's goal/feedback/BSS-QAP-BATCH-02-42180069-cfc-progress.md`
- **Prior HMN authorization:** none

## Diagnosis

Historical clause `CK-001.a` is unresolved because its frozen oracle requires
production-wide deployment, rollout, retirement, and external-integration
records. The confirmed authority boundary is instead a local Docker
development environment with no separately operated staging or production
deployment. Satisfying the historical oracle would require evidence for
nonexistent infrastructure, while treating repository search as a substitute
would violate the original ticket's no-inference rule.

The implementation is not authorized to invent production records, deploy new
infrastructure, or silently lower the historical oracle. This is an authority
conflict, not an implementation defect or a reason to reopen the already
proven R2 code and regression rows.

## Ticket-authority trace

`RC-QAP-002-04` requires a writer inventory and deployment evidence, while
the frozen `CK-001.a` makes production/external records its binary oracle.
The user-directed planning amendment
`BSS-QAP-LOCAL-DOCKER-ACCEPTANCE-AMENDMENT-001.md` supersedes only that
environment-wide evidence portion for the stated local boundary. It preserves
the ID-free writer, no-dummy-ID, `0113`-closed, parser, runtime, and regression
obligations.

## Decision

`HUMAN_DECISION_REQUIRED` — the original historical oracle cannot authorize
ordinary CFC remediation. The user's accompanying planning amendment supplies
the required bounded decision, but CK must independently validate and freeze a
replacement contract before a new CFC cycle can begin.

## Authorized scope

No CFC, GO, or R3 work is authorized by this record. Historical `CK-001.a`
and all already-proven `RC-QAP-002-01` through `RC-QAP-002-03` and
`RC-QAP-002-05` through `RC-QAP-002-06` are protected from redesign.

## Required validation

CK must validate the amendment's exact supersession mapping and, if valid,
write an append-only replacement closure matrix with distinct replacement
clause IDs. It must retain the historical unresolved outcome and use the
amendment's local Docker criteria as the replacement contract source.

## Forbidden work

- Do not mark historical `CK-001.a` `PASS` or edit its frozen oracle.
- Do not claim production/staging evidence, reset Docker volumes, or alter
  `atlas_dev`.
- Do not modify or execute `0112`/`0113`, perform physical removal, or change
  unrelated runtime behavior.

## Handoff

Expected next command: `ck` — validate and, if warranted, freeze the
replacement contract. A fresh explicit user `hmn` invocation is required only
after that replacement freeze before any evidence-remediation CFC cycle.

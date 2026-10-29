# HMN authorization — BSS-QAP-002

- **Ticket:** `BSS-QAP-002` — R2 ID-free writer contract cutover
- **Batch:** `BSS-QAP-BATCH-02`
- **HMN authorization ID:** `HMN-BSS-QAP-002-002`
- **Invocation:** explicit user `hmn` delegation
- **Current workflow state:** CK halted while evaluating the local-Docker
  amendment; no replacement-freeze artifact was written.
- **Frozen ticket:**
  `project's goal/Backend_Phase/tickets/BSS_Cutover_reorganize/BSS-QAP-002-r2-id-free-writer-contract.md`
- **Current HEAD:** `e26334731595b7a4d55617ac1fc81cfdb1a92c71`
- **Relevant GO commit:** `421800695d4dd4d3f179f06d1a1c976b6a0da209`
- **Relevant CK artifact:**
  `project's goal/feedback/BSS-QAP-BATCH-02-42180069-review.md`
- **Relevant CFC commit:** none; the only CFC record is incomplete progress
  at `project's goal/feedback/BSS-QAP-BATCH-02-42180069-cfc-progress.md`.
- **Prior HMN record:** `HMN-BSS-QAP-002-001`
- **Worktree state:** dirty with unrelated user changes; no staged change was
  used as evidence.

## Diagnosis

Historical `CK-001.a` remains `UNRESOLVED`. The local-Docker planning
amendment and authority-conflict diagnosis exist, but no CK replacement freeze
exists and no replacement clause IDs have been created. CK halted because the
historical finding has not reached a post-CFC CK verification: the available
CFC record is `CFC_NOT_READY_FOR_CK`, not a bounded remediation commit reviewed
by CK.

## Ticket-authority trace

The local-Docker amendment changes only the environment-wide evidence portion
of `RC-QAP-002-04`; it explicitly preserves the historical outcome of
`CK-001.a`. Under the shared review contract, HMN may authorize evidence
remediation only after CK writes an append-only replacement freeze with stable,
unresolved replacement clause IDs. That prerequisite is absent.

## Decision

`HUMAN_DECISION_REQUIRED`

No replacement clause IDs are available to authorize. This HMN invocation does
not authorize CFC, CK PASS, GO, or R3 work.

## Authorized scope

None. Historical `CK-001.a` is not an authorization target, and all already
proven R2 rows remain protected from redesign.

## Required validation

Before any future evidence-remediation authorization, an approved workflow
amendment must resolve the missing post-CFC-verification prerequisite, and CK
must then create an append-only replacement freeze that names exact
replacement clause IDs and closure oracles. A fresh user `hmn` invocation is
required after that freeze.

## Forbidden work

- Do not treat the local-Docker amendment as a replacement freeze.
- Do not authorize or run another CFC against historical `CK-001.a`.
- Do not mark any historical result `PASS`, modify `0112`/`0113`, alter
  `atlas_dev`, reset Docker volumes, or authorize R3.

## Handoff

Return to human/planning authority to decide whether to amend the shared
replacement-contract workflow prerequisite. No workflow command is authorized
until that decision is durable and CK has produced a valid replacement freeze.

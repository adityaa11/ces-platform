# HMN Authorization: IDSER-007

Ticket: IDSER-007 — Bounded reconciliation and procedural advancement
Batch: IDSER-BATCH-07
HMN authorization ID: HMN-IDSER-007-006
Invocation: explicit user `hmn` delegation
Current workflow state: the planning-authorized supplemental CK freeze at
`e8d3851` returned `REVIEW_CONTRACT_GAP`; its two supplemental clauses remain
unresolved.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-007-bounded-reconciliation-and-procedural-advancement.md`
Current HEAD: `45a7ab0899d718009d95b389a12cff756ed49684` (`docs(atlas): allow bounded supplemental gap remediation`)
Relevant GO commit: `f16a7ab2317fe04b1c5aae89efdcdc9256f1d850` (`feat(idser): add bounded reconciliation advancement`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-07-e8d3851-contract-gap.md`
Relevant CFC commit: `e8d3851a491b9ece4419216a848524c1dfe15c28` (`fix(idser): prove residual reconciliation clauses`)
Prior HMN authorization: `HMN-IDSER-007-005` (`RETURN_TO_CK`, consumed by the supplemental CK freeze)
Worktree state: the protocol change is committed at `45a7ab0`. Existing tracked generated/build edits and untracked workflow artifacts remain untouched; they do not change the committed IDSER-007 implementation target.

## Diagnosis

The supplemental CK matrix freezes exactly two unresolved clauses, both
directly traceable to IDSER-007 and the recorded planning decision:

- `CK-SUP-001.a`
- `CK-SUP-002.a`

The planning decision already resolves the authority question: the clauses
represent pre-existing ticket requirements, not new scope or product,
architecture, or policy decisions. The supplemental matrix provides the
closure oracles. All historical original clauses and their outcomes remain
protected. This authorization is newer than the supplemental CK artifact; no
later workflow artifact supersedes it.

## Ticket-authority trace

| Supplemental clause | Frozen authority / oracle source | State |
|---|---|---|
| `CK-SUP-001.a` | IDSER-007 `Validation` and the supplemental frozen closure matrix in `IDSER-BATCH-07-e8d3851-contract-gap.md` | Unresolved; authorized below. |
| `CK-SUP-002.a` | IDSER-007 `Validation` and the supplemental frozen closure matrix in `IDSER-BATCH-07-e8d3851-contract-gap.md` | Unresolved; authorized below. |
| Original CK clauses | Original frozen matrix and subsequent verification artifacts | Historical outcomes protected; not authorized for redesign. |

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION` — open one bounded CFC cycle for the
supplemental frozen clauses only. The planning-authorized supplemental matrix
meets the shared Review Contract's recovery conditions for this
`REVIEW_CONTRACT_GAP`.

## Authorized scope

Authorize only `CK-SUP-001.a` and `CK-SUP-002.a` from
`IDSER-BATCH-07-e8d3851-contract-gap.md`. CFC must read their exact closure
oracles and proof requirements from that CK artifact. This opens one evidence
remediation cycle and consumes this HMN authorization once.

All historical resolved clauses are protected from redesign. Do not restart
broad review, change ticket scope, or add conditions beyond the two frozen
supplemental oracles.

## Required validation

CFC must meet each selected supplemental clause's frozen oracle using its
named evidence boundary, record exact validation results and evidence
locations, check direct regressions introduced by the remediation, and satisfy
`READY_FOR_CK` before committing one bounded checkpoint. CK is the next
workflow command.

## Forbidden work

- Do not modify or reopen historical resolved clauses or evidence.
- Do not remediate any clause other than `CK-SUP-001.a` and `CK-SUP-002.a`.
- Do not broaden the ticket, restart full review, or add HMN-authored proof
  requirements.
- Do not claim `PASS` or invoke another CFC cycle.

## Handoff

CFC consumes `HMN-IDSER-007-006`, reads the closure oracles directly from the
supplemental CK artifact, commits one bounded evidence-remediation checkpoint,
and hands it to CK.

Expected next command: `cfc IDSER-007`

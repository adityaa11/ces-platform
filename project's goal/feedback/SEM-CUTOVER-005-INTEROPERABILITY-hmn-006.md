# HMN Authorization: SEM-CUTOVER-005-INTEROPERABILITY

Ticket: `SEM-CUTOVER-005-INTEROPERABILITY`
Batch: `SEM-CUTOVER`
HMN authorization ID: `HMN-SEM-CUTOVER-005-INTEROPERABILITY-006`
Invocation: explicit user `HMN SEM-CUTOVER-005-INTEROPERABILITY — RECORD AUTHORIZATION 006`
Current workflow state: `authorized_for_bounded_cfc`

## Frozen ticket reference

- Current post-CFC CK verification: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-9990121-verification.md` (`CHANGES_REQUIRED`).
- Original frozen CK review: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-afe885f-review.md`.
- Previous post-CFC CK verification: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-807c9c0-verification.md`.
- Original bounded interoperability authority: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-hmn-001.md`.
- Corrected identity ownership and prerequisite boundary: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-hmn-002.md`.
- Current five-row frozen matrix: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-hmn-003.md`.

Current HEAD: `9990121ece197c143358555f5582a8e446dea3e4` (`fix(sem-cutover): prove asset-bearing interoperability`).
Relevant GO commit: `afe885f8c544bdd53b47cb1982f1ffda0e9f8471`.
Relevant CK artifact: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-9990121-verification.md`.
Relevant CFC commit: `9990121ece197c143358555f5582a8e446dea3e4`.
Prior HMN authorization: `HMN-SEM-CUTOVER-005-INTEROPERABILITY-005`.

The authorization ID and artifact path were verified unused before recording
this authorization.

Worktree state: pre-existing tracked and untracked work remains user work and
is preserved. It is unrelated to this authorization, is not evidence for this
decision, and must not be staged or committed. The existing CFC and CK
artifacts are also preserved and are not modified by this record.

## Diagnosis

The latest CK verification returned `CHANGES_REQUIRED` for original frozen
clause `CK-001.a` only. Original clauses `CK-001.b` through `CK-001.e` remain
resolved and protected from reopening.

Human authority explicitly approves one final bounded, test-only evidence
remediation attempt. The permitted continuation is limited to the existing
frozen clause and does not require a ticket, product, architecture, provider,
runtime, deployment, or persistence decision.

## Ticket-authority trace

| Authority | Binding effect |
| --- | --- |
| Frozen interoperability ticket and original CK closure matrix | Keeps the ticket contract and clause boundaries in force. |
| Latest CK verification `SEM-CUTOVER-005-INTEROPERABILITY-9990121-verification.md` | Selects original `CK-001.a` as the sole unresolved clause and carries `.b` through `.e` as resolved. |
| Prior HMN-005 authorization and its bounded CFC result | Establishes the current remediation lineage; resolved clauses remain protected. |
| Explicit user HMN-006 decision | Authorizes one final test-only evidence-remediation cycle for original `CK-001.a` only. |

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION` — approve one final bounded CFC attempt for
original `CK-001.a` only.

This opens one fresh bounded evidence-remediation cycle after the latest
post-CFC `CHANGES_REQUIRED` result. It does not reopen or redesign resolved
clauses, start GO, issue CK `PASS`, or expand the interoperability architecture.

## Authorized scope

The subsequent CFC may make only the authorized assertion correction in the
existing interoperability focused-test boundary, using the latest CK artifact
as its sole oracle source. No production implementation file may be modified.

The CFC must preserve the resolved status of original `CK-001.b`, `CK-001.c`,
`CK-001.d`, and `CK-001.e`. The separately invoked CK must verify original
`CK-001.a` alone and any direct regression strictly within that frozen boundary.

This authorization does not permit durable integration, provider execution,
worker/routing, persistence, publication, Master, acceptance, deployment, or
any later semantic cutover scope.

## Required validation

The CFC must consume authorization ID
`HMN-SEM-CUTOVER-005-INTEROPERABILITY-006`, make one bounded test-only
remediation commit, record the authorization ID and changed-file boundary in
its checkpoint, set the checkpoint to `awaiting_review`, and hand off to
independent CK verification of original `CK-001.a` only.

## Forbidden work

- Do not modify production implementation, provider, repository/persistence, SQL, database, worker, staging, Master, publication, acceptance, deployment, or later semantic cutover paths.
- Do not authorize or reopen original `CK-001.b`, `CK-001.c`, `CK-001.d`, or `CK-001.e`.
- Do not initiate GO, change the frozen ticket, add requirements, or create a new lifecycle state.
- Do not stage or commit unrelated tracked or untracked work.
- Do not self-issue CK `PASS`.

## Handoff

`RETURN_TO_CFC`

Expected next command: `CFC SEM-CUTOVER-005-INTEROPERABILITY`.

The subsequent CFC consumes authorization ID
`HMN-SEM-CUTOVER-005-INTEROPERABILITY-006`, performs only the authorized
test-only assertion correction, records that ID in its checkpoint, and hands
off to independent CK verification. This authorization does not start CFC now.

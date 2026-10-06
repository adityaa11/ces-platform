# HMN Authorization: IDSER-008

Ticket: IDSER-008: Bundle completion and failure lifecycle
Batch: IDSER-BATCH-08
HMN authorization ID: HMN-IDSER-008-001
Invocation: explicit user `hmn` delegation
Current workflow state: initial implementation remains incomplete; ticket is not eligible for `awaiting_review`.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-008-bundle-completion-and-failure-lifecycle.md`
Current HEAD: `4fa28d44eba6fcf8bc0cf3d7b9419e82c3c758bc`
Relevant GO commit: none
Relevant CK artifact: none
Relevant CFC commit: none
Prior HMN authorization: none
Worktree state: dirty with uncommitted IDSER-008 implementation and test changes, an untracked IDSER-008 migration, and unrelated pre-existing worktree changes. Preserve unrelated changes.

## Diagnosis

The frozen ticket remains `planned`, has no recorded GO implementation checkpoint, and has no CK finding or CFC checkpoint. Therefore this is not a post-review remediation and cannot use CFC.

The Compose stack is healthy and the migration check passes. The scoped semantic-authority integration test does not produce its assertion or cleanup diagnostic: as a one-off Compose run it fails before the test body can call the internal Atlas route because `127.0.0.1:3001` has no server; against the rebuilt long-running Atlas service it reaches the test body, reports only the top-level test failure, and does not complete with the required underlying diagnostic. This is insufficient proof for the ticket's required semantic failure/recovery behavior.

## Ticket-authority trace

- Lifecycle rules require terminal technical failures to block advancement and persist bounded failure state, while preserving semantic uncertainty as reviewable.
- Acceptance criterion 3 and Validation require safe failure/recovery, worker restart, delayed availability, and race evidence.
- The ticket's review checkpoint requires proven recoverable technical failure and no premature advancement.

## Decision

`RETURN_TO_GO`

No implementation checkpoint has been committed and no applicable CK finding exists. The unresolved integration evidence is part of completing the frozen initial implementation, not a new ticket requirement and not a CFC target.

## Authorized scope

Resume the frozen IDSER-008 implementation only. Complete the existing semantic-authority failure/recovery proof so its actual failed assertion or cleanup path is observable and diagnose any ticket-bound implementation or Compose-harness defect it exposes. Preserve the already demonstrated completion-gate work and all predecessor guarantees.

## Required validation

Use the ticket's required Compose integration environment and record a completed, diagnosable semantic-authority result together with the ticket-required lifecycle validation. Do not represent a top-level runner failure, a health check, or an unavailable local route as semantic failure/recovery proof.

## Forbidden work

Do not move IDSER-008 to `awaiting_review`, commit an implementation checkpoint, start CK or CFC, weaken the semantic-authority integration proof, redesign resolved predecessor behavior, change queue/grant policy, or alter downstream/Master authority surfaces. Do not modify unrelated user worktree changes.

## Handoff

Expected next command: `go IDSER-008`

GO must complete the bounded initial implementation and its evidence before creating the first IDSER-008 checkpoint and handing it to CK.

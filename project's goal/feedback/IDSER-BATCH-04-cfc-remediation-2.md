# CFC remediation: IDSER-004 / IDSER-BATCH-04 — cycle 2

- Remediation base: `04149dbba2585bd62364f3c4be5baaefebc04738`
- CK source: `IDSER-BATCH-04-04149db-verification.md`
- HMN authorization consumed: `HMN-IDSER-004-002` (`AUTHORIZE_NEXT_CFC`)
- Addressed findings: `CK-002`, `CK-003`, `CK-004`
- State: `awaiting_review`

## Remediation

- Replaced authority-owned candidate discovery with the typed
  `SemanticReconciliationSelectionPort`. Reconciliation fails closed until the
  IDSER-007 owner supplies a bounded selection; returned context is validated,
  scope-bound, snapshotted, fingerprinted, and replayed unchanged.
- Expanded the registered PostgreSQL semantic-authority suite to exercise
  execution-bound cache identity, selection snapshot retry, replay conflict,
  post-completion failure rejection, and denied Bridge SQL access.

## Validation

- Passed before the final cache-isolation assertion extension: Compose DB
  typecheck and the PostgreSQL semantic-authority suite.
- The final expanded-suite rerun, DB typecheck, and app build could not start
  because Docker Desktop's Linux engine named pipe was unavailable. This is an
  environment limitation, not a passed result.
- `git diff --check` passed.

CK must verify this remediation commit; CFC does not assert PASS.

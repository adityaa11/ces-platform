# CFC remediation: IDSER-004 / IDSER-BATCH-04 — cycle 5

- HMN authorization consumed: `HMN-IDSER-004-005` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- Addressed finding: `CK-004`
- State: `awaiting_review`

The real PostgreSQL route test now injects an acceptance/enqueue failure and
asserts its 409 response, retained `running` lifecycle, duplicate failure
idempotency, and failure-before-completion rejection.

Validation: `@atlas/db test:semantic-authority` passed (1 passed, 0 skipped) in
Compose; `git diff --check` passed. CK must verify this commit.

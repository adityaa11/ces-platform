# CFC remediation: IDSER-004 / IDSER-BATCH-04 — cycle 4

- Remediation base: `92ba3f5f08884367e3e403c2ace5530000b24a60`
- CK source: `IDSER-BATCH-04-92ba3f5-verification.md`
- HMN authorization consumed: `HMN-IDSER-004-004` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- Addressed finding: `CK-004`
- State: `awaiting_review`

## Evidence remediation

The real internal route and PostgreSQL authority fixture now includes invalid
skill version, expired capability, oversized request, safe redacted error, and
concurrent identical delivery assertions. Existing replay, scope, cache-binding,
selection-snapshot, completion/failure, and Bridge-denial coverage remains intact.

## Validation

- `@atlas/db test:semantic-authority`: 1 passed, 0 skipped.
- `@atlas/core test`: all 18 assertions passed.
- `@atlas/db typecheck` and `@atlas/app build` passed in Compose.
- `git diff --check` passed.

CK must verify this commit; CFC does not assert PASS.

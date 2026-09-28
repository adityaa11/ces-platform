# CFC remediation: IDSER-004 / IDSER-BATCH-04 — cycle 3

- Remediation base: `98acb502a0343fe457ba70a629aa917a2c142b30`
- CK source: `IDSER-BATCH-04-98acb50-verification.md`
- HMN authorization consumed: `HMN-IDSER-004-003` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- Addressed findings: `CK-002`, `CK-004`
- State: `awaiting_review`

## Evidence remediation

- The selector test now changes its possible later output and asserts that a
  persisted reconciliation snapshot is returned without another selector call.
- The registered PostgreSQL suite invokes the real internal semantic route over
  `PostgresSemanticAuthority` and covers credential, scope, capability, and
  skill rejection; cache execution binding; replay conflict; completion/failure
  handling; and denied Bridge SQL access.

## Final validation

- `docker compose up -d --build postgres atlas` passed.
- `corepack pnpm --filter @atlas/db migrate` reported migrations up to date.
- `corepack pnpm --filter @atlas/db test:semantic-authority`: 1 passed, 0 skipped.
- `corepack pnpm --filter @atlas/core test`: all 18 assertions passed.
- `corepack pnpm --filter @atlas/core typecheck` and `@atlas/db typecheck` passed.
- `corepack pnpm --filter @atlas/app build` passed.
- `git diff --check` passed.

CK must review this commit. CFC does not assert PASS.

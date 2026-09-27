# CFC remediation: IDSER-004 / IDSER-BATCH-04

- Frozen ticket: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
- Reviewed CK artifact: `project's goal/feedback/IDSER-BATCH-04-4c2ba35-review.md`
- Remediation base: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
- Continuation authority: `HMN-IDSER-004-001` (`CONTINUE_CURRENT_CFC`)
- Addressed findings: `CK-001`, `CK-002`, `CK-003`, `CK-004`, `CK-005`
- State: `awaiting_review`

## Remediation

- `CK-001`: replaced shallow property-list hashing with recursive canonical
  serialization and added nested scope, provenance, and result-content coverage.
- `CK-002`: added an Atlas-owned persisted reconciliation-context snapshot;
  first redemption selects bounded current and prior candidates, while retries
  parse and reuse the exact stored context and fingerprint.
- `CK-003`: extraction cache redemption now verifies the normalized document's
  exact joined perception execution identity.
- `CK-004`: corrected the Core route double to invoke its acceptance handler and
  registered the semantic-authority test command.
- `CK-005`: declared `@atlas/contracts` directly in the DB package and recorded
  its workspace lockfile entry.

## Validation

- Passed in the Compose Atlas container: `corepack pnpm --filter @atlas/db typecheck`.
- Passed: `jiti packages/atlas-db/tests/semantic-authority.integration.test.ts`.
- Passed: `jiti packages/atlas-core/tests/semantic-internal-route.test.ts`.
- Passed: `corepack pnpm --filter @atlas/db migrate` (applied
  `0015_idser004_semantic_context_authority`).
- Passed: `corepack pnpm --filter @atlas/app build`.
- Passed: `git diff --check`.

No CK result is asserted here. CK must review the remediation commit.

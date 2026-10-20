# CFC checkpoint: IDSER-012-05-04-01 / IDSER-BATCH-12-05-04-01

- **Remediation base:** CK review `IDSER-BATCH-12-05-04-01-3f2bc03-review.md`.
- **Review-contract correction:** `IDSER-012-05-04-01-ck-001a-review-contract-correction.md`.
- **CFC scope:** corrected `CK-001.a`, original `CK-001.b`, and original `CK-001.c` only.
- **Checkpoint state:** `awaiting_review` after this one bounded remediation commit.

## Review Contract Closure

| Clause | Status | Closure evidence |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `PostgresSemanticBatchV3ReferenceResolver` now exposes only `resolveBackground(reference)`. It accepts no caller scope or browser session, joins persisted plan/handoff/bundle/document/perception/cache facts, derives all four scope identities from that join, and validates immutable hashes/content before returning bounded identities. `createSemanticBatchV3ReferenceReceivingBoundary` wraps canonical reference parsing and redemption with `createInternalReceivingBoundary`; its unauthenticated test supplies non-JSON input and receives only service-auth rejection, proving authentication precedes parsing. No v3 interactive API, browser-session fallback, or compatibility adapter remains. |
| `CK-001.b` | `PROVEN` | `packages/atlas-db/tests/semantic-batch-v3-reference-resolution.integration.test.ts` provisions an isolated PostgreSQL fixture with actual accepted perception/cache/derived-image records and an actual persisted v3 plan/handoff. It exercises the internal receiving composition, proves the persisted result scope, and compares queue, BSS admission/attempt/reservation, SEM, result, and reconciliation counters before and after every redemption. The counters are unchanged. |
| `CK-001.c` | `PROVEN` | The same isolated fixture asserts fail-closed rejection for plan-hash mismatch; stale/substituted source; stale cache; cache-version mismatch; persisted scope substitution; reordered persisted handoff locators; missing and substituted accepted image; changed fingerprint; and append-only plan cancellation. The unit boundary suite retains corrupt/tampered immutable and mixed-version rejection. A valid v3 handoff resolves to the same bounded reference/metadata identities and accepted image metadata. |

## Commands and outcomes

- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/db test:semantic-batch-v3-reference-resolution` — **PASS** (3 tests).
- `corepack pnpm --filter @atlas/db test:semantic-batch-v3-reference-resolution-integration` — **PASS** (1 test) against a fresh, separately named Compose PostgreSQL project and volume on a non-default host port after repository migrations. It did not use, mount, or mutate the canonical Safara Compose project or volume.
- `git diff --check` — **PASS**.

## Direct-regression boundary

The remediation changes only v3 reference authorization, immutable/persisted
integrity validation, service receiving composition, and evidence. It adds no
GHR delivery, queue, BSS admission, SEM execution, provider call, hydration,
media read, semantic result, reconciliation, mutation, or canonical-volume
operation. Existing accepted-document interactive APIs and their tests are
unchanged.

Internal readiness: READY_FOR_CK

## CK handoff

Verify the corrected effective `CK-001.a` oracle and the original `CK-001.b`
and `CK-001.c` oracles only, together with this remediation diff and direct
regressions. The historical CK artifact and its unsupported interactive-
retention wording remain preserved; the append-only correction is the sole
authority reconciliation for that wording.

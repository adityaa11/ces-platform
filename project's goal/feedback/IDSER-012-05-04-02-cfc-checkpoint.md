# CFC checkpoint: IDSER-012-05-04-02

- **Ticket:** `IDSER-012-05-04-02 — Transient multimodal reconstruction parity`
- **Batch:** `IDSER-BATCH-12-05-04-02`
- **CFC authority:** first consolidated CK review `IDSER-BATCH-12-05-04-02-e2fe1373-review.md`, result `CHANGES_REQUIRED`.
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b`, `CK-001.c`, `CK-001.d` only.
- **Remediation scope:** selected-media v3 projection plus sidecar insert ownership/schema/hash enforcement and its direct regressions. No predecessor, provider, BSS, SEM, GHR, execution, or reconciliation behavior changed.
- **State:** `awaiting_review`.

## Authorized closure evidence

| Clause | Status | Repair and frozen-oracle evidence | Command / outcome |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `semantic-batch-v3-reference-resolution.ts` filters accepted metadata to selected visual locators in handoff order, requires one matching accepted row per selected locator, and excludes an accepted-but-unselected image from the returned reconstruction input. The resolver unit fixture exercises selected plus unselected media; the PostgreSQL resolver integration passed. | `corepack pnpm --filter @atlas/db test:semantic-batch-v3-reference-resolution` — PASS (3/3); `corepack pnpm --filter @atlas/db test:semantic-batch-v3-reference-resolution-integration` — PASS (1/1). |
| `CK-001.b` | `PROVEN` | The insert trigger requires `NEW`, plan, and handoff timestamps all equal the current transaction timestamp. The PostgreSQL writer test deletes a stored sidecar and proves a later direct insert carrying the matching historical parent content is rejected. The normal v3 writer path remains successful. | `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan` — PASS; its v3 scenario proves both valid same-transaction write and later-insert rejection. |
| `CK-001.c` | `PROVEN` | The database trigger now validates every exact nested sidecar object, scalar bound, canonical SHA-256 field, image-TPM variant, and recomputed canonical `bindingSha256`. Migration-backed direct-insert checks reject extension-key, scalar-invalid, and hash-inconsistent variants and verify no sidecar remains. | `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan` — PASS; `corepack pnpm --filter @atlas/db migration:check` — PASS. |
| `CK-001.d` | `PROVEN` | The PostgreSQL writer regression injects a failure at the sidecar insert trigger after plan and handoffs are inserted, then asserts zero plan, handoff, and sidecar rows. Valid write, replay, and one-sidecar-per-handoff assertions still pass. | `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan` — PASS. |

## Direct regressions and environment

- `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan-v3` — PASS (4/4).
- `corepack pnpm --filter @atlas/agents-bridge test:idser-v3-reconstruction-parity` — PASS (2/2).
- `corepack pnpm --filter @atlas/db typecheck` — PASS.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `git diff --check` — PASS.
- Migration-backed tests and `migration:check` ran against an isolated disposable PostgreSQL Compose project; no canonical local database was used.

## Review handoff

All authorized frozen clauses are `PROVEN`; no direct regression remains.

Internal readiness: READY_FOR_CK

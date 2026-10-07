# GO Checkpoint — BSS-V2-BATCH-05-01

- Ticket: `BSS-V2-005-01`, [external quota-domain and provider-capacity catalogue](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-01-external-quota-domain-provider-capacity-catalogue.md)
- Batch: `BSS-V2-BATCH-05-01`
- Ticket state: `awaiting_review`
- Dependencies: BSS-V2-001 (`76e9b21`) and BSS-V2-002 (`b83fa36`) have CK `PASS`; BSS-003 remains approved.

## Bounded implementation

Added a server-controlled, secret-free parser for immutable capacity catalogue input and an additive Bridge-owned PostgreSQL history table. The parser models independent RPM, TPM, RPD, and concurrency states as known-positive, zero, or unknown; requires a versioned policy for each non-instantaneous dimension; validates policy parameters; rejects Docling, credential-like aliases, unrecognized fields, and billing/weighted-token substitution. The migration makes published versions append-only and keeps them outside `atlas` truth and `atlas_app` access. This checkpoint deliberately adds neither planner/runtime admission/provider dispatch nor any fake Docling capacity.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Status |
| --- | --- | --- | --- |
| RC-BSSV2-00501-01 | Ticket Review Contract row 01: shared, server-controlled, non-secret domain identity; aliases expose no credential; invalid domain mappings fail. | `apps/agents-bridge/src/capacity-catalogue.ts`; `capacity-catalogue.test.ts` validates shared routes, rejects credential-like aliases, Docling, and duplicate cross-domain route mapping. | PROVEN |
| RC-BSSV2-00501-02 | Row 02: RPM/TPM/RPD/concurrency preserve positive, zero, unknown; unknown never becomes positive and zero is structurally representable/unavailable to later policy. | Parser’s discriminated capacity state; deterministic tests reject unknown-with-value and known-zero while proving zero/unknown values stay distinct. | PROVEN |
| RC-BSSV2-00501-03 | Row 03 and §21.1: every RPM/TPM/RPD policy is versioned with exact parameters; concurrency has no window; reset/refill unknown cannot become optimistic. | Parser requires RPM/TPM/RPD policies and validates fixed, rolling, token-bucket, provider-reset-observation, daily-calendar, conservative-fallback, or explicit unknown kinds. Tests exercise missing fixed-window and conservative-fallback parameters. | PROVEN |
| RC-BSSV2-00501-04 | Row 04: source/version, observed/effective metadata, and immutable profile version are traceable. | `0023_bssv200501_provider_capacity_catalogue.sql`; integration fixture persists v1/v2 for one domain and proves an update is rejected. | PROVEN |
| RC-BSSV2-00501-05 | Row 05: quota-accounting policy is distinct from billing/cost weighting. | Parser requires `quotaAccountingPolicyId` and strict-rejects top-level or limits-level weighted/billing fields; deterministic test proves both rejections. | PROVEN |
| RC-BSSV2-00501-06 | Row 06: local Docling has no external quota semantics. | Associated route validation rejects `providerId: "docling"`; no Docling, local queue, provider transport, or runtime-admission implementation changed. | PROVEN |

## Validation

All commands completed successfully from `C:\Workspace\atlas\ces-platform`:

```text
pnpm --filter @atlas/agents-bridge typecheck
pnpm --filter @atlas/agents-bridge test
pnpm --filter @atlas/db typecheck
DATABASE_URL=<local Compose PostgreSQL> pnpm --filter @atlas/db migrate
DATABASE_URL=<local Compose PostgreSQL> pnpm --filter @atlas/db test:provider-capacity-catalogue
DATABASE_URL=<local Compose PostgreSQL> pnpm --filter @atlas/db migration:check
git diff --check
```

The Bridge suite passed 56 tests. Four pre-existing Compose/PostgreSQL integration groups in that suite remained skipped under their explicit existing environment gates; the catalogue's own Compose-backed PostgreSQL role/immutability fixture passed directly after the migration.

Internal readiness: READY_FOR_CK

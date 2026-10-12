# HMN-PERC-RESET-003-002 — Isolated PostgreSQL qualification record

- **Ticket:** `PERC-RESET-003`
- **Authorization:** `HMN-PERC-RESET-003-002`
- **Baseline:** `b63f7b2344bba0bd0157aa770ca8b264ffae5722`
- **Result:** Database-backed qualification passed; no production correction was needed.

## Isolated database identity

- **Database:** `hmn_perc_reset_003_002`
- **Qualified database user:** `hmn_perc_003_002_admin`
- **Endpoint:** `127.0.0.1:55437` (localhost-only Docker port publish)
- **Container:** `hmn-perc-reset-003-002-pg`; ID `8cfeed6e2cb93610ca6ef15b6d41f43fc0966b2a0e1fe600173daad01b2efe8a`
- **Volume:** `hmn-perc-reset-003-002-data`
- **Network:** `hmn-perc-reset-003-002-net`; ID `988ff995a8ada03622c5fd9ae0276ed1ba10ffa00b81a8d0811ea138d3ad55e9`
- **Image:** `postgres:18-alpine`; image ID `sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`; repo digest `postgres@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`
- Container mount and port inspection confirmed only the named volume at `/var/lib/postgresql` and `127.0.0.1:55437:5432`. Container, volume, and network were labeled `hmn.authorization=HMN-PERC-RESET-003-002`.
- Before creating them, read-only Docker inventory showed no existing containers, volumes, or user-created networks. The environment did not use canonical Compose, Docling, Atlas application services, or semantic workers. `DATABASE_URL` was set per qualification process to `postgresql://hmn_perc_003_002_admin:<redacted>@127.0.0.1:55437/hmn_perc_reset_003_002`; direct identity checks confirmed the database and role. Role-specific Atlas and Bridge test connections also used this endpoint.

## Setup and validation

| Action | Exact command or observation | Outcome |
|---|---|---|
| Migration | `corepack pnpm --filter @atlas/db migrate` | Exit 0; migrations `0000` through `0024` applied (25 total). |
| Migration verification | `corepack pnpm --filter @atlas/db migration:check` | Exit 0; migration check passed. |
| pg-boss bootstrap | `AGENTS_BRIDGE_DATABASE_URL=postgresql://agents_bridge:<redacted>@127.0.0.1:55437/hmn_perc_reset_003_002 corepack pnpm --filter @atlas/agents-bridge exec jiti src/pg-boss-bootstrap.ts` | Exit 0; `pgboss.job` and `pgboss.version` present. |
| Required DB suite | `corepack pnpm --filter @atlas/db exec jiti tests/derived-assets.integration.test.ts` | Exit 0; 1 passed, 0 failed, 0 skipped. |
| Required DB suite | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` | Exit 0; 2 passed, 0 failed, 0 skipped. |
| Worker contract tests | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` | Exit 0; 12 passed, 0 failed, 0 skipped. |
| Authority contract tests | `corepack pnpm --filter @atlas/db exec jiti tests/perception-authority-asset-accounting.test.ts` | Exit 0; 2 passed, 0 failed, 0 skipped. |

## Clause observations

- **R3-03:** Two synthetic RUN-003 visuals each received a distinct immutable reference. Database readback showed exactly the two accepted manifest rows with page `1`, locator IDs `visual-1` and `visual-2`, their own refs, PNG media, byte length and SHA-256, `verified_at`, and `accepted_at`. Retried handoffs returned the same identities. Both references resolved to the original bytes after acceptance/cache invalidation.
- **R3-04:** The worker suite rejects missing, foreign-source, duplicate, wrong-page, extra and colliding visual descriptors before staging. The database suite rejects a missing reference, foreign source digest, duplicated asset reference, wrong page, misbound locator, altered bytes before acceptance, conflicting hash, byte-length mismatch, unsupported media, invalid grant, and tampered durable bytes on readback. Rejected deliveries left all staged manifests unaccepted.
- **R3-05:** The bridge integration fixture supplies offline synthetic Docling-shaped text and table content with exact capability identity `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`; no provider network call is made. Persisted cache content contains both text and table, `derived_assets=[]`, execution state is `completed`, and staged bundle member state is `perceived`. Semantic executions and background semantic jobs remain zero, document count does not increase, and repeated delivery is idempotent.
- **R3-01/R3-02:** Worker contract test passed all 12 cases, including valid zero-visual text and structural table output without a derived-asset handoff.

## Test fixture diagnosis

- An initial bridge integration attempt timed out because its test-only fault trigger created a sequence in `public` but called `nextval('atlas.<sequence>')`. PostgreSQL reported `42P01` for the missing `atlas.pcf_*` relation. The fixture now creates and drops those sequences in `atlas`.
- The first adapted synthetic RUN-003 fixture used a legacy bundle policy and correctly followed the legacy `extracting` path. The existing `staged-fair-local-v1` policy is required to observe the authorized staged terminal state `perceived`; the fixture now uses that policy. No production code changed.
- After those test-only corrections, both required database-backed suites passed with zero skips. Other failed iterations were test assertion corrections for the PostgreSQL driver’s bigint/result-array types, not implementation or environment failures.

## Cleanup

Evidence above was saved before disposal. Before removal, the container ID and the HMN labels on the container, volume, and network were checked against the recorded identities. Only `hmn-perc-reset-003-002-pg`, `hmn-perc-reset-003-002-data`, and `hmn-perc-reset-003-002-net` were removed. Final Docker inventories confirmed all three absent. No other Docker resource was modified.

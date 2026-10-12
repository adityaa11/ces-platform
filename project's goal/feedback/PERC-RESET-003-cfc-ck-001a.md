# PERC-RESET-003 bounded CFC — CK-001.a

- **Authorization:** `HMN-PERC-RESET-003-003`
- **Ticket:** `PERC-RESET-003`
- **CK artifact:** `PERC-RESET-BATCH-03-b3d91c8-review.md`
- **CK artifact commit:** `c5784883f3d05ddf98b628bf3c029008f3ab696a`
- **Reviewed implementation:** `b3d91c8b055d0e8b79cdef73f3d6b567f6fe950e`
- **Authorized clause:** `CK-001.a`
- **Protected clauses:** `R3-01`, `R3-02`, `R3-04`, and `R3-05` remain proven per the frozen CK matrix.
- **Working status:** `awaiting_review`

## Progress view

| Frozen CK clause | Status | Evidence location |
|---|---|---|
| `CK-001.a` | `PROVEN` | Handoff rejection and no-write assertions, candidate-manifest profile/source tampering assertions, uncommitted-state assertions, and the valid two-visual positive control in `packages/atlas-db/tests/derived-assets.integration.test.ts`. Exact commands and outcomes are recorded below. Oracle and authority remain in the linked original CK artifact. |

## Qualification

The read-only pre-creation Docker inventory showed zero containers and volumes, only the three default networks, and one local `postgres:18-alpine` image (`sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`). Localhost port `55438` was free. No canonical Compose stack, Docling, or semantic worker was started.

One isolated PostgreSQL qualification instance was created under the `HMN-PERC-RESET-003-003` label:

- Database: `hmn_perc_reset_003_003`; user: `hmn_perc_reset_003_003_admin`.
- Endpoint: `127.0.0.1:55438` only.
- Container: `hmn-perc-reset-003-003-pg`; ID `d2f6aace55a019e1a0b9494e3f32256880071933988693f2e4a32c39575c7efc`.
- Dedicated volume: `hmn-perc-reset-003-003-data`, mounted at `/var/lib/postgresql`.
- Dedicated network: `hmn-perc-reset-003-003-net`; ID `c0734ba094fe09a441b05e905e59713bd7d824ac152a5f056092e45499c56e54`.
- Container, volume, and network labels were inspected before use and cleanup. Container inspection confirmed the sole named volume mount and `127.0.0.1:55438:5432` port mapping.

An initial container start used an incompatible nested mount path and exited before migrations or tests. The labeled resources from that attempt were removed. The authorized qualification then ran successfully with the PostgreSQL 18 volume mounted at `/var/lib/postgresql`. After qualification, the labeled container, named volume, and named network were removed. The image-created anonymous volume was identified by its `com.docker.volume.anonymous` label and creation time during final inventory review; because the pre-creation inventory had no volumes and no containers remained, that exact volume was removed as part of qualification cleanup. Final inventories showed zero containers and volumes and only the default networks.

Setup outcomes: `corepack pnpm --filter @atlas/db migrate` applied all 25 migrations (`0000`–`0024`); `corepack pnpm --filter @atlas/db migration:check` passed; `AGENTS_BRIDGE_DATABASE_URL=postgresql://agents_bridge:<redacted>@127.0.0.1:55438/hmn_perc_reset_003_003 corepack pnpm --filter @atlas/agents-bridge exec jiti src/pg-boss-bootstrap.ts` passed.

## Validation and handoff

| Required command | Outcome |
|---|---|
| `corepack pnpm --filter @atlas/db typecheck` | Exit 0; no diagnostics. |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | Exit 0; no diagnostics. |
| `corepack pnpm --filter @atlas/db exec jiti tests/derived-assets.integration.test.ts` | Exit 0; 1 passed, 0 failed, 0 skipped. The test rejects a syntactically valid wrong-profile handoff before a manifest or bytes are stored; rejects wrong-profile and foreign-source candidate manifests before acceptance/cache/execution completion; then confirms both valid manifests persist the exact approved profile and preserves two-visual replay, integrity, and readback checks. |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` | Exit 0; 2 passed, 0 failed, 0 skipped, including the staged terminal `perceived` lifecycle. |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` | Exit 0; 12 passed, 0 failed, 0 skipped. |
| `corepack pnpm --filter @atlas/db exec jiti tests/perception-authority-asset-accounting.test.ts` | Exit 0; 2 passed, 0 failed, 0 skipped. |
| `git diff --check` | Exit 0; no whitespace diagnostics. Re-run after staging for the committed scope. |

The test and typecheck commands above were run against the isolated database where applicable. No external provider calls were made. No successor ticket was started.

## Readiness and handoff

`CK-001.a` is `PROVEN` against the frozen original CK closure oracle. The test location supplies direct negative and positive database-backed evidence; both required zero-skip DB suites and direct regressions passed. R3-01, R3-02, R3-04, and R3-05 remain protected and supported by the existing evidence; the directly affected staged `perceived` regression passed. No broader issue was found in this bounded correction.

`Internal readiness: READY_FOR_CK`.

One bounded remediation commit containing only `packages/atlas-db/src/perception-authority.ts`, `packages/atlas-db/tests/derived-assets.integration.test.ts`, and this CFC evidence artifact will be handed to independent CK for verification. CFC does not issue CK PASS. PERC-RESET-004 remains blocked pending independent CK PASS.

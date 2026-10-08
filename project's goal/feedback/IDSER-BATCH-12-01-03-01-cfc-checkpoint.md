# CFC checkpoint: IDSER-012-01-03-01 / IDSER-BATCH-12-01-03-01

- **Ticket:** `IDSER-012-01-03-01-qualified-docling-capture-and-deterministic-evidence-mapping.md`
- **Batch:** `IDSER-BATCH-12-01-03-01`
- **Reviewed commit:** `9a02d4aa12b5a06c39ddb35472f2f88c8214157e`
- **CK source:** [IDSER-BATCH-12-01-03-01-9a02d4a-review.md](IDSER-BATCH-12-01-03-01-9a02d4a-review.md), finding CK-001 and its frozen clauses CK-001.a–f.
- **Progress view:** [IDSER-BATCH-12-01-03-01-cfc-progress.md](IDSER-BATCH-12-01-03-01-cfc-progress.md)
- **Qualification evidence:** [IDSER-BATCH-12-01-03-01-cfc-evidence.json](IDSER-BATCH-12-01-03-01-cfc-evidence.json)
- **Frozen fixture:** `apps/agents-bridge/tests/fixtures/idser-012-01-03-01-safara-run003-mapping.json`; source SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`; mapped fixture file SHA-256 `2521a6a3399c78e970340c9e62c5d317f631ac154e8616d458ed31c60ef100ce`.

## Clause closure

The original CK matrix linked above remains the source for every ticket trace, required behavior, observation, and binary oracle. This table records status and evidence without restating those criteria.

| CK clause | Status | Evidence locator and result | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| CK-001.a | PROVEN | `docling-provider.test.ts`: complete capture request, runtime identity, route profile mismatch; route identity checks. Compose evidence records Docling Serve 1.36.0, runtime 2.132.0, 120000 ms timeout, 10485760-byte response bound, CPU concurrency 2, 1 worker, 4 CPU threads. | `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS; `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/docling-provider.test.ts` — 11/11 PASS; isolated Compose command below — PASS. | PASSED |
| CK-001.b | PROVEN | Qualification assertions match the committed frozen mapping fixture and repeated mapped output; evidence records 254 texts, 4 tables, 69 cells, ordered content and table metadata, and source captions/labels. Complex-table negative is in `docling-provider.test.ts`. | Typecheck — PASS; provider test — 11/11 PASS; isolated Compose command below — PASS. | PASSED |
| CK-001.c | PROVEN | Qualification runs the fixture through `parseNormalizedDocument`, resolves all 263 text/table/visual locators to the mapped source material, checks uniqueness and both V1 ID patterns, and compares the output with the frozen mapping fixture. | Typecheck — PASS; provider test — 11/11 PASS; isolated Compose command below — PASS. | PASSED |
| CK-001.d | PROVEN | `docling-provider.test.ts`: exact TOPLEFT and BOTTOMLEFT conversion; missing/unknown origin, inverted coordinates, and right/bottom page overflow reject. Repeated fixture geometry matches the frozen output. | Typecheck — PASS; provider test — 11/11 PASS; isolated Compose command below — PASS. | PASSED |
| CK-001.e | PROVEN | Profile-specific identities are pinned in `route-registry.ts` and `docker-compose.yml`. Provider test exercises distinct production cache keys, lookups, and scoped invalidation while confirming the image-disabled cache remains available. Historical decision: existing `docling-digital-pdf` cache entries are retained and never relabeled; RUN-003 uses `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`. The capture route remains gated, so this cycle accepts no RUN-003 result into cache. | Typecheck — PASS; provider test — 11/11 PASS; `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/route-registry.test.ts` — 6/6 PASS; isolated Compose command below — PASS. | PASSED |
| CK-001.f | PROVEN | Provider test validates complete PNG structure, CRC, decompressed image data, declared dimensions, byte length, and hash; rejects truncated/corrupt PNG. Real fixture qualification reports five validated descriptors with source references, locators, dimensions, byte lengths, and hashes. | Typecheck — PASS; provider test — 11/11 PASS; isolated Compose command below — PASS. | PASSED |

## Validation and direct regressions

- `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/docling-provider.test.ts` — 11/11 PASS.
- `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/route-registry.test.ts` — 6/6 PASS.
- `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/document-perception-worker.test.ts` — 5/5 PASS.
- `docker compose -f docker-compose.idser-012-01-03-01-qualification.yml up --build --abort-on-container-exit --exit-code-from qualification` — PASS. This isolated Docling-only run verified repeated frozen-PDF mappings, two simultaneous conversions, a held third conversion, response sizes, and the no-Atlas/no-job/no-asset scope.
- `git diff --check` — PASS.
- Direct route/worker regression: the image-disabled qualified route remains valid; the RUN-003 profile is still rejected for ordinary admission; worker handoff tests pass.

Internal readiness: READY_FOR_CK

- **State:** `awaiting_review`
- **Remediation scope:** CK-001.a–f only. CK clauses outside this matrix and ticket rows already proven by the original checkpoint remain closed.
- **Next action:** CK verification of the frozen matrix. CFC does not issue PASS and does not start another review cycle.

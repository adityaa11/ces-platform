# PERC-RESET-003 GO checkpoint — zero-visual and exact asset accounting

- **Ticket:** `PERC-RESET-003` — RUN-003 zero-visual validity and exact asset coverage
- **Batch:** `PERC-RESET`
- **Predecessor:** `PERC-RESET-002` is approved after independent CK `PASS` in `PERC-RESET-BATCH-02-9a0ef58-verification.md`.
- **Checkpoint state:** `BLOCKED`
- **Review target:** pending a restored workspace dependency layout and focused-test execution.

## Bounded implementation

- `apps/agents-bridge/src/document-perception-worker.ts` now treats zero visual regions and zero descriptors as a valid RUN-003 result. It makes no derived-asset handoff in that case. Where visual regions exist, it requires an exact one-to-one page/locator descriptor mapping, source-SHA match, unique locator bindings, and distinct returned asset references before staging normalized output.
- `packages/atlas-db/src/perception-authority.ts` now permits a RUN-003 normalized result with no visual regions and caches `derivedAssets=[]`. For any visual region it rejects a missing asset reference, then preserves the existing unique-ref, manifest page/locator, PNG, byte-length, hash, and derived-store readback checks before acceptance.
- Focused worker and authority accounting tests were added. No Compose service, Docker resource, semantic queue, source document, profile, grant, replay path, or storage backend was changed.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation locator | Status |
|---|---|---|---|---|
| R3-01 | `PERC-RESET-003` Binary review contract R3-01 | Text blocks with zero visual regions and zero descriptors normalize successfully with zero handoff calls | `apps/agents-bridge/tests/document-perception-worker.test.ts`, `RUN-003 accepts text and tables with zero visual regions without a derived-asset handoff`; required focused command cannot load workspace aliases | `BLOCKED_ENVIRONMENT` |
| R3-02 | `PERC-RESET-003` Binary review contract R3-02 | Tables with zero pictures remain structural output with no visual evidence requirement | Same worker test asserts a retained table and `visualRegions=[]`; required focused command cannot load workspace aliases | `BLOCKED_ENVIRONMENT` |
| R3-03 | `PERC-RESET-003` Binary review contract R3-03 | Every captured visual has one unique page/locator-bound descriptor, reference, and verified asset | Worker mapping guard in `document-perception-worker.ts`; existing authority manifest/readback logic retained; focused tests in `document-perception-worker.test.ts` and `packages/atlas-db/tests/perception-authority-asset-accounting.test.ts` cannot execute | `BLOCKED_ENVIRONMENT` |
| R3-04 | `PERC-RESET-003` Binary review contract R3-04 | Missing descriptor/reference and foreign/colliding bindings reject before accepted `perceived` | Worker negative test covers missing, foreign, and duplicate descriptors; authority accounting test covers missing asset reference; full authority manifest/readback negatives remain in `derived-assets.integration.test.ts`; commands cannot execute | `BLOCKED_ENVIRONMENT` |
| R3-05 | `PERC-RESET-003` Binary review contract R3-05 | Accepted zero-visual result uses existing RUN-003 cache identity and has no semantic jobs or new source documents | Existing cache insert and staged terminal `perceived` branch are unchanged; focused authority path must execute to prove the observation | `BLOCKED_ENVIRONMENT` |

## Validation record

- `node node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/document-perception-worker.test.ts` — **BLOCKED_ENVIRONMENT**: `MODULE_NOT_FOUND: @atlas/core` from the existing worker import.
- `node node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/perception-authority-asset-accounting.test.ts` — **BLOCKED_ENVIRONMENT**: `MODULE_NOT_FOUND: @atlas/core` from the existing authority import.
- `pnpm --filter @atlas/agents-bridge typecheck` and `pnpm --filter @atlas/db typecheck` — **BLOCKED_ENVIRONMENT**: pnpm attempts its dependency relink and fails with `EACCES` while opening existing package metadata under `node_modules/.pnpm`.
- Direct TypeScript commands also cannot resolve the pre-existing workspace aliases, Node types, or package dependencies because the workspace links are absent.
- `git diff --check` — **PASS**.
- `docker compose ps` was read-only and showed no services. No Docker startup, pull, build, or reset was run; PERC-RESET-004 remains unstarted.

Internal readiness: **NOT_READY — BLOCKED_ENVIRONMENT**. This checkpoint does not issue a CK result or advance the ticket to `awaiting_review`. Restore the repository's workspace dependency links without changing PERC-RESET scope, then rerun the named focused worker and authority tests plus the relevant existing derived-asset integration harness before a READY_FOR_CK handoff.

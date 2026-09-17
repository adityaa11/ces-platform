# BSS-009-02: Bridge perception integration and proof

- **State:** `approved`
- **Review batch:** BSS-BATCH-09.2
- **Depends on:** BSS-009-01 / BSS-BATCH-09.1 `PASS`, BSS-008 / BSS-BATCH-08 `PASS`
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline-mistral-synced.md) §§7–8, 12–13, 15–16, 19, 21–22

## Outcome

Wire the approved Bridge worker to Atlas's authenticated handoff boundaries and prove the complete synthetic PDF path through the existing Compose-managed stack.

## Scope

- bounded authenticated Atlas source/result clients in Agents Bridge;
- worker-main registration of the existing perception queue handler using the BSS-008 `atlas.document.perceive` capability;
- environment validation and Compose configuration for the internal service credential and endpoints;
- complete mocked-provider integration tests for normal/retry/failure/cancellation paths;
- derived-asset reference handling and operational observability with no raw document/grant/secret logging.

## Acceptance criteria

- A metadata-only pg-boss job runs through the existing worker: grant redemption, verified PDF bytes, BSS-008 capability, normalization, authenticated result delivery, persistent derived cache, and completed Atlas execution.
- Source fetch, provider, normalization, and acknowledgement/result-handoff retries preserve one immutable source identity and one logical completion/cache entry.
- Expired/tampered grant, wrong document/execution, hash/size/MIME mismatch, provider failure, invalid normalized result, timeout, cancellation, stale result, and cache-write failure remain non-semantic operational failures and do not mutate trusted Atlas state.
- The canonical `docker compose up` path starts the handler without a manual worker or a second service/queue.
- Ordinary CI uses only synthetic PDFs and mocked BSS-008 perception; optional live Mistral smoke remains manually gated.

## Validation

- Compose-backed PostgreSQL integration proves the success path and every stated negative/retry/cancellation case.
- Inspect queued rows and persisted state to prove no raw PDF, source path, service secret, or provider credential is present.
- Confirm derived-asset references are bounded/rebuildable and source-cache deletion causes reprocessing rather than truth loss.

## Review checkpoint

- **Review question:** Can the existing Atlas/Bridge stack execute a secure, idempotent, provider-neutral PDF perception operation end to end while preserving all authority and privacy boundaries?
- **Downstream boundary:** A later SFE/domain ticket may consume `NormalizedDocument` only after BSS-BATCH-09.2 receives `PASS`.
- **Commit to review:** Current BSS-BATCH-09.2 checkpoint commit.

## Implementation notes

- Added bounded, authenticated Atlas source-redemption and result-delivery HTTP clients to Agents Bridge. They keep the grant in the request envelope, enforce PDF/result byte limits, validate the source media type, and map transport failures to stable retryable errors without logging document or credential data.
- Wired `worker-main` to register the existing `atlas-document-perception-v1` pg-boss handler with the Mistral OCR capability and the Atlas clients. No second worker process, queue, or provider-owned storage path was introduced.
- Added the Compose-only Atlas internal middleware boundary backed by `PostgresPerceptionAuthority` and `LocalFilesystemDocumentStore`. The Cloudflare worker remains free of PostgreSQL/filesystem dependencies; the local Compose process exercises the framework-neutral Atlas route contract.
- Added service-credential, endpoint, byte-limit, document-store, and Mistral environment wiring to Compose and the sample environment. The Dockerfile now copies tracked pnpm patches and the document-store workspace manifest before dependency installation.
- Added focused client tests and a PostgreSQL-backed synthetic PDF integration test covering authenticated redemption, source verification, provider retry, normalized result delivery, cache persistence, acknowledgement replay, cache invalidation, and metadata-only queue inspection.

## Validation completed

- Full `@atlas/agents-bridge` test script: pass; DB-gated legacy worker test skipped when `DATABASE_URL` is unset, while the new integration passed directly against the healthy local Compose PostgreSQL instance.
- Agents Bridge, Atlas Core, Atlas DB, and DocumentStore typechecks: pass.
- PostgreSQL-backed BSS-009-02 integration: pass against the local Compose database.
- `docker compose config --quiet`: pass.
- `docker compose build`: pass.
- Rebuilt `docker compose up -d`: all four services healthy; Atlas UI and Bridge readiness endpoints returned HTTP 200.

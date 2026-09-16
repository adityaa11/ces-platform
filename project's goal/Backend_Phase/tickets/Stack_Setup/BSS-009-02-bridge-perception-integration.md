# BSS-009-02: Bridge perception integration and proof

- **State:** `planned`
- **Review batch:** BSS-BATCH-09.2
- **Depends on:** BSS-009-01 / BSS-BATCH-09.1 `PASS`, BSS-008 / BSS-BATCH-08 `PASS`
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§7–8, 12–13, 15–16, 19, 21–22

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
- **Commit to review:** Pending implementation commit.

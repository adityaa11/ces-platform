# BSS-009-01: Atlas perception authority

- **State:** `planned`
- **Review batch:** BSS-BATCH-09.1
- **Depends on:** BSS-009 / BSS-BATCH-09 `PASS`
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§7–8, 12–13, 19, 21–22

## Outcome

Make Atlas the persistent authority for a perception execution: create its operational record, issue/redeem its grant through an authenticated internal boundary, and idempotently store its rebuildable normalized result/cache without granting Bridge direct Atlas persistence authority.

## Scope

- Atlas repository implementation for `document_perception_execution`, source-grant metadata, normalized-result cache, and derived-asset references;
- persistent operation state transitions and stale-result fencing;
- authenticated, request/response-bounded internal source-redemption and result-handoff routes in the existing Atlas Compose-managed process;
- source redemption through BSS-007 `DocumentStore`, with no local path disclosure;
- derived cache lookup, invalidation, deletion/reprocessing behavior, and derived visual asset references separate from immutable source documents;
- stable internal errors and redacted logging.

## Acceptance criteria

- Atlas persists only metadata and normalized/derived state; raw PDF bytes are never stored in queue or ordinary PostgreSQL transport fields.
- Source and result routes require the deployment-managed Bridge service credential and reject unauthenticated, wrong-execution, expired, tampered, oversized, and stale requests.
- A matching result is accepted once; acknowledgement-loss replay is idempotent; a different result for the completed execution is rejected.
- Cache identity includes source SHA-256, normalized contract version, and perception capability/config identity. Cache deletion never changes immutable source data or trusted project truth.
- Bridge's restricted database role cannot write Atlas perception/cache tables.

## Validation

- PostgreSQL repository integration covers execution creation, state changes, grant expiry/scope, completion replay, cache invalidation, and Bridge-role write denial.
- Route tests cover service authentication, request bounds, redaction, and no machine-specific storage path/body exposure.
- `docker compose up` starts the required existing services; no new standalone perception service is introduced.

## Review checkpoint

- **Review question:** Does Atlas exclusively and securely own perception operational state, source redemption, result handoff, and rebuildable cache persistence?
- **Commit to review:** Pending implementation commit.

# BSS-007: DocumentStore foundation

- **State:** `planned`
- **Review batch:** BSS-BATCH-07
- **Depends on:** BSS-001
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§2, 13, 17, 21; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2.md) — Sections 2–3, Cross-Cutting: Evidence & Provenance

## Outcome

Keep immutable project document bytes behind a storage-neutral DocumentStore contract and provide the baseline's initial local filesystem adapter.

## Scope

- Create the `packages/document-store` contract and local filesystem implementation.
- Store source bytes under a generated storage key in the local `.atlas-data/documents` area or an explicitly configured equivalent outside source-controlled files.
- Calculate and return a content hash, byte size, and media type needed by the calling Atlas service.
- Make accepted objects immutable through the adapter contract; changes create a new object/key rather than overwrite accepted bytes.
- Keep local filesystem paths private to the adapter. Do not expose machine-specific paths as document identity or business meaning.
- Design the contract for a future S3/R2 adapter, but do not select or implement a hosted provider in this ticket.
- This ticket adds no standalone process: the adapter must run inside its owning Compose-managed service and must not require a separate local boot command.

## Acceptance criteria

- The same DocumentStore contract can be implemented by the local adapter and a future object-store adapter without changing Atlas Core.
- Writing and reading a document returns byte-identical contents and a stable cryptographic content hash.
- Attempting to overwrite an accepted storage key is rejected; path traversal and unsafe caller-provided paths cannot escape the configured storage root.
- Local document bytes are excluded from Git and are not stored in PostgreSQL.
- Storage metadata returned to Atlas uses a storage key and content metadata, never an absolute local path.
- Ticket documentation identifies local filesystem storage as a development adapter; a durable S3-compatible adapter is required before production document persistence.
- The adapter introduces no additional Compose service or manual boot prerequisite beyond `docker compose up` for its owning service.

## Validation

- Run adapter conformance tests for write/read, hash verification, immutability, path traversal rejection, and root isolation.
- Verify local stored bytes are not included in a build artifact or source-control status.
- Run type-check and tests for the document-store package and directly affected integration targets; the ticket-set fixture-suite exclusion applies.

## Review checkpoint

- **Review question:** Can immutable source bytes be stored and retrieved through a storage-neutral interface using the initial local adapter?
- **Combined acceptance:** The local adapter passes conformance/security-boundary tests, paths remain private to the adapter, and the production storage follow-up is explicit.
- **Commit to review:** Pending implementation commit.

# BSS-007: DocumentStore foundation

- **State:** `approved`
- **Review batch:** BSS-BATCH-07
- **Depends on:** BSS-001
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§2, 13, 17, 21; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md) — Sections 2–3, Cross-Cutting: Evidence & Provenance

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
- **Reviewed implementation checkpoint:** `113fe4cffa5819f522b640918643f4d3d9eb7c6e`
- **Commit to review:** `HEAD` (the BSS-007 remediation checkpoint).

## Implementation checkpoint

- Added `@atlas/document-store`, a persistence-neutral `DocumentStore` contract and development-only local filesystem adapter. The adapter generates opaque `documents/<UUID>` keys, returns SHA-256 content metadata, and never exposes its configured local root.
- The adapter accepts only generated document keys, writes with exclusive creation semantics, and rejects duplicate writes and traversal-shaped keys before filesystem access.
- Local document bytes default to `.atlas-data/documents`, which is ignored by Git. A durable S3-compatible adapter is required before production document persistence; it must implement the same `DocumentStore` contract.

## Validation record

- `corepack pnpm --filter @atlas/document-store typecheck` passed.
- `corepack pnpm --filter @atlas/document-store test` passed: 2/2 covering byte/hash fidelity, private storage metadata, immutable-key rejection, traversal rejection, and root isolation.
- `.atlas-data/` is excluded through the repository `.gitignore`; the adapter introduces no Compose service or manual boot step.

# PCC-002: DocumentStore-backed project creation

- **State:** `planned`
- **Review batch:** `PCC-BATCH-02`
- **Depends on:** PCC-001 `PASS`; BSS-007 `approved`
- **Execution environment:** Docker Compose is authoritative for PostgreSQL transactions, DocumentStore integration, migration checks, and package tests; host-local commands are diagnostic only.
- **Baseline:** `SRC-PCC-02` §§10–18, 28–31, 36–37, 42, 44–47; `SRC-PCC-03` §§1–2; `SRC-PCC-04`

## Outcome

Implement the server-side Atlas project-creation operation that accepts an
already authenticated creator and validated project/PRD command, stores every
PRD through the approved `DocumentStore` contract, and commits one coherent
Atlas project state only after all source writes succeed.

This is the application/domain seam used by the later HTTP route. It does not
parse browser requests, render UI, enqueue perception, or claim that extraction
has started.

## Scope

- Add a production-safe project-creation command/service under the repository's existing Atlas Core/application boundary.
- Validate the stable Project ID, project name/description limits, at least one PRD, PDF media type, non-zero bytes, per-file 20 MiB maximum, bounded file count, and bounded total request payload at the service boundary as well as at the transport boundary.
- Convert accepted upload bytes to `Uint8Array` and call `DocumentStore.put({ bytes, mediaType: "application/pdf" })` for every PRD. The service must not construct storage keys or filesystem paths.
- Normalize the BSS-007 `sha256:<64 lowercase hex>` result into the Atlas document metadata representation deliberately; do not create competing source-hash values.
- After every `put` succeeds, run one PostgreSQL transaction that creates the project, owner membership, empty Master, Initial Draft, and one document metadata row per stored PRD.
- Keep the source document's original filename as untrusted metadata only. It is not a storage key, filesystem path, primary key, or authorization identity.
- Map duplicate Project IDs to a stable domain conflict for the later HTTP boundary. Do not introduce a second idempotency system unless the existing interface proves it is required.
- Preserve the BSS-007 contract. Do not add delete/rollback behavior to `DocumentStore` merely to simulate a distributed transaction.
- Return only a bounded created-project summary that is safe for the route/UI; do not return storage keys, raw bytes, local paths, cookies, or database errors.

The service must not create `document_perception_execution`,
`document_perception_source_grant`, `normalized_document_cache`, semantic,
review, CES, publication, or pg-boss records, and must not submit
`atlas-document-perception-v1`.

## Creation ordering contract

```text
authenticate upstream
  -> validate all metadata and bytes
  -> preflight Project ID availability
  -> DocumentStore.put for every PRD
  -> one PostgreSQL transaction
       project
       owner membership
       empty Master
       Initial Draft
       document metadata
  -> commit
  -> return bounded summary
```

If storage fails, no Atlas project/domain rows are committed. If PostgreSQL
fails after source writes, no partially visible project may reference those
objects. Unreferenced storage cleanup is explicitly deferred; it is not a
reason to weaken visibility safety or silently redesign BSS-007.

## Acceptance criteria

- A valid command with one or more bounded PDF byte payloads stores each source through `DocumentStore.put` and never writes directly to `.atlas-data`.
- Every stored document metadata row retains stable document identity, project/Initial Draft relation, original filename, opaque storage key, normalized raw SHA-256, byte size, media type, creator, and creation time.
- The successful operation creates the creator's owner membership, an empty Master, an Initial Draft, and all source metadata in one committed Atlas transaction.
- The service rejects missing/invalid metadata, zero-byte files, non-PDF content, spoofed obvious non-PDF payloads, per-file sizes over 20 MiB, empty file sets, excessive file count, and unbounded total input.
- Project ID uniqueness is enforced by the database and the service exposes a stable conflict result for a duplicate, including concurrent duplicate attempts.
- A failing `DocumentStore.put` leaves no visible project, membership, workspace, or document metadata rows.
- A failing PostgreSQL transaction leaves no visible partial project; any already-written object is not treated as Atlas project authority.
- The returned summary contains no raw bytes, storage key, filesystem path, session cookie, database URL, raw SQL, or stack trace.
- The service does not submit `atlas-document-perception-v1` or any other queue job, call Agents Bridge, create perception state, or announce extraction.
- Existing BSS-007 byte immutability and read fidelity remain unchanged.

## Validation

- Start and health-check PostgreSQL through Docker Compose before any transaction or integration test. Run the service, database, and DocumentStore checks inside the Compose-managed `atlas` service; do not substitute host-local or fixture-only evidence.
- Add unit tests with a fake `DocumentStore` and repository/transaction seam covering call order, all-file storage before transaction start, metadata/hash normalization, and bounded result mapping.
- Add failure tests proving storage failure and transaction failure cannot make a project visible.
- Add a PostgreSQL-backed integration test proving one committed project contains one owner, one empty Master, one Initial Draft, and one document row per stored PRD.
- Read each stored object through the `DocumentStore` seam in integration coverage and compare byte identity, media type, byte size, and source digest.
- Inspect Atlas and pg-boss tables after successful creation to prove no perception/extraction state was created.
- Run `@atlas/core`, `@atlas/db`, and `@atlas/document-store` typechecks/tests plus migration/permissions checks in Compose containers.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-PCC-002-01` Better Auth identity has already been resolved upstream; the service receives a server-derived user ID and does not authenticate credentials.
- `BOUNDARY-PCC-002-02` Atlas owns project state and PostgreSQL metadata; BSS-007 owns immutable bytes; BSS-009 remains a later execution boundary.

### Trust boundaries

- `TRUST-PCC-002-01` Authenticated user identity and transport-validated upload content cross into the domain operation.
- `TRUST-PCC-002-02` DocumentStore-returned integrity metadata crosses into Atlas metadata and must remain bound to the exact bytes written.
- `TRUST-PCC-002-03` Two independent persistence systems cross an intentional visibility boundary: source writes precede Atlas commit.

### Sensitive assets and identity context

- `ASSET-PCC-002-01` PRD bytes, source hashes, filenames, storage keys, and project ownership metadata require bounded handling and no content logging.
- `IDENTITY-PCC-002-01` The owner record must bind to the server-provided Better Auth user ID, not a request field or client state.

### Required seams

- `SEAM-PCC-002-01` Keep the service independent from HTTP/FormData so transport parsing and domain orchestration remain separately testable.
- `SEAM-PCC-002-02` Keep `DocumentStore` and Atlas repository dependencies injected through interfaces so a later durable object-store adapter does not change project semantics.
- `SEAM-PCC-002-03` Keep source-write-before-transaction ordering visible and testable without pretending to provide distributed rollback.

### Prohibited couplings

- `COUPLING-PCC-002-01` Do not move PostgreSQL or filesystem calls into React/client code or make the service know the local adapter root.
- `COUPLING-PCC-002-02` Do not accept caller-controlled storage keys, project-derived paths, base64 fixture JSON, or raw PDF database columns.
- `COUPLING-PCC-002-03` Do not enqueue perception or give Agents Bridge authority as a side effect of project creation.

### Intentionally unresolved security policy

- `SEC-GAP-PCC-002-01` Orphan-object cleanup, retention, deletion, malware scanning, and full document-security baseline remain future operational/security work; this ticket preserves safe non-visibility.

### Mandatory review bindings

- `REV-READY-PCC-002-01`
  Ref: `SEAM-PCC-002-03`
  Question: Is project visibility impossible until all required source writes succeed and the Atlas transaction commits?
  Evidence: ordered service code and storage/database failure tests.
- `REV-READY-PCC-002-02`
  Ref: `SEAM-PCC-002-02`
  Question: Can the local DocumentStore be replaced without changing project/domain semantics or exposing storage paths?
  Evidence: injected interfaces, fake-store tests, and changed-file review.
- `REV-READY-PCC-002-03`
  Ref: `COUPLING-PCC-002-03`
  Question: Is the project-creation operation free of pg-boss, Bridge, perception, semantic, review, and publication side effects?
  Evidence: negative integration assertions and queue/table inspection.

## Review checkpoint

- **Review question:** Does the server-side creation operation durably bind all uploaded immutable source metadata to one authorized Atlas project without exposing partial state or starting downstream processing?
- **Combined acceptance:** All source writes precede one Atlas commit; failures remain non-visible; the creator owns the project; Master/Initial Draft/documents are distinct; and BSS-007/BSS-009 boundaries remain frozen.

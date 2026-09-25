# PCC-001: Atlas project domain and persistence

- **State:** `approved`
- **Review batch:** `PCC-BATCH-01`
- **Depends on:** BSS-003 and BSS-004 `approved`; BSS-007 `approved`
- **Execution environment:** Docker Compose is authoritative for PostgreSQL, migrations, repository integration tests, and package checks; host-local commands are diagnostic only.
- **Baseline:** `SRC-PCC-01`, `SRC-PCC-02` §§5–9, 14–17, 30–31, 38–42; `SRC-PCC-03` §§1–2; `SRC-PCC-04`

## Outcome

Introduce the minimum persistence-neutral Atlas contracts and PostgreSQL/Drizzle
implementation needed to represent a real project, creator membership, empty
Master, Initial Draft, and immutable source-document metadata. The repository
must support authorization-scoped project listing without exposing Drizzle to
Atlas Core.

This ticket establishes records and repository seams only. It does not accept
uploads, expose an HTTP route, wire `/home`, call `DocumentStore`, enqueue
pg-boss work, or create perception state.

## Scope

- Add persistence-neutral Atlas Core contracts for project creation records, project membership, Master/Initial Draft workspace identities, document metadata, and authorized project listing.
- Add the next repository-consistent Atlas migration after the approved BSS migration sequence. Do not edit or rewrite an approved BSS migration.
- Add explicit Atlas tables or an equivalent normalized representation for `project`, `project_member`, `workspace`, and `document` responsibilities.
- Keep the submitted stable Project ID unique at the database boundary. An internal primary key may be separate from that human-facing key.
- Persist the creator's Better Auth user ID as the owner membership identity. Do not create organization, editor, viewer, invitation, or sharing state.
- Represent an empty Master and an Initial Draft as distinct durable identities. Do not create a fake published revision or advance a Master HEAD merely to populate a card.
- Persist per-document identity, project/workspace relation, original filename metadata, opaque storage key, normalized raw SHA-256, byte size, media type, creator, and creation time.
- Keep raw PDF bytes out of PostgreSQL and keep storage keys private to server-side/domain metadata.
- Expose an authorization-scoped repository query for `list projects accessible to current user`; do not require browser filtering.
- Keep all Drizzle-specific schema/query code in `packages/atlas-db`; keep domain interfaces in `packages/atlas-core`.

Do not add production project sharing, project deletion/replacement, workspace switching, revision/publication state, SemanticCandidates, review projection data, CES state, or a second authentication system.

## Acceptance criteria

- The domain contracts distinguish project, owner membership, empty Master, Initial Draft, and uploaded source-document metadata.
- A project record preserves the stable 3–48-character Project ID and the database rejects duplicate IDs regardless of browser state.
- Membership stores the Better Auth user ID and owner role without requiring a pre-existing project role.
- Master and Initial Draft are separate records with no accepted semantic revision or published Master work for a newly created project.
- Document metadata has a stable identity suitable for later BSS-009 `artifact_id` use and contains the storage identity needed for later authorized perception.
- The schema stores the normalized 64-character lowercase source digest, byte size, `application/pdf` media type, original filename metadata, project/workspace relation, creator, and creation time without storing source bytes.
- `list projects accessible to current user` is enforced by a membership join or equivalent server-side query and never by returning all projects to the browser.
- Atlas Core imports no Drizzle types or PostgreSQL query details.
- The migration is additive, ordered after the approved migrations, and leaves the existing auth and perception tables intact.
- No pg-boss row, perception execution, source grant, normalized cache, semantic candidate, review, CES, or publication row is created by this ticket.

## Validation

- Start `postgres` through Docker Compose and wait for a healthy service before running migration or repository checks. Run all DB-backed checks and affected package commands inside the Compose-managed `atlas` service; do not use a direct host database connection as checkpoint evidence.
- Run the Atlas DB migration check in the supported Docker Compose environment and verify the new migration applies idempotently after the approved BSS sequence.
- Add Atlas Core contract tests for stable project identity, owner membership, distinct Master/Initial Draft identities, document metadata, and authorization-scoped listing inputs.
- Add PostgreSQL-backed repository tests proving duplicate Project ID rejection, owner membership persistence, project isolation between two user IDs, and absence of raw PDF bytes in Atlas rows.
- Verify the storage-key and source-hash fields can later satisfy the BSS-009 handoff identity without exposing a local filesystem path.
- Run directly affected `@atlas/core` and `@atlas/db` typechecks/tests plus the existing migration/permissions checks in Compose containers.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-PCC-001-01` Better Auth owns authentication identity/session records; Atlas may reference the authenticated user ID but does not own credentials or cookies.
- `BOUNDARY-PCC-001-02` PostgreSQL is the canonical Atlas metadata store; BSS-007 owns immutable source bytes and `@atlas/fixtures` remains non-production authority.
- `BOUNDARY-PCC-001-03` Agents Bridge and pg-boss cannot write trusted Atlas project state.

### Trust boundaries

- `TRUST-PCC-001-01` A server-resolved Better Auth user ID becomes an Atlas membership identity.
- `TRUST-PCC-001-02` Opaque storage metadata crosses from the DocumentStore-backed application seam into Atlas metadata without becoming a client-visible path or business identity.

### Sensitive assets and identity context

- `ASSET-PCC-001-01` Storage keys, source digests, original filenames, and project membership metadata require server-side handling and bounded output.
- `IDENTITY-PCC-001-01` The creator identity must remain the Better Auth user ID; no fixture identity, browser state, or inferred role may satisfy the repository contract.

### Required seams

- `SEAM-PCC-001-01` Repository interfaces must allow a later service to compose DocumentStore writes with one Atlas transaction.
- `SEAM-PCC-001-02` The authorization-scoped project-list query must remain server-side so later policy can attach without a browser-wide project dump.
- `SEAM-PCC-001-03` Document metadata must expose a stable artifact/document identity and source-integrity fields for the later BSS-009 handoff without exposing storage paths.

### Prohibited couplings

- `COUPLING-PCC-001-01` Do not put Drizzle queries or PostgreSQL types into Atlas Core.
- `COUPLING-PCC-001-02` Do not store raw PDF bytes, filesystem paths, fixture records, or client-supplied storage keys in trusted project rows.
- `COUPLING-PCC-001-03` Do not make authentication success imply project membership beyond the explicit owner record created by the later project-creation operation.

### Intentionally unresolved security policy

- `SEC-GAP-PCC-001-01` Organization policy, invitation/sharing policy, role matrix beyond owner creation, retention/deletion, and full security-baseline controls remain future work.

### Mandatory review bindings

- `REV-READY-PCC-001-01`
  Ref: `SEAM-PCC-001-01`
  Question: Can the later creation service use repository contracts without coupling Atlas Core to Drizzle or DocumentStore internals?
  Evidence: Core interfaces, DB adapters, and transaction/repository tests.
- `REV-READY-PCC-001-02`
  Ref: `SEAM-PCC-001-02`
  Question: Is project listing authorization-scoped in PostgreSQL rather than deferred to the browser?
  Evidence: repository query and two-user isolation test.
- `REV-READY-PCC-001-03`
  Ref: `COUPLING-PCC-001-02`
  Question: Are raw bytes, local paths, fixture state, and caller-controlled storage identities absent from Atlas persistence?
  Evidence: schema review, migration tests, and negative metadata assertions.

## Review checkpoint

- **Review question:** Does Atlas have the minimum real project/membership/workspace/document metadata boundary needed for project creation while preserving BSS authority and keeping raw source bytes outside PostgreSQL?
- **Combined acceptance:** The additive schema and persistence-neutral contracts support authorized project reads and distinct empty Master/Initial Draft/source metadata, with no upload route, fixture authority, or perception execution introduced.
- **Implementation checkpoint:** Remediation commit `cedb520` (`fix(atlas): remediate PCC-001 CK-001 and CK-002`); `PCC-BATCH-01` `PASS` is recorded in [the consolidated review](../../../feedback/PCC-BATCH-01-cedb520-review.md), and the ticket was approved by explicit user authorization after CK Round 2.

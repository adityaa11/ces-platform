# BSS-009: Document Perception foundations

- **State:** `awaiting_review`
- **Review batch:** BSS-BATCH-09
- **Depends on:** BSS-006, BSS-007, BSS-008
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§7–8, 12–13, 15–16, 19, 21–22
- **Architecture guardrails:** [Atlas Core Architecture — Updated Checkpoint](../../atlas-core-architecture-checkpoint-v2.md), especially Evidence & Provenance, the Agents Bridge provider boundary, and the Canonical Document Processing Pipeline

## Scope-split decision

On 2026-09-16 the original BSS-009 program-sized pipeline ticket was split with explicit user approval. This checkpoint freezes the reusable contract, authorization, normalization, and queue foundations. The remaining runnable Atlas handoff and end-to-end integration work is owned by [BSS-009-01](BSS-009-01-atlas-perception-authority.md) and [BSS-009-02](BSS-009-02-bridge-perception-integration.md).

This is a scope partition, not a change to the Document Perception architecture. The complete series still ends at a rebuildable Atlas-owned `NormalizedDocument` and does not perform Semantic Extraction.

## Outcome

Establish the bounded, provider-neutral primitives that later series tickets compose into the production-shaped Document Perception path:

```text
immutable PDF identity
      |
      v
execution-scoped opaque source grant
      |
      v
metadata-only document-perception job
      |
      v
existing BSS-006 pg-boss lifecycle
      |
      v
BSS-008 atlas.document.perceive capability
      |
      v
provider-neutral NormalizedDocument
```

## In scope

- versioned, bounded, path-free `DocumentPerceptionRequest` and `NormalizedDocument` contracts;
- PDF-first source identity: artifact ID, SHA-256, MIME type, and byte size;
- Atlas-only execution-scoped, short-lived, opaque source-grant primitive;
- bounded source read and SHA-256/byte-size/MIME verification primitive;
- provider-neutral normalization preserving localized pages, blocks, tables, visual regions, confidence, and derived-asset references without semantic assertions;
- metadata-only `atlas-document-perception-v1` registration on the existing pg-boss worker, sharing BSS-006 retry, timeout, cancellation, shutdown, and lease/idempotency behavior;
- an endpoint-neutral Atlas handoff service that scopes redemption and validates/idempotently accepts matching normalized results;
- minimum Atlas operational migration shape and BSS-006 compatibility amendment required by the foundations.

## Explicitly deferred

BSS-009 itself does not add a production Atlas repository, internal HTTP routes, service authentication, Bridge HTTP clients, worker-main perception handler, Compose smoke path, derived-asset storage implementation, or persistent cache reuse/invalidation. Those are required series outcomes and are owned by BSS-009-01 and BSS-009-02.

The full series also excludes semantic extraction, SemanticCandidates, reconciliation, CES, workflow/fact projections, chat behavior, approval/publication, HEAD mutation, final S3/R2 selection, embeddings, and golden-fixture/SFE validation.

## Acceptance criteria

- Contracts reject filesystem paths, raw source bytes, provider model selection, malformed identities, and semantic payload leakage.
- Source grants are opaque, bounded, execution/document scoped, tamper resistant, and never reveal a DocumentStore key.
- Atlas source verification rejects unsupported MIME, byte-size overflow, size mismatch, and SHA-256 mismatch before provider submission.
- Normalization emits a schema-valid provider-neutral `NormalizedDocument` and accepts no unbounded/provider-hosted asset URL.
- The perception queue payload contains only idempotency metadata and a valid request; it contains no bytes or storage path.
- The existing pg-boss worker can register and execute the perception queue with the BSS-006 fence, without a second queue implementation or Atlas database write authority for Bridge.
- An Atlas-owned handoff primitive validates source/result execution identity and accepts the same completion idempotently while rejecting stale or conflicting completion.
- No BSS-009 code creates semantic assertions, trusted Atlas state, a SemanticCandidate, or a HEAD mutation.

## Validation

- Contract, grant, source-handoff, normalization, and handoff unit tests pass with a BSS-owned synthetic PDF payload.
- The Agents Bridge PostgreSQL integration suite passes against the Compose PostgreSQL service, including duplicate metadata-only perception job execution through the existing worker.
- Repository-wide TypeScript typechecking passes.
- The BSS-006 migration amendment reruns cleanly against an already-migrated local database.

## Local PostgreSQL validation note

All database-backed validation for the BSS-009 series, including BSS-009-01 and BSS-009-02, must use the existing Compose PostgreSQL instance through host port `55432`:

```text
Host connection:    127.0.0.1:55432
Container port:     5432
Database:           atlas_dev
Atlas URL:          postgresql://atlas:atlas_local_dev_only@127.0.0.1:55432/atlas_dev
Bridge URL:         postgresql://agents_bridge:agents_bridge_local_dev_only@127.0.0.1:55432/atlas_dev
```

Start the database with `POSTGRES_PORT=55432 docker compose up -d postgres` and use the local sample credentials from `.env.example` or explicitly supplied local environment variables. The tracked sample and Compose default also use `55432`. From the host, set `DATABASE_URL` and, where required, `AGENTS_BRIDGE_DATABASE_URL` to the `55432` URLs above before running migrations or PostgreSQL integration tests. Services running inside Compose must continue to connect to `postgres:5432`; `55432` is the host-mapped port only. Never commit real credentials.

## Review checkpoint

- **Review question:** Are the Document Perception contracts, bounded source-handoff primitives, provider-neutral normalization, and existing-worker queue foundation safe for later Atlas-owned endpoint and integration work without exposing source paths/bytes or semantic authority to Agents Bridge?
- **Combined acceptance:** All criteria above pass while BSS-006 through BSS-008 boundaries remain intact.
- **Downstream boundary:** BSS-009-01 may begin only after BSS-BATCH-09 receives `PASS` and the user issues `go`.
- **Commit to review:** Current BSS-BATCH-09 checkpoint commit.

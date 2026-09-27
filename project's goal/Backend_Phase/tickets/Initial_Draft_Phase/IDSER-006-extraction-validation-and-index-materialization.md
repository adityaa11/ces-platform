# IDSER-006: Extraction validation and index materialization

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-06`
- **Depends on:** IDSER-004 and IDSER-005 `PASS`; IDSER-001/002/003 inherited.
- **Baseline:** SRC-IDSER-01 sections 14.1, 16-19, 23, 25, 29-31, 35-37, 41.4; AC-06/13/14/15/17/24/25/33/34/35. See [README](README.md).
- **Execution environment:** Docker Compose for perception acceptance, semantic persistence/index and queue checks.

## Outcome

Connect accepted BSS-009 perception to semantic extraction and persist only
Atlas-validated complete extraction results, stable candidates, evidence and
retrieval anchors. All materialized rows remain candidate/reviewable state.

## Inspected seams and edit scope

- Extend `packages/atlas-core/src/perception-authority.ts`, `document-perception.ts` integration and new semantic validation/acceptance modules; preserve the NormalizedDocument contract and normalizer behavior.
- Compose `packages/atlas-db/src/perception-authority.ts` delivery transaction with the IDSER-003 transaction seam and semantic stage scheduling.
- Implement the extraction acceptance handler behind IDSER-004 and focused repositories/index materialization under Core/DB.
- Bind `apps/atlas/perception-internal.ts` and semantic internal wiring to these implementations; no new OCR/provider path.

## Scope

- On valid perception delivery for the current bundle document, atomically persist existing normalized perception state, mark the perception execution complete, create the extraction execution/capability and enqueue `atlas.semantic.extract/v1`. Perception deliveries unrelated to IDSER retain the approved BSS behavior.
- Preserve an execution-bound reference/snapshot of the exact NormalizedDocument needed for later evidence validation; source-hash/capability cache reuse cannot substitute mismatched execution/artifact identities or changed locator sets.
- Apply Bridge schema validation plus independent Atlas envelope, semantic schema, scope, evidence, source-accounting, idempotency and fingerprint validation before writes.
- Verify each evidence page exists; locator exists on that page; type matches; document/execution matches; and text/table excerpt, when supplied, is consistent with that source. Visual references require actual normalized visual locators, not invented textual quotes.
- Account for every non-empty normalized block/table and meaningful/labeled supplied visual. Reject missing source units, nonexistent destinations, duplicate conflicting inventory identities, dangling candidates or invalid `non_fact` reasons. A non-fact-only document may have zero candidates with complete accounting; do not invent project meaning.
- Assign/derive stable canonical semantic IDs only after validation. Store an auditable local-to-canonical mapping; exact replay reuses IDs, while a new execution attempting to reuse completed logical identity conflicts.
- In one acceptance transaction persist the full validated JSON/provenance/source hash/fingerprint, candidate rows with JSONB payloads/source wording, evidence rows and deterministic knowledge-index anchors.
- In that same transaction create the reconciliation execution/context identity and enqueue `atlas.semantic.reconcile/v1`. Exact bounded context selection and binding are completed in IDSER-007; pending reconciliation cannot execute successfully without it. No best-effort post-commit enqueue.
- Preserve questions and `needs_resolution`; do not convert source disagreement into technical failure or select a winner during extraction.
- Implement persistence-neutral reads for candidate by stable ID, bounded scoped candidate listing, semantic-key/kind retrieval and candidate evidence. Use relational index rows for normal serving, with full JSON retained for audit/revalidation/reindexing.
- Keep every read project/workspace/bundle/document scoped and capped as in README; no normal full-result reparsing or PDF rereads for future projection/chat serving.

## Acceptance criteria

1. Perception acceptance and extraction enqueue commit together; duplicate perception delivery schedules no second extraction execution/job.
2. Valid extraction produces complete result JSON plus stable candidate/evidence/index rows with source and execution provenance.
3. Invalid schema, evidence, excerpt, source accounting or scope produces no accepted partial state or reconciliation job.
4. Identical extraction replay has identical IDs/counts and one continuation; different completion fingerprints conflict without overwrite.
5. Atomic persistence/enqueue failure rolls back all extraction effects and remains redeliverable through Bridge replay.
6. Addressable bounded reads supply evidence-backed candidate data for later review projections/chat without implementing those consumers.

## Validation

- Synthetic NormalizedDocument cases for text, tables, meaningful visuals, empty/non-fact-only content, unresolved meaning and contradictory statements in one PDF.
- Negative tests for invented page/block/table/visual IDs, wrong locator type, inconsistent excerpts, missing inventory, dangling/duplicate local IDs and cross-document evidence.
- PostgreSQL integration tests count complete result/candidate/evidence/index rows and inspect provenance/mapping, including concurrent identical delivery and conflicting second results.
- Inject failure after each materialization step and before/at reconciliation enqueue; prove transaction rollback and successful later replay without duplicates.
- Verify shared-hash normalized cache handling across executions and projects; reindex from retained full result without altering canonical IDs.
- Query tests prove scope filters and stable bounded reads; run Core, DB, contracts and directly affected perception/semantic worker checks in Compose.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** Atlas accepts derived state, Bridge supplies untrusted output, BSS-009 owns normalization and immutable documents remain source evidence.
- **Trust boundaries / assets:** provider candidate assertions -> Atlas deterministic validation -> materialized rows; evidence text, semantic payload and provenance.
- **Identity context:** normalized-source identity, full scope, execution/version, local/canonical candidate mapping and fingerprint.
- **SEAM-IDSER-006-01:** Pure schema/evidence/accounting validation stays separable from persistence and orchestration.
- **SEAM-IDSER-006-02:** Atomic result/candidate/evidence/index/continuation writes and stable mapping allow deterministic replay and audit.
- **COUPLING-IDSER-006-01:** No accepting provider IDs as canonical, silently omitted evidence, hash-only cross-scope cache identity, or UI-specific semantic copy.
- **Unresolved security policy:** later explicit rebuild/retention policy is deferred; normal bounded serving must not depend on it.
- **Planning findings:** PLAN-IDSER-04 is resolved by exact execution-bound normalized evidence.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-006-01 | SEAM-IDSER-006-01 | Are all evidence/accounting failures rejected before persistence? Source-grounded negative tests. |
| REV-READY-IDSER-006-02 | SEAM-IDSER-006-02 | Do rollback/replay tests prove stable IDs and atomic continuation? Real DB/queue evidence. |
| REV-READY-IDSER-006-03 | COUPLING-IDSER-006-01 | Do reads and cache reuse preserve scope/provenance without fabricated meaning? Cross-scope/query tests. |

## Review checkpoint

**Question:** Can only valid source-grounded extraction create stable queryable
semantic state, with atomic reconciliation scheduling and replay-safe effects?

**Implementation checkpoint:** Not started; record commit and Compose evidence.

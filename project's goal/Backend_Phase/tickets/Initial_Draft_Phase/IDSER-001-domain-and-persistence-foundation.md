# IDSER-001: Domain and persistence foundation

- **State:** `awaiting_review`
- **Review batch:** `IDSER-BATCH-01`
- **Depends on:** PCC-006 `PASS`; approved BSS-003/005/006/007/008/009 boundaries.
- **Baseline:** SRC-IDSER-01 sections 6-8, 18-19, 21, 25-26, 33, 35-37; AC-03/04/15/16/22/33/36. Source IDs are defined in [README](README.md).
- **Execution environment:** Docker Compose for migrations, permissions, persistence and package checks.

## Outcome

Provide additive Atlas-owned bundle, semantic execution/result, candidate,
evidence, relationship and index storage, plus Bridge-owned semantic replay
storage. Preserve existing project/workspace/document identities and prepare
workspace compatibility without implementing branching or revision authority.

## Inspected seams and edit scope

- Extend `packages/atlas-core/src/project.ts` and add persistence-neutral bundle/semantic/reconciliation/retrieval contracts under `packages/atlas-core/src/`.
- Extend `packages/atlas-db/src/schema.ts`, add focused repository adapters under `packages/atlas-db/src/`, and export them through package entry points as needed.
- Add ordered SQL migrations after `0008_pcc001_document_workspace_integrity.sql`; retain prior migration content unchanged.
- Extend database permissions and repository tests. No provider runtime, UI, source-byte writes or queue activation in this ticket.

## Required storage contract

Use the canonical logical names below. Existing Atlas tables use singular snake
case, so no alternative naming is needed. Any physical naming deviation must
retain an explicit logical mapping in the implementation checkpoint.

| Record | Minimum persisted data |
|---|---|
| `atlas.extraction_bundle` | `id`, `project_id`, `workspace_id`, `state`, `semantic_contract_version`, `reconciliation_contract_version`, `expected_document_count`, `completed_document_count`, `created_at`, `started_at`, `completed_at`, `last_failure_code`, `last_failure_at` |
| `atlas.extraction_bundle_document` | `bundle_id`, `document_id`, `sequence`, `state`, `perception_execution_id`, `semantic_extraction_execution_id`, `semantic_reconciliation_execution_id`, `started_at`, `completed_at`, `last_failure_code`, `last_failure_at` |
| Atlas semantic execution / context capability | Stable execution ID, project/workspace/bundle/document scope, stage, contract/skill version, logical idempotency identity, lifecycle, authorized context identity/fingerprint, capability validity, completion fingerprint and safe failure metadata; exact record split belongs to the adapter |
| `atlas.semantic_extraction_result` | `id`, `execution_id`, `project_id`, `workspace_id`, `bundle_id`, `document_id`, `contract_version`, `source_sha256`, provider provenance, `result_json JSONB`, `completion_fingerprint`, `created_at` |
| `atlas.semantic_candidate` | `id`, `extraction_result_id`, `project_id`, `workspace_id`, `bundle_id`, `document_id`, `semantic_key`, `kind`, `payload JSONB`, `normalized_meaning`, optional `source_wording`, `needs_resolution`, candidate-only `state`, `created_at` |
| `atlas.semantic_evidence` | `id`, `semantic_candidate_id`, `document_id`, `page_number`, `locator_type`, `locator_id`, optional `excerpt`, `created_at` |
| `atlas.knowledge_index` | Stable semantic ID and indexed project/workspace/bundle/document/semantic-key/kind anchors, joined to evidence/relationships through dedicated records |
| `atlas.semantic_reconciliation_result` | `id`, `execution_id`, `project_id`, `workspace_id`, `bundle_id`, `current_document_id`, `contract_version`, provider provenance, `result_json JSONB`, `completion_fingerprint`, `created_at` |
| `atlas.reconciliation_relationship` | `id`, `reconciliation_result_id`, `project_id`, `workspace_id`, `bundle_id`, `source_semantic_id`, optional `target_semantic_id`, `relationship_type`, `payload JSONB`, `requires_resolution`, `created_at` |
| Bridge semantic result replay | Stage idempotency identity, execution identity, validated structured envelope/provenance, fingerprint and operational delivery/cleanup metadata under `bridge`; no credentials, source keys or PDF bytes |

Retain source inventory/questions in full extraction JSON. Preserve a durable
local-candidate-ID to canonical-semantic-ID mapping so the full result and
addressable rows can be audited/reindexed without changing identities.

## Scope and invariants

- Replace global workspace `(project_id, kind)` uniqueness with uniqueness limited to system `master` and `initial_draft` classifications. Current creation still produces exactly one of each, atomically. Keep type/schema extension seams for future ordinary workspaces; do not add a creation API, base semantics or fake revision IDs now.
- Add display-name metadata independent of kind/identity, populate existing system names as display values only, and do not reserve `Initial Draft` or use display names in lookup/authorization keys.
- Permit bootstrap `draft -> ready_for_review`; retain Master `empty`. Future revision/base fields are deferred until real revision FKs/authority exist.
- Enforce project/workspace/document scope with relational constraints. Wrong-scope membership, result, evidence and relationship references must fail; preserve the PCC-001 composite document/workspace integrity rule.
- Enforce unique document membership/sequence within a bundle and positive sequence/counts. One bootstrap cohort gets one bundle through an explicit bootstrap association; do not impose one-bundle-per-workspace as a universal constraint or deduplicate future bundles by file hash.
- Provide manifest immutability once processing starts, with deterministic state transitions and locking/constraints usable by later tickets.
- Enforce one logical stage identity per `(bundle_id, document_id, stage, contract_version)` and one accepted completion fingerprint. Permit identical replay; prevent another execution from taking a completed logical identity.
- Bundle states: `waiting`, `processing`, `ready_for_review`, `needs_attention`. Member states: `pending`, `perception_queued`, `perceiving`, `extracting`, `reconciling`, `completed`, `needs_attention`.
- Keep JSONB for semantic payloads and complete results; use relational records for scope/provenance/links/lifecycle. Neither domain-specific SQL columns for every fact nor a single opaque blob is sufficient.
- Existing PCC records migrate without new semantic work, inferred upload order, accepted knowledge, changed IDs or automatic bundle backfill.

## Acceptance criteria

1. Additive migrations preserve populated PCC/BSS data and all required columns/relationships above exist.
2. Same display names cannot merge identity; system uniqueness remains enforced without global ordinary-kind uniqueness. Future ordinary kinds can be added without rekeying existing workspaces.
3. Manifest mutation after start, duplicate stage completion, wrong-scope references and impossible counts/states are rejected.
4. Complete results and independently queryable semantic/evidence/relationship/index records coexist; stable ID mapping is recoverable.
5. `agents_bridge` cannot directly read/discover or mutate Atlas semantic state; its replay/idempotency records remain Bridge-owned. Atlas uses only inherited queue producer privileges.
6. No revision, HEAD, publication, resolved knowledge, projection or conversation record is introduced.

## Validation

- Compose migration check plus apply/upgrade against populated PCC-shaped data; verify migration order and unchanged historical migration files.
- Database-backed tests for cross-project/workspace/bundle FKs, document-evidence scope, sequence uniqueness, manifest immutability, bootstrap uniqueness, candidate lifecycle and logical completion uniqueness.
- Verify duplicate display wording and future-kind extensibility without adding a production ordinary-workspace flow.
- Permissions tests using actual Atlas/Bridge roles, including denied Atlas semantic access from Bridge and allowed Bridge replay operations.
- Typecheck Core/DB; register focused persistence test scripts. Tests must inspect real PostgreSQL state, not only mocked SQL strings.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** BSS role separation, PCC membership/document scope and immutable DocumentStore bytes.
- **Trust boundaries / assets:** database roles cross persistence namespaces; source-derived semantic payloads, evidence and operational capabilities are sensitive.
- **Identity context:** project/workspace/bundle/document/execution/semantic IDs plus contract version.
- **SEAM-IDSER-001-01:** Persistence-neutral Core interfaces preserve later policy attachment without exposing database handles to UI/Bridge.
- **SEAM-IDSER-001-02:** Composite scope integrity, stable identity mapping and additive migrations remain independently verifiable.
- **COUPLING-IDSER-001-01:** No Bridge trusted-state SQL, display-name authority, business-fact column explosion or fake revision lineage.
- **Unresolved security policy:** broad retention/deletion and future revision policy remain deferred; preserve rebuild metadata without choosing those policies.
- **Planning findings:** PLAN-IDSER-02 is addressed by scoped uniqueness and display metadata, not ordinary-workspace behavior.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-001-01 | SEAM-IDSER-001-02 | Do scope, uniqueness and populated migration tests preserve IDs and prevent cross-scope links? Database evidence. |
| REV-READY-IDSER-001-02 | COUPLING-IDSER-001-01 | Are Bridge permissions denied and future truth/revision authority absent? Role tests and migration review. |
| REV-READY-IDSER-001-03 | SEAM-IDSER-001-01 | Can application consumers use these records without importing SQL/Drizzle adapters? Contract/import review. |

## Review checkpoint

**Question:** Does the additive foundation preserve authority and identity while
supporting the entire candidate pipeline and future bounded reads?

**Implementation checkpoint:** Implemented additive Core contracts and an
Atlas-only semantic-foundation repository seam, plus migrations 0009-0012 for
display metadata, scoped bundle/candidate/evidence/index/reconciliation state,
Bridge-owned semantic replay, lifecycle/manifest checks, and role isolation.
Validated in Compose with healthy PostgreSQL: migration application succeeded;
`test:semantic-foundation` passed 1/1 and `test:permissions` passed 1/1;
Core and DB typechecks passed and `git diff --check` passed. The existing
`test:project-repository` run was contaminated by a prior failed test's
unrelated leftover test row (`3 !== 2` expected global `documents/%` count),
not an IDSER assertion; rerun it against a clean Compose database during CK.
No provider runtime, queue activation, UI, source-byte writes, or review state
was added. **Next state:** `awaiting_review`; CK is required before IDSER-002.

## CFC remediation checkpoint

- **CK source:** `project's goal/feedback/IDSER-BATCH-01-8f89626-review.md` (`CHANGES_REQUIRED`).
- **Addressed findings:** `CK-001` limits post-start immutability to membership identity fields while allowing member lifecycle updates. `CK-002` adds composite relational scope keys and foreign keys through bundle membership, execution, extraction, candidate, evidence, index, reconciliation, and relationship records.
- **Next state:** `awaiting_review`; CFC does not decide the CK result.

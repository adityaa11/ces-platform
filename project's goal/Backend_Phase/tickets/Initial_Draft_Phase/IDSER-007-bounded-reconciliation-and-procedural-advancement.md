# IDSER-007: Bounded reconciliation and procedural advancement

- **State:** `awaiting_review`
- **Review batch:** `IDSER-BATCH-07`
- **Depends on:** IDSER-003, IDSER-004, IDSER-005 and IDSER-006 `PASS`.
- **Baseline:** SRC-IDSER-01 sections 19-25, 29-32, 36, 41.5-41.7; AC-17/18/19/20/21/22/23/24/25/26/33/34/35. See [README](README.md).
- **Execution environment:** Docker Compose for scoped retrieval, relationship persistence, queue and concurrency tests.

## Outcome

Reconcile each document's candidates against themselves and a bounded relevant
incoming neighborhood from prior documents in the same bundle. Persist valid
relationships, count the document complete, and schedule only its next manifest
member in one Atlas transaction.

## Inspected seams and edit scope

- Implement Core retrieval/reconciliation services and DB adapters over IDSER-001/006 index/evidence/candidate records.
- Complete IDSER-004 reconciliation context construction and result handler; wire IDSER-006 extraction continuation to the real selector.
- Reuse IDSER-003 transactional perception scheduling and BSS-006 queue producers for the next document.
- Add no vector provider, accepted-base loader, model verifier, projection runtime or new infrastructure.

## Neighborhood selection contract

- Load all current-document candidates by authorized execution scope, capped at 500; the current set must not be silently reduced. Include same-document candidates even for the first PDF.
- Select only prior incoming candidates whose documents precede the current sequence in the same project/workspace/bundle and have validated prior completion. Exclude later documents, other bundles and empty Master as a supposed accepted base.
- Define deterministic v1 retrieval using indexed `semantic_key`, `kind`, workspace/bundle and document scope. At minimum use exact semantic-key matches and a bounded same-kind expansion; order exact matches first, then same-kind matches, breaking ties by persisted document sequence and semantic ID. Tie-break order is retrieval order, never truth precedence.
- Select at most 500 prior candidates, 1,000 candidates overall and 1 MiB serialized context including required evidence/provenance/identities. Stable selection must fit complete records with usable evidence; never truncate fields into misleading context. Record selection version, actual IDs, counts/byte limits and overflow/truncation-of-neighborhood metadata.
- If the complete current set or its required evidence cannot fit, fail technically. A bounded prior selection may omit lower-ranked neighbors with explicit selection metadata; `new` means no relevant relationship in the authorized selected neighborhood, not proof that the whole project has no related meaning.
- Bind selected context to the reconciliation execution before provider use. Replay/context fetch must receive the same authorized set; do not issue normal all-project scans or reparse full extraction JSON.
- Keep neutral Core APIs for semantic item/evidence lookup, scoped key/kind search, relationship traversal and bundle/document filtering with 100-record pages. This is the foundation for PRD Lens and later projection/chat context, not those features themselves.

## Result acceptance and advancement

- Validate schema, execution/skill/version/scope, fingerprint and every referenced canonical ID against the exact authorized context. An ID existing elsewhere in the same bundle is insufficient if it was not authorized for that execution.
- Require reconciliation accounting for every current candidate; unrelated candidates use `new`. Permit multiple relationships and valid empty reconciliation when extraction has zero candidates and complete non-fact accounting.
- Validate `new`, `supports`, `duplicates`, `refines`, `extends`, `contradicts`, `supersedes`, `partially_supersedes`, `ambiguous`, `requires_resolution`. Store evidence-grounded proposals without deterministic/model winner selection. Supersession cannot be inferred from document/page order.
- Preserve same-PDF and cross-PDF contradictions and unresolved flags. No candidate is accepted or erased because another supports, duplicates or supersedes it.
- Atomically persist complete reconciliation JSON/provenance/fingerprint and independently addressable relationship rows; mark the current member `completed`; recompute/advance X exactly once; and create/enqueue the next member's BSS-009 perception execution/grant/job.
- Lock/compare the active bundle/document state so concurrent callbacks cannot skip sequence or schedule D2 before D1 reconciliation commits. Other bundles remain independently concurrent.
- For the final member, invoke the completion validator in the same transition; IDSER-008 supplies that implementation. Until it exists, final completion must fail closed/roll back, never mark review-ready based only on X=N.
- Same-result replay is a no-op acknowledgement; conflicting fingerprint/second execution or enqueue/persistence failure leaves no partial progress/next job.

## Acceptance criteria

1. Same-document relationships work with no prior candidates; cross-document context is bounded, reproducible and isolated by stable IDs.
2. All current candidates are accounted for and all references belong to authorized context; over-limit and invented-reference cases fail safely.
3. Full reconciliation results and relationship rows remain unresolved/reviewable proposals with no automatic precedence.
4. A document becomes processed only after its validated extraction/evidence/index and reconciliation/relationships exist.
5. D2/D3 perception cannot be scheduled before prior reconciliation completion; duplicate delivery never increments X or schedules a stage twice.
6. Scoped retrieval/evidence/relationship reads support future shared semantic consumers without PDF rereads or normal unbounded scans.

## Validation

- Deterministic semantic cases for all ten relationships, one-PDF conflicting quotas, support/duplicate across PDFs, refinement/extension and evidence-supported versus unsupported supersession.
- Reject missing candidate accounting, invented IDs, an existing but unselected same-bundle ID, and cross-project/workspace/bundle references.
- Boundary tests at 500/1,000 candidates and 1 MiB including multibyte payload/evidence; repeat selection to prove stable IDs/order/overflow metadata and no silent current-candidate loss.
- Real DB/queue tests for three-document ordering, concurrent distinct bundles/users, same workspace display wording, duplicate callbacks, rollback before next enqueue and worker restart.
- Query plan/index evidence on representative multi-document data; prove key/kind/scope queries and relationship/evidence traversal use bounded addressable rows.
- Assert no accepted base, resolved truth, projection or Master mutation; final completion integration is required by IDSER-008.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** Atlas-owned retrieval/identity, incoming-only bootstrap scope and Bridge result delivery through Atlas.
- **Trust boundaries / assets:** Atlas-selected neighborhood -> provider relationship proposals -> Atlas acceptance; cross-document semantic/evidence data.
- **Identity context:** authorized context ID set, selection version, bundle sequence, semantic IDs and execution fingerprint.
- **SEAM-IDSER-007-01:** Deterministic bounded selection and exact-context validation preserve future authorization/budget seams.
- **SEAM-IDSER-007-02:** Transactional relationship/progress/next-job transition supports replay and per-bundle concurrency.
- **COUPLING-IDSER-007-01:** No all-history prompts, cross-bundle context, order-as-truth, embeddings prerequisite or provider scheduling authority.
- **Unresolved security policy:** accepted-base/revision/dependency retrieval policy belongs to later phases; current fields remain explicitly incoming.
- **Planning findings:** none blocking; numeric bounds and deterministic selection are frozen engineering choices for this v1 slice.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-007-01 | SEAM-IDSER-007-01 | Is context bounded/reproducible and every reference authorized? Boundary/isolation/query evidence. |
| REV-READY-IDSER-007-02 | SEAM-IDSER-007-02 | Are relationships, counts and next jobs atomic under races/replay? PostgreSQL/queue tests. |
| REV-READY-IDSER-007-03 | COUPLING-IDSER-007-01 | Are conflicts preserved without order-based truth selection? Same/cross-document semantic fixtures. |

## Review checkpoint

**Question:** Does incremental reconciliation preserve all current candidate
accounting and advance one ordered bundle safely without leaking or resolving
meaning outside its authority?

**Implementation checkpoint:** the GO handoff commit
`feat(idser): add bounded reconciliation advancement`; Compose
PostgreSQL/pg-boss acceptance evidence and the Review Contract Closure are recorded in
`project's goal/feedback/IDSER-BATCH-07-go-checkpoint.md`.

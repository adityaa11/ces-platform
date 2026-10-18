# IDSER-012-02-04 — Qualified stepwise document aggregation and truthful lifecycle

> **SUPERSEDED — NON-EXECUTABLE (2026-10-19).** Scope deferred to Atlas/SEM accepted-lifecycle successor; OPEN-A still blocks, not IDSER-012-03.
> **Successor:** [IDSER-012-03](IDSER-012-03-semantic-batch-planner-ghr-contract-hard-stop.md); [complete original RC disposition](IDSER-012-03-requirement-disposition.md). Original body below is archival context, NOT an active GO/CK/authority. Approved IDSER-012-01 and historic evidence unchanged.


- **State:** `superseded` (2026-10-19); archived historical specification, not executable.
- **Batch:** `IDSER-BATCH-12-02-04`
- **Dependencies:** IDSER-012-02-03 independent CK PASS; valid source/plan/REL/deferred composite; bounded explicitly authorized staged reconciliation/acceptance policy reconciled with SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE.
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)

**Binding prospective authority:** [SEM-CUTOVER winner](../../../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md) and [IDSER semantic successor map](../../../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md). The sole extraction engine is SEM-CUTOVER-007A eight-stage stepwise v0.3.1 with `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0`, strict combined `semantic_proposal + relationship_proposals`, REL-03 → SEM-006 → SEM-005 qualification and fenced composite replay. PERC-RESET-008/approved IDSER-012-01 own the accepted RUN-003 `NormalizedDocument v1` and derived assets. BSS-V2-005 owns generic external-provider planning; BSS-V2-006 owns durable admitted attempts. Retired BSS-V2-004-03-05 consolidated CK and legacy `prompt-003/v1` packet/byte parity are **not** successor dependencies.

## Outcome: exact qualified partition, not fabricated completeness

Aggregate fully accounted validated per-batch fragments into one **source/hash-bound document-level SEM-007A qualified acceptance disposition** through Atlas's existing authenticated acceptance authority. Retain same shared strict stepwise v0.4.0 compiler/finalizer/composite contract and Atlas-owned candidate/evidence/index validation—no new truth writer or second semantic engine.

- **All-canonical:** accept only exact independently grounded Semantic V1 result, with one Atlas-owned candidate/evidence/index materialization and replay-safe delivery under the applicable *approved* policy.
- **`partial_accepted`:** accept a genuine non-null canonical subset and exact, disjoint `essential_dependent_deferred` coverage for the remaining eligible source locators. Only canonical candidates materialize; deferred source is never changed to `non_fact`, guessed truth or accepted relationship.
- **`qualified_deferred`:** preserve source/composite/revision/sidecar hashes and complete deferred coverage with **no** canonical Semantic V1, candidate/evidence/index, delivery envelope, reconciliation execution/job or apparent `semantic_ready`/technical-failure/ready-for-review state.

**OPEN-A (must be explicitly resolved before GO):** Approved `SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE` RC-DA-03 allows partial outcomes with canonical candidates to enqueue reconciliation; RC-DA-06 preserves existing full-canonical extraction/reconciliation behavior. Planned staged IDSER demanded `semantic_ready` and **zero** reconciliation job. These statements are not automatically compatible. Seek an expressly authorized versioned Atlas/SEM staged lifecycle/acceptance policy *without altering approved DA or legacy accepted behavior by implication*. A staged-no-auto-reconcile seam is a possible proposal **only**, not a decision. Never silently suppress or create reconciliation jobs, relabel a deferred outcome or claim an unapproved lifecycle state.

## Review contract

| ID | PASS iff / failing negative |
| --- | --- |
| `RC-0120204-01` | Exact canonical-plus-deferred **partition** covers each eligible normalized locator once with only valid owned batches; missing/duplicate/foreign/stale/overlap/context-owned or unqualified deferral rejects atomically. |
| `RC-0120204-02` | Deterministic fragment stitching preserves scope/conditions, independent/dependent REL direction, revision lineage, deferred partition and exact composite/sidecar/plan hashes; no semantic repair. |
| `RC-0120204-03` | Full canonical and partial qualified outcomes materialize only permitted grounded candidates/evidence/index exactly once; fully deferred produces **zero** semantic result/candidate/evidence/index/reconcile. |
| `RC-0120204-04` | Explicit approved staged policy establishes truthful full/partial/qualified-deferred state and reconciliation job counts **without weakening** SEM RC-DA-03/04/06 or normal non-staged acceptance. Until approved: FAIL/BLOCKED, never unconditional `semantic_ready` PASS. |
| `RC-0120204-05` | Independent multi-document/bundle operation and shared BSS capacity remain correct, no D1-reconciliation gating for D2 *perception*, no premature Ready-for-Review, Master, publication, chat or CES. |
| `RC-0120204-06` | Foreign source/asset, altered plan/revision/coverage, cancellation, restarted/stale lease and lost postcommit ack are tested with real scope-bound DB/route side-effect counters and once-only hash-fenced replay. |

## Security and hard stop

Untrusted Bridge staged fragments must cross a service-authenticated Atlas-owned hash/coverage/accepted-context boundary; Bridge cannot mutate trusted state directly. Prove isolated migrated PostgreSQL plus real internal Atlas route with all-canonical, mixed canonical+deferred, fully deferred, changed/replayed fingerprints and honest job counts. No secrets/source/media bytes in metadata. Reconciliation remains a separate maintained capability, not extraction fallback.

**STOP `ACCEPTANCE_POLICY_DECISION_REQUIRED` before GO.** No ticket update silently changes approved SEM acceptance, user-review state, Master or historical lifecycle regression. A later independent CK must verify the *authorized* policy.

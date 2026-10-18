# IDSER-012-02-03 — BSS-admitted execution using sole SEM-007A stepwise engine

> **SUPERSEDED — NON-EXECUTABLE (2026-10-19).** Scope deferred to future GHR/SEM batch-intake and BSS-admitted execution successors, not IDSER-012-03.
> **Successor:** [IDSER-012-03](IDSER-012-03-semantic-batch-planner-ghr-contract-hard-stop.md); [complete original RC disposition](IDSER-012-03-requirement-disposition.md). Original body below is archival context, NOT an active GO/CK/authority. Approved IDSER-012-01 and historic evidence unchanged.


- **State:** `superseded` (2026-10-19); archived historical specification, not executable.
- **Batch:** `IDSER-BATCH-12-02-03`
- **Dependencies:** IDSER-012-02-01/02 independent CK PASS, BSS-V2-006-04 admission CK PASS, BSS-V2-004-03-06 review CK PASS AND semantic meaning result PASS. Neither alone suffices.
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)
- **Bound consumer implementation context:** [IDSER-012-02 BSS consumer integration context](../../IDSER-012-02-BSS-CONSUMER-INTEGRATION-CONTEXT.md) §5–7; BSS owns operational retry/pressure, SEM owns semantic qualification, Atlas owns later acceptance.

**Binding prospective authority:** [SEM-CUTOVER winner](../../../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md) and [IDSER semantic successor map](../../../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md). The sole extraction engine is SEM-CUTOVER-007A eight-stage stepwise v0.3.1 with `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0`, strict combined `semantic_proposal + relationship_proposals`, REL-03 → SEM-006 → SEM-005 qualification and fenced composite replay. PERC-RESET-008/approved IDSER-012-01 own the accepted RUN-003 `NormalizedDocument v1` and derived assets. BSS-V2-005 owns generic external-provider planning; BSS-V2-006 owns durable admitted attempts. Retired BSS-V2-004-03-05 consolidated CK and legacy `prompt-003/v1` packet/byte parity are **not** successor dependencies.

## Binding no-second-provider-send handoff (2026-10-18 planning-only)

After independent 006-04 CK and planner/activation qualification, each `PlannedSemanticCorpusHandoff` is redeemed by **one SEM-owned authorized batch intake** and registered as reference/hash-bound BSS logical work. The **only** provider outbound authorization for this admitted semantic work is `ProviderWorkAdmission/v1` -> BSS-006 reserved attempt -> existing 03A pg-boss transport claim -> qualified outbound adapter. The returned provider content belongs to the **same** SEM-CUTOVER-007A `runStepwiseSemanticComposition` semantic qualification engine; BSS owns only typed operational feedback and usage/pressure, not semantic results/acceptance.

**Explicit cutover proof required:** existing ordinary `runSemanticJob` / `runOrdinaryStepwiseSemanticExtraction` provider-send branch and BSS admitted-job callback cannot both independently send a request for the *same logical semantic batch*. At the downstream integration gate, either securely route the SEM shared transport through BSS's already reserved send seam or fence off the old ordinary send entry point for admitted batch work, proving no direct adapter bypass with positive/negative fake provider counters, restart and lost-ack replay. Preserve separately approved ordinary/non-batch behavior until its own cutover is authorized; do not delete or reclassify previous CK evidence. No additional semantic engine, independent quota limiter, queue/worker or second provider retry loop is authorized. If the 006-04 adapter/result hand-back is not actually callable/qualified, STOP `BSS_RUNTIME_ADMISSION_CONTRACT_GAP`; if scoped SEM intake is not qualified, STOP `SEM_BATCH_CORPUS_INTAKE_GAP`. Future reconciliation uses the same admitted send/feedback API under its own workload, not this semantic-specific packet. [Generic 006-04 handoff](../Stack_Setup_V2/BSS-V2-006-04-integrated-provider-admission-runtime-checkpoint.md).

## Outcome

For each validated batch, register one idempotent logical provider work item and explicit attempts with the current source/plan/profile/quota/fairness/request-envelope identity. **Only after** a BSS-V2-006 durable reservation against the active BSS-V2-005 DesiredAdmissionProfile may the neutral route perform one external transport attempt. Every retry is a separately admitted attempt; denied/deferred admission emits zero transport.

Invoke **the same SEM-007A ordinary stepwise composition/execution** (shared `runStepwiseSemanticComposition` seam) that builds the v0.4.0 source packet and relationship envelope, parses the combined `semantic_proposal + relationship_proposals`, uses SEM-006 trusted-context, REL-03 relationship revisions, SEM-005 source/evidence accounting and qualified canonical/deferred composite projection. No independent batch extractor, provider-specific business logic, legacy replay/default, parser, finalizer, hidden retry or correction model call. An image-bearing batch must use qualified current media grants; meaningful unseen visuals and essential dependent meaning remain honestly deferred.

Stage one fenced non-authoritative batch fragment with exact plan, slot ownership, REL revision-set, deferred/sidecar and composite hashes. **This child cannot accept document-level Semantic V1 or materialize Atlas candidates/evidence/index or reconciliation jobs**; -02-04 owns that later boundary. The known SEM-007A shared builder missing provider-facing prior provisional revisions is a **SEM-owned STOP** when a cross-batch relationship relies on it.

## Review contract

| ID | PASS iff / failing negative |
| --- | --- |
| `RC-0120203-01` | One logical work item per batch; idempotent attempts bind document/source/plan/profile/domain/stable bundle fairness; no secret/source payload in BSS admission metadata. |
| `RC-0120203-02` | One valid BSS-V2-006 reservation per outbound attempt against live active plan; deferred/denied zero outbound; retry never reuses a reservation, no hidden HTTP adapter retries. |
| `RC-0120203-03` | Exact -03-06-qualified **SEM-007A shared** builder, strict v0.4.0 REL envelope/parser, projection and composite replay; legacy/unknown/Anoman-only alternate execution rejects before transport. |
| `RC-0120203-04` | Owned-slot-only source_results, context-only no output ownership, correct image and accepted-context grants, cross-batch relationship direction/condition/provisional/deferred accounted; foreign/missing/duplicate fails before stage. |
| `RC-0120203-05` | One fenced staged fragment per batch across cancellation, restart and lost ack; zero premature Atlas candidate, evidence, index, `semantic_ready`, reconciliation, Master/publication effects. |
| `RC-0120203-06` | Unknown usage, expiry, terminal provider failure and late response are handled under BSS-V2-006 conservative once-only capacity accounting; no false document success. |
| `RC-0120203-07` | Cross-batch relationship and image/no-image fixtures use the sole SEM engine with exact QUALIFIED profile and explicit deferred/canonical identities; no payload shape fallback. |

## Planned Corpus consumption (prospective, 2026-10-16)

Consume exactly **one durable planner `PlannedSemanticCorpusHandoff` per semantic work item**, binding `batchId`, plan/source/perception hash, owned/context/REL/asset references, resource envelope and active compatible process/workload/desired-plan version. SEM-CUTOVER must redeem **only the planned corpus slots** through its separately authorized batch-intake seam; a provider cannot receive the entire PDF by accidentally calling the historical whole-document builder. Admission may wait under BSS-V2-006 runtime pressure, but cannot silently re-size an immutable corpus or dispatch without a new reserved attempt. On qualified result, downstream identity is **per-batch Qualified Semantic Handoff**, distinct from document-wide accounting. This ticket remains a non-truth stage, with no premature reconciliation preparation. If the batch SEM intake/acceptance version is not separately approved and proven, STOP `SEM_BATCH_CORPUS_INTAKE_GAP` rather than assuming v0.4.0 bytes can change. [Decision](../../../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md).

## Runtime admission consumer seam (prospective 2026-10-16)

This ticket is a **consumer of the BSS-V2-006-04 qualified `ProviderWorkAdmission/v1` contract**, not an owner of retry/quota scheduling. See [BSS consumer interface checkpoint](../../bss-provider-consumer-contract-checkpoint-20261016.md). Each qualified planned corpus is registered as one immutable logical work reference with batch/plan/request-envelope hashes, source-authorized process/workload/route/fairness scope and explicit attempt ordinal. Every actual provider transmission requires the BSS-owned reserved dispatch gate and matching lease; merely reading BSS-V2-005 policy or BSS-V2-006 effective constraint **never authorizes a call**. On provider 429/Retry-After, usage unknown or cooldown, the adapter emits typed operational feedback and the semantic consumer gets a durable waiting/pressure/terminal outcome. Any permitted retry is a **new BSS-admitted attempt** under bounded policy, not an SDK or SEM-local implicit retry. A semantic JSON/schema/meaning rejection is a separate **semantic qualification failure**, not evidence of provider capacity pressure. Real SEM batch corpus/Qualified Handoff qualification and OPEN-A acceptance remain separate authorization gates.

| ID | PASS iff / failing negative |
| --- | --- |
| `RC-0120203-08` | Actual SEM consumer seam binds to the independently CK-qualified **BSS-V2-006-04** runtime API, not direct provider dispatch or a copied planning snapshot; deterministic 429/unknown-usage/deadline tests prove typed pressure vs semantic-failure separation, new attempt/new reservation for retries and **zero calls on denied work**. |
| `RC-0120203-09` | Two semantic batches from one PDF admit/retry **independently** under BSS (one reserved attempt per outbound transport), preserving exact planned corpus/REL/media hashes and staged non-truth output; 429 with/without metadata cannot create unsolicited retries or wait for another batch, and malformed/meaning-invalid success is SEM-qualified failure **not** BSS rate-limit recovery. Staging does **not** claim Qualified Semantic Batch Handoff or reconciliation authority while OPEN-A remains blocked. |

## Security, required evidence and stop

Trust boundary is Atlas-granted source/media→SEM-007A; BSS-V2-005 active plan→BSS-V2-006 reservation→one HTTP attempt; untrusted response→strict composite→non-truth stage. Never send raw credentials or PRD content to queue/CK logs. Require loopback fake plus isolated PostgreSQL lifecycle/replay with **non-inert** zero/one counters. No automatic D1 semantic activation is implied. **STOP** on unproven provisional context reuse, unqualified image model or missing live semantic PASS; do not reroute extraction to legacy.

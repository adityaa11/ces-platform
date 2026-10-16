# IDSER-012-02 — BSS planning/read and admitted-runtime consumer integration context

- **Status:** `prospective / contract-aligned / NOT_IMPLEMENTED`; authored 2026-10-16 for future GO, CFC and CK. This file does **not** authorize implementation, provider calls, live spending, a model/route activation, or CK PASS.
- **Owner:** IDSER-012-02 orchestration; no transfer of ownership of BSS resource policy, SEM-CUTOVER extraction methodology, Atlas semantic acceptance or reconciliation.
- **BSS source contract:** [BSS provider consumer hard-stop checkpoint](bss-provider-consumer-contract-checkpoint-20261016.md).
- **Semantic winner:** [SEM-CUTOVER winner ledger](../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md) and [IDSER successor owner map](../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md).
- **Source/visual predecessor:** approved PERC-RESET-008 + IDSER-012-01-03-02, preserving authorized `NormalizedDocument V1` / derived-asset identity.
- **Authority precedence:** where older IDSER document-level sequencing, `semantic_ready`, automatic reconciliation or legacy packet language conflicts with this **prospective** design, **do not execute either assumption**. Preserve OPEN-A as an explicit HMN / lifecycle approval prerequisite. Existing SEM-CUTOVER-007A deferred acceptance and qualified-deferred/partial-accepted behavior are not changed here.

## 1. Consumer readiness is NOT the same as a documented hard stop

**BSS-V2-005-04: approved** immutable `DesiredAdmissionProfile` publish/activate/read hard stop. **BSS-V2-005-05: planned** `CapacityPlanningSnapshot/v1` read-only, process-agnostic authenticated consumer seam and registered-process/capacity policy convergence. **BSS-V2-006-01/02: CK-approved** provider-work/window and fair atomic attempt dispatch foundations; **BSS-V2-006-03 original: withdrawn**; **BSS-V2-006-03A: planned** internal admitted-job, feedback/accounting, scoped pressure and wakeup successor. **BSS-V2-006-04: planned** validated `RuntimeCapacityConstraint/v1` read plus `ProviderWorkAdmission/v1` durable consumer service. The three versioned names are **proposed contract labels**, not existing source exports or a claimed executable API.

A ticket may reference these future interfaces **now**, but real IDSER admission or source sizing must stop on missing consumer implementation and independent CK evidence. A read snapshot is **never** a reservation, a quota decrement or outbound-send permission.

## 2. Integration diagram and independent hard stops

```text
Perception worker: PDF -> authorized NormalizedDocument V1 -> perceived
                               |
                               v
BSS-005-05 CapacityPlanningSnapshot/v1 [read-only: policy, structural bounds]
BSS-006-04 RuntimeCapacityConstraint/v1 [read-only: optional current constraints]
                               |
                               v
IDSER-012-02-01: Semantic Batch Planner
  exact per-document once-only owned corpus partition, context-only references,
  per-batch RequestResourceEnvelope / source-media-REL-policy hashes
                               |
              HARD STOP: immutable durable PlannedSemanticCorpusHandoff (each batch)
                               |
                               v
IDSER-012-02-02: qualified SEM process/workload/route/profile activation
  [no BSS attempt, no provider request, no semantic result]
                               |
                               v
IDSER-012-02-03: SEM batch consumption (future SEM-owned batch corpus intake)
   -> BSS-006-04 ProviderWorkAdmission/v1 work/attempt reservation/dispatch
   -> ONE admitted outbound transport -> normalized operational feedback to BSS
   -> strict SEM stepwise parse + REL/SEM meaning/source qualification
   -> fenced non-truth staged batch fragment (ticket -03 boundary)
                               |
                               v
  SEM/Atlas batch-scoped qualified acceptance [OPEN-A: NOT YET AUTHORIZED]
              HARD STOP: durable Qualified Semantic Batch Handoff
                               |
                               v
           Independent Reconciliation Preparation (later owner)
              -> prepared data queue -> Workspace single writer
```

An **eligible batch never waits for other batches of the PDF** before its independent preparation handoff. A background semantic worker is free to take its next admitted batch after its semantic hard stop. Full document source coverage remains a separate final audit, not a gate preventing individually eligible batch preparation. The `-03` non-truth staging contract **must not be silently renamed** to qualified acceptance or auto-create a reconciliation job.

## 3. IDSER-012-02-01 — planning-only capacity consumer

**Input:** authenticated Atlas source/asset grants; exact `NormalizedDocument V1` source locators; REL contextual/deferred reference versions; server-approved process/workload/route/quota domain; BSS-005-05 immutable policy snapshot. When eligibility feedback is genuinely required, consume BSS-006-04 **read-only** constraint snapshot and its effective-state version. Never require a provider reservation simply to decide batch boundaries.

**Allowed sizing information:** structural per-request maximum, prompt/system/REL/schema/output/media estimator versions and conservative overhead, effective authorized background lane/headroom/protected interactive reserve, separate RPM/TPM/RPD/concurrency and window-policy identity. Compute request-fit from structural and policy ceilings, **not** from transient "remaining tokens", arbitrary page counts, or non-authoritative provider guesses. A prospective **inactive but qualified** semantic workload planning view is allowed before `-02-02` route activation; it does not grant work execution.

**Output:** immutable document partition and individually durable `PlannedSemanticCorpusHandoff` per batch, exact owned/context-only slots, source/provenance hashes, relationship/asset versions, `RequestResourceEnvelope`, BSS policy snapshot/revision identity and bounded reconciliation-independent replay fence. **Zero attempts/reservations, quota counter mutation, provider calls, semantic candidates, qualified handoffs or reconciliation.**

**Policy changes:** temporary `429`, cooldown, depleted RPM/RPD window or remaining TPM means **wait at runtime**, never resize a previously qualified corpus plan silently. Verified per-request structural/profile/media bound reduction can invalidate it: only a **new versioned, source-authorized replan** is allowed, preserving once-only owner coverage and audit lineage; indivisible unfit source unit is explicitly BLOCKED.

**Read-only gate:** require BSS-005-05 snapshot CK (and BSS-006 effective read CK only when runtime constraint availability is in this ticket's GO scope). To require both immediately, record BSS-006-04 as a hard predecessor; to test planner-only sizing earlier, use separately qualified 005-05 snapshot and **do not claim provider admission readiness**. No direct Atlas role SQL access to Bridge operational tables or parallel IDSER quota planner.

## 4. IDSER-012-02-02 — promotion from planning-only to active consumer

This ticket uses BSS-005-05 registered process/workload/policy inputs and immutable desired-plan publication, then confirms the **actual active** plan revision is visible to BSS-006 via durable plan-change wakeup. Server-governed `serviceClass=background` and bundle fairness stay immutable. Never treat the planner's **inactive planning snapshot** as authorization to execute provider work.

Bind semantic profile/source/REL/schema/prompt/estimator/request-envelope identity to the activated version. A changed plan/route or model/media qualification invalidates waiting incompatible work by explicit version/fence, not by mutating a historical `PlannedSemanticCorpusHandoff`. **Hard stop:** real versioned process and desired policy active, zero attempts, zero provider sends, zero semantic output. Do not GO until BSS-005-05 / BSS-006-04 consumer implementation and actual required route/privacy/SEM qualification exist.

## 5. IDSER-012-02-03 / SEM-CUTOVER — operational runtime consumer

**Immutable work registration:** each `PlannedSemanticCorpusHandoff` becomes one idempotent logical semantic work item with source/plan/batch hashes, request resource envelope, server-selected route/profile/quota domain, stable bundle fairness and bounded budget. Reference-only BSS work metadata never includes PDF bytes, corpus text, embedded images, prompt bodies, keys or raw provider replies.

**Before transport:** redeem the exact authorized batch corpus through a **separately qualified SEM-owned batch intake** (the current whole-document source packet is not accepted as batch-scoped equivalence). Build/check prompt, strict schema and media/REL context under versioned resource envelope, compare active plan and effective constraints; register explicit attempt and await BSS-006-04 admission. A prior read of `CapacityPlanningSnapshot` or `RuntimeCapacityConstraint` is **not** permission to dispatch. Only the BSS-owned atomic attempt reservation/fenced dispatch may authorize **at most one** outbound transport per attempt. No hidden adapter/SDK auto-retry.

**On transport outcome:**

| BSS operational result | IDSER/SEM consumer behavior (prospective) |
| --- | --- |
| Waiting / denied by known RPM/TPM/RPD/concurrency / runtime cooldown | Persist waiting, release semantic worker for other admitted work, rely on BSS bounded wakeup/re-admission; zero provider send before reservation |
| HTTP 429 with valid `Retry-After` / lower-limit hints | Provider adapter emits trusted typed operational feedback, BSS applies durable scoped pressure; future attempt only with fresh reservation and explicit retry budget |
| 429 without meaningful headers, timeout or transport-may-have-started / unknown usage | BSS performs conservative accounting and bounded cooldown/probe; never infer zero cost or issue hidden retries; terminal uncertainty stays visible |
| Permanent invalid route/authorization/structurally unfit planned request | Typed blocked/terminal state with scoped owner; explicit new route/SEM qualification or versioned planner replan is required, never silent provider/model fallback |
| Provider transport success, but malformed JSON, incomplete REL, source/schema/semantic qualification fails | BSS accounts for provider usage/terminal transport; SEM owns meaning-failure disposition, its own bounded retry/requalification authority and honest deferred result. **Not** an automatic BSS rate-limit retry |
| Provider transport success and strict semantic qualification PASS | Stage exactly one fenced **non-truth batch fragment** under -03; future **qualified batch handoff/Atlas acceptance** still depends on separate OPEN-A decision |

**One-way seams:** operational failure/retry policy stays in BSS-006; semantic methodology/meaning evidence stays in SEM-CUTOVER; trusted acceptance/source-to-batch lifecycle stays in Atlas/IDSER. Provider policy drift from trustworthy source enters new BSS-005 profile revision through its owner; temporary BSS-006 clamp does not rewrite historical source/corpus or plan. Service-class protective reserve prevents semantic background work consuming user-waited interactive capacity.

**Hard stop:** -03 has only authorized, version/hash-fenced non-truth staged output with exact BSS attempt/reservation/operational-outcome audit and **no** materialized Atlas semantic accepted state or automatic reconciliation. The later semantic Qualified Handoff is another gate; do not collapse them merely to satisfy desired pipeline diagram.

## 6. Ordered GO/CK proofs — consumer-facing and independently bounded

| Owner/checkpoint | Direct evidence required; never a historical surrogate |
| --- | --- |
| BSS-V2-005-04 (approved) | Active `DesiredAdmissionProfile` immutable publication/read, no provider work; accepted predecessor, not evidence for a new consumer snapshot |
| BSS-V2-006-01/02 approved + BSS-V2-006-03A-01..06 planned | Durable exact windows, single-reservation dispatch, fair interactive protection, typed usage/429/cooldown and wakeup; no dependency on 005-05 CK |
| BSS-V2-005-05 (planned) | Authenticated `CapacityPlanningSnapshot/v1` read-only external fixture plus process registry and genuine 03A child-series plan wakeup; final CK only after 03A-01..06 CK |
| BSS-V2-006-04 (planned) | `RuntimeCapacityConstraint/v1` read + `ProviderWorkAdmission/v1` real isolated BSS consumer test with independent background/interactive fake callers; requires 005-05 CK, no actual semantic implementation |
| IDSER-012-02-01 (planned) | Qualified planner read, exact partition/replay, capacity-version hard stop and **non-inert zero** provider BSS attempt/reservation/job/transport counters. If runtime constraint read is mandatory for its selected scope, gate on 006-04 CK; no SEM provider invocation |
| IDSER-012-02-02 (planned) | Real background profile/route activation; frozen SEM-profile schema/source/REL hashes; BSS durable wakeup; **zero** provider transport and semantic result |
| IDSER-012-02-03 (planned) | Real BSS admitted **one attempt per transport** through shared SEM engine; staged batch-only fragment; 429/unknown usage and semantic-failure distinct typed paths; no Atlas acceptance |
| OPEN-A qualified-batch acceptance / independent preparation (not implemented) | Separate HMN/SEM/Atlas authorization and per-batch qualified-deferred/partial_accepted accounting, no fake or automatic reconciliation handoff; no implicit approval via BSS |

**Negative fixtures:** unknown/zero limit; stale/wrong-domain snapshot; forged interactive profile; BSS-read-induced counter mutation; no reservation send; duplicate attempt/reservation/retry; provider 429 with/without useful metadata; unknown possibly transmitted usage and loss of ack; plan downgrade and old batch incompatible; provider transport success/meaning-failure; background pressure with interactive arrival; authorized source/media/provisional-REL missing; multi-batch PDF with independent completion/replay. Tests prove exact counts on fake adapters and isolated Bridge PostgreSQL/pg-boss; preserve original language, chronology, modality and source/evidence identity.

## 7. Stop codes and excluded assumptions

- `BSS_CAPACITY_CONSUMER_READ_GAP`: BSS-005-05 snapshot read absent/unqualified, or missing exact authenticated structural/process/profile versions.
- `CAPACITY_PROFILE_BOOTSTRAP_GAP`: planning-only inactive workload cannot be qualified without falsely activating semantic route.
- `BSS006_CAPACITY_READ_GAP`: runtime constraint read is mandatory for approved planner GO scope but absent/unqualified.
- `BSS_RUNTIME_ADMISSION_CONTRACT_GAP`: BSS-006-04 consumer API/feedback/fenced attempt unavailable, so no semantic provider dispatch.
- `SEM_BATCH_CORPUS_INTAKE_GAP`: exact planned owned/context corpus and provider-facing REL/source/media/profile/prompt equivalence not separately CK-qualified; do not use whole document as a shortcut.
- `SEM_QUALIFIED_HANDOFF_OPEN_A`: staged fragment must not be relabeled accepted qualified batch or enqueued to reconciliation until the Atlas/SEM ownership/acceptance conflict receives explicit HMN.
- `UNQUALIFIED_SOURCE_RELATIONSHIP_GAP`: source grants/REL context, essential dependencies or visuals unavailable; defer/stop without guessing.

Never alter approved BSS-005-01..04, SEM-007A acceptance or historically CK-PASS artifacts to satisfy a future consumer interface. **This context clarifies dependency and hard-stop ownership only; implementation requires selected ticket GO, actual code and independent CK.**

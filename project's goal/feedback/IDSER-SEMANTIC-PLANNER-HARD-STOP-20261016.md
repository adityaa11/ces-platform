# Capacity-aware Semantic Batch Planner hard stop + process-agnostic BSS design (2026-10-16)

**Status:** user-directed **prospective ticket/architecture clarification only**. No GO, CFC, CK PASS, runtime authorization, BSS-V2-006 implementation, semantic job, provider call, database migration or deployment. Branch source was inspected at `891e79c4493044d29287f1ccf8ba7ff0d4a9014e`.

## Decision and boundary

The user-defined pipeline is **one Project/Workspace/Bundle with PDF documents**, independent queued Docling perception per PDF, a capacity-aware Semantic Batch Planner that may create **multiple batches per PDF**, **SEM-CUTOVER per batch**, durable **Qualified Semantic Batch Handoff per batch**, independent reconciliation preparation per qualified batch, and reconciliation single-writer state per workspace. No downstream completion may block perception from consuming its next queued PDF or a semantic worker from consuming its next admitted batch. Only the workspace reconciliation writer serializes its shared mutations. Base-workspace HEAD capture remains immutable for future non-Initial-Draft work and is **not** chosen dynamically from current Master.

**First hard stop to implement:** planner ends at durable `PlannedSemanticCorpusHandoff` **per batch**, with a whole-document exact ownership/coverage plan for audit. This is distinct from the later SEM-CUTOVER `Qualified Semantic Batch Handoff`; planner does not qualify semantic meaning, dispatch providers or reconcile anything.

```text
PERC-RESET perceived NormalizedDocument V1
  -> [BSS-V2-005 registered capacity/workload policy + BSS-V2-006 effective safety/eligibility]
  -> IDSER-012-02-01 deterministic per-document partition + per-batch Planned Corpus Handoff
  -> HARD STOP (planner)
  -> versioned SEM-owned batch corpus intake + same stepwise REL-envelope engine (future)
  -> per-batch Qualified Semantic Handoff
  -> independent reconciliation preparation per batch
  -> queue -> workspace reconciliation single writer
```

## Actual code and ticket evidence

1. `apps/agents-bridge/src/process-workload-catalogue.ts` currently enumerates `ProcessKind = "semantic" | "reconciliation" | "chat" | "ces" | "addendum"` and validates this closed set. Profiles, fairness class, routes, estimator and four-dimensional request envelopes are already data-driven, but a **new process kind requires a code change** today.
2. `apps/agents-bridge/src/capacity-planner.ts` already derives a desired policy from the **active configured process set** and versioned workloads; it does not use runtime counters. It enforces hard interactive reserve and generates generic background lanes. Existing BSS-V2-005-01..04 children are approved; their historical CK records must not be edited. Dynamic registration/automatic replanning requires new prospective owner `BSS-V2-005-05`.
3. BSS-V2-006-01/02 are CK-approved foundations; BSS-V2-006-03 is withdrawn with no active implementation or review contract; BSS-V2-006-04 remains planned and requires an independently CK-qualified BSS-V2-006-03A. Existing planned runtime policy includes multi-resource fair borrowing, quota windows/cooldown/pressure, immutable plan convergence, one reserved transport per attempt and protection of interactive budget. No independently evidenced **read-only effective-constraint** interface for corpus sizing was found: name and qualify it before planner integration, rather than claim runtime capacity already exists.
4. `packages/atlas-skills/src/stepwise-source-packet.ts` `buildStepwiseSourcePacket({document,assetIdentities})` enumerates the **whole document**. `apps/agents-bridge/src/semantic-offline-stepwise-composition.ts` passes the same full document; `semantic-stepwise-runtime.ts` loads prior revisions but the provider-facing packet is still rebuilt without them. SEM must explicitly own/version any batch corpus intake; **do not mutate frozen v0.4.0 prompt or restore the legacy packet**.
5. `packages/atlas-db/src/extraction-acceptance.ts` currently has document-scoped acceptance/qualified-deferred coverage and may create reconciliation jobs for candidates under approved `SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE`. This is the separate **OPEN-A** staged per-batch qualified acceptance/reconciliation-preparation policy. Do not silently change prior approved RC-DA-03/04/06 or infer semantic readiness from planning.

## Process-agnostic architecture decision

**BSS-V2-005 owns desired policy for registered, qualified active processes**; generic process kinds are data/config identity, not branches in its allocator. The desired profile automatically re-evaluates on authorized registry/capacity/workload/protection changes with immutable versioned publication. It **does not** guess process demand, alter protected reserve, or recompute on every queue event.

**BSS-V2-006 owns effective runtime allocation for actually queued/running processes**, dynamically sharing unprotected idle background pool among eligible lanes, enforcing windows and clamps, preserving hard interactive protection and fair scheduling. Change of active desired profile wakes waiting work; transient no-quota/cooldown waits; no double provider calls/reservations.

**IDSER owns corpus composition**, using **real BSS-V2-005 constraints and BSS-V2-006 enforceable constraint authority**, not guessed per-process constants. Stable batch size comes from request/structural and policy ceiling, not temporarily remaining quota. Admission is later rechecked per-attempt by BSS-V2-006. No BSS architecture may become semantic-specific merely to simplify batching.

## Bootstrap/gates

The existing `IDSER-012-02-02` activation depends on `-02-01`. Before activation, `-02-01` may use an explicitly qualified **inactive/prospective semantic workload-envelope version**, combined with genuinely active domain/provider capacity and allowed read-only BSS-V2-006 safety constraints, **without** claiming semantic admission is live. `-02-02` subsequently publishes/activates the exact versioned semantic process, requiring the registry convergence seam if dynamic registration is in scope. If BSS cannot support this bootstrap or constraint read without activating unqualified work, report `CAPACITY_PROFILE_BOOTSTRAP_GAP` / `BSS006_CAPACITY_READ_GAP`.

Planner-only CK may qualify exact corpus partition, source/security/accounting, conservative BSS capacity fit and durable handoff through an independent **non-SEM fixture consumer**. Actual SEM prompt/request byte correctness, cross-batch context/REL understanding, accepted media and any changed source packet/schema/hash require separately versioned **SEM-owner qualification**. `SEM_BATCH_CORPUS_INTAKE_GAP` blocks **SEM batch execution/dispatch**, **not** an otherwise honestly proven planner hard stop. Neither checkpoint may guess or claim the other one's evidence.

Future `IDSER-012-02-04` original document-level acceptance must be explicitly re-scoped under OPEN-A to preserve qualified **per-batch** handoffs and independent reconciliation preparation; document-wide source coverage becomes a separate audit, not a prerequisite to processing an eligible batch. This ledger neither performs that policy migration nor amends approved SEM/REL evidence.

## Prospective edited records

- `IDSER-012-02-01`: one-to-many durable Planned Corpus hard stop and exact BSS-V2-005/006 qualification gates.
- `BSS-V2-005-05` (new planned child): extensible process-kind registry and automatically versioned desired-profile convergence; prior four approved BSS children untouched.
- `BSS-V2-005` / `BSS-V2-006` umbrella: process-agnostic allocation owner responsibilities.
- `IDSER-012-02-02/03` / parent, Initial Draft index and context: bootstrap, handoff consumption and downstream ownership markers.

## Explicit exclusions

No provider/model activation or spending, no new capacity policy value invented, no guessed dynamic fairness weights, no unsafe runtime re-batching on transient quota use, no schema/prompt profile mutation, no changed SQL/worker/code, no early candidate/semantic truth/qualified handoff or reconciliation, no Master/publication/projection changes, no fake CK PASS.

## Verified runtime policy drift (2026-10-16 bounded addendum)

**Actual source review:** `apps/agents-bridge/src/providers/anoman.ts` currently maps HTTP 429 to `BridgeProviderError("rate_limited")` and does **not** parse `Retry-After`, typed lower-limit/remaining/reset headers, or durable BSS-006 pressure; generic `provider-capabilities.ts` likewise currently contains no typed normalized runtime pressure contract. `apps/agents-bridge/src/capacity-planner.ts` plans only from an immutable provider-capacity and active process/workload catalogue; it has intentionally no runtime usage authority. BSS-V2-006-01/02 remain approved foundations, BSS-V2-006-03 is withdrawn, and BSS-V2-006-04 remains planned; no qualified end-to-end provider-pressure adaptation is established. This addendum **does not** claim the current Anoman endpoint has any specific rate-limit header or published numeric RPM/RPD.

**Precise separation:** a BSS-V2-005 policy snapshot can be stale because the provider changes its limits without notice. The newly planned BSS-V2-006-03A successor to withdrawn BSS-V2-006-03 must define and independently qualify any durable lower-limit clamp, bounded 429 cooldown, unknown-usage accounting, probe behavior, and restart scope; none of the withdrawn ticket's design is active authority. Feedback scope (quota domain/route) and dimension cannot be guessed. The first rejected request cannot always be prevented.

**Long-lived provider downgrade:** trusted/qualified limit source becomes a **new immutable BSS-V2-005-01 capacity profile**; the prospective BSS-V2-005-05 convergence child now explicitly handles capacity-profile revision (not just registered-process changes), produces new desired policy, and wakes BSS-V2-006. Repeated untyped 429 alone is **not proof of a numeric provider limit**. Existing profile may stay authoritative while BSS-006 imposes a stricter temporary runtime clamp.

**Corpus boundary:** decrease of RPM/RPD or a temporary TPM *window* never automatically changes a planned semantic batch; BSS-006 admission waits. If a verified *per-request structural maximum* falls below the old immutable `RequestResourceEnvelope`, the IDSER planner must perform an explicit **new plan version/repartition** from authorized NormalizedDocument V1, or report an individually unfit source. No automatic prompt truncation, source loss, or permanent busy-spin of unfit work.

**Review changes (prospective only):** BSS-V2-006-03 is withdrawn; the newly planned BSS-V2-006-03A replacement has its own independent review contract and requires CK PASS before BSS-V2-006-04 can rely on it. BSS-V2-005-05 RC-07..08 remain prospective for authorized provider-policy-version convergence. IDSER-012-02-01 RC-11 proves valid structural replan, versus temporary wait. Approved BSS-V2-005-01..04, SEM-CUTOVER/REL contracts and prior CK histories remain unchanged.

## Verified interactive/background foundation and bounded synchronous-consumer addendum (2026-10-16)

**Inspected actual implementation, not assumed:** `apps/agents-bridge/src/process-workload-catalogue.ts` already defines `ServiceClass = "interactive" | "background"`, server-profile validation and `hardInteractiveProtection`; `apps/agents-bridge/src/capacity-planner.ts` already uses `PlannerPolicy.interactiveReserveTargets`, enforces explicit per-dimension reserve and subtracts it before allocating background, with deterministic `capacity-planner.test.ts` control fixtures. BSS-V2-005-02/03 are approved. The approved BSS-V2-006-02 contract states interactive checks global effective capacity, bypasses background fairness, hard reserve is non-lendable, and there is no in-flight preemption. **Those requirements must be reused, not duplicated or falsely reported missing.**

**Only actual missing future acceptance:** user-waited chatbot requests are **latency- and cancellation-sensitive**, unlike durable background semantic work. BSS remains *process-agnostic* but *service-class-aware*: chatbot consumer selects a server-authorized interactive profile, carries bounded deadline/cancellation, receives timely admit/wait/unavailable/expired signals, and must never dispatch expired or disconnected work. If the provider has no real capacity due to pressure/429, a protected reserve cannot guarantee success; bound waiting and return an honest terminal status. Real UI streaming/HTTP semantics stay consumer-owned. Background work stays queued and fair, may not use protected reserve. Do not require BSS to generate a chat response.

**Ticket-bound evidence status:** BSS-V2-006-01 `RC-BSSV2-00601-07` and -02 `RC-BSSV2-00602-07/08` belong to their existing approved contracts; -04 `RC-BSSV2-00604-09/10` remains a future independent integration gate. The withdrawn -03 `RC-BSSV2-00603-11` is **historical only** and confers no active requirement or CK authority; pressure-case behavior for BSS-V2-006-03A is governed solely by its new frozen Review Contract, never this withdrawn historical row. BSS-V2-005-05 `RC-00505-09` only guards preservation of the existing interactive/background contract during generic registry changes. **This ledger grants no new GO/CK authority or code changes.**

## Consumer-facing BSS hard stops (2026-10-16)

At branch `28ca1954a6d79f78f578683e8e9b24d6036ec0e1`, approved BSS-V2-005-04 has immutable active `DesiredAdmissionProfile` publish/read, but no separately proven independent **consumer-ready capacity snapshot**; planned BSS-V2-006-04 has an intended shared provider-work authority but no implemented **read-only runtime effective constraint + attempt/feedback** service. [New frozen interface/checkpoint](../Backend_Phase/bss-provider-consumer-contract-checkpoint-20261016.md) distinguishes these surfaces.

- **BSS-V2-005-05:** demonstrate a process-neutral, versioned, Bridge-authorized `CapacityPlanningSnapshot/v1` and synthetic read-only consumers; no runtime quota mutation or provider attempt; existing BSS-V2-005-04 approved contract unchanged. Provide inactive/prospective qualified workload sizing view for IDSER bootstrap without granting admission.
- **BSS-V2-006-04:** prove both read-only `RuntimeCapacityConstraint/v1` (momentary, not reservation) and durable `ProviderWorkAdmission/v1` (logical work, explicit attempt/fence, BSS reservation, operational feedback, pressure/recovery). Two truly independent fake consumers exercise background/interactive behavior; no SEM algorithm/provider SDK business behavior built inside BSS.
- **Non-cyclic gating:** BSS-V2-006-01/02 use approved BSS-V2-005-04; BSS-V2-005-05's **final** convergence proof and BSS-V2-006-04 both require BSS-V2-006-03A CK PASS. IDSER-012-02-01 uses read-only planning policy; IDSER-012-02-03 / SEM-CUTOVER require BSS-V2-006-04 admitted attempts and separately qualified SEM batch intake.
- **No shortcuts:** read is never send authority; no Atlas direct Bridge SQL dependency; RPM/RPD cooldown delays rather than silently re-batches; provider-pressure retries are explicit new BSS attempts, semantic failure remains SEM-owned. All interface labels are **prospective**, not existing TS/runtime exports. Zero production code, no provider spending, no GO or CK PASS issued by ticket edits.

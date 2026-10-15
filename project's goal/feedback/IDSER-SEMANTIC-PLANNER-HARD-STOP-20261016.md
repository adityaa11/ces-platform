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
3. `BSS-V2-006-01..04` are **planned**, not completed. Existing planned runtime policy includes multi-resource fair borrowing, quota windows/cooldown/pressure, immutable plan convergence, one reserved transport per attempt and protection of interactive budget. No independently evidenced **read-only effective-constraint** interface for corpus sizing was found: name and qualify it before planner integration, rather than claim runtime capacity already exists.
4. `packages/atlas-skills/src/stepwise-source-packet.ts` `buildStepwiseSourcePacket({document,assetIdentities})` enumerates the **whole document**. `apps/agents-bridge/src/semantic-offline-stepwise-composition.ts` passes the same full document; `semantic-stepwise-runtime.ts` loads prior revisions but the provider-facing packet is still rebuilt without them. SEM must explicitly own/version any batch corpus intake; **do not mutate frozen v0.4.0 prompt or restore the legacy packet**.
5. `packages/atlas-db/src/extraction-acceptance.ts` currently has document-scoped acceptance/qualified-deferred coverage and may create reconciliation jobs for candidates under approved `SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE`. This is the separate **OPEN-A** staged per-batch qualified acceptance/reconciliation-preparation policy. Do not silently change prior approved RC-DA-03/04/06 or infer semantic readiness from planning.

## Process-agnostic architecture decision

**BSS-V2-005 owns desired policy for registered, qualified active processes**; generic process kinds are data/config identity, not branches in its allocator. The desired profile automatically re-evaluates on authorized registry/capacity/workload/protection changes with immutable versioned publication. It **does not** guess process demand, alter protected reserve, or recompute on every queue event.

**BSS-V2-006 owns effective runtime allocation for actually queued/running processes**, dynamically sharing unprotected idle background pool among eligible lanes, enforcing windows and clamps, preserving hard interactive protection and fair scheduling. Change of active desired profile wakes waiting work; transient no-quota/cooldown waits; no double provider calls/reservations.

**IDSER owns corpus composition**, using **real BSS-V2-005 constraints and BSS-V2-006 enforceable constraint authority**, not guessed per-process constants. Stable batch size comes from request/structural and policy ceiling, not temporarily remaining quota. Admission is later rechecked per-attempt by BSS-V2-006. No BSS architecture may become semantic-specific merely to simplify batching.

## Bootstrap/gates

The existing `IDSER-012-02-02` activation depends on `-02-01`. Before activation, `-02-01` may use an explicitly qualified **inactive/prospective semantic workload-envelope version**, combined with genuinely active domain/provider capacity and allowed read-only BSS-V2-006 safety constraints, **without** claiming semantic admission is live. `-02-02` subsequently publishes/activates the exact versioned semantic process, requiring the registry convergence seam if dynamic registration is in scope. If BSS cannot support this bootstrap or constraint read without activating unqualified work, report `CAPACITY_PROFILE_BOOTSTRAP_GAP` / `BSS006_CAPACITY_READ_GAP`.

SEM batch prompt/request byte correctness, cross-batch context/REL preservation, accepted media and any new source packet/schema/hash must be separately versioned and qualified: `SEM_BATCH_CORPUS_INTAKE_GAP` remains a blocking named successor. **No GO/CK PASS** for a planner that merely guesses this bridge.

Future `IDSER-012-02-04` original document-level acceptance must be explicitly re-scoped under OPEN-A to preserve qualified **per-batch** handoffs and independent reconciliation preparation; document-wide source coverage becomes a separate audit, not a prerequisite to processing an eligible batch. This ledger neither performs that policy migration nor amends approved SEM/REL evidence.

## Prospective edited records

- `IDSER-012-02-01`: one-to-many durable Planned Corpus hard stop and exact BSS-V2-005/006 qualification gates.
- `BSS-V2-005-05` (new planned child): extensible process-kind registry and automatically versioned desired-profile convergence; prior four approved BSS children untouched.
- `BSS-V2-005` / `BSS-V2-006` umbrella: process-agnostic allocation owner responsibilities.
- `IDSER-012-02-02/03` / parent, Initial Draft index and context: bootstrap, handoff consumption and downstream ownership markers.

## Explicit exclusions

No provider/model activation or spending, no new capacity policy value invented, no guessed dynamic fairness weights, no unsafe runtime re-batching on transient quota use, no schema/prompt profile mutation, no changed SQL/worker/code, no early candidate/semantic truth/qualified handoff or reconciliation, no Master/publication/projection changes, no fake CK PASS.

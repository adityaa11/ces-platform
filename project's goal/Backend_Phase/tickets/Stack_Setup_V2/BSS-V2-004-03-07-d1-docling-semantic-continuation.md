# BSS-V2-004-03-07: D1 Docling-to-semantic continuation checkpoint

- **State:** `superseded-before-implementation`; **Review batch:** `BSS-V2-BATCH-04.03-07` (retained historical plan; not executable)
- **Superseded by:** [IDSER-012-02](../Initial_Draft_Phase/IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md), which routes semantic provider work through BSS-V2-006 and stops at `semantic_ready`
- **Former dependencies:** BSS-V2-004-03-06 CK `PASS` with qualification result `PASS`; BSS-V2-004-02 CK `PASS`; every -01 through -05 contract remains accepted
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§2, 8–10, 12–16

## Outcome

> **Supersession notice:** This unimplemented direct-continuation contract is preserved as planning history only. It must not receive GO or be used to bypass the BSS-V2-005/006 provider-admission authority. Provider route qualification remains with BSS-V2-004-03-06; production lifecycle release moved to IDSER-012-02.

Release the deliberate BSS-V2-004-02 semantic stop only after production extraction qualification passes, then prove the current D1 lifecycle composes authorized Docling perception and provider-neutral semantic extraction through accepted `atlas.semantic.extract/v1` and stops before reconciliation.

## Required integrated path and scope

```text
project/bundle D1
  -> pg-boss perception job
  -> BSS-009-authorized bytes
  -> qualified persistent Docling route
  -> accepted NormalizedDocument v1
  -> existing semantic execution creation / pg-boss job
  -> production reasoning packet
  -> qualified StructuredReasoningProvider route (currently Anoman)
  -> proposal validation and deterministic finalization
  -> atlas.semantic.extract/v1 acceptance
  -> candidate/evidence materialization
  -> STOP BEFORE RECONCILIATION
```

Lifecycle code schedules `atlas.semantic.extract`; route registry/composition selects the concrete provider. Do not schedule “Anoman extraction” or make Atlas lifecycle/provider IDs provider-specific. Reobserve BSS-009 exact authorized byte handling, BSS-V2-004-01/02 Docling readiness and NormalizedDocument acceptance, semantic replay/staging/handoff, and all qualification gates. Limit materialization to already-authorized extraction staging behavior.

Do not release the stop before 004-03-06 qualification `PASS` and CK `PASS`. Do not execute or qualify reconciliation, add a reconciliation job, claim full IDSER D1/D2 acceptance, alter semantic meaning/prompt/provider controls, or modify accepted predecessor contracts to absorb a defect. Return a predecessor defect to its owning ticket.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040307-01 | Release gate verifies CK PASS for 004-02 and every semantic child, plus 004-03-06 qualification result PASS. | Gate report references review records/artifact identities. **PASS iff** no missing, pending or failed qualification is represented as lifecycle release. | lifecycle release-gate negatives |
| RC-BSSV2-0040307-02 | Real D1 uses exact authorized bytes, ready persistent Docling, and one accepted `NormalizedDocument v1` before semantic job creation. | Scoped Compose/image/readiness, source-grant and result evidence. **PASS iff** unauthorized bytes, stale/unready route or invalid/multiple normalization cannot enter semantic work. | BSS-009 and BSS-V2-004-01/02 |
| RC-BSSV2-0040307-03 | Lifecycle schedules provider-neutral `atlas.semantic.extract`; qualified route composition selects the adapter and accepted result is staged/materialized once. | Queue/job identity, route qualification, replay/fencing, candidate/evidence and envelope evidence plus static/import-boundary checks. **PASS iff** lifecycle has no Anoman branch, semantic-worker does not inspect `route.providerId`, and replay/authority invariants hold. | semantic-worker provider-neutral and replay tests |
| RC-BSSV2-0040307-04 | Flow terminates immediately after successful extraction and before reconciliation. | Queue/state inspection and negative reconciliation trigger test. **PASS iff** no reconcile job/transition is emitted. | reconciliation non-scheduling regression |
| RC-BSSV2-0040307-05 | Composition proves only this bounded BSS V2 milestone, without claiming full live IDSER or downstream product acceptance. | Evidence inventory and scope inspection. **PASS iff** completion statements distinguish extraction continuation from deferred reconciliation and full IDSER acceptance. | n/a |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-0040307-SOURCE-GRANT` — BSS-009 authorizes exact bytes; `BOUNDARY-BSSV2-0040307-DOC-PERCEPTION` — Docling only perceives; `BOUNDARY-BSSV2-0040307-SEMANTIC-TRUTH` — Atlas owns semantic validation/materialization; `BOUNDARY-BSSV2-0040307-QUEUE` — pg-boss lifecycle owns retries/fencing.
- **Trust boundary:** `TRUST-BSSV2-0040307-PERCEPTION-TO-EXTRACTION` — normalized document and semantic proposal cross separately validated boundaries before trusted result state.
- **Sensitive assets:** `ASSET-BSSV2-0040307-AUTHORIZED-DOCUMENT` and `ASSET-BSSV2-0040307-CANDIDATE-EVIDENCE` — source bytes and extracted assertions/evidence.
- **Identity context:** `IDENTITY-BSSV2-0040307-D1-EXECUTION` — bind project/bundle/document/execution, source grant, perception artifact, qualified route and replay identity.
- **Extension seam:** `SEAM-BSSV2-0040307-CAPABILITY-ROUTING` — generic lifecycle capability resolves through server-controlled qualified route registry.
- **Prohibited coupling:** `COUPLING-BSSV2-0040307-PROVIDER-LIFECYCLE` — no provider-specific scheduling, predecessor repair, reconciliation continuation or cross-domain authority.
- **Verification seam:** `VERIFY-BSSV2-0040307-STOP-AND-REPLAY` — lifecycle release gate, authorization, readiness, idempotency/replay and negative reconciliation evidence.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040307-DOWNSTREAM-ACCEPTANCE` — reconciliation, human review, publication and full IDSER acceptance remain future scopes.
- **Review bindings:** `REV-READY-BSSV2-0040307-01` verifies source authorization, Docling isolation/readiness and execution identity; `REV-READY-BSSV2-0040307-02` verifies provider-neutral routing, replay and the pre-reconciliation hard stop.

## Validation and handoff

Rebuild/recreate only affected Compose services, verify migrations/config/image and live route readiness, then execute the bounded D1 integrated matrix with scoped fresh state and safe evidence. Preserve pg-boss as lifecycle authority; do not enable another queue. On proven closure, mark `awaiting_review` and stop for CK. After CK PASS, stop this semantic extraction milestone. Reconciliation remains separately gated by BSS-V2-004-04 and no automatic progression is authorized.

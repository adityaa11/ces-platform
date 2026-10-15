# IDSER-012-02-03 — BSS-admitted execution using sole SEM-007A stepwise engine

- **State:** `planned`; **GO BLOCKED** until -02-02 and independent BSS-V2-004-03-06 CK PASS **plus separate semantic qualification PASS** for the exact route.
- **Batch:** `IDSER-BATCH-12-02-03`
- **Dependencies:** IDSER-012-02-01/02 independent CK PASS, BSS-V2-006-04 admission CK PASS, BSS-V2-004-03-06 review CK PASS AND semantic meaning result PASS. Neither alone suffices.
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)

**Binding prospective authority:** [SEM-CUTOVER winner](../../../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md) and [IDSER semantic successor map](../../../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md). The sole extraction engine is SEM-CUTOVER-007A eight-stage stepwise v0.3.1 with `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0`, strict combined `semantic_proposal + relationship_proposals`, REL-03 → SEM-006 → SEM-005 qualification and fenced composite replay. PERC-RESET-008/approved IDSER-012-01 own the accepted RUN-003 `NormalizedDocument v1` and derived assets. BSS-V2-005 owns generic external-provider planning; BSS-V2-006 owns durable admitted attempts. Retired BSS-V2-004-03-05 consolidated CK and legacy `prompt-003/v1` packet/byte parity are **not** successor dependencies.

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

## Security, required evidence and stop

Trust boundary is Atlas-granted source/media→SEM-007A; BSS-V2-005 active plan→BSS-V2-006 reservation→one HTTP attempt; untrusted response→strict composite→non-truth stage. Never send raw credentials or PRD content to queue/CK logs. Require loopback fake plus isolated PostgreSQL lifecycle/replay with **non-inert** zero/one counters. No automatic D1 semantic activation is implied. **STOP** on unproven provisional context reuse, unqualified image model or missing live semantic PASS; do not reroute extraction to legacy.

# IDSER-012-02-01 — Deterministic stepwise-owned/context batching and resource envelopes

- **State:** `planned`; **GO BLOCKED** on the exact SEM-007A executor/CK evidence and cross-batch relationship contract.
- **Batch:** `IDSER-BATCH-12-02-01`
- **Dependencies:** IDSER-012-01-03-02 CK PASS; PERC-RESET-008 CK PASS; exact SEM-007A shared stepwise executor independent CK evidence; compatible BSS-V2-005 resource-envelope/planning interfaces. Do not require retired BSS-V2-004-03-05 CK PASS, obsolete 03-03 packet parity, or IDSER-011.
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)

**Binding prospective authority:** [SEM-CUTOVER winner](../../../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md) and [IDSER semantic successor map](../../../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md). The sole extraction engine is SEM-CUTOVER-007A eight-stage stepwise v0.3.1 with `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0`, strict combined `semantic_proposal + relationship_proposals`, REL-03 → SEM-006 → SEM-005 qualification and fenced composite replay. PERC-RESET-008/approved IDSER-012-01 own the accepted RUN-003 `NormalizedDocument v1` and derived assets. BSS-V2-005 owns generic external-provider planning; BSS-V2-006 owns durable admitted attempts. Retired BSS-V2-004-03-05 consolidated CK and legacy `prompt-003/v1` packet/byte parity are **not** successor dependencies.

## Outcome and precise ownership

For one accepted, source-authorized RUN-003 normalized document, deterministically enumerate eligible locators, assign each to exactly one `owned_source` batch, optionally include separately bounded `context_only_reference`, and prepare an immutable versioned batch plan with the **exact same** `buildStepwiseSourcePacket()` → `buildStepwiseRelationshipEnvelopeRequest()` request/profile/hash/parser as the sole SEM-007A extraction runtime. Derive per-request BSS-V2-005 `RequestResourceEnvelope` from actual system/user/schema/media bytes and versioned resource estimators. **No provider work, transport, semantic result, candidate, acceptance, reconciliation job or Master effect.**

The shared stepwise builder currently handles whole-document inputs. Implement only a deterministic orchestration/source-role seam; do not invent a parallel batch-only compiler, REL schema, prompt, extractor or finalizer. Prove a fitting single-batch invocation matches the **current stepwise** compiler, **not** historical single-packet bytes. If a batch API requires changes to SEM-owned source packet/REL/finalizer semantics or missing prior-revision provider-facing context, **STOP: SEM_OWNER_DECISION_REQUIRED** and obtain bounded authority instead of silently rewriting that frozen contract.

Reference context may repeat but never own output. Across title/legend/condition/dependent-source splits, exact authorized relationship revision hashes and scope/temporal meaning must survive; adjacency alone is not proof of semantic equivalence. A batch carrying a meaningful image must have current Atlas-granted source/page/locator/bytes/hash/media binding and a qualified provider media capability. Missing or unexamined visual evidence cannot become `non_fact`. Record qualified `essential_dependent_deferred` source coverage for later document-level aggregation; no presumption that all finished batches yield a non-null canonical result.

## Review contract — all rows mandatory

| ID | PASS iff / failing negative |
| --- | --- |
| `RC-0120201-01` | A fitting single batch produces the **same SEM-007A stepwise v0.4.0** system/user/source specification/REL envelope/schema/version/hash, not `buildSemanticSourcePacket` or legacy byte parity. |
| `RC-0120201-02` | Every eligible locator is owned exactly once, context-only repeats are explicitly bounded and produce zero source_results ownership; duplicate/missing/foreign/dangling or swapped roles reject. |
| `RC-0120201-03` | Plan/order/IDs/owned-context maps and hash are stable for exact normalized source, media, relationships and versioned profile; changing any of these invalidates the plan. |
| `RC-0120201-04` | Exact prompt/schema/source/image/UTF-8 and context bounds hold with no silent truncation. Unfit owned unit, untrusted context or essential cross-batch dependency rejects with named blocker. |
| `RC-0120201-05` | Actual request including image parts creates checked multi-resource RPM/TPM/concurrency/window envelope using the BSS-V2-005 estimator/accounting/safety identity; billing weights are never substituted for TPM. |
| `RC-0120201-06` | Deterministic planning produces zero semantic provider work, reservation, attempt, Atlas candidate/evidence/index, reconciliation or Master changes. |
| `RC-0120201-07` | RUN-003 text, tables, zero-visual, image-bearing examples retain exact asset identity; missing/foreign media and unexamined meaningful visuals fail closed rather than fabricate semantic understanding. |
| `RC-0120201-08` | A cross-batch condition/legend/provisional/deferred test proves preserved direction, relationship lineage/revision authorization and source accounting; if provider-facing trusted prior revision use is unproven, this row BLOCKS rather than passing by assertion. |

## Security and evidence

Retain Atlas-only source/derived-asset authorization, fresh scoped granted context, redacted source and secret data, immutable plan hashes and zero early effects. Use deterministic fake/loopback source units and negative counters, plus exact shared builder call-site and SEM CK SHA evidence. This ticket never activates provider calls, changes semantic schema, or assigns accepted truth. **Independent CK is required before -02-02 GO.**

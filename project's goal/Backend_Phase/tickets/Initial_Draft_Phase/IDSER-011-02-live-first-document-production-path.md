# IDSER-011-02: Live first-document production path

- **State:** `planned`; **Review batch:** `IDSER-BATCH-11-02`.
- **Predecessors:** IDSER-011-01 `PASS`.
- **Consumes:** the approved live runtime qualification; frozen authenticated creation, BSS-009 perception, semantic dispatcher/worker, internal Atlas handoffs and IDSER persistence acceptance.
- **Execution environment:** fresh, real Compose scenario identifiers; real Mistral only; synthetic/non-confidential single-PDF input.

## Authority and bounded outcome

Answer one question: **can D1 traverse the approved real Mistral and Atlas semantic path to validated reconciliation completion without a substitute authority?** The bounded live harness creates one authenticated production project and one synthetic PDF, observes real BSS-009 OCR through `MistralProvider.perceive(...)`, then `atlas.semantic.extract/v1` and `atlas.semantic.reconcile/v1` through `MistralProvider.structured(...)`, and proves authenticated Atlas acceptance/persistence for D1.

This is a full one-document path, not an exact-model-wording test. Schema validity, actual provider provenance, candidate/evidence/index/reference accounting, complete extraction/reconciliation results, and D1 completed state are the closure oracles.

## Explicit non-authority

This child does not prove D2 scheduling, prior-context selection, final N/N completion, browser/card rendering, Master/downstream absence across the completed series, replay/failure/concurrency behavior, or a second document. It must not change BSS-008/009, semantic schemas, persistence, queue, worker, authentication, lifecycle, or card behavior. It must not use mock endpoints, TestRuntime, a local pseudo-model, direct Bridge writes, or a fallback.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-011-02-01 | Authenticated production create produces a freshly scoped project/workspace/bundle/D1 execution and immutable synthetic source identity. | Live harness response plus bounded Atlas/DocumentStore/queue IDs, source hash and initial state. **PASS iff** all identities resolve to one fresh scope and no fixture/direct-DB project creation is used. |
| RC-011-02-02 | D1 OCR uses BSS-009 and `MistralProvider.perceive(...)`; normalized result acceptance is followed by both versioned semantic skills through the production dispatcher, existing worker and `MistralProvider.structured(...)`. | Secret-safe worker/execution/provenance observations for OCR, extraction and reconciliation. **PASS iff** all three operations succeed through those exact paths, with no TestRuntime/mock/alternate provider and authenticated internal result delivery. |
| RC-011-02-03 | Atlas validates and persists D1 full extraction/reconciliation results, candidates, evidence, index and relationship/reference records with valid scope/source accounting. | Scoped database/read API assertions against the actual run. **PASS iff** complete results and every referenced candidate/evidence/source resolve inside D1's bundle; invalid or missing accounting cannot be represented as success. |
| RC-011-02-04 | D1 reaches validated reconciliation completion before any successor semantic advance is accepted. | Persisted execution/member/bundle and pg-boss history. **PASS iff** extraction/OCR-only states do not count complete and D1 becomes completed only after reconciliation acceptance. |

## Security, repair and handoff

**Security readiness: applicable.** This child extends `SEAM-IDSER-011-01` across the source-to-provider-to-Atlas trust path and owns the corresponding D1 portion of `REV-READY-IDSER-011-01`. Source bytes remain BSS-009/Bridge bounded input, not queue/database/browser material; Bridge remains unable to write trusted Atlas state directly. Evidence records IDs, hashes, counts and approved provenance only—never PDFs, raw model/provider bodies, capabilities, storage keys, headers or secrets.

Use a new unique scenario scope and bounded scenario cleanup. Before blaming code, distinguish stale image/container/process, persistent PostgreSQL/pg-boss/DocumentStore state and fixture contamination from the live-provider result. Rebuild/recreate affected services when reviewed source/config changed.

CFC is local to the D1 live harness, its scoped observations or redaction assertions. HMN may authorize one D1 observation/accounting issue. It may not add D2 context, final lifecycle/card, or provider architecture work.

## Required validation, regression and review checkpoint

Run the fresh D1 Compose harness through terminal OCR, both semantic stages and accepted persisted results; retain only hashes, IDs, counts and approved provenance. If live-harness code/configuration changes an established seam, run its directly affected BSS-009, semantic-worker, internal-handoff and persistence regressions; otherwise consume IDSER-010 PASS evidence. **CK question:** does one real document complete the exact approved D1 production path with valid live-scope accounting?

## Hard stop and required handoff

GO must wait through every asynchronous OCR/semantic/acceptance operation, inspect final persisted state and complete all four rows before handoff. A running Compose job is not readiness. Record secret-safe commands and final statuses, then `Internal readiness: READY_FOR_CK`. IDSER-011-03 alone owns D2 incremental proof.

> **AUTHORITATIVE PROSPECTIVE SUPERSESSION (2026-10-15): `SUPERSEDED_HISTORICAL_CK`.** Original CK `CHANGES_REQUIRED` at `298021d` remains historical. For future semantic extraction, REL-01..03 and SEM-005/006/007/007A own the strict source/relationship trust, deferred outcome, worker and replay. No legacy `prompt-003/v1`, legacy source packet, legacy byte parity, or consolidated old-03-05 CK is a future GO/CK prerequisite. Preserve all `CK-001.a/b` security invariants and independently qualified successor evidence; do not claim original CK PASS. Decision and bounded owner ledger: `project's goal/feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md`. This is documentation-only and not a retrospective CK PASS or new implementation GO.

## Historical frozen plan — archival reference only, NOT GO/CK authority

# BSS-V2-004-03-05: Deterministic extraction finalizer and provider-neutral worker composition

- **State:** `awaiting_review`; **Review batch:** `BSS-V2-BATCH-04.03-05`; **realignment:** documentation only — not implementation GO, CK PASS, or successor GO.
- **Dependencies:** BSS-V2-004-03-01 through -04 CK `PASS`; BSS-V2-001/002/003 and BSS-V2-004-02 accepted boundaries; explicit `go BSS-V2-004-03-05`. Consume approved BSS-V2-004-03-08-01-01 through BSS-V2-004-03-08-02-06 interfaces without reopening their owners.
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§8–9.05, 10, 12–16
- **Current seam:** `apps/agents-bridge/src/semantic-worker.ts` currently sends serialized context with the skill prompt and validates the returned final extraction/reconciliation result directly. This child replaces only extraction execution/finalization; reconciliation remains unchanged.
- **Downstream:** BSS-V2-004-03-08-03-02 depends on **03-05 independent CK PASS** and **08-03-01 CK PASS**; it owns independent strict-parser/finalizer *qualification*, not finalizer implementation. 08-03-03 owns the integrated offline terminal gate.
- **Size:** `M+` (source/proposal trust and worker composition). Stop for HMN if GO exposes a separately mutable schema, adapter, context authority, grant or admission owner.

## Outcome

Compose extraction through the prepared reasoning packet and neutral provider seam, then deterministically turn an untrusted provider proposal into the existing validated Semantic V1 result envelope and replay/staging/handoff behavior.

## Scope and forbidden work

Required extraction path:

```text
semantic extraction context
  -> production reasoning-packet builder
  -> StructuredReasoningProvider
  -> untrusted proposal
  -> provider proposal Zod parse
  -> exact source accounting
  -> deterministic finalizer
  -> canonical final Semantic V1 Zod parse
  -> unchanged result envelope/replay/staging/handoff
```

The finalizer generates `local_candidate_id`, copies trusted source wording, derives evidence refs and source-unit IDs from the local slot map, materializes source inventory page/locator fields and destination IDs, and fills envelope bookkeeping. It must not change semantic kind, rewrite meaning, invent payload/applicability/questions, silently repair invalid output, or drop incompatible meaning to pass validation.

`semantic-worker.ts` receives only `StructuredReasoningProvider` and never inspects `route.providerId`; concrete selection stays in composition root. Preserve cancellation, fencing, replay, staging and public v1 handoff. Do not modify reconciliation prompt/execution semantics, lifecycle release of the BSS-V2-004-02 stop, live qualification, or semantic schemas.

## Binding pre-GO realignment: approved multimodal handoff

This section refines earlier text-only language and is authoritative wherever opt-in multimodal input changes the source-accounting contract. It does not authorize code changes, reopen completed CK verdicts, change Semantic V1, or activate a semantic route.

| Frozen upstream owner | What 03-05 must preserve |
| --- | --- |
| 03-01/02/03; 08-01-01 | Canonical Semantic V1 Zod and existing provider proposal Zod; `compileExtractionPrompt()`, `buildSemanticSourcePacket()`, default `atlas.semantic.extract.prompt-003/v1`, legacy prompt bytes, ordered sections/provenance/hashes, source-slot ordering and failure decisions. Compare candidate HEAD to the immutable parent-HEAD baseline; never update gold to pass. |
| 08-01-02 / HMN-002 as amended by HMN-003 / its independent CK | `atlas.context-provenance/v1` distinguishes untrusted source-relationship *proposals*, accepted trusted context use, and later append-only candidate binding. Model confidence, shared page or apparent similarity cannot authorize a link. Runtime attestation/review workflow is not implemented merely by that decision. |
| 08-01-03/04 | The eight-stage `atlas.semantic.extract.stepwise_multimodal/v0.3.1` compiler/source-input Zod is explicitly **opt-in**; old profile default and its byte-level behavior remain unchanged. Preserve instruction authority per rendered section; source data cannot become system policy. |
| 08-02-01/02/03 | Consume validated unhydrated `sourceSlots`, `referenceContexts`, `pendingAuthorizedMedia`, document/source/asset identities, existing grants and verified ephemeral media only at their approved interfaces. Do not mint a relationship attestation, widen a service grant, hydrate media independently or retain image bytes. |
| 03-04 / 08-02-04/05 | Neutral `StructuredReasoningProvider.structured()` and string messages remain valid. Typed multipart and Anoman `structuredMultipart()` are additive, separate ownership; no concrete adapter import, vendor-ID branch or unsafe multipart cast in the generic worker. |
| 08-02-06 | `preflightMultimodalRequest()` returns a hash-only in-memory `MultimodalRequestSpec` and `ResourceEstimatorInput` or `RESOURCE_ENVELOPE_BLOCKED`. No persisted request, admission approval, scheduler, resource reservation or exact `RequestResourceEnvelope`; the last is owned by `IDSER-012-02-01`. |
| 08-03-01 | Frozen M01–M13 and stress/negative fixture ledger is an independent *subsequent* qualification reference, not proof that this finalizer or any model has already passed. |

### Required proposal-to-result rules

1. **Strict existing proposal boundary.** Parse already JSON-decoded provider values with existing `atlasProviderExtractionProposalV1Schema`. Do not remove raw Markdown fences, case-fold illegal kinds, coerce fields, reconstruct JSON, rescue raw failures through diagnostics, invent values, retry a model or silently repair provider output. Non-JSON/fenced raw content fails at the adapter decode boundary; an uppercase enum or malformed decoded proposal fails authoritative Zod.
2. **Exact owned-slot coverage.** Bind execution/document/source SHA/profile and the *exact owned slots actually supplied to that request*. Require one `source_result` for each such owned slot, no omissions, duplicates, invented/foreign/dangling slots or `reference_context` slot represented as an independent provider-owned result. Preserve deterministic slot and intra-slot proposal ordering. Text-only source packet behavior remains unchanged. A description-only or image-bearing slot is not automatically a business assertion.
3. **Context and pending-media honesty.** Respect `owned_source`, `reference_context` and `pending_authorized_media` roles. An unlabeled visual awaiting meaningful evidence cannot silently become `non_fact`. Title/legend may inform an owned table candidate only through an Atlas-validated **accepted** relationship. A proposed/foreign/expired/duplicate/unsupported relationship, provider confidence, guessed table↔image join or missing *essential* link is `SOURCE_RELATIONSHIP_BLOCKED`. Do not promote context by `non_fact_reason`.
4. **Atlas-only deterministic derivation.** Generate bounded, unique result-local `local_candidate_id` and `source_unit_id` from the trusted slot/order map. Copy provider `semantic_key`, `kind`, `payload`, `normalized_meaning`, `needs_resolution`, `question` and `reason` without semantic mutation. Materialize page/locator/ID, source-native exact bounded excerpts and question evidence from **trusted** source data, never provider locators. Reject unrepresentable/oversized meaning rather than truncating, paraphrasing, discarding candidates or inventing conditions. `candidate` inventory requires actual destination IDs; `non_fact` requires a source-grounded reason and none; meaningful uncertainty must not be hidden as non-fact.
5. **Dual evidence without duplicate meaning.** When a separately *accepted* source relationship and canonical fit permit, a table-owned candidate may carry both table and contextual visual evidence and appropriate source inventory rows may reference the **same** candidate ID. Never mint an additional visual-owned policy/title candidate. Preserve lineage for a later append-only post-extraction binding; do not pretend that a runtime attestation/candidate-binding service exists. Required context that cannot be faithfully represented is blocked for an owning decision, not dropped.
6. **Final authority.** Run existing canonical `parseSemanticExtractionResult()` after deterministic finalization and before staging an envelope. Invalid proposals/inventory/evidence never reach staged trusted output. The valid result is proposed reviewable knowledge, not accepted, published or Master truth.

### Composition, replay and scope ownership

- Implement/qualify a **pure deterministic finalizer** with exact trusted-slot fixtures before changing the extraction-specific path in `semantic-worker.ts`. Retain generic neutral dependency injection and existing `StructuredReasoningProvider` string compatibility. An optional typed-provider *fake* path must use a separately injected **provider-neutral** capability and already approved multipart types; changing shared provider/adaptor contracts is `OWNERSHIP_CONFLICT_BLOCKED` and requires separately bounded HMN/owner authorization. The generic worker must not inspect `route.providerId`.
- Keep new stepwise profile explicit/offline-only. Do not switch profiles just because an image is present, modify legacy `prompt-003/v1`, make source data system instructions, or change reconciliation semantics.
- Preserve v1 `scope/skill/provider/result` envelope, cancellation, lease fencing, staged-winner replay, idempotency and result handoff. A staged winner cannot trigger an additional provider attempt. Never persist source image bytes/base64, secret-bearing request/response or credentials in jobs, DB, replay, logs or acceptance artifacts.
- In fake multimodal composition, preflight denial (unknown profile/route, invalid image, prompt overflow, cancellation/deadline) or `RESOURCE_ENVELOPE_BLOCKED` must reject **before** any simulated provider/admission job effect. A request-spec hash is not authorization and image bytes are not TPM. Full verified source→hydration→typed fake-provider E2E is 08-03-03's later test owner.
- BSS-V2-004-02 / IDSER D1 remains stopped at `perceived` with **zero semantic executions**. No live semantic provider, production job, perception permit, admission reservation, model fallback, reconciliation, canonical acceptance or publication may be enabled here.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040305-01 | Existing strict provider-proposal Zod plus one-to-one **owned** slot coverage, accepted context authority and no provider-supplied trusted locator/ID. | Positive fake proposal accepted; fenced raw/uppercase enum at correct parser boundaries, invalid kind/shape/classification, missing/duplicate/dangling/foreign/context-only slots and missing/unauthorized relationships rejected. **PASS iff** malformed or untrusted proposal fields cannot become Atlas output. | Provider proposal Zod, source packets; 08-03-02 retains independent raw-response oracle qualification. |
| RC-BSSV2-0040305-02 | Deterministic Atlas IDs, trusted source/clarification evidence, full source inventory, unchanged provider meaning, contextual dual evidence where actually authorized. | Double-run equality/field-origin proof; table+legend same-candidate evidence, invented title candidate, lost context, false non-fact, unbounded text and silent-repair negatives fail. **PASS iff** final Semantic V1 validates with full lineage and no semantic mutation. | Canonical Semantic V1, source/context fixtures and 08-03-01 frozen oracle references (not rewritten). |
| RC-BSSV2-0040305-03 | Explicit legacy/stepwise profile coexistence with neutral injected provider capability and no vendor-specific generic-worker path or interface rewrite. | Static import/type/provider-ID checks, fake provider tests, old→new→old/concurrent profile isolation and 08-01-01 parent-HEAD byte/hash/failure differential. **PASS iff** legacy default unchanged and unsupported multipart fails before dispatch. | 03-01/02/03, 08-01-04, 08-02-04/05, Anoman/Gemini/provider boundary. |
| RC-BSSV2-0040305-04 | Existing envelope, lease/replay/fencing, staged winner, cancel/failure behavior, unchanged reconciliation and 08-02-06 preflight/resource boundaries. | Abort, duplicate, restart, cancel, staged-winner, overflow/unknown TPM fakes with **instrumented live effect callbacks plus positive control** (inert empty counter arrays are insufficient). **PASS iff** zero unauthorized attempts/jobs/permits/reservations/leaks and no reconciliation regression. | Semantic worker/replay/cancel, BSS-V2-001/002, 08-02-06 fake effects, reconciliation. |
| RC-BSSV2-0040305-05 | Offline-only finalization preserves D1 `perceived` stop and cannot enable live routing, admission, reconciled/accepted/published truth. | D1 terminal negative and candidate-HEAD diff; real external provider attempts = 0, semantic executions/jobs = 0, perception jobs/permits = 0, admission reservations = 0. **PASS iff** no normal D1 semantic activation or unauthorized effect is reachable. | BSS-V2-004-02, IDSER D1 terminal/regression lanes. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-0040305-ATLAS-FINALIZATION` — canonical Atlas validation and deterministic code own trusted output; `BOUNDARY-BSSV2-0040305-REPLAY` — existing fenced staging/replay is preserved.
- **Trust boundary:** `TRUST-BSSV2-0040305-PROPOSAL-TO-RESULT` — provider proposal remains untrusted until strict Zod, exact owned-slot accounting, accepted relationship authority, deterministic finalization and final canonical parse succeed.
- **Sensitive assets:** `ASSET-BSSV2-0040305-SOURCE-EVIDENCE` and `ASSET-BSSV2-0040305-CANDIDATE-STATE` — source text/evidence and resulting semantic assertions.
- **Identity context:** `IDENTITY-BSSV2-0040305-EXECUTION-SLOT-MAP` — execution/scope, slot-to-source map, provider provenance and replay lease remain bound through result construction.
- **Extension seam:** `SEAM-BSSV2-0040305-DETERMINISTIC-FINALIZATION` — Atlas-derived identity/evidence and validation are independently inspectable from provider output.
- **Prohibited coupling:** `COUPLING-BSSV2-0040305-PROVIDER-REPAIR` — no route inspection, concrete multipart cast, response repair, untrusted context promotion, semantic correction, admission scheduling or policy reinterpretation.
- **Verification seam:** `VERIFY-BSSV2-0040305-ORIGIN-AND-REPLAY` — field-origin, negative repair, import-boundary, replay/fencing and unchanged reconciliation evidence.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040305-SEMANTIC-REVIEW` — downstream human review/acceptance policy remains outside extraction finalization.
- **Review bindings:** `REV-READY-BSSV2-0040305-01` verifies proposal-to-result trust transitions and field provenance; `REV-READY-BSSV2-0040305-02` verifies worker provider neutrality and replay/lifecycle boundaries.

## Validation and handoff

1. On a later **explicit GO**, re-fetch HEAD, current predecessor CK states and original 08-01-01 parent-HEAD manifest. Confirm frozen 08-03-01 oracle identity. Inventory **permitted changed files** and every owner they affect; first prove pure finalization in deterministic tests before touching worker composition. No implied permission to modify an approved adapter/schema/grant/preflight owner.
2. At candidate HEAD run focused source/proposal/field-origin, contextual-evidence and negative tests, plus relevant unchanged legacy prompt/schema/source-packet, stepwise compiler, Anoman/Gemini, provider-neutral boundary, replay/cancel, reconciliation, 08-02-06 preflight/effect and BSS-V2-004-02 D1 terminal suites. Compare real old bytes/hashes, not refreshed snapshots; use Docker Compose when host installation cannot reproduce them.
3. Report exact SHA, changed-path→owner→regression matrix, exact commands/exit codes, independent positive-effect callback control and observed zero side-effect counters. Separate pre-existing failures from regressions. Never store raw media/base64, credentials, secret content or a live response in CK artifacts.
4. Stop at `READY_FOR_CK` / `awaiting_review` only after RC-01–05 have binary evidence; CK independently issues PASS/CHANGES_REQUIRED/BLOCKED. Only **03-05 CK PASS plus 08-03-01 CK PASS** makes 08-03-02 dependency-ready for the user's *separate* GO. 08-03-03 remains the offline integrated terminal gate, not a second finalizer owner.

**Hard stops:** `OWNERSHIP_CONFLICT_BLOCKED` for a shared interface/adapter/schema/authority change; `SOURCE_RELATIONSHIP_BLOCKED` for unaccepted essential contextual provenance; `SCHEMA_FIT_BLOCKED` if a required canonical representation is impossible; `RESOURCE_ENVELOPE_BLOCKED` when image TPM is unknown; `LEGACY_REGRESSION_BLOCKED` on frozen default drift. Escalate for HMN rather than invent an acceptance, retry indefinitely, silently narrow the corpus, or authorize live execution. CFC requires a specific prior independent CK finding and bounded human authorization.

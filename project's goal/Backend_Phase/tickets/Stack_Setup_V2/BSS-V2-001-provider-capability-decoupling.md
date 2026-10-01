# BSS-V2-001: Provider capability contracts and concrete-provider decoupling

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-01`
- **Dependencies:** accepted BSS-005, BSS-006, BSS-008, and BSS-009 series
- **References:** V3 §§4, 5, 8–9, 27, 32–33; Baseline V2 §§8–10, 15–16, 30, 48; implementation context §§5, 11, 22, 30

## Outcome and current seam

Replace generic dependencies on `MistralProvider`/`MistralChatRuntime` in `semantic-worker.ts`, `document-perception-worker.ts`, `runtime.ts`, `main.ts`, and `worker-main.ts` with narrow Bridge-owned capability interfaces. Retain Mistral adapter behavior through those interfaces. No route registry, Gemini transport, live call, capacity, persistence, privacy, or fallback belongs here.

## Scope and forbidden work

Define `StructuredReasoningProvider`, `DocumentPerceptionProvider`, `StreamingChatProvider`, and only an extension seam for `EmbeddingProvider` if it improves the shared vocabulary. Adapt existing Mistral methods and preserve the BSS-005 `ReasoningRuntime`, BSS-006 queue lifecycle, BSS-009 source-grant/normalization handoff, and IDSER v1 envelopes. Do not change semantic schemas, `NormalizedDocument`, queue payloads, provider model selection, Atlas authority, or database roles.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-001-01 | Generic semantic and perception workers require only their neutral capability interface. | Import/type inspection plus focused worker tests. **PASS iff** neither worker requires a concrete Mistral/Gemini type and existing v1 handoffs pass. | semantic-worker; perception worker |
| RC-BSSV2-001-02 | Interactive runtime receives a neutral streaming capability while BSS-005 execution/SSE semantics remain compatible. | Runtime contract and SSE tests. **PASS iff** no vendor runtime is required by the generic API path and ordered completion/cancellation remain green. | BSS-005 runtime tests |
| RC-BSSV2-001-03 | Retained Mistral adapter conforms to each adopted interface without changed bounded request/result semantics. | Adapter conformance tests using deterministic transport. **PASS iff** structured, perception, and stream adapters satisfy the contracts and preserve normalized errors/provenance. | BSS-008 adapter tests |
| RC-BSSV2-001-04 | Provider SDK/API types do not enter Atlas contracts, skills, queue payloads, or trusted state. | Static boundary inspection and affected typecheck. **PASS iff** prohibited imports/types are absent outside Bridge adapter internals. | contracts and skills typecheck |

## Security Refactor Readiness

**Status:** `minimal-relevance`.

- **Inherited boundary:** `BOUNDARY-BSSV2-001-ATLAS-BRIDGE` — Bridge executes providers; Atlas owns truth and source authorization.
- **Extension seam:** `SEAM-BSSV2-001-PROVIDER-INTERFACE` — generic paths expose only capability contracts.
- **Prohibited coupling:** `COUPLING-BSSV2-001-CONCRETE-PROVIDER` — no generic worker/runtime depends on Mistral or Gemini.
- **Unresolved policy:** `SEC-GAP-BSSV2-001-PROVIDER-POLICY` — later privacy/capacity policy is not selected here.
- **Review binding:** `REV-READY-BSSV2-001-01` (ref `SEAM-BSSV2-001-PROVIDER-INTERFACE`): verify type/import boundary with focused conformance evidence.

## Validation, Docker, and handoff

Run provider-contract, Mistral-conformance, runtime/SSE, semantic-worker, perception-worker, and affected package typecheck tests. If Compose source changes are needed, rebuild/recreate only Bridge API/worker and run readiness smoke. GO must reach terminal test evidence; CFC may repair a local interface/conformance clause only. Hard stop: a required semantic/perception contract change is a scope change. On PASS, BSS-V2-002 owns route selection.

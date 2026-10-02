# BSS-V2-001: Provider capability contracts and concrete-provider decoupling

- **State:** `awaiting_review`; **Review batch:** `BSS-V2-BATCH-01`
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

## Implementation checkpoint

- Added Bridge-owned `StructuredReasoningProvider`, `DocumentPerceptionProvider`, and `StreamingChatProvider` contracts, plus the reserved `EmbeddingProvider` extension vocabulary.
- Changed semantic/perception workers and the interactive runtime to consume only those contracts. The two composition roots inject Mistral capabilities without naming concrete provider classes in their generic execution paths.
- Kept the retained Mistral transport as the sole concrete adapter, with normalized error, provenance, stream, structured-result, and perception-result behavior unchanged.
- Added deterministic conformance and source-boundary tests. No semantic schemas, document normalization, queue payloads, provider selection, Compose configuration, database authority, or Atlas trusted state changed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation command | Status |
| --- | --- | --- | --- |
| RC-BSSV2-001-01 | Review Contract row 01: both generic workers use neutral capabilities and preserve v1 handoffs. | `tests/provider-capabilities-boundary.test.ts`; `tests/semantic-worker.test.ts` (5 passing); `tests/document-perception-worker.test.ts` (5 passing). | PROVEN |
| RC-BSSV2-001-02 | Review Contract row 02: generic interactive API uses neutral streaming and retains ordered completion/cancellation. | `tests/provider-capabilities-boundary.test.ts` (2 passing); `tests/service.test.ts` (5 passing, including ordered SSE and cancellation). | PROVEN |
| RC-BSSV2-001-03 | Review Contract row 03: retained Mistral adapter conforms to structured, perception, and streaming contracts without changed normalized behavior. | `tests/mistral-provider.test.ts` (11 passing), including deterministic conformance, normalized errors/provenance, stream/tool-call, bounds, retry, and cancellation cases. | PROVEN |
| RC-BSSV2-001-04 | Review Contract row 04 and `REV-READY-BSSV2-001-01`: concrete provider types stay inside the adapter; no Atlas contract, skill, queue, or trusted-state change. | Static source-boundary test; isolated TypeScript `ts.createProgram` check across `apps/agents-bridge/src` using the locked dependency versions (clean); `git diff --check` (clean). | PROVEN |

Validation was run through an isolated dependency cache because the local pnpm virtual-store junction targets were empty; the same deterministic test files and locked package versions were used. The full Bridge test sequence completed without failures. Its Compose/PostgreSQL opt-in tests were skipped because their environment was not enabled; Compose configuration and source were not changed by this ticket.

Internal readiness: READY_FOR_CK

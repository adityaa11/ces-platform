# BSS-V2-003: Gemini provider adapter contracts

- **State:** `awaiting_review`; **Review batch:** `BSS-V2-BATCH-03`
- **GO checkpoint:** [BSS-V2-BATCH-03-go.md](../../../feedback/BSS-V2-BATCH-03-go.md).
- **Dependencies:** BSS-V2-002 at CK `PASS`
- **References:** V3 §§4–6, 8–9, 27, 31–33; Baseline V2 §§10, 13–16, 30, 36–37; implementation context §§11, 14, 21–22, 29

## Outcome and current seam

Add a Gemini adapter beneath the BSS-V2 neutral contracts and route resolver, using deterministic transport tests only. It supports only the surfaces needed to catch up to current Bridge/IDSER direction: structured reasoning, PDF/document perception, and streaming chat when the existing interactive surface activates it.

## Scope and forbidden work

Implement secret-bound Gemini configuration, bounded request translation, response/stream parsing, cancellation/timeouts, normalized error classes, usage/provenance, and Atlas-side schema revalidation. Preserve source-grant handoff and `NormalizedDocument v1`; absent geometry/confidence remains absent. Do not activate a route, make live calls, persist usage, implement capacity/privacy/fallback policy, introduce provider-hosted Atlas state, or leak Gemini SDK types into contracts.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-003-01 | Gemini structured requests map bounded messages/schema and require complete Atlas-side validation after parsing. | Mock-transport request/response tests. **PASS iff** invalid/malformed/provider-valid-but-Atlas-invalid output is rejected without schema weakening. | semantic-worker contract |
| RC-BSSV2-003-02 | Gemini PDF perception accepts only explicit bounded input and produces a Bridge intermediate compatible with existing normalization. | Synthetic PDF adapter tests. **PASS iff** no storage path/hosted file is used and `NormalizedDocument v1` normalization succeeds without fabricated optional fields. | BSS-009 perception tests |
| RC-BSSV2-003-03 | Streaming, cancellation, request/response bounds, and provider errors normalize to Bridge contracts. | Deterministic stream/error tests. **PASS iff** cancellation terminates, post-output replay is absent, and secret-safe stable errors/provenance result. | BSS-005 SSE |
| RC-BSSV2-003-04 | Credentials and provider SDK types remain Bridge-internal. | Config/redaction/static boundary tests. **PASS iff** no secret/SDK type reaches contracts, logs, snapshots, payloads, or trusted tables. | contracts typecheck |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-003-ATLAS-SOURCE` — Atlas authorizes bytes and validates results.
- **Trust transitions:** `SEAM-BSSV2-003-CREDENTIAL` — Gemini secret is Bridge deployment-only; `SEAM-BSSV2-003-BOUNDED-INPUT` — explicit bounded input alone crosses provider boundary.
- **Prohibited coupling:** `COUPLING-BSSV2-003-SDK-LEAK` — no Gemini API type in Atlas/skill/trusted contracts.
- **Unresolved policy:** `SEC-GAP-BSSV2-003-GEMINI-PRIVACY` — route privacy qualification is BSS-V2-004/009 work.
- **Review bindings:** `REV-READY-BSSV2-003-01` validates secret/redaction boundary; `REV-READY-BSSV2-003-02` validates bounded input and no hosted Atlas state; `REV-READY-BSSV2-003-03` validates SDK isolation.

## Validation, Docker, and handoff

Run adapter conformance tests with injected/mock transport, schema, perception normalization, stream/cancel, error/redaction, existing Mistral regression, and affected typechecks. No account or credential is needed and no live request is permitted. Hard stop: a provider contract incompatibility with accepted Atlas semantics is a planning finding. On PASS, BSS-V2-004 alone may use real Gemini credentials.

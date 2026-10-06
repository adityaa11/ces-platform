# BSS-V2-004-03-04: Anoman reference StructuredReasoningProvider adapter

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.03-04`
- **Dependencies:** BSS-V2-001 CK `PASS`; BSS-V2-002 route-registry contract; BSS-V2-003 retained Gemini adapter; explicit `go`
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§3, 7, 9.04, 10, 12–13
- **Qualification reference:** [SPIKE-004 ticket](../Anoman_Spike_Phase/SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md) and [bounded GO evidence](../../../feedback/SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md) record two-call terminal `FAIL`; this is historical evidence and does not authorize activation or alter this adapter contract.

## Outcome

Add Anoman as a distinct Agents Bridge adapter implementing the existing `StructuredReasoningProvider` capability. It executes already-prepared structured messages and returns untrusted JSON plus normalized provenance; Atlas schemas, prompt generation and source handling remain outside the adapter.

## Scope and forbidden work

Own deployment-only `ANOMAN_API_KEY` configuration; HTTPS `https://api.anoman.io/v1/chat/completions`; requested `gemini-2.5-flash` identity for this qualified route; `temperature: 0`, `stream: false`, and `response_format: {type: "json_object"}`; bounded request/response, timeout and cancellation; auth/rate-limit/provider error normalization; JSON response extraction; normalized usage and safely available routing/cost/cache metadata; route adapter identity; composition-root injection; deterministic transport tests.

The adapter may treat `schema` as a local hint and ignore it for transport. Atlas validates output above the adapter. Add Anoman additively to the existing route registry/configuration and composition root so route identity and adapter version are server-controlled; do not redesign BSS-V2-002. The route may be wired and deterministically exercised here but must remain unavailable for live semantic execution until BSS-V2-004-03-06 qualifies it. Do not import `@atlas/skills` or semantic Zod; inspect `NormalizedDocument`; build source slots; finalize extraction; branch semantic-worker behavior by provider; proxy or modify `GeminiProvider`; remove Gemini; add retry/fallback or semantic repair. No provider call in this ticket.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040304-01 | Adapter conforms to the neutral structured reasoning interface and keeps vendor request/response types private. | Deterministic fake-transport conformance and import-boundary checks. **PASS iff** callers exchange only normalized capability types. | provider-capability tests |
| RC-BSSV2-0040304-02 | Frozen endpoint/model/request mode, bounds, cancellation and normalized failures are applied. | Request-capture and failure matrix tests. **PASS iff** endpoint/identity/options are pinned and malformed/oversized/auth/rate-limit/timeout cases normalize without leaking bodies or credentials. | adapter transport tests |
| RC-BSSV2-0040304-03 | Provenance includes safely available provider/model/endpoint/latency/attempt and usage/route metadata. | Deterministic response fixtures and redaction checks. **PASS iff** optional vendor metadata is normalized/bounded and secrets/raw content are excluded. | provenance tests |
| RC-BSSV2-0040304-04 | Existing route registry recognizes a distinct Anoman adapter identity additively; composition leaves direct Gemini intact and does not activate a live route. | Route parser/resolver tests, composition tests and static/import inspection. **PASS iff** callers cannot select provider/model/endpoint, Gemini remains separate, and live profile rejects unqualified Anoman. | BSS-V2-002/003 regressions |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-0040304-BRIDGE-EXECUTION` — Bridge is the provider execution boundary; Atlas owns semantic meaning and accepted state.
- **Trust boundary:** `TRUST-BSSV2-0040304-ANOMAN-RESPONSE` — provider output/metadata is untrusted and is not parsed into trusted Atlas results by this adapter.
- **Sensitive assets:** `ASSET-BSSV2-0040304-API-CREDENTIAL` and `ASSET-BSSV2-0040304-SOURCE-PACKET` — deployment credential and potentially confidential prompt/source payload.
- **Identity context:** `IDENTITY-BSSV2-0040304-ROUTE-PROVENANCE` — preserve configured route identity, requested/served model when available, and execution telemetry.
- **Extension seam:** `SEAM-BSSV2-0040304-CREDENTIAL-AND-TRANSPORT` — secret loading, redacted errors, request bounds, cancellation and normalized provenance remain explicit.
- **Prohibited coupling:** `COUPLING-BSSV2-0040304-SEMANTIC-ADAPTER` — adapter does not own schemas, prompts, source mapping, finalization, worker semantics or Gemini.
- **Verification seam:** `VERIFY-BSSV2-0040304-TRANSPORT-CONFORMANCE` — deterministic transport, malformed/error/boundary/cancellation and secret-redaction evidence.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040304-ANOMAN-RETENTION` — legal/residency/retention, customer consent and provider data policy remain separate policy decisions.
- **Review binding:** `REV-READY-BSSV2-0040304-01` verifies credential isolation, redaction, normalized provenance and provider-neutral contract conformance.

## Validation and handoff

Run fake-transport adapter tests, configuration and provider-boundary checks in Docker Compose; never emit `.env`, credentials, authorization headers or full live response bodies. No external request is authorized. On PASS, mark `awaiting_review` and stop for CK. Hard stop: prepared messages can be executed under deterministic tests; live semantic activation waits for 004-03-06.

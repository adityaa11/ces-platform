# CES-GF-AGB-003 — Agents Bridge: Gemini Provider Adapter

**Phase:** 3D — Central Agent Provider Foundation  
**Parent:** Greenfield Product Suite  
**Status:** Implemented locally; hosted CI pending

## Goal

Implement Gemini as the first provider adapter for the provider-neutral
structured-generation contract.

## Work

- Call the trusted Gemini `generateContent` endpoint with native `fetch`.
- Keep `GEMINI_API_KEY` server-side and separate from caller credentials.
- Resolve controlled model aliases to allowlisted physical Gemini models.
- Translate provider-neutral system instructions, messages, response schema,
  and budgets into Gemini `generateContent`.
- Simplify unsupported JSON Schema constructs when required without weakening
  application-side validation.
- Parse exactly the single requested candidate and join its text parts.
- Detect missing candidates, safety blocks, truncation, malformed JSON, and
  intermediate-schema violations.
- Bound provider response bytes and require an explicitly successful completion
  state.
- Apply abort-based timeouts and bounded retries with jitter only for transient
  network failures and permitted HTTP statuses.
- Honor reasonable `Retry-After` values without allowing unbounded waits.
- Return provider-neutral output, resolved-model metadata, bounded usage
  metadata, and typed failures to the shared executor.
- Keep Atlas schemas, prompts, provenance, IDs, and review rules out of the
  provider adapter.

## Acceptance criteria

- [x] Callers cannot control the Gemini URL, API version, API key, or arbitrary
      model identifier.
- [x] Normal tests make no external network requests.
- [x] Transient `429` and supported `5xx` responses retry within configured
      bounds.
- [x] Gemini `400`, authentication failures, and invalid output do not retry.
- [x] Timeout produces a distinct provider-timeout failure.
- [x] Malformed, blocked, empty, truncated, or schema-invalid output never
      reaches a workflow transformer as valid data.
- [x] Provider responses, prompts, source documents, and secrets remain
      redacted from errors and logs.
- [x] The provider package has no Atlas import or Atlas-specific behavior.

## Required evidence

- [x] Captured mock request proving headers and structured-output configuration.
- [x] Model allowlist and URL-construction tests.
- [x] Retry, `Retry-After`, timeout, and no-retry fixtures.
- [x] Candidate parsing and every invalid-response fixture.
- [x] Response-size, finish-state, resolved-model, and bounded-usage fixtures.
- [x] Network-denial test for the normal test suite.

## Out of scope

- Agent-specific schemas, prompts, and result transformation.
- Alternative model providers.
- Provider billing aggregation.
- Automatic model fallback.

## Depends on

- `CES-GF-AGB-002`

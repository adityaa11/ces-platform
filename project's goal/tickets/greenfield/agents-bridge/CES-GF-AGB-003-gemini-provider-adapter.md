# CES-GF-AGB-003 — Agents Bridge: Gemini Provider Adapter

**Phase:** 3D — Central Agent Provider Foundation  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Add a hardened server-side Gemini adapter that produces validated structured
extraction data without exposing Gemini-specific behavior to CES callers.

## Work

- Call the trusted Gemini `generateContent` endpoint with native `fetch`.
- Keep `GEMINI_API_KEY` server-side and separate from caller credentials.
- Enforce an explicit model allowlist and require configured, requested, and
  invoked models to agree.
- Generate a Gemini-compatible JSON Schema from the internal extraction schema,
  simplifying unsupported JSON Schema constructs when required.
- Build system and user prompts that clearly separate project intent, source
  index, and line-numbered source content.
- Parse text from the first valid candidate and handle joined text parts.
- Detect missing candidates, safety blocks, truncation, malformed JSON, and
  intermediate-schema violations.
- Apply abort-based timeouts and bounded retries with jitter only for transient
  network failures and permitted HTTP statuses.
- Honor reasonable `Retry-After` values without allowing unbounded waits.
- Return provider-neutral typed failures to the Atlas route.

## Acceptance criteria

- [ ] Callers cannot control the Gemini URL, API version, API key, or arbitrary
      model identifier.
- [ ] Normal tests make no external network requests.
- [ ] Transient `429` and supported `5xx` responses retry within configured
      bounds.
- [ ] Gemini `400`, authentication failures, and invalid output do not retry.
- [ ] Timeout produces a distinct provider-timeout failure.
- [ ] Malformed, blocked, empty, truncated, or schema-invalid output never
      reaches a workflow transformer as valid data.
- [ ] Provider responses, prompts, source documents, and secrets remain
      redacted from errors and logs.

## Required evidence

- [ ] Captured mock request proving headers and structured-output configuration.
- [ ] Model allowlist and URL-construction tests.
- [ ] Retry, `Retry-After`, timeout, and no-retry fixtures.
- [ ] Candidate parsing and every invalid-response fixture.
- [ ] Network-denial test for the normal test suite.

## Out of scope

- Atlas candidate metadata transformation.
- Alternative model providers.
- Provider billing aggregation.
- Automatic model fallback.

## Depends on

- `CES-GF-AGB-002`


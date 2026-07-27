# CES-GF-AGB-004 — Agents Bridge: Atlas Requirement Extraction Agent

**Phase:** 3D — Central Agent Provider Foundation  
**Parent:** Greenfield Product Suite  
**Status:** Implemented locally; hosted CI pending

**Evidence:** [`evidence/CES-GF-AGB-004-local-atlas-agent.md`](evidence/CES-GF-AGB-004-local-atlas-agent.md)

## Goal

Implement Atlas requirement extraction as the first registered agent and
preserve the existing Atlas HTTP provider protocol through a compatibility
route.

## Work

- Register `atlas.requirement-extractor` version `1.0.0` with its input,
  intermediate, output, policy, prompt, and transformation definitions.
- Allow only the structured-generation mode, controlled model aliases, no
  tools, bounded execution, and mandatory human review.
- Validate the strict Atlas compatibility envelope and its contract version.
- Validate the nested request with `AtlasProviderRequestSchema`.
- Map the legacy allowlisted Atlas model field to a server-controlled model
  alias; generic callers cannot select a physical model.
- Convert Markdown source content to a stable line-numbered prompt
  representation without changing stored source hashes.
- Resolve every Gemini source reference against the original Atlas request.
- Copy trusted paths and content hashes from matched source documents.
- Reject unknown document IDs and invalid or out-of-bounds source ranges.
- Deterministically order candidates, assign canonical IDs, and remap
  business-rule, uncertainty, conflict, and clarification references.
- Restrict origins to `explicit` or `inferred` and review states to `candidate`
  or `needs_confirmation`.
- Stamp schema, provider, model, prompt-contract, and review metadata using
  trusted runtime values.
- Validate all references and the final result with
  `AtlasProviderResultSchema`.
- Return the result directly, without a bridge or Gemini response envelope.
- Make `POST /v1/atlas/analyze` delegate through the same registered-agent
  executor used by `POST /v1/agents/atlas.requirement-extractor/execute`.
- Add adversarial prompt-injection fixtures proving source text cannot change
  provider, model, tools, schema, metadata, or review policy.

## Acceptance criteria

- [x] A valid Atlas request returns a direct, schema-valid
      `AtlasProviderResult`.
- [x] Source paths and hashes exactly match the original Atlas request.
- [x] Gemini cannot override provider, model, prompt-contract, schema, or review
      metadata.
- [x] Duplicate IDs, unknown documents, invalid ranges, dangling references,
      and forbidden review states fail closed.
- [x] Equivalent semantic Gemini output produces deterministic candidate IDs
      and ordering.
- [x] Provider failures map to sanitized Atlas bridge errors.
- [x] The existing Atlas CLI completes candidate extraction and returns exit
      code `7` without incompatible changes.
- [x] No candidate is approved, corrected, rejected, or superseded by the
      bridge.
- [x] Generic and compatibility routes produce the same validated agent result
      for equivalent input.
- [x] Given the same normalized intermediate result, excluding array order and
      temporary model-generated identifiers, normalization produces
      byte-equivalent ordering, identifiers, and references.

## Required evidence

- [x] Health and complete successful-route tests.
- [x] Invalid envelope, contract, model, and Atlas request fixtures.
- [x] Trusted metadata and source-resolution tests.
- [x] Deterministic sorting, ID assignment, and reference-remapping tests.
- [x] Unknown-source, dangling-reference, duplicate-ID, and forbidden-state
      fixtures.
- [x] Mocked end-to-end Atlas CLI-to-bridge integration test.
- [x] Final Atlas schema validation fixture.
- [x] Prompt-injection, model-remapping, generic-route equivalence, and
      mandatory-human-review fixtures.

## Out of scope

- Human review automation.
- Sending original PDF bytes to Gemini.
- Additional production agent workflows.
- Production public ingress.

## Depends on

- `CES-GF-AGB-003`

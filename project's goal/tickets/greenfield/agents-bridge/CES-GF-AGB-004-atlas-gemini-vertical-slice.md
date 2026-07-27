# CES-GF-AGB-004 — Agents Bridge: Atlas-to-Gemini Vertical Slice

**Phase:** 3D — Central Agent Provider Foundation  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Implement `POST /v1/atlas/analyze` as a complete adapter from the existing Atlas
HTTP provider protocol to Gemini structured extraction and back to a validated
`AtlasProviderResult`.

## Work

- Validate the strict Atlas HTTP envelope and its contract version.
- Validate the nested request with `AtlasProviderRequestSchema`.
- Reject unsupported or mismatched models before a provider call.
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

## Acceptance criteria

- [ ] A valid Atlas request returns a direct, schema-valid
      `AtlasProviderResult`.
- [ ] Source paths and hashes exactly match the original Atlas request.
- [ ] Gemini cannot override provider, model, prompt-contract, schema, or review
      metadata.
- [ ] Duplicate IDs, unknown documents, invalid ranges, dangling references,
      and forbidden review states fail closed.
- [ ] Equivalent semantic Gemini output produces deterministic candidate IDs
      and ordering.
- [ ] Provider failures map to sanitized Atlas bridge errors.
- [ ] The existing Atlas CLI completes candidate extraction and returns exit
      code `7` without incompatible changes.
- [ ] No candidate is approved, corrected, rejected, or superseded by the
      bridge.

## Required evidence

- [ ] Health and complete successful-route tests.
- [ ] Invalid envelope, contract, model, and Atlas request fixtures.
- [ ] Trusted metadata and source-resolution tests.
- [ ] Deterministic sorting, ID assignment, and reference-remapping tests.
- [ ] Unknown-source, dangling-reference, duplicate-ID, and forbidden-state
      fixtures.
- [ ] Mocked end-to-end Atlas CLI-to-bridge integration test.
- [ ] Final Atlas schema validation fixture.

## Out of scope

- Human review automation.
- Sending original PDF bytes to Gemini.
- Non-Atlas agent workflows.
- Production public ingress.

## Depends on

- `CES-GF-AGB-003`


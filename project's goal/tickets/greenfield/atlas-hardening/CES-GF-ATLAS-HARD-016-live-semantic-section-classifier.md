# CES-GF-ATLAS-HARD-016 — Live Semantic Section Classifier

**Stage:** Corrective Atlas hardening
**Status:** Planned

## Objective

Execute a domain-neutral structure classifier in production and classify
sections by semantic purpose without fixed heading text, language, document
title, domain vocabulary, or qualification-fixture expectations.

## Dependencies

- ATLAS-HARD-001 through ATLAS-HARD-004.
- DAPE bounded-role and revision-tuple contracts.

## Work

- Run `atlas.structure-classifier` on canonical source units before extraction.
- Add an extensible section-purpose registry for normative rules, workflows,
  roles/permissions, calculations, states/lifecycle, reporting/audit, data,
  acceptance/deliverables, terminology, context, and `unknown`.
- Classify from content, local structure, evidence, and document context;
  headings are evidence rather than closed routing keys.
- Preserve multiple plausible purposes, ambiguity, confidence, and unknown
  classifications for review.
- Pin source, classifier, prompt, provider, model, registry, and schema
  revisions.
- Remove fixed-heading production routing and keep qualification oracles
  unavailable to production code.

## Outputs

`document-structure.json`, `section-classifications.json`,
`section-purpose-registry.json`, diagnostics, and revision metadata.

## Acceptance criteria

- [ ] `atlas run` executes classification before candidate extraction.
- [ ] Equivalent content under different headings routes to the same purposes.
- [ ] English, Indonesian, heading-free, table, and malformed-layout fixtures
      retain equivalent normative coverage.
- [ ] Unknown and ambiguous sections remain grounded and review-required.
- [ ] Production code contains no Safara heading, entity, oracle, rule-count,
      or expected-text routing.
- [ ] Every canonical section has a deterministic disposition.
- [ ] Provider failure or incomplete classification blocks downstream success.
- [ ] Organization section purposes require no core switch changes.

## Tests and evidence

Heading aliases, translations, misleading and missing headings, mixed-purpose
sections, tables, OCR noise, unknown purposes, provider failure, revision
mismatch, and deterministic replay.

## Out of scope

Canonical provider output and CLI cutover are handled by ATLAS-HARD-017/018.


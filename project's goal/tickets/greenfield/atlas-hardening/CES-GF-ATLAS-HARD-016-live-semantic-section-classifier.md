# CES-GF-ATLAS-HARD-016 — Live Semantic Section Classifier

**Stage:** Corrective Atlas hardening
**Status:** Implemented

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

- [x] `atlas run` executes classification before candidate extraction.
- [x] Equivalent content under different headings routes to the same purposes.
- [x] English, Indonesian, heading-free, table, and malformed-layout fixtures
      retain equivalent normative coverage.
- [x] Unknown and ambiguous sections remain grounded and review-required.
- [x] Production code contains no Safara heading, entity, oracle, rule-count,
      or expected-text routing.
- [x] Every canonical section has a deterministic disposition.
- [x] Provider failure or incomplete classification blocks downstream success.
- [x] Organization section purposes require no core switch changes.

## Tests and evidence

Heading aliases, translations, misleading and missing headings, mixed-purpose
sections, tables, OCR noise, unknown purposes, provider failure, revision
mismatch, and deterministic replay.

Implemented in the Atlas role contracts, the live
`atlas.structure-classifier` bridge agent, and the real `atlas run` command.
The command publishes `document-structure.json`,
`section-purpose-registry.json`, and `section-classifications.json` before
candidate extraction. Contract and agent tests cover extensibility,
completeness, invented-purpose rejection, ambiguity/unknown preservation,
content-driven prompting, and pinned execution metadata.

Verification:

- `corepack pnpm --filter @company/ces-atlas-role-contracts typecheck`
- `corepack pnpm --filter @company/ces-agents-bridge typecheck`
- `corepack pnpm --filter @company/ces-cli typecheck`
- `corepack pnpm vitest run packages/atlas-role-contracts/src/index.test.ts apps/agents-bridge/src/agents/atlas-structure-classifier/agent.test.ts apps/agents-bridge/src/agents/atlas-requirement-extractor/atlas-route.test.ts apps/cli/src/dape.test.ts`

## Out of scope

Canonical provider output and runtime integration are handled by
ATLAS-HARD-017.

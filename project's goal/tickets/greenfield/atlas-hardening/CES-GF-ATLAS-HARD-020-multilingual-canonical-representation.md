# CES-GF-ATLAS-HARD-020 — Multilingual Canonical Representation

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Preserve authoritative original-language evidence while supporting configured
canonical language, display language, and reviewable cross-language
equivalence.

## Dependencies

- ATLAS-HARD-018 and ATLAS-HARD-019.

## Work

- Add original and canonical statement/language contracts.
- Add `detected_language`, `language_detection_method`, and
  `language_confidence` at source-unit, candidate, and canonical-statement
  granularity so mixed-language documents do not inherit one document-level
  guess.
- Treat translations as interpretations, never source evidence.
- Produce reviewable `translation_equivalent` proposals with confidence,
  rationale, provenance, and review status.
- Add a governed project terminology lifecycle:
  terminology proposal, human review, then an approved versioned terminology
  registry.
- Serialize that lifecycle separately as `terminology-proposals.json`,
  `terminology-decisions.json`, and
  `approved-terminology-registry.json`.
- Allow agents to detect terms and propose aliases, translations, and canonical
  concepts, but never publish registry entries, approve their own proposals,
  silently replace approved terminology, or alter registry versions without
  governance.
- Prevent silent cross-language merge and language-dependent identity.
- Surface low-confidence language detection as a reviewable finding.

## Outputs

Multilingual records, equivalence proposals, `terminology-proposals.json`, and
contracts for `terminology-decisions.json` and
`approved-terminology-registry.json`, plus language-policy metadata.
ATLAS-HARD-026 exclusively materializes human decisions and the approved
registry.

## Acceptance criteria

- [ ] Original wording remains exact and source-grounded.
- [ ] Generated translations create no source references.
- [ ] Canonical and display languages are explicit and configurable.
- [ ] Source units, candidates, and canonical statements carry language,
      detection method, and confidence metadata.
- [ ] Mixed-language documents preserve granular language metadata.
- [ ] Low-confidence language detection remains review-required.
- [ ] Cross-language equivalence is reviewed before consolidation.
- [ ] Display-language changes preserve stable record IDs.
- [ ] Uncertain terminology remains review-required.
- [ ] Agents can propose terminology but only human-reviewed decisions
      materialize an approved, versioned terminology registry.
- [ ] Proposed terminology, human decisions, and the approved registry remain
      separate artifacts with no pending proposal in an approved registry.
- [ ] HARD-020 cannot publish an approved registry; HARD-026 materializes it
      from immutable proposals plus human decisions.

## Tests and evidence

Indonesian/English equivalence, mixed-language source units, low-confidence
detection, non-equivalence, aliases, ambiguous translation, terminology
versioning, unauthorized registry publication, display switching, and
evidence-lineage fixtures.

## Out of scope

Workflow structure and assignment are handled by ATLAS-HARD-021 and
ATLAS-HARD-022.

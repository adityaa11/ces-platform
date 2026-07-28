# CES-GF-ATLAS-HARD-002 — Requirement Taxonomy

**Stage:** Atlas hardening foundation
**Status:** Implemented

## Objective

Ensure the completed DAPE domain concepts and semantic union represent every
hardening-plan extraction category without becoming a permanently closed
taxonomy or collapsing novel meaning into generic rules.

## Dependencies

- ATLAS-HARD-001.
- Completed DAPE-002 and DAPE-003 contracts.

## Work

- Gap-audit the canonical semantic union against all 16 required categories.
- Define an extensible kind registry containing CES built-in definitions,
  organization-specific registered definitions, and an `unknown` fallback.
- Pin registry identity and schema version in every extraction revision tuple;
  extensions must not require changes to unrelated extractors.
- Define versioned kinds and relationships for capabilities, workflow steps,
  rules, validations, calculations, permissions, states/transitions,
  lifecycle/retention, uniqueness, reporting/export, acceptance material,
  terminology, procedures, and security restrictions.
- Specify compatibility projections for existing Requirement Packages.
- Preserve unknown-but-normative candidates for review instead of discarding
  or forcing them into the nearest built-in kind.

## Outputs

One versioned extensible taxonomy registry, compatibility mapping, and category
coverage matrix referencing the existing DAPE packages.

## Acceptance criteria

- [x] Every hardening category has a canonical kind or documented lossless
      representation.
- [x] Validation, calculation, permission, lifecycle, reporting, and security
      records remain distinguishable.
- [x] Unknown normative content is reviewable and source-grounded.
- [x] Organization-specific kinds can be registered through a versioned
      contract without changing unrelated extractors.
- [x] An unregistered kind remains `unknown` with
      `classification_required`; it is never coerced into a built-in kind.
- [x] Free-form unregistered provider kind strings cannot bypass the registry.
- [x] Category relationships and compatibility projections are deterministic.
- [x] Existing DAPE and legacy Atlas consumers remain compatible or receive an
      explicit migration path.

## Tests and evidence

Positive fixtures for every built-in category and a registered organization
kind; negative fixtures for generic-rule collapse, forced classification,
unknown-category loss, unpinned/unregistered kinds, invalid relationships, and
lossy projections.

## Completion evidence

- Added a versioned, hashed semantic-kind registry alongside the unchanged
  legacy semantic-record union.
- Registered all 16 hardening categories plus the mandatory `unknown` fallback.
- Added pinned organization extensions and exact registry resolution.
- Focused semantic-schema and architecture tests: 23 passed.
- Package TypeScript build passed.

## Out of scope

Candidate discovery, model approval, and UI labels.

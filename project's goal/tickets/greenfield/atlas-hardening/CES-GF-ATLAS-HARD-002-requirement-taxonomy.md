# CES-GF-ATLAS-HARD-002 — Requirement Taxonomy

**Stage:** Atlas hardening foundation
**Status:** Planned

## Objective

Ensure the completed DAPE domain concepts and semantic union represent every
hardening-plan extraction category without collapsing them into generic rules.

## Dependencies

- ATLAS-HARD-001.
- Completed DAPE-002 and DAPE-003 contracts.

## Work

- Gap-audit the canonical semantic union against all 16 required categories.
- Define versioned kinds and relationships for capabilities, workflow steps,
  rules, validations, calculations, permissions, states/transitions,
  lifecycle/retention, uniqueness, reporting/export, acceptance material,
  terminology, procedures, and security restrictions.
- Specify compatibility projections for existing Requirement Packages.
- Preserve unknown-but-normative candidates for review instead of discarding
  them.

## Outputs

One versioned canonical taxonomy, compatibility mapping, and category coverage
matrix referencing the existing DAPE packages.

## Acceptance criteria

- [ ] Every hardening category has a canonical kind or documented lossless
      representation.
- [ ] Validation, calculation, permission, lifecycle, reporting, and security
      records remain distinguishable.
- [ ] Unknown normative content is reviewable and source-grounded.
- [ ] Category relationships and compatibility projections are deterministic.
- [ ] Existing DAPE and legacy Atlas consumers remain compatible or receive an
      explicit migration path.

## Tests and evidence

Positive fixtures for every category; negative fixtures for generic-rule
collapse, unknown-category loss, invalid relationships, and lossy projections.

## Out of scope

Candidate discovery, model approval, and UI labels.

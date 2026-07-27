# CES-GF-DAPE-003 — Domain-Open Semantic Record Contracts

**Priority:** P0 — Atlas completeness  
**Status:** Planned

## Goal

Replace the single actor-action-resource candidate shape with controlled,
domain-open semantic record kinds.

## Work

- Add a discriminated semantic-record union for functional requirements,
  business, permission, validation, calculation and workflow rules, data
  requirements, state models, reports, acceptance criteria, deliverables, and
  nonfunctional requirements.
- Reference project concepts and exact source units.
- Define explicit origin, confidence, review status, uncertainty, correction,
  identity, ordering, and revision hashing.
- Validate cross-record and cross-concept references deterministically.
- Preserve agent-neutral and provider-neutral contracts.

## Acceptance criteria

- [ ] Safara NIK validation, balance formula, Finance permission, payment state
      model, readiness workflow, report, scenario, and deliverable each fit a
      faithful semantic kind.
- [ ] Arbitrary domain values do not weaken structural validation.
- [ ] Agent output cannot assign approval state.
- [ ] Invalid, duplicate, dangling, or stale records fail closed.

## Depends on

- `CES-GF-DAPE-002`


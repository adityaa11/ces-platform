# CES-GF-ARCH-001 — Architect: Catalog and Deterministic Rubric

**Phase:** 4A — Architect Analysis  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Produce explainable architecture candidates from the authoritative approved
ATLAS-V2 knowledge-bundle revision, the governed CES Policies baseline-awareness
output, and project constraints using deterministic, versioned scoring.

## Work

- Define Project Intent, System Characteristic, and technology-catalog contracts.
- Accept the ATLAS-V2-006 approved knowledge-bundle revision/hash as
  authoritative business/system input.
- Accept the validated POL-015 baseline identity, Context Bindings, concerns,
  capability needs, applicability, and resolution states as mandatory
  engineering-awareness input.
- Derive characteristics from approved requirements, business rules,
  permissions, validations, calculations, state models, nonfunctional
  requirements, project intent, and applicable CES Policy bindings with
  traceable rules.
- Score candidate suitability against capability needs without allowing
  Policies to prescribe a technology or implementation.
- Prohibit independent PRD reinterpretation and legacy RequirementCollection as
  the primary truth.
- Define versioned scoring factors, weights, exclusions, and missing-input behavior.
- Catalog the controlled initial architecture styles and candidate stacks.
- Report adapter availability independently from architectural suitability.
- Allow agent-generated prose only as non-authoritative explanation.

## Acceptance criteria

- [ ] Identical normalized inputs and catalog versions produce identical scores.
- [ ] Every score exposes factors, weights, and source facts.
- [ ] Missing high-impact inputs block or visibly reduce a recommendation.
- [ ] Adapter unavailability cannot silently lower policy obligations.
- [ ] Laravel is not hard-coded as the universally preferred stack.
- [ ] Every characteristic cites approved semantic IDs and the project-model
      revision.
- [ ] Every applicable Context Binding and capability need is either reflected
      in scoring or reported as an explicit unsupported gap.
- [ ] Missing, stale, unvalidated, or cross-project Policies baselines block
      project-specific scoring and recommendation finalization.

## Required evidence

- [ ] Catalog and rubric schemas.
- [ ] Golden scoring fixtures and boundary cases.
- [ ] Adapter-availability fixtures.
- [ ] Approved ATLAS-V2 bundle input and legacy-input rejection fixtures.
- [ ] Valid, stale, missing, and cross-project POL-015 baseline fixtures.
- [ ] Traceability fixtures from Context Bindings and capability needs to
      scoring factors or explicit gaps.

## Out of scope

- Human approval and ADR emission.
- Benchmark guarantees.
- Automatic adapter creation.

## Depends on

- `CES-GF-ATLAS-V2-006`
- `CES-GF-POL-015`

# CES-GF-ARCH-001 — Architect: Catalog and Deterministic Rubric

**Phase:** 4A — Architect Analysis  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Produce explainable architecture candidates from approved requirements and
project constraints using versioned data and deterministic scoring.

## Work

- Define Project Intent, System Characteristic, and technology-catalog contracts.
- Derive characteristics from approved facts with traceable rules.
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

## Required evidence

- [ ] Catalog and rubric schemas.
- [ ] Golden scoring fixtures and boundary cases.
- [ ] Adapter-availability fixtures.

## Out of scope

- Human approval and ADR emission.
- Benchmark guarantees.
- Automatic adapter creation.

# CES-003 — Phase 1: Implement Capability and Trait Resolution

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Planned

## Goal

Derive the initial controlled capabilities and traits from explicit requirement facts using deterministic declarative rules.

## Work

- Create versioned capability and trait registries.
- Implement declarative rule contracts and deterministic rule evaluation.
- Support the three initial capabilities and seven initial traits.
- Record rule ID, evidence path, deterministic reason, and registry version for every result.
- Keep optional asserted capabilities separate and validate them against facts.
- Reject unknown registry IDs and invalid assertions with actionable errors.

## Acceptance criteria

- [ ] The profile-picture requirement resolves the expected capabilities and traits.
- [ ] Changing rule input order does not change normalized output.
- [ ] Unsupported assertions cannot introduce policies or bypass resolution.
- [ ] Duplicate evidence is normalized and sorted.
- [ ] Resolver tests cover positive, negative, unknown-ID, and contradictory-fact cases.

## Required evidence

- [ ] Attach the resolved capability/trait artifact for the profile-picture fixture.
- [ ] Show rule IDs, evidence paths, reasons, and registry versions in that artifact.
- [ ] Attach passing resolver-test output, including unsupported assertion and unknown-ID cases.
- [ ] Attach a comparison proving reordered equivalent input produces identical normalized output.

## Exclusions

- No policy selection or adapter behavior.


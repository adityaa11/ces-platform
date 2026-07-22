# CES-002 — Phase 1: Define Stack-Agnostic Core Contracts

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Planned

## Goal

Define versioned Zod schemas and TypeScript types for all core inputs and outputs without framework-specific terminology.

## Work

- Define Requirement Package, business rule, uncertainty, operation, input, constraint, and effect schemas.
- Add optional source traceability fields for document ID/version, section, change request, and parent requirement IDs.
- Define the combined project-file schema and separate parsed `ProjectAssuranceContext` and `ProjectTechnicalContext` types.
- Define Capability, Trait, Policy, Policy Obligation, and Policy Manifest contracts.
- Model `requirement_level` separately from `resolution_state`.
- Define normalized serialization and meaningful schema-version errors.
- Export contracts only through explicit package public APIs.

## Acceptance criteria

- [ ] YAML and JSON inputs validate into the same normalized domain representation.
- [ ] The policy engine can receive assurance context without technical context.
- [ ] The Policy Manifest cannot contain adapter IDs or framework implementation fields.
- [ ] Contract tests cover valid inputs, invalid inputs, unknown fields, and schema-version mismatches.
- [ ] Core-contract source contains no Laravel, Spring, .NET, NestJS, Go API, or framework-package references.
- [ ] Manually authored requirements validate without source metadata, while traceable requirements preserve all supplied source references.

## Required evidence

- [ ] Link the versioned schemas and exported TypeScript contract entry points.
- [ ] Attach passing contract-test output for valid, invalid, unknown-field, and version-mismatch fixtures.
- [ ] Attach normalized YAML-versus-JSON comparison output.
- [ ] Attach a terminology/dependency scan proving core contracts contain no framework-specific references.
- [ ] Attach contract fixtures proving optional source traceability round-trips without enabling PRD extraction.

## Exclusions

- No capability, trait, or policy resolution.


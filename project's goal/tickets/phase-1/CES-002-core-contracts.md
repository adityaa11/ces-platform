# CES-002 — Phase 1: Define Stack-Agnostic Core Contracts

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Define versioned Zod schemas and TypeScript types for all core inputs and outputs without framework-specific terminology.

## Work

- Define Requirement Package, business rule, uncertainty, operation, input, constraint, and effect schemas.
- Define an optional source-traceability schema for document ID/version, section, change request, and parent requirement IDs.
- Preserve source metadata when parsing YAML and JSON and during normalization.
- Include supplied source metadata in the normalized Requirement Package.
- Keep source metadata informational in Phase 1; it must not change policy meaning unless a future versioned rule explicitly uses it.
- Define the combined project-file schema and separate parsed `ProjectAssuranceContext` and `ProjectTechnicalContext` types.
- Define Capability, Trait, Policy, Policy Obligation, and Policy Manifest contracts.
- Model `requirement_level` separately from `resolution_state`.
- Define normalized serialization and meaningful schema-version errors.
- Export contracts only through explicit package public APIs.

## Acceptance criteria

- [x] YAML and JSON inputs validate into the same normalized domain representation.
- [x] The policy engine can receive assurance context without technical context.
- [x] The Policy Manifest cannot contain adapter IDs or framework implementation fields.
- [x] Contract tests cover valid inputs, invalid inputs, unknown fields, and schema-version mismatches.
- [x] Core-contract source contains no Laravel, Spring, .NET, NestJS, Go API, or framework-package references.
- [x] A manually authored requirement without `source` remains valid.
- [x] A traceable requirement preserves `document_id`.
- [x] A traceable requirement preserves `document_version`.
- [x] A traceable requirement preserves `section`.
- [x] A traceable requirement preserves `change_request_id`.
- [x] A traceable requirement preserves `parent_requirement_ids`.
- [x] Equivalent YAML and JSON source metadata normalize to byte-equivalent Requirement Package content.
- [x] Source metadata does not change resolved capabilities, traits, or policies in Phase 1.

## Required evidence

- [x] Link the versioned schemas and exported TypeScript contract entry points.
- [x] Attach passing contract-test output for valid, invalid, unknown-field, and version-mismatch fixtures.
- [x] Attach normalized YAML-versus-JSON comparison output.
- [x] Attach a terminology/dependency scan proving core contracts contain no framework-specific references.
- [x] Attach contract fixtures for absent and fully populated source metadata.
- [x] Attach field-by-field round-trip assertions for all source properties.
- [x] Attach a resolution comparison proving source metadata does not affect Phase 1 policy meaning.
- [x] Confirm no PRD extraction implementation or dependency was introduced.

Evidence: [CES-002 implementation evidence](../../evidence/phase-1/CES-002.md)

## Exclusions

- No capability, trait, or policy resolution.


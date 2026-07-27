# CES-GF-DAPE-016A — Early Shared-Model Adoption

**Stage:** Early downstream adoption
**Status:** Planned

## Objective

Propagate one ApprovedProjectModel revision through core, Assurance, Forge,
Verification, and graph projections. Architect already consumes it in ARCH-001.

## Business and architectural reason

Downstream products must not reread or simplify the original PRD, and Architect
must not wait for the full registry-evolution program.

## Dependencies

- DAPE-011 project-level compilation.

## Inputs

ApprovedProjectModel, reviewed mappings, Policy Manifest, architecture and
assurance contexts.

## Outputs

Revision-pinned cross-product traceability, core integration, Assurance, Forge
tasks, verification obligations/results, and graph projections.

## Contract changes

Add project-model ID/hash and source semantic IDs to every downstream artifact.

## Package ownership

Core, Assurance, implementation compiler/Forge, verification, integration, and
graph packages retain their existing authority boundaries.

## Deterministic responsibilities

Derivation, scoring, task obligations, evidence status, and projections remain
reproducible for pinned inputs.

## Agent responsibilities

Presentation or proposals only; no rewriting business truth or obligations.

## Failure statuses

`input_error`, `mapping_gap`, `adapter_gap`, `revision_mismatch`,
`verification_failure`.

## Exit codes

Preserve existing product exit codes; introduce no generic success on gaps.

## Backward-compatibility requirements

Existing single-package, Phase 1/2, profile-picture, adapter, and verification
flows remain valid.

## Required fixtures

Safara plus existing profile-picture and project-management integrations.

## Unit tests

Revision pinning and stable identity propagation per product.

## Integration tests

Source unit through semantic record, obligation, task, test, evidence, and
verification result is traversable.

## Negative tests

Mixed revisions, rewritten IDs, fabricated evidence, and obligation-changing
renderers fail closed.

## Completion evidence

Artifact samples, exact commands, deterministic rerun, compatibility suite.

## Explicit non-goals

Introducing Architect's canonical input, registry upgrades, standards research,
or migration impact views.

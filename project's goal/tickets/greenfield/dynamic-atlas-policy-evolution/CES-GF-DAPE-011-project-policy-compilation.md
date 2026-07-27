# CES-GF-DAPE-011 — Project-Level Policy Compilation

**Stage:** P1 deterministic core after registry foundation
**Status:** Planned

## Objective

Compile one deterministic project Policy Manifest from approved semantics,
reviewed mappings, assurance context, and pinned registry packs.

## Business and architectural reason

The compiler should be implemented against the final composition and identity
contracts rather than immediately reworked.

## Dependencies

- DAPE-013 extensible identities and triggers.

## Inputs

ApprovedProjectModel, SemanticDispositions, ProjectAssuranceContext,
RegistryComposition/Lock, and CES baseline.

## Outputs

Project Policy Manifest with model, semantic, mapping, capability, trait,
policy, registry, obligation, and gap identities.

## Contract changes

Add project compilation input and additive project-level manifest fields.

## Package ownership

Policy engine remains deterministic authority; manifest schema owns output;
mapping and registries remain separate inputs.

## Deterministic responsibilities

Validate approved/pinned inputs, evaluate triggers, resolve obligations/gaps,
canonicalize, hash and reproduce output.

## Agent responsibilities

None in compilation.

## Failure statuses

`mapping_gap`, `policy_gap`, `capability_gap`, `registry_lock_error`,
`registry_conflict`, `input_error`.

## Exit codes

Blocking gaps, invalid locks/conflicts and input errors remain distinct.

## Backward-compatibility requirements

Current single-Requirement-Package path and manifest fields remain compatible.

## Required fixtures

Safara project, profile-picture legacy, multi-pack, blocking gap, trigger,
assurance variation and registry mismatch.

## Unit tests

Input validation, triggers, obligation provenance, gaps, canonical output.

## Integration tests

Pinned equivalent inputs produce byte-identical manifests; old compilation is
unchanged.

## Negative tests

Raw agent output, unreviewed mapping, unpinned ID, mixed revision, unresolved
blocking gap and technical-context policy influence fail.

## Completion evidence

Compiler/API files, schemas, manifests/failures, commands, rerun and legacy
compatibility.

## Explicit non-goals

Downstream product adoption, registry publication, or research.


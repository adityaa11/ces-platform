# CES-GF-DAPE-013 — Extensible Registry Identities and Triggers

**Priority:** P2 — Extensible registries  
**Status:** Planned

## Goal

Replace authoritative closed capability, trait, and policy enums with
registry-validated identifiers while retaining deterministic behavior.

## Work

- Validate capability, trait, policy, trigger, dependency, implementation,
  evidence, verification, and standards IDs against pinned registries.
- Separate policy definitions from triggers and resolved obligations.
- Version definitions, triggers, dependencies, adapter mappings, guidance,
  evidence, and verification methods independently where practical.
- Add generalized transactional, state, audit, privacy, snapshot, calculation,
  and concurrency semantics required by Safara.
- Preserve additive compatibility adapters for existing enum consumers.

## Acceptance criteria

- [ ] Unknown IDs cannot enter deterministic compilation.
- [ ] Registry extensions require no core source-code enum edit.
- [ ] Trigger changes are distinguishable from policy-meaning changes.
- [ ] Adapter gaps and evidence gaps remain explicit.

## Depends on

- `CES-GF-DAPE-012`


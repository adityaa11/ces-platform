# CES-GF-FORGE-001 — Forge: Agent-Neutral Task Contract

**Phase:** 4B — Forge Implementation Contract  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Generate implementation tasks, tests, and evidence requirements that preserve
approved obligations independently of the selected coding agent.

## Work

- Define versioned task, acceptance, test, and evidence-reference contracts.
- Trace every task to requirements, rules, policies, and architecture decisions.
- Add dependency ordering, unresolved decisions, and prohibited shortcuts.
- Implement a neutral renderer and one Codex renderer.
- Normalize renderer output for semantic-equivalence testing.
- Reuse the existing Implementation Package rather than duplicating compiler logic.

## Acceptance criteria

- [ ] Every mandatory task obligation has upstream traceability.
- [ ] Neutral and Codex renderers contain equivalent obligations.
- [ ] Renderers cannot add, remove, or weaken policies.
- [ ] Blocked policy or architecture decisions remain blocked in tasks.
- [ ] Required tests and evidence are explicit.

## Required evidence

- [ ] Contract fixtures and validation tests.
- [ ] Renderer-equivalence tests.
- [ ] One generated feature task accepted by the existing verification flow.

## Out of scope

- Autonomous implementation.
- Stack-specific scaffolding.
- Claims of semantic correctness without verification.

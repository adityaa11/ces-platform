# CES-015 — Phase 1: Enforce Project-Pinned Adapter Loading

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Planned

## Goal

Make the combined project context authoritative for normal adapter ID and version selection.

## Work

- Change normal `compile` to load `project.ces.adapter.id` and `.version`.
- Remove the required `--adapter` option from normal compilation.
- Load the exact registered version and run compatibility checks.
- Permit only explicit diagnostic/test overrides using `--override-adapter <id>@<version>` plus test mode where required.
- Produce stable nonzero diagnostics for unknown, unavailable, incompatible, or conflicting selections.

## Acceptance criteria

- [ ] Normal compilation uses the project adapter ID and version.
- [ ] An unavailable or incompatible version fails clearly.
- [ ] An override conflicting with project configuration fails unless it is an explicit permitted diagnostic workflow.
- [ ] The fixture remains unavailable outside explicit test mode.
- [ ] Normal compilation succeeds without `--adapter`.

## Required evidence

- [ ] Attach adapter-loading and compatibility tests.
- [ ] Attach unavailable-version and mismatch diagnostics.
- [ ] Attach accepted/rejected fixture override runs.

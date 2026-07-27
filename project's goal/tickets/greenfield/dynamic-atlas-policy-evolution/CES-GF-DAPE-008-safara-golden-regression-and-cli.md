# CES-GF-DAPE-008 — Safara Golden Regression and Staged CLI

**Priority:** P0 — Atlas completeness milestone  
**Status:** Planned

## Goal

Prove realistic, domain-faithful, coverage-complete Atlas behavior and expose
the staged workflow through stable CLI commands.

## Work

- Add a redacted/licensed Safara fixture and reviewed golden source units,
  concepts, semantic records, coverage, project model, and graphs.
- Define minimum semantic coverage for permissions, capacity, identity,
  pricing, payments, documents, readiness, manifest snapshots, audit, reports,
  acceptance criteria, and deliverables.
- Add `atlas analyze`, `coverage`, `questions`, `approve`, and `graph` commands.
- Preserve current `run`, `resume`, and `inspect` compatibility.
- Separate fixture quality tests from opt-in real-provider quality exercises.

## Acceptance criteria

- [ ] Safara has no project-management concept substitutions.
- [ ] Every normative unit is covered or explicitly reviewed otherwise.
- [ ] Golden output includes the complete reviewed business-rule inventory.
- [ ] Normal CI is deterministic, provider-key-free, and network-free.
- [ ] P0 completion evidence includes reproducibility and migration tests.

## Depends on

- `CES-GF-DAPE-007`


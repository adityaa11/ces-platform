# CES-P2-003 — Phase 2: Prove End-to-End Integration and Basic CI

**Phase:** 2 — Thin Adapter-Neutral Integration Layer  
**Parent:** None  
**Status:** Implemented locally; hosted CI pending

**Evidence:** [`examples/phase-2-client`](../../../examples/phase-2-client/),
[`tests/phase-2-integration.test.ts`](../../../tests/phase-2-integration.test.ts), and
[`.github/workflows/test.yml`](../../../.github/workflows/test.yml)

## Depends on

- [CES-P2-001](CES-P2-001-integration-contracts.md)
- [CES-P2-002](CES-P2-002-adapter-neutral-bootstrap-runner.md)

## Goal

Prove that an approved Requirement Package can cross the client-side Phase 2
boundary and produce accurate, clean, deterministic Phase 1 results locally and
in basic repository CI.

## Work

- Add one client-workspace integration fixture using the current Laravel
  reference adapter without encoding Laravel behavior in the runner.
- Exercise the bootstrap boundary, exact checkout, toolchain validation, frozen
  install, build, compilation, report generation, and transactional publication.
- Cover success, blocked, conflict, adapter gap, Phase 1 input error, runner input
  error, and runner execution error.
- Cover invalid requirement, invalid project, invalid lock, invalid commit format,
  incorrect checked-out `HEAD`, adapter mismatch, unsupported baseline, runtime
  mismatch, checkout failure, network failure, installation failure, and build
  failure through controlled integration boundaries.
- Prove repeated execution and transitions from success to non-success cannot
  retain stale artifacts.
- Prove backup restoration when final publication fails.
- Compare independent completed Phase 1 outcomes for deterministic artifacts and
  execution reports.
- Run the integration example in the repository's existing basic CI without
  creating a reusable organization-wide workflow.

## Acceptance criteria

- [x] A clean network-connected run checks out the exact locked commit and
  produces the documented core, selected-adapter, and execution-report layout.
- [x] The report's identities, status, exit codes, diagnostics, and relative
  artifact paths match files from the current execution.
- [x] Success, blocked, conflict, adapter-gap, and Phase 1 input-error scenarios
  follow their exact artifact contracts.
- [x] Runner input and execution failures remain distinguishable and do not claim
  a Phase 1 exit code when Phase 1 was not invoked.
- [x] Re-running into the same logical destination never mixes old and new
  artifacts.
- [x] Publication recovery preserves a coherent previous or current result.
- [x] Two independent runs of each completed Phase 1 outcome produce
  byte-identical deterministic artifacts and execution reports.
- [ ] The example passes locally and in basic repository CI. (Local pass proven;
  hosted CI awaits commit and push.)
- [x] Tests prove the selected adapter directory and report identity are derived
  from configuration rather than a hardcoded Laravel contract.
- [x] Replacing the configured adapter with another approved registered adapter
  requires no runner redesign.

## Required evidence

- [x] Attach the complete example client workspace excluding `.ces-runtime/` and
  generated temporary state.
- [x] Attach commands, exit codes, reports, and artifact listings for every
  required outcome.
- [x] Attach byte-comparison or SHA-256 evidence for deterministic completed
  outcomes.
- [x] Attach stale-output transition and transactional recovery evidence.
- [ ] Attach basic repository CI output for the end-to-end example.
- [x] Attach an adapter-neutrality review tied to the runner and report schema.

## Out of scope

- Published containers or packages.
- Reusable organization-wide workflows, PR comments, or branch enforcement.
- Offline reproducibility.
- Additional production adapters or adapter composition.
- Phase 3 extraction, clarification, and approval workflows.
- Governance, overrides, upgrades, dashboards, or impact analysis.

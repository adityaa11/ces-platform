# CES-P2-001 — Phase 2: Define Integration Contracts

**Phase:** 2 — Thin Adapter-Neutral Integration Layer  
**Parent:** None  
**Status:** Implemented

**Evidence:** [`packages/integration-contracts`](../../../packages/integration-contracts/),
[`docs/contracts/phase-2/v1.0.0`](../../../docs/contracts/phase-2/v1.0.0/), and
[`docs/phase-2-integration-contract.md`](../../../docs/phase-2-integration-contract.md)

## Goal

Define the complete machine-facing contract for a client-side process to pin,
invoke, and inspect CES without changing Phase 1 runtime behavior.

## Work

- Define `.ces/ces.lock` with schema version, exact CES commit, and adapter ID
  and version.
- Require `ces.commit` to match `^[0-9a-f]{40}$` and define exact `HEAD`
  verification against the approved canonical CES repository.
- Define toolchain discovery from the pinned checkout and exact Node.js and pnpm
  compatibility validation.
- Define agreement checks between the lock, `.ces/project.yaml`, the selected
  adapter, and the supported CES baseline.
- Define the client workspace and ownership boundaries for `.ces-runtime/`,
  requirements, generated artifacts, and the version-controlled bootstrap
  runner.
- Define the versioned `execution-report.json` schema, including conditional
  identities and artifact fields.
- Separate `runner_exit_code` from optional `phase_1_exit_code` and define the
  status mapping for success, input error, execution error, blocked, conflict,
  and adapter gap.
- Define stable diagnostic codes, sources, severities, and optional contextual
  fields without parsing arbitrary Phase 1 stderr.
- Define outcome-specific artifact rules, including Phase 1 exit code `2`
  results that may already contain valid core artifacts.
- Define transactional publication, restoration, cleanup, and current-run-only
  artifact guarantees.
- Define deterministic report rules for completed Phase 1 outcomes and stable
  semantics for operational failure reports.
- Document the clean network-connected reproducibility guarantee and explicitly
  exclude offline reproducibility.

## Acceptance criteria

- [x] The lock schema accepts only a full lowercase 40-character CES commit and
  an exact adapter ID/version.
- [x] The canonical repository source and exact checked-out `HEAD` validation
  are unambiguous.
- [x] Toolchain requirements are read from the pinned checkout rather than
  silently substituted.
- [x] Project/lock adapter mismatches and unsupported baselines are defined as
  runner-owned input errors.
- [x] The report omits identities that could not be validated and never invents
  artifact paths.
- [x] `phase_1_exit_code` is omitted when Phase 1 was not invoked.
- [x] Phase 1 exit codes `0`, `2`, `3`, `4`, and `5` map to the approved statuses.
- [x] Runner-owned input and execution failures are semantically distinct from
  Phase 1 failures.
- [x] Blocked, conflict, adapter-gap, and Phase 1 input-error artifact rules
  match actual Phase 1 behavior.
- [x] Transactional publication guarantees that outputs from separate runs are
  never mixed.
- [x] Completed Phase 1 outcome reports contain no timestamps, durations,
  absolute paths, temporary names, or random identifiers.
- [x] All schemas and examples remain adapter-neutral and use implemented Phase
  1 vocabulary.

## Required evidence

- [x] Attach the versioned lock schema and valid/invalid schema fixtures.
- [x] Attach the versioned execution-report and diagnostic schemas with fixtures
  for every approved status.
- [x] Attach contract tests for conditional fields, exit-code mapping, adapter
  agreement, commit validation, baseline support, and outcome-specific artifacts.
- [x] Attach a review showing every contract matches the authoritative Phase 2
  context and the existing Phase 1 CLI behavior.

## Out of scope

- Bootstrap-runner implementation.
- Changes to Phase 1 diagnostics or artifact generation.
- Offline dependency distribution or package publication.
- Reusable organization workflows and pull-request enforcement.
- Phase 3 extraction or clarification logic.

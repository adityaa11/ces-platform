# CES-P2-002 — Phase 2: Implement Adapter-Neutral Bootstrap Runner

**Phase:** 2 — Thin Adapter-Neutral Integration Layer  
**Parent:** None  
**Status:** Implemented

**Evidence:** [`packages/bootstrap-runner`](../../../packages/bootstrap-runner/),
[`scripts/run-ces.mjs`](../../../scripts/run-ces.mjs), and
[`docs/phase-2-integration-contract.md`](../../../docs/phase-2-integration-contract.md)

## Depends on

- [CES-P2-001](CES-P2-001-integration-contracts.md)

## Goal

Implement the client-side runner that prepares the exact pinned CES checkout,
invokes Phase 1 without adapter-specific CLI arguments, and transactionally
publishes an accurate machine-readable result.

## Work

- Add the version-controlled client-side bootstrap runner outside the fetched
  CES checkout.
- Read and validate `.ces/ces.lock`, `.ces/project.yaml`, and the approved client
  workspace.
- Manage the ignored `.ces-runtime/` checkout/cache without modifying the client
  runner from fetched CES source.
- Fetch only from the configured canonical CES repository, checkout the exact
  locked commit, and verify `HEAD` before installation or build.
- Read exact Node.js and pnpm requirements from the pinned checkout and reject an
  incompatible runtime before dependency installation.
- Install with the frozen lockfile and build the pinned CES revision.
- Validate project/lock adapter agreement and baseline support.
- Invoke `ces compile` with requirement, project, and temporary output paths;
  never pass the legacy `--adapter` option.
- Preserve Phase 1 exit codes when invoked and use runner-owned codes for
  pre-invocation failures.
- Inspect actual structured artifacts rather than predicting them from status or
  parsing arbitrary stderr.
- Translate Policy Manifest and adapter-report information into stable,
  adapter-neutral diagnostics; use a generic diagnostic for Phase 1 exit code
  `2`.
- Generate `execution-report.json` with only validated identities and current-run
  artifact paths.
- Publish success and completed diagnostic outcomes transactionally, with backup
  restoration and temporary-output cleanup on publication failure.

## Acceptance criteria

- [x] The runner is non-interactive and works from the documented client
  workspace in a clean network-connected environment.
- [x] Invalid locks, commit formats, workspace configuration, adapter mismatches,
  and unsupported baselines fail before compilation with stable diagnostics.
- [x] The runner verifies the lowercase locked SHA against `HEAD` from the
  canonical CES repository.
- [x] Incompatible Node.js or pnpm versions fail before installation.
- [x] Normal compilation reads adapter selection from `.ces/project.yaml` and
  passes no adapter selector on the CLI.
- [x] `phase_1_exit_code` is present only after Phase 1 invocation and is
  preserved by the runner process.
- [x] Reports list only files that exist in the current temporary output.
- [x] Phase 1 exit code `2` may publish validated core artifacts actually
  produced, without assuming their presence.
- [x] Exit codes `3`, `4`, and `5` publish their completed diagnostic outcomes.
- [x] A failed or repeated execution cannot leave stale success artifacts in the
  final output.
- [x] Publication failure attempts restoration and does not expose a mixed
  output directory.
- [x] No runner logic, report schema, or universal path hardcodes Laravel.

## Required evidence

- [x] Attach runner unit tests using controlled process, filesystem, Git, and
  package-manager boundaries.
- [x] Attach commands and reports for invalid lock, invalid commit, incorrect
  `HEAD`, adapter mismatch, unsupported baseline, and runtime mismatch.
- [x] Attach success, blocked, conflict, adapter-gap, and Phase 1 input-error
  outputs with exact process exit codes and artifact listings.
- [x] Attach stale-output and publication-recovery tests proving final outputs
  represent exactly one execution.
- [x] Attach a scan or test proving the runner contains no Laravel-specific
  execution branch or universal Laravel path.

## Out of scope

- `ces verify` invocation and verification-failed reporting.
- Phase 1 CLI redesign or field-level structured schema diagnostics.
- GHCR, npm, container-registry, or offline distribution.
- New adapters, adapter composition, or generic fallback.
- Pull-request automation and Phase 3 extraction.

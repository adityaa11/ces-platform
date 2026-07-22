# CES-012 — Phase 1: Complete Examples, Documentation, and Local Docker Delivery

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Make the MVP understandable and executable locally from a clean checkout.

## Work

- Add the complete profile-picture requirement with explicit retry-safe post-commit cleanup.
- Add a blocked lifecycle variant for diagnostic testing.
- Add one combined Laravel project context.
- Document architecture boundaries, contracts, registries, adapters, gaps, exit codes, verification limits, and extension procedures.
- Clearly label target architecture, Phase 1 MVP flow, and Phase 3 PRD-extraction flow.
- Document that overrides/exceptions and the composable production adapter ecosystem are deferred.
- Document how to add a capability, trait, policy, and adapter without changing the core.
- Add a multi-stage Dockerfile pinned to the selected Node and pnpm versions.
- Add a repository-only `.github/workflows/test.yml` for install, type checking, tests, architecture and determinism checks, and Docker build validation.
- Document local Node and Docker commands for both compilation stages and verification.

## Acceptance criteria

- [x] A clean local setup can install, build, typecheck, test, and run the compiled CLI.
- [x] The successful example generates all expected core and Laravel artifacts.
- [x] The fixture adapter consumes the same manifest successfully.
- [x] The blocked example writes its diagnostic manifest and stops before adapter compilation.
- [x] `docker build -t ces-cli:local .` succeeds and the documented mounted-workspace command works.
- [x] The repository `test.yml` validates CES itself and is not reusable by client repositories.
- [x] Documentation consistently describes CES as requirement → stack-agnostic Policy Manifest → adapter integration.
- [x] Documentation distinguishes the fixture adapter from Phase 4 production generic guidance.

## Required evidence

- [x] Attach a clean-checkout transcript for install, build, typecheck, tests, and compiled CLI execution.
- [x] Attach generated outputs for the successful core, Laravel, and fixture workflows.
- [x] Attach the blocked-example diagnostic manifest and exit code.
- [x] Attach `docker build` output and a successful mounted-workspace container run.
- [x] Attach a successful repository CI run covering type checking, tests, boundaries, deterministic output, and Docker build validation.
- [x] Link documentation sections for adding capabilities, traits, policies, and adapters.
- [x] Attach a documentation scan showing the prohibited Laravel-centric pipeline description is absent except where explicitly negated.
- [x] Attach a scope review proving Phase 1 does not implement PRD extraction, overrides, adapter composition, support levels, generic production fallback, or adapter approval.

Evidence: [CES-012 verification record](../../evidence/phase-1/CES-012.md)

## Exclusions

- No GHCR publication or reusable GitHub workflow in Phase 1.


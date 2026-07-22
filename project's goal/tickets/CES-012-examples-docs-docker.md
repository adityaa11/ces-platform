# CES-012 — Complete Examples, Documentation, and Local Docker Delivery

## Goal

Make the MVP understandable and executable locally from a clean checkout.

## Work

- Add the complete profile-picture requirement with explicit retry-safe post-commit cleanup.
- Add a blocked lifecycle variant for diagnostic testing.
- Add one combined Laravel project context.
- Document architecture boundaries, contracts, registries, adapters, gaps, exit codes, verification limits, and extension procedures.
- Document how to add a capability, trait, policy, and adapter without changing the core.
- Add a multi-stage Dockerfile pinned to the selected Node and pnpm versions.
- Document local Node and Docker commands for both compilation stages and verification.

## Acceptance criteria

- [ ] A clean local setup can install, build, typecheck, test, and run the compiled CLI.
- [ ] The successful example generates all expected core and Laravel artifacts.
- [ ] The fixture adapter consumes the same manifest successfully.
- [ ] The blocked example writes its diagnostic manifest and stops before adapter compilation.
- [ ] `docker build -t ces-cli:local .` succeeds and the documented mounted-workspace command works.
- [ ] Documentation consistently describes CES as requirement → stack-agnostic Policy Manifest → adapter integration.

## Required evidence

- [ ] Attach a clean-checkout transcript for install, build, typecheck, tests, and compiled CLI execution.
- [ ] Attach generated outputs for the successful core, Laravel, and fixture workflows.
- [ ] Attach the blocked-example diagnostic manifest and exit code.
- [ ] Attach `docker build` output and a successful mounted-workspace container run.
- [ ] Link documentation sections for adding capabilities, traits, policies, and adapters.
- [ ] Attach a documentation scan showing the prohibited Laravel-centric pipeline description is absent except where explicitly negated.

## Exclusions

- No GHCR publication or reusable GitHub workflow in Phase 1.


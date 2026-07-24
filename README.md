# Company Engineering Standard (CES) Platform

CES is a stack-agnostic engineering policy compiler and verification tool for
human- and AI-assisted software development.

```text
Structured Requirement
→ capabilities and traits
→ stack-agnostic Policy Manifest
→ selected adapter
→ implementation and verification package
```

CES is a development and CI tool, not a runtime dependency of client
applications. It is not coupled to a framework or coding agent.

## Implementation status

[![CES repository tests](https://github.com/adityaa11/ces-platform/actions/workflows/test.yml/badge.svg)](https://github.com/adityaa11/ces-platform/actions/workflows/test.yml)

This table is the authoritative implementation summary. Detailed design
documents and tickets provide supporting context but do not override it.

| Capability | Status | Evidence |
|---|---|---|
| Phase 1 deterministic compiler | Implemented locally | [`apps/cli`](apps/cli/), [`tests/delivery.test.ts`](tests/delivery.test.ts) |
| Policy Manifest and Adapter SDK | Implemented locally | [`packages/policy-manifest`](packages/policy-manifest/), [`packages/adapter-sdk`](packages/adapter-sdk/) |
| Phase 2 integration contracts | Implemented locally | [`packages/integration-contracts`](packages/integration-contracts/), [`docs/contracts/phase-2`](docs/contracts/phase-2/) |
| Phase 2 bootstrap runner | Implemented and hardened; hosted CI passing | [`packages/bootstrap-runner`](packages/bootstrap-runner/), [`tests/phase-2-integration.test.ts`](tests/phase-2-integration.test.ts) |
| Hosted validation | Passing on baseline commit `b4928cc` | [workflow run](https://github.com/adityaa11/ces-platform/actions/runs/30102005721/job/89510123198) |
| Greenfield shared contracts | FND-002 validated in hosted CI on `b4bac82` | [workflow job](https://github.com/adityaa11/ces-platform/actions/runs/30103309530/job/89514514085) |
| Atlas candidate extraction | ATLAS-001 implemented locally; hosted validation pending | [`packages/atlas-extraction`](packages/atlas-extraction/), [`packages/agent-provider-sdk`](packages/agent-provider-sdk/) |
| Greenfield product suite | In progress; Atlas review waits for ATLAS-001 hosted validation | [greenfield ticket plan](<project's goal/tickets/greenfield/README.md>) |
| Release | Unreleased | Exact development toolchain: Node.js 24.12.0 and pnpm 11.15.1 |

Phase 1 provides deterministic requirement-to-policy compilation, a portable
Policy Manifest, a versioned Adapter SDK, Laravel and test-fixture adapters,
implementation artifacts, verification, Docker execution, and repository CI.

Phase 2 provides an exact-commit-pinned, adapter-neutral, non-interactive client
boundary with deterministic reports and transactionally published output.

## Planning and contracts

- [Architecture and MVP specification](<project's goal/CES_PLATFORM_CONTEXT_AND_MVP.md>)
- [Ticket roadmap](<project's goal/tickets/README.md>)
- [Phase 1 parent ticket](<project's goal/tickets/phase-1/CES-000-parent-mvp.md>)
- [Phase 2 contract](<project's goal/CES_PHASE_2_THIN_ADAPTER_NEUTRAL_CONTEXT.md>)
- [Phase 2 tickets](<project's goal/tickets/phase-2/README.md>)
- [Workspace architecture](docs/architecture.md)

## Quick start

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm check
node apps/cli/dist/index.js compile \
  --requirement examples/profile-picture.requirement.yaml \
  --project examples/laravel-project.yaml \
  --output .ces/generated/REQ-USER-014
```

Run the Phase 2 reference client after building:

```sh
node examples/phase-2-client/scripts/run-ces.mjs
```

## Client footprint

```text
.ces/project.yaml       committed project and adapter selection
.ces/ces.lock           committed exact CES commit and adapter lock
.ces/requirements/      committed approved Requirement Packages
.ces/generated/         generated current-execution output; normally ignored
.ces-runtime/           temporary runner state and locks; always ignored
scripts/run-ces.mjs     committed client-owned bootstrap entrypoint
```

`.ces/generated/` and `.ces-runtime/` are safe to delete when no CES process is
active. Structured overrides and exception governance remain Phase 5 work.

## Deferred capabilities

- Published or offline distribution.
- Reusable organization workflows and pull-request enforcement.
- Phase 3 PRD and business-document extraction.
- Phase 4 production adapter composition and generic guidance.
- Phase 5 governance, overrides, exceptions, upgrades, and impact analysis.

## Contribution boundaries

- Core packages remain stack- and agent-neutral.
- Assurance context may influence policy resolution; technical context may not.
- Adapters translate resolved policies without changing policy meaning.
- Unsupported mandatory policies remain explicit adapter gaps.
- Phase 1 and Phase 2 changes must not introduce extraction, governance, or
  dynamic adapter downloading.

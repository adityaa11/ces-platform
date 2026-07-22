# Company Engineering Standard (CES) Platform

CES is a stack-agnostic engineering policy compiler and verification tool for human- and AI-assisted software development.

```text
Structured Requirement
→ capabilities and traits
→ stack-agnostic Policy Manifest
→ selected adapter
→ implementation and verification package
```

CES is a development and CI tool. It is not a runtime dependency of client applications and is not coupled to Laravel, Codex, Claude Code, or another framework or coding agent.

## Current phase

**Phase 1 — Deterministic Core and Reference Adapter**

Status: Phase 1 implementation is substantially complete and locally verified; final contract and traceability hardening is in progress under CES-013 through CES-017.

Phase 1 proves:

- deterministic requirement-to-policy compilation;
- an adapter-independent Policy Manifest;
- a versioned Adapter SDK;
- framework independence through a test-fixture adapter;
- one production-shaped Laravel reference adapter;
- deterministic implementation and verification artifacts;
- local verification and Docker execution;
- repository CI that validates the CES monorepo itself.

Remaining Phase 1 hardening covers concrete parameter propagation, controlled vocabularies and trust boundaries, project-pinned adapter loading, complete registry hashing, and the finalized independent-core output layout. Phase 2 work has not started.

## Planning documents

- [Architecture and MVP specification](<project's goal/CES_PLATFORM_CONTEXT_AND_MVP.md>)
- [Ticket roadmap](<project's goal/tickets/README.md>)
- [Phase 1 parent ticket](<project's goal/tickets/phase-1/CES-000-parent-mvp.md>)

The parent ticket lists the ordered Phase 1 children, dependencies, acceptance criteria, and required evidence.

See the [Phase 1 guide](docs/phase-1.md) for local installation, compilation, verification, Docker usage, exit codes, architecture boundaries, and extension procedures.

## Quick start

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm check
node apps/cli/dist/index.js compile \
  --requirement examples/profile-picture.requirement.yaml \
  --project examples/laravel-project.yaml \
  --adapter laravel \
  --output .ces/generated/REQ-USER-014/laravel
```

The blocked example uses `examples/profile-picture.blocked.yaml`; it writes a diagnostic Policy Manifest and exits before adapter compilation.

## Phase 1 workflow

```text
Structured Requirement YAML or JSON
+ ProjectAssuranceContext
→ deterministic core
→ Policy Manifest
+ ProjectTechnicalContext
+ Laravel or test-fixture adapter
→ implementation package
→ local verification
```

Natural-language PRD and PDF extraction are not part of Phase 1.

## Client footprint by phase

Phase 1 client projects need only:

```text
.ces/project.yaml
.ces/requirements/
.ces/generated/
```

The reusable `.github/workflows/ces.yml` integration is a Phase 2 target. Client `ces.lock` and upgrade behavior belong to later packaging/versioning work. Structured `.ces/overrides/` and exception governance are Phase 5 targets, not Phase 1 contracts.

## Deferred capabilities

- Phase 2: verification integration, container publication, and pull-request enforcement.
- Phase 3: evidence-backed extraction from PRDs and business documents.
- Phase 4: composable production adapter ecosystem, generic guidance, support levels, compatibility, scaffolding, and approval.
- Phase 5: governance, overrides, approved exceptions, upgrades, and impact analysis.

## Contribution boundaries

- Core packages must remain stack- and agent-neutral.
- Assurance context may influence policy resolution; technical context may not.
- Adapters translate resolved policies but cannot add, remove, weaken, or reinterpret them.
- The Laravel adapter and test-fixture adapter must consume the same unchanged Policy Manifest.
- The fixture adapter is test-only and is not production generic guidance.
- Unsupported mandatory policies must remain explicit adapter gaps.
- Phase 1 contributions must not introduce PRD extraction, policy overrides, adapter composition, dynamic adapter downloading, marketplace behavior, or approval workflows.

The existing `project's goal/` directory is retained for now to avoid unnecessary link and history churn. A move to a shell-friendly `docs/` path may be handled as a separate documentation migration.

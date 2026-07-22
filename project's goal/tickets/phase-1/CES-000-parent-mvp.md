# CES-000 — Phase 1: Deterministic, Stack-Agnostic CES MVP

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** None
**Status:** Done

## Objective

Build the first CES release as a deterministic development-time compiler with two independent stages:

```text
Structured requirement + assurance context
→ stack-agnostic Policy Manifest
→ selected adapter + technical context
→ implementation and verification package
```

The CES core must support any present or future stack. Laravel is only the first production-shaped reference adapter.

## MVP deliverables

- TypeScript/Node.js pnpm monorepo with strict package boundaries.
- Versioned schemas and deterministic registries.
- Stack-agnostic requirement-to-policy compilation.
- Versioned Adapter SDK and adapter registry.
- Framework-neutral test-fixture adapter.
- Laravel reference adapter.
- Deterministic implementation, agent-neutral task, test, and verification outputs.
- Initial verification engine and CLI.
- Local Docker image, examples, documentation, and automated tests.

## Child tickets

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-001](CES-001-workspace-foundation.md) | Strict pnpm workspace and build foundation | — |
| 2 | [CES-002](CES-002-core-contracts.md) | Versioned stack-agnostic input/output contracts | CES-001 |
| 3 | [CES-003](CES-003-capability-trait-resolution.md) | Deterministic capability and trait resolution | CES-002 |
| 4 | [CES-004](CES-004-policy-engine.md) | Deterministic Policy Manifest compilation | CES-002, CES-003 |
| 5 | [CES-005](CES-005-core-cli.md) | Independently executable core CLI | CES-004 |
| 6 | [CES-006](CES-006-adapter-sdk.md) | Versioned, stack-neutral adapter contract | CES-002, CES-004 |
| 7 | [CES-007](CES-007-test-fixture-adapter.md) | Test-fixture adapter proving core portability | CES-006 |
| 8 | [CES-008](CES-008-laravel-reference-adapter.md) | Laravel mapping without core leakage | CES-006 |
| 9 | [CES-009](CES-009-implementation-compiler.md) | Deterministic adapter-derived artifacts | CES-007, CES-008 |
| 10 | [CES-010](CES-010-verification-engine.md) | Manifest, source, test, and review checks | CES-009 |
| 11 | [CES-011](CES-011-quality-boundaries-determinism.md) | Boundary, determinism, and failure-contract proof | CES-001–CES-010 |
| 12 | [CES-012](CES-012-examples-docs-docker.md) | Executable examples, documentation, and Docker | CES-005, CES-009–CES-011 |

## Milestones

1. **Core complete:** CES-001 through CES-005.
2. **Adapter boundary proven:** CES-006 and CES-007.
3. **Reference integration complete:** CES-008 and CES-009.
4. **MVP releasable locally:** CES-010 through CES-012.

## Parent acceptance criteria

- [x] The profile-picture example resolves without loading an adapter.
- [x] Its core Policy Manifest is byte-for-byte identical regardless of the adapter later selected.
- [x] Laravel and the test-fixture adapter consume that same manifest and produce different valid implementation packages.
- [x] Removing Laravel does not break core build or tests.
- [x] Blocked requirements, policy conflicts, and adapter gaps write diagnostic output and return their specified nonzero exit codes.
- [x] `pnpm build`, `pnpm typecheck`, and `pnpm test` pass.
- [x] Two clean compilations produce byte-for-byte identical deterministic artifacts.
- [x] The compiled CLI and local Docker image execute the documented workflow.
- [x] The same neutral Implementation Package can be handed to a human developer, Codex, or Claude Code without changing core or adapter output.

## Required evidence

An acceptance checkbox may be marked complete only when its corresponding reproducible evidence is attached or linked. A code diff by itself is not proof of completion. Evidence produced by commands must include the command, exit code, relevant output, and artifact path; generated deterministic artifacts must include a SHA-256 hash where requested.

- [x] A clean-run report records `pnpm install`, `pnpm build`, `pnpm typecheck`, and `pnpm test` succeeding.
- [x] Generated core, Laravel, and fixture artifacts are attached or linked with their SHA-256 hashes.
- [x] A byte-comparison report proves two independent compilations produced identical deterministic artifacts.
- [x] Architecture-test output proves the core builds without Laravel and contains no forbidden adapter dependency.
- [x] Failure demonstrations include the blocked Policy Manifest, policy-conflict diagnostic, `adapter-report.json`, verification report, and expected exit codes.
- [x] The local Docker smoke-test command and successful output are recorded.
- [x] A consumer-compatibility review proves canonical artifacts contain no required Codex-, Claude Code-, IDE-, or vendor-specific instructions.

Consolidated evidence is recorded in [CES-009](../../evidence/phase-1/CES-009.md), [CES-010](../../evidence/phase-1/CES-010.md), [CES-011](../../evidence/phase-1/CES-011.md), and [CES-012](../../evidence/phase-1/CES-012.md).

## Out of scope

- Natural-language or PDF extraction.
- LLM-driven policy resolution.
- Additional production adapters.
- Sophisticated semantic analysis.
- Registry dashboards and approval workflows.
- Published images and reusable GitHub workflows; these begin in Phase 2.
- Natural-language requirement extraction; this begins in Phase 3.
- Adapter composition, component resolution, production generic fallback, support levels, and approval workflows; these begin in Phase 4.
- Project policy overrides, approved exceptions, precedence, expiration, and review workflows; these begin in Phase 5.


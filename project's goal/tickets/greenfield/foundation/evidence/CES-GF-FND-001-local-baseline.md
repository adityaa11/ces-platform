# CES-GF-FND-001 Local Baseline Evidence

**Validated commit:** `257a557`  
**Validated:** 24 July 2026  
**Platform:** Windows  
**Node.js:** `24.12.0`  
**pnpm:** `11.15.1`

## Result

The complete supported local workflow passed:

```text
corepack pnpm check

Typecheck: passed
Tests:     159 passed, 0 failed, 0 skipped
Build:     passed
```

The workflow includes architecture, delivery, determinism, adapter portability,
Phase 2 integration, and bootstrap-runner regression coverage.

## Process-tree regression diagnosis

The two bootstrap-runner tests initially timed out when executed inside a
restricted sandbox:

- bounded output and hanging-command timeout;
- timed-out process-tree termination and user cancellation.

An extended 20-second sandboxed run also failed to settle. The focused tests
then passed without code changes when executed with Windows process-tree control
permitted:

```text
2 passed
19 skipped by the focused filter
duration: 1.56 seconds
```

The complete unrestricted local check subsequently passed the same tests:

```text
times out hanging commands and bounds captured output while streaming a log
terminates a timed-out process tree and supports user cancellation
```

This demonstrates an execution-environment restriction on `taskkill`, not a
bootstrap-runner source defect. Increasing test timeouts or weakening the
process-tree assertions would hide the required behavior and is not approved.

## Recorded baseline contracts

| Contract | Version |
|---|---|
| Requirement schema | `1.0.0` |
| Requirement vocabulary | `1.0.0` |
| Project schema | `1.0.0` |
| Project assurance vocabulary | `1.0.0` |
| Policy Manifest schema | `1.0.0` |
| Adapter SDK schema | `1.0.0` |
| Phase 2 integration contract | `1.0.0` |

These contracts remain backward-compatible inputs to the planned greenfield
collection and orchestration boundary. FND-002 must add new versioned contracts
without invalidating the existing profile-picture fixture.

## Hosted validation

The repository workflow passed for baseline commit `b4928cc`:

- Run: [`30102005721`](https://github.com/adityaa11/ces-platform/actions/runs/30102005721)
- Job: [`repository-check` (`89510123198`)](https://github.com/adityaa11/ces-platform/actions/runs/30102005721/job/89510123198)
- Result: succeeded
- Observed duration: 39 seconds

The successful job includes dependency installation, `corepack pnpm check`,
the Phase 2 client integration boundary, Docker image construction, container
CLI execution, and mounted project-pinned compilation.

## Gate decision

Local and hosted validation evidence is complete. FND-001 is accepted and the
Phase 0 implementation gate is closed. FND-002 may begin.

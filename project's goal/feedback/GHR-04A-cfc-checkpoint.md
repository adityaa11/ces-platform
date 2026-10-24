# GHR-04A CFC checkpoint — awaiting CK verification

- **Ticket:** `GHR-04A` — Registered HTTP transport contract and dispatcher
- **CK source:** [GHR-04A CK review](GHR-04A-c4ad7a57-review.md)
- **Reviewed implementation:** `c4ad7a57b30b96e078bf7457ad631b9bb2d54c89`
- **Remediation commit:** the bounded commit containing this checkpoint — `fix(ghr): close GHR-04A CK findings` (verify with `git show HEAD`)
- **Checkpoint state:** `awaiting_review`
- **CFC result:** `READY_FOR_CK`; CFC does not issue `PASS`

This is one bounded remediation pass for the four unresolved frozen clauses. The resolved `GHR-04A-RC-01` and `GHR-04A-RC-04` rows remain protected and were not reopened.

## Closure matrix

| Clause | Status | Evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/src/ghr/http-transport-config.ts:33`; `apps/agents-bridge/src/ghr/http-dispatcher.ts:73`; `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts:59` validates public origin, short credential, and invalid bounds before composition. | `corepack pnpm --filter @atlas/agents-bridge test:ghr-04a` — PASS (4/4); `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS. | PASS: invalid runtime configuration is rejected before fetcher composition; valid deployment configuration remains composable. |
| `CK-001.b` | `PROVEN` | `apps/agents-bridge/src/ghr/core/branch-registry.ts:66`; `apps/agents-bridge/src/ghr/http-dispatcher.ts:24-29`; `apps/agents-bridge/tests/ghr-branch-registry.test.ts:46` rejects `//evil`. | `corepack pnpm --filter @atlas/agents-bridge test:ghr-01b` — PASS (3/3); `corepack pnpm --filter @atlas/agents-bridge test:ghr-04a` — PASS (4/4). | PASS: network-path references are rejected and the valid registration remains constrained to the configured origin. |
| `CK-002.a` | `PROVEN` | `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts:21-22` records listener method/URL; lines `76-77` assert `POST` and `/internal/semantic/batch-plan`. | `corepack pnpm --filter @atlas/agents-bridge test:ghr-04a` — PASS (4/4). | PASS: the positive local-listener observation proves the registered POST path while retaining byte and credential assertions. |
| `CK-002.b` | `PROVEN` | `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts:86-87` uses a 25 ms dispatcher timeout against the listener’s 100 ms delay and asserts `{ status: "unavailable" }`. | `corepack pnpm --filter @atlas/agents-bridge test:ghr-04a` — PASS (4/4). | PASS: the actual timeout negative is bounded and never acknowledged. |

## Direct regressions checked

```text
corepack pnpm --filter @atlas/agents-bridge test:ghr-03a  PASS (4/4)
corepack pnpm --filter @atlas/agents-bridge test:ghr-03b  PASS (1 static boundary; 4 environment-gated skips without explicit environment)
git diff --check -- [the six bounded CFC paths]  PASS
```

The remediation changes only dispatcher configuration validation, registered-path authority, and focused transport evidence. No worker dispatch, receiver, receipt, parser, downstream, or deployment behavior was changed.

**Internal readiness: READY_FOR_CK**

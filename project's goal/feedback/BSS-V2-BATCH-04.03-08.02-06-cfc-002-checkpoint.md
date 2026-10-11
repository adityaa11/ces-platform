# BSS-V2-004-03-08-02-06 CFC checkpoint — CK-001.a (second targeted cycle)

- **Ticket:** `BSS-V2-004-03-08-02-06` — Multimodal request bounds, replay/redaction and resource interface
- **Batch:** `BSS-V2-BATCH-04.03-08.02-06`
- **State:** `awaiting_review`
- **HMN authorization consumed:** `HMN-BSS-V2-004-03-08-02-06-001`
- **Original CK artifact / frozen oracle:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.02-06-42e0466-review.md`
- **Post-first-CFC CK verification:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.02-06-53ca7f1-verification.md`
- **Remediation base:** `ec9034b2e1d45dc27db7f525fa93bd8c61fb6d4b`
- **Remediation commit:** `e508f99fe87dbf124a7566d0797d4eef1acf9ad5` (`test(bridge): exercise replay-safe fake effects`)

## Bounded remediation

Only frozen clause `CK-001.a` was remediated. `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts:138-251` replaces disconnected arrays with callable, test-only effect callbacks for semantic execution, perception job creation, permit acquisition, resource reservation, and external-provider attempt. It adds a separately named fake replay/admission boundary and routes the tested preflight inputs through an instrumented fake orchestration path.

The test first proves that aborted and cancelled inputs do not reach either fake admission or any effect callback. Its positive control then exercises every fake effect callback once. Duplicate and restart paths share the fake replay/admission boundary and retain one effect snapshot, including one external-provider attempt, while keeping deterministic request identity. Captured fake metadata continues to exclude source text, image bytes/base64, credentials, and secrets.

This is test-harness qualification only. It does not claim that pure preflight, production provider transport, a scheduler, or a downstream admission owner implements durable replay prevention, semantic-execution admission, or job scheduling.

## Frozen-clause remediation progress

| CK clause | Prior status | Status | Evidence location, required command, and frozen-oracle result |
| --- | --- | --- | --- |
| `CK-001.a` | `UNRESOLVED` | `PROVEN` | `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts:138-251`, test `aborted, duplicate, restart and cancellation preflight cases stay replay-safe at observable fake boundaries`. The test has executed fake-callback positive controls, zero-effect abort/cancel controls, shared fake replay/admission duplicate/restart suppression, deterministic identity assertions, and metadata-redaction assertions. `docker compose run --build --rm --no-deps agents-bridge sh -c "node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/multipart-provider-capabilities.test.ts && node node_modules/typescript/bin/tsc -p apps/agents-bridge/tsconfig.json --noEmit"` — **PASS** (7 focused tests; typecheck exit 0). **Frozen oracle: passed.** |

The previously established `RC-01` and `RC-02` outcomes are preserved and were not redesigned.

## Exact validation on remediation commit `e508f99fe87dbf124a7566d0797d4eef1acf9ad5`

| Exact command | Outcome |
| --- | --- |
| `docker compose run --build --rm --no-deps agents-bridge sh -c "node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/multipart-provider-capabilities.test.ts && node node_modules/typescript/bin/tsc -p apps/agents-bridge/tsconfig.json --noEmit"` | PASS — 7 focused tests and Bridge TypeScript typecheck. |
| `docker compose run --rm --no-deps agents-bridge sh -c 'node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/provider-capabilities-boundary.test.ts && node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-worker.test.ts && node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/anoman-provider.test.ts && node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/mistral-provider.test.ts && node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/gemini-provider.test.ts'` | PASS — 2 provider-boundary, 5 semantic-worker, 6 Anoman, 11 Mistral, and 8 Gemini tests. |
| `git diff --check ec9034b2e1d45dc27db7f525fa93bd8c61fb6d4b e508f99fe87dbf124a7566d0797d4eef1acf9ad5` | PASS — no whitespace errors. |

All test execution used deterministic local fakes; no external provider request was made.

## Changed-file inventory and preservation

The remediation commit changes only:

- `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts`

It leaves the preflight implementation, `IDSER-012-02-01`, provider transport, schedulers, canonical schemas, and unrelated tickets unchanged. The existing unrelated generated-fixture and untracked worktree changes remain unstaged and untouched.

## Internal readiness and handoff

`CK-001.a` is `PROVEN` against the original frozen oracle; required focused validation and direct regressions pass. **Internal readiness: READY_FOR_CK**.

**Handoff:** Stop for independent CK verification of `CK-001.a` at remediation commit `e508f99fe87dbf124a7566d0797d4eef1acf9ad5`. This CFC checkpoint does not issue CK `PASS`, and it does not authorize another CFC cycle.

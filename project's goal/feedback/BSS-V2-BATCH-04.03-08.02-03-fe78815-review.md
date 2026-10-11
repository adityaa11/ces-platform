# CK review — BSS-V2-004-03-08-02-03

- **Ticket:** `BSS-V2-004-03-08-02-03` — Verified ephemeral image hydration
- **Batch:** `BSS-V2-BATCH-04.03-08.02-03`
- **Review type:** first independent CK review
- **Reviewed implementation commit:** `fe788151d3c93dc8a4218a6312c8213b1a31a3c7` (`feat(atlas): hydrate verified derived images`)
- **Checkpoint commit:** `bdae61c0d615ff85e3736c114008cfab29d5a66f` (`docs(bss): checkpoint verified image hydration`)
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-02-03-verified-ephemeral-image-hydration.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-004-03-08-02-03-go-checkpoint.md`
- **Ticket state before review:** `awaiting_review`
- **Reviewed base:** `1124db05bcf20c44e4e3ff6f6bdb18e48e71a850` (`docs(bss): approve scoped derived image grants`)
- **Prerequisite:** BSS-V2-004-03-08-02-02 verification artifact records CK `PASS` at `b6f7063`.

## Review boundary and preconditions

The ticket and GO checkpoint identify the same implementation target and the ticket is `awaiting_review`. The implementation commit follows the recorded base. Its diff contains the four declared Atlas Core paths plus the ticket and GO checkpoint. `HEAD` is the later checkpoint-documentation commit; its only change to the reviewed ticket scope is recording the exact implementation target. The tracked and untracked working-tree changes are unrelated generated fixtures and planning/evidence files; none intersects the reviewed implementation or ticket paths. Those changes were left untouched.

The consumed predecessor is the scoped derived-image grant and authorization contract from `08-02-02`; this review relies on its approved grant interface and replay/authority checks without reopening that checkpoint. The `08-01-01` parent-HEAD manifest is the legacy comparison authority. The legacy prompt regression test reproduces its frozen prompt SHA, while the changed source-packet and test file hashes reflect intervening additive, approved multimodal work; the reviewed Skills suite directly verifies legacy prompt/profile isolation and existing text-only packet behavior.

## Independent evidence and validation

The hydrator redeems the opaque grant before reading, passes only the redeemed scope to the Atlas-owned reader interface, and validates the manifest scope and canonical digest, payload length and hash, PNG signature/IHDR dimensions, and the 10 MiB limit. It checks cancellation before redemption, between redemption and read, and after the read; errors crossing the seam are redacted. It has no persistence, logging, provider, job, queue, or browser-session capability. The deterministic fake-reader tests cover success, missing/corrupt/mismatched/oversized/wrong-media/expired cases, replay, restart, cancellation, one-read behavior, and zero side-effect counters.

The implementation diff does not modify the existing browser resolver or derived-asset persistence/authority paths. The bounded hydrator contract remains separate from provider serialization and does not introduce provider calls or new job/admission paths.

| Exact command independently run | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/core typecheck` | PASS |
| `corepack pnpm --filter @atlas/core test` | PASS — 27 deterministic tests, including all 3 hydration tests and grant/internal-route regressions |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/contracts test` | PASS — 14 tests, including all 10 Semantic V1 tests |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 18 tests, including the frozen `prompt-003/v1` prompt SHA (`a79ac1174807a635f6a8820ea6cc8073457fba7534a61b55014cde76fa287458`), profile isolation, source-packet parity, and multimodal regressions |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS — 2 tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 5 tests |
| `git diff --check fe78815^ fe78815` | PASS |

The reviewed diff contains no persistence or log path for image content and no provider invocation. The harness records zero external-provider attempts, semantic/perception jobs, admission reservations, and persistence writes. Tests use deterministic in-process PNG bytes; no external provider call or read of real Atlas-held image bytes was performed.

## Review Contract outcomes

| Row | Frozen ticket authority and required proof | Independent evidence | Status |
| --- | --- | --- | --- |
| `RC-01` | Ticket RC-01: for a verified grant, read only the requested retained asset and validate presence, manifest/hash/type/dimensions/length and source/locator identity; fail closed on corruption, missing history, oversize, wrong media, or expiry. | The reviewed hydrator redeems first and supplies only the verified scope to the reader; code validates all named identity/integrity fields and bounds. The focused Core tests pass for success and every named negative, including missing asset and expiry. | `PROVEN` |
| `RC-02` | Ticket RC-02: keep bytes ephemeral; exclude them from jobs, replay, DB, logs, and acceptance evidence; keep the service response bounded, cancellable, and redacted; preserve Bridge's lack of filesystem/database permission. | The returned image exists only as the transient method result; the hydrator has no persistence/log/provider/job capability. The 10 MiB bound, `AbortSignal`, generic redacted errors, and zero-effect counters are covered by code inspection and tests. The Bridge boundary is unchanged; its typecheck and boundary test pass. The checkpoint contains no image bytes/base64. | `PROVEN` |
| `RC-03` | Ticket RC-03: duplicate/read-after-restart/abort preserve accepted evidence and never mint PDF/document/member/source grant/perception job/permit; keep the browser evidence resolver compatible. | Replay is rejected before a second read; a fresh issuer cannot recreate the in-memory grant after restart; pre-abort does not read or consume the grant. The fake harness reports no jobs/reservations/persistence effects. The resolver and derived persistence paths are untouched by the reviewed diff; Core and Bridge regression lanes pass. | `PROVEN` |

## Findings and scope observations

No ticket-derived deficiency or scope-change decision was identified. No `CK-###` finding or Frozen Finding Closure Matrix is required.

## Decision

`PASS`

The committed implementation satisfies the frozen ticket and its explicit review obligations. This PASS applies only to `BSS-V2-004-03-08-02-03` at `fe788151d3c93dc8a4218a6312c8213b1a31a3c7`; it does not approve provider transport or successor leaves.

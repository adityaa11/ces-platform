# BSS-V2-004-03-08-02-03 GO checkpoint — verified ephemeral image hydration

- **Ticket:** `BSS-V2-004-03-08-02-03`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-02-03-verified-ephemeral-image-hydration.md`
- **State:** `awaiting_review`
- **Reviewed base:** `1124db0` (`docs(bss): approve scoped derived image grants`)
- **Prerequisite consumed:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.02-02-b6f7063-verification.md` — CK `PASS` for the approved scoped derived-image grant.
- **Runtime:** Node `v24.19.0`; pnpm `11.19.0`; deterministic in-process fake authority and retained-asset reader only.

## Bounded implementation and changed-file impact

| Path | Contract impact | Classification |
| --- | --- | --- |
| `packages/atlas-core/src/ephemeral-derived-image-hydrator.ts` | Adds the single private reader seam: it redeems the approved opaque grant, passes only its exact scope to an Atlas-owned reader, validates canonical manifest identity, payload SHA-256, PNG type/dimensions, byte length and the 10 MiB limit, and returns only transient bytes. It retains no bytes or mutable image state. | `INTENDED_EPHEMERAL_HYDRATION_SEAM_ONLY` |
| `packages/atlas-core/src/index.ts` | Additive export of the private reader contract. | `INTENDED_EPHEMERAL_HYDRATION_SEAM_ONLY` |
| `packages/atlas-core/tests/ephemeral-derived-image-hydrator.test.ts` | Deterministic fake in-process proof of success, missing/corrupt/mismatched/oversized/wrong-media/expired negatives, duplicate/restart denial, cancellation and zero side effects. | `INTENDED_EPHEMERAL_HYDRATION_SEAM_ONLY` |
| `packages/atlas-core/package.json` | Registers the deterministic reader suite in the established core test command. | `INTENDED_EPHEMERAL_HYDRATION_SEAM_ONLY` |
| This ticket and this checkpoint | Record only the GO state and bounded review evidence; no raw image bytes or base64 are recorded. | `WORKFLOW_EVIDENCE_ONLY` |

The reader accepts no filesystem path, storage key, browser cookie, database handle, provider client, queue, job, permit, or serialization callback. The retained-asset implementation remains the sole Atlas-held-byte authority behind `DerivedImageAssetReader`; no second storage/lifecycle authority was introduced. The diff does not change Bridge, the browser resolver, database persistence, DocumentStore policy, provider transport, prompts, schemas, jobs, reservations, fixtures/gold, or historical CK artifacts.

## Validation evidence

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/core typecheck` | PASS |
| `corepack pnpm --filter @atlas/core test` | PASS — 27 deterministic tests, including all 3 new hydration scenarios and existing grant/internal-route regressions. |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 18 tests; legacy `prompt-003/v1`, source-packet parity, and unhydrated multimodal packet lanes remain unchanged. |
| `git diff --check` | PASS |

The fake reader asserts `external_provider_attempt_count: 0`, `semantic_job_count: 0`, `unintended_perception_job_count: 0`, `admission_reservation_count: 0`, and `persistence_write_count: 0`. It receives only the redeemed grant scope. No test makes a live provider call, starts a job, reserves admission, publishes accepted truth, retries a provider, or records raw image payload in the checkpoint.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence/test locator and exact outcome | Status |
| --- | --- | --- |
| `RC-01` | For a verified grant, read only the requested retained asset; validate file presence, grant-bound manifest identity, payload hash/type/dimensions/length and source/locator identity; fail closed for corruption, missing history, oversize, wrong media and expiry. | `EphemeralDerivedImageHydrator` redeems the predecessor issuer before opening the reader and validates canonical manifest SHA, document/version/source/profile/page/locator/ref identity, PNG signature/IHDR dimensions, SHA-256 and bounded length. `hydration fails closed for missing, corrupt, mismatched, oversized, and expired retained assets` passes every named negative, including wrong source and media. | `PROVEN` |
| `RC-02` | Bytes are ephemeral; no bytes/base64 in job, replay, DB, logs or evidence. The service seam is bounded, cancelled and redacted; Bridge has no filesystem/database privilege. | The reader has no persistence/logging/job/Bridge capability and retains no byte field. It takes `AbortSignal`, rejects an aborted call before redemption/read, enforces at most 10 MiB, and converts reader/grant failures to a redacted error. `verified ephemeral hydration returns one bounded PNG without durable side effects` and `duplicate, restart, and cancellation paths never read a second image or create work` pass with all zero-effect counters. | `PROVEN` |
| `RC-03` | Duplicate/read-after-restart/abort preserve accepted evidence and never mint PDF/document/member/source grant/perception job/permit; existing browser resolver stays compatible. | The duplicate redemption is replay-blocked before a second reader call; a fresh issuer after restart cannot recreate the in-memory grant; an already-aborted call neither reads nor consumes its grant. The fake harness asserts no job/reservation/persistence effect. Browser resolver and derived persistence paths are untouched; existing core internal-route regressions and skills legacy lanes pass. | `PROVEN` |

**Known blocks:** none. **CK finding IDs:** not applicable. **Next allowed action:** independent CK of the implementation commit only; no provider transport or successor leaf work is implied.

Internal readiness: READY_FOR_CK

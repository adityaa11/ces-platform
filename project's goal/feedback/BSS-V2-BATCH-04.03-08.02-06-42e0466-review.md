# CK review — BSS-V2-004-03-08-02-06

- **Ticket:** `BSS-V2-004-03-08-02-06` — Multimodal request bounds, replay/redaction and resource interface
- **Batch:** `BSS-V2-BATCH-04.03-08.02-06`
- **Review type:** first independent CK review
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-02-06-multimodal-request-bounds-replay-redaction-and-resource-interface.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-004-03-08-02-06-go-checkpoint.md`
- **Reviewed implementation commit:** `42e04664f039dba77985cc8fbb39eb05cdef5dcf` (`feat(bridge): add multimodal request preflight`)
- **Checkpoint HEAD:** `afdf0ca7eb75f58419d071d62d9a97ecd7d85ccd`; it records the checkpoint and exact implementation target.
- **Comparison base:** `442225daff32169c7c6d3121cd9a6fd20d33fe7a`
- **Branch:** `codex/new-atlas-backend`

## Review boundary and preconditions

The current ticket records `awaiting_review`, and its GO checkpoint names the committed implementation SHA above. That SHA exists and is an ancestor of the checkpoint HEAD. The reviewed implementation diff from the recorded base contains only the two permitted paths: `apps/agents-bridge/src/provider-capabilities.ts` and `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts`. The later HEAD change records workflow evidence. Other workspace changes do not overlap those paths or make the target ambiguous.

The checkpoint records the required CK PASS predecessors: `08-02-03` at `fe788151d3c93dc8a4218a6312c8213b1a31a3c7`, `08-02-04` at `0cb26011e8290ae52032b10c92c00ebcf3fffb4f`, and `08-02-05` at `0339f158660eb14ea7705989a68e1105d99fc0e2`. The `08-01-01` legacy manifest requires Bridge typecheck, provider-boundary, and semantic-worker regressions for this shared capability path; those checks were run below. No predecessor is reopened.

## Independent evidence and validation

The diff adds a provider-neutral in-memory preflight and two versioned data shapes. It checks route/profile, deadline/cancellation, prompt bytes, image count/bytes/dimensions/media capability, preserves ordered part identity, emits a deterministic hash-only request spec, and returns bounded estimator inputs or `RESOURCE_ENVELOPE_BLOCKED` for unknown image TPM. It does not create a resource envelope or introduce a provider, job, persistence, reservation, or admission path. The existing string message type remains unchanged.

| Exact command independently run | Result |
| --- | --- |
| `docker compose run --build --rm --no-deps agents-bridge sh -c "node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/multipart-provider-capabilities.test.ts && node node_modules/typescript/bin/tsc -p apps/agents-bridge/tsconfig.json --noEmit"` | PASS — focused suite 7/7; TypeScript typecheck exit 0. |
| `docker compose run --rm --no-deps agents-bridge sh -c 'node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/provider-capabilities-boundary.test.ts && node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-worker.test.ts && node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/anoman-provider.test.ts && node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/mistral-provider.test.ts && node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/gemini-provider.test.ts'` | PASS — 2 boundary, 5 semantic-worker, 6 Anoman, 11 Mistral, and 8 Gemini tests. |
| `git diff --check 442225daff32169c7c6d3121cd9a6fd20d33fe7a 42e04664f039dba77985cc8fbb39eb05cdef5dcf` | PASS. |

All test paths used local deterministic fakes. No external provider request was made. The reviewed diff contains no persistence or logging path for image bytes or credentials. The focused test proves deterministic identity, hash-only serialization, unknown-TPM blocking, rejection before its fake authorization/dispatch boundary, and unchanged string message shape.

The replay test at `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts:138-153` proves an already-aborted signal is rejected and duplicate/restart preflight invocations return the same identity. However, its semantic execution, perception job, permit, reservation, and provider-attempt “counts” are local constants initialized to zero; they are not observations from fake side-effect boundaries. It therefore does not demonstrate the full RC-03 replay/cancellation side-effect condition.

## Review Contract outcomes

| Row | Ticket authority and required proof | Independent evidence | Status |
| --- | --- | --- | --- |
| `RC-01` | Ticket RC-01: enforce bounded ordered parts, prompt bytes, profile/media capability, deadline/cancellation; reject unknown route/profile and unsupported media before authorization/provider side effects. | Source inspection and the focused fake-boundary tests establish the bounds and rejection behavior. Unknown route/profile, expired/overlong deadline, unsupported media, and prompt overflow reject before fake authorization/dispatch counters increment. | `PROVEN` |
| `RC-02` | Ticket RC-02: emit deterministic request-spec identity and bounded estimator inputs only; do not infer tokens from bytes; unknown image TPM returns `RESOURCE_ENVELOPE_BLOCKED`. | Focused tests pass for deterministic schema canonicalization, hash-only request spec, bounded estimator fields, and unknown-TPM blocking. The diff creates no envelope or scheduler. | `PROVEN` |
| `RC-03` | Ticket RC-03: in fake aborted/duplicate/restart/cancel cases demonstrate no persistent base64 or leaked credentials, no new perception job/permit, semantic execution or reservation, no duplicate external attempt, and unchanged string-only behavior. | String-only behavior and redacted serialization are covered, and pre-abort rejection plus repeated identity are tested. The named replay test uses hard-coded zeros instead of fake side-effect counters, so duplicate/restart/cancel cases do not prove the required no-effect observations. | `IMPLEMENTED_UNPROVEN` |

## Findings

### CK-001 — Replay side-effect observations are not backed by fake boundaries

**Ticket authority:** RC-03 requires fake aborted/duplicate/restart/cancel cases to demonstrate no leaked/persisted base64 or credentials, no new perception job/permit, semantic execution or reservation, and no duplicate external attempt.

**Evidence and affected location:** `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts:138-153`. The test checks pre-aborted cancellation and stable identity across duplicate/restart invocations, but assigns `0` directly to `semanticExecutions`, `perceptionJobs`, `permits`, `reservations`, and `externalProviderAttemptCount`. These values do not come from observable fake caller/side-effect boundaries, and no duplicate attempt is exercised or counted. Therefore the ticket's required replay proof remains incomplete even though the preflight implementation itself is side-effect free by inspection.

**Observable correction:** Add deterministic fake-boundary coverage for the ticket's aborted, duplicate, restart, and cancellation cases. Wire each required side-effect count to the fake boundary it represents, assert repeated/cancelled requests do not initiate a second external attempt or unauthorized semantic/perception/admission effect, and assert captured persisted/loggable metadata excludes base64 and credentials. Keep the existing string-only regression passing.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- |
| `CK-001.a` | Ticket RC-03: fake aborted/duplicate/restart/cancel cases demonstrate redaction and zero unauthorized semantic/perception/admission effects and duplicate external attempts; preserve existing string-only behavior. | At `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts:138-153`, zero-effect values are constants, so no fake boundary observes replay/cancellation effects or counts duplicate external attempts. | **PASS iff** the focused deterministic fake-boundary tests exercise aborted, duplicate, restart, and cancellation inputs; the fake boundary's observed counters show zero additional external attempts and zero unauthorized semantic executions, perception jobs/permits, and reservations; captured persisted/loggable metadata contains no base64 or credentials; and the focused suite passes. Exact evidence location: `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts`, executed with `docker compose run --rm --no-deps agents-bridge node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/multipart-provider-capabilities.test.ts`. | Existing string-only message behavior; deterministic redacted request-spec identity; unknown route/profile, unsupported-media, bounds, and deadline rejection before fake authorization/dispatch; unknown image TPM blocking; provider-boundary and semantic-worker behavior; Anoman, Mistral, and Gemini legacy adapter behavior. No new provider or production activation requirement. |

## Scope-change observations

None. The reviewed work stays within the ticket's provider-neutral in-memory preflight and estimator-input interface.

## Decision

`CHANGES_REQUIRED`

`CK-001.a` is the sole blocking finding. It is limited to the ticket-required replay/redaction/no-side-effect evidence described by its frozen oracle. The review does not authorize remediation; any CFC work requires the existing human/planning authorization flow.

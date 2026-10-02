# CK Review — BSS-V2-BATCH-03 — 83c9271

- Ticket: `BSS-V2-003`, [BSS-V2-003-gemini-adapter-contracts.md](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-003-gemini-adapter-contracts.md)
- Batch: `BSS-V2-BATCH-03`
- Review type: first consolidated CK review
- Reviewed implementation commit: `83c9271b3e1b69cd0c4ea8071aec5d0a2170869e` (`feat(bridge): add Gemini adapter contracts`)
- GO evidence commit: `bc717deb8f1b2358e51ea0b5c34ea5d28fa8c46d`; it records `83c9271` as the implementation checkpoint.
- Ticket state: `awaiting_review` at the reviewed checkpoint
- Result: `CHANGES_REQUIRED`

## Target and authority

The explicit ticket resolves to BSS-V2-003. Its frozen contents and GO record identify `83c9271` as the implementation checkpoint. HEAD is the later GO evidence commit `bc717de`; the changes after the implementation commit record the GO evidence. The worktree contains unrelated edits and untracked artifacts, but no worktree changes under the BSS-V2-003 implementation, ticket, or GO record paths. They do not change or make ambiguous the committed target.

Authority used: the frozen ticket and its explicit Review Contract, Security Refactor Readiness review bindings, the cited BSS V2 implementation context, architecture and baseline references, the GO checkpoint, and repository evidence. The accepted BSS-V2-002 dependency is treated as an interface boundary and is not reopened.

## Review Contract

| Row | Ticket authority | Required behavior and proof | Evidence reviewed | Status |
| --- | --- | --- | --- | --- |
| RC-BSSV2-003-01 | Ticket Review Contract row 01 | Bounded structured request translation and complete Atlas-side schema revalidation; malformed and invalid output is rejected without weakening the schema. | `GeminiProvider.structured` maps system/user messages, applies request bounds, parses JSON and calls `validateJsonSchema`; the committed Gemini tests cover valid output, invalid JSON, and provider-valid-but-Atlas-invalid output. GO records the focused and normal Bridge suites passing. | PROVEN |
| RC-BSSV2-003-02 | Ticket Review Contract row 02; `SEAM-BSSV2-003-BOUNDED-INPUT`; `REV-READY-BSSV2-003-02` | Only explicit bounded PDF bytes are sent; no hosted file or storage path is used; the intermediate normalizes to `NormalizedDocument v1` without fabricated optional fields. | `GeminiProvider.perceive` accepts PDF bytes, uses inline data, enforces document/request/response bounds, and returns page text only. The committed synthetic PDF test exercises `normalizePerceptionResult` and checks absent geometry/confidence; GO records perception and normalization tests passing. | PROVEN |
| RC-BSSV2-003-03 | Ticket Review Contract row 03 | Stream events, cancellation, request/response bounds and provider errors normalize to Bridge contracts; cancellation terminates, post-output replay is absent, and errors/provenance are stable and secret-safe. | `GeminiProvider.streamChat` normalizes text/tool calls and HTTP/network/cancellation errors, bounds stream bytes and requires a finish reason. Tests cover cancellation after output with one transport call and a normalized HTTP authentication error. However, a provider candidate finish reason such as `SAFETY` is currently treated as successful completion, with no Bridge error. See CK-001. | UNRESOLVED |
| RC-BSSV2-003-04 | Ticket Review Contract row 04; `COUPLING-BSSV2-003-SDK-LEAK`; `REV-READY-BSSV2-003-01`; `REV-READY-BSSV2-003-03` | Credentials and Gemini SDK types remain Bridge-internal and secrets/types do not leak into contracts, logs, snapshots, payloads, or trusted tables. | The adapter uses an API-key header, emits fixed sanitized error messages, and has no Gemini SDK dependency/import. The committed boundary/source tests and Bridge typecheck are recorded passing by GO. | PROVEN |

## Validation and evidence

- Inspected commit `83c9271` and the GO checkpoint at HEAD, including the Gemini adapter, config, route identity checks, both runtime composition roots, committed Gemini tests, and ticket-bound evidence.
- The committed GO record reports Bridge typecheck and normal suite passing, a 39-test focused deterministic set passing, Compose config/build/recreation passing, and healthy API/worker readiness. Compose-gated PostgreSQL cases were recorded as skipped under their existing disabled environment gates.
- CK did not rerun validation commands. The command results above are reported from the committed GO evidence, not independent CK execution.

## Frozen Finding Closure Matrix

### CK-001 — Gemini safety termination is reported as successful stream completion

Authority: BSS-V2-003 Review Contract row 03 requires normalized provider errors and stable Bridge stream behavior. `apps/agents-bridge/src/providers/gemini.ts`, in `GeminiProvider.streamChat`, marks any nonempty candidate `finishReason` other than `FINISH_REASON_UNSPECIFIED` as `completed` (the candidate completion check near line 124). Consequently, a candidate ending with `SAFETY` can produce the Bridge `complete` event even though the provider refused generation. This makes the provider outcome appear successful instead of normalizing the provider error/outcome into the Bridge contract.

#### CK-001.a

- **Ticket authority:** BSS-V2-003 Review Contract row 03: “Streaming, cancellation, request/response bounds, and provider errors normalize to Bridge contracts.”
- **Unsatisfied evidence:** The committed test only covers successful `STOP` completion and HTTP authentication rejection. It does not establish a normalized Bridge outcome for a provider candidate rejected with a safety finish reason; current code treats that reason as successful completion.
- **Observable correction:** Map provider refusal finish reasons, including `SAFETY`, to a stable secret-safe Bridge error/outcome instead of emitting successful `complete`.
- **Binary closure oracle:** **PASS** iff a deterministic stream fixture with a candidate ending in `SAFETY` yields the chosen stable Bridge error/outcome, emits no successful `complete`, and exposes no provider body or secret in the error; the assertion and passing validation must be located in `apps/agents-bridge/tests/gemini-provider.test.ts` and its executed test command recorded in the next checkpoint. **FAIL** if this fixture yields successful `complete`, leaks provider response content/secrets, or lacks that evidence.
- **Direct-regression boundary:** Gemini stream finish-reason-to-Bridge outcome mapping and its associated error redaction only. Existing STOP success, tool/text event, cancellation-after-output/no-replay, and stream-bound behavior are direct regression boundaries only if the remediation changes them; this clause does not require broader adapter or provider requalification.

Finding CK-001 is the consolidated finding for this first review. Its clause and oracle are frozen by this artifact.

## Scope-change observations

None. No live call, route activation, usage persistence, capacity/privacy/fallback policy, provider-hosted Atlas state, or deployment change is required to satisfy this ticket.

## Decision

`CHANGES_REQUIRED`. RC-BSSV2-003-03 remains unproven because a Gemini safety-refusal finish reason can be surfaced as successful completion instead of a normalized Bridge outcome. The single frozen closure clause is CK-001.a. All other ticket Review Contract rows are proven by implementation inspection and the recorded GO evidence. Return the checkpoint to human/planning authority for the bounded workflow decision; this review does not itself authorize remediation.

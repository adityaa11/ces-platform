# CK review — BSS-V2-004-03-08-02-05

- **Ticket:** `BSS-V2-004-03-08-02-05` — Concrete Anoman multimodal transport conformance
- **Batch:** `BSS-V2-BATCH-04.03-08.02-05`
- **Review type:** first independent CK review
- **Reviewed commit:** `77304fcbb868e4993b57b21c84c8e0d475376a34` (`feat(bridge): serialize Anoman multipart messages`)
- **Checkpoint HEAD:** `9331a02` (`docs(bss): checkpoint Anoman multimodal conformance`); the GO checkpoint names the implementation commit explicitly.
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-02-05-concrete-anoman-multimodal-transport-conformance.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-004-03-08-02-05-go-checkpoint.md`
- **Ticket state before review:** `awaiting_review`
- **Comparison base:** `f701146960974e1b9207b9a80e5433c410957cfc`

## Review boundary

The committed GO checkpoint binds this review to implementation commit `77304fc…`; the later checkpoint commit contains the ticket state transition and GO evidence. The reviewed source and test files are clean. Although the worktree has unrelated modified generated fixtures and untracked files, they do not overlap the two implementation paths. The checkpoint identifies the exact review target, so those files do not make it ambiguous. The separate untracked draft-bundle ticket copy was not treated as ticket authority.

The implementation diff from the comparison base contains only `apps/agents-bridge/src/providers/anoman.ts` and `apps/agents-bridge/tests/anoman-provider.test.ts`. The ticket records passing prerequisite CK results for `08-02-03`, `08-02-04`, and sole adapter owner `03-04`. This review consumes those approved boundaries and does not reopen them.

## Independent evidence and validation

The adapter preserves the existing string `structured` path and adds an opt-in multipart method. It maps ordered text and image parts to Anoman's object-mode `text` / `image_url` request shape, applies the pinned model, endpoint, request/response limits, timeout and cancellation through the existing transport, and has no route/worker activation, retry, fallback, or semantic execution changes. All request captures below use injected fakes. No external provider call was made.

The positive request test proves ordered parts, PNG data-URL encoding, object mode, and absence of neutral `sourcePartId` or schema fields on the vendor wire. Negative tests prove pre-HTTP rejection for unsupported MIME, byte-length mismatch, and cancellation. However, the preflight accepts an image with zero bytes and accepts non-positive width or height when the other declared bounds are met. `dispatchMultipartStructured` checks only the upper dimension bounds and equality of declared and actual byte length (`apps/agents-bridge/src/provider-capabilities.ts:77-79`). These inputs therefore reach the HTTP fetcher, contrary to RC-02's requirement that invalid media fail without HTTP side effects.

| Exact command independently run | Result |
| --- | --- |
| `docker compose run --build --rm --no-deps agents-bridge corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| Compose-run `anoman-provider.test.ts` | PASS: 6 tests |
| Compose-run `multipart-provider-capabilities.test.ts` | PASS: 3 tests |
| Compose-run `gemini-provider.test.ts` | PASS: 8 tests |
| Compose-run `provider-capabilities-boundary.test.ts` | PASS: 2 tests |
| Compose-run `route-registry.test.ts` | PASS: 7 tests |
| `git diff --check f701146960974e1b9207b9a80e5433c410957cfc 77304fcbb868e4993b57b21c84c8e0d475376a34` | PASS |

## Review Contract outcomes

| Row | Ticket authority and required observable | CK evidence | Status |
| --- | --- | --- | --- |
| `RC-01` | Frozen ticket RC-01: fake Anoman capture has exact ordered text/image parts and valid bounded wire encoding while retaining the pinned route/model/object mode and deadline/cancellation. | Positive fake transport asserts order, bounded PNG data-URL serialization, pinned object mode, and cancellation behavior. Existing adapter validation confirms request bounds, endpoint/model and timeout behavior. No provider schema authority or source reclassification is added. | `PROVEN` |
| `RC-02` | Frozen ticket RC-02: preserve Anoman text-only behavior, Gemini, routing, errors, usage and credential redaction; unsupported capability and oversized/invalid media must fail before HTTP side effects. | Anoman, Gemini, capability-boundary and route-registry regressions pass. Unsupported MIME and byte-length mismatch reject before fetch. But zero-byte images and images with zero/negative dimensions pass the current checks and reach fetch; invalid-media preflight is incomplete. | `UNRESOLVED` |
| `RC-03` | Frozen ticket RC-03: no real Anoman call, retry/fallback, semantic provider activation, or semantic side effects; document that transport conformance is not vision qualification. | All evidence uses injected fake transports; the code dispatches one request and adds no activation path, retry, fallback, job, reservation, reconciliation, or publish change. The ticket/checkpoint explicitly limits the claim to transport conformance. | `PROVEN` |

## Findings

### `CK-001` — Invalid image metadata can reach Anoman transport

**Authority:** Frozen ticket RC-02 requires invalid media to fail without HTTP side effects. RC-01 also requires bounded wire encoding.

**Evidence:** `dispatchMultipartStructured` in `apps/agents-bridge/src/provider-capabilities.ts:77-79` verifies maximum count/bytes/dimensions, byte-length equality, and media type, but does not reject empty payloads or dimensions below one. Such an image is serialized and passed to the fetcher. The focused tests cover unsupported MIME and mismatched byte length, but do not cover these invalid media values.

**Observable correction:** Ensure invalid image payload metadata is rejected during preflight before the transport callback; add fake-fetch assertions for empty image bytes and zero/non-positive dimensions. The fake fetch count must remain zero for each rejected request. Preserve valid bounded mixed-part serialization and legacy provider behavior.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Observable correction and binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- |
| `CK-001.a` | Ticket RC-02: “unsupported capability and oversized/invalid media fail without HTTP side effects”; RC-01: “valid bounded wire encoding.” | `apps/agents-bridge/src/provider-capabilities.ts:77-79` accepts zero-length bytes when declared length matches, and accepts zero/non-positive dimensions because only upper bounds are checked. The current fake tests do not establish pre-HTTP rejection for these inputs. | **PASS iff** focused fake-transport assertions demonstrate that an image with empty bytes and each non-positive dimension is rejected as `invalid_request` before fetch, with fetch count `0`. Evidence must be in `apps/agents-bridge/tests/anoman-provider.test.ts` and pass under `docker compose run --rm --no-deps agents-bridge node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/anoman-provider.test.ts`. | The original ticket's direct regression boundary: valid bounded mixed-part wire order/encoding, existing Anoman text-only behavior, Gemini, route behavior, normalized errors/usage and credential redaction. No new provider or activation requirement. |

## Scope-change observations

None. This review does not qualify Anoman vision/perception accuracy or resolve provider privacy/residency, admission, or image-cost policy; the ticket explicitly excludes those decisions.

## Decision

`CHANGES_REQUIRED`

The first consolidated review found one implementation-repairable RC-02 deficiency. The frozen clause above is the complete admissible closure target for bounded CFC; no remediation is authorized by this artifact alone.

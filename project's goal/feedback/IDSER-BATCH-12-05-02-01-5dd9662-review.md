# CK review: IDSER-012-05-02-01 / IDSER-BATCH-12-05-02-01

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-02-01-multimodal-inventory-and-candidate-construction.md`
- **Batch:** `IDSER-BATCH-12-05-02-01`
- **Reviewed commit:** `5dd966200fc038af944badc9c497d1a414cd250a` (`feat(idser): inventory multimodal candidates`)
- **GO checkpoint:** `project's goal/feedback/IDSER-BATCH-12-05-02-01-go-checkpoint.md`
- **Ticket state:** `awaiting_review`
- **Review type:** first consolidated CK review
- **Result:** `PASS`

## Review preconditions and evidence

- The active tuple is unambiguous: the explicitly named ticket, batch, `awaiting_review` state, GO checkpoint, and implementation commit agree.
- The reviewed commit is an ancestor of the current `HEAD`; `HEAD` adds only the GO checkpoint artifact after the implementation commit. Unrelated modified and untracked worktree paths do not overlap the reviewed implementation or test paths, so the review target is not ambiguous.
- No prior CK, CFC, or HMN artifact exists for this checkpoint.
- The review is limited to the frozen ticket contract: accepted locator inventory, deterministic transient candidate construction through the approved composer/estimator seams, explicit visual dispositions, and the stated no-BSS/no-persistence/no-provider boundary. The parent split map is used only to preserve that boundary; it does not add acceptance criteria.

## Review Contract

| Row | Ticket authority and required proof | CK assessment |
| --- | --- | --- |
| `RC-01205-0201-01` | Frozen ticket row `RC-01205-0201-01`: every accepted visual is inventoried exactly once with an eligible candidate association or explicit fail-closed disposition; no silent omission or whole-document attachment. | **PROVEN.** `apps/agents-bridge/src/idser-multimodal-inventory-candidates.ts:159-188` walks canonical page/type/locator order, checks each visual against accepted media and verified measurements, rejects duplicates and foreign/unmatched entries, and never attaches an entire document implicitly. Focused test coverage at `apps/agents-bridge/tests/idser-multimodal-inventory-candidates.test.ts:20-32,35-49` proves mixed, image-only, text-only, and deterministic visual association behavior. |
| `RC-01205-0201-02` | Frozen ticket row `RC-01205-0201-02`: candidate `ownedLocators`, `contextOnlyLocators`, ordered selected-media commitments, hashes, and measurements are deterministic for text-only, mixed, and image-only cases. | **PROVEN.** The candidate builder at `apps/agents-bridge/src/idser-multimodal-inventory-candidates.ts:191-210` delegates to `composeCanonicalMultimodalSource()` and `estimateConservativeMultimodalRequest()` exactly once, preserves the ordered descriptor manifest and both identity hashes, and returns frozen locator/media/estimate data. The repeated-output, media-order, image-only, and text-only assertions pass at `apps/agents-bridge/tests/idser-multimodal-inventory-candidates.test.ts:20-32`; the approved estimator/composition regression suites also pass. |
| `RC-01205-0201-03` | Frozen ticket row `RC-01205-0201-03`: malformed, foreign, unavailable, and indivisible items have stable explicit reasons and cannot enter a candidate as text or unaccounted media. | **PROVEN.** `checkedVisual()` at `apps/agents-bridge/src/idser-multimodal-inventory-candidates.ts:108-135` emits stable malformed/foreign/unavailable/unsupported dispositions; estimator rejection is converted to explicit `indivisible` disposition at `:213-225`, and rejected visuals are excluded from the fallback text/table candidate. The focused negative cases at `apps/agents-bridge/tests/idser-multimodal-inventory-candidates.test.ts:35-49` pass, including the no-text-substitution assertion. |

## Boundary and regression review

- The submitted seam imports only the approved shared skills/types and the pinned estimator; its focused purity assertion passes and the implementation contains no BSS reader, persistence, media retrieval, hydration, provider dispatch, or admission surface.
- `imageTpm: unknown` remains carried by the estimator provenance; no numeric provider quota or automatic TPM denial is introduced by this ticket.
- No direct regression was found in the reviewed behavior or in the approved `-01` composer/estimator behavior needed by this ticket.
- The full `@atlas/agents-bridge` suite was executed and reached the known unrelated failure at `apps/agents-bridge/tests/docling-provider.test.ts:109-112`: `docling-digital-pdf` lacks the approved RUN-003 qualification. The focused ticket suite, composition/estimator regressions, and typecheck pass; this ticket does not modify the Docling route.

## Validation and evidence

- `corepack pnpm --filter @atlas/agents-bridge test:idser-multimodal-inventory-candidates` — **PASS**: 3 tests, 3 pass.
- `corepack pnpm --filter @atlas/agents-bridge test:conservative-multimodal-estimation` — **PASS**: 5 tests, 5 pass.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/complete-sem-candidate-request-estimator.test.ts` — **PASS**: 4 tests, 4 pass.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `git diff --check 5dd966200fc038af944badc9c497d1a414cd250a^ 5dd966200fc038af944badc9c497d1a414cd250a` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge test` — **FAIL** only at the recorded unrelated Docling route assertion after all reviewed suites pass.

## Scope-change observations

None. The reviewed checkpoint satisfies the frozen ticket contract within the approved implementation and dependency boundaries. No ticket change, new runtime/provider/deployment target, architecture or product decision, unresolved policy decision, or predecessor reopening is required.

## Decision

`PASS`. `IDSER-012-05-02-01` is approved at reviewed commit `5dd966200fc038af944badc9c497d1a414cd250a`; no CFC remediation is required.

# IDSER-012-05-01-02 GO checkpoint

- **Ticket:** `IDSER-012-05-01-02` — Conservative multimodal estimation and serializer-policy conformance
- **Batch:** `IDSER-BATCH-12-05-01-02`
- **Implementation commit:** `9279bd51a81594c443ad2aeef8e23d6f835b5669` (`feat(idser): estimate canonical multimodal requests`)
- **Predecessor:** `IDSER-012-05-01-01` CK `PASS` at `2c6be30f32d28895939e77d1bffd636a55f5b192`.
- **Ticket state:** `awaiting_review`

## Bounded implementation

- Added the pure `estimateConservativeMultimodalRequest()` planner seam. It accepts only the approved canonical composition, the equivalent shared source packet, pinned route/media metadata, pinned serializer policy, and established estimator configuration.
- Reused `estimateCompleteSemCandidateRequest()` for text tokens, reservation, and BSS envelope. The new seam derives each selected PNG's data-URL allowance and versioned `ceil(width/768) * ceil(height/768) * 516` internal token estimate, then rejects incomplete, mismatched, unsafe, or over-bound input.
- Extracted the existing Anoman multipart JSON/data-URL serialization into one versioned policy used by both the live adapter and a metadata-only byte projection. The estimator rejects an undercounting projection instead of guessing adapter framing.
- No BSS read/write, admission, source selection, persistence, hydration, provider call, SEM work, grant, or durable request payload was added.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| `RC-01205-0102-01` | Deterministically measure image/text input, complete conservative request bytes, output reservation once, and BSS demand from `-01-01` manifest and effective limits without hydration. | `apps/agents-bridge/src/conservative-multimodal-estimation.ts:104-153` verifies composition/packet identity, derives dimensions/base64 accounting, delegates to the shared estimator, and retains its envelope. `apps/agents-bridge/tests/conservative-multimodal-estimation.test.ts:60-76` proves deterministic image-only/mixed/text-only measurements and single reservation. | `PROVEN` |
| `RC-01205-0102-02` | Count every selected owned/context PNG exactly once; reject dimension and arithmetic failures safely. | The descriptor-to-slot checks at `conservative-multimodal-estimation.ts:66-101`, safe sums, exact selected-media map, and focused negatives at `tests/conservative-multimodal-estimation.test.ts:78-85` prove one-count semantics and fail-closed mismatches/bounds. | `PROVEN` |
| `RC-01205-0102-03` | Pin source/prompt/schema/profile/composer/adapter/estimator/configuration identities; detect unsafe serializer undercount or drift without SEM/Anoman activity. | `conservative-multimodal-estimation.ts:104-153` emits composition, prompt/schema, source-specification, estimator/configuration, route and serializer-policy provenance and rejects a projection larger than measured bytes. `providers/anoman-multipart-serialization.ts:5-66` is the shared versioned adapter policy. `tests/conservative-multimodal-estimation.test.ts:42-48,78-85` proves exact metadata-only projection parity, drift and undercount rejection, plus no transport/BSS/hydration import. | `PROVEN` |
| `RC-01205-0102-04` | Preserve unknown image TPM as provenance; do not invent a numeric limit or automatic denial; introduce no second estimator or serializer. | The result passes `effectiveRoute.imageTpm` through unchanged at `conservative-multimodal-estimation.ts:136-150`; focused test line 70 asserts `{ state: "unknown" }` remains non-blocking. Existing `estimateCompleteSemCandidateRequest()` is reused, and the live Anoman adapter now consumes the same extracted serializer policy. | `PROVEN` |

Validation executed against `9279bd51a81594c443ad2aeef8e23d6f835b5669`:

- `corepack pnpm --filter @atlas/agents-bridge test:conservative-multimodal-estimation` — **PASS**: 4 tests, 4 pass.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/anoman-provider.test.ts` — **PASS**: 6 tests, 6 pass.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/multipart-provider-capabilities.test.ts` — **PASS**: 7 tests, 7 pass.
- `git diff --check 9279bd51a81594c443ad2aeef8e23d6f835b5669^ 9279bd51a81594c443ad2aeef8e23d6f835b5669 -- apps/agents-bridge/package.json apps/agents-bridge/src/providers/anoman.ts apps/agents-bridge/src/providers/anoman-multipart-serialization.ts apps/agents-bridge/src/conservative-multimodal-estimation.ts apps/agents-bridge/tests/conservative-multimodal-estimation.test.ts` — **PASS**.

## Applicable limitation

The broader `corepack pnpm --filter @atlas/agents-bridge test` suite reaches an unrelated pre-existing failure in `tests/docling-provider.test.ts` (the Docling route qualification assertion rejects `docling-digital-pdf`). The implementation commit contains no change to that test, Docling provider, or route registry; the direct estimator and adapter regressions above pass. This checkpoint adds no dependency or remediation scope for the Docling lane.

Internal readiness: READY_FOR_CK

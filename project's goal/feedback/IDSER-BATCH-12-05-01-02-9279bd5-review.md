# CK review: IDSER-012-05-01-02 / IDSER-BATCH-12-05-01-02

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-01-02-conservative-multimodal-estimation.md`
- **Batch:** `IDSER-BATCH-12-05-01-02`.
- **Reviewed commit:** `9279bd51a81594c443ad2aeef8e23d6f835b5669` (`feat(idser): estimate canonical multimodal requests`).
- **GO checkpoint:** `project's goal/feedback/IDSER-BATCH-12-05-01-02-go-checkpoint.md`.
- **Ticket state:** `awaiting_review`.
- **Review type:** first consolidated CK review.
- **Result:** `CHANGES_REQUIRED`.

## Review preconditions and evidence

- The active tuple is unambiguous: named ticket `IDSER-012-05-01-02`, batch `IDSER-BATCH-12-05-01-02`, `awaiting_review` state, GO checkpoint, and implementation commit all agree.
- The recorded implementation commit exists and is an ancestor of the current `HEAD` (`792a734139b8ea9d7aa2952ceabef481934accf5`). The worktree has unrelated modified and untracked paths, but the reviewed implementation, focused test, package script, ticket, and GO checkpoint paths have no overlapping worktree changes and the review target is not ambiguous.
- No prior CK, CFC, or HMN artifact exists for this checkpoint.
- Reviewed the frozen child ticket, its parent split map, the GO closure, the committed production/test diff, the approved canonical composition and shared estimator seams, and the predecessor `IDSER-012-05-01-01` CK `PASS` boundary.

## Review Contract

| Row | Ticket authority | Required proof | CK assessment |
| --- | --- | --- | --- |
| `RC-01205-0102-01` | Image tokens, conservative complete request bytes, input tokens, output reservation and BSS demand are deterministically measured from the `-01-01` manifest and effective limits without hydration. | The shared estimator is reused and the owned-image/text-only checks pass, but the required context-only visual composition rejects before producing the complete estimate. | `UNRESOLVED` — `CK-001.a` |
| `RC-01205-0102-02` | Image-only, mixed and text-only compositions count every selected owned/context PNG exactly once; dimensions/arithmetic failures reject safely. | Dimension and arithmetic guards are present, but a context-only PNG is included in the canonical descriptor manifest and is then rejected as invalid selected-media accounting instead of being counted. The named owned/context scenario is also absent from the focused harness. | `UNRESOLVED` — `CK-001.a`, `CK-001.b` |
| `RC-01205-0102-03` | Route/profile/serializer, estimator/configuration and prompt/schema/source identities are pinned; serializer-policy conformance detects unsafe undercount/drift without SEM/Anoman invocation. | `apps/agents-bridge/src/conservative-multimodal-estimation.ts:104-149` emits the required provenance and rejects a projected serializer body larger than the shared estimate; `apps/agents-bridge/src/providers/anoman-multipart-serialization.ts:3-66` is shared by the live adapter and projection. Focused serializer parity, drift/undercount rejection, and purity checks pass. | `PROVEN` |
| `RC-01205-0102-04` | Unknown image TPM is retained as provenance, never invented as a numeric limit or automatic denial; no second estimator or serializer is introduced. | `apps/agents-bridge/src/conservative-multimodal-estimation.ts:136-148` preserves `effectiveRoute.imageTpm`, reuses `estimateCompleteSemCandidateRequest()`, and uses the extracted adapter serializer policy. The focused unknown-TPM assertion and provider regressions pass. | `PROVEN` |

## Validation and direct-regression checks

- `corepack pnpm --filter @atlas/agents-bridge test:conservative-multimodal-estimation` — **PASS**: 4 tests, 4 pass.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/anoman-provider.test.ts` — **PASS**: 6 tests, 6 pass.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/multipart-provider-capabilities.test.ts` — **PASS**: 7 tests, 7 pass.
- `git diff --check 9279bd51a81594c443ad2aeef8e23d6f835b5669^ 9279bd51a81594c443ad2aeef8e23d6f835b5669 -- apps/agents-bridge/package.json apps/agents-bridge/src/providers/anoman.ts apps/agents-bridge/src/providers/anoman-multipart-serialization.ts apps/agents-bridge/src/conservative-multimodal-estimation.ts apps/agents-bridge/tests/conservative-multimodal-estimation.test.ts` — **PASS**.
- CK offline reproduction using the canonical context-visual fixture shape from `packages/atlas-skills/tests/canonical-multimodal-composition.test.ts:31-36`: one owned visual plus one context-only visual reaches `apps/agents-bridge/src/conservative-multimodal-estimation.ts:119-125`, then fails in `apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts:111-124` with `CompleteSemCandidateRequestEstimatorError: SEM_BATCH_ESTIMATOR_GAP: selected-media accounting is missing, foreign, duplicate, or invalid`.
- The GO checkpoint's broader-suite Docling limitation was inspected but not used as a CK finding; the focused estimator and direct adapter regression checks above are the checks performed for this review.

## Frozen Finding Closure Matrix

### CK-001 — Context-only selected PNGs are not estimable

The implementation and evidence do not satisfy the ticket's owned/context counting contract. This is one consolidated finding because the missing named scenario exposes the same implementation failure.

#### CK-001.a

- **Exact ticket authority:** `IDSER-012-05-01-02` frozen CK row `RC-01205-0102-02`, requiring every selected owned/context PNG in image-only and mixed compositions to be counted exactly once; the same failure prevents completion of `RC-01205-0102-01` for that required composition.
- **Unsatisfied evidence and affected location:** `apps/agents-bridge/src/conservative-multimodal-estimation.ts:119-125` maps every canonical visual descriptor into `selectedMedia`. The canonical composition includes context-only visuals (`packages/atlas-skills/src/canonical-multimodal-composition.ts:118-142`), but the shared estimator admits only slots with role `pending_authorized_media` (`apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts:111-124`). A packet with one owned visual and one context-only visual therefore throws instead of returning a conservative estimate.
- **Observable correction/proof:** For a canonical composition containing at least one owned PNG and one context-only PNG, the estimator must return successfully with `selectedImageCount` equal to the number of selected PNGs, `selectedImageBytes` equal to their exact byte-length sum, image tokens equal to the sum of each versioned grid estimate, `requestBytes >= projectedTransportBytes`, and `requestResourceEnvelope.tokenUnits = inputTokens + reservedOutputTokens`. The focused test must pass for that composition without hydration, transport, SEM, or BSS side effects.
- **Binary closure oracle:** **PASS** only when the focused estimator command returns a successful estimate for the owned-plus-context composition and the assertions above pass; **FAIL** when it throws `SEM_BATCH_ESTIMATOR_GAP` or omits/double-counts either selected PNG.
- **Exact evidence location/validation:** `apps/agents-bridge/tests/conservative-multimodal-estimation.test.ts` focused command, plus the offline reproduction recorded above; the correction must be demonstrated by the same focused command at the committed remediation revision.
- **Direct-regression boundary:** Only estimation/canonical-composition accounting and its focused harness are in scope. Existing owned-image, text-only, serializer-policy, Anoman-adapter, and multipart-capability checks must remain passing; no provider, hydration, persistence, SEM, admission, or BSS implementation expansion is authorized.

#### CK-001.b

- **Exact ticket authority:** `IDSER-012-05-01-02` frozen CK row `RC-01205-0102-02`, which names image-only, mixed and text-only compositions and explicitly requires selected owned/context PNG coverage.
- **Unsatisfied evidence and affected location:** `apps/agents-bridge/tests/conservative-multimodal-estimation.test.ts:60-76` covers an owned-image-only input, a text-plus-owned-image input, and text-only input, but does not exercise a context-only visual or an owned-plus-context visual. The current focused green result therefore cannot prove the ticket's owned/context obligation even if the implementation rejection were not present.
- **Observable correction/proof:** Add focused assertions for a context-only image-only composition and an owned-plus-context mixed composition, proving exact count, bytes, image-token sum, request-byte safety, and one output reservation/BSS demand. The new evidence must run through the pure estimator harness and preserve the existing negative and purity assertions.
- **Binary closure oracle:** **PASS** only when the required context-only and owned-plus-context scenarios are present in the focused harness and pass with the exact observations above; **FAIL** when either named scenario is absent or its observations are not asserted.
- **Exact evidence location/validation:** The committed `apps/agents-bridge/tests/conservative-multimodal-estimation.test.ts` at the remediation revision, executed by `corepack pnpm --filter @atlas/agents-bridge test:conservative-multimodal-estimation`.
- **Direct-regression boundary:** Test/evidence expansion is limited to the ticket's estimation seam and does not authorize broader multimodal execution or provider integration work.

All finding clauses and their binary closure oracles are frozen by this first CK artifact. A later verification may not strengthen them silently.

## Scope-change observations

None. No ticket change, new provider/runtime/deployment target, architecture or product decision, unresolved policy decision, dependency reopening, or downstream IDSER work is required to decide this review.

## Decision

`CHANGES_REQUIRED`. `IDSER-012-05-01-02` remains `awaiting_review`. The committed work proves the serializer/provenance and unknown-TPM rows, but it fails the ticket-authorized owned/context PNG estimation contract and lacks the required context scenarios in its focused proof. This artifact freezes `CK-001.a` and `CK-001.b`; it does not authorize CFC. Further remediation requires the bounded Atlas human/planning handoff and workflow authorization.

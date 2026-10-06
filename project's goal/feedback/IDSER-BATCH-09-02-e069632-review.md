# CK review: IDSER-009-02 / IDSER-BATCH-09-02

- **Review type:** first committed-checkpoint review
- **Ticket:** `IDSER-009-02-deterministic-production-card-projection.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `e0696328f50658c35ab7cd582a9b59d8b3fab9b9` (`feat(atlas): project persisted lifecycle cards`)
- **GO checkpoint:** `IDSER-BATCH-09-02-go-checkpoint.md`
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-009-02-deterministic-production-card-projection.md` as committed at the reviewed checkpoint
- **Dependency:** IDSER-009-01 `PASS`, recorded at `IDSER-BATCH-09-01-dd5f6cb-verification.md`
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Ticket authority | Required behavior / proof | Status |
|---|---|---|---|
| RC-009-02-01 | IDSER-009-02, review contract row 1 | Each valid persisted lifecycle state maps to its exact card state; ready requires the persisted completion lifecycle. | PROVEN |
| RC-009-02-02 | IDSER-009-02, review contract row 2 | Exact completed-member X/N label and floored percentage; OCR/extraction-only states do not increase X. | PROVEN |
| RC-009-02-03 | IDSER-009-02, review contract row 3 | Technical failure has bounded safe copy; private failure data is excluded; semantic uncertainty remains distinct. | IMPLEMENTED_UNPROVEN at the signed transport boundary; see CK-001.a |
| RC-009-02-04 | IDSER-009-02, review contract row 4 | Explicit legacy waiting, malformed fail-closed behavior, zero published facts, empty Master, and unavailable action. | PROVEN |
| RC-009-02-05 | IDSER-009-02, review contract row 5 | Signed internal read transports only an approved model; refresh consumes persisted read state. | IMPLEMENTED_UNPROVEN for failure-model validation; see CK-001.a |

## Evidence and validation reviewed

- Confirmed the ticket is `awaiting_review`, `HEAD` equals the GO implementation commit `e0696328f50658c35ab7cd582a9b59d8b3fab9b9`, and the ticket's implementation diff is committed at that revision.
- The worktree reports tracked modifications to `apps/atlas/tsconfig.tsbuildinfo` and two generated fixture outputs; untracked entries are workflow artifacts. None overlap the ticket implementation, its mapper test, or its checkpoint, so the committed target is unambiguous.
- Inspected the complete implementation commit diff, the five ticket review-contract rows, GO checkpoint, and the accepted 009-01 lifecycle read contract.
- The mapper validates persisted lifecycle counts/member facts, exact state requirements, safe failure copy, and the invariant card fields. The deterministic fixtures cover legacy waiting, waiting, processing, terminal failure, ready, 0/2, 1/2, 2/2, 1/3 -> 33%, OCR/extraction-only non-counting, malformed lifecycle rejection, and signed-model allow-list behavior.
- In `apps/atlas/lib/home-project-read-service.ts`, `parseApprovedHomeProjectCards` validates that an optional `attentionReason`, when present, is the bounded literal and appears only with `needs-attention`; however, it accepts a `needs-attention` model with no `attentionReason`. This leaves the safe failure copy unproven across the signed transport boundary.
- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs'` — **passed**, 4/4 tests, 0 skipped.
- The GO checkpoint records a successful Atlas app build. It also records that the broader app test command's authenticated-home integration test could not run without a backing service/database under `--no-deps`; that integration harness is outside this ticket's deterministic mapper/read-model proof requirement.

## Finding

### CK-001 — Signed read boundary accepts a failure card without its bounded reason

**Ticket authority:** IDSER-009-02, `Authority and outcome` paragraph 3 requires persisted technical failure to project to `needs-attention` with a bounded safe reason. Review contract row `RC-009-02-03` requires bounded user copy, and row `RC-009-02-05` requires the signed internal read to transport only the approved model. The mapper emits the literal `Processing needs attention.`, but the transport parser permits that required field to be absent.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
|---|---|---|---|
| **CK-001.a** | IDSER-009-02 `Authority and outcome` paragraph 3 and review-contract rows `RC-009-02-03` / `RC-009-02-05`. In `apps/atlas/lib/home-project-read-service.ts`, `parseApprovedHomeProjectCards` only constrains `attentionReason` when it is present. A payload whose card has `state: "needs-attention"` and no `attentionReason` is accepted, so the signed read boundary can deliver a technical-failure card without the ticket-required safe reason. Existing transport tests reject an extra private field and an invented state but do not exercise this missing required field. | Make the read-model parser require `attentionReason: "Processing needs attention."` whenever `state` is `needs-attention`, and add parser assertions that accept the valid literal and reject its omission or a different value. Preserve omission of `attentionReason` for non-failure card states. | **PASS iff** `apps/atlas/lib/home-project-read-service.ts` rejects a `needs-attention` card without the exact bounded literal, accepts the same card with that literal, and `apps/atlas/tests/home-projects.test.mjs` asserts both outcomes; `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs'` passes. **Direct-regression boundary:** signed project-card parsing for the `needs-attention` reason invariant and preservation of other card states' transport behavior. | 

## Scope-change observations

None. The frozen ticket determines the mapper and read-model scope without an unresolved product or architecture decision.

## Decision

Record `CHANGES_REQUIRED` for IDSER-009-02 / IDSER-BATCH-09-02 at commit `e0696328f50658c35ab7cd582a9b59d8b3fab9b9`. The single finding above is the complete first-review set of currently identifiable ticket-bound deficiencies. Its closure matrix is frozen; further verification must use this oracle and remain bounded to the authorized remediation and direct regressions.


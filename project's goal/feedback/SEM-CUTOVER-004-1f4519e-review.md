# CK review — SEM-CUTOVER-004

- **Ticket:** `SEM-CUTOVER-004` — One versioned stepwise extraction request and response envelope
- **Batch:** `SEM-CUTOVER`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-004-single-stepwise-proposal-envelope.md`
- **Reviewed implementation commit:** `1f4519ec292b2a5ef6fa326116d5f85d0887b7cf` (`feat(sem-cutover): add stepwise relationship envelope request`)
- **GO checkpoint commit:** `39683e06037f78b6ea85b740bf6ea6d92b5991db` (`docs(sem-cutover): hand off 004 for review`)
- **Ticket/checkpoint state:** `awaiting_review`
- **Review type:** First independent CK review
- **Result:** `PASS`

## Target and authority

The active-ticket tuple is unambiguous: the explicit user command names
`SEM-CUTOVER-004`, the GO checkpoint names the frozen ticket and implementation
commit, and the checkpoint commit is based directly on that implementation
commit. The required predecessor gates are present as independent CK
`PASS` records for `SEM-CUTOVER-002` at `330eae8b1f63dd69855f307e2ac0df1444a2e3dd`
and `SEM-CUTOVER-003` at
`cd6a8006e12e3f7caeeaea6f77f9d3181947760f`.

The implementation commit changes exactly the three authorized paths:

```text
M packages/atlas-skills/src/index.ts
A packages/atlas-skills/src/stepwise-extraction-request.ts
A packages/atlas-skills/tests/stepwise-extraction-request.test.ts
```

The checkpoint commit adds only
`project's goal/feedback/SEM-CUTOVER-004-go-checkpoint.md`. The current
worktree has unrelated tracked and untracked changes, but none overlaps the
reviewed implementation, focused test, frozen ticket, or checkpoint paths.
An untracked duplicate ticket copy is not selected because the checkpoint
explicitly identifies the tracked frozen-ticket path. The committed review
target is therefore not ambiguous.

This review uses the frozen ticket, its five explicit Review Contract rows,
the approved predecessor boundaries actually consumed by the implementation,
and repository evidence. It does not review or authorize provider dispatch,
hydration, worker/job execution, persistence, admission, finalization,
publication, Master mutation, REL-01/02 contract changes, or
`SEM-CUTOVER-005`.

## Review Contract

| Row | Ticket authority / required proof | Evidence and status |
| --- | --- | --- |
| `RC-004-01` | Select exactly one approved successor profile; preserve all eight ordered stages; make profile/request identity deterministic; reject mutable same-profile identity, hidden legacy fallback, and unknown profiles. | `packages/atlas-skills/src/stepwise-extraction-request.ts:11-52,58-81` selects `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0`, retains the frozen v0.3.1 methodology, computes the immutable profile hash and deterministic request hash, and rejects methodology identity collisions. `packages/atlas-skills/tests/stepwise-extraction-request.test.ts:17-28` proves repeatable request equality, distinct profile identity, stages 1–8, the claimed fingerprint, and unknown-profile rejection. **PROVEN** |
| `RC-004-02` | Use trusted source slots plus an optional provisional extension, including an empty first run, without promoting proposals to accepted context. | The builder composes only the predecessor `StepwiseSourcePacket` fields at `stepwise-extraction-request.ts:58-81`; the focused test at `stepwise-extraction-request.test.ts:17-25` proves the empty `atlas.relationship-packet-extension/v1` first-run extension. The predecessor source-packet suite passes 8/8, including accepted-boundary and provisional-source negative cases. No accepted-context or materializer input exists in the owned module. **PROVEN** |
| `RC-004-03` | Parse one strict positive envelope; retain source-attributed relationship hypotheses; independently validate the semantic proposal; keep source-slot coordinates bounded; reject fenced raw input, uppercase kinds, foreign slots, illegal relationships, and provider IDs. | The existing strict envelope is parsed at `stepwise-extraction-request.ts:84-86`, semantic results are independently parsed by the existing semantic Zod schema, exact owned-slot coverage and relationship/candidate coordinate checks run at `:87-117`, and the focused negative cases are at `stepwise-extraction-request.test.ts:30-48`. The focused suite passes 5/5. **PROVEN** |
| `RC-004-04` | Preserve the frozen semantic meaning authority and provider-neutral contract; source content must remain evidence and cannot alter system policy. | `stepwise-extraction-request.test.ts:50-60` proves adversarial source text is retained in `sourceSpecification` but absent from the compiled system prompt. The unchanged legacy/stage regression suite passes 18/18, including frozen prompt and source-authority checks. **PROVEN** |
| `RC-004-05` | Compose one logical request with zero external provider calls, jobs, permits, or reservations. | `stepwise-extraction-request.test.ts:62-67` performs the ticket-bound source inspection and finds no provider, job, permit, reservation, persistence, or materializer seam. The owned module exposes only synchronous deterministic composition/parsing and has no transport or runtime dependency. **PROVEN** |

## Validation and evidence

| Command / check | Outcome |
| --- | --- |
| Reviewed implementation commit and ancestry | PASS; `1f4519ec292b2a5ef6fa326116d5f85d0887b7cf` exists and is the parent of checkpoint commit `39683e06037f78b6ea85b740bf6ea6d92b5991db`. |
| `git diff-tree --no-commit-id --name-status -r 1f4519ec292b2a5ef6fa326116d5f85d0887b7cf` | PASS; exactly the three authorized implementation/test paths. |
| `git diff-tree --no-commit-id --name-status -r 39683e06037f78b6ea85b740bf6ea6d92b5991db` | PASS; only the GO checkpoint artifact. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-extraction-request.test.ts` | PASS — 5/5. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS — 8/8. |
| `pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts` | PASS — 18/18. |
| `pnpm --filter @atlas/skills typecheck` | PASS. |
| Profile fingerprint evaluation | PASS; `stepwiseRelationshipEnvelopeProfileSha256` equals `869b5885e05b6db13b56caac815565100753abc087e7140de3fe3ab2b58a87d8`. |
| `git diff --check 1f4519ec292b2a5ef6fa326116d5f85d0887b7cf^ 1f4519ec292b2a5ef6fa326116d5f85d0887b7cf` | PASS; no whitespace diagnostics. |
| Protected dependency-path inspection | PASS; the implementation commit does not change `semantic-prompt.ts`, `relationship-extraction-envelope.ts`, or `stepwise-source-packet.ts`. |

No external provider request, semantic job, hydration, persistence, admission
reservation, finalization, publication, Docker action, database mutation, or
Master mutation was performed during this review.

## Frozen Finding Closure Matrix

No blocking findings. All five frozen ticket-derived Review Contract rows are
proven by the committed implementation, the required focused harnesses, and
the direct boundary inspection above. No clause is open for CFC.

## Scope-change observations

None. The checkpoint stays within the ticket-owned offline request/parser
boundary. Future provider execution, hydration, worker/finalizer integration,
REL persistence, and deployment work remain outside this CK result.

## Decision

`PASS`. The committed SEM-CUTOVER-004 work satisfies all five frozen
Review Contract rows and explicit validation obligations, with no direct
in-scope regression identified. This CK result does not authorize
`SEM-CUTOVER-005` or any downstream runtime/persistence work.

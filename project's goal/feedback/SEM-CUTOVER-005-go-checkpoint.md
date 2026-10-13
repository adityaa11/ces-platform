# GO checkpoint — SEM-CUTOVER-005

- **Ticket:** `SEM-CUTOVER-005` — Provisional semantic accounting and replay-safe handoff
- **Batch:** `SEM-CUTOVER`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-005-provisional-accounting-and-replay-handoff.md`
- **Implementation commit:** `c197e9ef2c620b39aad792fbb7fb21c1346af62e` (`feat(sem-cutover): add provisional sidecar accounting`)
- **Ticket/checkpoint state:** `awaiting_review`
- **Authority consumed:** explicit user `GO SEM-CUTOVER-005`; predecessor SEM-CUTOVER-004 independent CK `PASS` (`project's goal/feedback/SEM-CUTOVER-004-1f4519e-review.md`) and SEM-CUTOVER-002 approved sidecar ownership.

## Bounded implementation

`packages/atlas-skills/src/provisional-semantic-sidecar.ts` adds a pure
companion-accounting preparation boundary and an instrumented in-memory fake
repository. The sidecar contains every request source slot, distinguishes
finalized V1 sources from pending meaningful visuals and conditional context,
binds source/execution/bundle/document/profile/request/result identity, and
states that it carries no accepted-relationship authority, Master mutation,
reconciliation truth, or publishing effect.

The fake repository models only a fenced, idempotent winner and ack-loss replay
for offline qualification. It is not a PostgreSQL adapter, migration, worker,
or atomic durable composite implementation. Those remain explicitly with the
separately authorized persistence/REL-03 owner.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| `RC-005-01` | Independent canonical candidates remain reviewable while dependent meaning is non-authoritative. | `prepareProvisionalSemanticSidecar()` parses canonical V1 independently and emits only `acceptedRelationshipAuthority: null`; `tests/provisional-semantic-sidecar.test.ts` asserts the authority surface. | `PROVEN` |
| `RC-005-02` | Account for every source and pending visual without false completion or `non_fact` substitution. | The prepared sidecar has one accounting row per request slot. Canonical V1 must cover exactly ready owned slots; pending/contextual slots are rejected from its inventory and represented as `pending_unexamined_visual`/`conditional_context`. Focused test proves meaningful pending visual retention. | `PROVEN` |
| `RC-005-03` | Empty relationship set and zero visual input make independent progress without a verifier. | Focused zero-visual test builds and prepares the sidecar with no relationship revision and no verifier dependency. | `PROVEN` |
| `RC-005-04` | Scope and revision identity are replay-stable; reject source mismatch, foreign revision, duplicate, stale lease, and staged mismatch. | Scope validation binds source SHA and document to the request; exact relationship-extension revision matching rejects foreign/duplicate input. The instrumented fake test proves stable ack-loss replay winner, staged mismatch and stale-lease rejection, plus wrong-source-SHA rejection. | `PROVEN` |
| `RC-005-05` | Pending verification cannot mutate Master, relationship acceptance, reconciliation truth, or publishing. | The sidecar’s fixed authority object declares all four prohibited effects absent; no runtime, persistence, finalizer, provider, or publishing dependency is imported by the owned module. Focused test asserts the authority object. | `PROVEN` |

### Exact validation evidence

| Command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/skills exec jiti tests/provisional-semantic-sidecar.test.ts` | PASS — 3/3. |
| `pnpm --filter @atlas/skills typecheck` | PASS. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-extraction-request.test.ts` | PASS — 5/5. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS — 8/8. |
| `pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts` | PASS — 18/18. |
| `git diff --check -- packages/atlas-skills/src/index.ts packages/atlas-skills/src/provisional-semantic-sidecar.ts packages/atlas-skills/tests/provisional-semantic-sidecar.test.ts` | PASS. |

No external provider, semantic queue/job, admission reservation, database
mutation, Docker operation, Master mutation, publication, or REL-03 change was
performed. Pre-existing unrelated modified and untracked worktree paths were
not staged.

Internal readiness: READY_FOR_CK

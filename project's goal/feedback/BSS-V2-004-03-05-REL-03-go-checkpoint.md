# GO checkpoint: BSS-V2-004-03-05-REL-03 pure interface

- **Ticket:** `BSS-V2-004-03-05-REL-03` — amended pure-interface prerequisite
- **Batch:** `BSS-V2-004-03-05 relationship-lifecycle successor plan`
- **Authorization:** `HMN-BSS-V2-004-03-05-REL-03-008`
- **Frozen authority:** `project's goal/Backend_Phase/relationship-lifecycle-successor-plan/REL-03-pure-interface-handoff.md` and `project's goal/feedback/BSS-V2-004-03-05-REL-03-hmn-008.md`
- **Frozen ticket:** `project's goal/Backend_Phase/relationship-lifecycle-successor-plan/BSS-V2-004-03-05-REL-03-deterministic-finalizer-scope-closure.md`
- **Ticket state:** `awaiting_review`
- **Implementation commit:** `19343d7a3585bb1ba7ec54d24370a3c3fcec2421`
- **Candidate tree SHA:** `5758d78e5a244a31c9feaa98351b94cbe7831c42`
- **Base:** `393589b72ec015966bca1025c6e817fef35b46a6`
- **Checkpoint state:** `awaiting_review`

## Bounded change

`prepareDeferredDependentInterpretations(input)` is the sole operational REL-03 export added by this checkpoint. It consumes the already strictly parsed semantic proposal, trusted slots, exact scope, and immutable provisional revisions. It validates scope, source locator identity, revision immutability, ownership, tuple index, duplicate, and dependency conflicts; it deterministically returns complete essential-dependent draft descriptors, independent tuples, and optional-relationship tuples.

Each deferred descriptor retains the exact provider candidate object, relationship revision hash, owned/context locator identities, uncertainty, tuple identity, and `canonical_candidate_id: null`. The module imports neither finalizer, materializer, repository, worker, provider, persistence, nor acceptance authority. Its retained legacy integrated export is a fail-closed compatibility guard only; it cannot stage, finalize, materialize, or call any external boundary.

Changed implementation paths:

- `apps/agents-bridge/src/semantic-relationship-sidecar.ts`
- `apps/agents-bridge/tests/semantic-relationship-finalizer.test.ts`

## Review Contract Closure

| Row | Authority and required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| `RC-REL-03-PI-01` | HMN-008 authorized pure function: exact parsed proposal, trusted slots/scope, immutable revisions, deterministic descriptor IDs, and full dependent meaning/provenance. | Focused test `REL-03 preserves full essential dependent meaning and deterministically separates independent tuples`; `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-finalizer.test.ts` — 4/4 pass. | `PROVEN` |
| `RC-REL-03-PI-02` | HMN-008: distinguish essential dependent, independent, and optional tuples; no canonical candidate ID. | Focused essential and optional tests; descriptor assertion retains `canonical_candidate_id: null`. Same focused command — pass. | `PROVEN` |
| `RC-REL-03-PI-03` | HMN-008: reject malformed, foreign, duplicate, conflicting, unowned, out-of-range, mismatched tuple/revision/source references. | Focused negative matrix covers duplicate revision, tuple conflict, foreign scope/proposal result, mismatched locator, unowned and out-of-range tuple. Same focused command — pass. | `PROVEN` |
| `RC-REL-03-PI-04` | HMN-008 pure boundary: no canonical finalizer, REL-01 materializer, repository, worker/provider, SQL/persistence/replay, acceptance issuer, Master/publishing/review; direct regressions remain green. | Static bounded diff/import inspection; focused pure-boundary assertion; `pnpm --filter @atlas/agents-bridge typecheck` — pass; `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` — 8/8 pass; `git diff --check -- apps/agents-bridge/src/semantic-relationship-sidecar.ts apps/agents-bridge/tests/semantic-relationship-finalizer.test.ts` — pass. | `PROVEN` |

Internal readiness: `READY_FOR_CK`.

## Scope locks and handoff

No finalizer, worker, provider, repository, SQL, schema, Semantic V1 enum, SEM-CUTOVER-005, SEM-CUTOVER-006, SEM-CUTOVER-007, Master, publishing, or human-verification implementation changed. The preserved candidate remains reference-only.

Request independent `CK BSS-V2-004-03-05-REL-03` limited to this pure interface and direct regressions. A CK PASS permits preparation of the separately authorized SEM-CUTOVER-005 companion-contract amendment; it does not resume SEM-CUTOVER-006.

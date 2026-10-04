# CK review: SEMIR-003 / SEMIR-BATCH-03

- **Result:** `CHANGES_REQUIRED`
- **Review type:** First review
- **Ticket:** `SEMIR-003`
- **Batch:** `SEMIR-BATCH-03`
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/IR_Test_Phase/SEMIR-003-deterministic-oracle-and-mutations.md` at `2395d99a82884799b0ba9611ae6b490516728b39`; state `awaiting_review`.
- **GO checkpoint:** `project's goal/feedback/SEMIR-BATCH-03-go-checkpoint.md`
- **Reviewed implementation commit:** `2395d99a82884799b0ba9611ae6b490516728b39` (`feat(semir): add deterministic semantic oracle`). The implementation, ticket, and GO checkpoint were committed together; `HEAD` identifies the reviewed target.
- **Provider calls:** `0`

## Review contract and evidence

Reviewed all six acceptance rows, frozen scope, and mandatory bindings `SR-003-RB-01` through `SR-003-RB-03` against the committed implementation. The oracle validates proposal structure before comparing source disposition, discourse, proposition count, predicate, arguments, qualifiers, unresolved aspects, and evidence. Evidence checks enforce the current source slot and quote containment. The separate accounting evaluator detects missing, duplicate, and unknown source results. The mutation manifest contains stable IDs for all §36 mutation classes and the checker asserts failure on each declared dimension. Fixtures load the frozen corpus directly from commit `8e865a9`; they do not consume the modified working-copy corpus.

Validation performed:

```text
node scripts/semantic-ir-v0/check-semir-003-oracle.mjs
PASS: 43 frozen known-good fixtures passed; 19 semantic mutations and 3 accounting mutations failed on named dimensions; zero provider calls.

node scripts/semantic-ir-v0/check-semir-002-schema.mjs
PASS: 43 frozen cases parsed; structural negatives and schema descriptions verified; zero provider calls.

git diff --check HEAD^ HEAD
PASS (exit 0; no whitespace errors)
```

`git status` showed unrelated working-copy changes. The only changed file under `scripts/semantic-ir-v0/` is `semir-001-corpus.mjs`; SEMIR-003's fixtures load the frozen `8e865a9` copy through `git show`, so those edits do not alter the review target or its qualification result. No provider route, production coupling, persistence, or semantic repair was introduced by this commit.

## Findings

### CK-001 — Required per-case diagnostic output is not exposed by the qualification command

`RC-SEMIR-003-05` is authorized by SEMIR-003 Acceptance row 05 and context §37: per-case output must list passing/failing dimensions and expected/observed values without leaking non-fixture source or secrets. `evaluateSemanticResult` constructs a structured per-case report, but `check-semir-003-oracle.mjs` only asserts those reports in memory and prints one aggregate PASS line. The executed command therefore provides no per-case output from which a reviewer can inspect the named passing/failing dimensions or expected/observed values. The implementation's returned object is useful internal evidence, but it is not surfaced by the committed qualification command.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Observable correction | Binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- | --- |
| `CK-001.a` | SEMIR-003 Acceptance row 05 (`RC-SEMIR-003-05`); implementation context §37 | `scripts/semantic-ir-v0/check-semir-003-oracle.mjs:27` prints only aggregate counts; its known-good and mutation reports are not emitted. The executed command output contains no per-case dimensions or expected/observed values. | Have the qualification command emit safe per-case diagnostics for known-good cases and semantic/accounting mutations, including case or mutation ID, each applicable dimension/status, and expected/observed values. Keep fixture data bounded to the authorized non-confidential corpus and do not include non-fixture source or secrets. | **PASS iff** `node scripts/semantic-ir-v0/check-semir-003-oracle.mjs` exits 0 and its captured output contains per-case passing dimensions and expected/observed values for known-good fixtures, and named failing dimensions and expected/observed values for required mutations, with no non-fixture source or secret material. Evidence: the checker output and assertions in `scripts/semantic-ir-v0/check-semir-003-oracle.mjs`; the oracle must continue to report all 43 known-good fixtures and reject all 19 semantic plus 3 accounting mutations. | Check only the ticket-required per-case diagnostic output and its fixture-safety boundary, while preserving the existing frozen-fixture, dimension, mutation, accounting, schema-regression, and whitespace results. No provider or production integration is in scope. |

## Scope-change observations

None identified. No product, architecture, provider, deployment, or predecessor decision is needed to close this finding.

## Decision

The deterministic oracle, frozen fixtures, and required mutation classes pass their focused checks. The qualification command does not expose the per-case diagnostic output required by Acceptance row 05 and §37. `SEMIR-003` remains `awaiting_review`; result is `CHANGES_REQUIRED`. The frozen closure target is only `CK-001.a` above.

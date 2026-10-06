# CK review: SEMIR-004 / SEMIR-BATCH-04

- **Result:** `CHANGES_REQUIRED`
- **Review type:** First review
- **Ticket / batch:** `SEMIR-004` / `SEMIR-BATCH-04`
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/IR_Test_Phase/SEMIR-004-normalized-document-qualification-harness.md` at `60b5f89eb0895ad2570de0ffee3cd5507e712fc0`; state `awaiting_review`.
- **GO checkpoint:** `project's goal/feedback/SEMIR-BATCH-04-go-checkpoint.md`, committed with the ticket and harness at the reviewed revision.
- **Reviewed implementation commit:** `60b5f89eb0895ad2570de0ffee3cd5507e712fc0` (`feat(semir): add normalized document qualification harness`). The SEMIR ticket, checkpoint, and harness paths are clean in the worktree; unrelated changes do not alter this target.
- **Provider calls:** `0`.

## Review contract and evidence

| Row | Status | Evidence and boundary |
| --- | --- | --- |
| `RC-SEMIR-004-01` | `PROVEN` | `createNormalizedFixture` passes the deterministic fixture through the existing `parseNormalizedDocument` v1 contract and derives slots from the parsed blocks. The shared parser and normalizer contracts were not changed. |
| `RC-SEMIR-004-02` | `PROVEN` | The run prints 43 case-to-parsed-block slot/locator mappings; each mapping asserts equality to its authorized frozen corpus source text. |
| `RC-SEMIR-004-03` | `IMPLEMENTED_UNPROVEN` for the required report | The harness asserts that mapped known-good evidence passes and all 19 mutations fail on their named dimensions. Its emitted report does not identify the evidence mutation outcomes against parsed slots. See `CK-001.b`. |
| `RC-SEMIR-004-04` | `IMPLEMENTED_UNPROVEN` for the required report | The harness asserts complete parsed-slot accounting and rejects missing, duplicate, and unknown results. Its emitted report gives only a count of three rejected accounting mutations, without the complete-accounting result or the named negative outcomes. See `CK-001.b`. |
| `RC-SEMIR-004-05` | `IMPLEMENTED_UNPROVEN` | The committed command passes the 43 known-good and 22 mutation assertions, but checks only `sourceSlot` and `sourceDisposition` schema descriptions. It does not prove the required modality, unresolved-aspect, and evidence descriptions within the single qualification command. Separate SEMIR-002 validation passed. See `CK-001.a`. Affected contract tests and the committed-diff whitespace check passed. |
| `RC-SEMIR-004-06` | `PROVEN` | The commit changes only the SEMIR ticket/checkpoint, harness, and README. The harness makes no provider request, uses only frozen non-confidential corpus text, and emits identifiers, digest, and counts rather than source text or credentials. No perception route, worker, persistence, production path, or normalizer contract changed. |

Mandatory bindings `SR-004-RB-01` and `SR-004-RB-02` are satisfied by parser/mapping and commit inspection. `SR-004-RB-03` remains open only for the complete single-command schema and evidence-safe outcome report below. The shared `parseNormalizedDocument` v1 contract is a real Atlas boundary used by production; the ticket's PASS row says to parse through that path. This review does not add a requirement to call a perception provider or production worker.

Validation performed:

```text
node scripts/semantic-ir-v0/check-semir-001-corpus.mjs
PASS: 43 frozen human-authored cases; zero provider calls.

node scripts/semantic-ir-v0/check-semir-002-schema.mjs
PASS: 43 cases, structural negatives, and generated-schema descriptions; zero provider calls.

node scripts/semantic-ir-v0/check-semir-003-oracle.mjs
PASS: 43 known-good cases and named diagnostics for 19 semantic and 3 accounting mutations; zero provider calls.

pnpm --filter @atlas/contracts exec jiti ../../scripts/semantic-ir-v0/check-semir-004-harness.mts
PASS: 43 mapped parsed units, 19 semantic and 3 accounting rejections, and two checked schema descriptions; zero provider calls. Output contains a 43-slot manifest and aggregate counts, but no named mapped-slot mutation or complete-accounting results.

pnpm --filter @atlas/contracts test
PASS: 11 contract tests.

git diff --check HEAD^ HEAD
PASS: reviewed commit has no whitespace errors.

git diff --check
PASS: exit 0; unrelated working-copy line-ending warnings only.
```

## Findings

### CK-001 — The single real-document qualification command does not record the complete required gate

SEMIR-004's Validation and reporting section requires one reproducible command for the complete offline qualification suite, including schema-generation evidence, and an evidence-safe report recording evidence/accounting results and the oracle/mutation summary. Acceptance rows `RC-SEMIR-004-03` through `RC-SEMIR-004-05` and mandatory binding `SR-004-RB-03` require those observations against the parsed source units. The submitted command executes the semantic and accounting assertions, but its schema-description assertions cover only two top-level fields and its output reduces the parsed-slot evidence and accounting mutations to counts. Running the SEMIR-002 and SEMIR-003 commands separately supplies useful predecessor regression evidence; their output uses the predecessor slots and does not fill the real-document command's report obligation.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Observable correction | Binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- | --- |
| `CK-001.a` | SEMIR-004 `RC-SEMIR-004-05`; Validation and reporting (one complete offline command including schema-generation evidence); incorporated SEMIR-002 `RC-SEMIR-002-05` description categories | `scripts/semantic-ir-v0/check-semir-004-harness.mts:35-37` checks only `sourceSlot` and `sourceDisposition`; its report at lines 42-48 lists only those two. The one-command run supplies no modality, unresolved-aspect, or evidence-description proof. | Make the reproducible SEMIR-004 command assert and report retention of the required generated-schema description categories: disposition/source slot, modality, unresolved aspect, and evidence constraints. It may invoke the already accepted schema checker or make equivalent assertions without changing the schema contract. | **PASS iff** the documented `pnpm --filter @atlas/contracts exec jiti ../../scripts/semantic-ir-v0/check-semir-004-harness.mts` exits 0 and its output or executed assertions prove the generated provider schema retains descriptions for all four required categories, with an evidence locator in the command/source. Preserve its 43-good/19-semantic/3-accounting results. | Check the qualification command and schema-description evidence; no new provider, production, schema semantics, or predecessor ticket change is required. |
| `CK-001.b` | SEMIR-004 Validation and reporting (record evidence/accounting results and oracle/mutation summary in an evidence-safe report); `RC-SEMIR-004-03`, `RC-SEMIR-004-04`; `SR-004-RB-03` | `scripts/semantic-ir-v0/check-semir-004-harness.mts:18-32` asserts named outcomes in memory, but lines 40-49 emit only totals. The output does not show complete parsed-slot accounting or the named quote-not-present, wrong/foreign-slot, missing, duplicate, and unknown outcomes against the remapped slots. | Emit a safe report from the real-document command that records complete parsed-slot accounting and named evidence/accounting mutation ID, expected failing dimension, and observed fail status, alongside the existing aggregate semantic summary. Do not print fixture text or secrets. | **PASS iff** the documented SEMIR-004 command exits 0 and its report identifies a passing complete-accounting result plus failures on their named dimensions for `MUT-EVIDENCE-QUOTE-NOT-PRESENT`, `MUT-EVIDENCE-WRONG-SLOT`, `MUT-EVIDENCE-FOREIGN-CASE`, `MUT-ACCOUNTING-MISSING`, `MUT-ACCOUNTING-DUPLICATE`, and `MUT-ACCOUNTING-UNKNOWN` after mapping to parsed slots; it retains the 43-good/19-semantic/3-accounting summary and contains only authorized fixture-safe data. Evidence: command output and `check-semir-004-harness.mts` assertions. | Check only reporting and the already required evidence/accounting outcomes against parsed fixture slots, plus direct changes to this command; do not demand extra scenarios or provider execution. |

## Scope-change observations

None. Both clauses are reporting/proof repairs within the frozen SEMIR-004 ticket. The v1 parser path satisfies the ticket's stated parser boundary; requiring a different perception provider or production route would need separate authority.

## Decision

The parsed-slot harness and offline checks pass, but the single command and emitted report do not yet prove the ticket's full validation/reporting obligation. `SEMIR-004` remains `awaiting_review`; result is `CHANGES_REQUIRED`. The frozen closure target is `CK-001.a` and `CK-001.b` only.

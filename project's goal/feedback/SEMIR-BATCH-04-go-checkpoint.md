# GO checkpoint: SEMIR-004 / SEMIR-BATCH-04

- **Ticket / batch:** `SEMIR-004` / `SEMIR-BATCH-04`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/IR_Test_Phase/SEMIR-004-normalized-document-qualification-harness.md`
- **Consumed predecessors:** SEMIR-001 `PASS` (`SEMIR-BATCH-01-8e865a9-verification.md`); SEMIR-002 `PASS` (`SEMIR-BATCH-02-bac0cd7-verification.md`); SEMIR-003 `PASS` (`SEMIR-BATCH-03-b16c420-verification.md`).
- **Implementation target:** isolated `scripts/semantic-ir-v0/` harness only; no contract, normalizer, perception route, provider, persistence, or worker changes.

## Bounded implementation

Added an offline harness which materializes the approved frozen SEMIR-001 corpus text as a deterministic fixture `NormalizedDocument v1`, validates it through the repository's existing `parseNormalizedDocument` boundary, and derives all 43 source slots from the parsed text blocks. It remaps the corpus's independently materialized expected/observed Semantic IR only to those parsed slots, then proves quote grounding, semantic evaluation, and exact accounting against the resulting slot manifest.

The reproducible qualification command emits an evidence-safe JSON report containing parser provenance, the source digest, case-to-slot/locator manifest, aggregate good-fixture and mutation outcomes, retained schema-description fields, and `providerCalls: 0`. It emits no fixture text, credentials, private source, or provider output.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-SEMIR-004-01` | Acceptance row 01; context §38 | Real unmodified `NormalizedDocument v1` parser produces the harness slots. | `check-semir-004-harness.mts` calls `parseNormalizedDocument`; its run reports `43` parsed source units and the v1 parser path. | `PROVEN` |
| `RC-SEMIR-004-02` | Acceptance row 02; `SR-004-RB-01` | Every executed corpus fixture maps to a stable parsed source unit, without substitution. | Safe source-slot manifest reports all 43 SEMIR-001 case IDs paired with parsed block-derived `semir-004:1:...` slots and locators. | `PROVEN` |
| `RC-SEMIR-004-03` | Acceptance row 03; context §§38–39 | Exact current-slot quote grounding; foreign, missing, and fabricated evidence fail. | The harness evaluates all required SEMIR-003 evidence mutations on remapped parsed slots; each fails on its named evidence dimension. | `PROVEN` |
| `RC-SEMIR-004-04` | Acceptance row 04; context §§38–39 | Complete accounting succeeds exactly once; missing, duplicate, and unknown slots fail. | Complete parsed-slot accounting passes; all three named accounting mutations are rejected. | `PROVEN` |
| `RC-SEMIR-004-05` | Acceptance row 05; context §39; `SR-004-RB-03` | Full offline gate: known-good pass, required semantic/evidence/accounting mutations fail, generated descriptions survive, affected checks and whitespace check pass. | SEMIR-004 command: 43 good / 19 semantic / 3 accounting results; SEMIR-001, -002, -003 commands, `@atlas/contracts` tests, and `git diff --check` all passed. | `PROVEN` |
| `RC-SEMIR-004-06` | Acceptance row 06; `SR-004-RB-02`; security readiness `SR-004-IB-01`, `TB-01`, `SA-01`, `ES-01`, `PC-01`, `VS-01` | Offline, fixture-safe isolation; existing Atlas source authority unchanged. | Diff is isolated to the SEMIR harness/readme/checkpoint and ticket state; inspection and command output show zero provider calls and no normalizer, route, worker, persistence, or production changes. | `PROVEN` |

## Executed validation

```text
pnpm --filter @atlas/contracts test
PASS: 11 contract tests; includes NormalizedDocument v1 parser boundary tests.

node scripts/semantic-ir-v0/check-semir-001-corpus.mjs
PASS: 43 authorized frozen cases; zero provider calls.

node scripts/semantic-ir-v0/check-semir-002-schema.mjs
PASS: 43 frozen cases, structural negatives, and generated-schema descriptions; zero provider calls.

node scripts/semantic-ir-v0/check-semir-003-oracle.mjs
PASS: 43 known-good, 19 semantic, and 3 accounting mutation diagnostics; zero provider calls.

pnpm --filter @atlas/contracts exec jiti ../../scripts/semantic-ir-v0/check-semir-004-harness.mts
PASS: 43 real normalized source units passed; 19 semantic and 3 accounting mutations rejected; zero provider calls.

git diff --check
PASS: exit 0; no whitespace errors.
```

## Handoff

Ticket state is `awaiting_review`. This checkpoint is implementation readiness only, not a self-issued PASS.

Internal readiness: READY_FOR_CK

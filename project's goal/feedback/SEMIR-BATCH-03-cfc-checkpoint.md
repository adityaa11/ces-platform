# CFC checkpoint: SEMIR-003 / SEMIR-BATCH-03

- **State:** `awaiting_review`
- **Ticket / batch:** `SEMIR-003` / `SEMIR-BATCH-03`
- **Remediation base:** `2395d99a82884799b0ba9611ae6b490516728b39`
- **Frozen CK authority:** [SEMIR-BATCH-03-2395d99-review.md](SEMIR-BATCH-03-2395d99-review.md)
- **Provider calls:** `0`

## Bounded remediation

Remediated only frozen clause `CK-001.a`. The offline SEMIR-003 qualification command now emits one structured `SEMIR-003 diagnostic` record for every known-good fixture and required semantic or accounting mutation. Each record contains its case or mutation ID, every applicable dimension and status, and explicit `expected` and `observed` values. Diagnostics are constructed only from the frozen, authorized non-confidential fixture corpus (including evaluator-reported fixture evidence snippets); the command does not access non-fixture source or expose secrets. No oracle behavior, fixture corpus, provider route, production import, persistence, semantic repair, or production coupling changed.

## Frozen Finding Closure Matrix

| Clause | Status | Exact evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `scripts/semantic-ir-v0/check-semir-003-oracle.mjs`: `diagnostic`, `assertDiagnostic`, and `emitDiagnostic` serialize and validate the case/mutation ID, dimension, status, expected, and observed fields for every known-good, semantic-mutation, and accounting-mutation report. | `node scripts/semantic-ir-v0/check-semir-003-oracle.mjs` — PASS; captured output contains 43 `known-good`, 19 `semantic-mutation`, and 3 `accounting-mutation` diagnostic records, each with the required fields. The summary confirms all 43 known-good fixtures passed and all 19 semantic plus 3 accounting mutations failed on named dimensions. | PASS: qualification exits 0 and its captured output exposes per-case passing and named failing dimensions with expected/observed values, using only authorized fixture-derived values. |

## Direct regressions checked

```text
node scripts/semantic-ir-v0/check-semir-003-oracle.mjs
PASS: 43 frozen known-good fixtures emitted diagnostics and passed; 19 semantic
mutations and 3 accounting mutations emitted diagnostics and failed on named
dimensions; zero provider calls.

node scripts/semantic-ir-v0/check-semir-002-schema.mjs
PASS: 43 frozen cases parsed; structural negatives and schema descriptions
verified; zero provider calls.

git diff --check
PASS (exit 0; no whitespace errors)
```

The remediation leaves frozen-fixture materialization, dimension comparisons,
mutation/accounting assertions, schema regression coverage, and the offline
boundary intact.

Internal readiness: READY_FOR_CK

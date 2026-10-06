# CK verification: SEMIR-004 / SEMIR-BATCH-04

- **Result:** `PASS`
- **Review type:** Post-CFC verification
- **Ticket / batch:** `SEMIR-004` / `SEMIR-BATCH-04`
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/IR_Test_Phase/SEMIR-004-normalized-document-qualification-harness.md`; state `awaiting_review`.
- **Original CK artifact:** `project's goal/feedback/SEMIR-BATCH-04-60b5f89-review.md`
- **CFC checkpoint:** `project's goal/feedback/SEMIR-BATCH-04-cfc-checkpoint.md`
- **Reviewed remediation commit:** `fc68ebec4a1c7934c6017e4ae2819a590e2a64a8` (`fix(semir): complete qualification report`), based on `60b5f89eb0895ad2570de0ffee3cd5507e712fc0`.
- **Provider calls:** `0`.

## Frozen clause verification

| Original clause | Outcome | Frozen closure oracle evidence |
| --- | --- | --- |
| `CK-001.a` | `RESOLVED` | The documented SEMIR-004 command exits 0. Its assertions and emitted `schemaDescriptions` report include source-slot/disposition, modality, unresolved-aspect, and evidence-constraint descriptions. The report provides the description strings checked against the generated provider schema. |
| `CK-001.b` | `RESOLVED` | The same command reports `accounting.complete: true` across 43 parsed slots and named outcomes with expected dimension and `FAIL` status for all 19 semantic/evidence mutations and all three accounting mutations. It includes the required quote-not-present, wrong-slot, foreign-case, missing, duplicate, and unknown cases. The output contains fixture identifiers, locators, a source digest, counts, and statuses; it emits no source text or credentials. |

The original closure oracles are unchanged. No additional acceptance condition was added.

## Evidence and direct-regression check

Executed:

```text
pnpm --filter @atlas/contracts exec jiti ../../scripts/semantic-ir-v0/check-semir-004-harness.mts
PASS: 43 parsed source units; 19 semantic/evidence and 3 accounting mutations rejected; all five required generated-schema descriptions retained; zero provider calls.

pnpm --filter @atlas/contracts test
PASS: 11 contract tests.

git diff --check 60b5f89eb0895ad2570de0ffee3cd5507e712fc0 HEAD -- scripts/semantic-ir-v0/check-semir-004-harness.mts "project's goal/feedback/SEMIR-BATCH-04-cfc-checkpoint.md"
PASS (exit 0; no whitespace errors).
```

The remediation diff changes only `check-semir-004-harness.mts` and adds the CFC checkpoint. The harness preserves the real `parseNormalizedDocument` v1 path, all 43 parsed-slot mappings, the 19 semantic/evidence mutations, and the three accounting mutations. The directly affected contract tests pass. No direct remediation regression was found.

## Decision

`CK-001.a` and `CK-001.b` are both resolved against their frozen closure oracles. No direct regression remains. SEMIR-004 review result: `PASS`.

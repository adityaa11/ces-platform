# IDSER-012-02-01: Deterministic semantic owned/context batching and resource envelopes

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-12-02-01`
- **Dependencies:** IDSER-012-01-02 CK `PASS`; BSS-V2-004-03-01/02/03/05 CK `PASS`; BSS-V2-005-04 and BSS-V2-006-04 CK `PASS`
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.5-21.7

## Outcome

From one accepted/perceived `NormalizedDocument v1`, expose deterministic source-unit enumeration below the current whole-document packet seam and create a complete ordered batch plan. Every eligible source unit has exactly one owning batch; batches may include separately identified bounded authorized reference context. Build the exact request and RequestResourceEnvelope per batch without provider work.

## Required batch model

```text
owned source_slots
  -> exactly one owning batch
  -> only these may produce source_results/candidates/evidence

reference_context
  -> bounded deterministic authorized context
  -> may repeat
  -> never owns candidate/evidence output in this batch
```

Reference context counts toward structural/token/resource bounds. Preserve approved single-packet behavior as a regression oracle. The initial context algorithm is deterministic/profile-versioned; do not claim arbitrary-document semantic equivalence.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120201-01 | Source-unit enumeration is deterministic below packet construction and preserves approved single-packet output for fitting documents. | PASS iff repeat order is stable and current BSS-V2-004-03-03 fixtures remain equivalent. |
| RC-0120201-02 | Every eligible source unit is owned exactly once; context-only units are separate and may repeat only within profile bounds. | PASS iff missing/duplicate ownership fails closed, context cannot own output, foreign/dangling context is rejected. |
| RC-0120201-03 | Same document/profile versions produce same batch IDs, owned/context maps and plan hash. | PASS iff independent of provider/runtime state. |
| RC-0120201-04 | Every batch stays within structural/context/request bounds and payload distinguishes `source_slots` from `reference_context`. | PASS iff an individually unfit owned unit fails closed and no overflow/truncation occurs. |
| RC-0120201-05 | Each batch gets a valid multi-resource RequestResourceEnvelope from exact request + versioned estimator/accounting/output/safety policy. | PASS iff resource vectors stay within planning ceiling and weighted billing never substitutes for TPM. |
| RC-0120201-06 | No provider work/result/candidate materialization occurs. | PASS iff this ticket is deterministic preparation only. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** accepted normalized source -> bounded owned/context plan later admission may trust.
- **Sensitive assets:** normalized/source/prompt material never enters admission metadata/evidence.
- **Identity context:** document execution, normalized artifact, owned/context sets, compiler/schema/workload/estimator/accounting versions, batch IDs, plan hash.
- **Extension seams:** source enumeration, owned/context selection, structural bound, estimator, envelope, plan hash.
- **Prohibited couplings:** provider-specific lifecycle, context-as-output ownership, weighted-as-TPM, silent truncation, early effects.
- **Verification seams:** single-packet regression, exact ownership, context negatives, determinism, envelope ceilings.
- **Review bindings:** CK verifies source/context identity, backward compatibility, deterministic bounds/envelopes and zero provider effects.

## Workflow evidence

Close all rows with deterministic fixtures, including a cross-boundary pronoun/reference/shared-condition fixture reserved for later live qualification; `READY_FOR_CK`.

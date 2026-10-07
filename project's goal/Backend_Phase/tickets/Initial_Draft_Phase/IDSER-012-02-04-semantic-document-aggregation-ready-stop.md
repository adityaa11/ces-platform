# IDSER-012-02-04: Complete semantic document aggregation and semantic_ready stop

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-12-02-04`
- **Dependencies:** IDSER-012-02-03 CK `PASS`
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.5-21.7

## Outcome

When every required owned-source batch has one valid staged fragment, deterministically aggregate into one canonical `atlas.semantic.extract/v1` result, deliver through existing Atlas acceptance, materialize candidate/evidence/index once, mark `semantic_ready`, and stop before reconciliation.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120204-01 | Aggregation requires exact complete batch-plan/owned-source coverage. | PASS iff missing, duplicate, foreign, stale-plan or context-owned fragments fail closed and no partial acceptance occurs. |
| RC-0120204-02 | Batch-local identities/evidence combine deterministically without semantic repair/duplicate ownership. | PASS iff repeated aggregation is stable and context-only material never becomes accepted ownership. |
| RC-0120204-03 | Existing extraction acceptance materializes candidates/evidence/index exactly once from one complete document result. | PASS iff replay/ack-loss cannot duplicate and scope checks remain intact. |
| RC-0120204-04 | Success terminates at durable `semantic_ready`; zero reconciliation execution/job. | PASS iff Core/DB/read projections accept processing state and staged extraction no longer auto-enqueues reconciliation. |
| RC-0120204-05 | Multi-document/multi-bundle composition preserves independent perception/extraction and shared provider fairness. | PASS iff later docs progress without prior reconciliation and all provider capacity/fairness remains BSS-V2-006-owned. |

## Hard stop

Stop before reconciliation selection/keyed writer/relationship direction, Ready-for-Review changes, CES/chat.

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundaries:** exact fragment aggregation -> one canonical semantic result -> existing Atlas acceptance.
- **Identity context:** project/bundle/document execution, plan hash, owned batches/fragments/fences, canonical result, acceptance replay key.
- **Prohibited couplings:** partial/stale/foreign acceptance, semantic repair, context ownership leakage, cross-scope mutation, auto-reconciliation.
- **Verification seams:** coverage negatives, determinism, replay/scope, semantic_ready, zero-reconciliation.
- **Review bindings:** CK verifies exact owned-source coverage, source-grounded deterministic aggregation, once-only acceptance and hard stop.

## Workflow evidence

Close all rows with scoped candidate/evidence/index/state/queue evidence; `READY_FOR_CK`.

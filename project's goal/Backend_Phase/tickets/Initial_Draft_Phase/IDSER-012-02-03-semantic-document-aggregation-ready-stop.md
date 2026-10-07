# IDSER-012-02-03: Complete semantic document aggregation and semantic_ready stop

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-12-02-03`
- **Dependencies:** IDSER-012-02-02 CK `PASS`
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)

## Outcome

When every required semantic batch for one document has a valid staged fragment, deterministically aggregate those fragments into one canonical `atlas.semantic.extract/v1` result, deliver through the existing Atlas acceptance authority, materialize candidate/evidence/index once, mark the staged member `semantic_ready`, and stop before reconciliation.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120203-01 | Aggregation requires complete exact batch/source coverage for the frozen batch plan. | PASS iff missing, duplicate, foreign or stale-plan fragments fail closed and no partial document acceptance occurs. |
| RC-0120203-02 | Batch-local identities/evidence combine deterministically into one canonical Semantic V1 result without semantic repair. | PASS iff repeated aggregation is stable, all candidates/evidence remain source-grounded, and provider meaning is not rewritten to make validation pass. |
| RC-0120203-03 | Existing extraction acceptance materializes candidates/evidence/index exactly once from the one complete document result. | PASS iff replay/ack-loss cannot duplicate candidate/evidence/index effects and cross-document/bundle scope checks remain intact. |
| RC-0120203-04 | Successful staged extraction terminates at durable `semantic_ready`; zero reconciliation execution/job is emitted. | PASS iff `semantic_ready` is accepted by Core/DB/read projection as processing and current extraction acceptance no longer auto-enqueues reconciliation for staged bundles. |
| RC-0120203-05 | Multi-document/multi-bundle composition preserves independent perception and provider-admitted extraction. | PASS iff later documents can reach perceived/extracting/semantic_ready without waiting for prior reconciliation and provider fairness/capacity remains owned by BSS-V2-006. |

## Hard stop

Stop before reconciliation selection, keyed writer, relationship-direction redesign, bundle completion/Ready-for-Review changes, CES or chat integration.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-0120203-SEMANTIC-SCHEMA` retains canonical Semantic V1 validation; `BOUNDARY-0120203-ATLAS-ACCEPTANCE` keeps candidate/evidence/index materialization in Atlas; `BOUNDARY-0120203-RECON-STOP` keeps reconciliation separately gated.
- **Trust boundary:** `TRUST-0120203-FRAGMENT-AGGREGATION` transitions staged non-truth fragments into one schema-valid document result only after exact plan/source coverage; `TRUST-0120203-RESULT-ACCEPTANCE` transitions that result through existing scoped Atlas acceptance.
- **Sensitive assets:** `ASSET-0120203-CANDIDATE-EVIDENCE` covers source-grounded candidates, evidence locators, and indexes; `ASSET-0120203-STAGED-CONTENT` covers provider-derived fragments before acceptance.
- **Identity context:** `IDENTITY-0120203-DOCUMENT-RESULT` binds project/bundle/document/execution, batch-plan hash, every batch/fragment/fence, canonical result identity, delivery attempt, and acceptance replay key.
- **Extension seams:** `SEAM-0120203-COVERAGE-GATE`, `SEAM-0120203-DETERMINISTIC-AGGREGATOR`, `SEAM-0120203-ACCEPTANCE-FENCE`, and `SEAM-0120203-SEMANTIC-READY-STOP` preserve later review/reconciliation policy attachment.
- **Prohibited couplings:** `COUPLING-0120203-PARTIAL-ACCEPTANCE` forbids accepting incomplete/stale/foreign fragments; `COUPLING-0120203-SEMANTIC-REPAIR` forbids rewriting provider meaning; `COUPLING-0120203-CROSS-SCOPE` forbids document/bundle leakage; `COUPLING-0120203-AUTO-RECON` forbids staged extraction from emitting reconciliation.
- **Verification seams:** `VERIFY-0120203-COVERAGE-NEGATIVES`, `VERIFY-0120203-DETERMINISM`, `VERIFY-0120203-REPLAY-SCOPE`, and `VERIFY-0120203-NO-RECON` cover exact aggregation, stable output, once-only scoped acceptance, and queue/state hard-stop evidence.
- **Unresolved security policy:** `SEC-GAP-0120203-DOWNSTREAM` leaves reconciliation, human review, publication, CES/chat, privacy/retention, and relationship policy unresolved.
- **Review bindings:** `REV-READY-0120203-01` verifies coverage/identity and stale/foreign fragment rejection; `REV-READY-0120203-02` verifies deterministic source-grounded aggregation and no semantic repair; `REV-READY-0120203-03` verifies Atlas role/scope/replay authority plus durable `semantic_ready` and zero reconciliation work.

## Workflow evidence

Implementation must close every Review Contract row, record exact Compose commands/counts and scoped candidate/evidence/index/state/queue observations in a compact closure ledger, reach `READY_FOR_CK`, and only then move to `awaiting_review`. This ticket grants no GO by itself.

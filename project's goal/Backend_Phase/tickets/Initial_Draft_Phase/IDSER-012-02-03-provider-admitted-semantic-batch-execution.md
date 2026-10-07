# IDSER-012-02-03: Provider-admitted semantic batch execution and staged finalization

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-12-02-03`
- **Dependencies:** IDSER-012-02-02 CK `PASS`; BSS-V2-004-03-06 CK `PASS` with semantic qualification result `PASS`
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.2, 21.5-21.7

## Outcome

Register every batch as provider work, let BSS-V2-006 admit it, execute only admitted explicit attempts through the qualified provider-neutral route, validate outputs for owned slots using bounded reference context, and stage idempotent fragments without accepting a document result.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120203-01 | Every batch becomes one idempotent logical provider-work item with explicit attempts bound to document/batch/domain/stable-bundle fairness/envelope. | PASS iff retries/restart cannot duplicate logical batch work and source/secrets stay out of admission metadata. |
| RC-0120203-02 | No outbound attempt occurs without BSS-V2-006 reservation and one reservation authorizes at most one transport attempt. | PASS iff deferred work has zero transport and retry requires a new attempt/reservation. |
| RC-0120203-03 | Admitted batches use the exact 004-03-06-qualified owned/context profile and provider-neutral StructuredReasoningProvider route. | PASS iff no Anoman lifecycle branch and stale/unqualified profile cannot execute. |
| RC-0120203-04 | Provider output may account only for owned `source_slots`; `reference_context` cannot produce candidate/evidence ownership. | PASS iff foreign/context-only/duplicate/missing source_results fail before staging. |
| RC-0120203-05 | Batch staging is fenced/idempotent and Atlas document candidates/evidence remain unchanged until aggregation. | PASS iff duplicate/ack-loss yields one fragment per batch and no early trusted extraction state. |
| RC-0120203-06 | Terminal failures/unknown usage contain the document attempt and reconcile capacity under BSS-V2-006 rules. | PASS iff no false document completion/reconciliation and accounting is once-only/conservative. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundaries:** BSS-V2-006 reservation -> one transport; untrusted output -> owned-slot validation/finalizer -> staged non-truth fragment.
- **Sensitive assets:** credentials/source-context/raw response stay outside admission metadata/log evidence.
- **Identity context:** document plan, batch, logical work/attempt, quota/fairness, profile, reservation, route qualification, job, fragment fence.
- **Prohibited couplings:** bypass, hidden retry, provider lifecycle branch, context-output ownership, sensitive metadata, early Atlas truth.
- **Verification seams:** transport count, explicit retry, owned/context validation, replay fence, roles, unknown-usage terminal handling.
- **Review bindings:** CK verifies pretransport authority, qualified profile, source ownership, once-only staging/failure accounting.

## Workflow evidence

Close all rows with deterministic and bounded live-qualified composition evidence; `READY_FOR_CK`.

# BSS-V2-004-03-06: Live Anoman production extraction qualification

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.03-06`
- **Dependencies:** BSS-V2-004-03-01 through -05 CK `PASS`; BSS-V2-006-04 CK `PASS`; IDSER-012-02-01 and -02 CK `PASS`; approved BSS-V2-004-02 parser boundary; explicit `go`; local Anoman configuration and secret-safe evidence location
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§7-9.06, 12-14, 16; [provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21
- **Historical reference:** preserve the SEM-ANM-SPIKE-004 terminal `FAIL` and CK evidence unchanged.

## Outcome and bounded question

Determine whether the exact production batch-aware extraction request profile can produce semantically acceptable, correctly owned/accounted Semantic V1 output through pinned Anoman when every live call is admitted by BSS-V2-006. This remains the only live production-extraction qualification gate.

## Frozen execution path

```text
accepted/synthetic NormalizedDocument v1
 -> IDSER-012-02-01 owned/context batch plan
 -> exact prepared batch request + RequestResourceEnvelope
 -> IDSER-012-02-02 active semantic process/workload/DesiredAdmissionProfile
 -> BSS-V2-006 reservation/admission
 -> one explicit Anoman transport attempt
 -> proposal validation: output only for owned source_slots
 -> deterministic finalizer
 -> frozen semantic/source oracle
```

Pre-call GO freezes a minimal secret-safe run plan with at least one ordinary single-batch fixture and one boundary-sensitive multi-batch fixture exercising reference/condition context across a batch boundary. Exact calls/hashes/cost ceiling are frozen before credentials are read.

No correction call, hidden retry, prompt/profile mutation, fallback or weaker oracle. A semantic mismatch is terminal qualification `FAIL`. Capture only redacted identity/latency/normalized usage/rate-limit telemetry and bounded oracle evidence.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-0040306-01 | Live use starts only after all predecessor PASS, exact batch/process/profile hashes, local gates, evidence root and explicit GO. | PASS iff every gate closes before credentials/request transmission. |
| RC-BSSV2-0040306-02 | Every live call has BSS-V2-006 reservation and exactly one outbound attempt. | PASS iff frozen call count equals transport-attempt count, no hidden retry, every call maps to reservation/plan/attempt. |
| RC-BSSV2-0040306-03 | Exact owned/context profile traverses generic StructuredReasoningProvider, owned-source accounting and finalization. | PASS iff context-only units never create output ownership and no provider-specific generic worker branch/repair occurs. |
| RC-BSSV2-0040306-04 | Frozen fixtures include cross-batch reference/condition and ordinary single-batch cases. | PASS iff both execute exactly as planned; semantic failure is honestly recorded as qualification FAIL. |
| RC-BSSV2-0040306-05 | Evidence is secret/source/raw-response safe and historical SPIKE-004/BSS-V2-004-02 evidence remains unchanged. | PASS iff no sensitive leak and old history/stops are untouched. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundaries:** BSS-V2-006 reservation -> one live attempt; remote result -> owned-slot validation/finalization.
- **Sensitive assets:** Anoman key, source/context payload and raw response stay local/ignored.
- **Identity context:** domain, desired profile, workload/batch profile, reservation/attempt, route/model, source/batch hashes, oracle.
- **Prohibited couplings:** admission bypass, hidden retry, semantic repair, context-output ownership, fallback, provider-specific generic worker behavior.
- **Verification seams:** pre-call authorization, transport/reservation count, cross-batch oracle, redaction, history preservation.
- **Review bindings:** CK verifies authorized call path, single-attempt admission, semantic/source oracle and safe evidence.

## Validation, terminal result and handoff

Run deterministic local gates first. Record one result: `PASS`, `FAIL`, or `ENVIRONMENT_BLOCKED` only for declared environment gate. CK may PASS a correctly bounded experiment whose semantic result is FAIL; then IDSER-012-02-03 cannot begin. Even semantic PASS does not release production lifecycle; IDSER-012-02-03 owns integration.

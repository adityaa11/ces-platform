# SEMIR-003: Deterministic semantic oracle and mutation suite

- **State:** `awaiting_review`
- **Review batch:** `SEMIR-BATCH-03`
- **Implementation context:** [SEMIR context §§34–37](../../SEMIR-context.md)
- **Start gate:** SEMIR-001 and SEMIR-002 `PASS` and explicit `go`.

## Outcome

Implement the deterministic, dimension-specific oracle that proves valid Semantic IR fixtures preserve frozen meaning and semantically corrupted variants fail for the right reason. This ticket is the offline semantic guard; it must not repair extraction output or tune expectations around a provider.

## Frozen scope

Evaluate source disposition, discourse role, proposition presence/count, predicate/argument meaning and role, modality/nesting, polarity, condition, trigger, temporal relation, quantity/boundary, scope, state, unresolved aspect/known/missing/question, evidence, and exact source accounting as applicable per case. Surface-equivalent grammatical variations may pass only when all critical dimensions match.

Create required known-bad mutations for modality, polarity, applicability, unresolved meaning, discourse, evidence, and accounting. Diagnostics must identify dimensions, for example `modality.inner` or `unresolved.condition`, rather than returning only a generic case failure.

No provider calls, lexical classification shortcut, fixture-answer encoding, canonicalization, reconciliation, prompt design, production parser/route change, or automatic semantic repair is permitted.

## Acceptance and review contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-SEMIR-003-01` | Known-good corpus fixtures pass dimension evaluation. | Each frozen corpus case has an evidence-backed pass result on applicable dimensions. |
| `RC-SEMIR-003-02` | Semantic equivalence remains deliberately bounded. | Allowed surface variants pass only with preserved meaning; permission/possibility, obligation/recommendation, polarity, condition/trigger, threshold/unresolved, and discourse distinctions fail when changed. |
| `RC-SEMIR-003-03` | Required semantic mutations fail. | Every §36 modality, polarity, applicability, unresolved, and discourse mutation is rejected on its named dimension. |
| `RC-SEMIR-003-04` | Evidence and accounting are fail-closed. | Quote-not-present, wrong/foreign source slot, missing/duplicate/unknown result mutations fail deterministically. |
| `RC-SEMIR-003-05` | Output is reviewable. | Per-case output lists passing/failing dimensions and expected/observed reason without leaking non-fixture source or secrets. |
| `RC-SEMIR-003-06` | Oracle remains independent and offline. | Zero provider calls; no semantic repair or production coupling; affected tests and `git diff --check` pass. |

## Validation and handoff

Expose one reproducible offline qualification command that executes known-good and mutation suites. It must compare semantic dimensions, not exact JSON text. Store generated diagnostics only where safe; commit fixtures/tests and a compact summary. `SEMIR-004` may not start until all required known-good/mutation results pass and fail exactly as frozen.

## Security readiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-003-IB-01` | Oracle treats every Semantic IR input as untrusted until source/evidence/accounting checks pass. |
| `SR-003-ES-01` | Preserve separate seams for structural schema validation, evidence validation, semantic evaluation, and later cross-run comparison. |
| `SR-003-PC-01` | Do not use deterministic logic to repair or replace provider semantic choices, canonicalize terms, or write project truth. |
| `SR-003-VS-01` | Retain stable mutation IDs and dimension-specific failure evidence for all mandatory corruptions. |
| `SR-003-UP-01` | Live-provider safety and response retention remain later-ticket policy. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Evidence |
| --- | --- | --- | --- |
| `SR-003-RB-01` | `SR-003-IB-01`, `SR-003-PC-01` | Can an input pass only by preserving frozen meaning, rather than through deterministic repair? | Known-good/mutation tests and oracle implementation review. |
| `SR-003-RB-02` | `SR-003-ES-01` | Are structural, evidence, and semantic failures separately observable? | Dimension result examples and negative-suite output. |
| `SR-003-RB-03` | `SR-003-VS-01` | Do required mutations fail on their intended named dimensions? | Stable mutation manifest and test report. |

## Handoff

Set `awaiting_review` only after all good fixtures pass and every mandatory corruption fails. Any ambiguity in an expectation is a SEMIR-001 planning issue, not an oracle workaround.

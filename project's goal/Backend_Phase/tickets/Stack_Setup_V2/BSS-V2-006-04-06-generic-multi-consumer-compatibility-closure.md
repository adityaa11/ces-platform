# BSS-V2-006-04-06 — Generic multi-consumer compatibility closure

- **State:** `approved`
- **Review batch:** `BSS-V2-BATCH-06-04-06`
- **Parent:** [BSS-V2-006-04 split map](BSS-V2-006-04-integrated-provider-admission-runtime-checkpoint.md)
- **Dependencies:** `BSS-V2-006-04-01..05` CK `PASS` and parent family dependencies.

## Outcome

Close the family with external composition evidence: the background semantic-like and interactive-like fixtures, plus a reconciliation-like contract fixture, use the same generic contracts and single send lane without semantic/reconciliation implementation or schema specialization.

## Authorized scope

Add only fixture/adaptor composition and evidence needed to prove already-qualified public surfaces compose under contention. The reconciliation-like fixture is contract compatibility only: different registered background identity, opaque payload identity, envelope and outcome handler; no reconciliation algorithm, state, schema or queue. No child may introduce `semanticBatchId`, `NormalizedDocument`, `source_results`, reconciliation fields, a new provider transport, or a BSS-local consumer result interpreter.

## Review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00604-02` | Shared-domain background remains work-conserving/debt-free and cannot block fitting protected interactive work; a late lane cannot monopolize capacity borrowed while another lane was idle. |
| `RC-BSSV2-00604-06` | Local Docling and Atlas trusted state remain outside this authority; Bridge roles cannot mutate Atlas truth and no local perception route needs quota metadata. |
| `RC-BSSV2-00604-15` | Two genuinely independent process-kind fixtures with different opaque reference/hash, envelope and outcome handler use one server-authorized adapter/send port, the existing claimed transport and feedback ledger. Exact non-inert counters prove no direct/duplicate send after denial, replay, cancellation, stale payload, ack loss and explicit new-attempt retry. |
| `RC-BSSV2-00604-16` | A third reconciliation-like compatibility fixture with a different qualified process/workload/payload uses the unchanged interface, no semantic special case, alternate queue/limiter/transport/feedback path or schema amendment. Shared-domain contention and separate-domain isolation preserve fairness, once-only attempts and conservative usage. |

## Required deterministic scenario

Use one shared synthetic quota domain with protected interactive, request-heavy/token-heavy background lanes and multiple fairness keys, plus an isolated second domain. Run saturation, borrowing, late lane, interactive arrival, cancellation, replay, stale payload, ack loss, explicit new attempt and restart through actual public entrypoints. Compose prior approved plan/pressure/revision fixtures rather than requalifying their internals. Assert exact non-zero reservations/jobs/claims/sends/feedback/outcomes, zero direct sends, zero Atlas truth writes, role denial, and isolated-domain counts.

## Security Readiness

`SR-0406-T1`: three independently owned consumer contracts share BSS execution authority. `SR-0406-C1`: prohibit consumer-specific generic schema, alternate queue/transport and Atlas/Docling coupling. `SR-0406-R1`: CK verifies independent fixture implementations, role isolation and all terminal exact counters.

## Hard stop

After this ticket and all earlier siblings receive CK `PASS`, BSS-V2-006 provides the reusable generic runtime hard stop. This does not implement or approve a real semantic, chatbot or reconciliation consumer; those remain downstream, separately GO/CK-gated work.

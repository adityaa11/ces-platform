# Atlas Review Workflow Regression Benchmark

This benchmark replays recorded Atlas review artifacts against the shared
Review Contract. It checks that CK's target stays stable, HMN authorizes only
the exact unresolved target, CFC closes every authorized clause, and CK's final
decision follows the evidence. Historical artifacts remain unchanged.

## Case A: IDSER-005 final HMN-authorized remediation

Sources:

- `project's goal/feedback/IDSER-BATCH-05-17ce58d-verification.md`
- `project's goal/feedback/IDSER-005-hmn-009.md`
- `project's goal/feedback/IDSER-BATCH-05-2707518-verification.md`

Input state: only original clauses `CK-002.a` through `CK-002.e` are open;
`CK-001` is resolved. CK's verification names missing queued-job/thrown-error
redaction evidence and the bounded cancellation outcome.

Expected HMN behavior: authorize only those five clause IDs and reference the
CK artifact. HMN must not copy the closure criteria into a second checklist.

Expected CFC behavior: read the exact payload/error/cancellation gaps from the
CK artifact; use the existing production-path integration harness; record
exact command results and a proof locator for each clause; hand off only after
all five closure oracles pass.

Expected CK behavior: evaluate only the five frozen clauses and direct
regressions. The recorded result is `PASS` at `2707518` because every clause is
marked resolved, the evidence is mapped clause by clause, and no direct
regression is reported.

Benchmark result: **PASS**. This proves one recorded final HMN -> CFC -> CK
cycle converged. HMN-009 repeated some CK detail; the current rule removes that
duplication and makes the referenced CK artifact the sole closure source. This
does not prove an arbitrary implementation will pass.

## Case B: HMN adds a stronger checklist

Input state: CK reports one unresolved frozen clause with a defined closure
oracle. HMN proposes additional scenarios or assertions that are not in that
clause or the frozen ticket.

Expected HMN behavior: omit those additions from the authorization, or record
them as a scope/review-contract issue. Do not make them CFC readiness gates.

Expected CFC behavior: follow the frozen closure oracle. Diagnostic probes may
be included, but their absence cannot block readiness.

Expected CK behavior: do not require HMN-only additions to award `PASS`.

Benchmark result: **PASS** only if the extra conditions never become blocking
acceptance criteria.

## Case C: a frozen oracle remains false

Input state: CFC claims readiness, but one authorized clause's named assertion
or required validation fails or is missing.

Expected CFC behavior: remain `CFC_NOT_READY_FOR_CK`; record the exact failed
oracle and continue the same authorized cycle.

Expected CK behavior after an improperly handed-off checkpoint: return
`CHANGES_REQUIRED` for that same clause, naming expected state, actual state,
and evidence location. Do not add a new condition.

Benchmark result: **PASS** only if the workflow refuses a false readiness claim
and preserves the clause as the sole repair target.

## Case D: direct regression

Input state: all original clauses close, but the remediation directly breaks
ticket-required behavior in the authorized scope.

Expected CK behavior: return `CHANGES_REQUIRED` for the direct regression with
the affected ticket row and evidence. Existing closure proof is preserved.

Benchmark result: **PASS** only if direct regressions remain blockable.

## Applying the benchmark

When changing GO, CK, CFC, HMN, or the shared contract, review each case and
record whether the current rules produce the expected outcome. A benchmark
failure requires fixing the protocol before relying on it for another ticket.

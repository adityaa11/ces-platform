# IDSER-012-05-03-02 — one-time procedural exception 001

- **Artifact identity:** `IDSER-012-05-03-02-procedural-exception-001`
- **Ticket:** `IDSER-012-05-03-02`
- **Batch:** `IDSER-BATCH-12-05-03-02`
- **Operator decision:** `AUTHORIZE_TICKET_SPECIFIC_PROCEDURAL_EXCEPTION`
- **Decision date:** `2026-10-21` (Asia/Bangkok)
- **Decision authority:** explicit operator decision in the current task
- **Amendment:** [IDSER-012-05-03-02-historical-evidence-amendment-001.md](IDSER-012-05-03-02-historical-evidence-amendment-001.md)
- **Planning validation:** [IDSER-012-05-03-02-historical-evidence-amendment-001-planning-validation.md](IDSER-012-05-03-02-historical-evidence-amendment-001-planning-validation.md)
- **Original CK:** [IDSER-BATCH-12-05-03-02-aaf142a-review.md](IDSER-BATCH-12-05-03-02-aaf142a-review.md)
- **Current CFC progress:** [IDSER-012-05-03-02-cfc-progress.md](IDSER-012-05-03-02-cfc-progress.md)
- **Status:** `TICKET_SPECIFIC_EXCEPTION_APPROVED`

## Exception decision

For `IDSER-012-05-03-02` only, the operator explicitly excepts the existing authority-conflict eligibility prerequisite for recognizing the already approved and frozen historical-evidence amendment and its planning validation.

The exception is based on operator-approved acceptance of irrecoverable historical evidence loss. It is not an authority-conflict diagnosis, does not create one, and must not be generalized to another ticket or cleanup.

`RCK-002.a` is recognized as the effective acceptance criterion for only the superseded historical pre-delete evidence portion of `CK-002.a`:

- complete pre-delete inventory;
- exact deleted plan/handoff identities and hashes;
- complete dependency rows and pre-delete counts;
- proof of exclusive disposability/no legitimate outstanding work; and
- exact rollback and mismatch observations.

The original `CK-002.a` finding and its historical unresolved outcome remain preserved. Recognition of `RCK-002.a` does not claim that the missing historical evidence was produced, recovered, or reconstructed.

## Effective review mapping

| Historical authority | Effective ticket-specific criterion | Mapping status |
| --- | --- | --- |
| `CK-002.a` historical pre-delete evidence portion | `RCK-002.a` from amendment `001`, subject to its independent current-state verification and explicit residual-uncertainty acceptance | `EFFECTIVE_BY_OPERATOR_EXCEPTION` |
| `CK-002.a` current cleanup/canonical-integrity obligations outside that historical portion | Original `CK-002.a` authority and frozen oracle | `UNCHANGED_AND_BINDING` |
| `CK-001.a` and all other original clauses | Original CK closure matrix | `UNCHANGED_AND_BINDING` |

This is an append-only ticket-specific mapping. It is not standard replacement-contract eligibility, is not `PASS`, does not verify an implementation checkpoint, and does not alter the shared review protocol.

## Continuation authorization

The operator explicitly authorizes continuation of the existing incomplete first CFC cycle after this exception is recorded. This is a continuation of the current uncommitted remediation, not a second remediation cycle.

The continuation is limited to:

1. completing and verifying the existing `CK-001.a` correction;
2. preserving and referencing the effective `RCK-002.a` mapping for the historical-evidence portion of `CK-002.a`; and
3. producing one bounded committed checkpoint for independent CK review.

The continuation does not authorize the historical `CK-002.a` clause as an implementation target, does not reopen resolved obligations, and does not authorize cleanup, fixture recreation, PostgreSQL mutation, provider execution, queue/BSS/SEM/reconciliation activity, production work, or unrelated implementation changes.

If a workflow runner requires a formal HMN command record for `CONTINUE_CURRENT_CFC`, this operator decision is the explicit authorization source; the runner must not reinterpret the exception as a new CFC cycle or as standard authority-conflict replacement eligibility.

## Required final CK treatment

After the bounded CFC checkpoint is committed, independent CK must:

- verify the actual committed `CK-001.a` implementation and required tests;
- verify every still-applicable original acceptance obligation;
- independently verify the `RCK-002.a` current-state integrity criterion;
- confirm explicit residual historical uncertainty acceptance; and
- carry forward the original `CK-002.a` finding and historical limitation unchanged.

`PASS` is permitted only if every still-applicable original obligation and `RCK-002.a` are proven with no direct regression. Otherwise CK must report `CHANGES_REQUIRED`; no automatic retry or silent waiver is permitted.

## Scope and preservation

This exception does not modify the shared GO/CK/CFC/HMN skills, the regression benchmark, the ticket text, or any historical GO/CK/CFC artifact. It establishes no reusable exception mechanism and creates no lifecycle state.

No missing historical evidence is reconstructed or inferred. No database cleanup, fixture recreation, provider execution, or unrelated implementation change is authorized by this artifact.

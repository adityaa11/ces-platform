# Atlas Ticket Review Contract

## Purpose and authority

This is the one internal protocol for the Atlas `go`, `ck`, `cfc`, and `hmn`
skills. It gives those commands one deterministic interpretation of a frozen
ticket's scope, completion, and proof. It is not a user-facing command and
does not grant any command new authority.

```text
frozen current ticket
> explicit source references incorporated by that ticket
> approved dependency interfaces, invariants, and boundaries actually consumed
> repository evidence
> general engineering or specialist guidance
```

Only the first four sources can create a Review Contract row. General guidance
may help evaluate evidence, but MUST NOT create acceptance criteria. A
dependency exposes accepted interfaces and boundaries, never its deferred
backlog, future provider, runtime, deployment, or architecture work.

## 1. Resolve the active ticket

Before reasoning about implementation, review, remediation, or authorization,
resolve one active-ticket tuple:

```text
ticket_id
ticket_path
batch_id
ticket_state
authorized_checkpoint
review_target_commit, when applicable
active_hmn_authorization, when applicable
```

Use an explicitly named ticket first. Otherwise resolve the current ticket from
the relevant ticket-set README, batch state, checkpoint state, or workflow
record. Do not silently advance to another ticket, select a nearby changed
ticket, or infer completion from code. Explicit user authorization is the
highest workflow-selection signal. Stop and return control when this tuple is
genuinely ambiguous.

## 2. Derive the Review Contract

Normalize every ticket-authorized completion obligation into stable rows such as
`RC-001`, without inventing requirements. A row records:

```text
contract_row_id
authority_reference
requirement_type
required_behavior
required_harness
required_scenarios
required_observations
required_validation
forbidden_substitutes
dependency_boundary
status
finding_id, when applicable
```

Allowed sources are the ticket Outcome, inspected seams/edit scope, execution
contract, acceptance criteria, validation, mandatory review bindings,
explicitly incorporated references, explicitly consumed dependency interfaces
or invariants, and an existing CK finding only when it traces to one of them.
An active HMN authorization may select or narrow unresolved rows; it never
expands ticket authority.

Rows MUST distinguish behavior from proof. Use an applicable type such as
`IMPLEMENTATION`, `INVARIANT`, `INTEGRATION`, `VALIDATION`, `SECURITY`,
`NEGATIVE_CASE`, `REGRESSION`, `EVIDENCE`, or `BOUNDARY`.

The contract MUST NOT create a row from generic best practice, specialist advice
not incorporated by the ticket, reviewer preference, repository future plan,
desirable architecture, deployment assumption, inferred future ticket,
unrelated TODO, or deferred dependency work.

## 3. Closure and evidence semantics

Each row has exactly one applicable status:

```text
UNRESOLVED
IMPLEMENTED_UNPROVEN
PROVEN
BLOCKED_ENVIRONMENT
BLOCKED_AUTHORITY
NOT_APPLICABLE
```

`PROVEN` requires the ticket-authorized behavior and proof with the required
harness and observations. `IMPLEMENTED_UNPROVEN` means code appears present
but required proof is absent or insufficient. `BLOCKED_ENVIRONMENT` requires a
real inability to execute validation. `BLOCKED_AUTHORITY` means the frozen
ticket cannot choose the needed behavior. `NOT_APPLICABLE` needs a stated,
ticket-bound reason.

Harness, scenario, and observation specificity matter. If a ticket names an
actual route, Compose worker, PostgreSQL role, or mocked provider arrangement,
a unit test, injected double, isolated client test, or generic suite pass is
useful regression evidence but is not a substitute. If named scenarios or
observations include replay, provider-call count, lease generation, redaction,
or cleanup, evidence MUST show each named item. Reuse a `PROVEN` row unless the
authorized remediation directly invalidates it or creates a direct regression.

## 4. READY_FOR_CK and durable artifacts

`READY_FOR_CK` is an internal implementer/remediator readiness gate, never a
PASS result. A checkpoint is ready only when every applicable authorized row is
`PROVEN`, or a permitted `BLOCKED_ENVIRONMENT` limitation is explicit; required
validation used the correct harness; no known predictable rejection remains;
and the checkpoint has enough evidence for CK to verify without reconstructing
basic completion conditions. `UNRESOLVED`, `IMPLEMENTED_UNPROVEN`, and
`BLOCKED_AUTHORITY` are not ready.

Persist this normalized interpretation in the existing workflow artifacts:

- GO checkpoints include `## Review Contract Closure`: stable row ID, ticket
  authority, required proof, status, and `Internal readiness: READY_FOR_CK`.
- First CK artifacts include `## Frozen Finding Closure Matrix`. Every finding
  (`CK-001`) and clause (`CK-001.a`) identifies ticket authority, unsatisfied
  evidence, and observable closure condition.
- CFC checkpoints map every authorized clause to its status and evidence.
- HMN artifacts authorize only unresolved clause IDs and identify already
  resolved rows that MUST NOT be reopened.

Do not renumber established identifiers. New artifacts may normalize legacy
ones that lack clause IDs from the frozen ticket, existing CK finding, and
evidence; mark that as legacy normalization and freeze the resulting matrix.
Do not rewrite historical artifacts.

## 5. First review, later verification, and contract gaps

The first CK review MUST traverse the complete Review Contract and consolidate
all currently identifiable ticket-bound deficiencies. Each finding's closure
clauses freeze when that artifact is written. A finding cannot be silently
strengthened later.

Post-CFC CK verifies only frozen unresolved clauses, the remediation diff,
evidence required for those clauses, and direct regressions introduced by the
remediation. It may return `CHANGES_REQUIRED` only for an unresolved frozen
clause or such a direct regression. It MUST NOT restart broad review, introduce
unrelated findings, or demand a stronger harness than the frozen requirement.

If later verification finds a ticket-authorized obligation that was reasonably
identifiable in the first review, omitted from frozen closure clauses, and not
a direct remediation regression, record `REVIEW_CONTRACT_GAP`, not ordinary
`CHANGES_REQUIRED` against CFC. Record the omitted authority, why it matters,
why it was omitted, whether it affects completion, and handoff to
human/planning authority. An expectation with no ticket authority is an
out-of-scope observation or `HUMAN_DECISION_REQUIRED`, not remediation work.

## 6. Bounded remediation and HMN

CFC builds a Finding Closure Matrix before modifying code and completes every
authorized clause before `READY_FOR_CK`. It preserves already proven rows. An
interrupted execution window with in-scope uncommitted work, no remediation
commit, and no CK handoff is incomplete current CFC work, not a failed or
completed cycle. It may be resumed only with `CONTINUE_CURRENT_CFC` semantics.

HMN diagnoses the active tuple, Review Contract, frozen matrix, proven and
unresolved rows, latest CFC state, direct regressions, and worktree. It
authorizes the smallest valid continuation and protects resolved rows. It MUST
NOT reconstruct acceptance, add scenarios, strengthen proof, or create harness
requirements. A new post-CFC remediation cycle always requires a fresh explicit
user `hmn` invocation and a new bounded authorization. No protocol participant
may recursively invoke GO, CK, CFC, or HMN.

## Examples

1. A ticket requires implementation A, Compose scenarios B/C/D, and observation
   E. If only B/C are proven, GO is `NOT READY FOR CK`; it continues D/E.
2. If a ticket identifies five scenarios and GO proves two, first CK records all
   three missing scenarios as clauses in one consolidated finding.
3. If a four-clause finding has only two proven CFC clauses, CFC is
   `CFC_NOT_READY_FOR_CK`, not ready to hand off a partial repair.
4. If CFC is interrupted before commit and CK handoff, HMN uses
   `CONTINUE_CURRENT_CFC`, not `AUTHORIZE_NEXT_CFC`.
5. If later CK adds a previously identifiable non-regression scenario omitted
   from the frozen matrix, it is `REVIEW_CONTRACT_GAP`, not a CFC failure.

## Non-negotiable scope locks

Ticket wording beats reviewer preference. Explicit ticket validation beats a
convenient smaller test. Approved predecessor work stays closed unless the
current frozen ticket requires otherwise. Direct regressions in the authorized
scope remain blockable. Future-ticket work stays future-ticket work. CK alone
issues ordinary `PASS`; this protocol does not change that authority.

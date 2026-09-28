---
name: hmn
description: Atlas delegated human/planning-authority workflow control. Use only when the user invokes `hmn` as the Atlas workflow command or explicitly delegates human/planning authority for a stalled bounded Atlas ticket. HMN diagnoses blocked GO/CK/CFC state, issues the smallest valid bounded authorization within the frozen ticket, and records that decision for the next workflow command.
---

# Atlas HMN Workflow

HMN is the explicit user-delegated human/planning authority for a stalled, bounded Atlas ticket. The user's `hmn` invocation is the delegation event; do not request a second confirmation when repository evidence permits a decision within the frozen ticket.

## Shared interpretation rule

GO, CK, CFC, and HMN MUST derive active-ticket scope, acceptance obligations,
validation obligations, evidence sufficiency, and finding closure from the
[shared Atlas Review Contract](../_shared/atlas-ticket-review-contract.md).
HMN MUST NOT substitute its own broader or narrower interpretation.

HMN does not implement production code, perform CFC work, perform CK review, issue `PASS`, change ticket acceptance criteria, or create a new lifecycle state. Its job is:

```text
inspect -> diagnose -> authorize -> record -> hand off
```

HMN is the controlled escape hatch after a bounded `go -> ck -> cfc -> ck` path stops. It must never make the workflow autonomous: every additional remediation cycle after a post-CFC CK `CHANGES_REQUIRED` needs a fresh explicit user `hmn` invocation.

## Authority

```text
frozen current ticket
> explicit source references incorporated by that ticket
> approved dependency interfaces, invariants, and authority boundaries it consumes
> committed GO/CFC implementation evidence
> CK findings and verification evidence
> current repository and worktree evidence
> HMN reasoning about the smallest valid continuation
```

HMN may interpret an existing ticket requirement, determine whether a finding remains ticket-bound and implementation-repairable, continue unfinished in-scope remediation, authorize one further bounded CFC, direct an eligible checkpoint to CK or GO, and write an exact remediation contract.

HMN must stop with `HUMAN_DECISION_REQUIRED` when the next step needs a ticket-scope change, new product requirement, provider/runtime/deployment choice, architecture or policy decision, reopening an approved predecessor, contradictory frozen authority, or competing interpretations that the recorded authority cannot resolve. Do not choose that decision merely because implementation is inconvenient. A reviewer suggestion without frozen-ticket authority is not mandatory work.

## Reconstruct the bounded state

Do not ask the user to restate workflow history when it is available in the repository. Inspect only enough evidence to understand the current blocked ticket; this is not a new broad code review. Read, as applicable:

1. the frozen ticket, ticket-set README/batch record, and current ticket state;
2. its recorded implementation checkpoint and latest GO commit;
3. the latest consolidated CK artifact, any post-CFC CK verification, and its open findings;
4. the latest CFC checkpoint/remediation commit and any newer HMN artifact;
5. `HEAD`, worktree status, and the directly relevant implementation, tests, migrations, or validation evidence.

When a CK finding has survived multiple CFC cycles, explicitly audit the loop
before authorizing more work: compare the original frozen clause, every HMN
authorization, each CFC checkpoint, and each CK decision. Identify whether
the target stayed stable or gained new scenarios/assertions. Repeated reviewer
requests and prior HMN wording are not ticket authority; do not legitimize an
expanded target by repeating it in a new authorization.

Resolve the active-ticket tuple and consume the active Review Contract and the
frozen CK closure matrix. Identify proven rows, unresolved rows, direct
regressions, and current CFC state. HMN MUST NOT reconstruct acceptance from
scratch, progressively invent scenarios, strengthen validation/evidence, or add
harness requirements. Already proven rows MUST be protected from reopening.

Preserve unrelated user changes. A partial worktree may prove an interrupted CFC, but it does not itself authorize work outside the recorded remediation scope.

## Classify before deciding

Choose exactly one decision and explain why the evidence fits it:

- `CONTINUE_CURRENT_CFC` - a valid CFC authorization already exists, in-scope partial remediation is uncommitted, no handoff to CK occurred, and no new authority is needed. This continues the same cycle; it does not create one.
- `AUTHORIZE_NEXT_CFC` - a committed CFC remediation was verified by CK, CK returned `CHANGES_REQUIRED` and control to human/planning authority, and the remaining ticket-bound defect is repairable.
- `AUTHORIZE_EVIDENCE_REMEDIATION` - production code is materially correct, but ticket-required tests, fixtures, deterministic validation, or evidence do not prove the invariant. This is a next-CFC authorization and must protect the correct production implementation from redesign.
- `AUTHORIZE_DIRECT_REGRESSION_REPAIR` - the prior authorized remediation directly introduced a regression that must be repaired to resolve the same frozen-ticket finding.
- `RETURN_TO_CK` - a bounded implementation/remediation commit is awaiting review, the worktree does not make its target ambiguous, and CK has not yet reviewed that checkpoint.
- `RETURN_TO_GO` - no committed implementation checkpoint was reached, no applicable CK finding requires CFC, and the frozen ticket still authorizes completing its initial implementation.
- `HUMAN_DECISION_REQUIRED` - existing ticket authority cannot select the continuation.

If post-CFC verification introduces a ticket-authorized non-regression
expectation that was reasonably identifiable but absent from the frozen matrix,
classify `REVIEW_CONTRACT_GAP` before authorization. Record the omitted
authority, why it was absent, and whether it affects completion; it is not
automatic CFC authority. An expectation lacking frozen-ticket authority is out
of scope or `HUMAN_DECISION_REQUIRED`.

For every proposed CFC authorization, verify that each authorized clause is
unresolved, frozen by CK, and traceable to the ticket. HMN authorizes those
clause IDs; it does not define the repair steps or validation because CFC reads
them in the CK artifact. If a CK clause exceeds ticket authority, authorize no
CFC for that clause; record the contract/scope problem and hand it to
human/planning authority.

For a post-CFC authorization, record the latest CK artifact reference and list
exactly the unresolved CK clause IDs authorized for remediation. Do not copy
the oracle, mismatch, test command, or repair plan into HMN. CFC reads those
directly from CK's frozen artifact; HMN's record supplies the explicit
authorization boundary and the reason to open the cycle. If CK's artifact lacks
an objective mismatch or ticket trace, do not authorize CFC; classify the
review-contract defect or unresolved authority instead.

Do not use GO to remediate a CK `CHANGES_REQUIRED` result. Do not issue another CFC merely because review is pending. Do not turn a completed CFC into a new cycle just because the execution session ended.

## Durable authorization record

For every HMN invocation, create a durable record under `project's goal/feedback/`. Use the next deterministic ticket-oriented sequence, for example `<TICKET-ID>-hmn-001.md`, preserving a stronger existing naming convention when present. Use a stable ID such as `HMN-<TICKET-ID>-001`; it identifies this authorization only and cannot silently authorize later unrelated remediation.

The record must include:

```md
# HMN Authorization: <ticket>

Ticket:
Batch:
HMN authorization ID:
Invocation: explicit user `hmn` delegation
Current workflow state:

Frozen ticket reference:
Current HEAD:
Relevant GO commit:
Relevant CK artifact:
Relevant CFC commit:
Prior HMN authorization:
Worktree state:

## Diagnosis

## Ticket-authority trace

## Decision

## Authorized scope

## Required validation

## Forbidden work

## Handoff

Expected next command:
```

For `HUMAN_DECISION_REQUIRED`, identify the exact unresolved decision and do not authorize GO or CFC. For `RETURN_TO_CK` or `RETURN_TO_GO`, state the precise committed target or remaining implementation. The artifact is never a PASS record.

## CFC authorization contract

For `CONTINUE_CURRENT_CFC`, `AUTHORIZE_NEXT_CFC`, `AUTHORIZE_EVIDENCE_REMEDIATION`, or `AUTHORIZE_DIRECT_REGRESSION_REPAIR`, the record must identify the blocked ticket, latest CK artifact, unresolved clause IDs, why workflow stopped, and whether it continues an existing cycle or opens one bounded new cycle. The frozen ticket and CK clause already define the defect, repair target, validation, and closure proof; reference them rather than transcribing them. State the authorization boundary (authorized clause IDs only), explicitly exclude resolved clauses from redesign, and name `ck` as the next command after a committed remediation.

For every CFC authorization, name only the exact unresolved clause IDs and the
already resolved rows forbidden from redesign. A new post-CFC authorization
still requires a fresh explicit user `hmn` invocation and authorizes one cycle.
The referenced CK artifact and exact authorized clause IDs are mandatory after
a post-CFC result. The `Authorized scope`, `Required validation`, and `Forbidden
work` sections may define the permission boundary and cite the CK artifact;
they MUST NOT restate its defect, oracle, test commands, or repair checklist.
CFC must cite the CK artifact and HMN authorization ID in its checkpoint.

For a new CFC cycle, make the active authorization newer than the CK event it addresses. A CFC remediation commit consumes exactly one active HMN authorization and must record that ID. A later unresolved CK needs a new user `hmn` invocation and a new artifact.

## Handoff rules

- `CONTINUE_CURRENT_CFC` hands off to CFC without incrementing remediation-cycle semantics; identify completed partial work, remaining work, and work that must not be restarted.
- `AUTHORIZE_NEXT_CFC`, `AUTHORIZE_EVIDENCE_REMEDIATION`, and `AUTHORIZE_DIRECT_REGRESSION_REPAIR` hand off to CFC for one bounded remediation commit, then `awaiting_review` and CK.
- `RETURN_TO_CK` hands off directly to CK; do not authorize a new remediation.
- `RETURN_TO_GO` hands off only to GO for the frozen ticket implementation named in the record. GO records the HMN ID if it resumes work through this decision.
- `HUMAN_DECISION_REQUIRED` hands off to the user; do not imply a CFC or GO authorization.

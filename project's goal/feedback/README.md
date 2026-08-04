# CES Feedback Review Protocol

This README is the single process authority for reviewing CES plans, tickets,
contracts, qualification reports, and implementation feedback. It exists to
find real blockers without allowing repeated AI reviews to expand scope or
create an endless feedback loop.

This document governs the **review process only**. It does not override product
requirements, frozen architecture decisions, security controls, evidence, or
human approval boundaries.

## 1. Authority order

When review material conflicts, use this order:

1. Current explicit user decision.
2. Frozen project/product decision linked by the ticket.
3. Current shared contract or governing architecture document.
4. Current ticket objective, scope, and acceptance criteria.
5. Verified implementation and qualification evidence.
6. Review feedback.

Feedback is advisory until accepted into an authoritative ticket, contract, or
decision record. A feedback Markdown file is never a parallel specification.

## 2. Required review packet

Every cross-check must receive only:

- the tickets being reviewed;
- their directly governing contracts or context documents;
- the frozen decisions listed below;
- relevant current implementation evidence;
- this README.

Do not provide every historical feedback file. Superseded feedback introduces
old assumptions and forces reviewers to reconcile decisions that are no longer
active.

## 3. Frozen decisions

Before review, the ticket owner must list decisions that are outside the
review's scope:

```text
Frozen decision:
Owner:
Reason:
Authoritative source:
Supersedes:
May reopen only if:
```

A reviewer may challenge a frozen decision only with concrete evidence of one
of the following:

- a security or data-integrity defect;
- an impossible or internally contradictory implementation;
- conflict with a higher-authority decision or contract;
- verified production evidence that invalidates the decision.

Preference, alternative design taste, or a theoretically better feature is
not sufficient to reopen it.

## 4. Finding classifications

Every finding must use exactly one classification:

### BLOCKER

Implementation cannot safely or correctly proceed because of a demonstrated
contradiction, missing required contract, security/data-integrity defect, or
untestable mandatory acceptance condition.

### IMPORTANT

Implementation can proceed, but the item must be resolved before the ticket's
qualification or release gate can pass.

### BACKLOG

The suggestion may be useful but is not required by the current objective or
release gate. It must not reopen or block the active ticket.

## 5. Admissible finding format

A finding is admissible only when it contains all of these fields:

```text
ID:
Classification: BLOCKER | IMPORTANT | BACKLOG
Exact ticket section:
Concrete problem:
Evidence or conflicting authority:
Smallest necessary correction:
Acceptance test affected:
```

Findings without an exact citation, evidence, and smallest correction are not
actionable and must not cause another review cycle.

## 6. Review boundaries

Reviewers must check only:

1. Contradictory requirements.
2. Information missing that prevents implementation.
3. Mandatory criteria that cannot be objectively tested.
4. Security, authorization, privacy, or data-integrity failures.
5. Frontend inference that would contradict backend-owned semantics.
6. Fixture-specific logic leaking into production behavior.
7. Claims of completion unsupported by current evidence.

Reviewers must not:

- redesign the product;
- add optional capabilities to the active scope;
- repeat requirements already present;
- reopen frozen decisions without qualifying evidence;
- require ideal future architecture when the current contract is sufficient;
- turn backlog suggestions into blockers;
- review writing style unless it creates implementation ambiguity;
- demand proof owned by a later ticket from an earlier implementation ticket;
- treat one qualification fixture as a production constant;
- create a new feedback document as a second source of truth.

## 7. Two-pass limit

Each ticket set receives at most two readiness passes.

### Pass 1 — blocker discovery

- Maximum 10 findings.
- Identify only new BLOCKER and IMPORTANT findings.
- Consolidate duplicates into one root finding.
- Apply accepted corrections to authoritative tickets.

### Pass 2 — closure verification

- Review only the Pass 1 corrections and their direct effects.
- Do not re-review unaffected sections.
- Do not introduce new scope.
- A genuinely new blocker is allowed only when it was caused by the Pass 1
  correction or could not reasonably have been observed in Pass 1.

After Pass 2, the tickets are frozen for implementation when no blocker
remains. Later non-critical ideas go to backlog.

## 8. Delta-only rule

Repeated reviews must examine the change since the previous accepted review,
not the whole project history. Every review response must state the reviewed
commit, files, or exact ticket revision.

A finding already resolved, rejected, or assigned to backlog must not be
resubmitted unless new evidence changes its classification. The reviewer must
cite that new evidence.

## 9. Finding adjudication

The ticket owner records one disposition per finding:

| Disposition | Meaning |
|---|---|
| Accept | Update the current authoritative ticket. |
| Assign | Valid, but owned by another named ticket. |
| Backlog | Useful but does not block current delivery. |
| Reject | Duplicate, unsupported, contradictory, or out of scope. |

Assigning a finding to another ticket does not leave the current ticket
blocked unless the current ticket explicitly depends on that acceptance gate.

## 10. Stopping condition

Ticket review is complete when:

- frozen decisions and ownership are explicit;
- inputs and outputs are named;
- backend and frontend responsibilities are unambiguous;
- security and authority boundaries are testable;
- empty, unavailable, stale, partial, and failure states are distinguishable;
- fixture-only expectations are isolated from production behavior;
- every mandatory criterion has an objective test or named human gate;
- no accepted BLOCKER remains.

The reviewer must then return exactly:

```text
Tickets are ready for implementation.
Remaining IMPORTANT items: <count or none>
BACKLOG suggestions: <count or none>
```

The existence of further possible improvements is not a reason to continue
readiness review.

## 11. Reopening a frozen ticket

A frozen or implemented ticket may reopen only for:

- failing acceptance evidence;
- a reproducible production defect;
- a changed higher-authority requirement;
- a security or data-integrity discovery;
- an incompatible shared-contract change.

Reopening requires the evidence, affected acceptance criterion, owning ticket,
and smallest remediation scope. A new AI opinion by itself is not sufficient.

## 12. Feedback-file lifecycle

Standalone feedback files are temporary review inputs:

1. Read and classify their findings.
2. Record dispositions.
3. Apply accepted wording to authoritative tickets.
4. Move optional ideas to backlog.
5. Delete or archive the superseded feedback file.

Do not keep accumulating active `*_FEEDBACK*.md` documents after their useful
findings have been incorporated.

## 13. Reusable cross-check prompt

```text
Review the attached CES tickets for implementation readiness under
project's goal/feedback/README.md.

Frozen decisions:
<insert the ticket's frozen decisions>

Review only:
1. contradictions;
2. missing information that prevents implementation;
3. untestable mandatory acceptance criteria;
4. security or data-integrity defects;
5. fixture-specific production leakage;
6. unsupported completion claims.

Do not redesign the product, expand scope, repeat existing requirements,
reopen frozen decisions without qualifying evidence, or promote optional
improvements to blockers.

Use only BLOCKER, IMPORTANT, or BACKLOG. Return at most 10 findings. Each
finding must cite the exact section, evidence, smallest necessary correction,
and affected acceptance test.

This is Pass <1 or 2>. Review revision/commit: <revision>.
For Pass 2, review only corrections made for Pass 1.

If no BLOCKER remains, say exactly:
Tickets are ready for implementation.
Remaining IMPORTANT items: <count or none>
BACKLOG suggestions: <count or none>
```

## 14. Default Atlas frozen decisions

Unless a newer explicit decision supersedes them:

- Atlas remains domain-neutral; Safara is a qualification fixture.
- Atlas preserves exact original document text regardless of language.
- Accepted semantic equivalence yields one governed concept while retaining
  every exact original representation.
- Backend contracts own semantic membership, topology, authority, eligibility,
  and evidence relationships.
- The UI may position and filter governed data but may not invent semantics or
  missing edges.
- The main integrated overview remains visible; selected detail opens below it.
- Missing governed ordering is shown honestly, not filled from array/page order.
- Human approval and release acceptance cannot be authored or self-certified
  by Atlas.

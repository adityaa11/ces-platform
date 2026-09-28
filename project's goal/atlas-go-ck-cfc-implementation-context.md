# Atlas GO / CK / CFC Implementation-Phase Skill Orchestration
> **Superseded for workflow semantics:** This document records the former multi-round GO/CK/CFC proposal. Use [the old-workflow restoration context](atlas-go-ck-cfc-old-workflow-restoration-context.md) and the repository's current `go`, `ck`, and `cfc` skills for workflow behavior. Retain this document as historical implementation context only; its review-round, convergence, and repeated remediation instructions are no longer active.

**Target repository:** `adityaa11/ces-platform`  
**Target branch:** `codex/new-atlas-backend`  
**Status:** Implementation context  
**Scope:** Repository-agent workflow only. Do not modify Atlas product/runtime behavior as part of this work.

---

# 1. Objective

Formalize the already-documented Atlas implementation workflow:

```text
go
 ->
implementation
 ->
awaiting_review
 ->
ck
 ->
findings
 ->
cfc
 ->
awaiting_review
 ->
ck
 ->
...
```

into three real repository skills:

```text
go
ck
cfc
```

while preserving the existing principle that the **ticket is the frozen executable contract** for bounded implementation work.

The workflow must support repeated review/remediation when genuinely required, but it must not permit an autonomous never-ending review loop.

The required implementation model is:

```text
Ticket
  ->
GO
  ->
Implementation
  ->
CK Round 1
  ->
CFC if required
  ->
CK Round 2
  ->
CFC if required
  ->
CK Round 3
  ->
PASS
or
REVIEW_CONVERGENCE_BLOCKED
```

A review limit must never convert unresolved work into a false PASS.

If the review fails to converge inside the bounded review session, automated implementation/remediation stops and control returns to human/planning authority.

---

# 2. Existing repository baseline

The repository already documents GO / CK / CFC semantics.

Relevant existing documentation includes:

```text
project's goal/atlas-ui/README.md
project's goal/Backend_Phase/README.md
project's goal/Atlas_UI_UX_Review_Protocol.md
```

The Backend Phase README currently establishes the sequence:

```text
bounded ticket
-> implementation
-> validation
-> committed checkpoint
-> awaiting_review
-> ck
-> cfc
-> go
```

The Atlas UI README also states:

```text
ck
reviews the committed HEAD and writes one consolidated review file
under project's goal/feedback/

cfc
resolves accepted in-scope feedback and commits remediation;
returns the ticket to awaiting_review

go
may start the next dependency-ready ticket only after the final
commit has a PASS review
```

There is already an actual engineering review skill:

```text
.agents/skills/engineering-implementation-review/SKILL.md
```

with the classifications:

```text
IMPLEMENTATION_DEFECT
SCOPE_DIVERGENCE
PLANNING_GAP
KNOWLEDGE_GAP
```

and the governing principle:

```text
Discovery may exceed the ticket.
Authority may not.
```

The implementation must preserve that principle.

GO / CK / CFC are not replacements for `engineering-implementation-review`.

Instead:

```text
GO
= implementation lifecycle authority

CK
= review lifecycle authority

CFC
= remediation lifecycle authority

engineering-implementation-review
= review reasoning / inspection capability used by CK
```

---

# 3. Required skill structure

Create these actual skills:

```text
.agents/skills/go/SKILL.md
.agents/skills/ck/SKILL.md
.agents/skills/cfc/SKILL.md
```

They must use the same repository skill format as existing skills, including YAML frontmatter.

Because `go` is also the name of a programming language and a common English word, its skill description must be intentionally narrow.

Example intent:

```yaml
---
name: go
description: Atlas implementation-phase GO workflow control. Use only when the user invokes `go` as the Atlas ticket workflow command or explicitly requests GO for a bounded Atlas ticket.
---
```

Equivalent narrow triggering rules must be used for `ck` and `cfc`.

Do not cause ordinary discussion of Go code or unrelated occurrences of the words `go`, `ck`, or `cfc` to invoke these workflow semantics.

---

# 4. Authority model

The ticket remains the implementation authority.

GO, CK, and CFC must never silently rewrite, expand, reinterpret, or replace the frozen ticket.

The authority hierarchy is:

```text
accepted project / architecture baseline
               ->
          frozen ticket
               ->
       GO / CK / CFC workflow
               ->
         implementation
```

The skills govern **how bounded implementation work progresses**.

They do not create new product requirements.

They do not replace ticket authoring.

They do not replace planning.

They do not grant themselves architecture authority.

If implementation or review discovers that the frozen ticket itself is insufficient, the workflow must leave the implementation loop and return to planning.

---

# 5. GO skill contract

## Purpose

`go` controls entry into implementation work and advancement between approved checkpoints.

GO is the only one of the three skills allowed to authorize progression to the next dependency-ready ticket.

## Required inputs

Resolve from repository state:

```text
current ticket or batch
ticket-set README
ticket dependency state
ticket state
latest CK review artifact when one exists
current committed HEAD
accepted dependency checkpoints
```

Do not require the user to restate information already available in the repository.

## Starting a ticket

When no implementation is currently active, GO may select the next dependency-ready ticket from the authorized ticket set.

Before implementation begins, GO must verify:

```text
ticket exists
ticket is bounded
dependencies are satisfied
predecessor checkpoints required by the ticket are approved
ticket is not already complete
no unresolved blocking review state exists for the current checkpoint
```

GO then treats that ticket as the frozen executable contract.

Implementation must remain within that ticket.

## Implementation behavior

GO may:

```text
inspect the frozen ticket
inspect explicitly referenced accepted dependencies
inspect implementation context referenced by the ticket
implement the ticket
run ticket-required validation
run repository-required validation
record implementation evidence
commit the bounded work
move the ticket/checkpoint to awaiting_review
```

GO must not perform its own final approval.

After implementation:

```text
GO -> awaiting_review -> CK
```

## Advancement behavior

When GO is invoked after a CK review, inspect the latest review for the current ticket.

If:

```text
Result: PASS
```

GO may:

```text
mark the current ticket/checkpoint complete as appropriate
preserve the review evidence
select the next dependency-ready ticket
begin the next authorized implementation
```

If the latest CK result is not PASS, GO must not advance.

Examples:

```text
CHANGES_REQUIRED
BLOCKED
REVIEW_CONVERGENCE_BLOCKED
```

must prevent advancement.

## Forbidden GO behavior

GO must not:

```text
review its own implementation as the independent CK authority
silently waive CK findings
modify a frozen ticket to make implementation pass
start the next ticket before current PASS
fold unrelated cleanup into the ticket
silently resolve planning gaps
continue after REVIEW_CONVERGENCE_BLOCKED
```

---

# 6. CK skill contract

## Purpose

`ck` performs governed review of a committed implementation checkpoint.

CK owns the review session and review convergence rules.

CK must invoke or apply:

```text
.agents/skills/engineering-implementation-review/SKILL.md
```

for implementation-review reasoning.

Where applicable, CK must also honor extensions routed by that skill, including security-refactor-readiness and frontend review requirements.

## Review target

CK reviews the committed implementation revision.

The review baseline is:

```text
frozen ticket
reviewed commit / HEAD
accepted dependency checkpoints
implementation evidence
required validation evidence
applicable review extensions
prior review artifacts for this review session
prior remediation commit when round > 1
```

Do not silently change the ticket baseline during a review session.

---

# 7. CK review sessions

A ticket receives a bounded review session.

Default maximum:

```text
MAX_CK_ROUNDS = 3
```

The maximum is a convergence boundary, not an automatic approval threshold.

The review session is:

```text
CK1
 ->
CFC1 if required
 ->
CK2
 ->
CFC2 if required
 ->
CK3
 ->
PASS or REVIEW_CONVERGENCE_BLOCKED
```

There must not be an autonomous:

```text
CK4
CFC4
CK5
CFC5
...
```

for the same frozen baseline.

A new review session after convergence failure requires explicit human/planning authorization.

It must never be started silently by CK or CFC.

---

# 8. CK Round 1 semantics

Round 1 is the complete independent implementation review.

CK1 must review:

```text
ticket scope conformance
acceptance criteria
dependency/checkpoint conformance
architecture and authority-boundary preservation
implementation correctness
negative/failure behavior where relevant
required tests and evidence
regressions inside the affected boundary
applicable review extensions
```

CK1 is allowed to discover defects anywhere inside the ticket's authorized affected boundary.

It is not restricted to the implementer's claimed change list.

CK1 must produce **one consolidated review**, not a stream of incremental findings.

All reasonably discoverable findings from the review should be reported together.

This minimizes artificial review churn.

---

# 9. CK Round 2 and Round 3 semantics

Subsequent CK rounds are not fresh full reviews starting from zero.

Their purpose is:

```text
verify previous findings
inspect the remediation delta
inspect regression risk introduced by that remediation
verify affected acceptance criteria
```

The review scope becomes progressively narrower.

Round 2 and Round 3 must not intentionally restart broad exploratory review over already-accepted unrelated areas.

They may still identify a genuine previously missed defect if evidence establishes that the frozen ticket was violated.

Such a finding must be explicitly marked as a late discovery.

---

# 10. Stable finding identity

Every blocking CK finding must receive a stable identifier.

Example:

```text
CK-001
CK-002
CK-003
```

IDs remain stable for the entire review session.

Do not create a new ID merely because the same defect appears in another review round.

Each finding must contain at least:

```text
ID
classification
origin
status
ticket requirement / acceptance criterion
location
evidence
requested observable outcome
```

Use existing engineering classification:

```text
IMPLEMENTATION_DEFECT
SCOPE_DIVERGENCE
PLANNING_GAP
KNOWLEDGE_GAP
```

Add a separate `origin` field rather than replacing those classifications.

Allowed origin values:

```text
INITIAL_REVIEW
REMEDIATION_INCOMPLETE
REMEDIATION_REGRESSION
LATE_DISCOVERY
```

Example:

```text
ID: CK-003
Classification: IMPLEMENTATION_DEFECT
Origin: LATE_DISCOVERY
Status: OPEN
Requirement: AC-07
```

This means the defect is still an implementation defect, but the review process records that CK1 failed to surface it.

---

# 11. Resolved findings are sticky

Once CK determines that a finding is resolved:

```text
CK-001 = RESOLVED
```

later CK rounds must not casually reopen it.

A resolved finding may only become blocking again when one of these is true:

```text
REMEDIATION_INCOMPLETE
NEW_EVIDENCE
REMEDIATION_REGRESSION
```

The new review must show concrete evidence.

Reviewer preference, stylistic disagreement, or model variation is insufficient.

This rule exists to prevent review oscillation such as:

```text
round 1 -> change A
round 2 -> undo A
round 3 -> restore A
```

without a change in evidence or requirements.

---

# 12. Late discoveries

A later CK round may discover a defect that:

```text
existed during CK1
was inside CK1's authorized review boundary
was not reported during CK1
```

Do not hide this fact.

Mark it:

```text
Origin: LATE_DISCOVERY
```

A late discovery may still block PASS when it genuinely violates the frozen ticket.

However, repeated late discoveries are evidence that the review process is not converging.

They must count toward convergence assessment.

Late discoveries must not be used as permission to restart full exploratory review indefinitely.

---

# 13. Non-blocking observations

Do not convert optional polish or unrelated ideas into remediation work.

If an observation does not violate:

```text
the frozen ticket
an accepted dependency boundary
an applicable mandatory review binding
a regression expectation inside the affected boundary
```

it must not become an implementation-blocking CK finding.

Record it separately, if useful, as an advisory observation.

Advisory observations:

```text
do not block PASS
do not authorize CFC
do not expand the ticket
```

If the observation represents a desirable new requirement, route it as a future scope change or ticket.

---

# 14. CK results

Use these review-level outcomes:

```text
PASS
CHANGES_REQUIRED
BLOCKED
REVIEW_CONVERGENCE_BLOCKED
```

## PASS

Use when:

```text
all blocking in-scope implementation defects are resolved
mandatory review obligations are satisfied
no blocking scope/planning/knowledge issue prevents approval
```

PASS is revision-specific.

It means the reviewed commit satisfies the frozen ticket and mandatory review obligations.

It does not mean the whole project is perfect.

## CHANGES_REQUIRED

Use when:

```text
one or more correctable IMPLEMENTATION_DEFECT findings remain open
```

These findings are eligible for CFC.

## BLOCKED

Use when implementation cannot proceed through ordinary remediation because of:

```text
SCOPE_DIVERGENCE
PLANNING_GAP
material KNOWLEDGE_GAP
unresolvable mandatory review dependency
```

CFC must not invent a solution for these.

Return to planning/human authority.

## REVIEW_CONVERGENCE_BLOCKED

Use when the maximum CK round is reached and blocking findings still remain.

This result must:

```text
not become PASS
not automatically trigger another CFC
not automatically trigger CK4
not permit GO to advance
```

Control returns to human/planning authority.

---

# 15. Convergence assessment

Every CK round after Round 1 should record:

```text
Convergence: IMPROVING
Convergence: STALLED
Convergence: REGRESSING
```

## IMPROVING

Use when remediation is measurably closing findings without equivalent new blockers.

Example:

```text
CK1: 4 open
CK2: 1 open
```

## STALLED

Use when the same blocking issue remains unresolved or review state is not materially improving.

Example:

```text
CK1: CK-001 OPEN
CK2: CK-001 OPEN
```

## REGRESSING

Use when remediation creates additional blocking problems or previously stable behavior becomes broken.

Example:

```text
CK1: 2 blockers
CFC resolves them
CK2: 4 remediation-caused blockers
```

Convergence status is diagnostic.

It does not replace actual finding evidence.

---

# 16. CFC skill contract

## Purpose

`cfc` performs bounded remediation of findings from the latest CK review.

CFC is not another implementation-planning command.

CFC derives its authority entirely from:

```text
the frozen ticket
+
the latest CK review
```

## Required inputs

Resolve:

```text
current ticket
latest CK review
review round
open findings
reviewed commit
current remediation base
required validation
```

## Eligible remediation

CFC may remediate only open findings that are implementation-repairable.

Normally:

```text
Classification: IMPLEMENTATION_DEFECT
Status: OPEN
```

including origins such as:

```text
INITIAL_REVIEW
REMEDIATION_INCOMPLETE
REMEDIATION_REGRESSION
LATE_DISCOVERY
```

provided the review session has not reached its convergence boundary.

## Forbidden remediation

CFC must not silently repair:

```text
SCOPE_DIVERGENCE
PLANNING_GAP
KNOWLEDGE_GAP requiring new policy
REVIEW_CONVERGENCE_BLOCKED
```

Those leave the implementation loop.

CFC must also not perform:

```text
unrelated refactoring
opportunistic cleanup
new features
new product requirements
architecture redesign
dependency replacement
scope expansion
```

unless required to resolve an authorized finding within the frozen ticket.

## CFC completion

After remediation:

```text
run finding-specific validation
run affected regression validation
commit remediation
record which CK finding IDs were addressed
return ticket/checkpoint to awaiting_review
```

Then:

```text
CFC -> awaiting_review -> CK
```

CFC must never declare PASS.

Only CK may produce the review PASS used by GO.

---

# 17. Review persistence

Use the existing review artifact convention under:

```text
project's goal/feedback/
```

Existing review artifacts must remain valid.

Do not require migration of historical files.

Each new CK artifact must include enough metadata to reconstruct the review session.

Required header fields:

```text
Ticket / batch
Reviewed commit
Frozen ticket baseline
Review round
Maximum review rounds
Prior review artifact
Remediation commit, when applicable
Result
Convergence, when round > 1
```

Example:

```markdown
# Review: PCC-BATCH-01

- Ticket / batch: `PCC-001` / `PCC-BATCH-01`
- Reviewed commit: `abc1234`
- Frozen baseline: `PCC-001`
- Review round: 2
- Maximum review rounds: 3
- Prior review: `PCC-BATCH-01-def5678-review.md`
- Remediation commit: `abc1234`
- Result: `CHANGES_REQUIRED`
- Convergence: `IMPROVING`
```

Findings should use a stable table similar to:

```markdown
| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | AC-03 | ... | ... | ... |
| CK-002 | IMPLEMENTATION_DEFECT | REMEDIATION_INCOMPLETE | OPEN | AC-05 | ... | ... | ... |
```

The review artifact chain acts as the persistent review ledger.

A separate database or runtime subsystem is not required.

---

# 18. Determining review round

CK must inspect prior feedback artifacts for the current ticket/batch and frozen baseline.

If no prior review exists:

```text
round = 1
```

If the previous review returned:

```text
CHANGES_REQUIRED
```

and CFC produced a remediation commit:

```text
round = previous round + 1
```

If the previous review returned:

```text
PASS
```

the session is closed.

Do not start another ordinary CK round for that same accepted revision without a new authorized implementation change or explicit human instruction.

If the frozen ticket itself changes through authorized planning, that establishes a new baseline and therefore a new review session.

Preserve old review history.

---

# 19. Maximum-round behavior

Default:

```text
Round 1 = complete review
Round 2 = remediation verification
Round 3 = final convergence review
```

If Round 3 still contains one or more blocking findings:

```text
Result: REVIEW_CONVERGENCE_BLOCKED
```

CK must explain why convergence failed.

Examples:

```text
same defect survived multiple remediation attempts
remediation repeatedly causes regressions
late discoveries continue to appear
ticket requirement is ambiguous
reviewers/requirements conflict
architecture assumptions are unstable
implementation approach is not viable
```

Do not automatically determine the planning solution.

Surface the evidence and stop.

Only explicit human/planning authority may decide whether to:

```text
revise the ticket
replace the implementation approach
authorize a new review session
split the work
change architecture
defer the ticket
```

---

# 20. Engineering implementation review integration

Update:

```text
.agents/skills/engineering-implementation-review/SKILL.md
```

only as necessary to support CK review modes.

Do not turn it into the orchestration layer.

Add explicit semantics that when invoked by CK:

```text
CK Round 1
-> full independent implementation review

CK Round > 1
-> verification of existing findings
   + remediation delta inspection
   + regression inspection
   + affected acceptance criteria
```

The existing rule:

```text
The reviewer may identify defects that are absent from all declared review bindings.
```

must remain valid.

However, it must not mean:

```text
restart a completely fresh broad review after every CFC pass
```

A defect discovered after Round 1 must follow the late-discovery rules from CK.

The engineering skill still owns finding classification reasoning.

CK owns lifecycle and convergence.

---

# 21. Security review extension integration

Review:

```text
.agents/skills/engineering-implementation-review/references/security-refactor-readiness.md
```

Its current principle that:

```text
passing declared readiness bindings does not end review
```

must remain true within the authorized CK review scope.

Clarify if necessary that it does not authorize resetting the entire review process after each remediation pass.

In CK1:

```text
full applicable security-readiness inspection
```

In later CK rounds:

```text
verify unresolved readiness findings
inspect security-relevant remediation delta
inspect remediation-created regressions
```

A genuinely missed security-relevant ticket violation may still become:

```text
Origin: LATE_DISCOVERY
```

Do not weaken security review to achieve convergence.

Convergence means review has become stable, not that remaining defects are ignored.

---

# 22. Frontend review integration

Do not remove or weaken:

```text
.agents/skills/frontend-awareness/references/review-gate.md
project's goal/Atlas_UI_UX_Review_Protocol.md
```

When a ticket changes frontend/UI behavior, CK must apply the relevant frontend review requirements.

The GO / CK / CFC implementation cycle and the UI/UX stakeholder-stage review protocol are different layers.

The UI/UX protocol's review-round limits govern product/stage feedback.

GO / CK / CFC govern implementation-ticket checkpoints.

Therefore:

```text
CFC remediation verification
```

does not create a new stakeholder design-feedback round.

Do not use implementation verification as a way to reopen approved design direction.

---

# 23. Documentation updates

Update repository documentation so GO / CK / CFC are no longer described merely as informal shorthand.

At minimum update:

```text
project's goal/Backend_Phase/README.md
project's goal/atlas-ui/README.md
```

The documentation should identify:

```text
go  -> .agents/skills/go/SKILL.md
ck  -> .agents/skills/ck/SKILL.md
cfc -> .agents/skills/cfc/SKILL.md
```

and summarize:

```text
GO controls implementation progression.
CK controls independent review and convergence.
CFC controls bounded remediation.
```

Do not duplicate the complete skill specification into each README.

The skill files are authoritative for command behavior.

The README should document workflow usage.

---

# 24. Required state machine

The implemented skills must collectively enforce this lifecycle:

```text
                 +--------------------+
                 |   PLANNED TICKET   |
                 +---------+----------+
                           |
                          GO
                           |
                 +---------v----------+
                 |  IMPLEMENTATION    |
                 +---------+----------+
                           |
                     commit + validate
                           |
                 +---------v----------+
                 |  AWAITING_REVIEW   |
                 +---------+----------+
                           |
                          CK
                           |
                 +---------v----------+
                 |    CK ROUND N      |
                 +------+-----+-------+
                        |     |
                     PASS     | CHANGES_REQUIRED
                        |     |
                        |    CFC
                        |     |
                        | remediation
                        |     |
                        |  commit
                        |     |
                        | awaiting_review
                        |     |
                        |    CK
                        |
                       GO
                        |
                next dependency-ready
                     ticket
```

At final review round:

```text
CK3
 |- PASS
 |    ->
 |   GO
 |
 `- blocking findings
      ->
 REVIEW_CONVERGENCE_BLOCKED
      ->
 human / planning authority
```

---

# 25. Behavior examples

## Normal one-pass ticket

```text
go
-> implement PCC-001
-> commit
-> awaiting_review

ck
-> Round 1
-> PASS

go
-> close PCC-001
-> begin dependency-ready PCC-002
```

## One remediation cycle

```text
go
-> implement
-> awaiting_review

ck
-> Round 1
-> CK-001
-> CHANGES_REQUIRED

cfc
-> fix CK-001
-> commit
-> awaiting_review

ck
-> Round 2
-> CK-001 RESOLVED
-> PASS

go
-> advance
```

## Multiple remediation cycles that converge

```text
CK1:
CK-001 OPEN
CK-002 OPEN
CK-003 OPEN

CFC1

CK2:
CK-001 RESOLVED
CK-002 RESOLVED
CK-003 OPEN
Convergence: IMPROVING

CFC2

CK3:
CK-003 RESOLVED
Result: PASS
```

## Remediation regression

```text
CK1:
CK-001 OPEN

CFC1:
attempts CK-001 fix

CK2:
CK-001 RESOLVED
CK-002 OPEN
Origin: REMEDIATION_REGRESSION
Result: CHANGES_REQUIRED
```

CK-002 may be remediated because it was caused by authorized CFC work.

## Late discovery

```text
CK1:
CK-001 OPEN

CFC1

CK2:
CK-001 RESOLVED

CK-002 OPEN
Classification: IMPLEMENTATION_DEFECT
Origin: LATE_DISCOVERY
```

CK-002 may still block PASS.

Its origin records that the defect was missed in the initial full review.

## Non-converging ticket

```text
CK1:
CK-001 OPEN

CFC1

CK2:
CK-001 OPEN
Convergence: STALLED

CFC2

CK3:
CK-001 OPEN
Convergence: STALLED

Result:
REVIEW_CONVERGENCE_BLOCKED
```

No CK4.

No automatic CFC3.

No GO progression.

Human/planning decision required.

## Planning gap

```text
CK1:
PLANNING_GAP

Result:
BLOCKED
```

Do not invoke CFC to invent missing requirements.

Return to planning.

---

# 26. Scope-change rule

GO / CK / CFC must never turn review findings into hidden scope growth.

If review identifies something desirable but absent from the ticket:

```text
new requirement
new architecture responsibility
new provider
new authority boundary
new product behavior
```

classify it according to existing review rules.

Usually:

```text
SCOPE_DIVERGENCE
or
PLANNING_GAP
```

It must become:

```text
a new ticket
a ticket amendment through planning
or a new authorized baseline
```

It must not be quietly inserted into CFC.

---

# 27. Checkpoint preservation

Approved predecessor work must remain accepted history.

Later tickets may extend predecessor interfaces as authorized by their own frozen scope.

GO / CK / CFC must not reopen an approved predecessor merely because a later implementation would be easier if that predecessor were redesigned.

If a predecessor responsibility truly must change:

```text
leave implementation loop
return to planning
record the dependency impact
```

Do not rewrite accepted history silently.

---

# 28. No self-approval

Keep implementation and review authority conceptually separate.

GO implements.

CK reviews.

CFC remediates CK findings.

A GO implementation must not mark itself PASS.

A CFC remediation must not mark itself PASS.

Only CK can issue the review result consumed by GO.

This remains true even if the same underlying model executes the commands at different times.

The protocol separation, committed revisions, and persisted review artifacts provide the governance boundary.

---

# 29. No uncommitted moving review target

CK reviews a committed revision.

Do not conduct the governed CK review against a changing working tree.

The reviewed commit must be recorded.

CFC produces a new remediation commit.

The next CK reviews that new committed revision.

Required shape:

```text
implementation commit A
        ->
       CK1
        ->
remediation commit B
        ->
       CK2
        ->
remediation commit C
        ->
       CK3
```

This provides deterministic review history.

---

# 30. Existing artifact compatibility

Do not invalidate historical review files such as:

```text
project's goal/feedback/SOUT-BATCH-01-36bc54e-review.md
```

Historical files may not contain every new field.

Treat them as legacy-compatible review artifacts.

The new richer format applies prospectively.

Do not rewrite old review history merely to conform to the new protocol.

---

# 31. Implementation non-goals

This work must not:

```text
modify Atlas product runtime behavior
modify authentication behavior
modify project creation behavior
modify DocumentStore behavior
modify extraction behavior
modify frontend visuals
modify database schemas
create a runtime review service
create a review database
replace ticket sets
replace implementation contexts
replace engineering-implementation-review
```

This is repository-agent governance.

Keep it at the skills/documentation layer unless existing repository skill validation requires another small supporting artifact.

---

# 32. Acceptance criteria

Implementation is complete only when all of the following are true.

### Skill existence

These exist as valid repository skills:

```text
.agents/skills/go/SKILL.md
.agents/skills/ck/SKILL.md
.agents/skills/cfc/SKILL.md
```

### GO

GO:

```text
uses the frozen ticket as implementation authority
checks dependencies before starting
implements only authorized scope
commits before review
moves work to awaiting_review
requires final CK PASS before advancing
cannot bypass blocked review
```

### CK

CK:

```text
reviews committed revisions
uses engineering-implementation-review
performs full review on Round 1
performs bounded verification on later rounds
uses stable finding IDs
tracks finding origin
tracks finding status
does not casually reopen resolved findings
supports late discoveries without resetting review
records convergence
has a maximum of 3 rounds by default
returns REVIEW_CONVERGENCE_BLOCKED rather than looping forever
```

### CFC

CFC:

```text
reads the latest CK artifact
fixes only eligible open implementation findings
does not expand ticket scope
commits remediation
records resolved finding IDs
returns work to awaiting_review
does not grant PASS
does not operate after REVIEW_CONVERGENCE_BLOCKED without explicit higher authority
```

### Review history

New CK artifacts record:

```text
ticket/batch
reviewed commit
round
maximum round
prior review
remediation commit when relevant
result
convergence when relevant
stable findings
```

### Documentation

Backend Phase and Atlas UI ticket-set documentation point to the real GO / CK / CFC skills.

### Existing review integration

`engineering-implementation-review` remains the engineering review reasoning skill and is not duplicated inside CK.

### Anti-loop guarantee

The system must make this impossible without explicit human intervention:

```text
CK1
-> CFC1
-> CK2
-> CFC2
-> CK3
-> CFC3
-> CK4
-> ...
```

At the bounded convergence limit:

```text
blocking findings remain
-> REVIEW_CONVERGENCE_BLOCKED
-> stop
```

### No false PASS

The round limit must never automatically downgrade, defer, or ignore a blocking finding in order to produce PASS.

---

# 33. Final architectural rule

The implementation-phase protocol should ultimately express this:

```text
THE TICKET DEFINES THE WORK.

GO is allowed to implement that work.

CK is allowed to judge that work.

CFC is allowed to repair defects CK found inside that work.

None of them are allowed to invent a different job.
```

And the convergence rule is:

```text
Repeated review is allowed.

Unbounded autonomous review is not.
```

The expected implementation workflow after this change is therefore:

```text
human reasoning / architecture
          ->
AUTHORIZED IMPLEMENTATION CONTEXT
          ->
ticket decomposition
          ->
FROZEN EXECUTABLE TICKET
          ->
         GO
          ->
implementation + validation
          ->
committed checkpoint
          ->
         CK
          ->
     PASS / findings
       |        |
       |       CFC
       |        ->
       |   remediation
       |        ->
       |       CK
       |        ->
       |   bounded convergence
       |
       ->
APPROVED CHECKPOINT
          ->
         GO
          ->
next dependency-ready ticket
```

Implement this workflow without changing Atlas product behavior.

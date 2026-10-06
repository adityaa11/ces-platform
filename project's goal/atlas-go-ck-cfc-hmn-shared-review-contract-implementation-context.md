# Atlas GO / CK / CFC / HMN Shared Review Contract - Implementation Context

## Document purpose

This implementation context instructs Codex to improve the existing Atlas implementation-phase skills:

- `.agents/skills/go/SKILL.md`
- `.agents/skills/ck/SKILL.md`
- `.agents/skills/cfc/SKILL.md`
- `.agents/skills/hmn/SKILL.md`

The purpose is to eliminate repeated remediation loops caused by GO, CFC, HMN, and CK interpreting the same active ticket differently.

The current workflow already has the correct high-level authority model:

```text
frozen current ticket
> explicit source references incorporated by that ticket
> approved dependency interfaces and boundaries actually consumed
> repository evidence
```

That authority model MUST be preserved.

The problem is not primarily authority drift anymore.

The problem is that each skill currently determines "what completion means" independently:

```text
GO  -> decides what appears implemented enough to review
CK  -> decides what evidence is actually sufficient
CFC -> reacts to the subset CK described
HMN -> reconstructs the remaining expectation after another CK failure
```

This causes repeated cycles such as:

```text
GO
-> CK CHANGES_REQUIRED
-> CFC
-> CK CHANGES_REQUIRED
-> HMN
-> CFC
-> CK CHANGES_REQUIRED
-> HMN
-> CFC
-> ...
```

The IDSER-004 and IDSER-005 remediation history in `project's goal/feedback/` is direct evidence of this problem.

The redesign MUST make all four skills operate from the same active-ticket interpretation and the same deterministic review expectation.

The solution is a shared internal Review Contract / Acceptance Closure model.

This is NOT a new user-facing workflow command.

The user-facing lifecycle remains:

```text
go
-> ck
-> cfc
-> ck

and only when the bounded remediation path stops:

-> hmn
-> cfc or go or ck as explicitly authorized
```

---

# 1. Primary objective

Create one shared protocol used by GO, CK, CFC, and HMN that deterministically derives and freezes:

1. the active ticket;
2. the ticket-authorized implementation scope;
3. the ticket-authorized acceptance obligations;
4. the ticket-authorized validation obligations;
5. the evidence CK is allowed to require;
6. the exact closure conditions for each CK finding;
7. the boundary between unresolved ticket work and out-of-scope review suggestions.

All four skills MUST use this same protocol.

The protocol MUST prevent:

- GO handing work to CK while known ticket validation obligations are still unproven;
- CK revealing an obvious ticket-derived requirement only after several remediation cycles;
- CFC addressing only a partial interpretation of an existing CK finding;
- HMN repeatedly reconstructing the same ticket expectation one small piece at a time;
- CK silently strengthening an existing finding during later verification;
- specialist skills, repository conventions, implementation preferences, or generic best practices from becoming new acceptance criteria;
- a short execution window from being misinterpreted as a completed remediation cycle;
- unrelated architecture, provider, runtime, deployment, storage, or future-ticket requirements from becoming blockers.

---

# 2. Existing workflow philosophy that MUST remain intact

The existing Atlas workflow philosophy is correct and MUST NOT be replaced.

Preserve all of these principles:

## 2.1 Frozen ticket is the executable contract

Implementation and review authority comes from the active frozen ticket.

The ticket may explicitly incorporate:

- source references;
- acceptance criteria;
- validation requirements;
- review bindings;
- dependency interfaces;
- security/readiness bindings;
- implementation constraints.

Nothing outside that authority automatically becomes required work.

## 2.2 Dependencies expose accepted interfaces, not inherited backlog

An approved dependency may contribute:

- interfaces;
- capabilities;
- invariants;
- authority boundaries;
- existing runtime behavior consumed by the current ticket.

It MUST NOT automatically import:

- deferred work;
- future providers;
- deployment plans;
- future adapters;
- unrelated cleanup;
- old recommendations;
- downstream ticket scope.

Example:

If the active ticket consumes `DocumentStore`, a future R2/S3 adapter mentioned elsewhere is not automatically current-ticket scope.

## 2.3 CK is the only ordinary PASS authority

GO MUST NOT issue PASS.

CFC MUST NOT issue PASS.

HMN MUST NOT issue PASS.

CK remains the review authority that records:

- `PASS`
- `CHANGES_REQUIRED`

HMN remains delegated human/planning authority for stalled bounded work, not a reviewer.

## 2.4 Bounded remediation remains mandatory

CFC may remediate only accepted in-scope CK findings.

An HMN authorization may open one new bounded remediation cycle after control has returned to human/planning authority.

No autonomous never-ending CK/CFC loop may be introduced.

## 2.5 Scope expansion remains forbidden

A review concern requiring any of the following is not ordinary CFC remediation:

- a ticket change;
- a new product requirement;
- a new provider;
- a new runtime;
- a new deployment target;
- a new infrastructure requirement;
- a new architecture decision;
- an unresolved policy decision;
- reopening an already approved predecessor;
- implementing a future/deferred dependency requirement.

Those remain human/planning decisions.

---

# 3. New shared protocol

Add a shared internal protocol file.

Recommended path:

```text
.agents/skills/_shared/atlas-ticket-review-contract.md
```

If the repository already has a stronger shared-skill convention, Codex may place it in the equivalent shared location, but the final implementation MUST result in exactly one canonical shared protocol consumed by all four skills.

Do NOT duplicate four independent versions of the same rules.

The shared protocol is NOT a skill invoked by the user.

It is an internal contract that GO, CK, CFC, and HMN MUST read and apply.

---

# 4. Shared protocol responsibilities

The shared protocol MUST define these concepts.

## 4.1 Active Ticket Resolution

Before GO, CK, CFC, or HMN reasons about work, it MUST resolve the same active ticket.

The protocol MUST require:

1. identify the ticket explicitly named by the user when one is named;
2. otherwise resolve the current ticket from the relevant ticket-set README, batch state, checkpoint state, or workflow record;
3. do not silently progress to another ticket;
4. do not select a new ticket because the previous one appears complete;
5. do not infer that a different ticket is active because nearby files changed;
6. preserve explicit user authorization as the highest workflow-selection signal;
7. stop when the active ticket is genuinely ambiguous.

The resolved tuple should conceptually include:

```text
ticket_id
ticket_path
batch_id
ticket_state
authorized_checkpoint
review_target_commit, when applicable
active_hmn_authorization, when applicable
```

Every skill MUST reason against the same tuple.

---

# 5. Review Contract

For the active ticket, derive a deterministic Review Contract.

This is a normalized interpretation of requirements already present in the frozen ticket.

It MUST NOT invent new requirements.

Conceptually, each Review Contract row contains:

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

A markdown implementation is acceptable.

No runtime application code or database schema is required for the Review Contract.

It is a workflow reasoning structure.

---

# 6. Sources that may create Review Contract rows

A row may be created only from ticket-authorized material.

Allowed sources:

1. ticket Outcome;
2. ticket Inspected seams and edit scope;
3. ticket Execution contract;
4. ticket Acceptance criteria;
5. ticket Validation;
6. ticket Mandatory review bindings;
7. explicitly incorporated source references;
8. dependency interfaces or invariants explicitly consumed by the current ticket;
9. an existing CK finding, but only when that finding is traceable to one of the above;
10. an active HMN authorization, but only for selecting or narrowing unresolved rows, never for expanding ticket authority.

The Review Contract MUST NOT create rows from:

- generic best practices;
- specialist-skill advice not explicitly incorporated by the ticket;
- repository-wide future plans;
- comments about desirable architecture;
- reviewer preference;
- "production should probably use X";
- deployment assumptions;
- inferred future tickets;
- unrelated TODOs;
- deferred dependency work.

---

# 7. Review Contract requirement types

At minimum support these conceptual types:

```text
IMPLEMENTATION
INVARIANT
INTEGRATION
VALIDATION
SECURITY
NEGATIVE_CASE
REGRESSION
EVIDENCE
BOUNDARY
```

The exact labels may differ, but the implementation must distinguish behavior from proof.

This distinction is important.

Example:

```text
Behavior:
A staged semantic result is immutable.

Evidence:
A production-path integration case must prove a conflicting stage cannot replace it.
```

A production implementation may be correct while required evidence remains missing.

The workflow must be able to represent:

```text
implemented_unproven
```

instead of pretending that behavior and evidence are the same thing.

---

# 8. Closure status model

Each Review Contract row MUST be evaluated with a small deterministic status set.

Recommended statuses:

```text
UNRESOLVED
IMPLEMENTED_UNPROVEN
PROVEN
BLOCKED_ENVIRONMENT
BLOCKED_AUTHORITY
NOT_APPLICABLE
```

Rules:

- `PROVEN` means the required ticket-authorized behavior/evidence has been demonstrated with the correct harness and observations.
- `IMPLEMENTED_UNPROVEN` means implementation appears present but the ticket-required proof is absent or insufficient.
- `BLOCKED_ENVIRONMENT` is allowed only for an actual environmental inability to execute required validation.
- `BLOCKED_AUTHORITY` means the frozen ticket does not contain enough authority to choose the needed behavior.
- `NOT_APPLICABLE` requires an explicit reason tied to the ticket.
- Passing a generic test suite is not automatically `PROVEN`.
- Representative coverage is not automatically sufficient when the ticket explicitly requires named scenarios.
- A weaker harness is not a substitute when the ticket explicitly requires a stronger harness.

---

# 9. Evidence sufficiency rules

The shared protocol MUST explicitly define how evidence is judged.

## 9.1 Harness specificity matters

If a ticket requires:

```text
Compose worker integration
actual pg-boss worker
real PostgreSQL roles
actual Atlas route
mock HTTP Mistral
```

then these are not equivalent proof:

```text
unit test
injected fetch double
pure provider test
isolated client test
PostgreSQL-free test
generic full-suite pass
```

Those may still be useful regressions, but they cannot replace an explicitly required ticket harness.

## 9.2 Scenario specificity matters

If the ticket explicitly requires:

```text
acknowledgement loss
delivery outage
restart after staging
restart after acceptance
duplicate jobs
lease expiry
conflicting stage
cancellation
orderly stop
```

then proving three representative cases does not close all rows.

## 9.3 Observation specificity matters

If the requirement depends on:

```text
provider call count
Atlas logical effect count
lease generation
replay row identity
cleanup
bounded redacted error
```

the evidence must actually observe those properties.

An indirect green test does not prove an explicitly required observation.

## 9.4 Existing evidence must be reused

The protocol MUST prevent redoing already proven work without cause.

Once a row is `PROVEN`, later remediation should reuse that accepted evidence unless:

- the remediation directly invalidates it;
- CK identifies a direct regression affecting it;
- the relevant code or contract changed inside the authorized remediation.

---

# 10. READY_FOR_CK

Introduce a shared internal readiness concept:

```text
READY_FOR_CK
```

This is NOT PASS.

It is an implementer/remediator readiness gate.

GO and CFC MUST use the same Review Contract interpretation as CK before handoff.

A checkpoint is `READY_FOR_CK` only when:

1. every applicable Review Contract row in the authorized scope is `PROVEN`; or
2. a required row is explicitly `BLOCKED_ENVIRONMENT` and the ticket/workflow permits review with that limitation; and
3. there is no known unresolved ticket-authorized obligation that CK would predictably reject; and
4. required validation has been executed with the correct harness; and
5. the checkpoint record contains enough evidence for CK to verify the work without reconstructing basic completion conditions.

GO/CFC MUST NOT call this PASS.

They may record:

```text
Internal readiness: READY_FOR_CK
```

or equivalent wording.

If not ready, they MUST continue working within the existing authorized execution instead of prematurely handing to CK.

---

# 11. GO redesign

Update `.agents/skills/go/SKILL.md`.

GO remains responsible for initial ticket implementation.

Add these requirements.

## 11.1 GO preflight

Before implementation GO MUST:

1. resolve the active ticket using the shared protocol;
2. derive/read the full Review Contract;
3. identify every current-ticket implementation row;
4. identify every validation/evidence row;
5. identify the exact harness required by those rows;
6. distinguish implementation obligations from proof obligations;
7. identify forbidden scope expansion;
8. determine what CK will be allowed to inspect for this ticket.

GO MUST NOT start coding from only the ticket title or Outcome section.

## 11.2 GO execution

GO implements the complete authorized ticket, not only the easiest path to a green focused test.

GO should use the Review Contract as a work checklist.

When a ticket explicitly names multiple required scenarios, GO must treat them as part of implementation completion even if they are mostly test/evidence work.

## 11.3 GO shadow-CK readiness check

Before committing/handoff, GO MUST evaluate every applicable Review Contract row using CK-compatible evidence sufficiency semantics.

Conceptually:

```text
for each review_contract_row:
    identify required evidence
    identify actual evidence
    determine closure status
```

GO MUST NOT hand off when a row is knowingly:

```text
UNRESOLVED
IMPLEMENTED_UNPROVEN
BLOCKED_AUTHORITY
```

GO must not say "CK can discover the rest."

GO must not use CK as a requirements-discovery phase.

## 11.4 GO checkpoint requirements

The GO checkpoint MUST include a compact Review Contract closure summary.

Example:

```text
Review Contract closure:
- RC-01 production structured dispatch: PROVEN
- RC-02 acknowledgement-loss replay: PROVEN
- RC-03 duplicate logical effect prevention: PROVEN
- RC-04 invalid credentials fail closed: PROVEN
- RC-05 cancellation production path: PROVEN
- RC-06 orderly active-worker stop: PROVEN

Internal readiness: READY_FOR_CK
State: awaiting_review
```

This is not a self-review PASS.

It is evidence that GO believes the frozen ticket is complete under the same contract CK will use.

## 11.5 GO must not consume CK remediation work

Keep the existing rule:

A CK `CHANGES_REQUIRED` result belongs to CFC unless HMN explicitly returns the ticket to GO because no remediation checkpoint exists and initial ticket implementation was never completed.

---

# 12. CK redesign

Update `.agents/skills/ck/SKILL.md`.

CK remains the independent review authority.

## 12.1 First review MUST be exhaustive within ticket authority

The first CK review MUST traverse the complete Review Contract.

The phrase "one consolidated review" must mean:

> all currently identifiable ticket-bound deficiencies that a competent review of the frozen contract and submitted evidence can surface must be included in this first review.

CK MUST NOT intentionally stop after the first serious finding.

CK MUST inspect enough of the ticket and evidence to produce a complete bounded review.

## 12.2 CK findings need closure clauses

Each finding MUST include all known closure conditions.

Do not create vague findings such as:

```text
CK-002: integration coverage is incomplete
```

when the ticket clearly identifies the missing categories.

Instead structure it conceptually as:

```text
CK-002: required production integration matrix is incomplete

Closure clauses:
- CK-002.a acknowledgement-loss path
- CK-002.b delivery outage
- CK-002.c restart after staging
- CK-002.d restart after acceptance
- CK-002.e duplicate job
- CK-002.f lease expiry/fencing
- CK-002.g conflicting stage
- CK-002.h credential rejection
- CK-002.i request/response bounds
- CK-002.j cancellation
- CK-002.k orderly in-flight stop
```

The exact format may be markdown bullets or a table.

The important property is that CFC and HMN can determine exactly what closes the finding.

## 12.3 Each closure clause must trace to ticket authority

Every finding and subcondition MUST identify:

- the ticket requirement it enforces;
- the evidence showing it is not satisfied;
- the observable correction/evidence needed.

CK must not add a clause merely because it would be good engineering practice.

## 12.4 CK freezes the finding closure contract

Once the first consolidated CK artifact is written, the closure clauses for those findings become frozen for later CFC verification.

Post-CFC CK must verify those clauses.

It must not silently make them stronger.

---

# 13. REVIEW_CONTRACT_GAP

Introduce a specific workflow concept:

```text
REVIEW_CONTRACT_GAP
```

This is NOT an ordinary CK finding result.

It is used when later CK verification discovers a ticket-authorized obligation that:

1. was reasonably identifiable during the first consolidated review;
2. was not included in the original finding closure conditions;
3. is not a direct regression caused by the remediation.

In this situation CK MUST NOT claim that CFC failed an unstated requirement.

Instead record:

```text
REVIEW_CONTRACT_GAP
```

with:

- omitted ticket authority;
- why it matters;
- why it was not part of the frozen finding closure contract;
- whether it affects final ticket completion;
- handoff to human/planning authority.

This exposes reviewer incompleteness instead of converting it into endless CFC failure.

HMN/human authority may then decide whether to:

- authorize extension of the review contract;
- return to GO;
- authorize a new bounded CFC;
- amend the ticket;
- reject the newly surfaced interpretation.

The initial CK review SHOULD make this rare.

---

# 14. CK post-CFC verification

Post-CFC CK MUST remain narrower than first review.

Verify only:

1. original unresolved closure clauses;
2. remediation diff;
3. evidence required for those clauses;
4. direct regressions introduced by the remediation.

Allowed outcomes:

```text
PASS
CHANGES_REQUIRED
REVIEW_CONTRACT_GAP
```

`CHANGES_REQUIRED` after CFC is valid only when:

- an original closure clause remains unresolved; or
- the remediation introduced a direct regression necessary to evaluate that same authorized scope.

CK MUST NOT restart a broad ticket review.

CK MUST NOT introduce unrelated findings.

CK MUST NOT require a stronger harness than the frozen finding required unless the original requirement already demanded it.

---

# 15. CFC redesign

Update `.agents/skills/cfc/SKILL.md`.

CFC remains a bounded implementation repair command.

## 15.1 CFC preflight must load the same Review Contract

CFC MUST read:

1. active frozen ticket;
2. shared Review Contract;
3. latest CK artifact;
4. original finding closure clauses;
5. reviewed commit;
6. current remediation base;
7. active HMN authorization when required.

CFC must not operate from the CK prose alone.

The frozen ticket and shared Review Contract remain the meaning behind the CK finding.

## 15.2 Build a Finding Closure Matrix

Before changing code, CFC MUST construct the bounded closure matrix for the findings it is authorized to remediate.

Example:

```text
Finding CK-002

CK-002.a acknowledgement loss        PROVEN
CK-002.b delivery outage             UNRESOLVED
CK-002.c restart after staging       PROVEN
CK-002.d cancellation                UNRESOLVED
CK-002.e orderly stop                UNRESOLVED
```

This matrix becomes the implementation checklist for the remediation.

## 15.3 CFC must complete the whole authorized finding before handoff

CFC MUST NOT hand off merely because it fixed one portion of a multi-clause finding.

If the authorized CK finding has 12 closure clauses and only 10 are proven:

```text
CFC_NOT_READY_FOR_CK
```

CFC should continue within the same authorized cycle as long as:

- the remaining work is inside the same frozen ticket;
- it is inside the same finding;
- the current authorization permits it;
- the execution session is still active.

Do not unnecessarily split one finding into multiple conceptual remediation cycles.

## 15.4 Execution-window interruption is not remediation completion

If the coding/execution environment stops before CFC completes its authorized closure matrix:

- do not create a completed remediation checkpoint;
- do not mark `awaiting_review`;
- do not consume the cycle as though work were finished;
- preserve partial in-scope work;
- report that the current CFC is interrupted/incomplete.

A later HMN may issue:

```text
CONTINUE_CURRENT_CFC
```

when the evidence shows the same authorized remediation is simply unfinished.

This is not a new remediation cycle.

## 15.5 CFC shadow-CK readiness check

Before commit/handoff, CFC MUST run the same evidence-sufficiency check CK will use for the authorized closure clauses.

CFC must ask:

```text
If CK verifies exactly the frozen closure clauses now, does the evidence satisfy each one?
```

If the answer is no, CFC continues.

## 15.6 CFC checkpoint

The remediation checkpoint MUST show closure per clause.

Example:

```text
Finding closure:
- CK-002.a: PROVEN
- CK-002.b: PROVEN
- CK-002.c: PROVEN
- CK-002.d: PROVEN

Direct regressions checked: none observed.
Internal readiness: READY_FOR_CK.
State: awaiting_review.
```

---

# 16. HMN redesign

Update `.agents/skills/hmn/SKILL.md`.

HMN remains delegated human/planning authority.

It MUST become simpler and more deterministic by consuming the same frozen Review Contract and CK closure matrix.

## 16.1 HMN must not reconstruct acceptance from scratch

HMN MUST NOT progressively invent:

- additional scenarios;
- stronger validation;
- new evidence rules;
- new harness requirements;

unless those are already traceable to:

- the frozen ticket;
- the shared Review Contract;
- the original CK closure clauses;
- a direct remediation regression.

HMN's job is not "predict what CK might ask for next."

HMN's job is:

```text
inspect blocked state
-> identify unresolved frozen closure rows
-> classify authority
-> authorize the smallest valid continuation
```

## 16.2 HMN diagnosis

HMN MUST reconstruct:

- active ticket;
- active Review Contract;
- latest CK result;
- frozen CK closure matrix;
- latest CFC state;
- already proven rows;
- unresolved rows;
- direct regressions, if any;
- current worktree state.

## 16.3 HMN authorization scope

For a new CFC cycle, HMN should authorize exact unresolved closure rows.

Example:

```text
Decision: AUTHORIZE_EVIDENCE_REMEDIATION

Authorized unresolved rows:
- CK-002.h
- CK-002.i
- CK-002.j
- CK-002.k

Already resolved and forbidden from reopening:
- CK-001
- CK-002.a through CK-002.g
```

HMN MUST explicitly protect already resolved rows from unnecessary redesign.

## 16.4 HMN must recognize reviewer contract gaps

If CK attempts to introduce a new non-regression expectation during post-CFC verification that was not in the frozen closure matrix, HMN must classify whether this is:

```text
REVIEW_CONTRACT_GAP
```

rather than automatically authorizing another CFC.

If the new expectation has no frozen-ticket authority:

```text
HUMAN_DECISION_REQUIRED
```

or reject it as out of scope according to the existing workflow semantics.

If the expectation is ticket-authorized but genuinely omitted from the original review contract, HMN may authorize one bounded contract-extension remediation only after explicitly recording the gap.

## 16.5 HMN authorization remains one-cycle only

Preserve current safety:

A new post-CFC remediation cycle still requires a new explicit user `hmn` invocation.

The shared Review Contract does NOT make the workflow autonomous.

---

# 17. Shared artifact semantics

The implementation MAY persist Review Contract material inside existing feedback/checkpoint artifacts instead of creating a new permanent file per ticket.

However, all skills need deterministic access to the same interpretation.

Recommended approach:

## First GO checkpoint

Record:

```text
## Review Contract Closure

| Row | Ticket authority | Required proof | Status |
| --- | --- | --- | --- |
| RC-001 | Acceptance 1 | ... | PROVEN |
...
```

## First CK artifact

Record:

```text
## Frozen Finding Closure Matrix
```

with finding IDs and closure clauses.

## CFC checkpoint

Record only authorized unresolved clauses and their new status.

## HMN artifact

Reference unresolved closure clause IDs instead of rewriting the whole ticket expectation from scratch.

Codex may use another equivalent representation if it is clearer, but the protocol MUST be deterministic and durable.

---

# 18. Stable identifiers

Use stable identifiers so artifacts can reference the same requirement.

Recommended pattern:

```text
RC-001
RC-002
RC-003
```

CK findings:

```text
CK-001
CK-002
```

Finding closure clauses:

```text
CK-002.a
CK-002.b
CK-002.c
```

Do not renumber earlier clauses in later artifacts.

New clauses are forbidden during normal post-CFC verification except through explicit `REVIEW_CONTRACT_GAP` handling.

---

# 19. Scope-lock rules

Add the following shared rules.

## 19.1 Ticket wording beats reviewer preference

If CK wants stronger proof than the ticket requires, that is not mandatory.

## 19.2 Explicit ticket validation beats generic test convenience

If the ticket requires a particular integration harness, a smaller test is not a substitute.

## 19.3 Existing approved predecessor work remains closed

Do not reopen old tickets merely because a later ticket touches nearby code.

## 19.4 Direct regressions are valid post-CFC blockers

A remediation may create a regression inside behavior necessary for the authorized finding.

CK may block on that direct regression.

This does not permit broad review expansion.

## 19.5 Future-ticket work stays future-ticket work

Do not implement downstream requirements early just to make CK "more confident."

---

# 20. Required changes to GO

Codex MUST update GO so it explicitly states:

1. resolve the active ticket through the shared protocol;
2. derive/read the full Review Contract before implementation;
3. treat ticket validation requirements as implementation completion obligations;
4. use required harnesses and observations exactly as specified;
5. perform a shadow-CK readiness check;
6. do not hand off while a known row is unresolved or implemented-but-unproven;
7. write Review Contract closure evidence in the checkpoint;
8. record `READY_FOR_CK`, never PASS;
9. preserve old GO authority and scope restrictions;
10. do not remediate CK findings without correct workflow authority.

---

# 21. Required changes to CK

Codex MUST update CK so it explicitly states:

1. use the same active ticket resolution and Review Contract;
2. first review must be exhaustive within frozen-ticket authority;
3. all currently identifiable ticket-derived deficiencies must be consolidated;
4. findings must include closure clauses;
5. each clause must trace to exact ticket authority;
6. post-CFC verification may only verify frozen clauses and direct regressions;
7. CK may not silently strengthen a finding;
8. omitted later ticket-authorized expectations become `REVIEW_CONTRACT_GAP`;
9. specialist guidance cannot create requirements;
10. CK remains sole ordinary PASS authority.

---

# 22. Required changes to CFC

Codex MUST update CFC so it explicitly states:

1. read shared Review Contract plus CK closure matrix;
2. construct a Finding Closure Matrix before remediation;
3. remediate the entire authorized finding scope, not a convenient subset;
4. preserve already proven rows;
5. do not hand off while authorized clauses remain unresolved;
6. interrupted execution is not a completed remediation cycle;
7. use `CONTINUE_CURRENT_CFC` semantics for valid interrupted work;
8. run a shadow-CK readiness check before commit;
9. checkpoint evidence must map to closure clauses;
10. one completed CFC commit still returns to CK.

---

# 23. Required changes to HMN

Codex MUST update HMN so it explicitly states:

1. consume the shared active Review Contract;
2. consume the frozen CK closure matrix;
3. identify only unresolved rows;
4. protect already resolved rows;
5. authorize the smallest bounded continuation;
6. do not progressively invent the expected result;
7. detect `REVIEW_CONTRACT_GAP`;
8. distinguish incomplete CFC execution from a completed failed remediation;
9. continue an interrupted CFC without creating a fake new remediation cycle;
10. preserve explicit-user-invocation requirement for every new remediation cycle.

---

# 24. Required cross-skill consistency section

Each of the four skill files MUST contain a short explicit statement equivalent to:

```text
Shared interpretation rule:

GO, CK, CFC, and HMN MUST derive active-ticket scope, acceptance obligations,
validation obligations, evidence sufficiency, and finding closure from the
same shared Atlas Review Contract protocol.

A skill MUST NOT substitute its own broader or narrower interpretation.
```

Do not copy the entire shared protocol into each skill.

Reference the shared file.

---

# 25. Workflow examples

The shared protocol should contain at least these examples.

## 25.1 Correct GO behavior

Ticket requires:

```text
implementation A
integration scenarios B, C, D
Compose harness
specific observation E
```

GO implements A and only B/C pass.

Correct result:

```text
NOT READY FOR CK
```

GO continues with D/E.

Incorrect result:

```text
awaiting_review because the main code is complete
```

## 25.2 Correct CK first review

Ticket clearly requires five integration scenarios.

GO proves two.

CK first review must identify all three missing scenarios in the consolidated finding.

It must not reveal them one at a time over later remediation passes.

## 25.3 Correct CFC behavior

CK-002 has four closure clauses.

CFC fixes two.

Correct result:

```text
CFC_NOT_READY_FOR_CK
```

Continue same authorized remediation.

Do not commit a partial closure merely to ask CK what remains.

## 25.4 Correct HMN continuation

CFC was interrupted by execution-window exhaustion before commit.

Partial work is in scope and no CK handoff occurred.

Correct HMN decision:

```text
CONTINUE_CURRENT_CFC
```

Not:

```text
AUTHORIZE_NEXT_CFC
```

## 25.5 Correct REVIEW_CONTRACT_GAP

First CK finding says only:

```text
prove duplicate-job replay and lease expiry
```

CFC proves both.

Post-CFC CK suddenly requires cancellation coverage from the same frozen ticket, and cancellation was already clearly identifiable during first review.

Correct handling:

```text
REVIEW_CONTRACT_GAP
```

Do not blame CFC for failing an unstated closure condition.

---

# 26. IDSER-005 regression case

Use the existing IDSER-005 history as a workflow regression example.

The redesigned skills should recognize from the IDSER-005 frozen ticket that validation includes production-path evidence for, among other things:

- both authorized semantic skills;
- acknowledgement loss;
- delivery outage;
- restart after staging;
- restart after Atlas acceptance;
- restart before cleanup;
- duplicate jobs;
- lease expiry/fencing;
- conflicting replay staging;
- missing credential;
- invalid credential;
- malformed JSON/schema;
- request/response limits;
- timeout;
- cancellation;
- orderly worker stop.

The original focused semantic tests must not be considered sufficient simply because they passed.

Under the redesigned GO semantics, missing production-path rows should result in:

```text
IMPLEMENTED_UNPROVEN
```

and GO should remain in implementation instead of handing an obviously incomplete validation contract to CK.

Under redesigned CK semantics, if GO nevertheless submits such a checkpoint, the first review must enumerate the complete known closure requirement, rather than letting the same finding expand across many HMN/CFC cycles.

Under redesigned CFC semantics, one authorized remediation must attempt to close the complete frozen finding matrix before handing back to CK.

---

# 27. IDSER-004 regression case

Use the IDSER-004 remediation history as another regression example.

A broad evidence finding such as cancellation, boundary handling, atomicity, terminal race ordering, redaction, and real HTTP behavior must be decomposed into explicit closure clauses during the first review.

Later CFC cycles must not discover one previously implicit clause at a time.

If the first CK review omitted an identifiable clause and later CK introduces it, the workflow must recognize a `REVIEW_CONTRACT_GAP`.

---

# 28. Review-loop prevention

Preserve and strengthen the existing bounded-loop design.

Normal path:

```text
GO
-> CK
-> PASS
```

or:

```text
GO
-> CK CHANGES_REQUIRED
-> CFC
-> CK
-> PASS
```

If post-CFC CK still returns `CHANGES_REQUIRED` because an original closure clause remains unresolved or a direct remediation regression exists:

```text
return to human/planning authority
```

A new explicit user `hmn` invocation may authorize one additional cycle.

The redesign MUST NOT introduce:

```text
automatic CFC
automatic CK
automatic HMN
```

No skill may recursively invoke the next skill.

The commands remain user-controlled.

---

# 29. Compatibility requirements

The redesign MUST remain compatible with existing feedback artifacts.

Do not require rewriting historical artifacts.

New skills should be able to interpret older CK artifacts that lack explicit closure clause IDs.

For legacy artifacts:

1. derive the closure matrix from:
   - frozen ticket;
   - existing CK finding;
   - existing evidence;
2. freeze that derived matrix at the next applicable workflow event;
3. record that it is a legacy normalization;
4. do not rewrite old files.

This is important because current IDSER tickets already have active remediation history.

---

# 30. No production application changes

This implementation is a workflow/skill change.

Unless a repository test harness for skills requires it, Codex MUST NOT modify:

- Atlas production application behavior;
- database schema;
- agents bridge runtime;
- provider implementation;
- application routes;
- deployment configuration;
- current IDSER production code.

The scope is skill protocol and its associated workflow tests/documentation only.

Do not opportunistically fix IDSER-005 itself while implementing this context.

---

# 31. Skill regression tests

If the repository has tests for skill definitions/workflow semantics, update them.

If it does not, add the smallest deterministic test/document fixture needed to verify the new protocol.

At minimum test these cases conceptually.

## Test A - GO cannot prematurely hand off

Given a ticket with:

```text
3 required validation scenarios
```

and evidence for only 2:

Expected:

```text
READY_FOR_CK = false
```

## Test B - CK first review is consolidated

Given 4 ticket-authorized missing conditions:

Expected first CK artifact:

```text
one consolidated review containing all 4
```

not one condition per review cycle.

## Test C - CFC partial remediation does not hand off

Given a CK finding with 4 closure clauses and only 3 satisfied:

Expected:

```text
CFC_NOT_READY_FOR_CK
```

## Test D - CK cannot move the goalposts

Given a frozen finding matrix and successful remediation:

A later non-regression requirement that was omitted from the first review must produce:

```text
REVIEW_CONTRACT_GAP
```

not ordinary `CHANGES_REQUIRED` against CFC.

## Test E - Direct regression remains blockable

If CFC closes the original clause but directly breaks required behavior in the same scope:

Expected:

```text
CHANGES_REQUIRED
```

is valid.

## Test F - HMN continues interrupted work

Given:

- active valid CFC authorization;
- uncommitted in-scope partial work;
- no CK handoff;
- no remediation commit;

Expected:

```text
CONTINUE_CURRENT_CFC
```

## Test G - Out-of-scope CK suggestion

Given reviewer suggestion with no ticket authority:

Expected:

- not a CFC requirement;
- recorded as scope-change observation or ignored as non-authoritative according to existing CK rules.

---

# 32. Documentation quality requirements

All modified skill files MUST:

- remain concise enough for agents to apply reliably;
- use normative MUST / MUST NOT language for critical invariants;
- avoid contradictory authority descriptions;
- avoid duplicating the entire shared protocol;
- preserve current command triggers;
- preserve existing bounded-loop protections;
- preserve current user delegation semantics for HMN;
- be UTF-8;
- avoid mojibake;
- use ordinary ASCII punctuation where possible;
- avoid smart quotes and malformed dash characters.

---

# 33. Required implementation sequence

Codex should implement in this order:

```text
1. inspect current go / ck / cfc / hmn skills
2. inspect current skill/workflow tests
3. add shared atlas-ticket-review-contract protocol
4. update GO to consume it
5. update CK to consume it
6. update CFC to consume it
7. update HMN to consume it
8. add/update deterministic workflow regression tests
9. run skill/workflow validation
10. inspect final diff for duplicated or contradictory rules
```

Do not change semantics in only one skill.

The implementation is incomplete unless all four skills converge on the same Review Contract model.

---

# 34. Acceptance criteria for this implementation

The skill redesign is complete only when all of the following are true.

## AC-01 Shared active-ticket interpretation

GO, CK, CFC, and HMN resolve the same active ticket using one shared protocol.

## AC-02 Shared completion interpretation

All four commands derive acceptance, validation, evidence, and scope from the same Review Contract.

## AC-03 GO readiness gate

GO does not hand a checkpoint to CK while known ticket-authorized obligations remain `UNRESOLVED` or `IMPLEMENTED_UNPROVEN`.

## AC-04 CK completeness

First CK review produces a complete consolidated set of currently identifiable ticket-bound findings and closure conditions.

## AC-05 Frozen finding contract

Later CK verification cannot silently strengthen a finding.

## AC-06 Review contract gap detection

A later omitted non-regression ticket requirement is classified as `REVIEW_CONTRACT_GAP`.

## AC-07 CFC full closure

CFC does not hand back a partially resolved multi-clause finding merely to discover what CK asks next.

## AC-08 HMN deterministic authorization

HMN authorizes unresolved Review Contract / CK closure rows instead of reconstructing review expectations from scratch.

## AC-09 Interrupted CFC semantics

Execution interruption without a committed handoff remains the same CFC cycle and can be resumed through `CONTINUE_CURRENT_CFC`.

## AC-10 No scope expansion

The redesign does not permit generic best practices, future dependency work, or reviewer preference to become mandatory ticket scope.

## AC-11 CK remains PASS authority

No other command gains PASS authority.

## AC-12 Bounded remediation remains user-controlled

A new remediation cycle after post-CFC failure still requires explicit user HMN delegation.

## AC-13 Legacy compatibility

Existing feedback artifacts remain usable without rewrite.

## AC-14 No product-code drift

This implementation changes workflow skills/protocol/tests only unless a test-support change is strictly required.

---

# 35. Definition of done

Do not consider this task finished merely because the four SKILL.md files mention "Review Contract."

The implementation is done when:

1. a canonical shared protocol exists;
2. all four skills explicitly consume it;
3. GO has a pre-handoff shadow-CK readiness gate;
4. CK has exhaustive first-review semantics;
5. CK findings have frozen closure conditions;
6. `REVIEW_CONTRACT_GAP` exists and is handled consistently;
7. CFC has full finding-closure semantics;
8. interrupted CFC is distinct from completed remediation;
9. HMN authorizes unresolved rows instead of re-deriving expectations;
10. loop-prevention semantics remain intact;
11. tests or deterministic fixtures prove the core workflow cases;
12. final documentation contains no mojibake;
13. no unrelated Atlas application work was introduced.

---

# 36. Final intended workflow

After implementation, the mental model must be:

```text
                 ACTIVE FROZEN TICKET
                         |
                         v
             SHARED REVIEW CONTRACT
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
       GO               CFC              HMN
 implements full      closes frozen     authorizes
 ticket contract      CK clauses        unresolved rows
        |                |                |
        +----------------+----------------+
                         |
                         v
                        CK
             verifies the SAME contract
```

The important invariant is:

```text
GO, CK, CFC, and HMN may have different authorities,
but they MUST NOT have different definitions of ticket completion.
```

GO knows what CK will require before handoff.

CK communicates the complete ticket-derived closure requirement in the first review.

CFC knows the full closure target before remediation.

HMN knows exactly which unresolved target it is authorizing.

That is the behavior this implementation must establish.

# Atlas GO / CK / CFC Workflow Restoration Context

## Status

Implementation context for replacing the current `go`, `ck`, and `cfc` workflow skills with thin skill wrappers that restore the older documented Atlas review workflow.

## Objective

Restore the original Atlas implementation-review philosophy:

```text
frozen ticket
    |
    v
go
    |
    v
bounded implementation
    |
    v
required validation
    |
    v
commit
    |
    v
awaiting_review
    |
    v
ck
    |----------------------|
    |                      |
    v                      v
PASS               CHANGES_REQUIRED
    |                      |
    v                      v
approved                 cfc
    |                      |
    v                      v
go next ticket     bounded remediation
                           |
                           v
                         commit
                           |
                           v
                    awaiting_review
                           |
                           v
                    ck verification
                           |
                 |---------|---------|
                 v                   v
               PASS           STOP FOR HUMAN
```

The workflow must again be controlled by the frozen ticket and the documented ticket-set review rules.

The `go`, `ck`, and `cfc` skills must remain callable skills, but they must be thin executors of the documented workflow. They must not become an independent governance layer that can expand scope, reinterpret approved dependencies, or create new mandatory implementation requirements.

---

## Why This Change Is Required

The older Atlas workflow was intentionally simple:

1. Define a bounded ticket against approved product and architecture baselines.
2. Implement only the currently authorized ticket or review batch.
3. Validate the real boundary and the required regression boundary.
4. Commit the checkpoint and mark it `awaiting_review`.
5. Use `ck` for one consolidated review, `cfc` for the bounded remediation pass, and `go` before beginning the next dependency-ready ticket.

The older repository guidance also established these important rules:

- approved predecessor checkpoints are frozen;
- later tickets consume approved predecessors only through their published interfaces and authority boundaries;
- new provider decisions, architecture decisions, runtime decisions, product behavior, or other new requirements are scope decisions;
- a later ticket must not silently reopen an approved predecessor;
- new requirements become scope changes rather than implementation work.

The current workflow skills added substantially more review machinery:

- CK review rounds;
- convergence state;
- `LATE_DISCOVERY`;
- `REMEDIATION_INCOMPLETE`;
- `REMEDIATION_REGRESSION`;
- `REVIEW_CONVERGENCE_BLOCKED`;
- automatic specialist review expansion;
- broader dependency inspection;
- repeated `ck -> cfc -> ck -> cfc` review behavior.

This additional machinery made the workflow capable of drifting away from the frozen ticket.

The replacement must restore the older behavior.

---

## Historical Reference

The workflow existed in repository documentation before it was formalized into skills.

Relevant transition:

```text
commit 9f0d289abd8f5127dc70644a26ad194c21b9658a
docs: formalize go ck cfc workflow
```

The parent baseline immediately before that formalization is:

```text
df594cb2883890ff8216175e82329e985f23aa71
```

Use the repository documentation at or before that baseline as historical guidance for the old workflow semantics.

Do not blindly revert the repository to that commit.

The goal is to restore the old workflow philosophy while preserving valid current project structure, tickets, implementation work, and unrelated skills.

---


# 0. Replacement Mode: Full Skill Replacement

This is a FULL REPLACEMENT of the existing GO, CK, and CFC skill definitions.

Do NOT incrementally edit, patch, preserve, merge, or layer the current workflow logic into the restored workflow.

For these three files:

```text
.agents/skills/go/SKILL.md
.agents/skills/ck/SKILL.md
.agents/skills/cfc/SKILL.md
```

perform the equivalent of:

```text
delete existing SKILL.md contents completely
-> recreate SKILL.md from scratch
-> implement only the restored old workflow semantics defined in this context
```

The current skill implementations must not survive as hidden or residual behavior.

In particular, remove rather than adapt the current machinery for:

```text
multi-round CK lifecycle
MAX_CK_ROUNDS
Round 1 / Round 2 / Round 3 governance
LATE_DISCOVERY workflow
REMEDIATION_INCOMPLETE workflow
REMEDIATION_REGRESSION workflow
convergence scoring
IMPROVING / STALLED / REGRESSING
REVIEW_CONVERGENCE_BLOCKED
automatic repeated CK/CFC cycling
automatic specialist-skill scope expansion
dependency-wide requirement inheritance
review-created requirement authority
```

Do not retain compatibility branches for the newer workflow inside these three skills.

The restored skills should be small, direct, and understandable independently.

Their responsibilities are exactly:

```text
GO
= implement the currently authorized frozen ticket

CK
= perform one consolidated review of the committed checkpoint
  OR, after CFC, verify only the prior consolidated findings and direct
  remediation regressions

CFC
= perform the single bounded remediation pass for accepted in-scope
  findings from the first CK
```

This full replacement applies only to the three workflow skill definitions.

Do not delete unrelated repository skills.

Do not delete historical review artifacts.

Do not revert application/product implementation.


# 1. Core Authority Rule

The frozen current ticket is the executable implementation and review contract.

Use this authority order:

```text
current frozen ticket
    >
explicit current-ticket source references
    >
only the published dependency interfaces/boundaries that the current ticket consumes
    >
repository implementation evidence
    >
general engineering or specialist-skill guidance
```

Repository state may help determine HOW to satisfy the ticket.

Repository state must not independently add WHAT must be implemented.

A review skill, specialist skill, dependency document, test, runtime entrypoint, deployment configuration, framework convention, or repository pattern must not create a new current-ticket requirement unless the frozen current ticket explicitly incorporates that requirement.

---

# 2. Dependency Is Not Scope Inheritance

This rule is mandatory.

An approved dependency contributes only the capabilities, interfaces, invariants, and authority boundaries that the current frozen ticket explicitly consumes.

Dependency status means:

```text
this prerequisite is accepted and may be relied upon
```

It does NOT mean:

```text
all requirements, future work, deferred work, deployment follow-ups,
provider migrations, open planning items, or recommendations mentioned
inside that dependency are inherited by the consuming ticket
```

The current ticket must not inherit:

- deferred work;
- future adapter work;
- future production deployment work;
- future provider selection;
- future infrastructure work;
- unresolved planning items;
- optional recommendations;
- follow-up tickets;
- future security controls;
- future scalability work;

unless the current frozen ticket explicitly imports them.

Approved predecessors are frozen.

If satisfying the current ticket appears to require reopening an approved predecessor beyond its published interface or accepted boundary, that is a scope-change decision and leaves the implementation loop.

---

# 3. Concrete Non-Regression Example: BSS-007 / PCC / R2

This failure mode must be explicitly prevented.

BSS-007 established:

```text
DocumentStore contract
+ local filesystem adapter
+ immutable source-byte semantics
+ opaque storage keys
+ content hash / size / media type
+ replaceable adapter boundary
```

BSS-007 also deliberately mentioned a future S3/R2-compatible durable adapter.

That future adapter was not PCC implementation scope.

PCC explicitly depended on approved BSS-007 and required project creation to use the approved `DocumentStore` contract.

PCC also required the implementation to preserve BSS-007 rather than redesign it.

Therefore a CK review of PCC is allowed to ask:

```text
Does PCC correctly use DocumentStore?
Does PCC preserve the approved DocumentStore boundary?
Can the adapter still be replaced later without changing project semantics?
```

CK is NOT allowed to turn the following into a PCC blocker:

```text
Implement R2.
Implement S3.
Implement a Cloudflare storage adapter.
Change the production deployment target.
Replace the approved local DocumentStore adapter.
Reopen BSS-007 because a future adapter was mentioned there.
```

The correct handling is:

```text
future durable adapter work
    ->
outside current PCC ticket
    ->
scope-change / future-ticket observation if useful
    ->
NOT CHANGES_REQUIRED
    ->
NOT CFC work
```

This example must be preserved in the new workflow rules as a regression guard.

---

# 4. "Production" Does Not Automatically Mean Cloud Deployment

The repository uses "production" in more than one sense.

For Backend Phase tickets, "production" often means:

```text
real Atlas application behavior
instead of fixture/demo behavior
```

That does not automatically mean:

```text
internet production deployment
Cloudflare Worker
R2
S3
hosted infrastructure
production hosting readiness
```

The workflow must distinguish:

```text
production application path
```

from:

```text
production deployment infrastructure
```

A deployment runtime or hosted provider becomes current-ticket scope only when the frozen current ticket explicitly selects or requires it.

Existing Worker, Cloudflare, Vite, Compose, preview, local filesystem, or other runtime paths are repository evidence only unless the current frozen ticket makes them authoritative for the work being reviewed.

---

# 5. Restore GO as a Thin Implementation Command

Replace the current `.agents/skills/go/SKILL.md` behavior with a thin command skill.

GO means:

```text
permission to implement the current bounded ticket
```

GO must:

1. Resolve the current ticket/batch.
2. Verify required predecessor checkpoints are approved/PASS as required by the ticket set.
3. Read the current frozen ticket.
4. Read only the dependency/context material needed to understand the interfaces and boundaries the ticket actually consumes.
5. Implement only the current ticket.
6. Run validation required by the ticket and required directly affected regressions.
7. Commit only the bounded implementation.
8. Record the implementation checkpoint.
9. Mark the ticket `awaiting_review`.
10. Stop and return control to CK.

GO must not:

- author new requirements;
- reopen an approved predecessor;
- import deferred dependency work;
- select a new provider;
- add a new runtime;
- add a new deployment target;
- introduce a new architecture decision not required by the ticket;
- perform unrelated cleanup;
- perform CK review;
- label its own work PASS;
- automatically run CFC;
- create a new scope because repository topology appears to suggest one.

If GO follows a CK PASS, it may update the approved state and advance to the next dependency-ready ticket only when the user's GO authorization allows that advancement.

If the latest CK result is `CHANGES_REQUIRED`, GO must not remediate it. CFC owns the bounded remediation pass.

---

# 6. Restore CK as One Consolidated Review

Replace the current `.agents/skills/ck/SKILL.md` behavior with the older review philosophy.

CK means:

```text
review the committed checkpoint once against the frozen ticket
and produce one consolidated set of in-scope findings
```

## 6.1 First CK

The first CK for a checkpoint performs the full review of the current frozen ticket.

Review only against:

- current ticket scope;
- current ticket acceptance criteria;
- current ticket explicit review requirements;
- explicit current-ticket source references;
- approved dependency interfaces and authority boundaries that the current ticket actually consumes;
- regressions the current ticket explicitly requires to remain green.

CK may inspect repository code broadly enough to understand the implementation.

Broad inspection does not grant broad authority.

A blocking CK finding must identify the violated current-ticket requirement.

A concern discovered in:

- another ticket;
- an approved predecessor;
- repository topology;
- Worker code;
- Cloudflare configuration;
- deployment configuration;
- framework defaults;
- an unrelated test;
- a specialist skill;
- general engineering practice;

does not become a blocker by discovery alone.

## 6.2 Allowed first-CK results

Use only:

```text
PASS
CHANGES_REQUIRED
```

`CHANGES_REQUIRED` is only for implementation-repairable violations of the current frozen ticket.

If CK discovers something that would require:

- reopening an approved predecessor;
- changing the current ticket;
- adding a new provider;
- adding a new runtime;
- adding a new deployment target;
- changing architecture;
- introducing new product behavior;
- deciding an unresolved future policy;

record it separately as a scope-change observation for human/planning consideration.

It must not become CFC work.

## 6.3 One Consolidated Review

CK must make a reasonable full review effort and report one consolidated set of findings.

The purpose is to avoid:

```text
ck
-> finding
-> cfc
-> ck
-> brand new unrelated finding
-> cfc
-> ck
-> brand new unrelated finding
-> ...
```

The first CK is the reviewer's opportunity to inspect the authorized ticket boundary and consolidate the implementation defects it can reasonably identify.

---

# 7. Second CK Is Verification, Not Another Full Review

After CFC commits the bounded remediation, CK may run again only as verification.

The second CK must:

1. read the original consolidated CK findings;
2. inspect the CFC remediation diff;
3. verify whether each original finding was corrected;
4. run or inspect the validation needed to prove those corrections;
5. check only for direct regressions introduced by the CFC remediation in the behavior necessary to assess the original findings.

The second CK must NOT restart broad review.

It must NOT create new unrelated findings such as:

```text
CK-004
CK-005
"while reviewing this again..."
```

A direct remediation regression may be reported because it determines whether the remediation succeeded.

If remediation is still not acceptable after this verification, stop and return control to the user/human authority.

Do not automatically start another `cfc -> ck` cycle.

There is no ordinary Round 3.

---

# 8. Remove Current CK Review-Loop Machinery

Remove ordinary workflow dependence on:

```text
MAX_CK_ROUNDS
Review round 1/2/3 governance
LATE_DISCOVERY
REMEDIATION_INCOMPLETE as a new review-cycle mechanism
REMEDIATION_REGRESSION as a new review-cycle mechanism
IMPROVING
STALLED
REGRESSING
REVIEW_CONVERGENCE_BLOCKED
```

These concepts must not control the normal GO/CK/CFC implementation workflow.

The anti-loop rule is simpler:

```text
one consolidated CK
-> at most one bounded CFC remediation commit
-> one CK verification
-> PASS or return to human/planning authority
```

No automatic third review round.

No automatic second remediation pass.

---

# 9. Restore CFC as One Bounded Remediation Pass

Replace the current `.agents/skills/cfc/SKILL.md` behavior with the old meaning.

CFC means:

```text
resolve accepted in-scope CK feedback
```

CFC may run only after CK returns `CHANGES_REQUIRED`.

CFC must:

1. read the frozen ticket;
2. read the latest consolidated CK review;
3. fix only accepted in-scope implementation findings from that review;
4. preserve approved predecessor boundaries;
5. run finding-specific validation and directly affected regressions;
6. create one bounded remediation commit;
7. identify which CK findings the commit addresses;
8. return the ticket to `awaiting_review`;
9. stop and return control to CK verification.

CFC must not:

- perform a new independent review;
- invent new findings;
- implement scope-change observations;
- reopen approved predecessors;
- implement future dependency work;
- select a new provider;
- select a new runtime;
- select a new deployment target;
- add unrelated refactoring;
- add unrelated cleanup;
- modify ticket acceptance criteria;
- issue PASS;
- automatically invoke another CK/CFC loop.

If an original CK finding cannot be fixed without changing the frozen current ticket or reopening an approved predecessor, CFC must stop and return that item to human/planning authority as a scope-change problem.

---

# 10. Review Artifacts Do Not Create Requirement Authority

Add this invariant:

```text
A CK review artifact is not an independent source of product or implementation requirements.
```

A CK finding is valid because it points to a requirement already present in the frozen ticket authority.

It is not valid merely because CK wrote it.

Therefore CFC must not reason:

```text
CK said to build R2
therefore R2 is required
```

It must reason:

```text
CK finding
    ->
what current-ticket requirement does this finding enforce?
    ->
if no valid current-ticket requirement exists:
do not implement it
```

This prevents review artifacts from laundering reviewer inference into implementation scope.

---

# 11. Specialist Skills Must Not Become Hidden Specifications

The normal CK workflow must not automatically make specialist skills into independent acceptance authorities.

Examples include:

```text
engineering-implementation-review
frontend-awareness
security-refactor-readiness
frontend review gate
UI/UX review protocol
other future specialist review skills
```

These skills may provide reasoning assistance.

They become mandatory review authority only when the current frozen ticket explicitly incorporates their requirement or binding.

Do not allow this:

```text
ticket says implement X
    +
reviewer loads specialist skill
    +
specialist skill contains MUST rule Y
    ->
Y silently becomes current ticket acceptance criterion
```

Instead:

```text
specialist skill discovers concern Y
    ->
does current frozen ticket require Y?
        |
        +-- yes -> valid ticket review finding
        |
        +-- no  -> advisory / future scope observation
```

The ticket remains the authority.

---

# 12. Keep Existing Useful Skills, But Decouple Them From Workflow Authority

Do not delete unrelated skills.

In particular, do not delete:

- `engineering-implementation-review`;
- `engineering-security-refactor-readiness`;
- `frontend-awareness`;
- Atlas extraction/fixture skills;
- other repository-local skills.

They may remain available for explicit use.

The change is:

```text
go / ck / cfc
```

must not automatically allow those skills to expand the ticket.

If a ticket explicitly includes a security-readiness binding, CK must review that declared binding.

If a ticket explicitly includes a frontend review requirement, CK must review that declared requirement.

Do not convert the whole specialist skill into hidden ticket scope.

---

# 13. Repository Documentation Must Be Updated Consistently

Do not replace only the three skill files and leave contradictory workflow documentation elsewhere.

Search the repository for current workflow language including:

```text
MAX_CK_ROUNDS
Maximum review rounds
Review round
Round 1
Round 2
Round 3
LATE_DISCOVERY
REMEDIATION_INCOMPLETE
REMEDIATION_REGRESSION
REVIEW_CONVERGENCE_BLOCKED
Convergence
IMPROVING
STALLED
REGRESSING
one consolidated CK artifact per review round
three CK rounds
```

Update workflow-control documentation that was changed as part of the newer GO/CK/CFC formalization.

Restore the old conceptual rule:

```text
- implement authorized bounded ticket;
- commit and mark awaiting_review;
- ck performs one consolidated review;
- cfc performs at most one bounded remediation pass;
- ck verifies that remediation;
- PASS advances;
- unresolved disagreement/scope expansion returns to human authority;
- new requirements become scope changes.
```

Do not rewrite historical review artifacts.

Do not rewrite already completed ticket history merely to match the new protocol.

The new protocol applies prospectively to future GO/CK/CFC executions.

---

# 14. Backend Phase Review-and-Delivery Wording

Restore the spirit of the older `Backend_Phase/README.md` review section.

The target wording should remain approximately:

```text
Backend work follows the Atlas review protocol:

1. Define a bounded ticket against the approved product and architecture baselines.
2. Implement only the currently authorized ticket or review batch.
3. Validate the real boundary and the fixture/regression boundary it must preserve.
4. Commit the checkpoint and mark it awaiting_review.
5. Use ck for one consolidated review, cfc for the bounded remediation pass,
   and go before beginning the next dependency-ready ticket.

A later implementation may extend an approved boundary, but it must not
silently turn fixtures into production authority, reopen an approved
predecessor, or absorb a new product requirement without a recorded scope change.
```

Equivalent wording is acceptable if the meaning remains unchanged.

---

# 15. Ticket-Set Review Controls

For ticket-set READMEs, prefer the older pattern:

```text
- Keep tickets planned until the user authorizes the relevant batch through go.
- Work only the current ticket or batch.
- Do not begin a dependent ticket from an awaiting_review predecessor.
- After implementation and validation, record the commit and set the ticket to awaiting_review.
- Use one consolidated ck feedback file per batch and at most one remediation
  commit for that review stage.
- New requirements or reopened predecessor work are scope changes.
```

For PCC specifically, preserve this rule:

```text
Any requirement that changes the context or reopens BSS-007/BSS-009 is a
SCOPE_CHANGE, not an implementation detail.
```

Do not weaken it.

---

# 16. Exact Target Behavior

## Normal successful ticket

```text
planned
-> user invokes go
-> implementation
-> validation
-> commit
-> awaiting_review
-> user invokes ck
-> PASS
-> approved
-> user invokes go
-> next dependency-ready ticket
```

## Ticket with implementation defects

```text
planned
-> go
-> implementation
-> validation
-> commit
-> awaiting_review
-> ck
-> one consolidated CHANGES_REQUIRED review
-> cfc
-> one bounded remediation commit
-> awaiting_review
-> ck verification
-> PASS
```

## Remediation still does not satisfy original findings

```text
ck verification
-> original finding still unresolved
-> STOP
-> return control to user/human authority
```

Do not automatically start another CFC pass.

## Review discovers new scope

```text
ck discovers issue
-> issue requires new provider/runtime/architecture/product requirement
   or reopening approved predecessor
-> record as scope-change observation
-> do not make it CHANGES_REQUIRED
-> do not send it to CFC
```

---

# 17. Required Replacement Files

The following three files must be completely rewritten, not patched incrementally:

```text
.agents/skills/go/SKILL.md
.agents/skills/ck/SKILL.md
.agents/skills/cfc/SKILL.md
```

For each of those files, remove the existing skill body in full and recreate the skill from scratch using only the restored workflow defined by this context.

Also inspect and update the governing documentation for consistency, including at minimum:

```text
project's goal/Backend_Phase/README.md
```

Also inspect ticket-set README files and other repository workflow documentation that currently reference the newer multi-round CK model.

Likely locations include:

```text
project's goal/Backend_Phase/tickets/*/README.md
project's goal/atlas-ui/README.md
```

Only update files that actually contain workflow semantics that conflict with this restoration.

Do not make unrelated documentation changes.

---

# 18. Files That Must Not Be Rewritten Merely for Migration

Do not rewrite:

- historical CK review artifacts;
- historical implementation checkpoints;
- completed ticket implementation content;
- accepted architecture decisions;
- source PRDs;
- unrelated skills;
- generated evidence;
- application code;

unless required to repair a direct workflow-document reference.

This change is a workflow-control refactor, not a product implementation refactor.

---

# 19. Acceptance Criteria

The replacement is complete only when all of the following are true.

### GO

- `go` implements only the authorized frozen ticket.
- `go` cannot reopen an approved predecessor.
- `go` cannot inherit deferred dependency work.
- `go` does not perform review.
- `go` leaves implemented work at `awaiting_review`.

### CK

- first `ck` performs one consolidated review;
- blocking findings must map to current frozen-ticket authority;
- accepted dependency documents cannot transitively import deferred work;
- future S3/R2/Cloudflare work in BSS-007 cannot become a PCC blocker;
- new provider/runtime/architecture requirements are scope-change observations;
- CK returns only `PASS` or `CHANGES_REQUIRED` for ordinary implementation review;
- there is no ordinary three-round review lifecycle;
- the post-CFC CK is verification, not another full review;
- post-CFC CK cannot introduce unrelated new findings.

### CFC

- `cfc` fixes only the consolidated accepted in-scope findings;
- `cfc` performs at most one remediation commit for the review stage;
- `cfc` cannot implement scope changes;
- `cfc` cannot treat a CK statement as authority without a current-ticket requirement;
- `cfc` returns the ticket to `awaiting_review`;
- `cfc` never grants PASS.

### Workflow

- the normal maximum automatic cycle is:

```text
go -> ck -> cfc -> ck verification
```

- unresolved issues after verification return to human authority;
- no automatic third CK round;
- no automatic second CFC pass;
- new requirements become scope changes;
- approved predecessor boundaries remain frozen.

---

# 20. Validation / Self-Check Scenarios

After editing the skills, reason through these scenarios and confirm the expected result.

## Scenario A: PCC and R2

Input:

```text
PCC explicitly consumes approved BSS-007 DocumentStore.
BSS-007 mentions future durable S3/R2 adapter.
Repository contains Cloudflare/Worker code.
```

Expected CK behavior:

```text
Review whether PCC correctly uses DocumentStore.
Do not require R2/S3/Cloudflare adapter.
Do not reopen BSS-007.
Do not mark missing R2 as CHANGES_REQUIRED.
```

## Scenario B: Real implementation defect

Input:

```text
Ticket says project creation must call DocumentStore.put for every PRD.
Implementation writes bytes directly into .atlas-data instead.
```

Expected CK behavior:

```text
CHANGES_REQUIRED
```

This is a direct violation of the current ticket.

CFC may correct it.

## Scenario C: Future security idea

Input:

```text
Reviewer notices uploaded PDF malware scanning is not implemented.
Current ticket explicitly leaves malware scanning as future work.
```

Expected CK behavior:

```text
not a blocker
not CFC work
optional future-scope observation only
```

## Scenario D: CFC introduces regression

Input:

```text
CK-001 requires fixing duplicate project submission handling.
CFC fixes CK-001 but directly breaks the same route's successful submission behavior.
```

Expected second CK behavior:

```text
verification fails
report direct remediation regression
STOP for user/human decision
```

Do not start another automatic CFC cycle.

## Scenario E: Unrelated issue discovered during verification

Input:

```text
During post-CFC verification, CK notices an unrelated old UI spacing issue.
```

Expected behavior:

```text
do not create a new blocking finding
do not reopen broad review
do not send to CFC
```

---

# 21. Implementation Discipline

This workflow restoration itself must follow these constraints:

- keep the changes bounded to workflow skill/documentation behavior;
- preserve current valid repository content;
- do not revert application implementation;
- do not revert completed PCC work;
- do not alter BSS-007 implementation;
- do not introduce new workflow states unless absolutely necessary;
- prefer the older repository vocabulary;
- do not create a new meta-framework around GO/CK/CFC;
- keep the three skills readable and short enough that their purpose is obvious.

The desired philosophy is:

```text
Ticket decides the work.
GO implements the ticket.
CK checks the ticket once.
CFC fixes the accepted in-scope feedback once.
CK verifies the fix.
Human authority handles anything beyond that.
```

---

# 22. Encoding and Markdown Safety

All edited Markdown files must:

- be saved as UTF-8;
- preserve valid Markdown;
- avoid mojibake;
- avoid accidental smart-character corruption;
- use ordinary ASCII punctuation where practical;
- preserve existing code fences and repository paths exactly;
- preserve LF line endings unless the repository explicitly requires otherwise.

Do not introduce corrupted sequences such as:

```text
â€™
â€œ
â€
â€“
â€”
```

If existing text contains valid Unicode that is unrelated to this workflow change, do not corrupt it while editing.

---

# 23. Final Deliverable

Implement the workflow restoration and report:

1. files changed;
2. obsolete multi-round/convergence rules removed;
3. restored GO behavior;
4. restored CK first-review behavior;
5. restored post-CFC CK verification behavior;
6. restored CFC bounded-remediation behavior;
7. documentation updated for consistency;
8. confirmation that the BSS-007/PCC/R2 scenario now resolves as out-of-scope future work rather than a PCC blocker;
9. confirmation that no product/application implementation was changed.

Do not begin a product ticket as part of this workflow refactor.

This task ends when the GO/CK/CFC workflow definitions and their governing documentation are internally consistent with the restored protocol.

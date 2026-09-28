# Atlas HMN Workflow Skill - Implementation Context

## Purpose

Add a fourth Atlas implementation-phase workflow skill:

```text
hmn
```

`hmn` is the delegated human/planning-authority command that resolves workflow dead-ends created intentionally by the bounded `go -> ck -> cfc -> ck` protocol.

The current workflow correctly prevents autonomous infinite review/remediation loops:

```text
go
  -> ck
      -> cfc
          -> ck
              -> unresolved
                  -> human/planning authority
```

However, once control returns to human/planning authority, there is no repository-native workflow command that:

1. reconstructs what happened to the ticket;
2. understands the latest implementation, CK findings, CFC remediation, and verification state;
3. diagnoses why the workflow stopped;
4. determines the smallest valid continuation that remains within the frozen ticket;
5. exercises delegated human/planning authority;
6. emits an implementation-ready bounded remediation/continuation authorization that `cfc`, `ck`, or `go` can consume.

`hmn` fills that gap.

The user invoking `hmn` is the explicit delegation event.

The skill must therefore act as delegated human/planning authority for the bounded workflow decision. It must not require a second human confirmation after the `hmn` command unless the issue genuinely requires a new product, architecture, policy, provider, deployment, or approved-predecessor decision that the skill cannot derive from existing ticket authority.

---

# 1. Core workflow model

The implementation-phase command set becomes:

```text
GO
  implementation authority

CK
  independent committed-checkpoint review authority

CFC
  bounded remediation authority

HMN
  delegated human/planning authority for stalled workflow continuation
```

The ordinary successful paths remain unchanged.

## No-remediation path

```text
go
  -> ck
      -> PASS
```

## Single-remediation path

```text
go
  -> ck
      -> CHANGES_REQUIRED
          -> cfc
              -> ck
                  -> PASS
```

## Human-delegated continuation path

```text
go
  -> ck
      -> CHANGES_REQUIRED
          -> cfc
              -> ck
                  -> CHANGES_REQUIRED
                      -> hmn
                          -> bounded authorization
                              -> cfc
                                  -> ck
```

If that later CK again remains unresolved:

```text
ck
  -> CHANGES_REQUIRED
      -> hmn
          -> another explicitly delegated bounded decision
              -> cfc
                  -> ck
```

There must never be an automatic:

```text
ck -> cfc -> ck -> cfc -> ck -> cfc ...
```

Every additional remediation cycle after a bounded post-CFC verification must require a fresh explicit `hmn` invocation by the user.

---

# 2. Meaning of the HMN command

The exact command:

```text
hmn
```

means:

> The user delegates human/planning authority to the HMN workflow skill for the current bounded Atlas ticket situation.

HMN may then inspect the relevant repository evidence, diagnose the current blocked state, and make the workflow decision that a human/planning authority would otherwise have to write manually.

HMN is not merely a recommendation generator.

HMN is not merely an authorization stamp.

HMN must both:

1. understand and assess the stalled workflow; and
2. issue the correct bounded delegated authorization where existing ticket authority permits it.

The resulting HMN authorization must be recognized by `cfc`, `ck`, and `go` as satisfying a prior workflow instruction to "return to human/planning authority".

---

# 3. HMN authority boundary

HMN may exercise delegated authority only inside the already-authorized ticket.

Its authority hierarchy is:

```text
frozen current ticket
> explicit source references incorporated by the ticket
> approved dependency interfaces / invariants / authority boundaries consumed by the ticket
> committed GO / CFC implementation evidence
> CK findings and verification evidence
> current repository/worktree evidence
> HMN reasoning about the smallest valid continuation
```

HMN may:

- interpret an existing ticket requirement;
- determine whether a CK finding still traces to that requirement;
- determine whether a remediation is implementation-repairable;
- determine whether the problem is test/evidence-only;
- determine whether a previous CFC is interrupted but not completed;
- authorize another bounded CFC after CK explicitly returned control to human/planning authority;
- authorize continuation of an already-authorized uncommitted CFC;
- authorize a bounded direct-regression repair caused by the previous remediation;
- direct control back to CK when a committed remediation exists but review has not yet occurred;
- direct control back to GO when implementation never actually reached the required committed checkpoint and no CK-remediation state applies;
- write an exact remediation contract and validation requirement.

HMN must NOT:

- create a new product requirement;
- expand the frozen ticket;
- rewrite acceptance criteria;
- invent a new provider;
- select a new deployment target;
- make an unresolved architecture decision;
- make an unresolved policy decision;
- reopen an approved predecessor merely because implementation is inconvenient;
- authorize future/deferred work from a dependency;
- approve its own remediation as `PASS`;
- implement production code itself;
- perform CFC work itself;
- perform CK review itself;
- convert a reviewer suggestion that lacks ticket authority into mandatory work.

If the blocked state genuinely requires one of those decisions, HMN must return control to the user as:

```text
HUMAN_DECISION_REQUIRED
```

and explain the exact unresolved decision.

---

# 4. HMN must reconstruct current ticket state

When invoked, HMN must not require the user to restate the workflow history if the repository contains enough evidence.

HMN must reconstruct the current ticket state from the relevant bounded evidence.

Inspect, as applicable:

1. the frozen current ticket;
2. the ticket-set README / batch record;
3. the current ticket state;
4. the recorded implementation checkpoint;
5. the latest GO implementation commit;
6. the latest consolidated CK artifact;
7. the latest CFC checkpoint / remediation commit;
8. the latest post-CFC CK verification;
9. any newer HMN authorization artifact;
10. current `HEAD`;
11. current worktree state when partial uncommitted remediation may exist;
12. directly relevant implementation/test/migration/code needed to understand the blockage.

Do not perform a new broad code review.

Inspect only enough repository evidence to understand the blocked ticket and produce the next bounded workflow decision.

---

# 5. HMN state classification

HMN must classify the situation before authorizing anything.

## A. `CONTINUE_CURRENT_CFC`

Use when:

- a valid CFC authorization already exists;
- remediation work has started;
- no remediation commit has been created;
- no handoff to CK has occurred;
- the current worktree contains partial work within the same authorized remediation scope;
- no new ticket requirement or architecture decision is needed.

This must NOT create a new remediation cycle.

It continues the existing one.

---

## B. `AUTHORIZE_NEXT_CFC`

Use when:

- a bounded CFC remediation commit exists;
- CK performed the allowed verification;
- CK returned `CHANGES_REQUIRED`;
- the unresolved problem still traces to the frozen ticket;
- the remaining problem is implementation-repairable;
- CK explicitly returned control to human/planning authority;
- another bounded remediation is required.

This establishes a new bounded remediation cycle.

---

## C. `AUTHORIZE_EVIDENCE_REMEDIATION`

Use when:

- production implementation is already materially correct;
- the frozen ticket requires database/runtime/test evidence;
- CK cannot accept the checkpoint because the test or validation does not prove the required invariant;
- the remaining work should be limited to tests, fixtures, deterministic validation, or evidence collection.

This is a specialized `AUTHORIZE_NEXT_CFC`.

The authorization must explicitly protect already-correct production implementation from unnecessary redesign.

---

## D. `AUTHORIZE_DIRECT_REGRESSION_REPAIR`

Use when:

- the previous bounded remediation introduced a direct regression;
- the regression exists only because of the authorized remediation;
- repairing it is necessary to satisfy the same frozen ticket finding;
- no new ticket requirement is needed.

This is also a bounded CFC authorization.

---

## E. `RETURN_TO_CK`

Use when:

- a bounded implementation/remediation commit already exists;
- the ticket is `awaiting_review`;
- the current worktree does not invalidate the review target;
- no CK verification has yet reviewed that committed checkpoint;
- no new remediation is needed before review.

HMN should not authorize another CFC in this state.

---

## F. `RETURN_TO_GO`

Use only when:

- the workflow never actually reached a committed implementation checkpoint for the frozen ticket;
- there is no applicable CK finding requiring CFC;
- implementation remains authorized by the ticket;
- the correct workflow is to resume or complete GO.

Do not use GO to remediate a `CHANGES_REQUIRED` CK result.

---

## G. `HUMAN_DECISION_REQUIRED`

Use when the situation requires:

- ticket scope change;
- new requirement;
- provider/runtime choice;
- deployment decision;
- architecture decision;
- policy decision;
- reopening an approved predecessor;
- contradiction in frozen ticket authority;
- ambiguous competing product interpretations that repository evidence cannot resolve.

HMN cannot delegate itself authority beyond the ticket.

It must stop and clearly state the decision the user must make.

---

# 6. HMN must provide the remediation solution

For any authorization that enables CFC, HMN must not output only:

```text
authorized
```

It must produce a bounded implementation-ready remediation contract.

The contract must identify:

- the blocked ticket;
- the CK finding(s) being continued;
- the exact reason the workflow stopped;
- the current implementation state;
- the exact remaining defect/evidence gap;
- the frozen-ticket requirement that authorizes the work;
- the exact permitted changes;
- the exact required validation;
- the exact forbidden changes;
- whether this is continuation of the same CFC or a new remediation cycle;
- the required next workflow command after completion.

The contract should be precise enough that CFC does not have to reinterpret the human decision.

---

# 7. Durable HMN authorization artifact

Create a durable HMN workflow record under:

```text
project's goal/feedback/
```

Use a deterministic ticket-oriented naming convention.

Recommended format:

```text
<TICKET-ID>-hmn-001.md
<TICKET-ID>-hmn-002.md
<TICKET-ID>-hmn-003.md
```

If the repository already has a stronger feedback naming convention, preserve it while retaining an explicit HMN sequence / identity.

Every HMN artifact must include at least:

```text
# HMN Authorization: <ticket>

Ticket:
Batch:
HMN authorization ID:
Invocation:
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

One of:
- CONTINUE_CURRENT_CFC
- AUTHORIZE_NEXT_CFC
- AUTHORIZE_EVIDENCE_REMEDIATION
- AUTHORIZE_DIRECT_REGRESSION_REPAIR
- RETURN_TO_CK
- RETURN_TO_GO
- HUMAN_DECISION_REQUIRED

## Authorized scope

## Required validation

## Forbidden work

## Handoff

Expected next command:
```

The artifact is an authorization record, not a PASS record.

HMN must never set the ticket to approved/PASS.

---

# 8. HMN authorization identity and consumption

Every HMN authorization that permits additional implementation/remediation must have a stable authorization ID.

Example:

```text
HMN-IDSER-001-001
```

CFC must record which HMN authorization it consumed.

Example checkpoint language:

```text
HMN authorization consumed: HMN-IDSER-001-001
```

A committed CFC remediation must consume exactly one active authorization for that cycle.

An HMN authorization must not silently authorize unrelated future remediation.

A later unresolved CK requires a new explicit user invocation of:

```text
hmn
```

and therefore a new HMN authorization artifact.

---

# 9. Interrupted CFC handling

HMN must distinguish an unfinished CFC from a completed CFC cycle.

If:

- HMN or CK previously authorized CFC;
- the remediation worktree contains in-scope partial changes;
- no bounded remediation commit exists;
- ticket was not handed back to CK;

then:

```text
hmn
```

must normally issue:

```text
CONTINUE_CURRENT_CFC
```

The same authorization remains active.

Do not increment remediation-cycle semantics merely because the execution/session ended.

HMN should preserve completed partial work when it remains valid.

Its remediation contract should identify:

- what is already complete;
- what remains;
- what must not be restarted or rewritten.

---

# 10. Required new skill

Create:

```text
.agents/skills/hmn/SKILL.md
```

Follow the same workflow-skill convention used by:

```text
.agents/skills/go/SKILL.md
.agents/skills/ck/SKILL.md
.agents/skills/cfc/SKILL.md
```

No `atlas-skill.json` is required unless repository discovery proves workflow skills now require one.

Suggested frontmatter:

```yaml
---
name: hmn
description: Atlas delegated human/planning-authority workflow control. Use only when the user invokes `hmn` as the Atlas workflow command or explicitly delegates human/planning authority for a stalled bounded Atlas ticket. HMN diagnoses blocked GO/CK/CFC state, issues the smallest valid bounded authorization within the frozen ticket, and records that decision for the next workflow command.
---
```

---

# 11. Required update to CFC

Update:

```text
.agents/skills/cfc/SKILL.md
```

Preserve its existing role.

Do not loosen the default single-pass rule.

Add explicit HMN-aware continuation semantics.

After a post-CFC CK verification returned control to human/planning authority, another CFC is permitted only when:

- the user invoked HMN;
- a newer HMN authorization artifact explicitly authorizes the unresolved existing-ticket finding;
- the HMN decision is one of:
  - `AUTHORIZE_NEXT_CFC`
  - `AUTHORIZE_EVIDENCE_REMEDIATION`
  - `AUTHORIZE_DIRECT_REGRESSION_REPAIR`.

For interrupted uncommitted remediation, CFC may resume when HMN recorded:

```text
CONTINUE_CURRENT_CFC
```

CFC must read the active HMN artifact during preflight.

CFC must verify:

- authorization ticket matches current ticket;
- authorization finding/scope matches the current remediation;
- authorization is newer than the CK/blocked event it responds to;
- the authorization does not expand the frozen ticket;
- no later artifact supersedes it.

CFC must implement only the authorized remediation contract.

CFC must record the consumed HMN authorization ID in the remediation checkpoint.

CFC still:

- does not issue PASS;
- does not perform CK;
- does not broaden review;
- does not automatically start another remediation cycle.

After commit it must:

```text
set/keep ticket awaiting_review
stop for CK
```

Update CFC authority to:

```text
frozen current ticket
> explicit ticket source references
> approved dependency interfaces / invariants
> active bounded HMN authorization, when present
> repository evidence for implementation
> CK finding being remediated
```

HMN authorization is valid only when it remains within frozen ticket authority.

---

# 12. Required update to CK

Update:

```text
.agents/skills/ck/SKILL.md
```

Preserve:

- one consolidated first review;
- bounded post-CFC verification;
- no autonomous review/remediation loop.

The current "one first review + one verification" limitation remains the default autonomous behavior.

Add:

> A newer explicit HMN authorization issued after control returned to human/planning authority establishes a new bounded remediation checkpoint. CK may verify the resulting committed remediation.

When reviewing a CFC commit that consumed an HMN authorization, CK must inspect only:

- the active HMN artifact;
- the unresolved original finding(s) named by that authorization;
- the remediation diff;
- the required evidence;
- direct regressions introduced by that remediation.

CK must not restart a broad review.

CK must not add unrelated findings discovered outside the authorized finding/remediation scope.

The result remains:

```text
PASS
```

or:

```text
CHANGES_REQUIRED
```

If unresolved again:

```text
CHANGES_REQUIRED
  -> return to human/planning authority
```

Do not automatically authorize another CFC.

A further remediation requires another explicit user:

```text
hmn
```

CK must explicitly treat a valid newer HMN authorization as satisfying the prior handoff:

```text
return control to human/planning authority
```

It must not reject the next verification merely because an earlier post-CFC verification already occurred.

The correct rule is:

```text
without HMN:
  one first CK + one post-CFC verification maximum

with a new HMN authorization:
  one new bounded verification of the HMN-authorized remediation
```

Each HMN-mediated cycle remains bounded.

---

# 13. Required update to GO

Update:

```text
.agents/skills/go/SKILL.md
```

GO should need only a minimal change.

GO remains implementation of frozen ticket work and must not remediate ordinary `CHANGES_REQUIRED`.

Add HMN-aware behavior:

- if HMN decision is `RETURN_TO_GO`, GO may resume/complete the frozen ticket implementation described by that HMN authorization;
- GO must not consume `AUTHORIZE_NEXT_CFC`, `AUTHORIZE_EVIDENCE_REMEDIATION`, or `AUTHORIZE_DIRECT_REGRESSION_REPAIR`; those belong to CFC;
- a valid HMN decision does not allow GO to expand ticket scope;
- GO should record the HMN authorization ID if its resumed implementation was explicitly authorized through `RETURN_TO_GO`.

Do not otherwise change GO's implementation/review separation.

---

# 14. Workflow examples that must be supported

## Example 1 - unresolved post-CFC finding

```text
go
  -> commit A

ck
  -> CK-002 CHANGES_REQUIRED

cfc
  -> commit B

ck
  -> CK-002 still unresolved
  -> return to human/planning authority

hmn
  -> inspect ticket + CK + CFC + code
  -> determine CK-002 still traces to frozen ticket
  -> diagnose exact remaining problem
  -> AUTHORIZE_NEXT_CFC
  -> write HMN artifact

cfc
  -> consume HMN artifact
  -> implement only authorized remediation
  -> commit C
  -> awaiting_review

ck
  -> bounded verification of CK-002 + commit C
```

## Example 2 - production implementation correct, evidence insufficient

```text
ck
  -> implementation correct
  -> evidence ambiguous
  -> CHANGES_REQUIRED
  -> human/planning authority

hmn
  -> inspect code + test
  -> AUTHORIZE_EVIDENCE_REMEDIATION

authorized scope:
  - preserve production implementation
  - repair fixture/evidence
  - assert intended constraint/result
  - rerun deterministic validation

cfc
  -> test-only remediation
```

HMN must explicitly protect already-correct production code from unnecessary changes.

## Example 3 - interrupted CFC with no commit

```text
authorized cfc
  -> partial remediation
  -> execution/session ends
  -> no commit
  -> no awaiting_review handoff

hmn
  -> inspect worktree + prior authorization
  -> CONTINUE_CURRENT_CFC
  -> identify completed work
  -> identify remaining work
```

No new remediation cycle is created.

## Example 4 - actual architecture decision

```text
ck
  -> implementation cannot proceed without choosing new provider semantics

hmn
  -> frozen ticket does not choose provider
  -> dependency does not publish this decision
  -> HUMAN_DECISION_REQUIRED
```

HMN must NOT choose the provider and must NOT authorize CFC.

---

# 15. HMN output quality requirements

HMN decisions must be concrete.

Do not write vague instructions such as:

```text
fix the remaining issue
```

Prefer exact bounded instructions derived from repository evidence.

Do not use placeholders such as:

```text
something like
appropriate tests
relevant validation
etc.
```

when exact scope can be calculated.

---

# 16. No automatic implementation by HMN

HMN must not directly modify implementation files as part of the HMN command.

HMN's job is:

```text
inspect
  -> diagnose
  -> authorize
  -> record
  -> hand off
```

Implementation belongs to GO or CFC.

Review belongs to CK.

This separation is required so HMN does not become a super-command that both authorizes and executes its own decision.

---

# 17. Ticket-state behavior

HMN does not mark a ticket `PASS`.

For remediation authorizations, the ticket normally remains:

```text
awaiting_review
```

or whatever existing ticket state correctly represents the current workflow checkpoint.

Do not invent new ticket lifecycle states solely for HMN unless repository structure proves one is required.

The durable HMN artifact is sufficient to carry the delegated authorization.

---

# 18. Review-loop safety invariant

The completed workflow must preserve this invariant:

> No implementation/review agent can autonomously continue an unbounded CK/CFC loop.

Specifically:

- CFC cannot self-authorize another CFC.
- CK cannot authorize CFC after a failed post-CFC verification.
- GO cannot remediate CK findings.
- HMN cannot run unless the user explicitly invokes or explicitly delegates HMN authority.
- Every additional post-verification remediation cycle requires a fresh explicit HMN invocation.
- HMN cannot broaden frozen ticket authority.
- CK after HMN remains bounded to the HMN-authorized unresolved finding and direct remediation effects.

Therefore this is allowed:

```text
ck
 -> cfc
 -> ck
 -> hmn
 -> cfc
 -> ck
 -> hmn
 -> cfc
 -> ck
```

but this is not:

```text
ck
 -> cfc
 -> ck
 -> cfc
 -> ck
 -> cfc
```

---

# 19. Implementation scope

Authorized repository changes for this workflow enhancement are:

```text
ADD:
.agents/skills/hmn/SKILL.md

UPDATE:
.agents/skills/go/SKILL.md
.agents/skills/ck/SKILL.md
.agents/skills/cfc/SKILL.md
```

Also update any repository-native workflow documentation/index/matrix only if it explicitly lists GO/CK/CFC commands and would otherwise become stale.

Do not refactor unrelated Atlas semantic skills.

Do not modify product/backend tickets merely to install HMN.

Do not change application runtime behavior.

This is a workflow-governance skill change.

---

# 20. Acceptance criteria

The implementation is complete only if all of the following are true.

1. `.agents/skills/hmn/SKILL.md` exists and is discoverable under the same mechanism as GO/CK/CFC.
2. `hmn` is triggered only by explicit workflow use or explicit delegation of human/planning authority.
3. HMN reconstructs blocked ticket state from ticket, CK, CFC, commit, and worktree evidence.
4. HMN distinguishes at minimum:
   - `CONTINUE_CURRENT_CFC`
   - `AUTHORIZE_NEXT_CFC`
   - `AUTHORIZE_EVIDENCE_REMEDIATION`
   - `AUTHORIZE_DIRECT_REGRESSION_REPAIR`
   - `RETURN_TO_CK`
   - `RETURN_TO_GO`
   - `HUMAN_DECISION_REQUIRED`
5. HMN produces an implementation-ready bounded remediation contract when authorizing CFC.
6. HMN writes a durable authorization artifact under `project's goal/feedback/`.
7. HMN authorization has a stable identity that CFC can record as consumed.
8. CFC accepts a valid newer HMN authorization after a prior post-CFC CK verification returned control to human/planning authority.
9. CFC recognizes `CONTINUE_CURRENT_CFC` as continuation of an uncommitted existing remediation rather than a new remediation cycle.
10. CFC remains unable to autonomously start another remediation pass without CK or HMN authority.
11. CK accepts a committed HMN-authorized remediation for a new bounded verification even if a previous post-CFC verification already existed.
12. CK remains bounded to the authorized unresolved finding, remediation diff, required evidence, and direct remediation regressions.
13. CK does not restart broad review after HMN.
14. A further `CHANGES_REQUIRED` result again returns control to human/planning authority and does not automatically invoke CFC.
15. GO consumes HMN only for `RETURN_TO_GO`, not CFC-specific authorization decisions.
16. HMN refuses to authorize work requiring new ticket/product/architecture/provider/runtime/deployment/policy/predecessor authority.
17. Existing ordinary GO/CK/CFC behavior still works when HMN is never invoked.
18. No autonomous infinite remediation loop is introduced.

---

# 21. Recommended validation scenarios

Validate the workflow skill behavior against at least these reasoning scenarios.

## Scenario A - normal PASS

```text
go -> ck -> PASS
```

HMN not involved.

Expected: existing behavior unchanged.

## Scenario B - ordinary one-pass remediation

```text
go -> ck CHANGES_REQUIRED -> cfc -> ck PASS
```

HMN not involved.

Expected: existing behavior unchanged.

## Scenario C - unresolved verification

```text
go -> ck -> cfc -> ck CHANGES_REQUIRED
```

Then:

```text
hmn
```

Expected: HMN diagnoses the unresolved ticket-bound finding and issues a bounded next-CFC authorization.

## Scenario D - evidence-only remediation

CK states implementation is correct but evidence is insufficient.

Then:

```text
hmn
```

Expected: `AUTHORIZE_EVIDENCE_REMEDIATION`, with production implementation protected from unnecessary changes.

## Scenario E - interrupted CFC

Partial authorized CFC work exists in worktree.
No commit exists.

Then:

```text
hmn
```

Expected: `CONTINUE_CURRENT_CFC`.

No new cycle.

## Scenario F - architecture decision required

Remaining work requires choosing an unselected provider/deployment/policy.

Then:

```text
hmn
```

Expected:

```text
HUMAN_DECISION_REQUIRED
```

No CFC authorization.

---

# 22. Required final workflow wording

The completed four-skill protocol should communicate this model clearly:

```text
GO
implements the frozen ticket.

CK
independently judges the committed checkpoint.

CFC
repairs one bounded authorized finding.

HMN
acts on explicit user delegation as human/planning authority:
it reconstructs a stalled ticket,
diagnoses why GO/CK/CFC stopped,
determines the smallest valid continuation within frozen ticket authority,
records that authorization,
and hands execution/review back to the correct workflow skill.
```

HMN is the controlled escape hatch for bounded workflow dead-ends.

It must make the workflow resilient without making it autonomous.

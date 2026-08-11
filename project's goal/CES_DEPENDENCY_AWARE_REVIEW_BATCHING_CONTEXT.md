# CES Review Workflow - Dependency-Aware Review Batching

**Status:** Active review workflow context  
**Review class:** REVIEW_GATE  
**Scope:** CES implementation/review sequencing  
**Purpose:** Reduce unnecessary serial review blocking while preserving governance, traceability, and one terminal outcome per ticket  
**Date:** 2026-08-11

---

# 1. Core Principle

CES uses:

```text
DEPENDENCY-AWARE REVIEW BATCHING
```

This workflow replaces the requirement that every ticket pass review before
all downstream implementation can begin.

The governing principle is:

> Batching relaxes review sequencing, not authority sequencing.

This means:

```text
- some downstream implementation may proceed provisionally;
- authoritative decisions must still pass before dependent work executes them;
- every ticket still has its own bounded commit chain;
- every ticket still has its own acceptance contract;
- every ticket still receives its own terminal review outcome.
```

---

# 2. Ticket Review Categories

Every CES ticket should be classified as one of:

```text
REVIEW_GATE
BATCHABLE
```

before deciding whether downstream work may proceed.

---

# 3. REVIEW_GATE

A `REVIEW_GATE` must be accepted before downstream work that depends on the governed decision may start.

Use `REVIEW_GATE` for:

```text
- Frozen-context changes
- Source-rights authorization
- New governance schemas
- New public schemas
- Breaking contracts
- Breaking migrations
- Security authority boundaries
- Agent authority boundaries
- Decisions that could substantially invalidate downstream work
```

The defining question is:

> If this ticket is wrong, could a significant amount of downstream work become invalid or unauthorized?

If yes, it should normally be a `REVIEW_GATE`.

---

# 4. REVIEW_GATE Behavior

A gate follows:

```text
REVIEW_GATE
     |
     v
implementation
     |
     v
review
     |
     +------------------------------+
     |                              |
     v                              v
ACCEPTED                       NOT ACCEPTED
     |                              |
     v                              v
downstream                    dependent work
may proceed                   remains blocked
```

Allowed terminal outcomes remain exactly:

```text
ACCEPTED

NOT ACCEPTED

ACCEPTED WITH DEFERRED ITEMS
```

No new terminal review-status vocabulary is introduced.

---

# 5. BATCHABLE

A `BATCHABLE` ticket implements or reconciles an already accepted decision.

It may be completed provisionally alongside other downstream batchable tickets.

Typical `BATCHABLE` work includes:

```text
- Concrete records
- Fixtures
- Adapter updates
- Compatibility validation
- Documentation synchronization
- Acceptance-contract revisions that do not execute a gated operation
```

The defining question is:

> Is this ticket implementing an already accepted decision without creating new authority or changing a fundamental contract?

If yes, it is normally `BATCHABLE`.

---

# 6. BATCHABLE Behavior

Batchable work can proceed concurrently or provisionally after all required upstream gates are accepted.

Example:

```text
Accepted REVIEW_GATE
        |
        +--------------------+
        |                    |
        v                    v
BATCHABLE A              BATCHABLE B
        |                    |
        v                    v
commit A                  commit B
        |                    |
        v                    v
review A                  review B
```

There is no requirement that:

```text
BATCHABLE A
```

must be reviewed before:

```text
BATCHABLE B
```

starts, unless B depends specifically on an unresolved part of A.

---

# 7. One Primary Implementation Commit Per Ticket Remains Mandatory

Review batching does not merge ticket identity.

Every ticket still produces one primary bounded implementation commit. A
ticket may additionally require scoped remediation and acceptance-bookkeeping
commits:

```text
one ticket
    |
    v
one primary bounded implementation commit
    |
    +-- zero or more scoped remediation commits
    |
    +-- optional acceptance-bookkeeping commit
    |
    v
one ticket-specific review
    |
    v
one terminal result
```

Example:

```text
POL-003-R01
-> primary commit A
-> remediation commits when required
-> ACCEPTED / NOT ACCEPTED / ACCEPTED WITH DEFERRED ITEMS

POL-004-R01
-> primary commit B
-> remediation commits when required
-> ACCEPTED / NOT ACCEPTED / ACCEPTED WITH DEFERRED ITEMS

POL-005-R01
-> primary commit C
-> remediation commits when required
-> ACCEPTED / NOT ACCEPTED / ACCEPTED WITH DEFERRED ITEMS
```

This preserves:

```text
- rollback clarity;
- provenance;
- review history;
- acceptance evidence;
- ticket accountability;
- dependency tracing.
```

Acceptance evidence must identify the complete ticket commit chain. A
remediation or bookkeeping commit does not become a second ticket and must not
contain unrelated work.

---

# 8. Batching Does Not Create a Batch-Level Terminal Result

Do not review a group of tickets as if it were one giant ticket.

There should be no terminal result like:

```text
BATCH ACCEPTED
```

unless CES explicitly introduces a separate governed aggregate review contract in the future.

The current rule is:

```text
batch implementation
!=
batch acceptance
```

Each ticket remains independently reviewable.

## 8.1 One Review Request May Cover a Commit Range

To reduce review round trips, one review request and one review artifact may
cover multiple primary ticket commits or an explicit commit range.

The combined artifact is only a transport and presentation convenience. It
must contain, for every ticket:

```text
- ticket identity;
- reviewed primary and remediation commits;
- ticket-specific acceptance-contract results;
- ticket-specific findings and dependency impact;
- that ticket's Round 1 or Round 2 designation;
- one independent terminal outcome.
```

Valid example:

```text
Review artifact for commits A..D

POL-003-R01: ACCEPTED
POL-004-R01: NOT ACCEPTED
  REQUIRED-01: ...
POL-005-V01: ACCEPTED
POL-006-R01: ACCEPTED WITH DEFERRED ITEMS
  DEFERRED-01: ...
```

Invalid example:

```text
Batch A..D: ACCEPTED
```

If one ticket requires Round 2, the next combined or standalone review remains
closure-only for that ticket. It does not reopen Round 1 discovery for tickets
that already received an accepting terminal outcome.

---

# 9. Promotion Rule

A ticket initially classified as `BATCHABLE` must stop at the point where it discovers a new gated decision.

Examples:

```text
new frozen-context decision

new source authorization

new governance/public schema

breaking contract

breaking migration

new security authority

new agent authority

decision that could invalidate substantial downstream work
```

At that boundary, do not hide the decision inside the batchable implementation.

Instead:

```text
BATCHABLE
    |
    v
new gated decision discovered
    |
    +-----------------------------+
    |                             |
    v                             v
reclassify ticket             split decision into
as REVIEW_GATE               dedicated REVIEW_GATE
```

Preferred approach:

> Split the new authority decision into a dedicated REVIEW_GATE when doing so preserves a clearer contract.

---

# 10. Why the Promotion Rule Matters

Without the promotion rule, batching could gradually weaken CES governance.

Bad path:

```text
accepted decision
      |
      v
batchable implementation
      |
      v
"small" new authority decision
      |
      v
silently embedded
      |
      v
downstream depends on unreviewed authority
```

Correct path:

```text
accepted decision
      |
      v
batchable implementation
      |
      v
new authority decision discovered
      |
      v
STOP
      |
      v
REVIEW_GATE
      |
      v
ACCEPTED
      |
      v
resume dependent work
```

---

# 11. Dependency-Aware Failure Handling

A failed `BATCHABLE` ticket does not automatically invalidate every ticket in the batch.

Instead ask:

```text
Does downstream ticket depend on
the specific defective behavior?
```

Then:

```text
              finding in A
                   |
                   v
          Does B depend on it?
              /          \
            YES          NO
             |            |
             v            v
      B must reconcile    B may continue
```

This avoids both extremes:

```text
fully serial everything
```

and:

```text
ignore dependencies entirely
```

---

# 12. When a Batchable Finding Propagates

A finding should propagate only where dependency is real.

Example:

```text
POL-003-R01
concrete source record defect
        |
        +----------------------+
        |                      |
        v                      v
POL-004 adapter uses       POL-005 schema validation
that exact record          does not depend on record
        |                      |
        v                      v
affected                   not automatically blocked
```

The reviewer must identify:

```text
- defective contract surface;
- downstream consumers of that surface;
- whether provisional downstream work must reconcile.
```

Do not invalidate unrelated tickets merely because they belong to the same batch.

---

# 13. When a REVIEW_GATE Finding Propagates

A failed `REVIEW_GATE` blocks dependent downstream authority.

Example:

```text
Source-rights REVIEW_GATE
        |
        v
NOT ACCEPTED
        |
        +----------------------+
        |                      |
        v                      v
Extraction                 unrelated docs
using that source          not using authority
BLOCKED                    may continue
```

Again, dependency is semantic, not merely chronological.

---

# 14. Current CES Policies Example

The following gates have already been accepted:

```text
POL-000-R01
Source Strategy Revision
        REVIEW_GATE
        ACCEPTED

POL-000-R01-F01
Frozen Context v1.1
        REVIEW_GATE
        ACCEPTED

POL-002-R01
Source Governance Schema Reconciliation
        REVIEW_GATE
        ACCEPTED
```

These decisions establish the authority for downstream reconciliation.

---

# 15. Current Downstream Classification

After those accepted gates, the immediate reconciliation work can be treated approximately as:

```text
POL-003 reconciliation
Concrete governed source records
        BATCHABLE

POL-004 reconciliation
Update adapters / behavior against accepted source classes
        BATCHABLE

POL-005 revalidation
Compatibility validation against revised source governance
        BATCHABLE

POL-006 contract revision
Acceptance-contract synchronization only
        BATCHABLE
```

Important:

```text
POL-006 contract revision
```

is batchable only if it does not execute the still-gated extraction operation.

Changing the contract to reflect already accepted authority is different from actually running the extraction.

---

# 16. Example Current Batch

Instead of:

```text
POL-003 implementation
        |
        v
review
        |
        v
wait
        |
        v
POL-004 implementation
        |
        v
review
        |
        v
wait
```

CES may now do:

```text
Accepted upstream REVIEW_GATES
        |
        +-----------------------------+
        |             |               |
        v             v               v
POL-003-R01       POL-004-R01      POL-005-R01
BATCHABLE         BATCHABLE        BATCHABLE
        |             |               |
        v             v               v
commit A          commit B          commit C
```

and optionally:

```text
POL-006-R01
contract synchronization
BATCHABLE
```

provided it does not execute prohibited/unapproved extraction.

---

# 17. Review Still Happens Per Ticket

The resulting reviews remain:

```text
POL-003-R01
-> ACCEPTED / NOT ACCEPTED / ACCEPTED WITH DEFERRED ITEMS

POL-004-R01
-> ACCEPTED / NOT ACCEPTED / ACCEPTED WITH DEFERRED ITEMS

POL-005-R01
-> ACCEPTED / NOT ACCEPTED / ACCEPTED WITH DEFERRED ITEMS

POL-006-R01
-> ACCEPTED / NOT ACCEPTED / ACCEPTED WITH DEFERRED ITEMS
```

Do not collapse them into one combined review outcome.

---

# 18. Dependency-Aware Review Order

Review order can differ from implementation order only where the reviewed
ticket contracts are semantically independent.

For example:

```text
Implementation:
A, B, C completed provisionally

Review:
B reviewed first
A reviewed second
C reviewed third
```

This is allowed if:

```text
- no unresolved REVIEW_GATE is being bypassed;
- each ticket has a bounded contract;
- findings are propagated only through real dependencies.
```

If ticket B depends on an unresolved contract surface implemented by ticket A,
review must proceed topologically:

```text
A reviewed first
        |
        +-- accepting outcome -> B may receive a terminal review
        |
        +-- NOT ACCEPTED -> determine whether B depends on the defect
                              |
                              +-- yes: B remains pending review
                              +-- no: B may be reviewed independently
```

CES does not use conditional terminal outcomes. A dependent ticket must not be
marked accepted on the condition that its prerequisite will pass later.

---

# 19. Acceptance Contract Discipline Remains

Every ticket still needs:

```text
1. Scope
2. Acceptance Contract
3. Explicit Non-Goals
```

Review findings remain classified as:

```text
BLOCKER
REQUIRED
DEFERRED
OPTIONAL
```

The bounded review protocol remains unchanged.

Batching does not authorize broad architectural review of every ticket in the batch.

---

# 20. Round 1 / Round 2 Rules Remain

Each ticket still follows:

```text
Round 1
= broad discovery against that ticket's frozen contract

Round 2
= closure only
```

Batching does not allow a reviewer to reopen another ticket during a closure review.

---

# 21. Cross-Ticket Finding Rule

If reviewing ticket B reveals a problem in ticket A:

First determine whether:

```text
A violated its own accepted contract
```

or:

```text
B merely needs something different
```

If A's accepted contract was genuinely violated:

```text
follow the frozen exception rules
```

If not:

```text
do not reopen A
```

Create or adjust the appropriate downstream ticket instead.

This remains essential for preventing infinite feedback loops.

---

# 22. Classification Decision Test

Before implementation, classify a ticket using:

```text
Question 1:
Does this ticket create or change authority?

YES -> likely REVIEW_GATE
NO  -> continue

Question 2:
Does this ticket create a new public/governance contract
or breaking migration?

YES -> REVIEW_GATE
NO  -> continue

Question 3:
Could getting this wrong substantially invalidate
downstream implementation?

YES -> REVIEW_GATE
NO  -> continue

Question 4:
Is it implementing an already accepted decision?

YES -> BATCHABLE
```

---

# 23. Examples

## REVIEW_GATE Examples

```text
Publish Frozen Context v1.2

Authorize a new licensed source for AI processing

Create Policy Binding public schema v2

Change agent execution authority

Introduce breaking Source Glossary migration

Change Atlas -> Policies ownership boundary
```

---

## BATCHABLE Examples

```text
Seed concrete NIST release records

Update source-update adapter to understand EVALUATION_SOURCE

Re-run POL-005 compatibility tests

Synchronize POL-006 acceptance wording

Add test fixtures for accepted source classes

Update governance documentation to match accepted schema
```

---

# 24. A Batchable Ticket Can Become a Gate

Example:

```text
Ticket:
Add NIST concrete source records
        |
        v
During implementation:
existing schema cannot express
required legal condition
        |
        v
new public schema required
```

At this point:

```text
STOP
```

The ticket must not casually add the schema.

Instead:

```text
new schema decision
        |
        v
REVIEW_GATE
```

After that gate is accepted, concrete-record work may resume.

---

# 25. Authority Sequencing Remains Strict

This is the most important rule:

```text
Review sequencing may be relaxed.

Authority sequencing may not.
```

Therefore:

```text
BATCHABLE work
```

may proceed provisionally after accepted gates.

But:

```text
gated operation
```

may not execute based on a proposal, provisional implementation, or unreviewed authority.

---

# 26. Documentation Status vs Review Result

Descriptive document states may exist, such as:

```text
Draft
Proposed
Implemented
Pending Review
```

These are not terminal review results.

Terminal review outcomes remain exactly:

```text
ACCEPTED
NOT ACCEPTED
ACCEPTED WITH DEFERRED ITEMS
```

---

# 27. Recommended Ticket Metadata

Each ticket should preferably declare:

```text
review_class:
REVIEW_GATE
```

or:

```text
review_class:
BATCHABLE
```

and optionally:

```text
depends_on:
- <ticket IDs>

blocks:
- <ticket IDs>
```

For batchable tickets, dependencies should identify only actual semantic prerequisites.

Exact schema/format is not frozen by this context.

---

# 28. Recommended Reviewer Behavior

At the start of each review:

```text
1. Identify the ticket.
2. Read its review_class.
3. Confirm accepted REVIEW_GATE ancestors.
4. Review only its own acceptance contract.
5. Identify dependency impact for any finding.
6. Produce one terminal outcome for that ticket.
```

Do not automatically block every other provisional ticket in the same batch.

---

# 29. Recommended Implementation Behavior

Before starting a batchable ticket:

```text
1. Confirm required REVIEW_GATE dependencies are ACCEPTED.
2. Confirm ticket scope is implementation/reconciliation only.
3. Implement provisionally.
4. Do not invent new authority.
5. If new authority is required, stop and promote/split to REVIEW_GATE.
6. Keep one primary implementation commit per ticket, with only scoped
   remediation commits and an optional acceptance-bookkeeping commit afterward.
```

---

# 30. Why CES Adopted This

The previous fully serial process caused unnecessary friction:

```text
implement
review
wait
implement
review
wait
implement
review
wait
```

even where downstream work merely followed an already accepted decision.

Dependency-aware batching preserves the useful parts of governance:

```text
- frozen decisions;
- bounded acceptance;
- traceability;
- terminal outcomes;
- review evidence;
- fail-closed authority.
```

while reducing unnecessary latency between independent implementation tickets.

---

# 31. What This Does Not Change

This workflow does not change:

```text
- CES Policy WHAT-not-HOW boundary;
- Atlas ownership of business truth;
- Context Binding rules;
- Concern / Capability separation;
- deterministic validation;
- Agents Bridge boundary;
- source-rights fail-closed behavior;
- frozen review terminal outcomes;
- Round 1 / Round 2 closure discipline;
- bounded per-ticket commit provenance.
```

It changes only:

```text
how implementation and review are sequenced
when dependencies allow provisional batching.
```

---

# 32. Proposal Authority and Activation

This document changes CES-wide implementation and review sequencing and is
therefore itself a `REVIEW_GATE`.

Before REV-001 received its accepting terminal outcome:

```text
- the previously accepted bounded review protocol remains authoritative;
- this document did not authorize provisional downstream implementation;
- no plan may claim dependency-aware batching is active.
```

After acceptance:

```text
- this context becomes the active sequencing supplement;
- product-specific frozen authority and dependencies still take precedence;
- affected ticket plans may reference this context without rewriting their
  historical delivery or review evidence.
```

Activation does not retroactively change earlier ticket outcomes or combine
their commit histories.

---

# 33. Final Operating Rule

The CES review workflow is:

```text
Classify ticket
        |
        +----------------------+
        |                      |
        v                      v
REVIEW_GATE                BATCHABLE
        |                      |
        v                      v
must be accepted          may proceed provisionally
before dependent          after accepted gates
authority executes              |
        |                       v
        |                 own bounded commit chain
        |                       |
        |                       v
        |                 own review
        |                       |
        +-----------+-----------+
                    |
                    v
            one terminal outcome
             per ticket
```

The core invariant is:

> Dependency-aware batching may accelerate implementation, but it must never allow unreviewed authority to become operational.

---

**End of CES Dependency-Aware Review Batching Context.**

Work on branch:

`codex/new-atlas-backend`

Your task is to **split the current IDSER-010 executable ticket into multiple genuinely bite-sized, coherent executable tickets**.

This is not a cosmetic documentation split.

This is not simply moving sections from one Markdown file into several Markdown files.

This is not an instruction to minimize ticket count.

This is not an instruction to make tickets artificially tiny.

The explicit objective is to reduce and correctly group implementation authority, validation authority, security scope, and review evidence so that the existing:

```text
go
ck
cfc
hmn
```

workflow can operate predictably, finish each stage completely, and converge reliably.

The desired normal lifecycle for every executable child is:

```text
GO
 ↓
complete the whole frozen child contract
 ↓
complete every mandatory child-local proof
 ↓
Internal readiness: READY_FOR_CK
 ↓
awaiting_review
 ↓
CK
 ↓
PASS
```

and, when a real defect exists:

```text
GO
 ↓
CK
 ↓
one finite frozen finding set
 ↓
CFC
 ↓
complete every authorized frozen finding
 ↓
Internal readiness: READY_FOR_CK
 ↓
awaiting_review
 ↓
CK
 ↓
PASS
```

HMN is an exceptional bounded recovery/authorization mechanism.

HMN must not become a normal continuation mechanism simply because GO or CFC was given more work than it could coherently finish.

Do not implement IDSER-010 production behavior during this task.

---

# Primary command

Inspect the current:

`project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-010-deterministic-compose-and-regression-checkpoint.md`

and partition it into a sequential/dependency-aware family of executable child tickets such that **each child represents one complete coherent workflow-sized contract**.

A child must be:

- large enough to accomplish a meaningful independently reviewable behavior, invariant family, or proof surface;
- small enough that GO can realistically complete both implementation and all mandatory proof before handing it to CK;
- coherent enough that CK can inspect the entire contract in one bounded review;
- locally repairable enough that ordinary CFC findings do not cross into unrelated sibling authority;
- narrow enough that HMN, if required, receives one obvious residual instead of a bundle of unrelated problems.

Do not decide the number of children in advance.

The number of tickets is an output of the analysis.

Five tickets are acceptable if five genuinely coherent contracts are sufficient.

Ten tickets are acceptable if ten are genuinely necessary.

Neither is inherently better.

The goal is not:

`few tickets`

or:

`many tickets`

The goal is:

**workflow-sized tickets that can actually finish.**

---

# Current repository baseline

Resolve and record the actual current HEAD of:

`codex/new-atlas-backend`

at execution time.

Do not assume a previously observed SHA if the branch has advanced.

At the planning baseline inspected before this prompt was written, IDSER-009 had completed through its final integrated checkpoint and IDSER-010 remained the next planned deterministic checkpoint.

Re-inspect the branch yourself before authoring the split.

---

# IDSER-009 is the process precedent, including its later corrective children

Do not look only at the original four-way IDSER-009 split.

Inspect the complete actual IDSER-009 history and learn from what happened afterward.

At minimum inspect:

```text
IDSER-009-production-project-card-lifecycle.md

IDSER-009-01-authorized-persisted-lifecycle-read.md

IDSER-009-02-deterministic-production-card-projection.md

IDSER-009-03-production-project-card-presentation.md

IDSER-009-03-01-semantic-uncertainty-project-card-contract.md

IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md

IDSER-009-04-integrated-project-card-regression-checkpoint.md
```

Also inspect the relevant 009-03-02 planning/review-contract correction artifacts.

The important lesson is not merely that IDSER-009 was split.

The important lesson is that the original partition later discovered additional prerequisites:

```text
009-03
   ↓
009-03-01
009-03-02
   ↓
009-04
```

Those corrective children existed because final integration exposed independently meaningful production contracts that should not simply be stuffed into the integration checkpoint or a huge CFC remediation.

Use that history as a design lesson for IDSER-010.

The IDSER-010 partition must explicitly support **recursive decomposition**.

A planned child such as:

`IDSER-010-03`

may itself need:

```text
IDSER-010-03-01
IDSER-010-03-02
```

if inspection shows that the apparent child actually contains two different authority/proof contracts.

Do not force all hierarchy to be flat.

Do not create nested children merely for naming aesthetics either.

Use nested children only when a logical responsibility family contains independently reviewable prerequisites that should execute separately.

---

# Central design rule: measure Review Contract size

Do not measure "bite-sized" by:

- line count;
- number of files edited;
- number of scenarios;
- number of tests;
- arbitrary implementation duration.

Measure it by **Review Contract size and coherence**.

A child ticket is appropriately sized only when all of these are true:

1. GO can enumerate its entire Review Contract before coding.
2. GO can identify all implementation and evidence work before starting.
3. GO can implement the complete contract within one coherent authority/proof surface.
4. GO can execute every mandatory validation required for that child before `awaiting_review`.
5. GO should not predictably reach `IMPLEMENTED_UNPROVEN`.
6. CK can traverse every applicable row in one bounded review.
7. CK should not simultaneously judge several unrelated technical domains.
8. A normal consolidated CK finding set can be repaired locally by CFC.
9. CFC does not need to reopen an approved sibling to close its findings.
10. HMN, if required, receives only one bounded residual or contract decision.
11. No predictable evidence category is intentionally postponed for CK to discover.
12. Splitting the child further would either improve review locality or, if not, would merely create administrative handoffs.

If a proposed child fails these conditions, repartition it before finalizing the ticket set.

---

# Explicit anti-short-stop rule

The purpose of this partition is also to prevent intentional or structurally predictable short stops.

A correctly sized GO ticket must not normally end with statements equivalent to:

```text
implementation is complete but Compose proof remains

core behavior works but the required integration test has not been run

scenario A-C pass but D is still pending

the harness is ready but assertions/evidence remain

most required evidence is complete

the remaining validation can be done in the next turn

the required command was still running so the ticket remains in GO

the implementation is mostly complete but not ready for CK
```

Those are not desirable workflow checkpoints.

If the ticket contract requires the missing proof, GO owns that proof.

The normal GO terminal state must be:

```text
all child Review Contract rows PROVEN
+
required regression evidence complete
+
checkpoint committed
+
Internal readiness: READY_FOR_CK
+
awaiting_review
```

If planning inspection shows that a proposed child is realistically likely to stop before that state because it contains too many distinct work/proof classes, **split it further now**.

Do not solve oversized tickets by allowing partial GO handoffs.

The same rule applies to CFC.

A normal CFC cycle must not intentionally finish with:

```text
CK-001.a fixed
CK-001.b fixed
CK-001.c still remains
```

when all three clauses were part of the same authorized bounded finding set and are normally actionable.

CFC should finish its complete authorized frozen finding set, prove it, commit it, and return the ticket to `awaiting_review`.

If a frozen finding set would predictably require several unrelated architectural remediation surfaces, that is evidence that the executable ticket was oversized or the review contract was malformed.

---

# IDSER-010 is the frozen source contract

The current IDSER-010 ticket is authoritative for its existing scope.

Its current contract includes:

- complete deterministic production-shaped Compose pipeline proof;
- scenarios A through H;
- AC-01 through AC-40 deterministic coverage as applicable;
- production dispatcher / `MistralProvider` boundary;
- real Atlas/PostgreSQL;
- real pg-boss;
- real Agents Bridge;
- real worker processes;
- real DocumentStore;
- controlled deterministic provider responses;
- failure/recovery proof;
- replay/restart proof;
- concurrent bundle/user isolation;
- regression preservation;
- negative-authority proof;
- empty Master/no downstream truth authority;
- secret-safe deterministic evidence.

Do not redesign this contract.

Do not weaken it to make CK easier.

Do not invent a replacement architecture.

Do not move deterministic IDSER-010 responsibilities to IDSER-011.

Do not move IDSER-011 live-provider responsibilities backward into IDSER-010.

The partition must satisfy:

```text
union(child functional scope)
    == original IDSER-010 functional scope

union(child security scope)
    == original IDSER-010 security scope

union(child required proof)
    == original IDSER-010 required proof

union(child scenario ownership)
    == scenarios A-H

union(child IDSER-010 AC verification ownership)
    == every IDSER-010-owned AC obligation
```

No obligation may disappear between parent and children.

---

# Inspect repository architecture before deciding ticket boundaries

Do not derive the split from IDSER-010 headings alone.

Inspect the actual implementation and current proof harnesses.

At minimum inspect:

```text
project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-010-deterministic-compose-and-regression-checkpoint.md

project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-011-live-mistral-acceptance-checkpoint.md

project's goal/Backend_Phase/tickets/Initial_Draft_Phase/README.md

project's goal/Backend_Phase/atlas-initial-draft-semantic-extraction-reconciliation-implementation-context.md
```

Especially implementation-context sections:

```text
39
40
41.1 - 41.9
42
43
44
```

Inspect approved predecessor contracts where IDSER-010 depends on their behavior, particularly:

```text
IDSER-001 through IDSER-008
complete IDSER-009 child/corrective series

BSS-006
BSS-007
BSS-008
BSS-009 and its relevant split children

frozen PCC integration/create boundaries
```

Inspect the current workflow rules:

```text
.agents/skills/go/SKILL.md
.agents/skills/ck/SKILL.md
.agents/skills/cfc/SKILL.md
.agents/skills/hmn/SKILL.md
.agents/skills/_shared/atlas-ticket-review-contract.md
.agents/skills/engineering-security-refactor-readiness/SKILL.md
```

Inspect actual production seams and current equivalent files around:

```text
apps/agents-bridge/src/semantic-worker.ts
apps/agents-bridge/src/semantic-result-replay.ts
apps/agents-bridge/src/atlas-semantic-client.ts
apps/agents-bridge/src/worker-main.ts
apps/agents-bridge/src/queue.ts

packages/atlas-core/src/semantic-authority.ts
packages/atlas-core/src/perception-authority.ts
packages/atlas-core/src/semantic-internal-route.ts

packages/atlas-db/src/semantic-authority.ts
packages/atlas-db/src/perception-authority.ts
packages/atlas-db/src/semantic-candidate-repository.ts
packages/atlas-db/src/reconciliation-selector.ts
packages/atlas-db/src/reconciliation-acceptance.ts
```

Inspect current tests/harnesses, including at minimum current equivalents of:

```text
apps/agents-bridge/tests/semantic-worker.integration.test.ts
apps/agents-bridge/tests/reconciliation-restart-worker.ts
apps/agents-bridge/tests/perception-compose-smoke.mjs

packages/atlas-db/tests/project-repository.integration.test.ts
packages/atlas-db/tests/perception-authority.integration.test.ts
packages/atlas-db/tests/semantic-authority.integration.test.ts
packages/atlas-db/tests/extraction-acceptance.integration.test.ts
packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts
packages/atlas-db/tests/permissions.test.mjs

apps/atlas/tests/browser/idser-009-04-project-card-lifecycle.spec.mjs
apps/atlas/tests/project-create.integration.test.mjs
apps/atlas/tests/project-home.integration.test.mjs
```

Inspect the current package scripts rather than inventing commands.

Repository inspection currently indicates that substantial lower-level authority/replay/failure/reconciliation proof already exists, while IDSER-010 still needs its own deterministic production-shaped checkpoint composition.

Reuse existing authoritative proof where it genuinely proves an obligation.

Do not duplicate large lower-level suites merely for ceremony.

Do not claim that a lower-level test proves an end-to-end requirement when it does not execute the production-shaped boundary required by IDSER-010.

---

# First planning pass: build the parent Review Contract ledger

Before inventing child tickets, enumerate the entire current IDSER-010 Review Contract.

Assign stable planning IDs to every distinct obligation.

Classify each item as applicable:

```text
IMPLEMENTATION
BEHAVIOR
SCENARIO
NEGATIVE_CASE
FAILURE_RECOVERY
REPLAY
CONCURRENCY
REGRESSION
SECURITY
EVIDENCE
BOUNDARY
INTEGRATION
```

For every item identify:

```text
parent authority
required behavior
existing implementation authority
required proof harness
required scenario/fixture topology
security seam
likely implementation owner
likely final integration owner
```

Do not start writing child files until this ledger is complete enough to detect overlapping and orphaned responsibilities.

---

# Second planning pass: cluster by authority + proof surface

Partition the ledger according to:

**authority + implementation responsibility + authoritative proof surface + likely CK decision**

Prefer a child where all work naturally belongs together.

Do not group work merely because it happens chronologically.

Do not split merely because there are many test cases.

Do not create arbitrary:

```text
Scenario A ticket
Scenario B ticket
Scenario C ticket
```

unless those scenarios actually have independent implementation/proof authority.

Similarly, do not create generic:

```text
backend ticket
worker ticket
tests ticket
security ticket
```

unless repository inspection proves that is the actual bounded contract.

The useful question is:

> If CK finds defects in this child, would the fixes normally belong to the same architectural authority and use the same proof harness?

If NO, split.

Another useful question is:

> Does this child require GO to prove several unrelated things using substantially different fixture topology or failure models?

If YES, inspect whether it should be split.

---

# Current IDSER-010 pressure surfaces to evaluate

Repository inspection suggests the following are materially different proof pressures.

Treat this only as a decomposition checklist, NOT a mandatory ticket list:

```text
deterministic provider/Compose harness and test-consumer isolation

normal semantic production flow / exact deterministic semantic cases

multi-document sequencing and bounded context behavior

concurrent independent users/bundles and identity isolation

invalid output / technical failure / rollback authority

staged-result replay, restart, lease/fencing and exactly-once logical effects

focused relationship/accounting/boundary obligations

PCC/BSS/auth/demo/CSP/application regressions

negative downstream authority / empty Master

final integrated A-H + AC evidence checkpoint
```

Determine which of these can coherently share an executable ticket and which cannot.

Do not force them into a predefined number of children.

If two items share the same implementation authority, fixture topology, proof harness and CK decision, they may belong together.

If they merely happen to be related conceptually but have different failure models/oracles, keep them separate.

---

# Scenarios A-H remain mandatory

Preserve explicit ownership for:

```text
A - one PRD, no conflict

B - one PRD, internal conflict

C - multiple PRDs, support/duplicate

D - multiple PRDs, contradiction

E - three-document order

F - concurrent users/bundles

G - invalid semantic output

H - replay/restart
```

Do not merely assign each scenario to a child by name.

For every scenario identify:

```text
what production authority it exercises

what predecessor behavior it consumes

what new IDSER-010 proof it contributes

what harness proves it

what DB/queue/provider observations are mandatory

what security/negative property accompanies it

whether final integration must observe it again
```

Where multiple scenarios share one coherent harness and differ only in deterministic provider fixture data, keeping them together may be correct.

Where scenarios require substantially different concurrency, failure, crash/restart, or queue-control topology, separate review contracts may be safer.

---

# AC-01 through AC-40 traceability

IDSER-010 is primarily a deterministic verification checkpoint over many already-approved implementations.

Do not pretend every AC is newly implemented by IDSER-010.

For each AC-01 through AC-40 classify it as:

```text
implemented by approved predecessor, verified here

new IDSER-010 harness/proof responsibility

final integrated observation

not directly re-executed here because another exact parent-owned proof is authoritative
```

Every IDSER-010 verification obligation must have a concrete child owner.

The umbrella must contain a coverage ledger with at least:

```text
AC
primary approved implementation owner
IDSER-010 verification child
authoritative proof
final integration owner if applicable
```

Do not use ownership values such as:

```text
shared
general
later
implicit
TBD
```

without naming the concrete child responsible.

---

# Required semantic/focused coverage

Preserve explicit proof ownership for the current parent obligations around:

```text
all ten relationship types

current-document candidate accounting

non-fact-only documents

context byte boundaries

context count boundaries

selected-neighborhood overflow metadata

stable deterministic bounded selection

evidence/source inventory validity

cross-scope semantic reference rejection

full validated result persistence

no automatic semantic winner

no order-derived truth priority
```

These do not all need to be re-proven in the largest E2E scenario if a smaller existing authoritative suite is better.

Assign them to the smallest authoritative focused proof surface.

The final integrated ticket should consume that evidence rather than redundantly reconstruct every low-level edge case.

---

# Failure-model partitioning

Do not treat every non-happy-path behavior as one generic "failure ticket."

Different failure classes may have fundamentally different closure oracles.

Explicitly map:

```text
creation rollback

DocumentStore / transaction / enqueue rollback

context denial

result denial

provider rejection

schema rejection

evidence/inventory/reference rejection

zero false progress

no successor scheduling after rejected stage

bounded Needs attention lifecycle

supported recovery
```

Determine whether they form one coherent failure-authority child or require more than one.

The determining factor is common authority and common proof harness, not convenience.

---

# Replay/restart is not automatically the same contract as ordinary failure

Explicitly map:

```text
result staged before trusted delivery

acknowledgement loss

redelivery of identical staged envelope

no second provider call for staged work

identical Atlas replay is idempotent

conflicting completion is rejected

worker interruption after staging

interruption after Atlas acceptance

lease/fencing behavior

no duplicate IDs

no duplicate semantic rows

no duplicate progress

no duplicate jobs

no stale-lease logical effects
```

Do not merge these with ordinary invalid-output/failure proof merely because both involve error paths.

If CK would use a materially different oracle for restart/idempotency than for terminal failure, they should not be one oversized review contract.

---

# Concurrency/isolation deserves its own sizing decision

Explicitly assess the topology required to prove:

```text
independent users/projects/bundles progress concurrently

same display wording never merges identity

bundle B1 state never leaks into B2 context

results remain scope-isolated

progress remains scope-isolated

semantic IDs remain scope-isolated

test consumers cannot steal one another's jobs
```

If that requires a distinct multi-user/multi-bundle fixture topology and CK decision, do not hide it inside a giant semantic correctness ticket.

If existing harness architecture makes it naturally part of another coherent contract, document why.

---

# Security seams must follow implementation authority

Preserve the current IDSER-010 security contract, including:

```text
SEAM-IDSER-010-01
COUPLING-IDSER-010-01
REV-READY-IDSER-010-01
REV-READY-IDSER-010-02
```

Do not independently regenerate unrelated security requirements for every child.

Instead:

```text
inspect original seam
 ↓
identify the authority it protects
 ↓
assign that portion to the child owning that authority
 ↓
retain required cross-layer proof in the final integration checkpoint
```

Preserve in particular:

- no fixture authority;
- no required integration silently skipped and reported as passing;
- no raw secret dumps;
- no weakened tests merely to complete the checkpoint;
- no TestRuntime semantic work in production scenario proof;
- explicit deterministic provider configuration;
- no silent mock fallback;
- actual Agents Bridge role cannot mutate trusted Atlas semantic records;
- authenticated execution authority is required for context/results;
- test concurrency cannot steal unrelated jobs.

Security must become **smaller per executable child while remaining identical in total coverage**.

---

# Negative-authority partition

The existing IDSER-010 negative authority must remain explicit.

Assign concrete ownership for proof of absence of:

```text
resolved knowledge

approval

publication

review decisions

CES assessment

projection state

conversation state

Master revision / HEAD movement
```

Preserve:

```text
Master remains empty
published fact count remains zero
production does not use fixture APIs
real projects do not route into /demo
Agents Bridge lacks direct trusted semantic mutation authority
```

Do not create database schema solely to prove the absence of a downstream feature.

Do not leave all negative authority as one vague sentence in the final ticket.

Map each item to an authoritative child or final integrated proof.

---

# Regression ownership must be bounded

Preserve the parent regression requirements around:

```text
PCC source-storage-before-commit

auth/session

membership

upload validation

duplicate creation

cross-project denial

browser-safe read/error boundaries

BSS-006 transaction/lease/retry/fencing

BSS-007 immutable bytes/hash behavior

BSS-008 configured Mistral adapter

BSS-009 perception/grant/cache/replay

no second OCR path

/demo fixture isolation

app build/lint/typecheck where applicable

rendered HTML/CSP

auth regressions

directly affected browser regressions
```

Do not require every child to execute the entire regression universe.

For each child:

- run child-required authoritative proof;
- run regressions directly affected by that child;
- defer broad cross-layer regression consolidation to the final integration checkpoint.

The final integration child may own broad regression proof because that is its singular proof responsibility.

It must not simultaneously become a new architectural implementation ticket.

---

# Two-level partition audit

After producing an initial set of children, do NOT immediately finalize it.

Perform a second pass over each proposed child.

For each one derive its actual Review Contract exactly as GO and CK would.

Then answer:

```text
What authority does this child own?

What authority does it explicitly NOT own?

What implementation must GO complete?

What proof must GO complete?

What is the dominant harness?

How many materially different fixture topologies are required?

What security seam belongs here?

What regressions are directly affected?

What would READY_FOR_CK require?

What categories of finding could CK reasonably return?

Would those findings be repairable by one bounded CFC?

Would CFC need another child's architecture?

If HMN were needed, what exact narrow residual could it authorize?
```

If the answer reveals multiple independent Review Contracts, split that child recursively.

This may produce:

```text
010-03
    logical family / partition record if needed

010-03-01
    first executable contract

010-03-02
    second executable contract
```

or another repository-consistent hierarchy.

Do not fear nested children when they improve workflow coherence.

Do not create them unnecessarily.

---

# Final-integration prerequisite simulation

This is mandatory.

Before freezing the IDSER-010 split, simulate the final integrated deterministic checkpoint using the proposed children as already-PASS predecessors.

Ask:

> If all proposed implementation children PASS exactly as written, does the final integrated checkpoint have every production capability required to run scenarios A-H and the complete deterministic regression matrix?

Walk the real intended path:

```text
authenticated production project creation
 ↓
DocumentStore
 ↓
bundle / manifest / initial perception kickoff
 ↓
authenticated perception activation
 ↓
NormalizedDocument
 ↓
semantic extraction worker
 ↓
Atlas context/result authority
 ↓
extraction validation/persistence/index
 ↓
reconciliation selection
 ↓
reconciliation worker/result acceptance
 ↓
next-document advancement
 ↓
completion
 ↓
production project card
```

For every transition ask:

```text
Which approved ticket supplies this behavior?

Which executable IDSER-010 child proves it in the deterministic composed path?

Does the final integration ticket merely observe it,
or would it still need to implement something?
```

If final integration would need to implement a meaningful missing production prerequisite, the partition is incomplete.

Create or further split an earlier child before finalizing.

The final integration checkpoint must not become the place where previously unrepresented architectural work is discovered and implemented.

---

# Explicit lesson from IDSER-009-03-01 / 009-03-02

IDSER-009 demonstrated that an integrated checkpoint can expose a missing production prerequisite even after earlier children PASS.

For IDSER-010, detect such prerequisites during planning whenever reasonably possible.

If a missing prerequisite belongs conceptually under an existing responsibility family but represents a distinct authority/proof contract, create a subordinate executable child rather than bloating the parent child.

Conceptual example only:

```text
IDSER-010-0X
    responsibility family

IDSER-010-0X-01
    prerequisite authority A

IDSER-010-0X-02
    prerequisite authority B
```

Do not assume every corrective prerequisite deserves a top-level sibling.

Use the numbering that best preserves traceability to its logical owner.

---

# Future corrective-extension rule

The planning records must also leave a safe path if later CK/integration evidence discovers a genuine omitted production prerequisite despite this audit.

If that happens later:

1. Do not silently broaden an approved sibling.
2. Do not stuff the new prerequisite into a final integration CFC.
3. Do not rewrite prior PASS history.
4. Do not let CK invent new implementation authority.
5. Return the gap to human/planning authority.
6. Preserve historical GO/CK/CFC artifacts.
7. If planning authority confirms that the requirement already existed in the parent IDSER-010 contract but lacked an executable owner, create a narrowly scoped corrective child under the most appropriate responsibility family.
8. Give that child its own Review Contract, security scope, proof harness, GO/CK/CFC/HMN lifecycle and PASS dependency.
9. Make the blocked downstream checkpoint depend on that corrective child before resuming.
10. Do not change product semantics merely to make the checkpoint pass.

This is the IDSER-010 equivalent of the useful part of the later IDSER-009 corrective-child approach.

The objective, however, is to detect as many of these seams as possible now rather than relying on later corrective tickets.

---

# GO-specific sizing simulation

For every executable child, simulate GO before finalizing the planning set.

Ask:

> Can GO derive the complete Review Contract before editing?

Then:

> Can GO implement every required behavior and collect every required proof using the child-authorized harness without intentionally stopping halfway?

Then:

> Is the expected result `READY_FOR_CK`, rather than `IMPLEMENTED_UNPROVEN`?

If NO, split further.

GO must not rely on CK to discover predictable missing proof.

A child may require substantial work.

That is acceptable.

A child may require several test cases.

That is acceptable.

The problem is not size in raw effort.

The problem is **multiple unrelated completion surfaces that make a complete handoff unlikely**.

---

# CK-specific sizing simulation

For every executable child, simulate first CK.

CK must be able to traverse every frozen Review Contract row and reach:

```text
PASS
```

or:

```text
CHANGES_REQUIRED
with one consolidated finite finding set
```

A proposed child is suspicious if CK could reasonably say:

```text
the semantic behavior is correct,

but concurrency proof is missing,

and restart proof uses another harness,

and regression isolation is incomplete,

and browser/CSP proof was not executed,

and negative authority is still unproven
```

unless all of those genuinely form one intentional integration-proof contract.

Implementation children should not have that shape.

The final integration child may inspect many already-approved surfaces, but its own contract must primarily be **composition/evidence**, not several new architectural responsibilities.

---

# CFC-specific sizing simulation

For every proposed child, simulate the likely CFC.

Ordinary CFC findings should be repairable:

```text
inside the same dominant implementation authority

using the same or directly related proof harness

without reopening PASS siblings

without creating new infrastructure

without inventing architecture

without implementing a different scenario family

without becoming another broad GO phase
```

If likely CFC work crosses multiple children, the split is wrong.

---

# HMN-specific sizing simulation

HMN should normally see residuals such as:

```text
one missing bounded negative assertion

one specific queue isolation oracle

one replay call-count proof mismatch

one exact failure no-mutation assertion

one review-contract ambiguity

one directly affected regression repair
```

HMN should not routinely receive:

```text
semantic behavior issue
+
concurrency issue
+
replay issue
+
provider configuration issue
+
browser regression issue
+
security evidence issue
```

for one executable child.

If that is realistic, repartition it.

---

# Child-local validation rule

Each implementation child should have the smallest authoritative validation surface capable of proving its contract.

Conceptually:

```text
focused DB/authority proof

focused worker/provider proof

focused sequencing proof

focused concurrency proof

focused failure proof

focused replay/restart proof

focused regression proof

final composed deterministic proof
```

These are examples, not required child names.

Reuse approved focused predecessor evidence where valid.

Add deterministic production-shaped IDSER-010 evidence where the parent requires composition that predecessors did not prove.

Do not duplicate every scenario across every child.

Do not weaken a required real Compose boundary into a unit fixture merely to keep the child small.

---

# Shared harness rule

If several IDSER-010 children consume the same deterministic provider/Compose test infrastructure, separate:

```text
shared harness capability
```

from:

```text
child-specific scenario authority
```

when doing so improves reviewability.

A foundational harness child is valid only if it establishes a meaningful independently provable infrastructure contract needed by later children.

Do not create a "setup ticket" consisting only of empty scaffolding.

If harness creation is small and inseparable from the first scenario family, keep them together.

If the harness itself includes important provider configuration, job isolation, production-dispatcher enforcement, fixture isolation and deterministic scenario machinery used by many later tickets, it may justify its own child.

Decide from repository inspection.

---

# Explicit deterministic-provider boundary

IDSER-010 must continue to prove the actual production-shaped semantic execution route while using controlled deterministic provider responses.

Preserve:

```text
production dispatcher

MistralProvider capability boundary

existing worker

existing queue

authenticated Atlas context/result handoff

actual persistence

controlled/mock provider endpoint/configuration
```

Do not permit:

```text
TestRuntime semantic authority

fixture authority

a second OCR path

a second semantic worker

a second queue

silent mock fallback

provider credentials required for deterministic CI

mock behavior that bypasses the production MistralProvider boundary
```

IDSER-011 remains responsible for the real API credential/provider checkpoint.

---

# IDSER-011 boundary

Do not absorb IDSER-011.

The deterministic IDSER-010 series may pass without a live `MISTRAL_API_KEY`.

IDSER-011 still proves:

```text
real Mistral OCR
real Mistral structured extraction
real Mistral structured reconciliation
actual provider provenance
real network/provider boundary
```

Update IDSER-011 only as needed so its dependency points to completion of the complete IDSER-010 executable child series rather than an obsolete monolithic IDSER-010 PASS.

Do not alter IDSER-011's substantive live-provider contract.

---

# Every child must have an explicit Review Contract

Each executable child must contain at minimum:

```text
title

state = planned

unique review batch

predecessors

consumed approved contracts

execution environment

authority question / authority and outcome

exact bounded scope

explicit non-authority

implementation responsibility

Review Contract table with stable RC IDs

smallest authoritative proof per RC row

binary closure oracle where useful

security seam ownership

mandatory negative cases

direct regression boundary

CFC repair boundary

HMN residual boundary

hard stop

required handoff
```

The Review Contract must be sufficiently concrete that GO can build a closure ledger before coding and CK can reach a deterministic bounded result.

Avoid wording such as:

```text
ensure pipeline works

verify security

test failures

confirm regressions

handle concurrency
```

without exact required behavior and proof.

---

# Hard-stop requirement

Every executable child must state exactly:

```text
what must be PROVEN before awaiting_review

what authority is complete at that point

what the next child owns

what this child must not start
```

Examples of the intended style:

```text
Child X hard stop:
the deterministic execution harness and isolation contract are proven;
semantic scenario behavior owned by later children does not begin.
```

or:

```text
Child Y hard stop:
the complete bounded failure contract is proven;
restart/replay authority remains owned by the replay child.
```

Use repository-accurate wording derived from the actual split.

The hard stop exists to prevent scope creep forward.

It must not authorize stopping before the current child itself is complete.

---

# Final integration child

The final IDSER-010 executable child must be an integrated deterministic Compose/regression checkpoint.

Its role is to answer the original IDSER-010 final question using the already-approved child contracts.

It should primarily:

- compose the complete production-shaped path;
- run required A-H integration coverage;
- consolidate the AC-01 through AC-40 verification ledger;
- run broad required regressions;
- prove negative authority;
- prove Master remains empty;
- prove no downstream truth authority;
- record exact commands/counts/service health/scenario IDs/DB and queue observations;
- ensure required suites actually executed instead of being skipped;
- produce secret-safe deterministic evidence.

It must not become a hidden implementation catch-all.

A small integration-specific harness/assertion repair is reasonable.

A substantial new production authority, lifecycle rule, worker behavior, persistence contract, concurrency mechanism, or replay design is evidence that a prerequisite child is missing.

During this planning task, create that child instead.

---

# IDSER-010 umbrella disposition

Convert the existing IDSER-010 into a non-executable umbrella / partition authority record.

It must preserve the complete original IDSER-010 contract and clearly state:

```text
IDSER-010 itself is no longer a GO target.

Its children are the executable contracts.

The original parent remains the coverage authority.

Child dependencies/order are explicit.

Scenarios A-H are mapped.

AC verification ownership is mapped.

Security seams are mapped.

Regression ownership is mapped.

Negative authority is mapped.

Failure/recovery ownership is mapped.

Replay/restart ownership is mapped.

IDSER-010 completes only when every required executable child has CK PASS.

Only then may IDSER-011 begin.
```

Do not erase useful original planning history.

---

# Parent-to-child ownership matrices

The IDSER-010 umbrella must contain sufficient matrices to prove the partition is lossless.

At minimum include:

```text
Original IDSER-010 obligation
Implementation/proof child
Final integration owner
Authoritative evidence
Security/review binding if applicable
```

Also include a scenario A-H ownership matrix.

Also include AC-01 through AC-40 deterministic verification ownership.

Also include original security seam/review-binding ownership.

Also include regression and negative-authority ownership.

Do not leave ambiguous ownership.

---

# Recursive child/extension traceability

If a child is further partitioned, preserve the logical relationship.

For example:

```text
IDSER-010-03
    partition/ownership family if needed

IDSER-010-03-01
    executable prerequisite

IDSER-010-03-02
    executable prerequisite
```

If the parent `010-03` becomes only an umbrella for its nested children, mark it explicitly non-executable.

If `010-03` remains executable and `010-03-01` is merely a later corrective ticket, make that history explicit instead.

Never leave GO guessing which record is executable.

Every executable record gets its own distinct review batch.

---

# Dependency discipline

A child may consume a predecessor only after that predecessor receives CK `PASS`.

Approved predecessor tickets are frozen interfaces.

Do not reopen them merely because IDSER-010 is testing integration.

If deterministic integration uncovers a true incompatibility with a frozen predecessor:

```text
record exact evidence

identify the frozen contract involved

classify the issue as SCOPE_CHANGE / HUMAN_DECISION_REQUIRED as appropriate

do not silently redesign the predecessor

do not hide the architecture change inside an IDSER-010 CFC
```

If the observed gap is instead an original IDSER-010 requirement that simply lacked a child owner, correct the IDSER-010 partition under planning authority.

---

# Planning-only execution

This task authorizes planning/ticket decomposition only.

Do not:

```text
run GO

run CK

run CFC

issue HMN authorization

implement production behavior

create migrations

change worker/runtime behavior

create production test hooks

claim a child is implemented

claim PASS

begin IDSER-011
```

Repository inspection and non-mutating analysis are allowed.

Commit only planning/ticket changes required for the partition.

---

# Required child sizing self-check

Before finalizing, evaluate EVERY executable child:

| Question | Required |
| --- | --- |
| Can GO understand the complete child before coding? | YES |
| Can GO enumerate the complete Review Contract before coding? | YES |
| Can GO finish implementation and mandatory proof before handoff? | YES |
| Is `IMPLEMENTED_UNPROVEN` an avoidable/unlikely normal outcome? | YES |
| Does the child represent a meaningful coherent checkpoint rather than administrative fragmentation? | YES |
| Does it have one dominant authority/proof surface or tightly coupled family? | YES |
| Can CK completely review it in one bounded pass? | YES |
| Can CK freeze one finite finding set? | YES |
| Are likely findings locally repairable by CFC? | YES |
| Can CFC normally finish the complete authorized finding set before returning to CK? | YES |
| Would HMN receive only a narrow residual? | YES |
| Are sibling responsibilities explicitly excluded? | YES |
| Are inherited security obligations bounded to this child? | YES |
| Does the hard stop require the current child to be complete rather than merely partially implemented? | YES |

If any material answer is NO:

**do not finalize that child.**

Merge, split, or recursively partition it as appropriate.

---

# Required whole-partition self-check

After every child passes its local sizing check, evaluate the full partition.

Confirm:

```text
every original IDSER-010 functional requirement has an owner

every scenario A-H has an owner

every IDSER-010 AC verification obligation has an owner

every security seam has an owner

every mandatory review binding has an owner

every regression requirement has an owner

every negative-authority requirement has an owner

every failure injection has an owner

every recovery requirement has an owner

every concurrency requirement has an owner

every replay/restart requirement has an owner

every focused semantic/boundary requirement has an owner

the deterministic provider boundary is preserved

TestRuntime prohibition is preserved

explicit mock configuration is preserved

silent fallback prohibition is preserved

secret-safe evidence is preserved

Master-empty invariant is preserved

no revision / HEAD movement is preserved

/demo isolation is preserved

IDSER-011 live-provider boundary is preserved
```

Then perform the final-integration prerequisite simulation described above.

If the simulated final integration still needs to invent substantial behavior, the partition is not finished.

Repartition before committing.

---

# Required deliverables

Commit only the planning/ticket changes required for the IDSER-010 split.

Expected output includes:

1. IDSER-010 converted into the authoritative non-executable umbrella.
2. All necessary executable IDSER-010 child tickets.
3. Nested child/subchild tickets where justified by actual authority/proof boundaries.
4. Complete original functional-scope mapping.
5. Complete scenario A-H mapping.
6. Complete AC-01 through AC-40 IDSER-010 verification mapping.
7. Complete original security-seam mapping.
8. Complete mandatory review-binding mapping.
9. Complete regression ownership.
10. Complete negative-authority ownership.
11. Complete failure/recovery/replay/concurrency ownership.
12. Initial Draft README dependency/execution order updated.
13. IDSER-011 dependency updated to the complete IDSER-010 series where required.
14. Child-specific sizing self-checks.
15. Whole-partition integration-prerequisite self-check.
16. No production implementation changes.

---

# Final response

After the planning commit, report:

```text
Inspected HEAD

Final IDSER-010 executable structure

For every child:
- responsibility
- dominant authority
- dominant proof harness
- scenario ownership where applicable
- AC ownership where applicable
- inherited security scope
- explicit non-authority
- hard stop
- why GO can finish implementation + proof before CK
- why CK can make one bounded decision
- why CFC remains local
- what HMN would be permitted to resolve

Any nested child structure and why it was necessary

Final integration ticket and why it contains proof/composition rather than hidden implementation

Parent-to-child coverage audit result

Files changed

Planning commit SHA
```

Explicitly confirm:

```text
no production implementation began

no GO execution occurred

no CK execution occurred

no CFC execution occurred

no HMN authorization was issued

no original IDSER-010 requirement was dropped

no original IDSER-010 security obligation was dropped

no original regression obligation was dropped

no scenario A-H was left without ownership

no IDSER-010 AC verification obligation was left without ownership

the final integration simulation found no unowned production prerequisite

IDSER-011 remains the live Mistral checkpoint
```

---

# Success criterion

Do not judge this task by ticket count.

Do not judge it by Markdown size.

Do not judge it merely because all parent text appears somewhere in child files.

The split succeeds only when every executable contract is expected to behave like:

```text
coherent frozen child
       ↓
GO completes implementation
       +
GO completes all mandatory proof
       ↓
READY_FOR_CK
       ↓
CK sees the entire bounded contract
       ↓
PASS
```

or, for a genuine defect:

```text
coherent frozen child
       ↓
GO
       ↓
READY_FOR_CK
       ↓
CK
       ↓
one finite frozen defect set
       ↓
CFC repairs the complete authorized set
       ↓
READY_FOR_CK
       ↓
CK
       ↓
PASS
```

The partition fails if:

```text
GO is expected to stop with required work still inside the same child

or

CK can still discover several unrelated categories of missing proof

or

CFC predictably becomes another multi-domain implementation phase

or

HMN routinely has to authorize unfinished ordinary work

or

the final integration checkpoint discovers a meaningful production prerequisite that should have been represented by an earlier executable contract
```

Optimize the partition specifically against those failure modes.

The desired outcome is:

**not too short, not too broad, complete enough to be meaningful, bounded enough to finish, and coherent enough that GO -> CK -> CFC -> HMN remains a controlled workflow instead of a continuation mechanism for unfinished work.**
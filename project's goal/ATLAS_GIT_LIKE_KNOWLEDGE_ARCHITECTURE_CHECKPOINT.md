# Atlas Architecture Checkpoint
## Git-Like Knowledge Repository for Incremental Project Truth

**Checkpoint date:** 2026-09-04

This document captures the current agreed architecture direction for Atlas.

The core idea is:

> Atlas should behave like "Git for project truth": immutable history, staged changes, approval as commit, branch-specific current truth, semantic merges, and cheap reads from a materialized current state.

The LLM is allowed to interpret dynamic PRDs and user corrections, but it does not own truth. Atlas owns the accepted knowledge state.

---

# 1. Core Problem

Atlas needs to support:

- Arbitrary and incremental PRDs.
- New PRDs that expand or modify existing knowledge.
- Immutable source artifacts.
- User corrections mediated through the chatbot.
- Approval before a correction becomes accepted truth.
- Branches/workspaces for concurrent changes.
- Main Workflow showing only the current truth.
- Project Facts showing current truth plus provenance and history.
- CES Result consuming current accepted truth.
- Chatbot reads without rescanning all historical PRDs.
- Chatbot corrections without directly mutating canonical state.
- Deterministic current-state resolution.
- Reproducible and auditable historical state.

The design must avoid this pattern:

```text
Every UI request / chatbot question
-> scan all PRDs
-> ask LLM what is currently true
-> regenerate JSON
```

Instead:

```text
New information arrives
-> reason once
-> stage change
-> validate
-> approve
-> commit
-> materialize new current state

Normal reads
-> read current state directly
```

This is the central architectural rule:

> Interpret once when knowledge changes; read many times from the resolved current state.

---

# 2. Git Mental Model

Atlas should borrow the concepts of Git, but not necessarily Git's actual storage implementation.

| Git Concept | Atlas Equivalent |
|---|---|
| Repository | Project |
| File/blob | Immutable PRD, Addendum, evidence artifact |
| Working changes | Newly uploaded PRD or user correction |
| Staging area/index | ChangeProposal waiting for approval |
| Commit | Approved knowledge revision |
| Tree/snapshot | Canonical project state at a revision |
| Branch | Atlas workspace / sub-work |
| HEAD | Current accepted revision of a branch |
| master/main | Published project truth |
| Merge | Publish approved branch into Master |
| Merge conflict | Conflicting semantic changes requiring resolution |
| git log | Project Facts history |
| git blame | Fact provenance / evidence |
| checkout/switch | Workspace selector |

Important consequence:

> Reading the current branch state must not require replaying or rescanning the complete project history.

---

# 3. High-Level Architecture

```text
                           USER
                            |
                +-----------+-----------+
                |                       |
             Upload                  Chatbot
             PRD                     correction
                |                       |
                +-----------+-----------+
                            |
                            v
                     CHANGE INPUT
                            |
                            v
                     Agents Bridge
                            |
                     Model Adapter
                            |
                 Atlas Reasoning Skills
                 +----------+----------+
                 |                     |
                 v                     v
           Main Workflow          Project Facts
             reasoning              reasoning
                 +----------+----------+
                            |
                            v
                    ChangeProposal
                       [STAGING]
                            |
                   schema validation
                            |
                  deterministic rules
                            |
                   chatbot mediation
                     if ambiguous
                            |
                            v
                         APPROVE
                            |
                     generate/seal
                        addendum
                            |
                            v
                         COMMIT
                            |
              +-------------+-------------+
              |                           |
              v                           v
       immutable history             branch HEAD
                                          |
                                          v
                               CURRENT CANONICAL STATE
                                          |
                      +-------------------+-------------------+
                      |                   |                   |
                      v                   v                   v
               Main Workflow       Project Facts             CES
                projection        + provenance/history     evaluation
                      |                   |                   |
                      +-------------------+-------------------+
                                          |
                                          v
                                       Chatbot
```

Publishing is a separate operation:

```text
branch HEAD
     |
     | semantic three-way merge
     v
master HEAD
```

---

# 4. Knowledge Is Not Stored as UI JSON

Atlas should not use this as the canonical source of truth:

```json
{
  "mainWorkflow": {},
  "projectFacts": {},
  "cesResults": {}
}
```

Those are projections.

The durable knowledge model should instead contain assertions and relations such as:

```json
{
  "assertion_id": "ast_204",
  "kind": "constraint",
  "subject": "manager_approval",
  "predicate": "required_above",
  "value": {
    "amount": 300000000,
    "currency": "IDR"
  },
  "scope": {
    "transaction_type": "international"
  },
  "source": {
    "artifact_id": "PRD-08",
    "page": 7
  },
  "status": "approved"
}
```

Main Workflow, Project Facts, CES, and the chatbot all consume the same accepted knowledge.

This gives Atlas:

```text
One canonical truth
-> many deterministic views
```

rather than:

```text
Main Workflow truth
Project Facts truth
CES truth
Chatbot truth
```

---

# 5. New PRD Flow

Assume Master currently contains:

```text
manager threshold = Rp250m
payment deadline   = 48h
refund period      = 14d
```

Master points to:

```text
master -> rev_100
```

A user uploads `PRD-08`.

Atlas creates a branch/workspace based on the current Master revision:

```text
master -> rev_100

prd-08 -> rev_100
```

No previous PRDs need to be rescanned.

Only `PRD-08` enters the extraction/reasoning pipeline.

Suppose it says:

```text
Manager approval is required only for international transactions
above Rp300 million.
```

The model may produce:

```json
{
  "type": "change_proposal",
  "target": "manager_approval_rule",
  "operation": "replace",
  "proposed": {
    "scope": "international_transaction",
    "threshold": {
      "amount": 300000000,
      "currency": "IDR"
    }
  },
  "evidence": {
    "artifact": "PRD-08",
    "page": 7
  }
}
```

This is not truth.

It is a proposal.

---

# 6. Targeted Current-State Lookup

The proposal identifies the affected semantic target:

```text
manager_approval_rule
```

Atlas then reads only the relevant current state:

```json
{
  "fact_id": "manager_approval_rule",
  "scope": "all_transactions",
  "threshold": 250000000,
  "active_assertion": "ast_117"
}
```

The model/resolver works from:

```text
CURRENT:
all transactions > Rp250m

INCOMING:
international transactions > Rp300m
```

Not from:

```text
PRD-01
PRD-02
PRD-03
...
PRD-08
```

This is how Atlas stays incremental.

---

# 7. Staging: ChangeProposal

The chatbot and/or extraction pipeline should normalize the new information into a staged change.

Example:

```text
STAGED CHANGE

manager_approval_rule

BEFORE
scope     = all transactions
threshold = Rp250m

AFTER
scope     = international transactions
threshold = Rp300m

SOURCE
PRD-08 page 7
```

Internally:

```json
{
  "proposal_id": "proposal_882",
  "base_revision": "rev_100",
  "target_object": "manager_approval_rule",
  "before_assertion": "ast_117",
  "proposed_assertion": "ast_candidate_204",
  "status": "staged"
}
```

The staging area is where ambiguous or conversational information becomes explicit before it can enter Atlas truth.

---

# 8. Chatbot as Correction Mediator

The chatbot has two responsibilities:

```text
CHATBOT
  |
  +-> READ PATH
  |
  +-> CORRECTION PATH
```

## Read Path

Examples:

```text
"What is the current manager threshold?"
-> get_current_fact(...)

"What was it before?"
-> get_fact_history(...)

"How does manager approval work?"
-> get_workflow(...)

"What CES concerns apply?"
-> get_ces_result(...)
```

The chatbot does not rescan PRDs for these questions.

It reads the branch's current resolved state.

## Correction Path

User says:

```text
No, Rp300m applies to both domestic and international transactions.
```

The chatbot does not mutate the fact.

It creates a normalized ChangeProposal:

```text
BEFORE
scope = international

AFTER
scope = all transactions
```

If Atlas detects ambiguity:

```text
Atlas
-> returns needs_resolution
-> chatbot asks the user a targeted question
-> user answers
-> ChangeProposal is revised
```

Only after the interpretation is explicit does it proceed to approval.

The chatbot therefore acts as:

> A semantic mediator between messy human intent and strict Atlas knowledge changes.

---

# 9. Validation Layers

A staged proposal should pass multiple gates.

## 9.1 Structural Validation

Use:

- JSON Schema 2020-12
- Ajv in TypeScript
- Groq Structured Outputs when supported by the selected model

Example checks:

```text
amount must be a number
currency must be a valid string
source artifact must be present
required fields must exist
unknown fields may be rejected
```

## 9.2 Deterministic Semantic Validation

Initially use plain TypeScript domain functions:

```text
validateChangeProposal()
validateSupersession()
validateEvidence()
validateBranchHead()
validateConflictState()
```

Examples:

```text
A correction must target an existing semantic object.

A supersession cannot silently destroy the old assertion.

An unresolved conflict cannot become active truth.

The referenced source artifact must exist.

The branch HEAD must still equal the proposal base revision
before commit.
```

CEL may be introduced later if Atlas needs:

- configurable runtime rules,
- portable rules between languages,
- externally-defined policies,
- declarative CES rules.

Do not introduce CEL only for the sake of having a rule engine.

---

# 10. Approval as Commit

A proposal that passes validation remains staged until approved.

```text
ChangeProposal
-> validation
-> approval
-> commit
```

An approved change creates a new revision:

```json
{
  "revision_id": "rev_101",
  "parents": [
    "rev_100"
  ],
  "changes": [
    {
      "supersedes": "ast_117",
      "establishes": "ast_204"
    }
  ],
  "artifacts": [
    "PRD-08"
  ],
  "schema_version": "1.3",
  "resolver_version": "1.1",
  "created_at": "..."
}
```

Then:

```text
BEFORE

prd-08 -> rev_100


AFTER

prd-08 -> rev_101 -> rev_100
```

The old assertion remains immutable.

The branch pointer moves.

---

# 11. Addendum Relationship

For user corrections, the accepted correction should generate/seal an Addendum before the commit becomes authoritative.

Example:

```text
User correction
-> chatbot mediation
-> ChangeProposal
-> Atlas validation/reasoning
-> approval
-> immutable Addendum
-> assertions/revision
-> commit
```

The original PRD remains unchanged.

The Addendum becomes the auditable source of the accepted correction.

---

# 12. Materialized Current State

Atlas should not replay every revision whenever something needs the current value.

After committing `rev_101`, update the branch's materialized current state.

Example:

```text
branch_current_facts

branch: prd-08

manager_approval_threshold = Rp300m
manager_approval_scope     = international
```

Normal reads should be:

```text
branch HEAD
-> materialized current state
-> response
```

not:

```text
branch HEAD
-> replay full history
-> scan all source PDFs
-> ask LLM
-> response
```

The materialized current state is effectively Atlas's working tree at HEAD.

---

# 13. Main Workflow Projection

Main Workflow answers:

> How does the system currently work?

It only needs current truth.

Prefer references to facts rather than copied values.

Do not store:

```json
{
  "condition": "amount > 300000000"
}
```

Prefer:

```json
{
  "node_id": "wf_manager_check",
  "condition": {
    "left": "transaction.amount",
    "operator": ">",
    "right_fact_ref": "manager_approval_threshold"
  },
  "scope_fact_ref": "manager_approval_scope"
}
```

Rendering resolves:

```text
manager_approval_threshold = Rp300m
manager_approval_scope     = international
```

into:

```text
Transaction
    |
    v
International?
    |
   yes
    |
    v
Amount > Rp300m?
  +-- no  -> Continue
  |
  +-- yes -> Manager Approval
```

The workflow topology can remain unchanged when only a referenced fact changes.

---

# 14. Project Facts Projection

Project Facts answers:

> What is currently true, where did it come from, and what was true before?

Example:

```text
Manager Approval Threshold

CURRENT
Rp300m
PRD-08 - Page 7

HISTORY
Rp250m
ADD-02 - Page 3

Rp100m
PRD-01 - Page 17
```

History can follow assertion relationships:

```text
ast_204
  supersedes
      |
      v
ast_117
  supersedes
      |
      v
ast_041
```

No source-document rescan is necessary.

This is conceptually similar to:

```text
git log
+
git blame
```

for project truth.

---

# 15. CES Result

CES consumes the branch's resolved current truth and current workflow semantics.

It should not independently rediscover project truth from all PRDs.

Conceptually:

```text
CURRENT CANONICAL STATE
        |
        +-> Main Workflow
        |
        +-> Project Facts
        |
        +-> CES evaluation
```

CES results should record both:

```text
project_revision
CES_baseline_version
```

Example:

```text
project_revision = rev_101
ces_baseline_version = ces-2026.09
```

This allows project truth and CES knowledge to evolve independently.

---

# 16. Dependency Tracking

Atlas should track which projections/evaluations depend on which facts.

Example:

```text
manager_approval_threshold
      |
      +-> workflow node wf_019
      |
      +-> Project Fact pf_033
      |
      +-> CES rule AUTH-03
      |
      +-> CES rule AUDIT-07
```

If:

```text
Rp250m -> Rp300m
```

Atlas invalidates/recomputes only:

```text
wf_019
pf_033
AUTH-03 result
AUDIT-07 result
```

It should not regenerate the entire Atlas project.

This is dependency-driven incremental recomputation.

---

# 17. Branch-Aware Chatbot Reads

The chatbot must always reason against the selected workspace/branch HEAD.

Example:

```text
Workspace: PRD-08
HEAD: rev_101
```

Question:

```text
What is the manager threshold?
```

Result:

```text
Rp300m
```

Switch to:

```text
Workspace: Master
HEAD: rev_100
```

The same question may return:

```text
Rp250m
```

because PRD-08 has not yet been published to Master.

The chatbot therefore reads truth relative to the active branch.

---

# 18. Publishing to Master: Semantic Three-Way Merge

Publishing a branch should not blindly replace Master.

Use three-way semantic merge:

```text
BASE
common ancestor revision

OURS
current Master HEAD

THEIRS
branch HEAD
```

Example:

```text
BASE
payment deadline = 48h

MASTER
payment deadline = 72h

BRANCH
payment deadline = 24h
```

Atlas detects:

```text
SEMANTIC MERGE CONFLICT

base   = 48h
master = 72h
branch = 24h
```

It should not silently choose.

The chatbot can mediate the conflict with the user.

Once resolved, the merge creates a new Master revision with multiple parents, conceptually like a Git merge commit.

This is a semantic merge over knowledge objects rather than a text-line merge.

---

# 19. Optimistic Concurrency

Every ChangeProposal records the HEAD it started from.

Example:

```text
base_revision = rev_101
```

Before commit:

```text
Is branch HEAD still rev_101?
```

If yes:

```text
commit change
```

If HEAD has moved to `rev_109` because another user committed first:

```text
do not blindly commit
-> compare proposal against new HEAD
-> re-resolve or raise conflict
```

This prevents stale writes in multi-user workspaces.

---

# 20. Suggested Storage Model

PostgreSQL should be sufficient initially.

Use relational identifiers and relationships, with JSONB for flexible semantic payloads.

Possible tables:

```text
artifacts
---------
id
project_id
hash
type
storage_path
created_at


assertions
----------
id
semantic_key
kind
payload JSONB
source_artifact_id
effective_at
created_at


revisions
---------
id
project_id
parent_revision_ids
schema_version
resolver_version
snapshot_hash
created_by
created_at


revision_changes
----------------
revision_id
assertion_id
operation


branches
--------
id
project_id
name
base_revision_id
head_revision_id


change_proposals
----------------
id
branch_id
base_revision_id
payload JSONB
status


current_facts
-------------
branch_id
semantic_key
active_assertion_id
resolved_value JSONB
head_revision_id


workflow_projection
-------------------
branch_id
node_id
payload JSONB
head_revision_id


dependencies
------------
source_key
consumer_type
consumer_id


ces_results
-----------
branch_id
project_revision_id
ces_baseline_version
rule_id
result JSONB
```

The exact tables may change, but the separation should remain.

---

# 21. Tooling Recommendation

## Core

| Need | Recommendation |
|---|---|
| LLM provider | Groq |
| Provider isolation | Existing model adapter |
| Structured model output | Groq Structured Outputs |
| Schema contract | JSON Schema 2020-12 |
| TypeScript runtime validation | Ajv |
| Deterministic domain rules | TypeScript pure functions |
| Storage | PostgreSQL |
| Flexible semantic payloads | PostgreSQL JSONB |
| Artifact storage | Immutable object storage |
| Read architecture | Materialized CQRS-style projections |
| History model | Append-only assertions and revisions |
| Branch model | Git-like refs over a revision DAG |
| Merge strategy | Semantic three-way merge |
| Concurrency | Optimistic HEAD check |
| Dependency recomputation | Explicit dependency graph |
| Hash integrity | SHA-256 |
| Canonical JSON hashing | RFC 8785 JCS, optional |
| External agent/tool protocol | MCP later, if needed |

## Do Not Add Yet Without a Concrete Need

Do not introduce these only because they are popular:

```text
Kafka
EventStoreDB
LangChain
LangGraph
BAML
Guardrails
Instructor
dedicated graph database
vector database
CEL
MCP
```

Some may become useful later, but they are not required to establish the core truth model.

---

# 22. Architecture Principles

These should be treated as Atlas architecture invariants.

## 22.1 Immutable Source Principle

PRDs and Addenda are never rewritten.

Corrections create new immutable artifacts/assertions.

## 22.2 Interpret Once, Read Many

LLM reasoning happens primarily when knowledge enters or changes.

Normal reads use materialized current state.

## 22.3 Proposal Is Not Truth

LLM output is always a proposal until validation and approval complete.

## 22.4 Approval Creates History

Accepted changes create immutable assertions and revisions.

## 22.5 HEAD Defines Current Truth

Every branch has a current accepted revision.

## 22.6 Current Truth Is Materialized

Do not replay project history during normal UI/chatbot reads.

## 22.7 One Truth, Many Projections

Main Workflow, Project Facts, CES, and chatbot must not maintain separate competing truths.

## 22.8 References Over Duplicated Values

Workflow and CES objects should reference canonical fact identifiers where practical rather than copying literal values.

## 22.9 Incremental Recalculation

Only consumers affected by changed facts should be invalidated/recomputed.

## 22.10 Semantic Three-Way Merge

Branch publication must compare:

```text
common base
current Master
branch HEAD
```

rather than simply overwriting Master.

## 22.11 Ambiguity Stops the Commit

If Atlas cannot safely resolve a contradiction or correction, it must surface an explicit conflict.

## 22.12 Chatbot Mediates, Never Silently Mutates

The chatbot can:

```text
read truth
explain truth
collect corrections
normalize corrections
mediate ambiguity
stage ChangeProposals
```

It cannot silently redefine canonical truth.

## 22.13 Current Truth Is the Default Chatbot Context

Historical facts are retrieved only when:

```text
the user explicitly asks about history/change
or
history is necessary to explain a conflict
```

## 22.14 Version the Interpretation System

Every revision should record relevant versions, such as:

```text
schema_version
resolver_version
extraction_skill_version
```

This makes future migrations and audits explainable.

## 22.15 CES Is Independently Versioned

A project revision and a CES baseline version are separate dimensions.

---

# 23. Important Boundary: Dynamic vs Deterministic

Atlas should not try to make the entire system deterministic.

Dynamic parts:

```text
PRD wording
business domain
LLM interpretation
user corrections
chatbot language
unknown project vocabulary
```

Deterministic/governed parts:

```text
schemas
validation
approval state
immutable assertions
revision graph
branch HEAD
resolution rules
current materialized truth
dependency relationships
merge rules
projection contracts
chatbot tool responses
```

Therefore:

> The dynamic system ends at the ChangeProposal boundary. Accepted project truth begins only after deterministic validation, explicit approval, and commit.

---

# 24. Core Lifecycle

The complete normal lifecycle is:

```text
NEW PRD / ADDENDUM / CORRECTION
              |
              v
       extract new information
              |
              v
       identify affected objects
              |
              v
       retrieve current branch state
              |
              v
       generate ChangeProposal
              |
              v
       deterministic validation
              |
              v
       chatbot mediation if needed
              |
              v
            APPROVE
              |
              v
       generate/seal Addendum
         when applicable
              |
              v
            COMMIT
              |
              v
       move branch HEAD
              |
              v
      update current materialized state
              |
              v
      invalidate affected dependencies
              |
        +-----+-----+
        |     |     |
        v     v     v
       MW     PF    CES
```

Normal reads are much simpler:

```text
UI / CHATBOT REQUEST
        |
        v
selected branch HEAD
        |
        v
current materialized state
        |
        v
targeted projection/tool response
```

No full PRD scan.

---

# 25. Final Mental Model

Atlas should be thought of as:

```text
A Git-like semantic knowledge repository
```

where AI is primarily used around:

```text
new input interpretation
semantic diff generation
change staging
ambiguity mediation
conflict assistance
```

AI should not sit inside every read request reconstructing the repository.

A concise version is:

```text
Immutable knowledge history
          +
Git-like revisions and branches
          +
Materialized HEAD state
          +
Deterministic validation/resolution
          +
Semantic three-way merge
          +
Chatbot correction mediation
          =
Atlas project truth architecture
```

Or even shorter:

> Atlas behaves like Git for project truth. The LLM helps prepare the diff; Atlas decides what can be committed.

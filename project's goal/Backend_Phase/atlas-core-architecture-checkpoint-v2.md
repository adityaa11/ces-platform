# Atlas Core Architecture — Updated Checkpoint

## Core Principle

> **Atlas derives durable project knowledge from immutable human-readable documents, reconciles that knowledge into workspace truth, and reasons over that truth without losing its source provenance.**

```text
Documents
   |
   v
Extraction
   |
   v
Knowledge Retrieval
   |
   v
Reconciliation
   |
   v
Resolved Workspace Knowledge
   |
   +------------------+
   |                  |
   v                  v
Human Projections   CES Assessment
Workflow / Facts        |
   |                    v
   |                CES Result
   +---------+----------+
             |
             v
       Review / Chatbot
             |
             v
Addendum when correction is required
             |
             v
same Atlas document cycle
             |
             v
           Publish
```

The architecture is divided into **ten responsibilities**.

These are architectural sections, **not a declaration that Atlas must have ten skills**. Each section can later be implemented through reasoning skills, deterministic services, schemas, indexes, or combinations of them.

---

# Section 1 — Project, Workspace & Revision Lifecycle

Define the deterministic skeleton in which everything else operates.

```text
Project
|
+-- Master
|
+-- Workspace
    +-- base revision
    +-- source documents
    +-- extracted knowledge
    +-- reconciled state
    +-- review state
```

## Initial lifecycle

```text
Create Project
    |
    v
Empty Master
    +
Initial Draft
    |
    v
Initial PRD processing
    |
    v
Review
    |
    v
Publish
    |
    v
Master
```

## Subsequent lifecycle

```text
Create Workspace
    |
    v
Choose Base
    |
    v
Upload PRD
    |
    v
Reconcile with Base
    |
    v
Review
    |
    v
Publish
    |
    v
Master
```

This section establishes:

- workspace isolation;
- base revisions;
- revision history;
- workspace HEAD;
- approval state;
- publication;
- Master advancement.

This should primarily be **deterministic infrastructure**, not model reasoning.

---

# Section 2 — Immutable Document Model

Define the fundamental source-of-knowledge contract.

Atlas has two primary project document origins:

```text
Externally authored
        |
        v
       PRD


Atlas-assisted human correction
        |
        v
     Addendum
```

Both ultimately become:

```text
IMMUTABLE SOURCE DOCUMENT
```

PRDs are never rewritten when something changes.

For example:

```text
PRD-001

"The quota is 40."
```

A later correction becomes:

```text
ADD-003

"For Special departures,
the quota is 45.

This replaces the previous quota only
for Special departures."
```

The document history therefore preserves what humans actually specified over time.

An Addendum must be:

- human-readable;
- exportable;
- understandable without hidden Atlas state;
- immutable after acceptance;
- sufficiently complete to reconstruct its intended semantics.

This gives Atlas its rebuild property:

```text
PRDs + Addenda
      |
      v
Extraction
      |
      v
Reconciliation
      |
      v
Project Knowledge
```

Documents are the durable reconstructable source.

Caches, indexes, resolved state, and projections are replaceable operational structures.

---

# Section 3 — Document Extraction & Semantic Candidate Model

This is the first major reasoning boundary.

```text
Immutable Document
       |
       v
Atlas Extraction
       |
       v
Semantic Candidates
```

Extraction identifies meaningful project semantics such as:

```text
actors
business objects
rules
constraints
conditions
decisions
workflow steps
state transitions
relationships
responsibilities
outputs
acceptance expectations
exceptions
etc.
```

Every candidate remains grounded in document evidence.

The extraction result is **not UI copy**.

It is a generic semantic representation that later Atlas capabilities can reason over.

For example:

```text
Source:

"Sistem tidak boleh menerima pendaftaran
apabila kuota keberangkatan telah penuh."
```

could produce semantic meaning equivalent to:

```text
subject:
registration

constraint:
registered_count <= departure_quota

condition:
departure quota exhausted

effect:
registration rejected
```

while retaining the original source evidence.

## Project-native terminology

This section also captures project-native vocabulary such as:

```text
jemaah
pendaftaran
jadwal keberangkatan
kuota
harga pendaftaran
```

This project terminology is conceptually separate from the CES assurance knowledge discussed later.

It answers:

> **What do these concepts mean inside this project?**

---

# Section 4 — Knowledge Indexing & Targeted Retrieval

This solves the full-scan problem.

Atlas should not respond to:

```text
"Special departure quota is 45."
```

by scanning every historical PRD, Addendum, and assertion.

Instead:

```text
Incoming Candidate
       |
       v
Semantic Anchors
       |
       v
Knowledge Index
       |
       v
Relevant Knowledge Neighborhood
```

Potential retrieval signals include:

```text
semantic identity
business object
property
actor
condition
relationship
workflow neighborhood
project terminology
dependency
optional semantic/vector similarity
```

The critical boundary is:

> **Retrieval discovers potentially relevant knowledge. It does not determine truth.**

Reconciliation determines what the retrieved knowledge means relative to incoming knowledge.

This retrieval infrastructure can eventually support:

```text
PRD reconciliation
Addendum reconciliation
chatbot query
chatbot exploration
chatbot correction
CES project-context retrieval
```

CES will additionally require targeted retrieval from its own assurance knowledge baseline.

---

# Section 5 — Semantic Reconciliation

Once relevant existing knowledge is retrieved:

```text
Incoming Candidate
        +
Relevant Existing Knowledge
        |
        v
Reconciliation
```

Atlas reasons about relationships such as:

```text
new
supports
duplicates
refines
extends
contradicts
supersedes
partially supersedes
ambiguous
requires resolution
```

For example:

```text
Existing:

quota = 40


Incoming:

Special departure quota = 45
```

must not automatically become:

```text
40 -> 45
```

The actual resulting semantics may be:

```text
General departure:
quota = 40

Special departure:
quota = 45
```

Reconciliation is therefore the heart of Atlas's **knowledge evolution**.

The same reconciliation machinery should operate whether incoming knowledge originated from:

```text
PRD
or
Addendum
```

because both become source documents before entering the Atlas knowledge pipeline.

---

# Section 6 — Resolved Knowledge & Dependency Model

Extraction and reconciliation produce an efficient current semantic state.

```text
Documents
   |
   v
Candidates
   |
   v
Reconciliation
   |
   v
RESOLVED WORKSPACE KNOWLEDGE
```

Resolved knowledge should preserve:

```text
current semantic meaning
provenance
source evidence
supersession
relationships
dependencies
revision
workspace
```

This is the state Atlas normally reads.

It should not reconstruct the entire project from historical documents for every operation.

Documents remain the reconstructable source.

Resolved knowledge becomes the efficient operational state.

## Dependency model

Atlas also needs to know what depends on what.

For example:

```text
quota rule
   |
   +-- registration constraint
   |
   +-- workflow condition
   |
   +-- displayed remaining quota
   |
   +-- CES assessments
```

If the quota semantics change, Atlas can determine the affected semantic neighborhood.

This enables:

> **Incremental recomputation instead of project-wide regeneration.**

---

# Section 7 — Main Workflow & Project Facts

Main Workflow and Project Facts are human-facing projections of resolved project semantics.

They do **not** independently reinterpret PRDs.

```text
                 Resolved Knowledge
                  /             \
                 /               \
                v                 v
         Main Workflow       Project Facts
```

## Main Workflow

Answers:

> **How is this project/system supposed to operate?**

It reconstructs meaningful operational flows from things such as:

```text
actors
triggers
steps
conditions
branches
states
rules
dependencies
outputs
exceptions
```

For example:

```text
Admin selects jemaah
        |
        v
Select open departure
        |
        v
Check remaining quota
        |
        +-- available --> Register
        |
        +-- full ------> Reject
```

## Project Facts

Answers:

> **What does Atlas currently know to be true about this project?**

For example:

```text
A departure has a quota.

Registration cannot exceed departure quota.

Registration preserves the agreed price
at the time of registration.
```

Both surfaces must resolve from the same semantic state.

Therefore they cannot silently disagree.

## Important CES boundary

CES does **not** scrape the rendered Main Workflow or Project Facts UI.

Instead:

```text
                 Resolved Knowledge
                /        |        \
               v         v         v
          Workflow     Facts      CES
```

Workflow, Facts, and CES are different consumers of the same underlying project semantics.

---

# Section 8 — CES Reasoning & Assurance Knowledge

CES is a distinct semantic reasoning capability.

It does **not** merely summarize PRDs, restate acceptance criteria, or copy Project Facts.

CES asks:

> **Given what this project is required to do, what foreseeable engineering, operational, control, and verification concerns should the team be aware of?**

There are two knowledge sides involved.

## 8.1 Project Knowledge Side

```text
Resolved Knowledge
   |
   +-- workflow semantics
   +-- current project facts
   +-- relationships
   +-- constraints
   +-- project-native terminology
   +-- provenance
```

This represents:

> **What this particular project means and currently requires.**

---

## 8.2 CES Assurance Knowledge Side

The machine-consumed assurance sources are:

```text
OWASP ASVS
OWASP WSTG
NIST CSF
NIST SP 800-53
```

ISO/IEC 27001 and ISO/IEC 27002 are excluded from machine-consumed CES reasoning because of their licensing restrictions.

These sources should not simply be dumped into a model prompt.

Instead:

```text
OWASP ASVS ------+
OWASP WSTG ------+
NIST CSF --------+--> Governed Assurance Knowledge
NIST SP 800-53 --+
                         |
                         v
                 normalized/indexed
                   CES Baseline
```

The exact normalization architecture is **not locked yet**.

We may eventually need canonical concepts or a taxonomy because the four assurance sources use different terminology.

However, we should not reproduce the large legacy `worker1` Policy architecture simply because it existed.

The amount of normalization should be driven by actual CES requirements.

---

## 8.3 CES Assurance Provenance

Governed assurance knowledge should retain enough identity to explain where it came from.

Conceptually:

```text
CES Assurance Concept
        |
        v
Source Family
        |
        v
Source Release
        |
        v
Source Locator / Reference
```

For example:

```text
assurance concept
      |
      +-- OWASP ASVS
      |      +-- exact release
      |      +-- relevant source locator
      |
      +-- NIST SP 800-53
             +-- exact revision/release
             +-- relevant source locator
```

This allows CES reasoning to remain auditable.

---

## 8.4 Targeted CES Retrieval

CES must also be **incremental by default**.

It should not perform:

```text
Project
   +
entire OWASP ASVS
   +
entire WSTG
   +
entire NIST CSF
   +
entire NIST 800-53
   |
   v
LLM
```

Instead:

```text
Relevant Project Semantic Neighborhood
                |
                v
         Semantic Anchors
                |
                v
     CES Assurance Retrieval
                |
                v
Relevant Assurance Knowledge
```

Then only the relevant project and assurance context enters CES reasoning.

The same retrieval principle from Section 4 applies:

> **Retrieval identifies potentially relevant assurance knowledge. It does not itself decide that a CES concern exists.**

---

## 8.5 CES Assessment Reasoning Skill

The actual semantic assessment belongs in a dedicated reasoning capability.

Conceptually:

```text
Relevant Project Knowledge
           |
           |
           v
   +--------------------+
   |                    |
   | CES ASSESSMENT     |
   | REASONING SKILL    |
   |                    |
   +--------------------+
           ^
           |
Relevant CES Assurance Knowledge
```

A likely future skill boundary is something similar to:

```text
atlas.ces-assessment
```

The exact name and contract are not locked yet.

The important architectural responsibility is.

The skill reasons about:

```text
project invariant
failure scenario
engineering concern
operational concern
control concern
verification concern
unresolved assumption
assurance relevance
```

while remaining grounded in supplied project and assurance context.

---

## 8.6 Example CES Reasoning

Project knowledge:

```text
Registration cannot exceed
departure quota.
```

Workflow semantics:

```text
Admin registers a jemaah
into an open departure.
```

CES retrieves assurance knowledge relevant to integrity and concurrent state changes.

Then the reasoning skill may derive:

```text
Concern:

Concurrent registration attempts could
observe the same remaining capacity before
either operation completes, allowing the
accepted quota invariant to be violated.


Required property:

Quota enforcement must remain correct when
registration attempts overlap.


Verification concern:

Simultaneous registration attempts should
demonstrate that the configured departure
quota cannot be exceeded.
```

CES should not automatically say:

```text
Use Redis locking.
```

or:

```text
Use SELECT FOR UPDATE.
```

unless project requirements specifically constrain implementation.

The CES responsibility is primarily:

> **Surface what must remain true and what foreseeable failure needs consideration—not arbitrarily choose the implementation.**

---

## 8.7 Project Evidence vs CES-Derived Reasoning

This distinction must be explicit.

```text
SOURCE SAID:

"Registration cannot exceed quota."
```

is not the same as:

```text
CES DERIVED:

"Concurrent registrations are a foreseeable
way the quota invariant could be violated."
```

CES must never make the latter appear as though it were stated by the PRD.

Therefore a CES assessment should conceptually contain two support chains:

```text
CES Assessment
|
+-- Project Support
|   +-- resolved knowledge IDs
|   +-- workflow/fact semantics
|   +-- PRD/Addendum evidence
|
+-- Assurance Support
    +-- CES assurance concept
    +-- source family
    +-- source release
    +-- source locator/reference
```

And separately, the assessment contains Atlas's derived reasoning:

```text
failure scenario
engineering consideration
operational/control consideration
verification consideration
```

This gives Atlas an explainable answer to:

> **Why did CES surface this concern?**

---

## 8.8 CES Knowledge Gaps

CES must be allowed to conclude that its assurance knowledge is insufficient.

It must **not improvise unsupported compliance/control requirements**.

Conceptually:

```text
Project semantics
       +
retrieved CES knowledge
       |
       v
insufficient support
       |
       v
CES KNOWLEDGE GAP
```

The exact gap taxonomy is not locked yet.

Potential distinctions may eventually include:

```text
assurance source gap
assurance extraction gap
normalization gap
assessment ambiguity
```

but we should define those based on the new architecture rather than copying legacy categories.

The fundamental invariant is:

> **When CES cannot defensibly derive a concern from governed knowledge, uncertainty must remain visible instead of being filled with invented certainty.**

---

## 8.9 CES Assessment Candidates

Model reasoning does not automatically become trusted CES output.

```text
CES Assessment Skill
        |
        v
CES Assessment Candidates
        |
        v
Deterministic Validation
        |
        v
CES Result
```

Validation can ensure things such as:

```text
project references exist
assurance references exist
source releases are known
required provenance exists
assessment schema is valid
unsupported references are rejected
dependencies resolve
baseline identity is recorded
```

Semantic reasoning remains the model's responsibility.

Authority and integrity remain deterministic responsibilities.

---

## 8.10 CES Projection Boundary

CES assessment generation and CES presentation are separate concerns.

The current `atlas.workspace-review-projections` concept should therefore **not own CES discovery**.

Instead:

```text
CES Assessment Skill
        |
        v
validated CES assessments
        |
        v
Projection
        |
        v
CES Result UI
```

Projection can decide how already-produced assessment data participates in the review model.

It should not independently invent the concerns.

This prevents:

```text
acceptance criterion
      |
      v
"CES assessment"
```

from becoming the CES architecture.

---

# Section 9 — Conversational Semantic Mediator

The chatbot is Atlas's **conversational semantic mediator**.

It supports three broad interaction modes:

```text
                    USER
                      |
                      v
              Semantic Mediator
                      |
         +------------+------------+
         |            |            |
         v            v            v
       QUERY        EXPLORE      CORRECT
```

These do not necessarily need explicit UI mode buttons.

Atlas can infer intent while requiring clarification when mutating intent is ambiguous.

## Query

Example:

```text
"Why can't a jemaah register
when quota is full?"
```

Execution:

```text
targeted retrieval
      |
      v
resolved knowledge + evidence
      |
      v
explanation
```

No mutation occurs.

## Explore

Example:

```text
"What would happen if quota
became 45?"
```

Atlas can retrieve relevant knowledge and reason hypothetically.

Still no mutation occurs.

## Correct

Example:

```text
"Special departure quota
should actually be 45."
```

Now the chatbot becomes an **assisted Addendum author**.

The architectural boundary is:

> **Chatbot owns human -> document. Atlas owns document -> knowledge.**

This prevents the chatbot from becoming an alternative hidden mutation mechanism.

---

# Section 10 — Correction Preview, Addendum & Commit

The correction cycle becomes:

```text
User Correction
      |
      v
Chatbot understands wording
      |
      v
resolve references
      |
      v
clarification if necessary
      |
      v
PREVIEW ADDENDUM
      |
      v
Atlas Extraction
      |
      v
Targeted Retrieval
      |
      v
Reconciliation Simulation
      |
      v
Atlas Change Preview
      |
      v
User Confirms
```

At confirmation:

```text
Preview Addendum
      |
      v
becomes
      |
      v
Immutable Addendum


AND


already-computed semantic result
      |
      v
committed to workspace
```

Atlas should **not immediately extract the Addendum again**.

The exact Preview Addendum processed by Atlas is the document being accepted.

Conceptually:

```text
Preview document hash
        +
Extraction result
        +
Reconciliation result
        +
User approval
        |
        v
Atomic correction revision
```

If the Preview Addendum changes semantically after simulation:

```text
edit preview
     |
     v
previous simulation invalid
     |
     v
rerun Atlas processing
```

The accepted document and accepted semantic result must correspond.

## Recovery / rebuild

The Addendum remains independently usable later:

```text
DISASTER / REBUILD

PRDs + Addenda
      |
      v
normal Atlas extraction
      |
      v
reconciliation
      |
      v
reconstructed knowledge
```

This recovery capability does not imply redundant re-extraction during normal correction confirmation.

---

# Cross-Cutting — Evidence & Provenance

Evidence is not isolated to extraction.

It runs through the entire architecture.

```text
Source Document
      |
      v
Candidate
      |
      v
Resolved Knowledge
      |
      +-- Workflow
      |
      +-- Facts
      |
      +-- CES Project Support
```

CES introduces a second lineage:

```text
Assurance Source
      |
      v
Governed Assurance Knowledge
      |
      v
CES Assurance Support
```

So a CES concern can eventually explain both:

```text
WHY THIS PROJECT TRIGGERED IT

and

WHY ATLAS CONSIDERS IT A RELEVANT CONCERN
```

---

# Cross-Cutting — Reasoning vs Deterministic Authority

Atlas maintains a strict boundary.

```text
MODEL / REASONING                  DETERMINISTIC SYSTEM

understand documents               validate schemas
interpret semantics                enforce immutability
discover semantic relationships    maintain revisions
propose reconciliation             maintain HEAD
reason about CES concerns          maintain indexes
mediate user language              enforce approval
compose Addenda                    perform atomic commit
semantic grouping                  validate references
CES relevance reasoning            maintain provenance
                                   maintain dependency state
```

The principle is:

> **The model reasons. The deterministic system decides whether that reasoning satisfies the contract and may enter trusted Atlas state.**

Reasoning alone never grants mutation authority.

---

# Cross-Cutting — Incremental by Default

Interactive Atlas operations should remain bounded.

For correction:

```text
small Preview Addendum
      |
      v
incremental extraction
      |
      v
targeted project retrieval
      |
      v
local reconciliation
      |
      v
affected dependency lookup
      |
      +-- affected Workflow/Facts
      |
      +-- affected CES assessments
```

For CES:

```text
affected project semantics
      |
      v
targeted assurance retrieval
      |
      v
bounded CES assessment
      |
      v
affected CES results
```

Not:

```text
one changed fact
      |
      v
scan every PRD
      +
all historical Addenda
      +
all project knowledge
      +
all OWASP
      +
all NIST
      |
      v
rerun everything
```

Full reconstruction remains available for:

```text
recovery
audit/integrity verification
major reconciliation
baseline migration
explicit rebuild
```

but is not the normal interactive execution path.

---

# Resulting Atlas Architecture

```text
                  IMMUTABLE PROJECT DOCUMENTS
                       PRD / Addendum
                              |
                              v
                         Extraction
                              |
                              v
                    Semantic Candidates
                              |
                              v
                    Targeted Retrieval
                              |
                              v
                       Reconciliation
                              |
                              v
                     Resolved Knowledge
                    /        |         \
                   /         |          \
                  v          v           \
          Main Workflow  Project Facts    \
                                          \
                                           v
                                     Project Context
                                           |
                                           |
             CES ASSURANCE SIDE            |
                                           |
 OWASP ASVS ------+                        |
 OWASP WSTG ------+                        |
 NIST CSF --------+--> Governed CES        |
 NIST SP 800-53 --+    Assurance Knowledge |
                           |               |
                           v               |
                    Targeted Retrieval     |
                           |               |
                           +-------+-------+
                                   |
                                   v
                         CES Assessment Skill
                                   |
                                   v
                       Assessment Candidates
                                   |
                                   v
                     Deterministic Validation
                                   |
                                   v
                              CES Result
                                   |
                  +----------------+----------------+
                  |                                 |
                  v                                 v
          Human Review                       Chatbot Mediator
                                             /      |      \
                                            /       |       \
                                           v        v        v
                                        Query    Explore   Correct
                                                           |
                                                           v
                                                    Preview Addendum
                                                           |
                                                           v
                                                     Atlas Processing
                                                           |
                                                           v
                                                        Preview
                                                           |
                                                           v
                                                        Approval
                                                           |
                                                           v
                                                   Immutable Addendum
                                                           |
                                                           v
                                                         Commit
                                                           |
                                                           v
                                                        Publish
                                                           |
                                                           v
                                                         Master
```

# Current Skill-Level Direction

The architecture still deliberately avoids prematurely declaring the final skill set.

However, we now have a clearer reasoning boundary around CES.

Conceptually:

```text
Document Extraction
        |
        v
project semantic reasoning

Reconciliation
        |
        v
knowledge evolution reasoning

CES Assessment
        |
        v
project semantics
        +
governed assurance semantics
        |
        v
derived concern reasoning

Semantic Mediator
        |
        v
human language <-> Atlas document interaction
```

One likely dedicated capability is therefore:

```text
atlas.ces-assessment
```

while something such as:

```text
atlas.workspace-review-projections
```

should remain downstream:

```text
Resolved Knowledge --------+
                           |
CES Assessments -----------+--> Review Projection
                           |
Evidence ------------------+
```

It should **present and organize CES assessments rather than generate them**.

# Checkpoint Boundary

At this checkpoint, we have established:

```text
Documents
   ↓
Extraction
   ↓
Retrieval
   ↓
Reconciliation
   ↓
Resolved Knowledge
   ├── Workflow
   ├── Facts
   └── CES
         +
   Governed Assurance Knowledge
         ↓
   CES Assessment Reasoning
         ↓
   CES Result
```

with the major invariants:

> **Durable project knowledge originates from immutable human-readable documents.**

> **Retrieval finds relevant context; it does not decide truth.**

> **Workflow, Facts, CES, and chatbot operate from the same resolved project semantics rather than independently reinterpreting historical PRDs.**

> **CES derives foreseeable concerns from project semantics plus governed assurance knowledge.**

> **CES distinguishes what the project explicitly states from what Atlas derives.**

> **CES must preserve both project provenance and assurance provenance.**

> **CES may expose uncertainty or a knowledge gap rather than invent unsupported assurance requirements.**

> **Model output remains candidate reasoning until deterministic validation accepts it.**

> **Interactive operations are incremental by default.**

> **`worker1` is legacy reference material only; its useful principles may inform this architecture, but its implementation, taxonomy, evaluator, and package structure do not constrain `codex/new-atlas`.**

And importantly, **we still haven't locked the final skills**. The next useful step for CES would be to design the *semantic contract* of a single CES assessment—what exactly goes into `atlas.ces-assessment`, what exactly comes out, and what the deterministic validator is allowed to enforce—before we touch implementation.

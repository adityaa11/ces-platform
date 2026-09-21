# Atlas Core Architecture — Updated Checkpoint

## Status

This checkpoint is an **additive architecture update** to the existing Atlas core architecture.

It incorporates the clarified post-extraction **human review + contextual chatbot** model while preserving the already-approved Backend Stack Setup foundations.

The following remain frozen and are **not reopened** by this update:

```text
BSS-001  Runtime / workspace foundation
BSS-002  Local PostgreSQL
BSS-003  PostgreSQL / Drizzle authority boundaries
BSS-004  Better Auth persistence
BSS-005  Agents Bridge service foundation
BSS-006  pg-boss background runtime
BSS-007  DocumentStore foundation
BSS-008  Mistral provider adapter
BSS-009  Document Perception pipeline
BSS-009-01 Atlas perception authority
BSS-009-02 Bridge perception integration
```

This update applies to the **downstream semantic/domain architecture** after Document Perception:

```text
Semantic Extraction
Retrieval
Reconciliation
Human Review
Review Projection
Resolved Knowledge
Conversational Semantic Mediator
Correction / Addendum
CES
Publication
```

Prototype/fixture-era skills may be rewritten against the production contracts established by the Backend Phase. Their useful semantic principles may be retained, but their existing implementation details do not constrain the production backend architecture.

---

# Core Principle

> **Atlas derives durable project knowledge from immutable human-readable documents, reconciles that knowledge into reviewable workspace meaning, requires human review where meaning cannot be safely resolved, and only then allows accepted project truth to advance without losing source provenance.**

The updated high-level flow is:

```text
Documents
   |
   v
Document Perception
   |
   v
NormalizedDocument
   |
   v
Semantic Extraction
   |
   v
Semantic Candidates
   |
   v
Knowledge Retrieval
   |
   v
Reconciliation
   |
   v
Validated Reviewable State
   |
   +-------------------------+
   |                         |
   v                         v
Review Projection       Contextual Chat
   |                         |
   +------------+------------+
                |
                v
           Human Review
                |
                v
   Accepted Workspace Resolution
                |
                v
     Resolved Workspace Knowledge
           /             \
          /               \
         v                 v
 Main Workflow / Facts   CES Assessment
                           |
                           v
                       CES Result
```

When a human correction introduces project meaning that is **not already defensibly supported by the immutable source documents**, the correction enters the Addendum cycle:

```text
Human correction / clarification
            |
            v
      Preview Addendum
            |
            v
   normal Atlas document cycle
            |
            v
   reconciliation preview
            |
            v
        approval
            |
            v
   Immutable Addendum
```

When the human is only resolving Atlas's interpretation of evidence that already exists in immutable source documents, Atlas may record a governed **review resolution** without creating a new Addendum.

The architecture remains divided into ten broad responsibilities. These are architecture responsibilities, not a declaration that Atlas must have exactly ten skills.

---

# Provider Qualification Direction — Mistral

The current provider qualification direction maps Atlas responsibilities to Mistral capabilities as follows.

This is not a provider lock-in decision. Atlas continues to expose provider-neutral capabilities through Agents Bridge.

| Atlas responsibility | Model requirement | Current direction |
| --- | --- | --- |
| 1. Project/workspace/revisions | None | Atlas/PostgreSQL |
| 2. Document perception | Document parsing / OCR | Mistral OCR 4.1 |
| 3. Semantic extraction | Structured semantic reasoning | Large 3 / Medium 3.5 qualification |
| 4. Targeted retrieval | Semantic retrieval signal | `mistral-embed` optional; Atlas owns retrieval |
| 5. Reconciliation | Deep relational reasoning | Large 3 vs Medium 3.5 benchmark |
| 6. Reviewable / resolved state & dependencies | Mostly deterministic | Atlas |
| 7. Workflow/Facts/review projections | Grounded grouping + deterministic projection | Small 4 where reasoning is needed; Atlas owns state |
| 8. CES assessment | High-quality grounded reasoning | Medium 3.5 / Large 3 qualification |
| 9. Conversational mediator | Streaming + tools + reasoning | Small 4 default |
| 10. Addendum/correction | Language + structured proposal | Small 4 with bounded escalation |
| Evidence/provenance | Source localization | OCR 4.1 is a strong source-localization candidate |
| Incremental operation | Bounded reasoning | Targeted retrieval + bounded context |

## Provider-neutral capability aliases

Conceptually:

```text
atlas.document.perceive
atlas.semantic.extract
atlas.semantic.reconcile
atlas.retrieval.embed
atlas.ces.assess
atlas.chat.default
atlas.chat.deep
atlas.addendum.compose
```

The server controls capability-to-provider resolution.

Skills and clients must not select arbitrary provider model IDs or endpoints.

## What providers may own

A provider may perform:

```text
document perception
OCR / document structure
multimodal interpretation
language reasoning
structured candidate generation
semantic relationship reasoning
semantic grouping
embeddings
chat response generation
tool-call proposals
```

Atlas must continue to own:

```text
canonical documents
workspace state
candidate validation
reviewable state
review decisions
resolved truth
retrieval policy
indexes
dependency state
evidence identity
approval
atomic commit
HEAD / Master advancement
chat history
authorization
```

The provider reasons.

Atlas remains the system of record.

---

# Section 1 — Project, Workspace & Revision Lifecycle

Atlas operates inside a deterministic project/workspace lifecycle.

```text
Project
|
+-- Master
|
+-- Workspace
    +-- base revision
    +-- source documents
    +-- extracted candidates
    +-- reconciliation state
    +-- review state
    +-- accepted workspace resolution
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
Semantic Extraction
    |
    v
Reconciliation
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
Extract
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

```text
workspace isolation
base revisions
revision history
workspace HEAD
review state
approval state
publication
Master advancement
```

These are primarily deterministic Atlas responsibilities.

## Review state is not accepted truth

A workspace may legitimately contain:

```text
validated semantic candidates
validated reconciliation relationships
unresolved contradictions
ambiguities
human review decisions
```

without those items being accepted Master truth.

Therefore:

```text
reviewable
    !=
accepted

reconciliation proposal
    !=
resolved truth

review projection
    !=
publication
```

Human review is an explicit lifecycle stage, not a UI-only decoration.

---

# Section 2 — Immutable Document Model

Atlas has two durable project document origins:

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

PRDs are never rewritten when project meaning changes.

Example:

```text
PRD-001

"The quota is 40."
```

A later human-authored correction may become:

```text
ADD-003

"For Special departures,
the quota is 45.

This replaces the previous quota only
for Special departures."
```

The document history preserves what humans actually specified over time.

An Addendum must remain:

```text
human-readable
exportable
understandable without hidden Atlas state
immutable after acceptance
complete enough for reconstruction
source-resolvable
hashable
```

Documents are the durable reconstructable source.

Caches, indexes, review projections, resolved state, and other operational projections remain rebuildable structures.

## Mistral document-processing direction

Document parsing may use Mistral OCR 4.1 as a derived processing layer.

```text
Immutable PDF bytes
      |
      +--> Atlas document identity / hash
      |
      +--> Mistral OCR 4.1
              |
              +-- text / markdown
              +-- tables
              +-- image regions
              +-- document blocks
              +-- bounding boxes
              +-- confidence metadata
```

Atlas distinguishes:

```text
1. IMMUTABLE SOURCE
2. DERIVED DOCUMENT PERCEPTION
3. DERIVED SEMANTICS
```

Only the immutable source is durable human-authored project evidence.

---

# Section 3 — Document Perception & Semantic Extraction

Document Perception and Semantic Extraction are separate architectural capabilities.

```text
Immutable Document
       |
       v
Document Perception
       |
       v
NormalizedDocument
       |
       v
Semantic Extraction
       |
       v
Semantic Candidates
```

Document Perception answers:

> **What is physically and structurally present in this document, and where is it located?**

Semantic Extraction answers:

> **What project meaning can Atlas defensibly derive from that normalized representation?**

Semantic extraction may identify:

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
unresolved meaning
```

Every semantic candidate remains evidence-grounded.

The semantic candidate output is not UI copy and is not accepted project truth.

## Provider-neutral NormalizedDocument

Conceptually:

```text
NormalizedDocument
|
+-- artifact identity
+-- source SHA-256
+-- perception version
+-- pages[]
    +-- page number
    +-- dimensions
    +-- text blocks
    +-- tables
    +-- visual regions
    +-- image references
    +-- bounding boxes
    +-- confidence / provider metadata
```

The current Backend Phase already established the production Document Perception boundary.

Semantic/domain implementation must build **downstream** from that boundary rather than reopening it.

## Structured output boundary

Provider structured output improves format reliability but does not grant trust.

```text
provider semantic output
        |
        v
JSON parse
        |
        v
Atlas schema validation
        |
        v
reference/evidence validation
        |
        v
validated semantic candidates
```

Validated candidates may enter retrieval/reconciliation.

They still do not automatically become accepted project truth.

---

# Section 4 — Knowledge Indexing & Targeted Retrieval

Atlas should not full-scan all historical project material for normal interactive operations.

Instead:

```text
Incoming Candidate / User Request
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

Retrieval signals may include:

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
workspace / revision
optional vector similarity
```

The critical boundary is:

> **Retrieval discovers potentially relevant knowledge. It does not determine truth.**

Reconciliation decides what retrieved knowledge means relative to incoming knowledge.

Retrieval infrastructure should support:

```text
PRD reconciliation
Addendum reconciliation
review-item expansion
chatbot query
chatbot exploration
chatbot correction
CES project-context retrieval
dependency lookup
```

An embedding provider may be one retrieval signal, but Atlas owns:

```text
index storage
workspace scoping
revision scoping
retrieval policy
semantic identity
dependency signals
truth decisions
```

---

# Section 5 — Semantic Reconciliation

Reconciliation reasons over both **existing project knowledge** and the relevant **incoming semantic neighborhood**.

The canonical shape is:

```text
Incoming Candidates
        +
Relevant Existing Knowledge
        +
Relevant Incoming Neighbors
        |
        v
Reconciliation
        |
        v
Relationship Proposals
        |
        v
Deterministic Validation
        |
        v
Validated Reviewable Relationships
```

This is broader than only comparing one incoming candidate against Master.

Atlas should be able to detect:

```text
incoming candidate vs existing knowledge
```

and:

```text
incoming candidate vs other incoming candidates
```

within the same reviewable extraction/reconciliation scope.

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

## Example: apparent contradiction

Existing:

```text
quota = 40
```

Incoming:

```text
Special departure quota = 45
```

Atlas must not automatically conclude:

```text
40 -> 45
```

The actual semantic relationship may be specialization:

```text
General departure:
quota = 40

Special departure:
quota = 45
```

## Example: source-internal conflict

The same uploaded PRD may contain:

```text
page 3:
quota = 40

page 8:
quota = 45
```

If the document does not establish supersession or scope distinction, Atlas should surface an unresolved relationship rather than arbitrarily selecting one value.

## Reconciliation proposals are reviewable before acceptance

A reconciliation result may be:

```text
schema-valid
evidence-valid
reference-valid
workspace-valid
```

and still remain:

```text
unresolved
contradictory
ambiguous
requires human decision
```

Therefore:

> **A reconciliation result may be valid and reviewable without being accepted or resolved project truth.**

No model may directly update resolved knowledge.

Deterministic validation verifies the proposal's structure and references.

Human review and Atlas authority determine whether the proposal becomes accepted workspace meaning.

## Reconciliation qualification

Provider qualification must test:

```text
replacement
specialization
partial supersession
supporting detail
duplicate
contradiction
incoming-vs-incoming inconsistency
unresolved ambiguity
```

Reconciliation quality is a hard provider qualification gate.

---

# Section 6 — Reviewable State, Resolved Knowledge & Dependency Model

The previous architecture moved too directly from reconciliation to resolved knowledge.

The refined boundary is:

```text
Base Resolved Knowledge
          +
Validated Incoming Candidates
          +
Validated Reconciliation Relationships
          |
          v
VALIDATED REVIEWABLE STATE
          |
          v
Human Review
          |
          v
ACCEPTED WORKSPACE RESOLUTION
          |
          v
RESOLVED WORKSPACE KNOWLEDGE
```

## 6.1 Validated Reviewable State

Reviewable state may include:

```text
incoming candidates
current/base semantic references
reconciliation relationship proposals
conflicts
ambiguities
possible supersession
source-internal inconsistency
affected dependency references
evidence references
review decisions
```

Reviewable state is Atlas-owned state.

It is not provider memory and is not equivalent to accepted truth.

## 6.2 Human review decisions

A human review decision may do one of two fundamentally different things.

### A. Resolve an evidence-supported interpretation

Example:

```text
Existing documents already support:
General quota = 40
Special quota = 45

Atlas proposed:
45 supersedes 40

Human:
"No. 45 only applies to Special departures."
```

If the immutable evidence already supports that interpretation, Atlas may record a governed review resolution.

No new project document is necessarily required.

### B. Introduce new or clarifying project meaning

Example:

```text
Existing documents:
quota = 40

Human:
"Starting next release,
Special departures use 45."
```

If that meaning is not already established by immutable project documents, the user is introducing new project meaning.

That must enter Atlas through an immutable document such as an Addendum.

This preserves the rule:

> **Durable project knowledge originates from immutable human-readable documents.**

## 6.3 Resolved Workspace Knowledge

Resolved knowledge preserves:

```text
current semantic meaning
provenance
source evidence
supersession
relationships
dependencies
revision
workspace
accepted review decisions
```

This is the efficient semantic state Atlas normally reads after acceptance.

Documents remain the reconstructable source.

## 6.4 Dependency model

Atlas must know what depends on what.

Example:

```text
quota rule
   |
   +-- registration constraint
   +-- workflow condition
   +-- displayed remaining quota
   +-- project facts
   +-- CES assessments
```

If quota semantics change, Atlas can identify the affected semantic neighborhood.

This enables:

> **Incremental recomputation instead of project-wide regeneration.**

Dependency impact should also be available to human review.

For example:

```text
affects 3 workflow nodes
affects 2 project facts
affects 1 CES assessment
```

These are auditable dependency signals, not model-generated importance scores.

---

# Section 7 — Human Projections: Main Workflow, Project Facts & Review Projection

Atlas has two different projection responsibilities that must not be confused.

## 7.1 Accepted project projections

Main Workflow and Project Facts are projections of **resolved accepted workspace knowledge**.

```text
             Resolved Knowledge
              /             \
             v               v
      Main Workflow     Project Facts
```

Main Workflow answers:

> **How is this project/system supposed to operate?**

Project Facts answers:

> **What does Atlas currently know to be true about this project?**

They must resolve from the same semantic state and cannot silently disagree.

CES does not scrape rendered Workflow or Facts UI.

All three consume shared Atlas semantics.

## 7.2 Workspace review projection

A non-Master workspace also needs a human-facing **review projection** before its incoming meaning is accepted.

This evolves the existing `atlas.workspace-review-projections` concept.

Conceptually:

```text
Base / Current Resolved Knowledge --------+
                                         |
Validated Incoming Candidates -----------+
                                         |
Validated Reconciliation Relationships --+--> Review Projection
                                         |
Dependency References -------------------+
                                         |
Evidence References ---------------------+
                                         |
Validated CES References when relevant --+
```

The review projection may organize:

```text
review summary
attention queue
semantic groups
workflow deltas
fact deltas
current-vs-incoming comparisons
conflicts
ambiguities
evidence references
affected dependencies
review progress
```

The projection must **not** independently decide:

```text
semantic truth
reconciliation
supersession
conflict resolution
approval
publication
CES discovery
```

Those responsibilities remain elsewhere.

## 7.3 Candidate-only boundary

The production rewrite of `atlas.workspace-review-projections` should preserve the useful invariant already established during the fixture phase:

> **Review projection is candidate/review data only. It does not become accepted truth merely because it is renderable.**

Prototype-era skill implementation details are not canonical, but this authority boundary is worth preserving.

## 7.4 Scalable serving

The review surface must not require one giant semantic payload.

The serving model should support progressive disclosure:

```text
review summary
      |
      v
attention queue
      |
      v
semantic groups
      |
      v
selected group
      |
      v
selected item
      |
      v
evidence / dependencies
```

Opening a review should not require serializing:

```text
all project history
all immutable documents
all resolved knowledge
all candidate knowledge
all source evidence
all CES assessments
```

Instead, Atlas should support bounded retrieval/pagination/cursors at the relevant review level.

Exact API routes are implementation details.

## 7.5 Review progress

Atlas should be able to represent resumable review work.

Conceptual item states may include:

```text
unreviewed
reviewed
needs-correction
needs-clarification
resolved
```

These names are not yet locked as production enum values.

The backend ticket that owns review persistence must decide whether progress is:

```text
per workspace
per user
or both
```

The UI may then show summaries such as:

```text
38 of 42 items reviewed
2 conflicts unresolved
2 clarifications unresolved
```

without loading all 42 items.

---

# Section 8 — CES Reasoning & Assurance Knowledge

CES remains a distinct semantic reasoning capability.

It does not simply summarize PRDs, restate acceptance criteria, or copy Project Facts.

CES asks:

> **Given what this project is required to do, what foreseeable engineering, operational, control, and verification concerns should the team be aware of?**

## 8.1 Project knowledge side

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

## 8.2 Assurance knowledge side

Machine-consumed assurance sources currently include:

```text
OWASP ASVS
OWASP WSTG
NIST CSF
NIST SP 800-53
```

ISO/IEC 27001 and 27002 remain excluded from machine-consumed reasoning because of licensing restrictions.

Assurance material should be normalized/indexed into governed Atlas assurance knowledge rather than dumped wholesale into a model context.

## 8.3 Assurance provenance

Governed assurance knowledge should preserve:

```text
source family
source release
source locator/reference
normalized assurance identity
```

## 8.4 Targeted CES retrieval

CES remains incremental.

```text
Relevant Project Semantic Neighborhood
        |
        v
Relevant Assurance Retrieval
        |
        v
Bounded CES Context
```

Retrieval identifies potentially relevant assurance knowledge.

It does not itself decide that a CES concern exists.

## 8.5 CES assessment reasoning

The reasoning capability receives:

```text
relevant project semantics
+
relevant governed assurance semantics
+
provenance
+
output contract
```

and may derive:

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

It should not arbitrarily prescribe an implementation unless project requirements support that prescription.

## 8.6 Project evidence vs CES-derived reasoning

Atlas must keep separate:

```text
SOURCE SAID
```

from:

```text
CES DERIVED
```

A CES assessment therefore needs both:

```text
Project Support
Assurance Support
```

plus Atlas-derived reasoning.

## 8.7 CES knowledge gaps

When governed assurance knowledge is insufficient, uncertainty remains visible.

Atlas must not invent unsupported compliance or control requirements.

## 8.8 CES assessment candidates

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
Validated CES Assessments
```

Model reasoning does not automatically become trusted output.

## 8.9 CES projection boundary

Review projection may present validated CES assessment data where relevant.

It must not generate CES concerns itself.

```text
CES Assessment
      |
      v
Validated CES Assessment
      |
      v
Review / Result Projection
```

`atlas.workspace-review-projections` is therefore downstream of CES reasoning.

---

# Section 9 — Conversational Semantic Mediator

The chatbot is Atlas's **Conversational Semantic Mediator**.

It is not the primary post-extraction surface.

The primary post-extraction surface is the Atlas review projection showing:

```text
what Atlas extracted
how it relates to current knowledge
what agrees
what conflicts
what is ambiguous
what needs human attention
```

The chatbot is attached to that review context and helps the human:

```text
understand
query
explore
resolve
correct
navigate
```

## 9.1 Broad interaction modes

The existing broad modes remain:

```text
QUERY
EXPLORE
CORRECT
```

They do not require explicit UI mode buttons.

Atlas may infer intent but must require clarification where mutation intent is ambiguous.

### Query

Example:

```text
"Why does Atlas think quota-full registration is rejected?"
```

Execution:

```text
selected review item / targeted retrieval
        |
        v
current/base semantics
+
incoming proposal when relevant
+
evidence
        |
        v
grounded explanation
```

No mutation occurs.

### Explore

Example:

```text
"What would happen if quota became 45?"
```

Atlas may reason hypothetically from bounded relevant context.

Still no mutation occurs.

Hypothetical state must remain visibly distinct from:

```text
current accepted truth
incoming candidate state
reviewable proposed state
```

### Correct

The broad Correct mode now has two possible governed outcomes.

```text
User correction
      |
      v
Resolve target and evidence
      |
      v
Does immutable evidence already
support the intended meaning?
      |
   +--+--+
   |     |
  yes    no
   |     |
   v     v
Review  Preview
Resolution Addendum
```

#### Review Resolution

If existing immutable evidence already supports the user's intended interpretation, the chatbot may assist the human in resolving Atlas's reconciliation proposal.

The resulting decision remains subject to Atlas authorization, validation, and review-state rules.

#### Project Correction / Clarification

If the user's intended meaning is new or not defensibly supported by existing project documents, the chatbot becomes an assisted Addendum author.

The canonical authority boundary remains:

> **Chatbot owns human -> document. Atlas owns document -> knowledge.**

The chatbot never becomes an alternative hidden mutation mechanism.

## 9.2 Context hierarchy

The review UI gives the mediator an explicit bounded-context hierarchy:

```text
Level 1
project + workspace + current review

Level 2
selected semantic group

Level 3
selected workflow/fact/conflict/reconciliation item

Level 4
selected evidence / revision / dependency / CES reference
```

The mediator should receive the smallest sufficient context for the request.

A normal interactive request should include only what is needed, for example:

```text
current request
+
workspace/review identity
+
selected semantic identity
+
current/base semantic item when relevant
+
incoming candidate/reconciliation relationship when relevant
+
bounded evidence
+
bounded dependency neighborhood
+
bounded assurance context when required
+
output contract
```

## 9.3 Current vs incoming vs hypothetical

The mediator must preserve epistemic/state distinctions.

It must be able to distinguish:

```text
CURRENT ACCEPTED PROJECT TRUTH

INCOMING CANDIDATE

RECONCILIATION PROPOSAL

UNRESOLVED REVIEW STATE

HYPOTHETICAL STATE
```

A response must not imply that incoming/proposed/hypothetical meaning is accepted truth.

## 9.4 Atlas-owned conversation state

The preferred provider pattern remains stateless inference with Atlas-owned conversation state.

```text
User
  |
  v
Atlas Chat API
  |
  +-- conversation state
  +-- workspace identity
  +-- authorization
  +-- review identity
  +-- selected semantic identity
  +-- bounded retrieval
  +-- current/base semantics
  +-- incoming/reconciliation context
  +-- evidence
  +-- dependencies
  |
  v
Agents Bridge
  |
  v
qualified chat model
  |
  v
streamed response / tool-call proposal
```

Atlas stores chat history.

The provider must not canonically own:

```text
conversation memory
workspace state
project truth
review state
correction state
approval state
```

## 9.5 Tool boundary

Useful tools may conceptually include:

```text
search_resolved_knowledge()
get_semantic_item()
get_evidence()
get_revision_diff()
compare_workspaces()
list_open_questions()
get_ces_assessment()

get_review_summary()
get_review_group()
get_review_item()
get_reconciliation_relationship()
get_dependency_impact()
```

For correction/review resolution, the model may assist with:

```text
resolve target
identify ambiguity
request clarification
explain current vs incoming meaning
propose review resolution
compose Preview Addendum
```

All tools execute under Atlas authorization and deterministic validation.

The model never receives direct database mutation authority.

## 9.6 Bidirectional review context

The center review surface and chatbot should reference the same stable Atlas identities.

Center -> Chat:

```text
select conflict
    |
    v
chat receives conflict identity
```

Chat -> Center:

```text
chat references affected workflow/fact/CES IDs
    |
    v
UI may highlight/open those entities
```

This must use Atlas entity/reference identities rather than free-text matching.

## 9.7 Escalation

A small/default model may handle ordinary bounded mediation.

Atlas may escalate a bounded request when necessary for:

```text
cross-document contradiction analysis
complex hypothetical impact
deep revision comparison
complex Addendum composition
```

The user-facing capability remains Atlas, not a provider/model name.

---

# Section 10 — Correction Preview, Addendum & Commit

This section applies when human review introduces or clarifies project meaning that is **not sufficiently established by existing immutable project documents**.

The correction cycle remains:

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
incremental Semantic Extraction
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
committed atomically to workspace
```

Atlas should not immediately re-extract the Addendum after confirmation.

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

If the Preview Addendum changes semantically after simulation, the previous simulation is invalid and must be rerun.

## Recovery / rebuild

Accepted Addenda remain independently usable for reconstruction:

```text
PRDs + Addenda
      |
      v
normal Atlas processing
      |
      v
reconciliation
      |
      v
reconstructed knowledge
```

Provider conversation memory must never be required to reconstruct Addendum meaning.

---

# Cross-Cutting — Evidence & Provenance

Evidence runs through:

```text
Source Document
      |
      v
Candidate
      |
      v
Reconciliation
      |
      v
Reviewable State
      |
      v
Resolved Knowledge
```

Human review should be able to inspect evidence on both sides of a semantic disagreement.

For example:

```text
Current/base evidence
        vs
Incoming evidence
```

At minimum, evidence should support:

```text
text_quote
visual_region
```

Conceptual text evidence:

```json
{
  "type": "text_quote",
  "artifactId": "prd-001",
  "page": 7,
  "quote": "Rejected KYC submissions require manual review."
}
```

Conceptual visual evidence:

```json
{
  "type": "visual_region",
  "artifactId": "prd-001",
  "page": 7,
  "pageImageSha256": "...",
  "region": {
    "x": 0.21,
    "y": 0.31,
    "width": 0.58,
    "height": 0.42
  },
  "sourceLabels": [
    "Approved?",
    "No",
    "Manual Review"
  ]
}
```

The semantic interpretation belongs in semantic/reconciliation state.

Evidence points back to immutable source material.

---

# Cross-Cutting — Reasoning vs Deterministic Authority

Atlas maintains a strict boundary.

```text
MODEL / REASONING                  DETERMINISTIC ATLAS

understand documents               validate schemas
interpret semantics                enforce immutability
discover relationships             validate references
propose reconciliation             maintain revisions / HEAD
semantic grouping                  maintain indexes
reason about CES                   maintain dependency state
mediate user language              maintain review state
explain review items               calculate review progress
compose Addenda                    enforce authorization
                                   enforce approval
                                   perform atomic commit
                                   publish
                                   preserve provenance
```

Review-specific deterministic responsibilities include:

```text
persist review identity/state
preserve current-vs-incoming identity
validate relationship references
page/filter review items
calculate progress
calculate dependency impact
enforce review decision authority
```

Reasoning alone never grants mutation authority.

---

# Cross-Cutting — Agents Bridge Provider Boundary

Agents Bridge continues to provide two provider-facing capability families:

```text
                         AGENTS BRIDGE
                              |
              +---------------+---------------+
              |                               |
              v                               v
     Document Perception              Reasoning Runtime
              |                               |
              v                               v
       provider OCR /                  Atlas reasoning
      document parsing                     skills
              |                               |
              v                               +-- semantic extraction
     NormalizedDocument                      +-- reconciliation
                                              +-- CES assessment
                                              +-- chatbot mediation
                                              +-- Addendum composition
```

No new service boundary is required for the review/chatbot refinement.

The already-approved BSS foundation remains suitable.

Agents Bridge must still not own:

```text
Atlas repositories
review state
resolved knowledge
publication
source authorization
conversation authority
```

Atlas supplies bounded input.

Bridge executes provider-backed work.

Atlas validates and owns the result.

---

# Cross-Cutting — Incremental by Default

Interactive Atlas operations must remain bounded.

## Correction

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
```

## Review serving

```text
open review
   |
   v
summary

open attention queue
   |
   v
bounded issue page

open semantic group
   |
   v
bounded group items

select item
   |
   v
item + related dependencies

inspect evidence
   |
   v
specific evidence
```

Not:

```text
open review
   |
   v
load every PRD
+
every Addendum
+
all candidate semantics
+
all resolved semantics
+
all evidence
+
all CES results
```

## Chat context

Normal chatbot execution should send:

```text
current request
+
selected review/semantic context
+
bounded relevant semantic neighborhood
+
bounded evidence
+
bounded assurance context when required
+
output contract
```

not the entire project history.

If normal review/chat execution repeatedly requires the entire project corpus, that is an Atlas retrieval/indexing/serving failure before it is a model context-window problem.

## Full reconstruction

Project-wide reconstruction remains appropriate for:

```text
recovery
audit/integrity verification
major reconciliation
baseline migration
explicit rebuild
```

but not as the normal interactive path.

---

# Canonical Document Processing Pipeline

The production document-processing path remains:

```text
                      ATLAS
                        |
                        v
                 DocumentStore
                        |
                    source.pdf
                        |
                        v
             document-perception job
                        |
                        v
                 Agents Bridge
                        |
                        v
              provider perception
                        |
                        v
              NormalizedDocument
                        |
                        v
          Atlas derived-perception cache
                        |
                        v
               Semantic Extraction
                        |
                        v
              Semantic Candidates
                        |
                        v
          Deterministic Validation
                        |
                        v
               Targeted Retrieval
                        |
                        v
                 Reconciliation
                        |
                        v
          Deterministic Validation
                        |
                        v
           Validated Reviewable State
                        |
             +----------+----------+
             |                     |
             v                     v
       Review Projection     Contextual Chat
             |                     |
             +----------+----------+
                        |
                        v
                   Human Review
                        |
                        v
          Accepted Workspace Resolution
                        |
                        v
             Resolved Knowledge
```

The boundaries are:

```text
DocumentStore
    owns immutable source bytes

Document Perception
    derives provider-neutral document structure

Derived-Perception Cache
    stores rebuildable perception output

Semantic Extraction
    derives candidate project meaning

Retrieval
    finds relevant semantic context

Reconciliation
    proposes semantic relationships

Reviewable State
    stores validated but not necessarily accepted relationships

Review Projection
    organizes reviewable state for humans

Human Review
    resolves governed semantic decisions

Resolved Knowledge
    stores accepted current workspace semantics
```

---

# Resulting Atlas Architecture

```text
                 IMMUTABLE PROJECT DOCUMENTS
                      PRD / Addendum
                             |
                             v
                   Document Perception
                             |
                             v
                    NormalizedDocument
                             |
                             v
                  Semantic Extraction
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
              Validated Reviewable State
                       /           \
                      /             \
                     v               v
          Review Projection   Contextual Chat
                     \               /
                      \             /
                       v           v
                         Human Review
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
      Evidence-Supported          New / Clarifying
       Review Resolution          Human Meaning
                 |                       |
                 |                       v
                 |                Preview Addendum
                 |                       |
                 |                Atlas Processing
                 |                       |
                 +-----------+-----------+
                             |
                             v
                 Accepted Workspace Resolution
                             |
                             v
                   Resolved Knowledge
                  /         |          \
                 v          v           v
        Main Workflow  Project Facts  Project Context
                                         |
                                         |
           CES ASSURANCE SIDE             |
                                         |
OWASP ASVS ------+                        |
OWASP WSTG ------+                        |
NIST CSF --------+--> Governed CES        |
NIST SP 800-53 --+    Assurance Knowledge |
                         |                |
                         v                |
                 Targeted Retrieval      |
                         |                |
                         +--------+-------+
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
                       Validated CES Result
                                  |
                                  v
                       Human-facing Projection
                                  |
                                  v
                              Publish
                                  |
                                  v
                                Master
```

---

# Current Skill-Level Direction

The architecture deliberately avoids prematurely locking the final production skill set.

Likely reasoning responsibilities remain:

```text
Semantic Extraction
        |
        v
project semantic reasoning

Reconciliation
        |
        v
knowledge-evolution reasoning

Review Projection
        |
        v
candidate/reconciliation organization
and bounded human-readable grouping

CES Assessment
        |
        v
project semantics
+
governed assurance semantics

Semantic Mediator
        |
        v
human language
<->
Atlas review / semantic context

Addendum Author
        |
        v
human correction intent
->
standalone Preview Addendum
```

## Prototype-era skill boundary

Existing fixture/prototype skills predate the Backend Phase production architecture.

They may be rewritten.

They should be treated as:

```text
prototype semantic experiments
        |
        v
retain useful invariants
        |
        v
rewrite against production contracts
```

The production backend should not contort itself around fixture-specific schemas, generated fixture repositories, or prototype execution assumptions.

### `atlas.workspace-review-projections`

The existing skill established a useful authority invariant:

```text
candidate-only
review-only
source-grounded
non-publishing
non-authoritative
```

The production version should preserve those principles while evolving its input toward:

```text
validated candidates
+
current/base resolved knowledge
+
validated reconciliation relationships
+
dependency references
+
evidence references
+
review metadata
+
validated CES references when relevant
```

It must remain downstream of reconciliation.

It must not become the component that decides reconciliation.

---

# Mistral Qualification & Development Boundary

Mistral remains the first provider qualification direction, not a permanent dependency.

## Required qualification gates

```text
1. Structured-output compatibility
   - real Atlas schemas
   - complete Atlas-side validation

2. Text-heavy semantic extraction
   - existing Atlas fixtures / captured PRDs

3. Visual semantic extraction
   - flowcharts
   - screenshots
   - tables
   - image-only content
   - sequence/state diagrams where possible

4. Evidence fidelity
   - quote accuracy
   - page accuracy
   - visual-region accuracy
   - no fabricated evidence

5. Semantic reconciliation
   - new
   - support
   - duplicate
   - refine
   - extend
   - contradiction
   - supersession
   - partial supersession
   - ambiguity
   - incoming-vs-incoming conflict

6. CES epistemic discipline
   - grounded project support
   - grounded assurance support
   - derived reasoning clearly separated
   - unsupported requirements rejected
   - knowledge gaps preserved

7. Conversational mediator behavior
   - Query does not mutate
   - Explore remains hypothetical
   - current vs incoming vs hypothetical remains distinct
   - review resolution is not silently treated as accepted truth
   - new project meaning produces Preview Addendum rather than hidden mutation
   - selected review context remains bounded and grounded

8. Operational behavior
   - cancellation
   - timeout
   - retries
   - rate limiting
   - response bounds
   - usage accounting
```

## Development vs production privacy

Development may use provider development offerings only with approved documents and appropriate data-use settings.

Production must separately qualify:

```text
provider data-use terms
retention behavior
zero-retention eligibility where required
stateless endpoint coverage
region / residency requirements if introduced
```

Atlas should prefer stateless provider inference because Atlas owns durable application state.

## Provider portability

A successful implementation must allow:

```text
Mistral
   |
   v
another qualified provider
```

without changing:

```text
immutable document semantics
Atlas semantic contracts
review-state contracts
resolved knowledge contracts
CES support chains
revision semantics
approval semantics
evidence identity
chat correction/review-resolution contract
```

Only provider adapters, capability aliases, and provider-specific qualification rules should need to change.

---

# Checkpoint Boundary

At this checkpoint, Atlas architecture establishes:

```text
Documents
   ↓
Document Perception
   ↓
NormalizedDocument
   ↓
Semantic Extraction
   ↓
Validated Candidates
   ↓
Targeted Retrieval
   ↓
Reconciliation
   ↓
Validated Reviewable State
   ↓
Human Review
   ↓
Accepted Workspace Resolution
   ↓
Resolved Knowledge
   ├── Workflow
   ├── Facts
   └── Project Context
         +
   Governed Assurance Knowledge
         ↓
   CES Assessment Reasoning
         ↓
   CES Result
```

with these major invariants:

> **Durable project knowledge originates from immutable human-readable documents.**

> **Document Perception and Semantic Extraction remain separate capabilities.**

> **Normalized document perception is derived operational state, not accepted project truth.**

> **Retrieval finds relevant context; it does not decide truth.**

> **Reconciliation proposes semantic relationships; it does not directly create accepted truth.**

> **A reconciliation result may be valid and human-reviewable while still being unresolved.**

> **Atlas can reconcile incoming candidates against both existing knowledge and relevant incoming candidates.**

> **Validated Reviewable State is distinct from Resolved Workspace Knowledge.**

> **Review Projection organizes Atlas-produced review state but does not decide semantic truth, reconciliation, approval, CES discovery, or publication.**

> **Human review may resolve an interpretation already supported by immutable evidence without necessarily creating an Addendum.**

> **New or clarifying human project meaning that is not already supported by immutable documents must enter Atlas through an immutable source document such as an Addendum.**

> **Workflow, Facts, CES, review projection, and chatbot operate over shared Atlas semantic identities rather than independently reinterpreting historical PRDs.**

> **The chatbot is a contextual semantic mediator attached to Atlas review/semantic state, not an independent source of truth and not the primary post-extraction surface.**

> **Current accepted truth, incoming candidates, reconciliation proposals, unresolved review state, and hypothetical state must remain distinguishable.**

> **Interactive review and chatbot operations are bounded and incremental by default.**

> **Model output remains candidate reasoning until Atlas validation and the appropriate human/authority boundary accepts it.**

> **The existing BSS-001 through BSS-009-02 implementation remains valid and frozen; this checkpoint extends the downstream semantic/domain architecture rather than reopening Stack Setup.**

> **Prototype/fixture-era skills may be rewritten to satisfy the production architecture.**

The next implementation work should turn these architecture responsibilities into bounded Backend Phase domain ticket sets rather than extending the completed Stack Setup ticket set.

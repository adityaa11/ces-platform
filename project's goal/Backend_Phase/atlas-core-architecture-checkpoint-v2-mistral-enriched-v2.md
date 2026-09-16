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

## Provider Qualification Direction — Mistral

The current provider qualification direction maps Atlas responsibilities to Mistral capabilities as follows.

This is **not a provider lock-in decision** and does not change Atlas's core architecture. Atlas should continue to expose provider-neutral capabilities through Agents Bridge. Model names below are current qualification candidates and may be replaced without changing the semantic contracts.

| Atlas responsibility | Model requirement | Mistral fit | Current qualification direction |
| --- | --- | --- | --- |
| 1. Project/workspace/revisions | None | N/A | Atlas/PostgreSQL |
| 2. Immutable documents | Document parsing only | Strong | Mistral OCR 4.1 |
| 3. Semantic extraction | Multimodal + structured semantic reasoning | Strong | OCR 4.1 + Large 3 / Medium 3.5 |
| 4. Targeted retrieval | Semantic embeddings/retrieval | Strong | `mistral-embed` optional; Atlas owns index |
| 5. Reconciliation | Deep relational reasoning | Needs benchmark | Large 3 vs Medium 3.5 |
| 6. Resolved knowledge/dependencies | Mostly deterministic | N/A | Atlas |
| 7. Workflow/Facts projections | Grounded generation | Strong | Small 4 / deterministic projection |
| 8. CES assessment | High-quality grounded reasoning | Most important benchmark | Medium 3.5 / Large 3 |
| 9. Chatbot mediator | Streaming + tools + reasoning | Very strong | Small 4 |
| 10. Addendum/correction | Language + structured proposal | Strong | Small 4 / Medium 3.5 |
| Evidence/provenance | Document localization | Exceptional fit | OCR 4.1 bounding boxes |
| Incremental operation | Bounded reasoning | Strong | 256K-class context + targeted retrieval |

### Provider-neutral capability aliases

Atlas should request capabilities rather than vendor model IDs.

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

A Mistral-backed qualification map can initially resolve them as:

```text
atlas.document.perceive
    -> Mistral OCR 4.1

atlas.semantic.extract
    -> Mistral Large 3
       with Medium 3.5 as a qualification challenger

atlas.semantic.reconcile
    -> Large 3 vs Medium 3.5 benchmark

atlas.retrieval.embed
    -> mistral-embed

atlas.ces.assess
    -> Medium 3.5 vs Large 3 benchmark

atlas.chat.default
    -> Mistral Small 4

atlas.chat.deep
    -> stronger qualified reasoning model

atlas.addendum.compose
    -> Small 4 by default
       with escalation when semantic complexity requires it
```

The alias is server-controlled. Skills and clients must not select arbitrary providers, model IDs, or endpoints.

### What Mistral is allowed to own

Mistral may provide:

```text
document perception
OCR / document structure
multimodal interpretation
language reasoning
structured candidate generation
embeddings
chat response generation
tool-call proposals
```

Atlas must continue to own:

```text
canonical documents
workspace state
revision history
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

Therefore Atlas remains the system of record and Mistral remains a replaceable reasoning/perception provider.

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


## Mistral document-processing direction

For Mistral qualification, document parsing should use OCR 4.1 as a **derived processing layer**, not as the durable source of truth.

```text
Immutable PDF bytes
      |
      +--> Atlas document identity / hash
      |
      +--> Mistral OCR 4.1
              |
              +-- text / markdown
              +-- tables
              +-- detected image regions
              +-- document blocks
              +-- bounding boxes
              +-- confidence / extraction metadata
```

The OCR result is replaceable and can be regenerated from the immutable document.

Atlas should distinguish three document/knowledge layers:

```text
1. IMMUTABLE SOURCE
   source.pdf
   |
   +-- authoritative document bytes
   +-- content hash
   +-- source identity
   +-- durable / reconstructable

2. DERIVED DOCUMENT PERCEPTION
   normalized document
   |
   +-- page text
   +-- structural blocks
   +-- tables
   +-- images / image references
   +-- page geometry
   +-- bounding boxes
   +-- OCR confidence / extraction metadata
   +-- replaceable / rebuildable

3. DERIVED SEMANTICS
   semantic candidates
   |
   +-- actors
   +-- rules
   +-- constraints
   +-- workflow relationships
   +-- normalized meaning
   +-- evidence links
   +-- candidate-only until deterministic validation
```

Only the immutable source is the durable human-authored source of project knowledge.

Derived document perception may be cached or persisted for efficiency, but it must remain rebuildable from the immutable source and must never become an alternative authoritative document.

Atlas should not make a Mistral-hosted file, library, conversation, or agent the canonical document record. The source bytes and immutable identity stay inside Atlas-controlled storage.

This distinction is especially important for PRDs containing:

```text
flowcharts
sequence diagrams
screenshots
tables
image-only pages
vector diagrams
mixed text + visual layouts
```

Text extraction alone is not sufficient for these documents.

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


## Document perception and semantic extraction

Atlas must explicitly distinguish **Document Perception** from **Semantic Extraction**.

They are separate architectural capabilities:

```text
DOCUMENT PERCEPTION

Immutable Document
       |
       v
PDF / document parsing
       |
       v
OCR / layout / visual localization
       |
       v
NormalizedDocument
```

and:

```text
SEMANTIC EXTRACTION

NormalizedDocument
       |
       v
multimodal semantic reasoning
       |
       v
SemanticCandidates
       |
       v
Atlas deterministic validation
```

The canonical combined flow is:

```text
Immutable Document
       |
       v
Document Perception
       |
       v
NormalizedDocument
       |
       +------------------+
       |                  |
       v                  v
 text/table blocks   visual regions
 page positions      image regions
       |             bounding boxes
       +--------+---------+
                |
                v
       Semantic Extraction
                |
                v
      multimodal semantic reasoning
       Large 3 / Medium 3.5
                |
                v
        SemanticCandidates
                |
                v
      Atlas deterministic validation
```

`Document Perception` answers:

> **What is physically and structurally present in this document, and where is it located?**

`Semantic Extraction` answers:

> **What project meaning can Atlas defensibly derive from that normalized document representation?**

The semantic-extraction skill must not be responsible for opening arbitrary filesystem paths, parsing PDF internals, managing provider file state, or deciding storage policy.

OCR identifies source structure and source-local regions. The reasoning model interprets relationships that OCR alone cannot safely infer, such as:

```text
decision branch direction
arrow relationships
diagram sequencing
state transitions
conditional paths
visual grouping
```

For example, OCR may locate labels such as:

```text
Approved?
Yes
Continue
No
Manual Review
```

but semantic reasoning must determine the actual graph relationship represented by arrows and layout.


### Normalized document representation

The perception stage should produce a provider-neutral `NormalizedDocument` contract conceptually shaped like:

```text
NormalizedDocument
|
+-- artifact identity
+-- source SHA-256
+-- perception version
+-- pages[]
    |
    +-- page number
    +-- dimensions
    +-- text blocks
    +-- tables
    +-- visual regions
    +-- image references
    +-- bounding boxes
    +-- confidence / provider metadata
```

The exact schema is not locked at this checkpoint.

The important invariants are:

```text
provider-neutral
source-linked
page-local
visual-capable
rebuildable
suitable for deterministic evidence validation
```

### Derived perception cache

Atlas may persist or cache the `NormalizedDocument` because recomputing OCR and page perception for every semantic operation would be wasteful.

Conceptually:

```text
DocumentStore
     |
     v
 source.pdf
     |
     v
Document Perception
     |
     v
NormalizedDocument
     |
     v
Atlas derived-perception cache
```

The cache is operational state, not project truth.

It may be invalidated and rebuilt when:

```text
perception implementation changes
provider/version changes
normalization contract changes
integrity verification requires rebuild
explicit reprocessing is requested
```

A cache entry should retain enough provenance to identify:

```text
source document hash
perception capability/version
provider/model or parser identity when relevant
processing timestamp
normalized representation version
```

### Structured output boundary

Provider-side structured output improves format reliability, but it does not grant trust.

The required flow remains:

```text
Mistral structured candidate
        |
        v
JSON parse
        |
        v
complete Atlas AJV/schema validation
        |
        v
reference/evidence validation
        |
        v
candidate may enter Atlas review/reconciliation
```

If a provider cannot express the complete Atlas schema directly, Agents Bridge may use a provider-qualified transport schema, but the complete Atlas schema remains authoritative and must still validate the normalized result.

### Extraction benchmark requirement

Mistral qualification must compare at least:

```text
Large 3
vs
Medium 3.5
```

on Atlas-specific tasks rather than relying only on generic model benchmarks.

Qualification should measure:

```text
candidate recall
candidate precision
hallucination rate
schema pass rate
text evidence accuracy
visual-region evidence accuracy
workflow reconstruction
relationship preservation
ambiguity handling
output truncation
latency
cost
```

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


## Mistral retrieval direction

`mistral-embed` may be used as one retrieval signal, but Atlas owns the index and the retrieval decision process.

Conceptually:

```text
Atlas semantic record
       |
       v
  mistral-embed
       |
       v
 embedding vector
       |
       v
Atlas-owned vector/index storage
       |
       v
combined targeted retrieval
```

Vector similarity must remain optional and additive to stronger Atlas-native signals such as semantic identity, business object, actor, property, condition, dependency, workflow neighborhood, and revision/workspace scope.

The embedding provider must never become the authority for:

```text
truth
supersession
workspace visibility
revision selection
dependency identity
semantic equivalence
```

Those remain Atlas responsibilities.

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


## Mistral reconciliation qualification

Reconciliation is a **hard qualification gate** for the provider.

The model must correctly distinguish cases such as:

```text
replacement
vs
specialization
vs
partial supersession
vs
supporting detail
vs
contradiction
vs
unresolved ambiguity
```

This is more important than raw benchmark intelligence.

The initial Mistral qualification should therefore run the same reconciliation fixtures through:

```text
Mistral Large 3
Mistral Medium 3.5
```

and compare normalized semantic results.

If the more expensive/deeper model does not materially improve Atlas reconciliation quality, Atlas should prefer the cheaper qualified model.

No model may directly update resolved knowledge. Reconciliation output remains a proposal until deterministic validation accepts the referenced entities, evidence, relationships, workspace/base identity, and schema.

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


## Projection execution direction

Main Workflow and Project Facts should prefer deterministic projection whenever the resolved semantic model already contains enough structure.

A language model may assist with:

```text
human-readable grouping
concise explanation
narrative rendering
clarity
```

but must not independently reinterpret source documents.

For Mistral qualification, Small 4 is a suitable default candidate for bounded grounded generation because the input should be resolved Atlas semantics, not the historical PRD corpus.

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


## Mistral CES qualification direction

CES is the **most important model-quality benchmark** in the Mistral evaluation.

A model is not qualified merely because it can summarize project facts or return valid JSON.

It must demonstrate that it can:

```text
reason from supplied project semantics
reason from supplied governed assurance semantics
keep source statements separate from Atlas-derived reasoning
surface foreseeable failure scenarios
avoid implementation prescriptions unless supported
preserve both support chains
expose uncertainty
emit a knowledge gap when support is insufficient
```

The initial candidate comparison should be:

```text
Medium 3.5
vs
Large 3
```

using identical Atlas inputs, schemas, retrieval neighborhoods, and assurance baseline references.

The benchmark should specifically penalize:

```text
invented controls
invented compliance requirements
fabricated source references
unsupported implementation prescriptions
loss of project provenance
loss of assurance provenance
false certainty where a knowledge gap is appropriate
```

The final production choice for `atlas.ces.assess` is therefore intentionally **not locked yet**.

### CES context discipline

Mistral should receive only the bounded context Atlas retrieved:

```text
relevant project semantics
+
relevant assurance concepts
+
their provenance
+
required output contract
```

The model should not independently fetch or choose arbitrary external assurance material during assessment.

This keeps the governed CES baseline deterministic and auditable.

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


## Mistral chatbot direction

The preferred Mistral pattern is stateless model inference with Atlas-owned conversation state.

```text
User
  |
  v
Atlas Chat API
  |
  +-- conversation state
  +-- workspace identity
  +-- permissions
  +-- targeted retrieval
  +-- resolved semantics
  +-- evidence
  |
  v
Agents Bridge
  |
  v
Mistral Small 4
  |
  v
streamed response / tool-call proposal
```

Atlas should store chat history itself.

Mistral should not become the canonical owner of:

```text
conversation memory
workspace state
project truth
correction state
approval state
```

### Tool boundary

For Query and Explore, the model may propose Atlas tools such as:

```text
search_resolved_knowledge()
get_semantic_item()
get_evidence()
get_revision_diff()
compare_workspaces()
list_open_questions()
get_ces_assessment()
```

For Correct, the model may assist with:

```text
resolve correction target
identify ambiguity
request clarification
compose Preview Addendum
```

but all tools execute under Atlas authorization and deterministic validation.

The model never receives direct database mutation authority.

### Escalation

Small 4 is the default chatbot candidate.

Atlas may internally escalate a bounded request to a stronger qualified reasoning model for tasks such as:

```text
cross-document contradiction analysis
complex hypothetical impact analysis
deep revision comparison
complex Addendum composition
```

The user-facing contract should remain an Atlas capability rather than a named vendor model.

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


## Mistral Addendum direction

Mistral may help transform human correction intent into a complete Preview Addendum, but the output remains an untrusted proposal until the normal Atlas cycle succeeds.

Preferred default:

```text
ordinary correction wording
    -> Small 4

semantically complex correction
    -> qualified deeper model when required
```

The Preview Addendum must remain:

```text
human-readable
exportable
complete enough for rebuild
source-resolvable
hashable
immutable after acceptance
```

Provider conversation memory must not be required to reconstruct its meaning.

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


## Text and visual evidence shapes

Atlas should not force all evidence into a textual quote.

At minimum, the evidence model should be able to distinguish:

```text
text_quote
visual_region
```

Conceptually:

```json
{
  "type": "text_quote",
  "artifactId": "prd-001",
  "page": 7,
  "quote": "Rejected KYC submissions require manual review."
}
```

and:

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

The semantic interpretation belongs in the candidate payload. The evidence object points back to the immutable source material.

OCR 4.1 bounding boxes are a strong implementation candidate for producing source-local visual regions, but Atlas owns the evidence contract and must be able to rebuild or revalidate it independently of the provider.

For visual evidence, Atlas should preserve enough identity to detect source drift:

```text
artifact identity
document hash
page
page-render hash when applicable
region
source labels / OCR anchors
```

This prevents a model-generated visual description from being mistaken for direct source evidence.

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


## Agents Bridge provider boundary

Agents Bridge should manage two distinct provider-facing capability families:

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

This is an additive extension of the provider-neutral Bridge boundary, not a transfer of Atlas authority.

Conceptually:

```text
Atlas capability request
        |
        v
Agents Bridge
        |
        +-- capability alias resolution
        +-- timeout / cancellation
        +-- request-size budget
        +-- response-size budget
        +-- retry policy
        +-- usage accounting
        +-- privacy policy
        |
        +--------------------------+
        |                          |
        v                          v
Document Perception           Reasoning
provider capability           provider capability
        |                          |
        v                          v
NormalizedDocument        normalized candidate/events
        |                          |
        +-------------+------------+
                      |
                      v
              Atlas processing
```

For the current Mistral qualification direction:

```text
Document Perception
    -> Mistral OCR 4.1

Semantic Extraction
    -> qualified Mistral reasoning model

Reconciliation
    -> qualified Mistral reasoning model

CES Assessment
    -> qualified Mistral reasoning model

Chat / Addendum
    -> Mistral Small 4 by default, with escalation when needed
```

The Mistral adapter must not gain authority that belongs to Atlas.

Atlas remains responsible for:

```text
DocumentStore access policy
derived-perception cache ownership
retrieval
authorization
candidate validation
trusted state mutation
revision / HEAD / publication
```

Whether the Bridge ultimately exposes document perception through a separate runtime interface, a typed capability request, or another provider-neutral contract is an implementation decision to be locked in the relevant backend ticket rather than in this architecture checkpoint.

A useful future privacy policy shape is:

```text
training: deny
retention: standard | zero
```

The provider adapter is responsible for selecting an endpoint/configuration that satisfies the requested policy, while Atlas remains responsible for its own intentional application storage.

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


## Context-window implication

The current Mistral qualification direction assumes a 256K-class model context.

This is compatible with Atlas **because the architecture is incremental by default**.

A normal operation should send:

```text
current request
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

If routine reconciliation or chatbot execution repeatedly requires the full historical corpus to fit in one model context, that should be treated as an Atlas retrieval/indexing design failure before it is treated as a model context-window problem.

Large-context full reconstruction remains a separate explicit operation for recovery, audit, baseline migration, or major reconciliation.

---


# Canonical Document Processing Pipeline

The production interpretation of Atlas document processing is:

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
                Mistral OCR 4.1
                        |
                        v
              NormalizedDocument
                        |
            +-----------+-----------+
            |                       |
            v                       v
       textual blocks          visual blocks
       tables                  image regions
       page positions          bounding boxes
            |                       |
            +-----------+-----------+
                        |
                        v
              derived-perception cache
                        |
                        v
               semantic extraction
                        |
                        v
                 Agents Bridge
                        |
                        v
             qualified reasoning model
                        |
                        v
              SemanticCandidates
                        |
                        v
          deterministic Atlas validation
```

The boundaries are:

```text
DocumentStore
    owns immutable source bytes

Document Perception
    derives provider-neutral document structure

Derived-Perception Cache
    stores rebuildable processing output

Semantic Extraction
    derives project meaning from normalized document input

Atlas Deterministic Core
    validates candidates and controls trusted state
```

Therefore the phrase **"PRD extraction"** should not be used ambiguously to mean both raw PDF perception and semantic interpretation.

Where precision matters, Atlas documentation should use:

```text
Document Perception
Semantic Extraction
```

The exact public/internal capability names may evolve, but this architectural separation is canonical.

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
Document Perception
        |
        v
NormalizedDocument
        |
        v
Semantic Extraction
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


# Mistral Qualification & Development Boundary

Mistral is the current **first provider qualification direction**, not a permanent architecture dependency.

The provider is considered technically qualified for Atlas only after passing Atlas-specific gates.

## Required qualification gates

```text
1. Structured-output compatibility
   - real Atlas schemas
   - complete AJV validation after normalization

2. Text-heavy PRD extraction
   - existing Safara golden/captured fixtures

3. Visual PRD extraction
   - flowchart
   - screenshot
   - table
   - image-only content
   - preferably sequence/state diagrams

4. Evidence fidelity
   - quote accuracy
   - page accuracy
   - visual-region accuracy
   - no fabricated source evidence

5. Semantic reconciliation
   - new/support/duplicate/refine/extend
   - contradiction
   - supersession
   - partial supersession
   - ambiguity

6. CES epistemic discipline
   - grounded project support
   - grounded assurance support
   - derived reasoning clearly separated
   - unsupported requirements rejected
   - knowledge gaps preserved

7. Conversational mediator behavior
   - Query does not mutate
   - Explore remains hypothetical
   - Correct produces Preview Addendum rather than hidden truth mutation

8. Operational behavior
   - cancellation
   - timeout
   - retries
   - rate limiting
   - output truncation
   - usage accounting
```

## Development vs production privacy

Development may use the provider's development/free offering where available, with training opt-out enabled and non-sensitive or approved development documents.

Free-tier model availability, quotas, and rate limits are **operational configuration**, not an Atlas architecture guarantee.

Production must separately qualify:

```text
provider data-use terms
retention behavior
zero-retention eligibility where required
stateless endpoint coverage
region / residency requirements if introduced
```

Atlas should prefer stateless inference endpoints because Atlas itself already owns durable state.

## Expected provider portability

A successful Mistral implementation must leave this replacement path possible:

```text
Mistral
   |
   v
another provider
```

without changing:

```text
immutable document semantics
Atlas skill contracts
resolved knowledge contracts
CES support chains
revision semantics
approval semantics
evidence identity
chat correction contract
```

Only provider adapters, capability aliases, and provider-specific qualification rules should need to change.

---

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

> **Document Perception and Semantic Extraction are separate capabilities: perception derives rebuildable document structure; semantic extraction derives candidate project meaning.**

> **Normalized document perception is derived operational state, not accepted project truth.**

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

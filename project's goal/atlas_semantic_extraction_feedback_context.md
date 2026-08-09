# Atlas Semantic Extraction & Graph Generation --- Feedback Context

## Purpose

Atlas is the visible output and semantic debugger for CES.

The graph is **not the final product by itself**. It is the visual
representation of what CES understood from the PRD.

The purpose of Atlas is to let a human quickly verify:

-   whether the PRD was understood correctly
-   whether important business semantics were extracted
-   whether relationships were correctly identified
-   whether the selected module can be decomposed further
-   where every extracted concept came from in the original PDF

The current Atlas UI direction is already good. The main problem is
**semantic extraction depth**, not the basic UI layout.

------------------------------------------------------------------------

# 1. Current Atlas Direction

The current Atlas layout contains:

``` text
+----------------------+-----------------------------------------------+---------------+
| Explore              | Main Workflow                                 | PDF Evidence  |
|                      |                                               |               |
| Semantic areas       | Main Project Overview                         | Exact source  |
| / modules            |                                               | PDF text      |
|                      | [Main Workflow Graph]                         |               |
|                      |                                               |               |
|                      | Selected Detail                               |               |
|                      | [Detail Graph]                                |               |
+----------------------+-----------------------------------------------+---------------+
```

This overall structure should be preserved.

The current screen already demonstrates several correct concepts:

-   Main Workflow remains visible.
-   Modules are listed in the left navigation.
-   The main graph is displayed in the center.
-   A selected detail section exists below the main workflow.
-   Breadcrumb navigation exists.
-   Original PDF evidence is displayed on the right.
-   Graph nodes can be associated with source evidence.

The problem is that the selected detail graph is currently too shallow.

------------------------------------------------------------------------

# 2. Main Problem

The current extraction appears to stop around:

``` text
PDF
  |
  v
Module Detection
  |
  v
Graph Generation
```

This causes Atlas to extract mostly:

-   module names
-   introductory context
-   obvious cross-module dependencies

For example, selecting:

``` text
Paket dan Jadwal Keberangkatan
```

may produce a very small graph such as:

``` text
Data Jemaah
       |
       | dependency
       v
Paket dan Jadwal Keberangkatan
       |
       | dependency
       v
Riwayat Aktivitas
```

This is not necessarily incorrect, but it is not sufficiently deep.

The PDF evidence panel already shows that substantive sections exist.
Therefore, the issue is likely not simply PDF retrieval.

The missing stage is **semantic decomposition**.

------------------------------------------------------------------------

# 3. Desired Extraction Pipeline

Atlas/CES should conceptually follow this pipeline:

``` text
PDF PRD
   |
   v
Source Evidence
   |
   v
Semantic Extraction
   |
   v
Business Capability Detection
   |
   v
Semantic Decomposition
   |
   v
Engineering Intent Detection
   |
   v
Relationship Extraction
   |
   v
Semantic Model
   |
   +----------------------+
   |                      |
   v                      v
Graph Selection       CES Standards
   |                      |
   +----------+-----------+
              |
              v
            Atlas
```

The important missing stage is:

``` text
Semantic Decomposition
```

Atlas should not merely identify that a module exists.

It should determine what the module contains.

------------------------------------------------------------------------

# 4. Semantic Extraction vs Documentation Structure

Atlas should not primarily extract documentation structure such as:

``` text
Heading
  |
  +-- Paragraph
  |
  +-- Paragraph
```

It should extract engineering/business semantics such as:

``` text
Business Module
    |
    +-- Concept
    +-- Actor
    +-- Entity
    +-- Action
    +-- State
    +-- Rule
    +-- Decision
    +-- Validation
    +-- Permission
    +-- Dependency
```

The distinction is:

``` text
Documentation Structure
    =
"What sections exist?"

Semantic Structure
    =
"What does the system actually do?"
```

Atlas should prioritize the second.

------------------------------------------------------------------------

# 5. Atomic Engineering Units

A module should be decomposed into increasingly specific units.

Example:

``` text
Tagihan dan Pembayaran
    |
    +-- Pembayaran
    |
    +-- Verifikasi Pembayaran
    |
    +-- Payment State
    |
    +-- Validation
    |
    +-- Decision
    |
    +-- Actor
    |
    +-- Related Entity
```

The exact nodes must come from the PRD.

Do NOT invent concepts merely because they are typical for that domain.

The rule is:

``` text
Exhaustive with respect to evidence
BUT
not creative beyond evidence
```

------------------------------------------------------------------------

# 6. Recursive Decomposition

Atlas should be able to ask:

``` text
Can this node be decomposed further?
```

Example:

``` text
Tagihan dan Pembayaran
    |
    v
Workflow
    |
    +-- Pembayaran
    +-- Verifikasi
    +-- Persetujuan
    +-- Penolakan
```

Then:

``` text
Verifikasi
    |
    +-- Input
    +-- Actor
    +-- Preconditions
    +-- Decision
    +-- Result
    +-- State Transition
```

Continue decomposing until the source-supported concept is sufficiently
atomic.

This is similar to compiler decomposition:

``` text
Program
  |
  v
Class
  |
  v
Method
  |
  v
Statement
  |
  v
Expression
```

Atlas should not stop at the equivalent of "Class" if meaningful
semantic detail exists below it.

------------------------------------------------------------------------

# 7. Graphs Are Views, Not the Semantic Model

This is a critical architectural distinction.

The semantic hierarchy should be separate from graph types.

For example:

``` text
Tagihan dan Pembayaran
    |
    +-- Pembayaran
    |
    +-- Verifikasi
    |
    +-- ...
```

This is the semantic hierarchy.

Then graph representations are generated from that model:

``` text
Tagihan dan Pembayaran
    |
    +-- Workflow
    +-- State Machine
    +-- Decision Graph
    +-- Dependency Graph
```

Therefore:

``` text
Semantic Model
      |
      +-- Workflow View
      +-- State Machine View
      +-- Decision View
      +-- Entity View
      +-- Dependency View
```

Graph types should not become the underlying semantic hierarchy.

------------------------------------------------------------------------

# 8. Desired Navigation Hierarchy

The left navigation should represent semantic modules and nested
concepts.

Example:

``` text
EXPLORE

Paket dan Jadwal Keberangkatan
  Module

Data Jemaah
  Module

Pendaftaran Jemaah
  Module

Tagihan dan Pembayaran
  Module
    > source-derived nested concepts

Dokumen Jemaah
  Module

Status Perjalanan dan Kesiapan
  Module

Manifest Keberangkatan
  Module

Dashboard dan Laporan
  Module

Riwayat Aktivitas
  Module
```

Nested concepts must be based on actual PRD evidence.

Do not create artificial hierarchy simply to make the navigation look
complete.

------------------------------------------------------------------------

# 9. Breadcrumb Navigation

When a module is selected:

``` text
Main Workflow
>
Tagihan dan Pembayaran
```

When a nested concept is selected:

``` text
Main Workflow
>
Tagihan dan Pembayaran
>
Verifikasi Pembayaran
```

This allows Atlas to recursively navigate the semantic model.

------------------------------------------------------------------------

# 10. Desired Detail Workspace

When selecting:

``` text
Tagihan dan Pembayaran
```

the detail section should look conceptually like:

``` text
+--------------------------------------------------------------------------------+
| Main Workflow > Tagihan dan Pembayaran                         [Close]          |
+--------------------------------------------------------------------------------+

SELECTED MODULE

Tagihan dan Pembayaran

Source:
PDF pages X-Y

Evidence:
N source units

+------------------------------------------------------------------------------+
| MODULE OVERVIEW                                                              |
|                                                                              |
| Source-derived description/context                                          |
+------------------------------------------------------------------------------+

AVAILABLE REPRESENTATIONS

+----------------------+----------------------+----------------------+
| Workflow             | State Machine        | Rules / Decisions    |
|                      |                      |                      |
| Payment processing   | Payment lifecycle    | Payment conditions   |
+----------------------+----------------------+----------------------+

+------------------------------------------------------------------------------+
| SELECTED REPRESENTATION: WORKFLOW                                           |
|                                                                              |
| [Workflow Graph]                                                             |
+------------------------------------------------------------------------------+
```

The exact available graph types depend on what the PRD supports.

------------------------------------------------------------------------

# 11. Desired Workflow Graph

If the PRD supports a sequence such as:

``` text
Pembayaran
    |
    v
Verifikasi
    |
    +---- accepted ----> Diterima
    |
    +---- rejected ----> Ditolak
```

Atlas may render:

``` text
+-------------+
| Pembayaran  |
+-------------+
       |
       | requires verification
       v
+-------------+
| Verifikasi  |
+-------------+
     /   \
    /     \
   v       v
+------+ +--------+
|Diterima|Ditolak|
+------+ +--------+
```

However:

**Only source-supported concepts and relationships should be rendered.**

Do not infer unsupported states or actions merely because they are
common in payment systems.

------------------------------------------------------------------------

# 12. Desired State Machine

If the PRD explicitly describes states and transitions, Atlas should
provide a state-machine representation.

Example:

``` text
+-----------+
|   Draft   |
+-----------+
      |
      | payment submitted
      v
+-----------+
|  Pending  |
+-----------+
    /     \
   /       \
approved   rejected
  /           \
 v             v
+------+   +-----------+
|Lunas |   | Ditolak   |
+------+   +-----------+
```

Again, this is only an example of the representation.

The actual states and transitions must be extracted from the PRD.

------------------------------------------------------------------------

# 13. Desired Nested Concept View

If the PRD contains:

``` text
Tagihan dan Pembayaran

    Pembayaran

    Verifikasi Pembayaran

    ...
```

Atlas should support:

``` text
Main Workflow
>
Tagihan dan Pembayaran
>
Verifikasi Pembayaran
```

The selected concept can then display its own representation:

``` text
VERIFIKASI PEMBAYARAN

Source Evidence
    Page X
    Page Y

Semantic Elements

    Actor
    Input
    Action
    Preconditions
    Decision
    Result
    State Transition

+----------------------------------------------------------+
| DECISION GRAPH                                           |
|                                                          |
| Payment received                                         |
|        |                                                 |
|        v                                                 |
| Verification                                             |
|     /       \                                            |
| valid       invalid                                      |
|   /           \                                          |
| accepted    rejected                                     |
+----------------------------------------------------------+
```

The hierarchy must remain recursively navigable.

------------------------------------------------------------------------

# 14. Evidence Must Remain Connected

Every semantic node and graph element should be traceable back to source
evidence.

Example:

``` text
Node:
Verifikasi Pembayaran

Evidence:
Page 12, source unit 12.4
Page 13, source unit 13.2

Confidence:
0.94

Status:
UNREVIEWED
```

The right-hand PDF panel should continue showing the original text.

The preferred evidence hierarchy is:

``` text
Graph Node
    |
    v
Semantic Element
    |
    v
Source Unit
    |
    v
PDF Page
    |
    v
Exact Original Text
```

Do not normalize the original source text into English when showing
evidence.

English may be used to describe relationships or graph semantics, but
the evidence itself should preserve the original PRD language.

------------------------------------------------------------------------

# 15. Main Workflow Must Remain High-Level

The Main Workflow should NOT become a giant graph.

It should represent the major business modules.

Example:

``` text
Paket dan Jadwal Keberangkatan
            |
            v
       Data Jemaah
            |
            v
    Pendaftaran Jemaah
            |
            v
   Tagihan dan Pembayaran
            |
            v
       Dokumen Jemaah
            |
            v
 Status Perjalanan dan Kesiapan
          /       \
         v         v
Manifest          Dashboard
Keberangkatan     dan Laporan
         \         /
          \       /
           v     v
       Riwayat Aktivitas
```

This graph answers:

> "What is the overall lifecycle?"

The detail graphs answer:

> "What actually happens inside this module?"

------------------------------------------------------------------------

# 16. Main Workflow Desired Output

The overall Atlas should remain visually similar to:

``` text
+----------------------+-----------------------------------------------+---------------+
| EXPLORE              | MAIN WORKFLOW                                 | PDF EVIDENCE  |
|                      |                                               |               |
| Paket dan Jadwal     | [MAIN WORKFLOW GRAPH]                         | Page 3        |
| Keberangkatan        |                                               |               |
|                      | Paket dan Jadwal -> Data Jemaah              | Original text |
| Data Jemaah          | -> Pendaftaran Jemaah                        |               |
|                      | -> Tagihan dan Pembayaran                     |               |
| Pendaftaran Jemaah   | -> Dokumen Jemaah                            |               |
|                      | -> Status Perjalanan dan Kesiapan             |               |
| Tagihan dan          | -> Manifest / Dashboard / Riwayat             |               |
| Pembayaran            |                                               |               |
|                      |                                               |               |
| Dokumen Jemaah       |-----------------------------------------------|               |
|                      | Breadcrumb                                    |               |
| Status Perjalanan    | Main Workflow > Tagihan dan Pembayaran       |               |
| dan Kesiapan         |                                               |               |
|                      | SELECTED DETAIL                              |               |
| Manifest             |                                               |               |
| Keberangkatan        | [Workflow / State / Decision Graph]           |               |
|                      |                                               |               |
| Dashboard dan        |                                               |               |
| Laporan              |                                               |               |
|                      |                                               |               |
| Riwayat Aktivitas    |                                               |               |
+----------------------+-----------------------------------------------+---------------+
```

The key difference from the current implementation is **what appears
after selecting a module**.

------------------------------------------------------------------------

# 17. Current Output vs Desired Output

## Current

``` text
Main Workflow
    |
    v
Selected Module
    |
    v
Small dependency graph

3 nodes
2 relationships
```

The graph often reflects:

``` text
module references
dependencies
introductory context
```

------------------------------------------------------------------------

## Desired

``` text
Main Workflow
    |
    v
Selected Module
    |
    v
Exhaustive source evidence collection
    |
    v
Semantic decomposition
    |
    v
Nested concepts
    |
    +-- Actions
    +-- Actors
    +-- Entities
    +-- States
    +-- Rules
    +-- Decisions
    +-- Validations
    +-- Permissions
    +-- Dependencies
    |
    v
Graph representations
    |
    +-- Workflow
    +-- State Machine
    +-- Decision Graph
    +-- Entity Lifecycle
    +-- Dependency Graph
    |
    v
Evidence-linked Atlas output
```

------------------------------------------------------------------------

# 18. Important Non-Goals

Do NOT solve the problem by simply generating more graphs.

Do NOT:

``` text
Add random graph types
Add speculative nodes
Invent business states
Invent business rules
Normalize source text unnecessarily
Generate relationships because they are "typical"
```

Instead:

``` text
Increase semantic extraction depth
Increase source coverage
Increase evidence traceability
Increase recursive decomposition
Generate graph types from the semantic model
```

------------------------------------------------------------------------

# 19. Atlas as Semantic Debugger

Atlas should be treated as a visual debugger for CES.

The development loop is:

``` text
PRD
  |
  v
Semantic Extraction
  |
  v
Knowledge Model
  |
  v
Atlas Graph
  |
  v
Human asks:

"Does this actually represent
what the PRD says?"
  |
  +---- YES ---> Continue
  |
  +---- NO ----> Improve extraction
```

The graph is therefore a diagnostic artifact.

If a graph is missing important concepts, the problem is likely upstream
in semantic extraction rather than in graph rendering.

------------------------------------------------------------------------

# 20. Final Desired Architecture

``` text
                           PDF PRD
                              |
                              v
                    +------------------+
                    | Source Evidence  |
                    | Exact PDF text   |
                    +------------------+
                              |
                              v
                  +-----------------------+
                  | Semantic Extraction   |
                  |                       |
                  | Modules               |
                  | Concepts              |
                  | Actors                |
                  | Actions               |
                  | Entities              |
                  | States                |
                  | Rules                 |
                  | Decisions             |
                  | Validations           |
                  | Permissions           |
                  | Relationships         |
                  +-----------------------+
                              |
                              v
                  +-----------------------+
                  | Semantic Model        |
                  |                       |
                  | Recursive hierarchy   |
                  | Relationships         |
                  +-----------------------+
                       /             \
                      /               \
                     v                 v
          +------------------+   +--------------------+
          | Graph Selection  |   | CES Standards      |
          |                  |   |                    |
          | Workflow         |   | Security           |
          | State Machine    |   | Architecture       |
          | Decision Graph   |   | Testing            |
          | Entity Lifecycle |   | Company Policy     |
          | Dependency       |   | OWASP etc.         |
          +------------------+   +--------------------+
                     \               /
                      \             /
                       v           v
                         +-------+
                         | Atlas |
                         +-------+
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
          Main Graph    Detail Graph   Evidence
```

------------------------------------------------------------------------

# 21. Core Instruction for Implementation

The central implementation requirement should be:

> **Given a selected module, Atlas must exhaustively inspect all
> relevant source evidence from the PRD, decompose that evidence into
> source-supported semantic concepts and relationships, construct a
> recursive semantic model, and only then generate the appropriate graph
> representations.**

The graph renderer should be considered downstream of semantic
extraction.

The goal is not:

``` text
"Generate a graph."
```

The goal is:

``` text
"Understand the PRD deeply enough that the correct graph
naturally emerges from the semantic model."
```

That is the desired direction for Atlas.

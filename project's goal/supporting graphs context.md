# Graph Selection Heuristics

## Objective

The purpose of graph extraction is **not** to convert every section into a flowchart.

Instead, determine the most appropriate graph type according to the semantic meaning of the PRD section.

Every graph should represent **one concern only**.

Graph selection is independent of rendering technology. The selected graph
type describes business semantics, while a separate backend renderer
descriptor selects an approved interactive presentation. No graph type is
locked to Mermaid or any other renderer.

---

# Decision Tree

```
Is this describing the overall business process?
|
+-- YES --> Business Workflow
|
+-- NO
      |
      +-- Is this describing sequential steps?
      |        |
      |        +-- YES --> Workflow
      |
      +-- Is this describing status transitions?
      |        |
      |        +-- YES --> State Machine
      |
      +-- Is this describing branching conditions?
      |        |
      |        +-- YES --> Decision Tree
      |
      +-- Is this describing entity evolution?
      |        |
      |        +-- YES --> Entity Lifecycle
      |
      +-- Is this describing data dependency?
      |        |
      |        +-- YES --> Dependency Graph
      |
      +-- Is this describing audit/history?
      |        |
      |        +-- YES --> Audit Flow
      |
      +-- Is this describing data structure?
               |
               +-- YES --> Entity Relationship
```

---

# Graph Types

---

## 1. Business Workflow

Purpose

Show the highest-level lifecycle of the system.

Characteristics

- Represents modules instead of individual actions.
- Each node is usually a PRD chapter or business module.
- Keep the graph simple.
- Avoid validations.
- Avoid conditions.
- Avoid implementation details.

Example

```
Package

↓

Registration

↓

Payment

↓

Readiness

↓

Manifest
```

Suitable For

- Overall Workflow
- Business Overview
- Project Overview

---

## 2. Workflow

Purpose

Describe sequential business activities.

Characteristics

- Represents actions.
- Ordered execution.
- May contain simple branching.
- Represents "what happens next".

Example

```
Create Registration

↓

Generate Invoice

↓

Upload Payment

↓

Verify Payment
```

Suitable For

- Registration
- Payment
- Document Upload
- Manifest Generation

---

## 3. State Machine

Purpose

Describe lifecycle transitions.

Characteristics

- Nodes are states.
- Edges are transitions.
- No business process.
- No actors.

Example

```
Pending

↓

Verified

↓

Completed
```

Suitable For

- Payment Status
- Document Status
- Booking Status
- Order Status
- Approval Status

Keywords

- Status
- State
- Pending
- Approved
- Rejected
- Draft
- Active
- Closed

---

## 4. Decision Tree

Purpose

Represent business rules.

Characteristics

- Diamond-like decisions.
- Branching.
- Rule evaluation.

Example

```
Payment Complete?

↓

Yes / No

↓

Document Valid?

↓

Ready
```

Suitable For

- Eligibility
- Validation
- Readiness
- Approval Logic

Keywords

- If
- Otherwise
- Must
- Should
- Eligible
- Validation
- Condition

---

## 5. Entity Lifecycle

Purpose

Describe how a business entity evolves.

Characteristics

- Focus on one entity.
- Covers creation through retirement.
- Different from workflow because it follows an object's life rather than a user's actions.

Example

```
Create Customer

↓

Edit

↓

Deactivate
```

Suitable For

- Customer
- Jemaah
- Product
- Employee

Keywords

- Create
- Update
- Archive
- Delete
- Activate
- Deactivate

---

## 6. Dependency Graph

Purpose

Show information dependencies.

Characteristics

- No execution order.
- No states.
- Shows where information comes from.

Example

```
Payment

↓

Dashboard

Registration

↓

Dashboard

Documents

↓

Dashboard
```

Suitable For

- Dashboard
- Reports
- Analytics
- Summary

Keywords

- Dashboard
- Report
- Statistics
- Summary
- Aggregation

---

## 7. Audit Flow

Purpose

Represent audit logging.

Characteristics

- Focus on traceability.
- Records changes.
- Records actors.
- Records timestamps.

Example

```
User Action

↓

Activity Log

↓

Audit Record
```

Suitable For

- Audit
- History
- Logs

Keywords

- Log
- History
- Audit
- Activity

---

## 8. Entity Relationship

Purpose

Describe business data.

Characteristics

- Entities.
- Relationships.
- Cardinality.

Example

```
Jemaah

1 ---- * Registration

Registration

1 ---- * Payment
```

Suitable For

- Database Design
- Business Entities
- Domain Model

Keywords

- Has many
- Belongs to
- Reference
- Foreign Key

---

# Multiple Graphs Per Module

A single module may contain multiple graph types.

Example

```
Tagihan dan Pembayaran

├── Workflow
├── Payment State Machine
├── Billing State Machine
├── Business Rules
└── Validation Rules
```

Another example

```
Status Perjalanan dan Kesiapan

├── Decision Tree
├── Readiness State Machine
└── Blocking Conditions
```

---

# Graph Selection Priority

If multiple graph types are applicable, use the following priority:

1. Business Workflow (only once per project)
2. Workflow
3. State Machine
4. Decision Tree
5. Entity Lifecycle
6. Dependency Graph
7. Audit Flow
8. Entity Relationship

A module may generate multiple graphs when different concerns are identified.

---

# Extraction Principles

- Preserve original terminology from the PRD.
- Never rename business concepts.
- English may be used only for edge labels or relationship descriptions.
- One graph should represent one concern.
- Avoid giant graphs.
- Prefer multiple focused graphs over one complex graph.
- Business rules should not be mixed into workflows unless they directly affect flow control.
- State machines should describe lifecycle transitions only.
- Dependency graphs should describe information flow only.
- Every graph should be traceable back to the original PRD section.

---

# Expected Output

For every detected module:

```
Module

Purpose

Detected Graph Types

Workflow

State Machine

Decision Tree

Entity Lifecycle

Dependency Graph

Business Rules

Validation Rules

Evidence
```

Only include graph types that are applicable to the module.

# Graph Detection Scoring

For each PRD section, calculate a score for every graph type.

| Signal | Workflow | State | Decision | Lifecycle | Dependency | Audit | ER |
|---------|----------|--------|----------|-----------|------------|-------|----|
| Sequential actions | +3 | 0 | 0 | 0 | 0 | 0 | 0 |
| Status transitions | 0 | +4 | 0 | +1 | 0 | 0 | 0 |
| If / Else logic | +1 | 0 | +4 | 0 | 0 | 0 | 0 |
| CRUD operations | +1 | 0 | 0 | +4 | 0 | 0 | +1 |
| Aggregation / Dashboard | 0 | 0 | 0 | 0 | +4 | 0 | 0 |
| Logs / History | 0 | 0 | 0 | 0 | 0 | +4 | 0 |
| Entity relationships | 0 | 0 | 0 | +1 | 0 | 0 | +4 |

The graph type(s) with the highest score should be generated.

Multiple graph types may be generated if they describe different concerns within the same module.

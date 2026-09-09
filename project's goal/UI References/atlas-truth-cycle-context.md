# Atlas Truth Cycle & AI Review Architecture Context

## 1. Atlas Core Philosophy

Atlas is not only a PRD extraction tool. Atlas is a knowledge governance system.

The goal:

```
Immutable Source Documents
        +
Controlled Knowledge Extraction
        +
Human Validation
        +
Traceable Knowledge Evolution
```

Atlas must preserve:

- Original uploaded PDFs
- Extraction history
- Human decisions
- Correction history
- Addendum documents
- Current authoritative knowledge state

The original PDF must never be modified.

---

## 2. Atlas Knowledge Lifecycle

```
User Upload PDF

        |
        v

Extraction Queue

        |
        v

Atlas Draft Knowledge

        |
        v

Review & Correction Phase

        |
        +--> Chatbot Assistance
        |
        +--> User Corrections
        |
        v

Approval

        |
        v

Authoritative Atlas Truth

        |
        v

Future Changes Create Addendum
```

---

## 3. Background Extraction Jobs

PDF extraction must run asynchronously.

Do not:

```
Upload PDF
    |
Wait for AI processing
    |
Return result
```

Instead:

```
Upload PDF

    |
    v

Create Extraction Job

    |
    v

Worker Processing

    |
    v

Store Draft Result
```

Example states:

```
QUEUED
 |
 v
PROCESSING
 |
 v
COMPLETED
 |
 v
WAITING_REVIEW
```

---

## 4. Draft vs Truth

Extraction output is not immediately authoritative.

```
Atlas Draft
      |
      |
 Human Review
      |
      v
Atlas Truth
```

AI output is a proposal.

Approved knowledge becomes the source Atlas uses for future answers.

---

## 5. Chatbot Role

Atlas has two AI responsibilities.

### Extraction AI

Purpose:

Create structured knowledge:

- workflows
- facts
- business rules
- relationships

Output:

Deterministic JSON.

---

### Atlas Assistant

Purpose:

Help humans understand and modify knowledge.

Example:

User:

"Why did Atlas add Visa Approval?"

Atlas:

"The step was extracted from PRD v2 page 14 because the document states visa approval is required before departure."

The chatbot must not directly modify Atlas Truth.

Flow:

```
User Question

      |
      v

Chatbot Explanation

      |
      v

Correction Proposal

      |
      v

Approval

      |
      v

New Truth Version
```

---

## 6. Sectioned Skills Concept

Atlas should not use one giant AI agent.

```
Atlas AI Layer

    |
    +-- Workflow Skill
    |
    +-- Project Fact Skill
    |
    +-- Business Rule Skill
    |
    +-- Relationship Skill
    |
    +-- Change Detection Skill
```

Each skill defines:

- purpose
- input contract
- reasoning specification
- output schema

---

## 7. Portable Reasoning Specification

Reasoning rules must not depend on an AI vendor.

```
Section Skill

      |

Portable Reasoning Specification

      |

AI Provider Adapter

      |

Groq / OpenAI / Gemini / Local Model
```

The model can change.

The reasoning contract remains stable.

---

## 8. Deterministic JSON Requirement

AI output becomes Atlas knowledge.

Before saving:

```
LLM Output

      |
      v

JSON Schema Validation

      |
      v

Semantic Validation

      |
      v

Database
```

---

## 9. Approval and Correction Phase

Approval means:

"Review proposed knowledge changes"

Not:

"Approve AI output"

Users should see:

- what changed
- why Atlas changed it
- source evidence
- impact

Example:

Current:

```
Payment Verification

↓

Document Review

↓

Departure Ready
```

Proposed:

```
Payment Verification

↓

Document Review

↓

Visa Approval

↓

Departure Ready
```

Reason:

```
New business rule detected

Source:
Safara_PRD_v2.pdf page 14
```

---

## 10. Reconciliation Model

Multiple users can upload documents simultaneously.

Each upload creates an independent extraction cycle.

```
User A Upload
      |
      v
Extraction Cycle A


User B Upload
      |
      v
Extraction Cycle B
```

Both become candidates.

Only one becomes the authoritative truth version.

---

## 11. Truth Version Lock

Approval requires concurrency protection.

Example:

```
current_truth_version = 5
```

User A approves:

```
version 5 -> version 6
```

User B approves old version:

```
Rejected

Another truth version changed this project.
Please reconcile.
```

Use optimistic locking.

---

## 12. Review Requirement Detection

Atlas should not rely only on confidence scores.

Use a review evaluation engine.

Triggers:

### Low confidence

Example:

Document:

```
should normally
```

AI interpretation:

```
must
```

Needs review.

---

### Conflict detection

Example:

Page 10:

```
Visa required before departure
```

Page 20:

```
Visa processed after departure
```

Needs review.

---

### Existing truth modification

Old:

```
Ready =
Payment Complete
+
Documents Complete
```

New:

```
Ready =
Payment Complete
+
Documents Complete
+
Visa Approved
```

Needs review.

---

### Missing information

Example:

```
Registration

↓

Payment

↓

???
```

Atlas should ask.

---

## 13. Review Workspace UI

Route concept:

```
/projects/{projectId}/workflows/{workflowId}/review
```

Layout:

```
------------------------------------------------
Workflow Review

Status:
Awaiting Approval
------------------------------------------------


-----------------------|------------------------
Knowledge Diff         | Atlas Assistant
                       |
Before                 | User question
                       |
After                  | Atlas explanation
                       |
Source Evidence        |
-----------------------|------------------------


Actions:

Request Changes
Reject
Approve & Create Addendum

------------------------------------------------
```

---

## 14. Approval Result

Approval creates a new truth version.

It does not overwrite old documents.

Example:

```
PRD-v1.pdf

        +

Addendum-001.pdf

        |

        v

Atlas Truth v2
```

---

## 15. Core Backend Entities

```
documents

extraction_cycles

knowledge_items

review_tasks

change_requests

truth_versions

addendums

agent_runs
```

---

## Final Principle

Atlas is not:

```
PDF -> AI -> Answer
```

Atlas is:

```
PDF

↓

Extraction

↓

Draft Knowledge

↓

Human Review

↓

Approved Truth

↓

Assistant Exploration

↓

Controlled Evolution
```

AI assists knowledge creation, but humans control authoritative truth.

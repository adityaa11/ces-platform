# CES Policies -- Frozen Context v1

**Status:** Authoritative frozen context for CES Policies v1  
**Purpose:** Shared implementation contract for Codex and cross-review  
**Scope:** CES Policies only  
**Last frozen:** 2026-08-11

---

## 1. Core Purpose

CES Policies exists to provide **baseline engineering awareness** before architecture, stack selection, and implementation.

Its job is to take structured project facts from Atlas and determine:

- which engineering obligations matter;
- where they matter in the project;
- why they matter;
- what risks or concerns are relevant;
- what the eventual solution must be capable of handling.

CES Policies does **not** decide how those obligations are implemented.

The governing question is:

> Given what this system does, what must the development team be aware of and eventually account for?

CES Policies is intended to improve software-side readiness for future security review, penetration testing, and ISO/IEC 27001 certification preparation.

CES Policies does **not** claim that a CES-reviewed system is ISO certified.

---

## 2. Position in CES

```text
Atlas
Business truth extracted from PRD
        v
CES Policies
Baseline awareness
        v
Context-bound obligations
Engineering concerns
Capability needs
        |
-------- CES POLICY SCOPE ENDS --------
        v
Architecture
        v
Stack Selection
        v
Implementation
```

Atlas provides project facts.

CES Policies enriches those facts with engineering awareness.

Architecture and implementation happen downstream.

---

## 3. Primary Boundary -- WHAT, Never HOW

A CES Policy defines:

> **WHAT must remain true or must be accounted for.**

A CES Policy must not define:

> **HOW the system should make it true.**

### In scope

Examples:

```text
Critical information must preserve integrity.

Sensitive information must have controlled access.

Security-relevant actions must be attributable.

Persisted information must have an appropriate lifecycle.

Security-relevant processing must be protected against
applicable risks.
```

### Out of scope

Examples:

```text
Use PostgreSQL.

Use AWS S3.

Use Kafka.

Use Redis.

Use SELECT FOR UPDATE.

Use optimistic locking.

Use JWT.

Create an audit_log table.

Run a cleanup cron every night.
```

Those are architecture, stack, or implementation decisions.

---

## 4. Technology-Independence Test

Every proposed CES Policy must pass this test:

> If the project changes cloud provider, database, programming language, framework, and deployment model, should this obligation still be true?

If **yes**, it may belong in CES Policies.

If **no**, it probably belongs downstream.

Examples:

| Statement | CES Policy Scope |
|---|---|
| Sensitive information requires controlled access | Yes |
| Enable S3 Block Public Access | No |
| Critical state changes must preserve integrity | Yes |
| Use a SQL transaction | No |
| Important actions must be traceable | Yes |
| Create an audit table | No |
| Persisted information must have a defined lifecycle | Yes |
| Run a cleanup cron | No |

---

## 5. Baseline Awareness, Not Implementation Prescription

CES Policies must increase awareness without prematurely making technical decisions.

A valid CES Policy output may say:

```text
The future solution must be capable of safely handling
conflicting critical state changes.
```

It must not say:

```text
Use PostgreSQL row locking.
```

A valid CES Policy output may say:

```text
Persisted sensitive files require controlled access,
lifecycle handling, and appropriate protection.
```

It must not say:

```text
Use AWS S3 with lifecycle rules and presigned URLs.
```

---

## 6. Source Glossary v1 -- FROZEN

CES Policies v1 uses exactly four core source families.

### 6.1 ISO/IEC 27001

**Role:** Certification anchor

Purpose inside CES:

- establishes the ISO/IEC 27001 certification-readiness objective;
- explains why information-security outcomes matter;
- provides the primary certification-oriented baseline.

---

### 6.2 ISO/IEC 27002

**Role:** Control guidance

Purpose inside CES:

- helps interpret information-security control intent;
- provides guidance on the types of outcomes and control areas that matter;
- supports translation from ISO certification objectives into software-relevant awareness.

---

### 6.3 OWASP ASVS

**Role:** Application security verification baseline

Purpose inside CES:

- provides application-level security expectations;
- helps identify security properties a web application should be able to satisfy and verify;
- supports normalization of application-security obligations.

---

### 6.4 OWASP WSTG

**Role:** Adversarial / penetration-testing perspective

Purpose inside CES:

- provides practical web security testing contexts;
- helps CES expose how application boundaries may be challenged;
- supports penetration-test awareness without prescribing implementation.

---

## 7. Source Glossary v1 Is Frozen

The v1 core does **not** include additional standards simply because they are respected or useful.

The following are explicitly **not part of the frozen v1 core**:

```text
NIST SP 800-53
CIS
PCI DSS
ISO/IEC 27017
ISO/IEC 27005
ISO/IEC 27034
ISO/IEC 27701
OWASP MASVS
OWASP MASTG
AWS documentation
PostgreSQL documentation
Kafka documentation
Redis documentation
OWASP Cheat Sheets
vendor/framework implementation guides
```

These may be considered later only when a demonstrated context or knowledge gap justifies them.

They must not be silently added to the v1 baseline.

---

## 8. Future Source Classes

Future sources may exist in two categories.

### 8.1 Contextual / Conditional Standards

Activated only when project context makes them relevant.

Examples:

```text
Payment-card scope
-> PCI DSS

Cloud-specific scope
-> ISO/IEC 27017

Mobile application
-> OWASP MASVS / MASTG
```

These are not part of v1.

### 8.2 Implementation Sources

Used only after architecture and stack decisions exist.

Examples:

```text
AWS docs
PostgreSQL docs
Kafka docs
Redis docs
framework docs
OWASP Cheat Sheets
```

Implementation sources must not define canonical CES Policies.

---

## 9. Why the Source Glossary Exists

The Source Glossary is not merely citation storage.

Its main operational responsibility is:

> **Versioned source governance and update checking.**

CES needs to know:

- which source is used;
- which version / edition / release is used;
- when it was last checked;
- whether a newer release exists;
- whether a detected update may affect CES vocabulary or mappings.

Conceptual lifecycle:

```text
Tracked Source Release
        v
Check for Updates
        |
        +-- unchanged
        |
        +-- update detected
                v
        Update Candidate
                v
        Impact Analysis
                v
        Human Review
                v
        New CES Baseline
```

A source update must **never silently mutate** an existing published CES baseline.

---

## 10. Sources and CES Vocabulary Are Independent

External standards must not become the internal CES schema.

Example:

```text
ASVS release A
authorization requirement X
        v
CES canonical concept
ACCESS_CONTROL
```

If a later ASVS release renames, restructures, or renumbers that requirement:

```text
ASVS release B
authorization requirement Y
        v
same CES canonical concept
ACCESS_CONTROL
```

The source mapping changes.

The CES concept does not need to change unless its engineering meaning changes.

---

## 11. Source Vocabulary Must Be Extracted Before Policies Are Defined

The next knowledge-design step is:

```text
Frozen Source Glossary
        v
Raw Source Vocabulary
        v
Normalized CES Canonical Vocabulary
        v
Candidate CES Policies
```

Do not jump directly from the four source documents to a hand-written policy list.

Raw vocabulary must preserve source terminology first.

Examples of source-level concepts may include:

```text
access control
authorization
authentication
logging
monitoring
information deletion
secure development
input validation
session management
business logic testing
authorization testing
file upload testing
payment functionality testing
```

These must initially remain source concepts.

---

## 12. Semantic Roles for Extracted Vocabulary

Every extracted source concept should be classified by semantic role.

The initial approved semantic-role direction is:

```text
objective
control
requirement
risk_concern
verification_context
evidence_expectation
out_of_scope_organizational
```

This classification exists to prevent:

- a WSTG test case from becoming a Policy;
- an implementation technique from becoming a Policy;
- an organizational ISO control from leaking into CES software scope.

The exact storage schema is not yet frozen.

---

## 13. Canonicalization

After raw vocabulary extraction, overlapping concepts from the four sources are normalized into CES canonical vocabulary.

Example:

```text
ISO:
access control

ASVS:
authorization

WSTG:
authorization testing
IDOR / cross-resource testing contexts

        v normalization

CES:
ACCESS_CONTROL
```

But related items may become different semantic objects:

```text
ACCESS_CONTROL
    +-- obligation / policy concept
    +-- unauthorized resource access -> concern
    +-- cross-user access testing -> verification context
```

Do not create multiple CES Policies simply because multiple sources use different terminology.

---

## 14. Policy Philosophy

CES must prefer a **small set of broad, enduring obligations** over a large collection of technical micro-policies.

Bad direction:

```text
CONCURRENCY_POLICY
TRANSACTION_POLICY
ROW_LOCK_POLICY
DUPLICATE_PAYMENT_POLICY
PAYMENT_ROLLBACK_POLICY
```

Better direction:

```text
INFORMATION_INTEGRITY
```

with project-specific Context Binding that explains:

- concurrency risk;
- duplicate processing risk;
- partial state-change risk;
- invalid state-transition risk.

The exact v1 Policy taxonomy is **not frozen yet**.

---

## 15. Context Binding Is Mandatory

A generic Policy is not useful enough by itself.

CES must bind every activated Policy to concrete Atlas facts.

Invalid output:

```text
INFORMATION_INTEGRITY applies.
```

Valid direction:

```text
INFORMATION INTEGRITY

Applies to:
Payment Confirmation

Why:
Payment confirmation changes financial state and also
affects jamaah readiness.

Relevant concerns:
- duplicate processing
- conflicting modification
- partial completion

What must remain true:
One logical payment confirmation must not leave related
financial and readiness state inconsistent.

Implementation:
Not decided.
```

Every activated Policy must be explainable through concrete project facts.

---

## 16. Concerns Are Not Policies

Examples of engineering concerns:

```text
concurrent modification
duplicate processing
partial failure
lost update
workflow bypass
replay
orphaned information
unauthorized resource access
accidental public exposure
```

These describe ways an enduring Policy could be violated in a specific context.

Conceptual relationship:

```text
INFORMATION_INTEGRITY
        v
Payment Confirmation
        v
Concerns
+-- duplicate processing
+-- conflicting modification
+-- partial completion
+-- invalid state transition
```

Do not automatically turn each concern into a separate Policy.

---

## 17. Capability Needs

CES Policies may expose what the eventual solution must be capable of handling.

Example:

```text
Concern:
Conflicting modification.

Capability need:
The eventual solution must be capable of preventing,
detecting, or safely coordinating conflicting changes.
```

This is still inside baseline-awareness scope.

Implementation remains downstream.

Conceptual boundary:

```text
Policy
   v
Context Binding
   v
Concern
   v
Capability Need
   v
-------- CES POLICY SCOPE ENDS --------
   v
Architecture
   v
Stack
   v
Implementation
```

---

## 18. Policy Resolution States

Current approved direction uses three result states:

### DEFINED

The project already contains enough relevant information.

### AWARENESS_REQUIRED

The implementation must eventually account for the issue, but no immediate business decision is required.

### DECISION_REQUIRED

CES cannot safely determine the answer because a genuine business, legal, architecture, or organizational decision is missing.

Example:

```text
Passport lifecycle

Access restriction      DEFINED
Retention duration      DECISION_REQUIRED
Replacement handling    AWARENESS_REQUIRED
Deletion rule           DECISION_REQUIRED
```

CES must expose missing decisions instead of inventing them.

---

## 19. Business Rules Are Not CES Policies

Examples:

```text
NIK must contain exactly 16 digits.

Passport must be valid for six months.

Jamaah becomes Ready when payment reaches zero.
```

These belong to Atlas / business truth.

They may trigger or parameterize CES Policy reasoning.

They must not become globally reusable CES Policies.

---

## 20. Organizational ISO Controls Are Outside CES Policies

CES Policies focuses on software-system engineering.

Examples outside the CES Policy software scope:

```text
employee screening
security awareness training
physical office access
HR termination procedures
supplier contracting process
organizational governance activities
```

CES may eventually identify such areas as:

```text
Relevant to certification
but outside CES software scope.
```

CES must not attempt to become a full ISMS management platform in v1.

---

## 21. Atlas -> Policies Boundary

Atlas answers:

> **What is true about this business/system?**

CES Policies answers:

> **Given those truths, what engineering obligations deserve awareness?**

Policies must not invent business facts.

Atlas should not inject ISO/security assumptions into business truth.

Runtime policy reasoning should use normalized Atlas facts, not re-read and reinterpret the raw buyer PRD as a substitute for weak Atlas extraction.

---

## 22. Policy Reasoning Runtime

After vocabulary and canonicalization are established, CES will use an agent-backed Policy Reasoner.

Conceptual flow:

```text
Atlas Facts
      +
Approved CES Canonical Vocabulary / Policies
        v
Policy Reasoning Agent
        v
Candidate Context Bindings
        v
Deterministic Validator
        v
Baseline Awareness Output
```

The reasoning agent must not reason directly against the full raw ISO / ASVS / WSTG documents during normal project runtime.

The source documents are used during knowledge construction and update review.

Runtime uses the approved CES canonical baseline.

---

## 23. Policy Reasoning Agent Boundary

The Policy Reasoning Agent may:

- determine which approved canonical concepts materially apply;
- bind them to exact Atlas facts;
- select approved concerns;
- select approved capability needs;
- explain why the Policy applies;
- describe the required outcome.

The agent must not:

- invent new project facts;
- invent new canonical Policies;
- invent new Concern IDs;
- invent new Capability IDs;
- select architecture;
- select stack;
- prescribe implementation;
- create vendor-specific recommendations.

---

## 24. Deterministic Validation Requirement

Agent reasoning output must be validated before it becomes CES Policy output.

Minimum validation direction:

```text
Policy ID must exist.

Concern IDs must exist.

Capability IDs must exist.

Every matched Atlas fact must exist.

Every activated Policy must reference at least one Atlas fact.

The agent cannot create project facts.

The agent cannot create canonical policy vocabulary.

Implementation-specific recommendations are invalid at the Policy layer.
```

This validator must be designed before relying on the Policy Reasoning Agent.

---

## 25. Agents Bridge Boundary

The Agents Bridge is execution infrastructure only.

It may own:

```text
agent routing
provider selection
runtime execution
timeouts
retry behavior
schema-validation hooks
execution metadata
```

It must not own:

```text
Policy semantics
ISO interpretation
Policy applicability
Atlas interpretation
canonical vocabulary
Context Binding rules
```

Conceptually:

```text
CES Policies
      v
PolicyReasoningRequest
      v
Agents Bridge
      v
Policy Reasoner
      v
PolicyReasoningResult
```

---

# 26. Development and Review Protocol -- FROZEN

CES Policies will be implemented using Codex and cross-checked by another reviewer.

To prevent endless feedback loops, all work must follow a bounded review contract.

---

## 26.1 Every Implementation Ticket Must Define

### Scope

What the ticket is allowed to change.

### Acceptance Contract

What must be true for the ticket to be considered complete.

### Explicit Non-Goals

What must not be demanded during review.

No coding ticket should begin without these three sections.

---

## 26.2 Review Finding Classes

Only four classes are allowed:

| Class | Meaning | Blocks Completion |
|---|---|---|
| BLOCKER | Fundamental correctness, safety, destructive, or contract failure | Yes |
| REQUIRED | Current acceptance criterion is not satisfied | Yes |
| DEFERRED | Valid issue outside current ticket scope | No |
| OPTIONAL | Preference / optimization / alternative design | No |

OPTIONAL findings should normally be suppressed.

---

## 26.3 Review Round 1 -- Discovery Review

Round 1 is the only broad review.

The reviewer may identify:

```text
BLOCKER
REQUIRED
DEFERRED
```

against:

- the frozen CES Policies context;
- current ticket scope;
- current ticket acceptance criteria.

The reviewer may not expand the ticket scope.

---

## 26.4 Review Round 2 -- Closure Review

After Codex fixes Round 1 REQUIRED/BLOCKER findings, Round 2 is not another discovery review.

Round 2 checks only:

- whether existing blocking findings were fixed;
- whether the fixes introduced regressions against previously passing acceptance criteria.

Round 2 must not introduce new preference-driven findings.

---

## 26.5 New Findings After Round 1

A new blocking finding after Round 1 is allowed only when it is:

```text
security vulnerability
data corruption / destructive behavior
compile/runtime failure
contract violation introduced by the fix
acceptance criterion previously marked PASS incorrectly
fundamental CES frozen-boundary violation
```

The following are not valid reasons to reopen review:

```text
better naming
cleaner abstraction
future extensibility
alternative schema
new useful feature
imagined future CES requirement
preference for another implementation
```

---

## 26.6 Closed Work Stays Closed

Completed tickets must not be casually reopened because later work reveals a useful enhancement.

Create a new ticket instead.

Example:

```text
P02 Source Glossary Model
CLOSED

Later discovered:
SourceRelease would benefit from checksum.

-> Create new ticket.
-> Do not reopen P02 unless the original contract was actually violated.
```

---

## 26.7 Current Abstraction Level Only

Review must evaluate only the abstraction currently being built.

Examples:

When reviewing Source Glossary:

```text
Do review:
source identity
release identity
versionability
immutability
four frozen sources
```

Do not review:

```text
Policy Reasoner
Atlas quality
UI
stack recommendations
implementation guidance
```

---

## 26.8 Architectural Decisions Are Not Review Findings

Frozen architecture decisions cannot be reopened through ordinary implementation review.

If a frozen decision needs to change, create an explicit architecture / context change proposal.

Until approved, the existing frozen decision remains authoritative.

---

## 26.9 Every Review Must End With a Terminal Result

Allowed final review states:

```text
ACCEPTED

NOT ACCEPTED
Required findings: ...

ACCEPTED WITH DEFERRED ITEMS
Deferred: ...
```

`ACCEPTED WITH DEFERRED ITEMS` means the ticket is complete and Codex proceeds.

Deferred items do not trigger another coding cycle.

---

## 26.10 Review Against Current Contract, Not Imagined Future CES

A reviewer finding that does not demonstrate violation of:

- the frozen CES Policies context;
- current ticket scope;
- current acceptance contract;

cannot prevent completion.

Future possibilities such as:

```text
SOC 2 support
500-source scalability
mobile support
AI-specific standards
multi-framework compliance
```

must not block v1 work unless they are explicitly included in the current ticket contract.

---

# 27. Frozen Decisions Summary

The following decisions are authoritative for CES Policies v1:

```text
Purpose:
Baseline engineering awareness.

Input:
Structured Atlas project facts.

Policy boundary:
WHAT must be true / handled, never HOW.

Technology decisions:
Outside CES Policy scope.

Architecture decisions:
Outside CES Policy scope.

Business rules:
Remain Atlas/business truth.

Concerns:
Not automatically Policies.

Capability needs:
May be exposed before architecture.

Context Binding:
Mandatory for activated Policies.

Policy explanation:
Must reference concrete project facts.

Core Source Glossary v1:
- ISO/IEC 27001
- ISO/IEC 27002
- OWASP ASVS
- OWASP WSTG

Source governance:
Versioned and update-checkable.

Source updates:
Never silently mutate published baselines.

Runtime reasoning:
Uses approved CES canonical knowledge + Atlas facts.

Raw external source documents:
Not interpreted independently on every project run.

Agents Bridge:
Execution infrastructure only.

Implementation review:
Contract-bound and finite.
```

---

# 28. Explicitly Not Frozen Yet

The following remain open and must not be treated as decided requirements unless a later ticket freezes them:

```text
Exact CES canonical Policy taxonomy

Exact Policy IDs and names

Exact Policy schema

Exact raw Source Vocabulary schema

Exact CES Canonical Vocabulary schema

Exact Concern taxonomy

Exact Capability Need taxonomy

Exact applicability rules

Exact Context Binding schema

Exact source-to-policy mappings

Exact Source Glossary database schema

Exact update-check implementation

Exact Policy Reasoning prompt

Exact model/provider used for reasoning

Exact human-facing UI

Exact scoring/severity model

Exact baseline release schema

Conditional source framework

Implementation-source framework
```

Discussion examples involving names such as:

```text
ACCESS_CONTROL
INFORMATION_PROTECTION
INFORMATION_INTEGRITY
INFORMATION_LIFECYCLE
ACCOUNTABILITY_TRACEABILITY
AVAILABILITY_RECOVERABILITY
SECURE_PROCESSING
DEPENDENCY_TRUST
PRIVACY_DATA_HANDLING
OPERATIONAL_OBSERVABILITY
```

are **candidate vocabulary only** and are not frozen CES v1 Policies.

---

# 29. Approved Work Sequence

The intended CES Policies implementation sequence is:

```text
P01  Freeze Policy Charter
P02  Source Glossary Model
P03  Seed Four Core Source Families / Releases
P04  Source Update Detection
P05  Raw Source Vocabulary Model
P06  Raw Vocabulary Extraction
P07  CES Canonical Vocabulary
P08  Canonical Policy Taxonomy
P09  Policy Contract
P10  Atlas Fact Input Contract
P11  Context Binding Contract
P12  Deterministic Validator
P13  Policy Reasoning Agent
P14  Agents Bridge Integration
P15  Developer Baseline Awareness Output
P16  Cross-Domain Validation
P17  CES Policy Baseline v1 Freeze
```

The sequence may be split into smaller tickets, but later phases must not be pulled into earlier tickets without an explicit scope change.

The Policy Reasoning Agent must not become the de facto policy model because earlier knowledge contracts were skipped.

---

# 30. Immediate Next Work

The next implementation area is:

> **Source Glossary foundation followed by raw Source Vocabulary extraction.**

Do not seed a large final Policy registry yet.

First establish:

```text
four frozen sources
        v
versioned source records
        v
raw source vocabulary
        v
semantic classification
        v
normalization
        v
canonical CES vocabulary
```

The final Policy taxonomy should emerge from that work rather than being invented upfront.

---

# 31. Governing Rules

These rules take precedence over convenience during implementation.

> **Rule 1 -- A CES Policy must increase awareness without prematurely making an implementation decision.**

> **Rule 2 -- Every activated CES Policy must be explainable through concrete Atlas project facts.**

> **Rule 3 -- External standards provide authority and vocabulary; they do not directly become the CES internal schema.**

> **Rule 4 -- Source updates are detected and reviewed; they never silently change published baselines.**

> **Rule 5 -- A reviewer finding that does not demonstrate violation of the current frozen context or ticket acceptance contract cannot prevent completion.**

> **Rule 6 -- Every CES Policies implementation phase must reduce ambiguity rather than merely add more text or more rules.**

---

**End of frozen CES Policies v1 context.**

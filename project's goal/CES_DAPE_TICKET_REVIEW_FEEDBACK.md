# CES DAPE Ticket Review and Required Corrections

**Repository:** `adityaa11/ces-platform`  
**Branch:** `worker1`  
**Reviewed commit:** `3f6367c`  
**Document purpose:** Provide one complete implementation-correction guide for Codex so the Dynamic Atlas and Policy Evolution work can proceed without repeated clarification loops.

---

## 1. Executive Decision

The architecture direction introduced in commit `3f6367c` is approved.

The tickets correctly move CES toward:

```text
Natural-language business source
→ complete Atlas source inventory
→ domain-open semantic candidates
→ deterministic coverage gate
→ human-approved project model
→ shared downstream traceability
→ extensible policy packs
→ governed policy research and evolution
→ Architect, Assurance, Forge, and Verification
```

However, the current ticket set is **not yet safe for full sequential implementation**.

Implementation may begin with deterministic Atlas source modeling after the blocking corrections in this document are applied.

### Overall status

| Area | Status |
|---|---|
| Architecture direction | Approved |
| Atlas-first priority | Approved |
| Source coverage concept | Approved |
| Approved Project Model concept | Approved |
| Policy-pack and governance direction | Approved |
| Current dependency graph | Requires correction |
| Safara semantic oracle | Must be defined earlier |
| Agent research mechanism | Incomplete |
| Full DAPE implementation readiness | Not yet approved |
| DAPE-001 implementation readiness | Approved after dependency correction |

---

## 2. Non-Negotiable Product Goal

The first priority is not merely to produce a larger graph.

The first priority is:

> **CES Atlas must preserve and expose every business-relevant statement from a source PRD, detect omissions and unsupported interpretations, and prevent publication of an incomplete approved project model.**

For the Safara PRD, Atlas must preserve all relevant content across:

- business context;
- business objectives;
- roles and responsibilities;
- workflows;
- functional requirements;
- permissions;
- business rules;
- validations;
- calculations;
- state models;
- data requirements;
- reports;
- exports;
- historical-retention rules;
- acceptance scenarios;
- deliverables;
- acceptance criteria.

The high-level graph may remain concise, but the underlying semantic model and coverage report must be complete.

---

## 3. Broad CES Lifecycle to Preserve

The DAPE work must refine Atlas without replacing the existing deterministic kernel.

```text
Source Documents
        ↓
CES Atlas
        ↓
Approved Project Model
        ↓
┌─────────────────────────────────────────────────────┐
│ Shared approved business truth                      │
│                                                     │
│ Requirements                                        │
│ Business rules                                      │
│ Permissions                                         │
│ Validations                                         │
│ Calculations                                        │
│ State models                                        │
│ Acceptance criteria                                 │
│ Domain concepts                                     │
│ Source provenance                                   │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼─────────────┐
          │            │             │
          ▼            ▼             ▼
   CES Architect   CES Core     CES Assurance
          │            │             │
          │      Policy Manifest     │
          │            │             │
          └────────────┼─────────────┘
                       ▼
                   CES Forge
                       ↓
          Developer or coding agent
                       ↓
              CES Verification
                       ↓
            Assurance status update
```

### Boundary rules

- Atlas owns approved business truth.
- Architect derives architecture characteristics but cannot modify business truth.
- The deterministic core resolves capabilities and policies but cannot rewrite business rules.
- Assurance renders obligations and evidence status but cannot invent verification evidence.
- Forge generates implementation contracts but cannot alter requirements or policies.
- Verification records observed results against the same approved model revision.
- Agents may propose changes, but cannot approve their own output or mutate stable registries.

---

## 4. Immediate Blocking Corrections

## 4.1 Integrate DAPE into the authoritative greenfield roadmap

### Problem

The new DAPE plan says Atlas completeness must be completed first, but the existing greenfield roadmap may still allow Architect implementation immediately after the older Atlas tickets.

This creates two conflicting implementation sequences.

### Required change

Update the authoritative greenfield roadmap and repository status documentation.

Recommended files:

```text
project's goal/tickets/greenfield/README.md
README.md
project's goal/tickets/greenfield/dynamic-atlas-policy-evolution/README.md
```

### Required roadmap rule

```text
DAPE-001 through DAPE-008
must be completed before Architect implementation begins.
```

At minimum, Architect must depend on:

```text
CES-GF-DAPE-008
```

or a named gate:

```text
ATLAS_DYNAMIC_COMPLETENESS_GATE
```

### Recommended wording

```markdown
## Dynamic Atlas completeness gate

Atlas candidate extraction is not considered complete until DAPE-001 through
DAPE-008 prove domain-faithful extraction, deterministic source coverage,
human correction of omissions, and publication of a coverage-complete
Approved Project Model.

Architect implementation is blocked until this gate is accepted.
```

---

## 4.2 Remove the unnecessary AGB-005 dependency from DAPE-001

### Problem

DAPE-001 is deterministic source segmentation and source identity work. It should not depend on production deployment of the Agents Bridge.

Blocking DAPE-001 on AGB-005 delays the highest-priority correction for an unrelated reason.

### Correct dependency

```text
DAPE-001 depends on:
- the accepted Atlas ingestion baseline;
- PDF/Markdown normalization contracts required by the source model.
```

Recommended dependency:

```text
CES-GF-ATLAS-005
```

### Agent dependency should begin later

The first DAPE ticket that genuinely requires the Agents Bridge is the bounded-agent orchestration ticket.

Recommended:

```text
DAPE-004 depends on:
- DAPE-003
- AGB-004
```

Use AGB-005 only for deployed production-agent evidence, not for deterministic or fixture-backed implementation.

---

## 4.3 Separate deterministic document structure from agent interpretation

### Problem

The current plan can be interpreted as allowing a document-structure agent to control document sections or source-unit identity.

This would make provenance non-deterministic.

### Required separation

#### Deterministic artifacts

```text
document-revision.json
document-structure.json
section-index.json
source-units.json
```

The deterministic layer owns:

- source bytes or normalized source revision;
- page numbers;
- line ranges;
- headings;
- paragraphs;
- bullets;
- numbered items;
- table rows;
- source-unit identity;
- source text;
- content hashes;
- structural parent-child relationships.

#### Agent-proposed artifacts

```text
document-structure-analysis.candidate.json
section-classifications.candidate.json
requirement-bearing-ranges.candidate.json
```

The agent may propose:

- business-context classification;
- role section;
- functional-requirement section;
- business-rule section;
- acceptance section;
- deliverable section;
- likely normative ranges;
- likely duplicates or references.

### Rule

> An agent must never create, modify, reorder, merge, or replace source-unit identity or source text.

---

## 4.4 Define the Safara semantic oracle before implementing the extraction pipeline

### Problem

The golden Safara regression appears near the end of the P0 sequence.

If the expected result is not defined first, Codex may implement DAPE-001 through DAPE-007 using weak fixtures and only discover contract problems at DAPE-008.

### Required correction

Create the reviewed Safara expected inventory before or alongside DAPE-001.

This can be:

```text
CES-GF-DAPE-000
```

or a split of DAPE-008:

```text
DAPE-008A — Safara fixture and expected semantic inventory
DAPE-008B — End-to-end golden regression and staged CLI
```

### Minimum explicit Safara oracle

The source contains at least:

| Category | Minimum expected inventory |
|---|---:|
| Numbered functional areas | 9 |
| Business roles | 3 |
| Explicit main business rules | 10 |
| Inspection scenarios | 12 |
| Deliverables | 9 |
| Acceptance criteria | 10 |

These are minimum checkpoints, not the total semantic-record count.

The detailed sections contain additional normative statements that must also be inventoried, including:

- fields;
- statuses;
- formulas;
- duplicate restrictions;
- authorization rules;
- history-preservation rules;
- report filters;
- export formats;
- readiness dependencies;
- finalization behavior.

### Required fixture structure

```text
fixtures/safara/
├── source.pdf
├── normalized-source.md
├── expected-document-structure.json
├── expected-source-units.json
├── expected-domain-concepts.json
├── expected-semantic-records.json
├── expected-business-rule-inventory.json
├── expected-coverage-map.json
├── expected-review-decisions.json
└── expected-approved-project-model.json
```

### Golden test rule

The test must verify concrete semantic identities and coverage, not only broad category presence.

Weak assertion:

```text
A business rule exists.
```

Required assertion:

```text
BR-REGISTRATION-QUOTA exists,
cites the correct source units,
preserves the correct constraint,
and appears as covered in the source coverage map.
```

---

## 5. Required Atlas Architecture

## 5.1 Required internal pipeline

```text
PDF / Markdown
        ↓
Deterministic ingestion and normalization
        ↓
Deterministic source-unit inventory
        ↓
Project-scoped domain-concept discovery
        ↓
Bounded section extraction
        ↓
Deterministic merge and provenance validation
        ↓
Independent coverage criticism
        ↓
Deterministic coverage and precision gate
        ↓
Targeted retry for uncovered or distorted units
        ↓
Human review and correction
        ↓
Approved Project Model
        ↓
Downstream CES products
```

---

## 5.2 Source-unit contract

Every source unit should have at least:

```typescript
interface SourceUnit {
  sourceUnitId: string;
  documentId: string;
  documentRevisionId: string;

  kind:
    | "heading"
    | "paragraph"
    | "bullet"
    | "numbered_item"
    | "table_row"
    | "caption"
    | "other";

  text: string;

  location: {
    pageStart?: number;
    pageEnd?: number;
    lineStart?: number;
    lineEnd?: number;
    sectionPath: string[];
  };

  parentSourceUnitId?: string;
  order: number;
  contentHash: string;
}
```

### Source-unit requirements

- Stable for the same normalized source revision.
- Independent from model output.
- Sufficiently atomic to support one-to-many and many-to-one semantic mappings.
- Preserves original source text.
- Supports page and section provenance.
- Does not silently merge unrelated bullets.

---

## 5.3 Project-scoped domain concepts

Atlas must not require domain terms to exist in global TypeScript enums.

Example Safara concepts:

```text
owner_admin
finance
operations
pilgrim
umrah_package
departure_schedule
registration
payment
pilgrim_document
passport
visa
insurance
ticket
manifest
pilgrim_readiness
```

Recommended contract:

```typescript
interface DomainConcept {
  conceptId: string;
  projectId: string;
  revisionId: string;

  kind:
    | "actor"
    | "entity"
    | "field"
    | "state"
    | "action"
    | "event"
    | "calculation"
    | "report"
    | "other";

  preferredLabel: string;
  sourceLabels: string[];
  parentConceptId?: string;

  status:
    | "candidate"
    | "confirmed"
    | "rejected"
    | "superseded";

  sourceUnitIds: string[];
}
```

### Lexicon consistency rule

All section extractions in one run must use the same pinned:

```text
source-unit revision
domain-lexicon revision
semantic-schema version
prompt-contract version
```

New concepts discovered during extraction must enter a proposal queue. They must not silently create conflicting identities across section outputs.

---

## 5.4 Domain-open semantic records

Do not model every requirement only as:

```text
actor + action + resource
```

Use a discriminated semantic-record union.

Minimum P0 kinds:

```text
functional_requirement
business_rule
permission_rule
validation_rule
calculation_rule
state_model
workflow_rule
data_requirement
report_requirement
acceptance_criterion
deliverable
nonfunctional_requirement
```

Example base contract:

```typescript
interface SemanticRecordBase {
  semanticRecordId: string;
  logicalId: string;
  revision: number;

  kind: string;
  title: string;
  statement: string;

  sourceUnitIds: string[];
  domainConceptIds: string[];

  origin:
    | "explicit"
    | "inferred"
    | "confirmed"
    | "derived";

  reviewStatus:
    | "needs_confirmation"
    | "approved"
    | "rejected"
    | "superseded";

  confidence?: number;
  contentHash: string;
}
```

### Example: validation rule

```json
{
  "kind": "validation_rule",
  "semantic_record_id": "VAL-PILGRIM-NIK-001",
  "target_concept_id": "pilgrim.nik",
  "condition": {
    "operator": "when_present"
  },
  "constraint": {
    "type": "exact_length",
    "value": 16,
    "character_set": "digits"
  }
}
```

### Example: calculation rule

```json
{
  "kind": "calculation_rule",
  "semantic_record_id": "CALC-PAYMENT-BALANCE-001",
  "result_concept_id": "registration.outstanding_balance",
  "expression": {
    "operator": "subtract",
    "operands": [
      "registration.total_invoice",
      "registration.total_accepted_payments"
    ]
  }
}
```

### Example: permission rule

```json
{
  "kind": "permission_rule",
  "semantic_record_id": "PERM-FINANCE-PAYMENT-001",
  "actor_concept_id": "finance",
  "action_concept_ids": [
    "view",
    "record",
    "review",
    "accept",
    "reject"
  ],
  "resource_concept_id": "payment"
}
```

### Example: state model

```json
{
  "kind": "state_model",
  "semantic_record_id": "STATE-PAYMENT-001",
  "concept_id": "payment",
  "states": [
    "pending_review",
    "accepted",
    "rejected"
  ],
  "transitions": [
    {
      "from": "pending_review",
      "to": "accepted",
      "authorized_actor_ids": ["finance"]
    },
    {
      "from": "pending_review",
      "to": "rejected",
      "authorized_actor_ids": ["finance"],
      "required_fields": ["rejection_reason"]
    }
  ]
}
```

---

## 6. Bounded Agent Roles

Do not implement one super-agent.

Use bounded roles behind the provider-neutral agent boundary.

## 6.1 Structure-classification agent

Input:

```text
deterministic document structure
deterministic source units
```

Output:

```text
candidate section classifications
candidate normative ranges
candidate document taxonomy
```

It does not modify source structure.

---

## 6.2 Domain-discovery agent

Input:

```text
source units
candidate section classifications
existing project lexicon revision
```

Output:

```text
candidate domain concepts
synonym proposals
concept relationships
uncertainties
```

---

## 6.3 Section-extraction agent

Runs per bounded section.

Input:

```text
section source units
global document context summary
pinned domain lexicon
semantic-record schema
existing approved terminology
```

Output:

```text
semantic candidates
candidate relationships
uncertainties
conflicts
candidate lexicon additions
```

---

## 6.4 Coverage-critic agent

Input:

```text
all source units
all semantic candidates
coverage map
```

Output:

```text
uncovered normative units
over-combined records
distorted interpretations
unsupported candidate facts
incorrect context-only classifications
duplicate records
targeted retry requests
```

---

## 6.5 Mapping and policy-gap advisor

This role belongs after Atlas approval.

Input:

```text
approved project model
existing capability registry
existing trait registry
existing policy packs
```

Output:

```text
mapping proposals
partial coverage
implementation-only dispositions
policy gaps
capability gaps
clarification requirements
```

It must not publish registry changes.

---

## 7. Coverage and Precision Gate

Completeness cannot be based on an agent saying that the extraction is complete.

Every source unit must receive a disposition.

```text
covered
context_only
duplicate
uncertain
conflicting
excluded_with_reason
uncovered
```

Example:

```json
{
  "source_unit_id": "SRC-SAFARA-P6-008",
  "normative": true,
  "disposition": "covered",
  "semantic_record_ids": [
    "BR-READINESS-ALL-BLOCKERS"
  ]
}
```

### Blocking condition

```text
Any normative source unit with:
- no disposition;
- uncovered disposition;
- invalid source mapping;
- unresolved high-impact distortion;
blocks Approved Project Model publication.
```

### Precision requirements

Add explicit anti-hallucination acceptance criteria:

- Every explicit semantic record must be entailed by its cited source units.
- Inferred records must be marked inferred and require explicit approval.
- A candidate cannot cite unrelated text merely to satisfy provenance.
- Unsupported facts must be rejected or converted into uncertainty.
- Broad fabricated records cannot be used to claim source coverage.
- Coverage must not be completed by attaching all source units to one generic requirement.
- One semantic record may cite multiple units only when the combined meaning is justified.
- One source unit may map to multiple semantic records when it contains multiple obligations.

### Recommended coverage output

```json
{
  "source_units": 150,
  "normative_source_units": 92,
  "covered_normative_units": 92,
  "uncovered_normative_units": 0,
  "unsupported_candidate_records": 0,
  "distorted_candidate_records": 0,
  "coverage_status": "complete",
  "precision_status": "accepted"
}
```

---

## 8. Targeted Retry Rules

Do not rerun the entire document after every omission.

Retry only:

```text
uncovered source units
distorted source-unit mappings
uncertain high-impact requirements
conflicting candidate groups
sections with inconsistent terminology
```

A targeted retry request should include:

```json
{
  "retry_id": "RETRY-READINESS-001",
  "reason": "uncovered_normative_source_unit",
  "source_unit_ids": [
    "SRC-SAFARA-P5-012",
    "SRC-SAFARA-P5-013"
  ],
  "existing_candidate_ids": [],
  "pinned_lexicon_revision": "LEXICON-REV-002",
  "semantic_schema_version": "1.0.0",
  "prompt_contract_version": "1.0.0"
}
```

Retries must preserve accepted candidates unless the retry explicitly identifies a conflict or distortion requiring revision.

---

## 9. Human Review Requirements

The reviewer must see more than extracted candidates.

Required review views:

```text
candidate semantic records
source text and location
coverage by section
uncovered source units
uncertainties
conflicts
lexicon proposals
duplicate proposals
mapping gaps
```

The reviewer must be able to:

- approve a candidate;
- reject a candidate;
- correct a candidate;
- merge duplicates;
- split an over-combined candidate;
- create a missing semantic record from uncovered source text;
- confirm or reject a domain concept;
- resolve uncertainty;
- record a clarification answer;
- mark a source unit as context-only with a reason.

### Publication rule

An incomplete review cannot emit an approved project model.

---

## 10. Approved Project Model

The approved model is the canonical business truth for all downstream CES products.

It should contain at least:

```typescript
interface ApprovedProjectModel {
  schemaVersion: string;
  projectId: string;
  revisionId: string;
  contentHash: string;

  sourceDocuments: SourceDocumentRevision[];
  sourceUnits: SourceUnit[];
  domainConcepts: DomainConcept[];

  requirements: ApprovedSemanticRecord[];
  businessRules: ApprovedSemanticRecord[];
  permissions: ApprovedSemanticRecord[];
  validations: ApprovedSemanticRecord[];
  calculations: ApprovedSemanticRecord[];
  stateModels: ApprovedSemanticRecord[];
  workflows: ApprovedSemanticRecord[];
  dataRequirements: ApprovedSemanticRecord[];
  reportRequirements: ApprovedSemanticRecord[];
  acceptanceCriteria: ApprovedSemanticRecord[];
  deliverables: ApprovedSemanticRecord[];
  nonfunctionalRequirements: ApprovedSemanticRecord[];

  uncertainties: Uncertainty[];
  conflicts: Conflict[];
  coverageReport: CoverageReport;
  reviewRecord: ReviewRecord;
}
```

### Required properties

- Persistent logical IDs.
- Immutable revision hashes.
- Stable source references.
- Explicit approval state.
- Coverage-complete publication gate.
- Backward-compatible projections into existing `RequirementPackage` contracts.
- No downstream product may rewrite this model.

---

## 11. Shared Identity and Traceability

The same approved model revision must be consumed across all downstream products.

Every downstream artifact must record:

```text
project_id
approved_project_model_revision
approved_project_model_hash
source requirement IDs
source business-rule IDs
```

Required identity chain:

```text
Source Unit
→ Semantic Record
→ Domain Concept
→ Capability/Trait Mapping
→ Policy Obligation
→ Architecture Characteristic
→ Architecture Decision
→ Implementation Task
→ Test Obligation
→ Evidence
→ Verification Result
```

No product should reread and reinterpret the original PRD independently.

---

## 12. Correct Semantic-Disposition Contract

### Problem

A semantic record can affect multiple downstream channels simultaneously.

A singular disposition such as:

```text
mapped policy
or implementation-only
or verification-only
```

is insufficient.

### Required contract

```typescript
interface SemanticDisposition {
  semanticRecordId: string;

  mappings: {
    capabilityIds: string[];
    traitIds: string[];
    policyIds: string[];
    architectureCharacteristicIds: string[];
    implementationRequirementIds: string[];
    verificationRequirementIds: string[];
  };

  gaps: {
    capabilityGapIds: string[];
    policyGapIds: string[];
    adapterGapIds: string[];
    evidenceGapIds: string[];
  };

  notes: string[];

  terminalStatus:
    | "handled"
    | "partially_handled"
    | "blocked"
    | "not_applicable";
}
```

### Example

The quota rule may simultaneously map to:

```text
Capability:
TRANSACTIONAL_CAPACITY_ENFORCEMENT

Traits:
CAPACITY_CONSTRAINED_RESOURCE
CONCURRENT_PERSISTENT_WRITE

Policies:
CONCURRENT_WRITE_PROTECTION
BUSINESS_INVARIANT_ENFORCEMENT

Implementation:
server-side registration guard

Verification:
boundary test
quota-full rejection test
concurrency test
```

### Clarification rule

`clarification_required` should normally block approval or remain an unresolved candidate state. It should not become a normal handled downstream disposition.

---

## 13. Registry and Policy Architecture

## 13.1 Current policies become the first pack

The existing policies remain valid:

```text
INPUT_VALIDATION
RESOURCE_LEVEL_AUTHORIZATION
FILE_SIZE_LIMIT
FILE_MEDIA_TYPE_ALLOWLIST
FILE_CONTENT_VERIFICATION
SERVER_GENERATED_STORAGE_KEY
SAFE_IMAGE_DELIVERY
ATOMIC_RESOURCE_REPLACEMENT
REPLACED_RESOURCE_LIFECYCLE
SAFE_LOGGING
```

Move them into a versioned initial pack, for example:

```text
policy-packs/
└── web-file-handling/
    └── 1.0.0/
        ├── pack.yaml
        ├── policies.yaml
        ├── triggers.yaml
        ├── dependencies.yaml
        ├── evidence.yaml
        └── verification.yaml
```

They must no longer represent the complete CES policy universe.

---

## 13.2 Extensible registry identities

Replace closed TypeScript enums with syntactically validated registry IDs.

Example:

```typescript
const RegistryIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_]*$/u);
```

Validation then occurs against the pinned loaded registry.

This applies to:

```text
policy IDs
capability IDs
trait IDs
evidence IDs
verification-method IDs
```

Backward-compatible constants may remain for current fixtures.

---

## 13.3 Policy packs

Recommended initial pack families:

```text
core
identity-and-access
data-protection
validation-and-integrity
transactional-integrity
workflow-and-state
auditability
file-handling
reliability
integration
verification
organization-standard
```

Project lock example:

```yaml
policy_packs:
  - id: core
    version: 1.0.0
    content_hash: sha256:...

  - id: transactional-integrity
    version: 1.0.0
    content_hash: sha256:...

  - id: workflow-and-state
    version: 1.0.0
    content_hash: sha256:...
```

Every run must pin:

```text
pack ID
version
content hash
dependency versions
composition order
```

---

## 13.4 Reorder DAPE-011, DAPE-012, and DAPE-013

### Problem

Project-level policy compilation currently appears before the final registry-composition and extensible-identity contracts.

This risks immediate rework or duplicate lock implementation.

### Preferred order

```text
DAPE-010 — semantic mapping and dispositions
DAPE-012 — policy-pack composition and locks
DAPE-013 — extensible registry identities and trigger contracts
DAPE-011 — project-level policy compilation
```

The project compiler should be implemented once against the intended registry model.

### Alternative

If reordering is not accepted, DAPE-011 must explicitly remain limited to the existing single-registry version/hash contracts, with multi-pack composition deferred to DAPE-012 and DAPE-013.

The preferred decision is still to reorder.

---

## 14. Policy Evolution Loop

When an approved business rule is not adequately governed by existing policies:

```text
Approved semantic record
→ policy coverage analysis
→ inspect existing policy definitions
→ inspect triggers and evidence guidance
→ research authoritative standards
→ propose smallest justified change
→ human governance review
→ immutable registry release
→ impact analysis
→ explicit project upgrade
```

### Required outcomes

The analyzer must support:

```text
existing policy fully covers the need
existing policy exists but trigger is missing
existing policy exists but parameters are incomplete
existing policy exists but evidence guidance is incomplete
existing policy requires compatible clarification
existing policy requires a breaking revision
two existing policies should be merged
new policy is justified
implementation-only behavior
architecture-only impact
verification-only impact
clarification required
not applicable
```

The default action must not be “create a new policy.”

---

## 15. Controlled Standards Research

### Problem

A normal LLM prompt is not a reliable standards-research mechanism.

### Required controlled mechanism

Choose one or support both.

### Option A — Controlled online retrieval

```text
Standards Research Agent
→ allowlisted standards catalog
→ controlled HTTPS retrieval
→ immutable source snapshot
→ version/hash extraction
→ semantic comparison
→ proposal
```

Requirements:

- organization/domain allowlist;
- version-qualified documents;
- no arbitrary caller-provided URLs;
- retrieval timestamp;
- document version;
- source hash;
- stored citation metadata;
- deterministic offline fixtures for CI;
- licensing and quotation constraints respected;
- proposal review before registry publication.

### Option B — Curated offline standards corpus

```text
Pinned standards corpus
→ indexed controls
→ semantic retrieval
→ comparison
→ proposal
```

This gives stronger reproducibility but requires curated corpus maintenance.

### Required research output

```yaml
research_id: STANDARDS-RESEARCH-001
status: completed

business_rule_ids:
  - BR-MANIFEST-SNAPSHOT-001

existing_policy_analysis:
  - policy_id: ATOMIC_RESOURCE_REPLACEMENT
    coverage: partial
    missing_semantics:
      - finalized_snapshot_immutability
      - historical_revision_identity

references:
  - organization: authoritative-organization
    document: versioned-standard-name
    version: pinned-version
    section_or_control_id: version-qualified-id
    retrieval_date: YYYY-MM-DD
    content_hash: sha256:...
    relationship: supports

recommendation:
  action: create_policy
  proposed_policy_id: IMMUTABLE_FINALIZED_SNAPSHOT
```

### Governance rule

The agent may research and propose. It cannot approve, publish, weaken, or delete a stable policy.

---

## 16. Policy Versioning and Governance

Approved registry versions are immutable.

### Versioning guidance

#### Patch

- spelling corrections;
- metadata repair;
- non-semantic clarification;
- source-reference repair.

#### Minor

- additive policy;
- additive trigger;
- optional parameter;
- additive standards mapping;
- additive evidence guidance that preserves existing meaning.

#### Major

- changed policy meaning;
- new mandatory parameter;
- changed dependency or conflict behavior;
- stronger obligation that invalidates previous implementations;
- policy merge;
- policy replacement;
- removal or weakening.

### Weakening rule

Weakening, removing, or narrowing a policy requires:

```text
elevated human review
explicit justification
impact analysis
migration plan
recorded decision
```

An external standard not requiring a control is not sufficient reason to remove a stronger internal CES standard.

---

## 17. Registry Impact Analysis

After a new pack version is approved, CES must calculate:

```text
affected projects
changed Policy Manifests
new or removed obligations
adapter gaps
Forge task changes
test obligation changes
stale evidence
verification reruns
architecture revisit conditions
```

Example:

```yaml
registry_upgrade:
  from: transactional-integrity@1.0.0
  to: transactional-integrity@1.1.0

impact:
  added_policies:
    - IMMUTABLE_FINALIZED_SNAPSHOT

  affected_business_rules:
    - BR-MANIFEST-SNAPSHOT-001

  adapter_gaps:
    - adapter_id: laravel
      policy_id: IMMUTABLE_FINALIZED_SNAPSHOT

  new_verification_requirements:
    - finalized contents remain unchanged
    - later source edits do not mutate the final snapshot
    - actor and finalization timestamp remain recorded
```

Projects must upgrade explicitly. No stable project lock may update silently.

---

## 18. Split DAPE-016

### Problem

A single downstream-adaptation ticket covering Architect, Assurance, Forge, Verification, graph projections, policy evolution, and registry upgrades is too broad and too late.

### Required split

## DAPE-016A — Early shared-model adoption

Dependency:

```text
DAPE-009 or DAPE-011
```

Scope:

- Architect consumes `ApprovedProjectModel`.
- Core compilation uses reviewed semantic mappings.
- Assurance traces approved semantic IDs.
- Forge receives business semantic records.
- Verification records the approved model revision.
- Graph projections use the canonical shared identities.

## DAPE-016B — Policy-evolution operationalization

Dependency:

```text
DAPE-015
```

Scope:

- registry-upgrade views;
- semantic policy diffs;
- stale evidence;
- adapter impact;
- task regeneration impact;
- architecture revisit conditions;
- project migration guidance.

This avoids blocking Architect on the complete policy-governance sequence.

---

## 19. Revised Delivery Order

```text
Preparation
0. Safara expected semantic inventory and failing golden fixture

Atlas completeness
1. Deterministic source units and mechanical document structure
2. Project-scoped domain concepts and lexicon
3. Domain-open semantic-record contracts
4. Bounded Atlas agent roles and merge orchestration
5. Coverage critic, precision checks, and targeted retries
6. Coverage-aware human review
7. Approved Project Model and legacy projections
8. End-to-end Safara regression and staged CLI

Shared lifecycle
9. Shared identity and traceability
10. Multi-channel semantic mappings and gap dispositions

Registry and deterministic core
11. Policy-pack composition and lock contracts
12. Extensible registry identities and trigger conditions
13. Project-level policy compilation

Early downstream adoption
14. Architect, Assurance, Forge, and Verification adopt Approved Project Model

Policy evolution
15. Controlled standards retrieval and policy-gap analysis
16. Registry governance, immutable publication, and impact analysis

Policy-evolution downstream operations
17. Registry upgrade, stale evidence, adapter impact, task impact, and migration views
```

If existing ticket numbers must be preserved, update their dependencies and split DAPE-016 into `DAPE-016A` and `DAPE-016B`.

---

## 20. Ticket-by-Ticket Required Corrections

| Ticket | Status | Required correction |
|---|---|---|
| DAPE-001 | Ready after correction | Remove AGB-005 dependency. Own only deterministic source structure and identity. |
| DAPE-002 | Approved with clarification | Project-scoped lexicon; pin lexicon revision; deterministic synonym merge rules. |
| DAPE-003 | Approved with expansion | Use semantic union; define explicit kinds, relationships, compatibility projections, and negative tests. |
| DAPE-004 | Approved with correction | Agent only classifies deterministic structure; all sections use the same pinned source/lexicon/schema/prompt revisions. |
| DAPE-005 | Approved with expansion | Add precision/hallucination gate; define targeted retry contract and retry limits. |
| DAPE-006 | Approved with expansion | Reviewer must create missing records from uncovered source units and split over-combined records. |
| DAPE-007 | Approved with clarification | Canonical immutable model; publication gate; legacy Requirement Package projections; ownership rules. |
| DAPE-008 | Must begin earlier as oracle | Split expected inventory from end-to-end validation. Verify concrete semantic IDs and counts. |
| DAPE-009 | Approved | Require the same model revision/hash across all products and artifacts. |
| DAPE-010 | Requires contract correction | Replace singular disposition with multi-channel mappings plus gaps and terminal status. |
| DAPE-011 | Reorder or narrow | Prefer after policy-pack composition and extensible IDs. |
| DAPE-012 | Approved | Define pack ownership, lock resolution, dependency order, conflicts, and hash verification. |
| DAPE-013 | Approved with compatibility requirement | Replace closed enums while preserving existing fixture behavior and public contracts. |
| DAPE-014 | Incomplete | Add controlled retrieval or curated standards corpus; normal LLM prompting is insufficient. |
| DAPE-015 | Too broad | Define governance roles, immutable publication, semantic diff, migration, and impact as explicit sub-deliverables. |
| DAPE-016 | Must split | Separate early shared-model adoption from later registry-evolution operationalization. |

---

## 21. Standard Ticket Template for Codex

Every DAPE ticket should contain these sections.

```markdown
## Objective

## Business and architectural reason

## Dependencies

## Inputs

## Outputs

## Contract changes

## Package ownership

## Deterministic responsibilities

## Agent responsibilities

## Failure statuses

## Exit codes

## Backward-compatibility requirements

## Required fixtures

## Unit tests

## Integration tests

## Negative tests

## Completion evidence

## Explicit non-goals
```

### Common completion evidence

Each ticket should identify:

- exact files changed;
- exact packages added;
- schemas and versions;
- CLI commands;
- test commands;
- fixture paths;
- expected generated artifacts;
- expected failure artifacts;
- backward-compatibility evidence;
- deterministic rerun evidence.

---

## 22. Required Failure Statuses

Atlas should distinguish at least:

```text
success
incomplete_coverage
unsupported_candidate
review_required
clarification_required
conflict
provider_error
input_error
execution_error
```

Later mapping and policy stages should add:

```text
mapping_gap
policy_gap
capability_gap
adapter_gap
registry_lock_error
registry_conflict
upgrade_required
```

Do not collapse these into a generic failure.

Recommended Atlas publication rule:

```text
success
only when:
- source coverage is complete;
- unsupported candidate count is zero;
- all blocking uncertainties are resolved;
- review is approved;
- artifact publication is atomic.
```

---

## 23. Required Regression Tests

## 23.1 Deterministic tests

- Same normalized source produces identical source units.
- Same approved inputs produce identical approved project model.
- Stable sorting and normalized newlines.
- Source hashes and IDs remain stable.
- No agent metadata enters deterministic approved artifacts unless explicitly part of audit metadata.
- Atomic output replacement prevents stale artifacts.

## 23.2 Semantic recall tests

- All Safara primary business rules exist.
- All numbered requirement areas have semantic coverage.
- All roles exist.
- All acceptance criteria exist.
- All deliverables exist.
- All inspection scenarios are classified.

## 23.3 Semantic precision tests

- No unsupported policy or requirement is invented.
- Inferences are marked.
- Incorrect source citations fail.
- Generic requirements cannot absorb unrelated source units.
- Conflicting source statements remain conflicts.

## 23.4 Review tests

- Reviewer can add a missing record.
- Reviewer can split an over-combined record.
- Reviewer can merge duplicates.
- Publication fails while a normative source unit remains uncovered.
- Publication succeeds after approved correction.

## 23.5 Downstream traceability tests

- Architect output cites approved semantic IDs.
- Policy obligations cite source business rules.
- Forge tasks cite business rules and policies.
- Verification results cite tests and approved model revision.
- Assurance shows the complete chain.

## 23.6 Policy governance tests

- Unknown policy IDs fail against the pinned registry.
- New approved pack version does not mutate the old version.
- Policy proposal cannot publish without approval.
- Weakening requires elevated review.
- Registry upgrade impact identifies stale evidence.
- Offline CI uses deterministic standards-research fixtures.

---

## 24. Explicit Non-Goals for the P0 Atlas Correction

Do not allow Codex to expand P0 into unrelated work.

P0 does not require:

- full policy-pack marketplace;
- automatic registry publication;
- production standards research;
- Architect scoring changes;
- scaffold generation;
- web visualization;
- brownfield reconstruction;
- automatic certification;
- every external standards pack;
- universal domain ontology.

P0 ends when Safara proves:

```text
complete source inventory
+ domain-faithful semantic records
+ omission detection
+ unsupported-output detection
+ human correction
+ approved canonical model
+ deterministic publication
```

---

## 25. Implementation Authorization

### Work that may begin immediately after documentation correction

```text
DAPE-001:
- source-document revision schema;
- source-unit schema;
- deterministic segmenter;
- stable source-unit identity;
- page/line/section provenance;
- mechanical document structure;
- source preservation tests;
- Safara source-unit regression.
```

### Work that must not begin yet

Do not begin:

- bounded agent extraction;
- project policy compilation;
- standards research;
- registry publication;
- full downstream adaptation;

until their prerequisite contracts and corrected dependencies are accepted.

---

## 26. Final Codex Instruction

Codex should treat this document as the controlling correction to commit `3f6367c`.

Implementation priorities:

```text
1. Make Atlas complete and verifiable.
2. Preserve domain meaning in an approved shared model.
3. Prevent downstream reinterpretation.
4. Generalize capabilities, traits, and policies through versioned registries.
5. Add governed policy research and evolution only after Atlas is trustworthy.
```

The central success criterion is:

> A business rule cannot disappear because Atlas omitted it, the candidate schema could not represent it, the reviewer could not see it, the policy registry did not cover it, or a downstream product independently simplified it.

The intended final behavior is:

```text
Buyer source
→ every normative statement accounted for
→ approved project truth
→ explicit downstream mappings or gaps
→ governed policies
→ implementation contract
→ verification evidence
```

This preserves CES as a deterministic engineering-assurance platform while allowing it to understand arbitrary greenfield business domains.

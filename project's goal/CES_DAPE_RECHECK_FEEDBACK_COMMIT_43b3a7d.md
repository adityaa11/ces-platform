# CES DAPE Recheck Feedback — Commit 43b3a7d

**Repository:** `adityaa11/ces-platform`  
**Branch:** `worker1`  
**Reviewed commit:** `43b3a7d`  
**Review scope:** Dynamic Atlas and Policy Evolution ticket corrections  
**Purpose:** Provide one clear implementation review so Codex can continue without repeated clarification loops.

---

## 1. Executive Verdict

Commit `43b3a7d` is a major improvement over `3f6367c`.

The updated tickets now correctly establish:

- Atlas completeness as the first delivery priority;
- a deterministic source-unit inventory;
- domain-open semantic records;
- bounded agent roles;
- independent recall and precision checks;
- human recovery of omitted requirements;
- one canonical `ApprovedProjectModel`;
- shared identity and traceability;
- multi-channel semantic dispositions;
- versioned policy packs;
- extensible registry identities;
- controlled standards research;
- governed policy evolution;
- split downstream adoption and registry-upgrade work.

The architecture direction is approved.

However, a few remaining contract ambiguities should be corrected before the entire DAPE sequence is handed to Codex for autonomous implementation.

### Current status

| Area | Status |
|---|---|
| Overall architecture | Approved |
| Atlas-first priority | Approved |
| Roadmap dependency correction | Mostly complete |
| Safara oracle placement | Correct, but contract scope needs adjustment |
| Deterministic source model | Approved |
| Semantic-record model | Approved |
| Coverage and precision gate | Approved |
| Human review model | Approved |
| Approved Project Model | Approved with publication clarification |
| Shared downstream traceability | Approved |
| Policy-pack direction | Approved with taxonomy clarification |
| Standards research | Approved conceptually; execution ownership still unclear |
| Full autonomous Codex implementation | Not yet fully safe |
| DAPE-000 and DAPE-001 | Ready after the corrections below |

---

## 2. Corrections Successfully Applied

## 2.1 Atlas completeness now blocks Architect

The authoritative greenfield roadmap now treats DAPE-000 through DAPE-008 as the Dynamic Atlas completeness gate.

This is correct.

Architect must not begin while Atlas can still omit business rules or publish an incomplete business model.

Recommended final rule:

```text
DAPE-000
→ DAPE-001
→ DAPE-002
→ DAPE-003
→ DAPE-004
→ DAPE-005
→ DAPE-006
→ DAPE-007
→ DAPE-008
→ Architect
```

---

## 2.2 DAPE-001 is no longer blocked by AGB-005

DAPE-001 now correctly depends on the Atlas baseline and the semantic oracle rather than production deployment of the Agents Bridge.

This separates:

```text
deterministic source modeling
```

from:

```text
deployed live-agent infrastructure
```

That is the correct boundary.

---

## 2.3 Safara was moved into an early semantic oracle

The addition of DAPE-000 is correct.

Safara is now used before implementation to define the minimum expected business meaning.

The oracle correctly includes at least:

| Category | Minimum expected count |
|---|---:|
| Numbered functional areas | 9 |
| Business roles | 3 |
| Explicit primary business rules | 10 |
| Inspection scenarios | 12 |
| Deliverables | 9 |
| Acceptance criteria | 10 |

These are minimum checkpoints, not the final total number of semantic records.

---

## 2.4 Deterministic structure is separated from agent interpretation

The updated tickets correctly assign deterministic ownership to:

- document revision;
- source-unit identity;
- source text;
- page and line provenance;
- hierarchy;
- content hashes;
- ordering.

Agents may classify the source, but they cannot alter its identity or contents.

This is approved.

---

## 2.5 Semantic records are no longer limited to actor-action-resource

The updated semantic contract now supports:

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

This is necessary for Safara and for future domains.

It prevents requirements such as the following from being flattened incorrectly:

```text
NIK must contain exactly 16 digits when supplied.
```

```text
Outstanding Balance =
Total Invoice - Total Accepted Payments
```

```text
A rejected payment must contain a rejection reason.
```

```text
A finalized manifest must not change automatically.
```

---

## 2.6 Recall and precision are both included

The updated coverage ticket now addresses:

- missing requirements;
- unsupported candidates;
- distorted meaning;
- unrelated citations;
- generic catch-all records;
- false context-only classification;
- duplicate records;
- bounded targeted retry.

This is approved.

Atlas must fail for both:

```text
missing source-backed requirement
```

and:

```text
invented unsupported requirement
```

---

## 2.7 Human reviewers can recover omitted requirements

The updated review flow correctly allows reviewers to:

- create missing semantic records from source text;
- split over-combined records;
- merge duplicates;
- correct concepts;
- resolve uncertainty;
- restore source coverage.

This is necessary because reviewing only generated candidates cannot reveal requirements that the extractor never emitted.

---

## 2.8 ApprovedProjectModel is now the canonical business truth

The updated tickets correctly establish:

```text
ApprovedProjectModel
```

as the authoritative business model.

The following become projections:

```text
RequirementCollection
RequirementPackage
system-intent graph
legacy compiler handoff
```

This is the correct architecture.

---

## 2.9 Semantic dispositions are now multi-channel

The updated model correctly allows one business rule to affect several downstream areas simultaneously.

Example:

```text
Active registrations must not exceed departure quota.
```

may map to:

```text
Capabilities:
- TRANSACTIONAL_CAPACITY_ENFORCEMENT

Traits:
- CAPACITY_CONSTRAINED_RESOURCE
- CONCURRENT_PERSISTENT_WRITE

Policies:
- BUSINESS_INVARIANT_ENFORCEMENT
- CONCURRENT_WRITE_PROTECTION

Implementation:
- registration service guard

Verification:
- quota-full rejection test
- boundary test
- concurrency test
```

This is much better than forcing one exclusive disposition.

---

## 2.10 Registry work is now ordered more safely

The updated sequence now places policy-pack and registry identity work before project-level policy compilation.

This is correct.

Preferred sequence:

```text
Semantic mapping
→ policy-pack composition
→ extensible registry identities
→ project-level policy compilation
```

---

## 2.11 Standards research is now controlled

The updated tickets correctly reject ordinary LLM prompting as sufficient standards research.

They now require:

- allowlisted standards sources or a curated corpus;
- version-qualified documents;
- immutable snapshots;
- retrieval timestamps;
- hashes;
- citation metadata;
- deterministic offline fixtures;
- human review before publication.

This direction is approved.

---

## 2.12 DAPE-016 was correctly split

The previous combined downstream ticket was too broad.

Splitting it into:

```text
DAPE-016A — early shared-model adoption
DAPE-016B — policy-evolution operationalization
```

is correct.

---

# 3. Remaining P0 Corrections

## 3.1 DAPE-000 must remain contract-neutral

### Problem

DAPE-000 occurs before:

- DAPE-001 source-unit schemas;
- DAPE-002 domain-concept schemas;
- DAPE-003 semantic-record schemas;
- DAPE-007 ApprovedProjectModel schema.

However, the ticket currently risks requiring final artifacts such as:

```text
expected-source-units.json
expected-domain-concepts.json
expected-semantic-records.json
expected-approved-project-model.json
```

before the owning contracts exist.

That creates a circular dependency.

### Required correction

DAPE-000 must define a human-reviewed, contract-neutral semantic oracle.

Recommended structure:

```text
fixtures/safara/
├── source.pdf
├── normalized-source.md
├── semantic-oracle.yaml
├── expected-source-spans.yaml
├── expected-concepts.yaml
├── expected-business-rules.yaml
├── expected-acceptance-items.yaml
└── oracle-review-record.yaml
```

The oracle should use stable human-defined oracle keys.

Example:

```yaml
oracle_id: SAFARA-BR-REGISTRATION-QUOTA

source:
  page: 6
  section: Aturan Bisnis Utama
  text_contains:
    - jumlah pendaftaran aktif
    - kuota keberangkatan

expected_meaning:
  subject: active_registration
  relation: must_not_exceed
  target: departure_quota

category: business_rule
mandatory: true
```

Then each later ticket creates a projection into its own contract.

```text
DAPE-001
→ expected-source-units.json

DAPE-002
→ expected-domain-lexicon.json

DAPE-003
→ expected-semantic-records.json

DAPE-007
→ expected-approved-project-model.json
```

### Acceptance rule

DAPE-000 should prove that the expected business meaning was manually inventoried.

It should not prematurely freeze production serialization contracts.

---

## 3.2 Add a real-provider Safara validation gate

### Problem

Fixture providers prove:

```text
schema correctness
orchestration
coverage enforcement
review flow
deterministic publication
```

They do not prove that the configured real agent can correctly extract Safara.

The original problem was poor real extraction quality.

A deterministic fixture can pass even when the live provider still emits only five broad requirements.

### Required correction

Add a manual release-validation ticket:

```text
CES-GF-DAPE-008R
Real-Provider Safara Semantic Validation
```

### Required metrics

Record:

```text
explicit primary rule recall before retry
explicit primary rule recall after retry
normative source-unit coverage
unsupported-candidate count
distorted-candidate count
human-created missing records
human-corrected records
coverage critic detection rate
final approved coverage
provider/model/prompt versions
```

### Recommended release criteria

```text
Final approved normative coverage: 100%
Unsupported approved semantic records: 0
Distorted approved semantic records: 0
All 10 explicit main business rules:
- extracted directly; or
- explicitly identified as missing by the coverage process
```

A stronger product-quality target is:

```text
All 10 explicitly listed primary business rules should be extracted
before human create-from-source correction.
```

The result must honestly show whether completeness came from:

```text
agent extraction
coverage critic
targeted retry
human correction
```

Do not hide heavy manual reconstruction behind a final 100% coverage number.

---

## 3.3 Clarify the domain-lexicon lifecycle in DAPE-004

### Problem

DAPE-004 contains:

```text
domain-discovery agent
section-extraction agents
```

Section extractors require one pinned lexicon revision, but the domain lexicon is also discovered during the same analysis.

The staging must be explicit.

### Required lifecycle

```text
1. Start with seed lexicon L0.
2. Run domain discovery.
3. Deterministically merge concept proposals.
4. Publish candidate analysis lexicon L1.
5. Pin L1 for every section extractor.
6. Section extractors may propose additional concepts.
7. Those additions enter proposal queue L2.
8. L1 cannot mutate during the run.
9. A targeted retry may use reviewed and pinned L2.
```

### Important distinction

A candidate lexicon may be pinned for extraction consistency without being considered approved project truth.

Recommended states:

```text
seed
candidate_pinned
reviewed
approved
superseded
```

### Required acceptance criterion

```markdown
All section-extraction runs within one analysis use the same immutable
source-unit revision, candidate lexicon revision, semantic-schema version,
and prompt-contract version.
```

---

## 3.4 ApprovedProjectModel publication must not depend on legacy projection success

### Problem

The new canonical model may contain semantics that the legacy `RequirementPackage` contract cannot represent.

If a projection gap blocks canonical publication, the old narrow contract remains the bottleneck.

Incorrect behavior:

```text
Atlas understands calculation rule
→ RequirementPackage cannot represent it
→ ApprovedProjectModel cannot publish
```

### Required behavior

```text
Atlas completeness and review succeed
→ ApprovedProjectModel publishes

Legacy projection is incomplete
→ projection status is partial
→ old core handoff is blocked
→ canonical business truth remains preserved
```

### Required status separation

```json
{
  "approved_project_model": {
    "status": "published",
    "revision_id": "APM-REV-001"
  },
  "legacy_requirement_projection": {
    "status": "partial",
    "gaps": [
      "CALC-PAYMENT-BALANCE-001",
      "STATE-READINESS-001"
    ]
  },
  "legacy_core_handoff": {
    "status": "blocked"
  }
}
```

### Rule

> A projection gap may block a downstream consumer, but it must not block or erase approved canonical business truth.

---

# 4. Roadmap Alignment Corrections

## 4.1 ARCH-001 should consume ApprovedProjectModel directly

### Problem

The roadmap allows Architect after DAPE-008, but DAPE-016A may still be interpreted as the first ticket that adapts Architect to the canonical project model.

That creates unnecessary rework.

### Required correction

Update ARCH-001 now.

Recommended contract:

```text
Authoritative input:
ApprovedProjectModel revision from DAPE-008
```

Architect should derive characteristics from:

```text
approved requirements
approved business rules
permissions
validations
calculations
state models
nonfunctional requirements
project intent
```

It should not consume an older reduced RequirementCollection as its primary truth.

### Narrow DAPE-016A

DAPE-016A should focus on:

- cross-product revision propagation;
- shared traceability;
- core policy integration;
- Assurance consumption;
- Forge consumption;
- Verification consumption.

It should not introduce the Architect canonical input for the first time.

---

## 4.2 Align Assurance dependencies with the shared model

### Problem

Assurance may still depend on an older Atlas ticket even though the authoritative traceability chain is established later by DAPE-009 and DAPE-016A.

### Required correction

Preferred:

```text
ASR-001 depends on DAPE-009
```

or:

```text
ASR-001 may begin as contract exploration,
but cannot be accepted as implementation-complete
until DAPE-016A shared-model adoption is complete.
```

Assurance must eventually trace:

```text
source unit
→ approved semantic record
→ capability/trait mapping
→ policy obligation
→ implementation evidence
→ verification result
```

---

# 5. Policy-Pack Corrections

## 5.1 Do not permanently classify all current policies as web-file-handling

### Problem

The current ten policies include both file-specific and generic obligations.

File-specific:

```text
FILE_SIZE_LIMIT
FILE_MEDIA_TYPE_ALLOWLIST
FILE_CONTENT_VERIFICATION
SERVER_GENERATED_STORAGE_KEY
SAFE_IMAGE_DELIVERY
ATOMIC_RESOURCE_REPLACEMENT
REPLACED_RESOURCE_LIFECYCLE
```

Generic:

```text
INPUT_VALIDATION
RESOURCE_LEVEL_AUTHORIZATION
SAFE_LOGGING
```

Putting all of them permanently under:

```text
web-file-handling
```

creates the wrong ownership model.

### Preferred migration options

#### Option A — Temporary compatibility pack

```text
legacy-profile-picture-baseline@1.0.0
```

This reproduces the existing fixture exactly.

Later versions move policies into proper families with compatibility mappings.

#### Option B — Split immediately

```text
core-validation
identity-and-access
file-handling
auditability
```

A composed lock reproduces the old fixture.

### Recommended decision

Use the temporary compatibility pack first if backward-compatible migration simplicity is the priority.

Document clearly that it is not the intended final taxonomy.

---

## 5.2 Policy meaning and standards mappings must remain separate

A standards-reference update should not automatically change the core CES policy meaning.

Maintain separate versioned artifacts:

```text
policy definition
policy triggers
policy dependencies
implementation guidance
evidence requirements
verification requirements
standards mappings
```

Example:

```text
CES policy:
TRANSACTIONAL_CAPACITY_ENFORCEMENT

Standards pack:
references the policy to relevant version-qualified controls
```

A new standards-pack version may be published without changing the policy definition.

---

# 6. Controlled Standards-Research Ownership

## 6.1 Clarify the execution boundary

### Problem

DAPE-014 requires controlled retrieval, but the implementation owner is not yet explicit.

Possible owners:

```text
centralized Agents Bridge
dedicated standards-source service
deterministic local research package
```

Codex should not choose this boundary implicitly.

### Recommended split

```text
DAPE-014A
Standards Source and Retrieval Foundation

DAPE-014B
Agent-Assisted Policy Research
```

---

## 6.2 DAPE-014A responsibilities

Own:

- allowlisted source catalog;
- source metadata;
- controlled HTTPS retrieval;
- immutable snapshots;
- content hashes;
- version extraction;
- citation identifiers;
- local deterministic fixtures;
- licensing metadata;
- retrieval errors;
- cache and refresh rules.

Suggested package boundary:

```text
packages/
├── standards-source-schema
├── standards-source-catalog
├── standards-retriever
├── standards-snapshot-store
└── standards-research-fixtures
```

The retriever should not perform semantic policy analysis.

---

## 6.3 DAPE-014B responsibilities

Own:

- comparison of business-rule engineering semantics with existing policies;
- standards evidence search through the controlled retrieval contract;
- overlap analysis;
- policy revision proposals;
- new-policy proposals;
- merge/deprecation proposals;
- research uncertainty;
- citation-backed proposal bundles.

The agent must not:

- fetch arbitrary URLs;
- publish registry changes;
- approve its own proposal;
- weaken policies automatically;
- claim compliance or certification.

---

# 7. Documentation Authority Correction

### Problem

The DAPE README refers to the earlier review feedback as controlling corrections.

That feedback contains pre-43b3a7d statuses, including issues that have already been fixed.

Codex may interpret historical review findings as still-active requirements.

### Required correction

Update the earlier feedback document header:

```markdown
**Status:** Accepted corrections incorporated by commit 43b3a7d.

**Authority:** This document records historical review rationale.
The current DAPE README and ticket files are authoritative for implementation.
```

Update DAPE README wording from:

```text
under the controlling corrections in ...
```

to:

```text
incorporating the accepted corrections documented in ...
```

Current ticket contracts must be authoritative.

Historical review files should explain why changes were made, not override the updated tickets.

---

# 8. Branch-Head Verification

Before implementation starts, verify that `worker1` actually points to the reviewed commit.

Run:

```bash
git fetch origin worker1
git rev-parse origin/worker1
git log -1 --oneline origin/worker1
```

Expected result:

```text
43b3a7d
```

or a later commit containing the reviewed corrections.

Do not begin implementation from a stale local branch.

---

# 9. Revised Implementation Readiness

## 9.1 Ready after small documentation corrections

The following may proceed:

```text
DAPE-000
DAPE-001
```

Conditions:

- DAPE-000 is contract-neutral.
- The branch head is verified.
- DAPE-001 consumes the accepted semantic oracle.

---

## 9.2 Correct before DAPE-004

Clarify:

```text
candidate lexicon freeze lifecycle
real-provider Safara validation ticket
```

---

## 9.3 Correct before DAPE-007

Clarify:

```text
canonical publication independent from legacy projection success
```

---

## 9.4 Correct before Architect and Assurance implementation

Clarify:

```text
ARCH-001 consumes ApprovedProjectModel
ASR-001 depends on shared traceability
DAPE-016A ownership is narrowed
```

---

## 9.5 Correct before policy evolution

Clarify:

```text
initial compatibility pack taxonomy
standards retrieval ownership
DAPE-014A and DAPE-014B split
```

---

# 10. Required Codex Interpretation

Codex should understand the broad intent as follows:

## Atlas

```text
Atlas must extract and preserve complete business meaning.
```

It must not be limited by:

```text
static domain vocabulary
narrow actor-action-resource contracts
missing policy coverage
legacy RequirementPackage shape
```

## ApprovedProjectModel

```text
ApprovedProjectModel is the canonical business truth.
```

It publishes independently from legacy projection support.

## Architect

```text
Architect derives architecture from ApprovedProjectModel.
```

It does not reinterpret the PRD independently.

## CES Core

```text
The deterministic core maps approved semantics
into capabilities, traits, and policies.
```

It cannot rewrite approved business rules.

## Policies

```text
Policy meaning is controlled and versioned.
Policy application is dynamic and deterministic.
Policy catalogs are extensible through versioned packs.
```

## Policy Evolution

```text
Agents inspect existing policies and authoritative standards.
Agents propose changes.
Humans govern meaning.
New immutable registry versions are published.
Projects upgrade explicitly.
```

## Assurance

```text
Assurance shows the full traceability chain and evidence state.
```

## Forge

```text
Forge receives both approved business behavior and policy obligations.
```

It must not receive only a Policy Manifest because not every business requirement maps to a global policy.

## Verification

```text
Verification records evidence against the same approved project-model revision.
```

---

# 11. Final Decision

### Approved

- Overall architecture.
- Atlas-first delivery priority.
- Deterministic source inventory.
- Dynamic domain concepts.
- Rich semantic record types.
- Coverage and precision gates.
- Human correction flow.
- Canonical ApprovedProjectModel.
- Shared traceability.
- Policy packs.
- Extensible registry identities.
- Governed standards research.
- Policy evolution.
- Split downstream adaptation.

### Still required

1. Make DAPE-000 contract-neutral.
2. Add a real-provider Safara validation gate.
3. Define the candidate lexicon freeze lifecycle.
4. Separate canonical model publication from legacy projection status.
5. Make ARCH-001 consume ApprovedProjectModel directly.
6. Align Assurance dependencies.
7. Correct the initial policy-pack taxonomy.
8. Split standards retrieval from agent research.
9. Mark the earlier review document as historical.
10. Verify the branch head before implementation.

### Final classification

```text
Architecture direction:
APPROVED

Commit 43b3a7d correction quality:
VERY STRONG

DAPE-000:
READY AFTER ORACLE-SCOPE CORRECTION

DAPE-001:
READY AFTER DAPE-000 ACCEPTANCE

DAPE-004 AND LATER:
REQUIRES THE REMAINING CONTRACT CLARIFICATIONS

FULL AUTONOMOUS CODEX EXECUTION:
NOT YET APPROVED
```

The project is close to implementation-ready. The remaining work is not another architectural redesign. It is a final contract-clarification pass to prevent Codex from introducing circular fixtures, hiding poor real-provider extraction, mutating lexicons during a run, or preserving the legacy schema as an accidental bottleneck.

# CES Policies -- Frozen Context v1.1

**Status:** Proposed successor frozen context
**Purpose:** Apply accepted POL-000-R01 source governance without rewriting CES Policies Frozen Context v1
**Scope:** CES Policies only
**Proposed:** 2026-08-11
**Predecessor:** `CES_POLICIES_FROZEN_CONTEXT_V1_ASCII.md`
**Authority:** Accepted `POL-000` and `POL-000-R01`

---

## 1. Inheritance and Precedence

This document incorporates CES Policies Frozen Context v1 by reference.

Every v1 decision remains authoritative unless this document explicitly
supersedes it. When a source-related statement in v1 conflicts with this
document, v1.1 wins. The v1 file remains immutable historical evidence and
must not be edited to resemble v1.1.

This document supersedes only the source-strategy portions of v1 Sections 6,
7, 8, 11, 13, 22, 27, 29, and 30 as stated below. It does not reopen the
WHAT-not-HOW boundary, Atlas boundary, Context Binding requirement, agent
boundary, deterministic validation requirement, or bounded review protocol.

---

## 2. Permanent Source Governance

POL-000 is the permanent source-governance contract. Concrete source-set
changes require an accepted `POL-000-Rxx` revision with authoritative evidence,
downstream impact, immutable lineage, and a frozen terminal review outcome.

Sources use these governed classes:

```text
CORE
Active machine-processable knowledge input.

EVALUATION_SOURCE
Bounded machine-processable input whose permanent CES value is not yet proven.

REFERENCE_ONLY
Tracked alignment or certification reference that is not an extraction input.
```

Source class does not itself grant processing rights. Machine processing,
structured extraction, and AI-assisted analysis must each be explicitly
authorized by evidence. Missing or conflicting authority fails closed.

---

## 3. Source Glossary v1.1 -- FROZEN

### 3.1 Active CORE sources

```text
NIST Cybersecurity Framework 2.0
Release: NIST CSWP 29, published 2024-02-26
Role: security_governance_outcomes

OWASP ASVS 5.0.0
Role: application_security_verification

OWASP WSTG 4.2
Role: adversarial_testing
```

These releases are the required CORE inputs for raw vocabulary extraction.
Their recorded rights, attribution, provenance, release, and third-party
content conditions remain mandatory.

### 3.2 EVALUATION_SOURCE

```text
NIST SP 800-53 Rev. 5, Release 5.2.0
Issued: 2025-08-27
Role: security_control_catalog
```

SP 800-53 is admitted for bounded representative evaluation. This does not
make it permanent CORE. POL-006 and POL-007 must measure whether its concepts
provide unique value, reinforce existing concepts, are outside CES software
scope, or add duplicate noise. Promotion, demotion, or removal requires a new
POL-000 revision.

### 3.3 REFERENCE_ONLY sources

```text
ISO/IEC 27001:2022 + Amd 1:2024
Role: certification_alignment_target

ISO/IEC 27002:2022
Role: control_alignment_target
```

ISO remains strategically relevant to certification preparation and alignment
awareness. Under the current recorded authority, CES must not machine-extract,
scrape, reconstruct, transcribe for AI processing, or treat third-party
summaries or metadata as representative ISO vocabulary.

---

## 4. NIST Processing Boundary -- FROZEN

For NIST-authored CSF Core and SP 800-53 control-catalog material identified in
POL-000-R01:

```text
machine processing: AUTHORIZED
structured extraction: AUTHORIZED
AI-assisted analysis: AUTHORIZED
attribution: REQUIRED BY CES GOVERNANCE
third-party content: SEPARATE REVIEW OR EXCLUDE
content-specific conflict: FAIL CLOSED AND ESCALATE
endorsement claim: PROHIBITED
```

Authorization does not extend automatically to community mappings,
Informative References, translations, externally authored material, or content
merely linked or hosted by NIST.

---

## 5. Alignment and Compliance Boundary -- FROZEN

CES must not claim:

```text
NIST CSF 2.0 equals ISO/IEC 27001.
NIST SP 800-53 equals ISO/IEC 27002.
A NIST/ISO mapping proves ISO compliance.
CES policy coverage proves certification.
```

NIST and OWASP supply machine-processable CES knowledge inputs. ISO remains an
alignment and certification target. CES remains software-side preparation, not
a certification body, ISO auditor, complete ISMS, or proof of compliance.

---

## 6. Source Knowledge Sequence -- FROZEN

The v1 statements requiring extraction and normalization from exactly four
sources are superseded by:

```text
Governed Source Glossary v1.1
        v
Raw Source Vocabulary
        v
Normalized CES Canonical Vocabulary
        v
Candidate CES Policies
```

Raw extraction inputs are:

```text
Required representative CORE extraction:
- NIST CSF 2.0
- OWASP ASVS 5.0.0
- OWASP WSTG 4.2

Bounded representative evaluation extraction:
- NIST SP 800-53 Rev. 5, Release 5.2.0

Excluded from machine extraction:
- ISO/IEC 27001
- ISO/IEC 27002
```

References in v1 examples to normalization from "the four sources" now mean
normalization from the governed v1.1 machine corpus while preserving each
source concept's identity and semantic role.

The runtime rule is unchanged: project-time policy reasoning uses the approved
CES canonical baseline and Atlas facts. It does not independently reinterpret
raw NIST, OWASP, or ISO publications for each project.

---

## 7. Reconciliation and Activation Gate -- FROZEN

Publication of v1.1 authorizes the governed source strategy but does not
silently mutate accepted implementation artifacts.

Required sequence:

```text
POL-000-R01 ACCEPTED
        v
Frozen Context v1.1 ACCEPTED
        v
POL-002 reconciled
        v
POL-003 reconciled with historical v1 export preserved
        v
POL-004 reconciled with class-aware update behavior
        v
POL-005 revalidated; amend only for a concrete incompatibility
        v
POL-006 contract revised
        v
POL-006 resumes
```

POL-006 remains blocked until every preceding gate has closed. Neither a source
update nor an accepted update candidate may automatically change source class,
grant processing authority, activate extraction, or mutate a published
baseline.

---

## 8. Updated Work Sequence

The original P01-P05 work remains accepted historical delivery. The sequence
is extended, not rewritten:

```text
POL-000      Source Glossary Governance
POL-000-R01  Source Strategy Revision 001
v1.1         Successor Frozen Context
R-POL-002    Source Glossary reconciliation
R-POL-003    Governed source-set reconciliation
R-POL-004    Class-aware update reconciliation
V-POL-005    Compatibility validation
R-POL-006    Extraction-contract revision
P06          Raw Vocabulary Extraction resumes
P07-P17      Existing downstream sequence continues
```

Each reconciliation is independently reviewable and must not pull vocabulary
extraction or later policy design into its scope.

---

## 9. Decisions Not Reopened

All non-source decisions frozen by v1 remain frozen, including:

```text
Baseline engineering awareness purpose
WHAT, never HOW
Technology and architecture independence
Atlas ownership of project facts
Mandatory Context Binding
Concerns distinct from Policies
Capability needs before implementation
Three Policy resolution states
Organizational ISMS controls outside software-policy scope
Deterministic validation before accepted agent output
Agents Bridge as execution infrastructure only
Bounded two-round review protocol
Terminal review vocabulary
```

The exact downstream taxonomies, mappings, prompts, UI, provider, and
implementation mechanisms remain open exactly as described in v1 unless a
later accepted ticket freezes them.

---

## 10. Governing Lineage

```text
CES Policies Frozen Context v1
        |
        +-- historical four-source baseline preserved
        |
        v
POL-000 Source Glossary Governance
        v
POL-000-R01 Source Strategy Revision 001 -- ACCEPTED
        v
CES Policies Frozen Context v1.1
```

Until this proposed context receives an allowed terminal review outcome that
accepts it, Frozen Context v1 remains the active authoritative context. Upon
acceptance, v1.1 becomes the active context and v1 remains immutable historical
evidence.

---

**End of proposed frozen CES Policies v1.1 context.**


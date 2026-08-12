# CES-GF-POL-000-R01 - Source Strategy Revision 001

**Status:** Accepted
**Review class:** REVIEW_GATE
**Governed by:** POL-000
**Depends on:** Accepted POL-000
**Blocks:** POL-006

## Trigger

CES Policies Frozen Context v1 requires representative POL-006 extraction
from ISO/IEC 27001, ISO/IEC 27002, OWASP ASVS, and OWASP WSTG. The accepted
source records prohibit machine processing of the two ISO publications without
written permission covering the intended AI-assisted extraction. No such
authorization is recorded, so POL-006 cannot truthfully satisfy its current
contract.

## Outcome

Revise the proposed CES machine-processable source set while retaining ISO as
an explicit certification and alignment reference. The revision changes source
governance only; it does not activate records, rewrite the v1 baseline, or
extract vocabulary.

## Previous accepted source strategy

CES Policies Frozen Context v1 remains historically authoritative until its
successor is deliberately published:

| Source | Previous role | Previous class |
|---|---|---|
| ISO/IEC 27001:2022 + Amd 1:2024 | Certification anchor | CORE |
| ISO/IEC 27002:2022 | Control guidance | CORE |
| OWASP ASVS 5.0.0 | Application security verification | CORE |
| OWASP WSTG 4.2 | Adversarial security testing | CORE |

## Proposed governed source strategy

| Exact source release | Role | Proposed class | Machine corpus decision |
|---|---|---|---|
| NIST Cybersecurity Framework 2.0, NIST CSWP 29, published 2024-02-26 | `security_governance_outcomes` | `CORE` | Authorized subject to evidence and conditions below |
| NIST SP 800-53 Rev. 5, Release 5.2.0, issued 2025-08-27 | `security_control_catalog` | `EVALUATION_SOURCE` | Authorized for bounded evaluation subject to evidence and conditions below |
| OWASP ASVS 5.0.0 | `application_security_verification` | `CORE` | Retained under its recorded license conditions |
| OWASP WSTG 4.2 | `adversarial_testing` | `CORE` | Retained under its recorded license conditions |
| ISO/IEC 27001:2022 + Amd 1:2024 | `certification_alignment_target` | `REFERENCE_ONLY` | Not authorized for machine extraction |
| ISO/IEC 27002:2022 | `control_alignment_target` | `REFERENCE_ONLY` | Not authorized for machine extraction |

`EVALUATION_SOURCE` permits representative downstream evaluation but does not
prejudge permanent core admission. A later promotion, demotion, or removal of
SP 800-53 requires another POL-000 revision.

## Authoritative NIST evidence

Evidence was verified against official NIST sources on 2026-08-11.

### NIST CSF 2.0

- The [official publication record](https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20)
  identifies NIST CSWP 29, version 2.0, published 2024-02-26, and describes a
  non-prescriptive taxonomy of high-level cybersecurity outcomes.
- The [official CSF reference tool](https://csrc.nist.gov/projects/cybersecurity-framework/filters)
  exports the CSF 2.0 Core in JSON and Excel. The
  [official FAQ](https://www.nist.gov/cyberframework/faqs) confirms that an
  unfiltered export contains the full Core.
- Machine processing, structured extraction, and AI-assisted analysis of the
  NIST-authored Core are authorized under the rights determination below.
  Informative References, community mappings, translations, and other
  externally authored material are excluded unless separately reviewed.

### NIST SP 800-53 Rev. 5, Release 5.2.0

- The [official publication record](https://csrc.nist.gov/Pubs/sp/800/53/r5/upd1/Final)
  states that NIST issued Release 5.2.0 on 2025-08-27 and enumerates the patch
  changes.
- NIST's [official release announcement](https://csrc.nist.gov/news/2025/nist-releases-revision-to-sp-800-53-controls)
  states that Release 5.2.0 is available through the NIST reference tooling in
  OSCAL, JSON, and spreadsheet formats. The publication record additionally
  exposes the controls as OSCAL JSON, XML, and YAML.
- Machine processing, structured extraction, and AI-assisted analysis of the
  NIST-authored control catalog are authorized under the rights determination
  below. Supplemental or embedded third-party content is excluded unless
  separately reviewed.

### Rights, reuse, and attribution determination

- NIST's [copyright and disclaimer policy](https://www.nist.gov/copyrights-disclaimers)
  permits distribution and copying of NIST-site information except material
  marked as copyrighted, requests appropriate credits, and warns that an
  individual product may carry its own terms.
- NIST's [technical-series rights statement](https://www.nist.gov/open/copyright-fair-use-and-licensing-statements-srd-data-software-and-technical-series-publications)
  states that NIST-employee works are not copyright-protected in the United
  States, reserves foreign rights, grants broad worldwide reprint and
  derivative-work permission where NIST may assert those rights, recommends
  citation, and warns that third-party-authored portions may remain protected.
- The [CSF FAQ](https://www.nist.gov/cyberframework/faqs) likewise says NIST
  publications are generally public domain in the United States, calls for
  source credit, and notes that reuse outside the United States may require
  attention to foreign rights.

Governance determination:

| Field | NIST-authored CSF Core / SP 800-53 catalog |
|---|---|
| Machine processing | `AUTHORIZED` |
| Structured extraction | `AUTHORIZED` |
| AI-assisted analysis | `AUTHORIZED` |
| Attribution | Required by CES governance using the official NIST citation |
| Third-party content | Must be identified and separately reviewed or excluded |
| Geographic caveat | Preserve NIST's stated foreign-rights and worldwide-grant terms; escalate any content-specific conflict |
| Endorsement | CES must not imply NIST endorsement or certification |

This is a bounded source-governance determination, not general legal advice and
not authorization for material merely linked, mapped, or hosted by NIST.

## Non-equivalence and compliance boundary

This revision does not claim that NIST CSF equals ISO/IEC 27001, that NIST SP
800-53 equals ISO/IEC 27002, or that a NIST/ISO mapping proves ISO compliance.
NIST supplies practical machine-processable outcome and control vocabulary;
ISO remains a reference for alignment and certification awareness. CES is not
a certification body, ISO auditor, complete ISMS, or proof of compliance.

## Required downstream reconciliation

This revision becomes operational only through a new frozen-context lineage:

```text
CES Policies Frozen Context v1
        -> POL-000-R01 ACCEPTED
        -> CES Policies Frozen Context v1.1
        -> affected contracts reconciled
        -> POL-006 revised and resumed
```

- **Frozen context:** Publish v1.1 without deleting or rewriting v1.
- **POL-002:** Amend the Source Glossary contract to represent source class,
  role, processing authorization, evidence, and conditions. Preserve immutable
  published release identity and explicit migration/version lineage.
- **POL-003:** Preserve the original four-source v1 export and add a separately
  versioned governed source set containing the six classified records above.
- **POL-004:** Make update awareness class-sensitive for `CORE`,
  `EVALUATION_SOURCE`, and `REFERENCE_ONLY`. An update candidate must never
  promote a source or authorize extraction automatically.
- **POL-005:** No structural amendment is currently required because its raw
  vocabulary contract is source-neutral. Revalidate it after the POL-002
  amendment and change it only if a concrete incompatibility is found.
- **POL-006:** Replace the four-source extraction condition with representative
  extraction from NIST CSF 2.0, OWASP ASVS 5.0.0, and OWASP WSTG 4.2, plus a
  bounded representative evaluation of NIST SP 800-53 Release 5.2.0. Explicitly
  exclude ISO publication content under the current authorization state.

## Acceptance contract

### AC-01 - Source classes are explicit

The governed decision distinguishes `CORE`, `EVALUATION_SOURCE`, and
`REFERENCE_ONLY` with unambiguous machine-corpus semantics.

### AC-02 - Machine sources and alignment targets are distinct

The proposed source set clearly identifies machine-extractable inputs,
evaluation inputs, and non-extractable alignment targets.

### AC-03 - NIST CSF 2.0 is admitted

The exact NIST CSWP 29 release is admitted as the CORE
`security_governance_outcomes` source with authoritative release, format, and
rights evidence.

### AC-04 - NIST SP 800-53 is admitted for evaluation

Rev. 5 Release 5.2.0 is admitted only as an EVALUATION_SOURCE with
authoritative release, format, and rights evidence. Permanent core status is
not implied.

### AC-05 - OWASP sources remain core

The accepted ASVS 5.0.0 and WSTG 4.2 records remain CORE under their existing
license and provenance conditions.

### AC-06 - ISO remains represented

The accepted ISO releases remain visible as REFERENCE_ONLY alignment and
certification targets, with machine extraction prohibited under the current
authorization evidence.

### AC-07 - Usage rights are governed

Each NIST processing decision is backed by official evidence, attribution and
geographic conditions, a fail-closed third-party-content rule, and a
non-endorsement boundary.

### AC-08 - No equivalence or compliance claim is introduced

The revision makes no NIST/ISO equivalence, automatic alignment, compliance,
or certification claim.

### AC-09 - Downstream impact and activation are explicit

The revision identifies the required frozen-context, POL-002, POL-003,
POL-004, POL-005, and POL-006 treatment and does not activate itself before
those gates close.

### AC-10 - No vocabulary extraction occurs

No NIST, OWASP, or ISO vocabulary is extracted or canonicalized by this
revision.

## Explicit non-goals

- Raw or canonical vocabulary extraction.
- Final SP 800-53 value or permanent-admission judgment.
- Canonical Policy, Concern, or Capability Need design.
- Architecture, stack, implementation, agent reasoning, or Atlas integration.
- Admission of additional standards or source ecosystems.
- ISO content transcription, reconstruction, scraping, or AI processing.

## Review focus

Round 1 is limited to the source decision, exact release and rights evidence,
classification semantics, non-equivalence boundary, downstream impact, and
this acceptance contract. Round 2 is closure-only under the frozen bounded
review protocol.

The review must terminate only as `ACCEPTED`, `NOT ACCEPTED`, or
`ACCEPTED WITH DEFERRED ITEMS`.

## Acceptance evidence

- Commit `389fd93` introduced the concrete source-strategy revision and its
  authoritative NIST evidence.
- Round 1 result: `ACCEPTED`.
- No BLOCKER, REQUIRED, or DEFERRED findings were recorded.

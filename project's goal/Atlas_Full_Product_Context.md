# Atlas: Full Product Context

**Status:** Product context and future-state operating model  
**Date:** 21 August 2026

## Product purpose

Atlas is a domain-neutral workspace that makes the meaning of evolving PRDs visible, traceable, and useful to delivery teams. It helps teams understand what the PRDs say, which facts matter, what changed over time, and what problems must be handled before they decide technology, architecture, vendors, or implementation methods.

Its objective is **baseline awareness**, not solution prescription.

Safara's Umrah-administration PRD is an illustrative project. Atlas must remain usable for any business domain.

## Core Atlas principles

1. Understand the project as it currently stands, verify every interpretation against source wording, and compare PRD increments.
2. Organize a project through Main Workflow, Project Facts, CES Result, and Changes Done.
3. Provide a global PRD lens that highlights or isolates contributions from selected documents while retaining necessary context.
4. Reveal Atlas's understanding alongside the exact source quote, source document, and page.
5. Present a compact workflow journey leading to focused semantic pages instead of an overwhelming process graph.
6. Treat non-workflow knowledge such as scope, roles, constraints, information protection, outputs, and commitments as first-class, source-grounded facts.
7. Make policy coverage, review needs, evidence, and unresolved decisions visible.
8. Keep each increment's additions, clarifications, expansions, supersessions, and open questions navigable.

## System actors

### Atlas

Atlas is the project-understanding actor. It must:

1. store uploaded PRD PDFs securely in S3-compatible object storage;
2. extract text, layout, page references, and source excerpts;
3. identify major workflows for Main Workflow;
4. extract, normalize, and prepare project facts for Project Facts;
5. prepare approved project facts for CES Policy consumption;
6. adapt the accumulated project model when new PRDs are uploaded; and
7. prepare the incremental record needed for Changes Done.

Atlas must retain provenance for every meaningful interpretation and clearly distinguish source fact from Atlas interpretation.

### CES Policy (Baseline Awareness Generator)

CES Policy is a globally governed knowledge actor. It begins with a Source Glossary that records:

- approved source families, such as OWASP ASVS, OWASP WSTG, NIST CSF, and NIST SP 800-53;
- the specific authoritative releases of those sources;
- permitted usage of each source, including whether it may be processed, extracted, or referenced only; and
- evidence and attribution requirements.

From the governed sources, CES creates reusable, approved CES Policies, Concerns, and Capability Needs. For a particular project, it must:

1. identify applicable approved Policies;
2. explain the obligation each Policy creates;
3. link the Policy to relevant approved project facts;
4. identify related Concerns and explain why they matter;
5. identify capabilities the eventual solution must provide;
6. show known information, items to account for, and open decisions;
7. preserve traceability among source facts, CES knowledge, and project facts; and
8. avoid recommending technologies, architecture, vendors, or implementation methods.

The intended knowledge flow is:

```text
Governed sources → approved CES knowledge → project-aware Policies, Concerns,
Capability Needs, and unresolved decisions
```

CES knowledge is global and versioned independently of projects. A CES Result is a project-specific application of that governed knowledge.

## Approval-governed lifecycle

```text
Incremental PRD PDFs
        ↓
Atlas extraction and accumulated project model
        ↓
User approval of Atlas understanding
        ↓
CES Policy evaluation of approved project facts
        ↓
Coverage loop
        ↓
User approval of CES Result
```

The coverage loop continues until every approved project fact is either:

- linked to one or more applicable CES Policies;
- explicitly marked outside the baseline's scope; or
- captured as an unresolved decision.

## Access, storage, and security direction

- Each user receives a personal workspace; no company or branch setup is required.
- Projects are private by default.
- Only the owner and users explicitly invited by email can access a project.
- Project roles are Owner, Editor, and Viewer.
- Original PDFs and their derived content are protected by project-scoped authorization.
- Original PDFs are stored privately in S3-compatible object storage and accessed through short-lived, permission-checked URLs.
- The eventual product must support strict Content Security Policy practices.

## Product outcome

The baseline result must help a development team determine the problems it needs to handle:

- what the PRDs actually say;
- how Atlas has interpreted them;
- which facts drive obligations, risk, and scope;
- which governed CES Policies and Concerns apply;
- which capabilities must be accounted for; and
- which business decisions remain open.


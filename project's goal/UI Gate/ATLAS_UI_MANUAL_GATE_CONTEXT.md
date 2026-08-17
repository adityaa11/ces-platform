# Atlas UI Manual Gate Context

**Status:** Proposed product context for repository inspection and ticket redefinition
**Primary audience:** Codex working on the CES Platform repository
**Prototype:** `atlas-incremental-prd-ux(2).html`
**Character policy:** ASCII only

## 1. Purpose

This document explains the intended Atlas user interface and the role that the
interface must play as a manual verification gate.

The goal is not to ask Codex to copy the prototype into production. The goal is
to establish the layout, the intent of each section, the navigation model, and
the questions that a user must be able to answer before Atlas knowledge is
trusted and before downstream CES results are trusted.

Codex should inspect the current repository, compare the existing Atlas
contracts, APIs, UI, tickets, tests, and review evidence against this context,
and then propose a bounded redefinition plan. Existing implementation may be
reused when it satisfies this context. Existing implementation must not be
treated as accepted merely because a ticket says `Implemented` or `Completed`.

## 2. Product Direction

Atlas is a project knowledge workspace, not only a PRD extractor and not only a
graph viewer.

The interface is the environment in which the project owner must be able to:

1. Understand the accumulated project without reading the entire PRD again.
2. Verify that every material PRD statement was accounted for.
3. Inspect how every PRD increment affected the project model.
4. Compare Atlas interpretation with exact original source wording.
5. Identify unresolved, ambiguous, excluded, or unsupported information.
6. Approve one exact project revision only after the visible result is trusted.
7. Inspect CES policy results derived from approved Atlas knowledge.
8. Trace every CES result back through Atlas knowledge to original PRD evidence.

Atlas must not be refined only to unblock `POL-010`. Atlas and CES Policies must
be developed in their real product environment: the shared UI.

## 3. Golden Prototype Authority

The renewed HTML prototype is the golden example for information architecture,
interaction intent, and buyer-facing behavior.

The prototype establishes:

- the project sidebar structure;
- the intent of each project section;
- the global multi-PRD lens;
- accumulated-model behavior;
- semantic workflow paging;
- cross-section navigation;
- source-document accounting;
- source evidence inspection;
- the initial location and role of CES results.

The prototype does not establish:

- final production component code;
- final API routes or response schemas;
- final database structures;
- final policy taxonomy;
- final status vocabulary;
- exact production card fields;
- exact Safara counts, labels, or sample outcomes;
- final approval mechanics;
- ticket acceptance merely by visual similarity.

Safara content in the prototype is qualification data. The reusable authority
is the behavior and information architecture, not the hardcoded sample values.

## 4. Core Product Principles

The following principles should govern Atlas and its UI:

1. Atlas represents accumulated project understanding.
2. Main Workflow remains a high-level overview rather than a giant graph.
3. Workflow detail is split into meaningful semantic pages.
4. Project Facts contains material non-workflow knowledge.
5. Changes Done explains contributions by source PRD.
6. Source Documents proves that source content was accounted for.
7. CES Result is derived from Atlas knowledge and remains separate from Atlas
   project truth.
8. Every visible interpretation must resolve to original source evidence.
9. Nothing material may be silently omitted.
10. Proposed knowledge must remain distinct from approved knowledge.
11. A new PRD must not mutate the last approved revision in place.
12. Backend contracts own semantics, hierarchy, identity, provenance,
    accounting, revision state, and approval state.
13. The UI owns presentation and interaction but must not infer missing semantic
    meaning, graph topology, source coverage, policy applicability, or approval
    eligibility.
14. The same selected-PRD lens must behave consistently across every project
    section.

## 5. Overall Layout

The intended project navigation is:

```text
PROJECT VIEWS

01 Main Workflow
02 Project Facts
03 CES Result
04 Changes Done

SOURCE DOCUMENTS
  PRD documents and increments
```

The project switcher is separate from workflow depth and PRD filtering. One
Atlas workspace may contain multiple projects, and each project may contain
multiple PRD documents or increments.

The UI should preserve a stable project identity while the user moves among
sections, workflow pages, selected PRDs, source documents, evidence locations,
and CES results.

## 6. Global Multi-PRD Lens

The upper-right control is a multi-select PRD lens shared by every project
section.

Default state:

```text
All PRDs
Hide unselected PRD data: unchecked
```

### 6.1 No PRD selected

The UI shows the complete accumulated project model.

### 6.2 One or more PRDs selected, hide unchecked

The UI continues showing the complete accumulated model, but:

- contributions from selected PRDs are highlighted;
- unselected data remains visible but visually de-emphasized;
- affected workflow pages can be navigated directly;
- the user retains the complete project context.

This mode answers:

> Where did the selected PRDs contribute inside the current project?

### 6.3 One or more PRDs selected, hide checked

The UI isolates contributions from selected PRDs.

In a workflow, structural context required to understand a selected node may
remain visible and must be labeled `CONTEXT`. The UI must not present isolated
nodes as if they form a complete process when predecessor or successor context
is required.

This mode answers:

> What information came from only these selected PRDs?

### 6.4 Required consistency

The same lens state must apply to:

- journey stages;
- semantic workflow pages;
- workflow nodes and relationships;
- Project Fact groups and rows;
- CES results;
- Changes Done groups and entries;
- source-document accounting;
- affected-page navigation;
- evidence contribution labels.

The UI must not implement separate incompatible PRD filters in each section.

## 7. Section 01: Main Workflow

### 7.1 User question

> How does this project operate today?

### 7.2 Intent

Main Workflow is the accumulated business overview. It must let a buyer
understand the project lifecycle without reading a sea of text or loading every
atomic concept into one graph.

### 7.3 Overview level

The overview contains a small set of journey stages or major business areas.
Each stage summarizes:

- its name;
- its purpose;
- its business result;
- the number of semantic workflow pages inside it;
- whether selected PRDs contributed to it.

Cross-workflow concerns such as reporting and activity history may appear in a
separate support layer when that better represents their role.

The overview must remain readable as the project grows. It must not expand into
one graph containing all workflow steps, states, rules, validations, reports,
and audit concepts.

### 7.4 Semantic workflow paging

Accumulated detail is divided into semantic workflow pages. A page is not an
arbitrary slice such as items 1 through 10. Each page answers one bounded
business question.

Example:

```text
Journey stage: Travel Readiness
Workflow page: Decide travel readiness
Question: When is a pilgrim Ready or Blocked?
```

Navigation includes:

- Back to overview;
- previous workflow page;
- next workflow page;
- page picker grouped by journey stage;
- previous affected page when the PRD lens is active;
- next affected page when the PRD lens is active;
- direct opening from Project Facts, CES Result, Changes Done, and Source
  Documents where applicable.

### 7.5 Workflow page content

A workflow page should provide:

- owning journey stage;
- page position within the accumulated model;
- focused title and business question;
- actors involved;
- intended business result;
- source history showing contributing PRDs;
- source-supported workflow nodes and relationships;
- selected-PRD contribution markers;
- structural context markers when isolation is enabled;
- an evidence area for the selected node or relationship.

### 7.6 Evidence interaction

Selecting a node or relationship must expose:

- what Atlas understood;
- exact original PRD wording;
- source document identity and revision;
- page or source-unit location;
- every contributing PRD;
- evidence confidence and review state when applicable;
- the original PDF location in the production workspace.

The browser must not infer evidence through uncontrolled text search when the
backend already owns evidence identities and locations.

## 8. Section 02: Project Facts

### 8.1 User question

> What important project knowledge exists outside the process flow?

### 8.2 Intent

Project Facts holds material knowledge that should not be forced into workflow
diagrams merely to make it visible.

Examples include:

- project scope;
- actors and responsibilities;
- business entities;
- restrictions;
- permissions;
- commitments;
- outputs and deliverables;
- completion conditions;
- global business rules;
- non-workflow constraints.

### 8.3 Behavior

Facts are grouped into understandable buyer-facing categories. A group can be
expanded to show its current accumulated values and provenance.

When the PRD lens is active:

- highlight mode keeps the complete fact set and highlights selected
  contributions;
- isolation mode shows only matching groups or rows;
- provenance continues identifying every PRD that established or clarified the
  fact.

Project Facts must not become a second unstructured PRD text dump.

## 9. Section 03: CES Result

### 9.1 User question

> What engineering policy conclusions follow from this project, and why?

### 9.2 Intent

CES Result is the UI location for policy results derived from approved Atlas
knowledge. It places the POL ticket set in its real product environment rather
than treating policy work as invisible backend output.

CES Result must let the user understand:

- which policy result applies;
- its current status;
- its buyer-readable conclusion;
- the policy rule involved;
- the approved Atlas facts or concepts that triggered it;
- the relevant workflow page or Project Fact;
- the contributing PRDs;
- original PRD evidence;
- missing information or review blockers;
- later, expected implementation and verification evidence.

### 9.3 Authority boundary

CES Result does not own project truth.

The correct direction is:

```text
PRD statement
  -> Atlas workflow, Atlas fact, Needs Answer, or explicit exclusion
  -> approved Atlas revision
  -> CES policy binding and result
```

A PRD statement must not use CES Result as its only permanent knowledge
destination. If a business value is missing, Atlas owns the `Needs Answer`
state. CES may reference that unresolved Atlas item and show that a policy
result is blocked or needs review.

### 9.4 POL ticket progression in the UI

The CES Result shell should be populated progressively:

| Ticket | User-visible capability |
| --- | --- |
| POL-010 | Exact Atlas project, revision, authority, consumed facts, and provenance |
| POL-011 | Policy bindings and why each result applies |
| POL-012 | Valid, blocked, stale, missing, conflicting, and cross-project states |
| POL-013 | Bounded reasoning and human-readable rationale |
| POL-014 | Agents Bridge execution provenance |
| POL-015 | Developer-facing baseline and expected delivery evidence |
| POL-016 | Cross-domain qualification and coverage evidence |
| POL-017 | Frozen baseline identity and immutable publication status |

The UI must not fabricate placeholder policy conclusions when a stage is not
implemented. It should display honest availability states.

## 10. Section 04: Changes Done

### 10.1 User question

> What did each PRD establish or change in the accumulated project?

### 10.2 Intent

Changes Done is the accumulated change ledger grouped by source PRD. It is not
another complete copy of the current project model.

Each entry should explain whether a PRD:

- established new knowledge;
- clarified existing knowledge;
- expanded an existing workflow or fact;
- changed an existing interpretation;
- introduced a contradiction;
- left a question unresolved;
- explicitly superseded prior knowledge.

Each change links to its permanent destination in Main Workflow, Project Facts,
or the relevant unresolved review item. CES policy impact may be shown as a
derived consequence, but it must remain distinguishable from the project change
itself.

When the PRD lens is active:

- highlight mode keeps the complete history and highlights selected groups;
- isolation mode displays only selected PRD groups and their changes.

## 11. Source Documents

### 11.1 User question

> Did Atlas account for everything material in this source document?

### 11.2 Intent

Source Documents is the primary completeness and traceability entry point.

For each PRD, the UI must show source accounting such as:

```text
Statements found
= placed in project
+ needs an answer
+ explicitly excluded with reason
+ unsupported or failed with visible disposition
```

The exact categories may be refined by the repository contract, but the
invariant is permanent:

> No material source statement silently disappears.

Each statement must show:

- exact wording;
- document and revision identity;
- source location;
- disposition;
- permanent Atlas destination when placed;
- unresolved reason when not placed;
- exclusion reason when excluded;
- review state;
- action to open the destination or evidence.

A source document can be applied as the global PRD lens.

## 12. Cross-Section Navigation

The sections are projections over one shared project model. They must not behave
as disconnected reports.

Required navigation includes:

- source statement -> Atlas destination;
- workflow node or relationship -> exact evidence;
- Project Fact -> source provenance;
- change entry -> permanent current destination;
- CES result -> triggering Atlas knowledge;
- CES result -> workflow page or Project Fact;
- CES result -> exact source evidence;
- selected PRD -> every affected section;
- workflow page -> previous or next affected page;
- evidence -> original PDF page and highlight.

Navigation must preserve project identity, selected PRDs, hide mode, revision
context, and the current authority state.

## 13. UI as the Manual Verification Gate

The UI is not only a renderer. It is the manual gate through which the project
owner decides whether Atlas understanding is trustworthy.

The user must be able to verify:

1. The project overview is understandable.
2. Workflow topology reflects the PRD.
3. Important rules and validations are not missing.
4. Non-workflow knowledge appears in Project Facts.
5. Every material source statement has a disposition.
6. Every Atlas interpretation has exact source evidence.
7. Selected PRD contributions can be highlighted or isolated.
8. New PRD changes are visible and traceable.
9. Unresolved questions and contradictions remain visible.
10. CES results reference approved Atlas knowledge rather than rereading the
    PRD independently.
11. No downstream result is presented as current when its Atlas revision is
    stale or unapproved.

### 13.1 Required revision states

The production UI should eventually represent at least:

- no approved revision;
- proposed revision awaiting review;
- proposed revision blocked by unresolved items;
- revision eligible for approval;
- approved current revision;
- superseded approved revision;
- new PRD added after approval;
- CES results current for the approved revision;
- CES results stale because a newer Atlas revision exists;
- CES results unavailable or blocked.

### 13.2 Review controls

The prototype does not yet freeze exact approval controls. Codex should inspect
the repository review protocol and propose how the UI should expose:

- review subjects;
- findings and blocker classes;
- clarification questions;
- corrections;
- accept, reject, defer, or supersede decisions where allowed;
- approval eligibility;
- proposal hash and revision;
- reviewer and decision history;
- Round 1 findings;
- Round 2 closure;
- terminal review outcome.

These controls must support the existing bounded CES review protocol rather
than introduce an unlimited feedback loop.

## 14. Incremental PRD Lifecycle

The expected lifecycle is:

```text
1. Add a PRD document or increment.
2. Atlas creates a proposed successor revision.
3. The last approved revision remains unchanged.
4. Changes Done explains the new contribution.
5. Main Workflow and Project Facts show the proposed accumulated result.
6. Source Documents accounts for every material statement.
7. The reviewer investigates evidence, questions, and contradictions.
8. Only an eligible exact proposal may be approved.
9. Approval promotes that exact revision to current project truth.
10. CES results run against the approved revision.
11. A later PRD marks older CES results as stale until the successor revision is
    approved and reevaluated.
```

The UI must clearly indicate whether it is displaying the last approved model,
a proposed successor, or a comparison between them.

## 15. Backend and UI Ownership

| UI capability | Backend must provide | UI must not infer |
| --- | --- | --- |
| Project switcher | Projects, revisions, lifecycle, authority | Project authority |
| Main Workflow | Stages, pages, nodes, relationships, ordering | Business topology |
| Semantic pager | Ordered pages and stage membership | Page grouping |
| Project Facts | Fact groups, rows, identities, provenance | Fact classification |
| PRD lens | Contribution mappings and affected identities | Source contribution |
| Changes Done | Revision delta and change classification | Semantic diff |
| Source accounting | Complete statement dispositions and totals | Coverage |
| Evidence viewer | Evidence identity, document revision, page, span, coordinates | Evidence location |
| Review gate | Subjects, decisions, blockers, eligibility, history | Approval eligibility |
| CES Result | Policy bindings, conclusions, status, trigger facts | Policy applicability |

The backend must not encode visual layout details such as colors or card sizes.
The UI must not compensate for missing semantics by inventing hierarchy,
relationships, policy results, or evidence.

## 16. Review Protocol for Atlas Redefinition

Codex should inspect the CES Feedback Review Protocol and apply its bounded
model to the Atlas redefinition.

Each Atlas ticket should declare:

- implementation status;
- review class: `REVIEW_GATE` or `BATCHABLE`;
- candidate commit;
- required evidence;
- Round 1 findings;
- remediation commit;
- Round 2 closure;
- terminal outcome.

Terminal outcomes are:

- `ACCEPTED`;
- `NOT ACCEPTED`;
- `ACCEPTED WITH DEFERRED ITEMS`.

Round 1 is the sole broad discovery review. Round 2 closes recorded blocking
findings and checks regressions caused by remediation. Closed work changes only
through a new ticket or an explicit authority change.

`Implemented` must not be treated as equivalent to `Accepted`.

## 17. Repository Inspection Requested from Codex

Before changing implementation, Codex should inspect the current `worker1`
branch and identify:

1. The active Atlas product authority documents.
2. The current Atlas V2 contracts and schemas.
3. The semantic extraction and decomposition pipeline.
4. Knowledge assembly and graph projection.
5. Revision, proposal, approval, and audit contracts.
6. Current Atlas API routes and view projections.
7. Current production UI and its data ownership.
8. Live and synthetic qualification fixtures.
9. Ticket statuses and whether they received terminal review outcomes.
10. The CES Feedback Review Protocol.
11. POL-010 through POL-017 contracts and dependencies.
12. Obsolete V1 documents or documentation that still conflict with V2.

Codex should then produce one bounded gap matrix:

| Golden UI capability | Current repository evidence | Gap | Required owner | Proposed ticket |
| --- | --- | --- | --- | --- |

Required owners should distinguish at least:

- Atlas semantic model;
- Atlas review governance;
- Atlas API projection;
- Atlas UI;
- CES Policies;
- cross-product integration.

## 18. Expected Codex Output

Codex should not immediately implement a new UI or invent another Atlas model.
The first requested output is an evidence-backed redefinition proposal that
contains:

1. Current-state repository findings.
2. Conflicts between existing authority and this context.
3. Reusable implementation foundations.
4. Missing manual-gate capabilities.
5. Backend/UI wiring gaps.
6. Atlas/POL integration gaps.
7. A bounded ticket sequence using vertical slices.
8. Review classifications and dependency order.
9. Explicit supersession or deprecation actions for conflicting authority.
10. A stopping condition that prevents an endless feedback cycle.

Every vertical slice should end in something manually verifiable in the UI and
should include:

- semantic contract;
- API or projection contract;
- production UI behavior;
- Safara evidence;
- structurally different non-Safara evidence where required;
- automated tests;
- manual verification steps;
- review evidence;
- terminal outcome.

## 19. Manual Acceptance Checklist

The Atlas UI product redefinition is not complete until the project owner can
manually verify all of the following in the production-shaped UI:

- [ ] The sidebar matches the intended section ownership.
- [ ] Main Workflow remains understandable at project scale.
- [ ] Semantic pages answer focused business questions.
- [ ] Page navigation works without returning to the overview.
- [ ] Multi-PRD selection works globally.
- [ ] Highlight mode preserves accumulated context.
- [ ] Isolation mode preserves required structural context.
- [ ] Project Facts contains material non-workflow knowledge.
- [ ] Changes Done explains every PRD increment.
- [ ] Every material source statement has a visible disposition.
- [ ] Every Atlas item links to exact source evidence.
- [ ] Evidence opens the correct original document revision and location.
- [ ] Proposed and approved revisions cannot be confused.
- [ ] Approval is blocked when unresolved requirements remain.
- [ ] Approval binds to one exact proposal revision and hash.
- [ ] CES Result identifies the Atlas revision it consumed.
- [ ] Every CES result links to triggering Atlas knowledge.
- [ ] Every CES result can be traced to original PRD evidence.
- [ ] A new PRD marks affected CES results stale until reevaluation.
- [ ] No UI component invents semantic or policy truth.
- [ ] Review ends with a terminal outcome under the bounded protocol.

## 20. Stopping Condition

This redefinition must not create another endless feedback loop.

The work is ready for implementation when:

1. This UI intent context is accepted as product authority.
2. The prototype version is pinned as the golden behavioral example.
3. Codex completes one repository gap analysis under the review protocol.
4. Round 1 findings are recorded once with stable identifiers.
5. A bounded vertical-slice ticket plan is accepted.

The product redefinition is complete when the accepted ticket plan reaches its
manual acceptance checklist and receives a terminal review outcome. New ideas
after that point require a new ticket or an explicit authority revision; they
must not reopen accepted work informally.

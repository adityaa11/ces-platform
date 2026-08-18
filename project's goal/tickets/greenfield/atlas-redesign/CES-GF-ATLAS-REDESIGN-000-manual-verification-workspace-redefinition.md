# CES-GF-ATLAS-REDESIGN-000 - Atlas Manual Verification Workspace Redefinition

**Status:** Accepted
**Review class:** REVIEW_GATE
**Depends on:** Project-owner UI direction recorded in
`../../../UI Gate/ATLAS_UI_MANUAL_GATE_CONTEXT.md`. Planning may inspect and
reuse ATLAS-V2-011A through ATLAS-V2-011F as provisional foundation evidence at
reviewed repository commits `a5994285c4250b9ead7a9a28c4ef3d0529d80edd` and
`5e5d3a2142477b961c8930f07f6f8bac921a2f97`; their `Completed` labels are not
terminal acceptance. Final renewed Atlas authority requires REDESIGN-001
through REDESIGN-009 to receive accepting terminal outcomes and requires
ATLAS-V2-011G's remaining generic live qualification either to receive its own
accepting terminal outcome or to be explicitly superseded and satisfied by
REDESIGN-009.
**Blocks:** Atlas replacement implementation, acceptance of Atlas as trusted
project authority, and resumption of POL-010

## Outcome

Accept one bounded product and delivery contract for finishing Atlas as a
manually verifiable project-knowledge workspace.

The layout, section ownership, interaction intent, and buyer questions in the
renewed UI Gate prototype become the rails for Atlas. The prototype is not a
production data source, schema, component implementation, or Safara-specific
template. Production contracts and projections must be defined from the data
needed to satisfy those rails.

Atlas is being completed for its own product purpose. Unblocking POL-010 is a
downstream consequence, not the definition of Atlas completion.

## Accepted product authority

The accepting terminal outcome activates these entries in
`CES_ATLAS_AUTHORITY.md`:

1. `../../../UI Gate/ATLAS_UI_MANUAL_GATE_CONTEXT.md` (content hash
   `sha256:af45501722121e340e90a3a104983b640949f3d81127e9ae78ccdfe8389e8d47`)
   as authority for workspace
   information architecture, section intent, manual verification behavior,
   multi-PRD behavior, cross-section navigation, and product boundaries.
2. `../../../UI Gate/atlas-incremental-prd-ux(2).html` (content hash
   `sha256:ec5e25ea3f2a98fd8ec1130af59e59371f0b410c1a51f059560772043cc13505`)
   as the golden behavioral and layout example.

The context governs when sample content conflicts with the prototype. Existing
Atlas semantic and evidence authority remains reusable where it does not
conflict with this gate.

This gate explicitly supersedes requirements that the production UI retain the
current Explore / permanently visible Main Workflow / PDF Evidence three-column
shell. It does not supersede backend-owned semantics, exact source evidence,
revision pinning, project isolation, or the rule that graphs are projections
from semantic knowledge.

## Replacement decision

The existing Atlas UI is disposable and will be replaced. It is not the base
layout for the renewed workspace.

Reusable infrastructure may include:

- revision-pinned project and knowledge reads;
- semantic identities, hierarchy, relationships, and graph projections;
- exact PDF evidence, coordinates, and document streaming;
- proposed and approved authority separation;
- proposal hashing, review decisions, and audit history;
- graph layout/rendering adapters that do not own semantics.

Existing UI behavior, CSS, component boundaries, and navigation are not
preserved merely because they are implemented.

## Required workspace sections

The production workspace must use the prototype's section ownership:

```text
PROJECT VIEWS
01 Main Workflow
02 Project Facts
03 CES Result
04 Changes Done

SOURCE DOCUMENTS
PRD documents and increments
```

The shared project and revision context and the global multi-PRD lens persist
across every section and navigation action.

### Main Workflow

Answers how the accumulated project operates. The backend supplies journey
stages, semantic workflow pages, page order and membership, focused business
questions, actors, intended results, nodes, relationships, contribution
history, evidence, and structural context required by isolation mode.

### Project Facts

Answers what material knowledge exists outside process flow. The backend owns
fact identities, buyer-facing groups, current accumulated values, provenance,
review state, and PRD contributions. The UI must not classify arbitrary source
text into facts.

### CES Result

Answers what engineering-policy conclusions follow from approved Atlas
knowledge and why. CES owns policy applicability and conclusions. Atlas owns
project truth and unresolved project information. Unavailable POL stages are
shown honestly and are never represented by fabricated placeholder results.

### Changes Done

Answers what each PRD established or changed. The backend supplies a semantic
revision delta, change classification, source PRD, evidence, and permanent
current destination. It is not a browser-computed text diff.

### Source Documents

Answers whether Atlas accounted for every material source statement. Every
statement has exact wording, document revision and location, disposition,
destination or reason, review state, and evidence navigation. No material
statement may disappear silently.

## Required cross-cutting contracts

The vertical-slice plan produced by this gate must define authoritative data
for:

- accumulated project revisions and immutable approved predecessors;
- one or more source documents and PRD increments per project;
- stable statement, evidence, semantic destination, and contribution IDs;
- complete statement accounting and disposition totals;
- journey stages and semantic workflow pages;
- Project Fact groups and rows;
- per-PRD semantic change records;
- unresolved questions, contradictions, exclusions, and failed extraction;
- selected-PRD highlight and isolation projections;
- explicitly labelled structural context in isolation mode;
- affected-section and affected-page navigation;
- proposal hash, blockers, approval eligibility, decisions, and history;
- CES result bindings to an exact approved Atlas project and revision;
- stale, blocked, unavailable, and current downstream-result states.

The UI may own display state and interaction. It must not infer semantic
hierarchy, workflow topology, source contribution, statement coverage, change
classification, approval eligibility, or policy applicability.

## Required gap-analysis artifact

Implementation must not begin until this evidence-backed matrix is accepted.
Repository commit references identify the last commit affecting the cited
implementation at Round 1 remediation time.

| Golden UI capability | Current repository evidence | Gap | Required owner | Proposed slice |
| --- | --- | --- | --- | --- |
| Stable project, revision, and authority context | `packages/atlas-knowledge-contracts/src/index.ts` at `0cf1b372`; `apps/atlas-workflow-ui/lib/knowledge-v2.ts` at `5e5d3a2` | One bundle has one revision/lifecycle, but no accumulated predecessor/successor projection or project switcher | Atlas semantic model | REDESIGN-001 |
| Multiple PRDs and contribution identity | V2 bundle `documents` and evidence document IDs at `0cf1b372` | No PRD-increment identity, contribution record, or selected-source projection | Atlas semantic model | REDESIGN-001 |
| Complete source-statement accounting | Semantic concepts and evidence exist at `0cf1b372`; live coverage work is recorded by V2-011G at `a599428` | No stable material-statement inventory, disposition equation, exclusion reason, or permanent destination | Atlas semantic model | REDESIGN-002 |
| Main Workflow overview | Root visualization and module mapping in `packages/atlas-knowledge-contracts/src/index.ts` at `0cf1b372`; assembly at `a599428` | Current root is a graph, not backend-owned journey stages with readable summaries | Atlas semantic model | REDESIGN-003 |
| Semantic workflow pages and paging | Recursive concepts/representations at `0cf1b372`; UI detail at `5e5d3a2` | No workflow-page identity, business question, stage membership, ordering, or affected-page navigation | Atlas semantic model / API projection | REDESIGN-003 |
| Project Facts | Semantic kinds include rules, actors, entities, permissions, and outcomes at `0cf1b372` | No buyer-facing fact projection, grouping, accumulated value, or contribution history | Atlas semantic model / API projection | REDESIGN-004 |
| Changes Done | Revisions and proposal hash exist in `packages/atlas-knowledge-review/src/index.ts` at `d3f7d1a` | No backend semantic delta, change classification, source grouping, or current destination | Atlas review governance | REDESIGN-005 |
| Global multi-PRD lens | No production surface; prototype/context hashes pinned above | No shared selection state, highlight/isolation projection, context classification, or affected identities | Atlas API projection | REDESIGN-006 |
| Exact evidence inspection | Evidence contract at `0cf1b372`; PDF API/viewer and evidence selection at `5e5d3a2` | Strong reusable foundation; missing navigation from every renewed projection and multi-document contribution history | Atlas API projection / Atlas UI | REDESIGN-006 |
| Review subjects and exact proposal approval | `packages/atlas-knowledge-review/src/index.ts` at `d3f7d1a` binds decisions to proposal hash/revision and rejects incomplete subjects | No API/UI for blockers, eligibility, questions, corrections, rounds, or terminal outcome | Atlas review governance | REDESIGN-007 |
| Replacement workspace shell | `apps/atlas-workflow-ui/app/knowledge-workspace.tsx` and `globals.css` at `5e5d3a2` implement the conflicting three-column explorer | Existing layout/navigation must be removed; useful PDF and graph adapters may be retained | Atlas UI | REDESIGN-008 |
| CES Result shell and availability | POL-010 ticket and Policies plan defer production Atlas input | No revision-bound CES projection; UI must show honest unavailable/stale states before POL-010, then trace actual results only when binding/result contracts exist | CES Policies / cross-product integration | REDESIGN-008, REDESIGN-010, REDESIGN-010A |
| Final cross-domain/manual qualification | V2-011G at `a599428` records Safara and synthetic qualification but remains in progress for unrelated live PDFs | Need production-shaped manual checklist, unrelated live projects, legacy removal, and terminal authority publication | Cross-product integration | REDESIGN-009 |

Owners must distinguish Atlas semantic model, Atlas review governance, Atlas
API projection, Atlas UI, CES Policies, and cross-product integration.

The analysis must identify reusable V2 foundations, conflicting authority,
missing contracts, obsolete documentation, fixture limitations, and the actual
terminal review state of claimed completed work.

## Required bounded vertical-slice plan

Round 1 establishes this finite sequence:

| Order | Ticket | Owner | Class | Depends on | Acceptance boundary | Manually verifiable UI outcome |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | ATLAS-REDESIGN-001 Accumulated Project and PRD Contribution Contract | Atlas semantic model | REVIEW_GATE | Accepted REDESIGN-000 | Immutable revision chain, PRD increments, and contribution identities | Project/revision/source context can be inspected without confusing proposed and approved truth |
| 2 | ATLAS-REDESIGN-002 Source Statement Accounting | Atlas semantic model | REVIEW_GATE | Accepted REDESIGN-001 | Every material statement has one visible governed disposition | A source document shows reconciled totals and opens each destination or reason |
| 3 | ATLAS-REDESIGN-003 Journey Stages and Semantic Workflow Pages | Atlas semantic model / API projection | REVIEW_GATE | Accepted REDESIGN-001 and REDESIGN-002 | Backend owns stages, pages, questions, ordering, topology, and evidence | Main Workflow overview and focused pages are navigable and evidence-backed |
| 4 | ATLAS-REDESIGN-004 Project Facts Projection | Atlas API projection | BATCHABLE | Accepted REDESIGN-001 and REDESIGN-002 | Material non-workflow knowledge is grouped without renderer inference | Fact groups, values, provenance, and evidence can be inspected |
| 5 | ATLAS-REDESIGN-005 Changes Done Semantic Ledger | Atlas review governance / API projection | REVIEW_GATE | Accepted REDESIGN-001, REDESIGN-003, REDESIGN-004 | Backend classifies revision changes and permanent destinations | Each PRD's established, clarified, changed, conflicting, or unresolved contribution is traceable |
| 6 | ATLAS-REDESIGN-006 Global PRD Lens and Cross-Section Navigation | Atlas API projection / Atlas UI | REVIEW_GATE | Accepted REDESIGN-003, REDESIGN-004, REDESIGN-005 | Highlight/isolation semantics and structural context are backend-projected consistently | One lens highlights or isolates the same contributions across every implemented section |
| 7 | ATLAS-REDESIGN-007 Exact-Revision Review and Approval Workspace | Atlas review governance | REVIEW_GATE | Accepted REDESIGN-002, REDESIGN-005, REDESIGN-006 | Eligibility, blockers, decisions, hash, rounds, history, and promotion fail closed | The owner can review and approve only one eligible exact proposal |
| 8 | ATLAS-REDESIGN-008 Replacement Production Workspace | Atlas UI | BATCHABLE | Accepted REDESIGN-003 through REDESIGN-007 | Old shell is removed; accepted projections drive the UI Gate layout; CES availability is honest | Complete replacement layout works with evidence and preserved navigation state |
| 9 | ATLAS-REDESIGN-009 Atlas Qualification and Authority Publication | Cross-product integration | REVIEW_GATE | Accepting outcomes for REDESIGN-001 through REDESIGN-008; V2-011G resolved or explicitly superseded here | Safara and unrelated live projects pass automated and manual gates; legacy authority is reconciled | Owner completes the manual checklist and sees the exact approved current Atlas revision |
| 10 | ATLAS-REDESIGN-010 Consumed Atlas Authority Integration | CES Policies / cross-product integration | REVIEW_GATE | Accepted REDESIGN-009 and accepted POL-010 input contract | Consumed Atlas authority, revision, facts, and provenance render while policy results remain honestly unavailable | Owner traces every consumed fact to its Atlas destination, contributing PRD, and exact evidence |
| 10A | ATLAS-REDESIGN-010A Policy Result Projection | CES Policies / cross-product integration | REVIEW_GATE | Accepted REDESIGN-010, accepted POL-011, and accepted POL-012 | Actual governed policy bindings and result states bind to the exact approved Atlas authority without rereading PRDs | Owner traces an actual result through its binding and approved Atlas trigger to exact source evidence |

REDESIGN-009 is the exact renewed Atlas authority gate that permits POL-010 to
perform its dependency check. REDESIGN-010 is deliberately downstream so Atlas
acceptance does not depend circularly on POL-010; REDESIGN-008 must show an
honest unavailable CES state until that integration exists. REDESIGN-010A is a
scoped authority amendment authorized to add actual result behavior only after
accepted POL-011 and POL-012.

### Proposed scoped authority amendment: ATLAS-REDESIGN-R2-REGRESSION-01

The ticket-set Round 2 review found that POL-010 cannot supply the actual policy
result originally assigned to REDESIGN-010. Option A is proposed explicitly:
REDESIGN-010 owns the independently closable consumed-authority view, and the
new bounded REDESIGN-010A owns actual binding/result projection. This amendment
changes no Atlas semantic authority, no REDESIGN-001 through REDESIGN-009
dependency, and no POL-010 unblock condition. It activates only after the
remaining regression-closure review accepts this amendment.

Each slice receives its own ticket, primary implementation commit, acceptance
contract, review evidence, and terminal outcome. A slice creating or changing
authority is `REVIEW_GATE`; a slice only implementing accepted authority may be
`BATCHABLE`.

Every implementation slice must end in production-shaped UI behavior that the
project owner can verify manually and must include:

- semantic contract;
- API or projection contract;
- production UI behavior;
- Safara evidence;
- structurally different evidence where required;
- automated tests and production build evidence;
- manual verification steps;
- candidate and remediation commits;
- terminal review outcome.

## Exact supersession register

No entry activates before the owning redesign gate receives an accepting
terminal outcome. Until then, current authority remains in force and POL-010
remains deferred.

| Conflicting file and section | Preserved requirement | Superseded requirement | Owning slice | Required update | Activation |
| --- | --- | --- | --- | --- | --- |
| `CES_ATLAS_AUTHORITY.md` - Active product authority / Non-authority | Backend-owned semantics, evidence, and clean V2 boundary | UI Gate sources excluded from authority | REDESIGN-009 | Add accepted context/prototype hashes and redesign plan; classify conflicting historical UI text as superseded | REDESIGN-009 acceptance |
| `atlas-knowledge-explorer/README.md` - status, product authority, clean-state rules | V2 semantic model is graph-independent and domain-neutral | V2 plan is the sole active Atlas UI delivery sequence | REDESIGN-000 then REDESIGN-009 | Link redesign as blocking proposed gate now; record final supersession/closure at publication | Link on REDESIGN-000 remediation; authority changes on REDESIGN-009 acceptance |
| `CES-GF-ATLAS-V2-008-interactive-workspace.md` - Outcome, Scope, Acceptance | Exact evidence, backend graph ownership, accessibility, project isolation | Permanent Main Workflow and existing three-column shell | REDESIGN-008 | Mark layout clauses superseded by accepted redesign while retaining reusable evidence clauses | REDESIGN-008 acceptance |
| `CES-GF-ATLAS-V2-011-semantic-decomposition.md` - Expected UI result | Recursive semantic knowledge and graph projections | Existing Explore / Main Workflow / PDF layout remains | REDESIGN-008 | Replace UI-result authority reference; retain semantic architecture | REDESIGN-008 acceptance |
| `CES-GF-ATLAS-V2-011F-knowledge-api-workspace.md` - Outcome and Scope | Recursive API, ancestry, evidence, and representations | Established three-column layout and permanently visible Main Workflow | REDESIGN-008 | Reclassify as reusable implementation history, not renewed UI authority | REDESIGN-008 acceptance |
| `CES-GF-POL-010-atlas-fact-input-contract.md` - Depends on / D01 | POL-010 consumes only accepted revision-pinned Atlas facts and fails closed | Accepted ATLAS-V2-007 alone satisfies the Atlas dependency | REDESIGN-009 | Require accepted REDESIGN-009 publication and identify its exact contract/revision evidence | REDESIGN-009 acceptance |
| `policies/README.md` - P10 and POL-010 deferral paragraphs | POL-010 and beyond remain blocked by untrusted Atlas | ATLAS-V2-007 is the sufficient named unblock condition | REDESIGN-009 | Point the P10 dependency and deferral decision to accepted REDESIGN-009 authority | REDESIGN-009 acceptance |
| `tickets/greenfield/README.md` - CES Atlas / Atlas production gate | Atlas remains evidence-gated and legacy runtime must be removed | Atlas V2 is the sole active delivery order and V2-009 is the final production gate | REDESIGN-000 then REDESIGN-009 | Link proposed blocking redesign now; make REDESIGN-009 the final renewed production authority when accepted | Link on REDESIGN-000 remediation; authority changes on REDESIGN-009 acceptance |

## Acceptance contract

This redefinition gate may be accepted only when:

- the project owner confirms the UI Gate context and pinned prototype are the
  intended product rails;
- authority conflicts and exact supersession actions are recorded;
- the current repository gap matrix is complete and evidence-backed;
- required backend data is defined for every prototype section and global
  interaction without encoding visual-only details;
- one finite dependency-ordered vertical-slice ticket plan is recorded;
- every proposed slice has an owner, review class, acceptance boundary, and
  manually verifiable UI outcome;
- POL-010 remains deferred until the final Atlas authority gate is accepted;
- no sample Safara value is promoted into generic production semantics; and
- the stopping condition below is accepted.

Acceptance of this ticket authorizes the bounded plan. It does not accept the
future implementation or make the current Atlas surface authoritative.

## Review protocol

This ticket follows the established CES dependency-aware bounded protocol.

### Round 1 - sole broad discovery review

Round 1 reviews the proposed authority, supersession list, gap matrix, required
data surfaces, slice boundaries, dependency order, classifications, and manual
acceptance coverage. Every blocking finding receives one stable ID of the form
`ATLAS-UI-R1-BLOCKER-NN` and a precise closure condition.

Round 1 is the only broad discovery pass. New preferences that do not expose a
false claim, unsafe authority boundary, missing acceptance requirement, or
regression become deferred items or new tickets.

### Remediation

Remediation is limited to recorded Round 1 blockers. Each correction identifies
its commit and the blocker it closes. Remediation must not silently enlarge the
ticket or restart product discovery.

### Round 2 - closure only

Round 2 checks closure of recorded blockers and regressions caused by their
remediation. It does not repeat broad discovery. A genuinely new blocking fact
must identify the exact acceptance claim it invalidates; otherwise it is
deferred.

### Terminal outcome

The ticket ends with exactly one established outcome:

```text
ACCEPTED
NOT ACCEPTED
ACCEPTED WITH DEFERRED ITEMS
```

`Implemented`, `Completed`, visual similarity, and passing tests are not
terminal review outcomes.

## Review ledger

- Candidate commit: `efd2c54d16c0aa14113238b0167dc384d150c444`
- Required gap matrix: accepted by Round 2
- Required vertical-slice plan: accepted by Round 2
- Round 1 findings: `ATLAS-UI-R1-BLOCKER-01` through
  `ATLAS-UI-R1-BLOCKER-06`, plus `ATLAS-UI-R1-IMPORTANT-01`, recorded in
  `../../../feedback/CES_ATLAS_REDESIGN_REVIEW_efd2c54.md`
- Remediation commit(s): `259ee18` (Round 1 blockers 01-06 and Important-01)
- Round 2 closure: `ACCEPTED` for remediation commit `259ee18` and
  remediation-record commit `29a2b70`, recorded in
  `../../../feedback/CES_ATLAS_REDESIGN_ROUND2_REVIEW_29a2b70.md`
- Terminal outcome: `ACCEPTED`
- Accepted prototype content hash:
  `sha256:ec5e25ea3f2a98fd8ec1130af59e59371f0b410c1a51f059560772043cc13505`

## Stopping condition

Redefinition stops when this ticket receives a terminal outcome. An accepting
outcome freezes the rails and finite slice plan; later ideas require a new
ticket or explicit authority revision and do not reopen this gate informally.

Atlas replacement work stops when every accepted slice is complete, the manual
acceptance checklist in `ATLAS_UI_MANUAL_GATE_CONTEXT.md` passes in the
production-shaped UI, legacy UI authority is removed, and the final Atlas gate
receives a terminal outcome. Only then may POL-010 perform its dependency check
against the exact accepted Atlas contract, revision authority, and publication
evidence.

## Explicit non-goals

- Implementing the replacement UI in this ticket.
- Copying bundled prototype code into production.
- Freezing the prototype's sample values, card fields, counts, or policy
  outcomes as universal contracts.
- Resuming POL-010 before Atlas acceptance.
- Reopening already accepted POL authority unrelated to the Atlas boundary.
- Introducing an unlimited feedback or aesthetic-polish loop.

# CES-GF-ATLAS-REDESIGN-000 - Atlas Manual Verification Workspace Redefinition

**Status:** Proposed - awaiting Round 1 review
**Review class:** REVIEW_GATE
**Depends on:** ATLAS-V2-011 semantic foundation; project-owner UI direction
recorded in `UI Gate/ATLAS_UI_MANUAL_GATE_CONTEXT.md`
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

## Product authority proposed by this gate

Upon an accepting terminal outcome, amend `CES_ATLAS_AUTHORITY.md` to include:

1. `UI Gate/ATLAS_UI_MANUAL_GATE_CONTEXT.md` as authority for workspace
   information architecture, section intent, manual verification behavior,
   multi-PRD behavior, cross-section navigation, and product boundaries.
2. `UI Gate/atlas-incremental-prd-ux(2).html`, pinned by content hash at
   acceptance, as the golden behavioral and layout example.

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

Implementation must not begin until this ticket contains or links one reviewed
matrix with these columns:

| Golden UI capability | Current repository evidence | Gap | Required owner | Proposed slice |
| --- | --- | --- | --- | --- |

Owners must distinguish Atlas semantic model, Atlas review governance, Atlas
API projection, Atlas UI, CES Policies, and cross-product integration.

The analysis must identify reusable V2 foundations, conflicting authority,
missing contracts, obsolete documentation, fixture limitations, and the actual
terminal review state of claimed completed work.

## Required bounded vertical-slice plan

Round 1 must accept or correct a finite sequence covering at least:

1. accumulated multi-PRD project and contribution authority;
2. Main Workflow stages and semantic pages;
3. Project Facts and Changes Done;
4. source-statement accounting and unresolved dispositions;
5. global PRD lens and cross-section navigation;
6. exact-revision review and approval workspace;
7. replacement production UI shell and evidence interaction;
8. CES Result integration, beginning with POL-010's consumed authority;
9. Safara and structurally different non-Safara qualification;
10. legacy UI removal, documentation reconciliation, and final Atlas gate.

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

- Candidate commit: pending
- Required gap matrix: pending
- Required vertical-slice plan: pending
- Round 1 findings: pending
- Remediation commit(s): pending
- Round 2 closure: pending
- Terminal outcome: pending
- Accepted prototype content hash: pending

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

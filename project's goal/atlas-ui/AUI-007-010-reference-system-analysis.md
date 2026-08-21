# AUI-007–AUI-010: Reference-system analysis

**Source reviewed:** [`atlas-incremental-prd-ux.html`](../atlas-incremental-prd-ux.html)  
**Applies to:** AUI-007 through AUI-010.  
**Decision:** This document is the shared implementation baseline for the remaining
project-workspace destinations. It supplements the approved AUI-006 analysis; it
does not reopen that frozen checkpoint.

## 1. The reference is one workspace system

The reference is not four independent screens. Its root component owns a project
workspace, a single source-document lens, destination/page state, selected
workflow node, expanded fact, and source-document accounting modal. Workflow,
Facts, CES Result, and Changes Done consume the same accumulated model.

| Shared state | Owner | Required behaviour |
| --- | --- | --- |
| Current project | URL/fixture scenario | Every record and destination resolves through the same `projectId`. |
| PRD selection | shared workspace controller | Selection persists when moving between all four destinations. |
| Lens mode | shared workspace controller | `highlight` retains accumulated context; `isolate` shows selected contributions while retaining essential orientation/context anchors. |
| Destination/detail selection | shared workspace controller | Routes or equivalent shared navigation preserve the project and lens; a detail does not reset either. |
| Open fact, workflow node, source accounting | destination/controller state | The selected record opens a traceable reading and may cross-link to its actual related destination. |

No destination may create an independent PRD filter, fake counts, local record
set, or route. Fixture relationships—not display strings—drive every link.

## 2. Common source-accounting interaction

The reference's source-document accounting modal is a project-wide verification
surface. For a selected PRD it shows statement count, placed statements,
unresolved questions, each statement's destination, and a route to that
destination. It also lets a user make that PRD the global lens. AUI-007 and
AUI-008 must supply enough fixture provenance and destination metadata for this
surface; AUI-010 validates it end-to-end.

## 3. Destination contracts

| Destination | User question | Structure and interaction | Lens behaviour |
| --- | --- | --- | --- |
| Project Facts | What stable, non-workflow knowledge does Atlas hold? | Numbered fact **groups** (scope, people/responsibilities, constraints, protection, outputs, commitments); expandable cards show accumulated values plus contributing PRDs and dates. | Highlight marks contributing groups/rows while retaining all groups. Isolation limits to selected contributions; a clear empty state explains how to restore context. |
| Changes Done | How did the accumulated model evolve? | Timeline **grouped by PRD increment**, with date, increment identity, count, kind, description, real destination, and an open-destination action where one exists. | Highlight retains complete history and marks selected increments; isolation contains selected PRD groups only. |
| CES Result | What policy obligations are covered, unresolved, or need review? | Policy cards with policy ID, status, conclusion, policy rule, source PRDs, and destination link. Summary counts are derived from the displayed result set. | Same shared lens and contextual/isolation distinction. Links retain it when opening a workflow/fact destination. |
| Source accounting | Where did a PRD statement land? | Modal statement list with source count arithmetic, status, destination, and cross-link. | Selecting "use this PRD as global lens" updates the single shared lens. |

### Facts are not individual fact rows

The reference presents a group as the durable information unit: group number,
title, summary, contributing sources, and multiple accumulated-value rows. A
fact row still needs a stable identity and evidence, but it is displayed within
its group. This prevents the screen from becoming a flat source-note list.

### Changes are not a flat change feed

An increment is the primary reading unit. Each item says whether the increment
established, clarified, expanded, superseded, or left a question; its
destination must identify a resolvable workflow, fact group/row, CES item, or
explicit project-level destination.

### CES remains interpretive, not prescriptive

CES cards distinguish source-grounded policy from Atlas's conclusion and the
capability need. `covered`, `needs-review`, `out-of-scope`, and `unresolved`
are distinct states. Approval gates are a separate product contract from the
reference's CES display and must not make the result imply a solution design.

## 4. Required fixture graph refinement

The current fixture types are too flat for these surfaces. Before AUI-007 UI is
completed, introduce fixture-owned records for fact groups/rows, changes with a
typed destination, CES-to-workflow/fact links, and PRD statement accounting.
Every evidence record must resolve its `documentId`; every destination must
resolve in the same workspace or be explicitly `project`/`unresolved`.

## 5. Cross-ticket consequences

| Ticket | Required correction to its contract |
| --- | --- |
| AUI-007 | Build facts and changes from the shared controller and refined fixture graph; include both lens modes, grouped reading units, evidence, and destination navigation. |
| AUI-008 | Consume the same lens/provenance/cross-link contract; derive CES summaries from visible items and keep approval state separate. |
| AUI-009 | Validate the *connected* workspace states: lens popover, isolate/context states, expanded facts, timeline, CES cards, accounting modal, cross-links, and narrow layouts. |
| AUI-010 | Walk the complete project graph and prove every source statement and destination is resolvable without local invented data. |

## 6. Implementation guardrail

The uncommitted initial AUI-007 screen is intentionally not a checkpoint. It
uses a screen-local PRD lens and flat records, so it must be replaced before
the ticket can be validated or committed. The approved AUI-006 implementation
remains frozen; subsequent work adapts around its existing contract unless a
demonstrated regression requires a separate approved change.

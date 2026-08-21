# AUI-006: Main Workflow reference analysis

**Source reviewed:** [`atlas-incremental-prd-ux.html`](../atlas-incremental-prd-ux.html)

**Purpose:** This is the implementation reading of the Main Workflow section.
It records the reference's information model and interaction states so AUI-006
is built from the actual product intent rather than a visual approximation.

## 1. The question Main Workflow answers

`Main Workflow` is the project-navigation destination. It is not the user's
main question. The opening page answers:

> How Safara operates today

It presents Atlas's **current accumulated understanding** of the project. The
heading is therefore the user's entry into the operational model, not merely a
page title above a diagram.

The reference makes three model facts visible with that answer:

- number of major workflows;
- number of semantic workflow pages; and
- number of source PRDs.

These explain the scale of the model before the user explores it.

## 2. Information hierarchy

The Main Workflow area has two levels, plus a global source context.

```
Project
└─ Main Workflow (accumulated behaviour)
   ├─ Ordered major workflows (the operational story)
   │  └─ Grouped semantic workflow pages (the explainable detail)
   └─ Cross-workflow support (not a chronological lifecycle step)
```

### Ordered major workflows

The overview is a major workflow sequence. Numbers show the user what happens
in business order. In the Safara reference the ordered story is:

| Order | Major workflow | Grouped semantic workflows | Major-workflow result |
| --- | --- | --- | --- |
| 01 | Prepare departure | Manage packages; open schedules | A departure can receive registrations |
| 02 | Register pilgrim | Maintain pilgrim; register; create invoice | A pilgrim has a departure and obligation |
| 03 | Complete requirements | Review payment; documents; travel requirements | Requirements can be assessed |
| 04 | Confirm travel readiness | Decide Ready or Blocked | Readiness is explainable |
| 05 | Finalize departure | Finalize and export manifest | Final manifest is a stable snapshot |

Each major workflow is a group boundary, not a single process node. It exposes:

- sequence number;
- title and summary;
- business result;
- number of grouped workflow pages; and
- a route into that group's first semantic workflow page.

The sequence is how a user understands the total operational story at a glance.
The grouped pages keep each business question readable without flattening the
project into one unreadable graph.

### Cross-workflow support

Reporting and activity history are a visible support grouping. They are
important to the accumulated model but do not belong in the 01–05 chronological
sequence. This prevents management oversight and accountability from being
misread as a required lifecycle stage.

## 3. Global project and PRD-lens context

The reference deliberately separates three pieces of state:

1. **Current project** — which project model is being explored.
2. **Current destination/page** — overview, major-workflow group, semantic
   page, Project Facts, CES Result, or Changes Done.
3. **PRD lens** — which source documents are being inspected.

The source lens is global. It is not a local filter inside one workflow card.
It carries through the overview, focused workflow page, evidence selection, and
the other project views.

### Lens modes

| Mode | Meaning | Overview behaviour | Semantic-page behaviour |
| --- | --- | --- | --- |
| All PRDs | Complete accumulated project | All major workflows remain visible | Complete semantic sequence and source history |
| Selected PRDs, contextual | Inspect what selected documents contributed while retaining accumulated context | Affected major workflows and affected-page count are called out; unaffected groups are de-emphasised | Selected node contributions are marked; non-selected nodes remain readable as accumulated context |
| Selected PRDs, isolation | Inspect only selected contributions without losing orientation | Non-contributing major workflows may be hidden where no structure is needed | Selected nodes remain; immediately needed structural nodes remain as labelled context anchors |

When a selected lens is active, the overview must state its impact—how many
semantic pages are affected—and offer a direct route to the first affected page.
The product also provides previous/next affected-page navigation. When an
isolated page has no contribution, it explains how to change the lens instead
of showing an unexplained empty space.

## 4. Overview behaviour

The overview contains, in reading order:

1. accumulated-understanding context label;
2. the operational question and explanation;
3. model counts;
4. selected-PRD impact explanation when applicable;
5. numbered major workflow sequence, with major workflow result and grouped
   page count;
6. cross-workflow support;
7. guidance on entering and continuing through the semantic pages.

Opening a numbered major workflow enters its first relevant semantic page. The
overview does not ask the user to study the complete diagram first.

## 5. Focused semantic workflow page

A focused page answers one business question. It is a reading and verification
surface, not a shrunken version of the whole project journey.

### Persistent page navigation

The reference provides a semantic pager containing:

- return to overview;
- previous and next workflow page controls;
- a page picker grouped by major workflow;
- current page position within the accumulated model; and
- when the contextual lens is active, affected-page count and affected-page
  previous/next controls.

Changing page must retain the selected PRD and isolation state.

### Page content order

1. Major-workflow group and semantic-page position.
2. Semantic workflow title and its scope explanation.
3. People involved and expected business result.
4. Source-history strip: each contributing PRD and its date; selected sources
   are visibly marked.
5. The business question and sequential semantic nodes.
6. Node-level provenance reading.
7. Continuation to neighbouring workflow pages.

### Semantic nodes

Each node represents a meaningful step and exposes:

- its number within the workflow;
- step title;
- explanation of the operational meaning;
- any selected PRD source chip; and
- its semantic kind where relevant: activity, decision, successful outcome, or
  warning/outcome.

The sequence is a readable explanation of the business question. Selected PRD
contributions, accumulated context, and structural context anchors use a legend
so source filtering does not become ambiguous.

## 6. Provenance interaction

Selecting a semantic node opens a paired reading directly below the sequence:

| Atlas reading | Source reading |
| --- | --- |
| **What Atlas understood** — the interpreted operational meaning | **Exact PRD wording** — quote, source document, page, and relevant PRD chips |

Before a node is selected, the placeholder explicitly tells the user that node
selection will reveal Atlas's interpretation and the exact source wording.
This makes verification the central workflow action rather than a detached
metadata panel.

## 7. Responsive and usability behaviour

- At narrower desktop widths, the major-workflow sequence remains readable via
  controlled horizontal access or reduced column count; ordering is preserved.
- At tablet widths, the sidebar becomes icon-led, support and page metadata
  reflow, and the evidence reading becomes vertical rather than losing either
  half of the provenance comparison.
- At phone widths, major workflows stack in numerical order; the semantic pager
  keeps previous/next and page-picker access; the focused sequence remains
  horizontally readable where necessary; lens controls remain available in a
  viewport-safe popover.
- Source history may scroll horizontally on constrained widths, but source
  identity and active-source state remain visible.

## 8. Implementation implications for AUI-006

The current temporary Main Workflow component is not an acceptable foundation
because it hard-codes one generic workflow and omits the model above. The
replacement must be fixture-driven with at least:

- ordered major-workflow groups;
- several semantic workflow pages distributed across groups;
- a separate support grouping;
- PRD contribution mappings at group, page, and node level;
- source dates and node evidence;
- selected, contextual, isolated, empty, and node-selected states; and
- pager state that retains the lens.

The reference's older colours and visual treatment are not to be copied
blindly. Its hierarchy, model vocabulary, state transitions, and source-grounded
behaviour are the AUI-006 contract.

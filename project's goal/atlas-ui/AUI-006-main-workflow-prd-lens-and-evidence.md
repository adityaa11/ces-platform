# AUI-006: Main Workflow, PRD lens, and evidence

- **State:** approved
- **Review batch:** BATCH-05
- **Depends on:** AUI-003, AUI-004
- **Baseline:** UI/UX Prototype PRD 5.1, 6, 9.1, 9.3

## Outcome

Make accumulated PRD understanding easy to navigate and verify through a
journey overview, focused semantic workflow pages, a global PRD lens, and
node-level evidence.

## BATCH-05-00 prerequisite: shared shell and fixture selection

Before continuing the workflow surface, refactor the shared shell into reusable sidebar, project-switcher, and profile-menu components. Use typed fixture project IDs for selection and route availability; remove UI-local project records. Restore outside-click, Escape, focus, and upward-popover behavior, then validate expanded/collapsed, open/closed, light/dark, desktop/mobile, and selected/unselected states.

- **BATCH-05-00 state:** approved — passing review at `50b0151`; this prerequisite is frozen.
- **BATCH-05 state:** awaiting_review — Main Workflow model, lens, navigation, and evidence.

## Reference-derived Main Workflow model

The implementation must follow the functional model in
[`atlas-incremental-prd-ux.html`](../atlas-incremental-prd-ux.html). Its
information architecture and interactions are the reference for this ticket;
its older visual styling is not a mandate.

The complete implementation reading is maintained in
[`AUI-006-main-workflow-reference-analysis.md`](AUI-006-main-workflow-reference-analysis.md).
Implementation may not resume until its required model and interaction states
are represented in fixtures and reusable components.

### 1. Ordered major workflows containing grouped semantic workflows

- **Major workflow sequence:** the overview is the ordered operational story of
  the project. Major workflows carry sequence numbers (for example 01 through
  05) so a user can understand what happens first, next, and later before
  opening any detail. These numbers express business order; they are not
  decoration or arbitrary card identifiers.
- **Grouped semantic workflows:** each numbered major workflow scopes a related
  group of workflow pages. For example, a preparation major workflow can group
  package and departure-schedule workflows, while a requirements major
  workflow can group payment, document, and travel workflows. The major
  workflow shows the group's purpose, expected business result, and count of
  workflow pages, then opens the group at its first relevant semantic page.
- **Support outside the sequence:** cross-workflow support has its own support
  grouping (for example reporting and activity history). It remains visibly
  connected to the operational model without being misrepresented as another
  chronological major workflow.
- **Page intent and naming:** *Main Workflow* is the project-navigation label,
  not the overview page's primary message. The overview heading must state the
  accumulated operational understanding in plain language (for example,
  “How Safara operates today” for the Safara fixture), preceded by the context
  label “Current accumulated understanding.” The supporting copy explains that
  the overview is an entry to the accumulated model and that semantic workflow
  pages carry the detail. The heading is deliberately prominent because it answers the
  user's first question before any controls or diagram are scanned.
- **Focused semantic workflow page:** one business question at a time. It
  contains the people involved, expected business result, source history, and
  a short sequence of meaningful workflow steps. It must never require the
  user to read an all-project graph.
- **Navigation:** the user can move back to the overview, move between pages,
  or choose a page from a major-workflow-grouped page picker without losing
  their PRD lens state.

### 2. Project, navigation, and global PRD-lens context

- Project selection, workflow navigation, and PRD filtering are separate
  concerns. Changing the current project does not conflate project choice with
  an active source filter.
- *Main Workflow* identifies the accumulated-behaviour area in project
  navigation. Breadcrumbs retain the path through project, Main Workflow,
  major workflow group, and current semantic page so the user knows both where
  they are and how they arrived there.
- The global PRD lens communicates its current mode in the product header:
  **All PRDs**, a selected set of individual PRDs, or isolated selected PRD
  data. This state is retained while opening major workflows, pages, nodes, and pager
  destinations.

- The lens applies at overview and focused-page levels, not only inside a
  single card. It presents all accumulated PRDs and selected individual PRDs.
- With selected PRDs, the overview reports the affected journey stages and
  workflow-page count, visually distinguishes affected stages, and offers a
  direct route to the first affected page.
- In contextual mode, selected-document contributions are highlighted while
  accumulated understanding remains readable.
- In isolation mode, unrelated contributions may be suppressed, but the
  structural nodes needed to make a selected contribution intelligible remain
  as clearly labelled context anchors. An empty result explains what to do
  next; it must not become a blank canvas.

### 3. Overview content and states

- The opening view carries an accumulated-understanding heading, a plain
  language explanation, and a count of major workflows, semantic workflow
  pages, and source PRDs. Those counts are model facts, not decorative metrics.
- Each numbered major workflow is an entry to its grouped semantic workflows.
  It exposes its sequence number, title, explanatory summary, business result,
  workflow-page count, and a clear “Open chapter” affordance. Major workflows
  form the reading order; their placement is not an arbitrary grid of projects
  or generic cards.
- When the lens is active, affected major workflows are called out and
  unaffected accumulated workflows remain visually de-emphasised in contextual
  mode. In isolation mode, non-contributing major workflows are removed only
  when they add no required structure.
- Cross-workflow support is represented as a separate supporting layer—such
  as reporting, activity history, and accountability—not misrepresented as a
  chronological major workflow.
- The overview closes with an explicit instruction and entry route explaining
  that a major workflow opens its first semantic page and that the page navigator can
  continue across the accumulated workflow model.

### 4. Focused semantic page and navigation

- A sticky semantic pager provides: return to overview; previous and next
  workflow pages; a major-workflow-grouped page picker; and, when a contextual PRD lens
  is active, previous/next affected-page navigation and an affected-page count.
- The detail heading declares the major workflow group and page position in the accumulated
  model, then names the semantic workflow page. It also explains the page's
  boundary: one business question rather than the complete project graph.
- The page identifies who is involved and the business result before the
  sequence is read. These are semantic fields from Atlas's understanding, not
  visual labels attached after the fact.
- The focused diagram is a sequential reading of the business question. Nodes
  may represent normal activity, decision, or successful outcome; each carries
  a step number, title, explanatory note, and visible selected-source chips
  when relevant. Lens states use a legend so visual emphasis is interpretable.

### 5. Source-grounded verification is part of the workflow page

- Every workflow page has a source-history strip showing contributing PRDs and
  their dates, with active lens documents visibly marked.
- Selecting any meaningful workflow step reveals a paired evidence reading:
  **what Atlas understood** and the **exact PRD wording**, including source
  document and page. Before selection, an intentional placeholder explains
  this verification action.
- Source evidence is a workflow action, not a detached or generic side panel.

### 6. Data and scale contract

- Fixtures must model an ordered major-workflow sequence, multiple grouped
  semantic workflow pages per major workflow, a separate support grouping, PRD
  contributions per page and node, and node-level provenance. The interface
  must be data-driven; it may not hard-code one major workflow and three steps
  as the product shape.
- The reference demonstrates five stages and twelve pages. The fixture may use
  a representative set only if it still exercises multiple major workflows,
  grouped pages, ordered reading, lens impact, source history, isolation
  context, and evidence selection.
- The Safara fixture may demonstrate the model, but Atlas labels and reusable
  components stay domain-neutral.

## Visual direction

- **Hierarchy:** project context and PRD lens first; accumulated journey model
  second; one focused workflow and embedded provenance reading third.
- **Density:** use a legible stage map and focused semantic sequence, with
  enough metadata to answer why a page exists, what it establishes, and where
  it came from. Avoid empty canvas space and generic cards that communicate no
  operational model.
- **Navigation behavior:** selecting a project unlocks project destinations.
  Selecting a journey stage opens a stage chapter; selecting a workflow page
  opens its detail without resetting the selected PRDs or isolation state.
- **Responsive composition:** desktop may show evidence in two columns;
  narrow layouts stack the same source-grounded reading below the focused
  sequence while preserving its order and controls.

## Scope

- Implement the Main Workflow journey overview and focused semantic workflow pages.
- Implement PRD selection, highlighting, impact accounting, and isolation while retaining necessary structural context.
- Implement workflow-node evidence that reveals interpretation, exact quote, source document, and page.
- Implement reusable journey-stage, semantic-pager, workflow-node, PRD-chip,
  source-history, lens-impact, and evidence-reading components.

## Acceptance criteria

- Users enter a stage-based overview before navigating to a focused semantic
  workflow page; no all-project graph is rendered.
- The overview conveys stage purpose, business result, semantic-page count,
  and cross-workflow support.
- A selected PRD's contribution is visibly distinguishable from accumulated
  context, reports the affected-page count, and can be isolated without losing
  required context anchors.
- The page picker and previous/next controls retain the active lens state.
- The user can inspect source evidence for representative workflow nodes.
- Every focused page clearly presents role(s), business question, expected
  result, source history, node sequence, Atlas interpretation, exact quote,
  source document, and page.

## Validation

- Exercise overview and focused-page states with all PRDs, selected PRDs, and
  isolated PRDs; verify impact accounting and context anchors.
- Check evidence interaction, pager state retention, and source history at
  desktop and mobile widths.

# Atlas UI/UX Prototype Review

**Branch:** `codex/new-atlas`  
**Reviewed head:** `e4db5c5` - `Refine Atlas responsive workspace UI`  
**Review scope:** UI/UX prototype only

This review intentionally ignores missing backend behavior and sections or buttons that are not wired yet when that is clearly acceptable for the prototype.

The focus is on:

- currently wired routes;
- navigation behavior;
- state continuity;
- PRD Lens behavior;
- role-state consistency;
- relationship navigation;
- approval behavior;
- interaction consistency;
- accessibility-related interaction;
- prototype form validation; and
- UI/UX clarity.

---

## 1. Overall Assessment

The current Atlas direction is substantially more coherent than the earlier prototypes.

The workspace now has a clear mental model:

```text
Project
  -> Main Workflow
  -> Project Facts
  -> CES Result
  -> Changes Done
```

The following areas are already strong:

- The workspace navigation is consistent.
- Main Workflow, Project Facts, CES Result, and Changes Done feel like different views of one accumulated project model.
- The PRD Lens is prominent and understandable.
- Detailed workflow pages avoid loading the entire project graph at once.
- Source evidence is connected directly to workflow and fact reading.
- The sidebar preserves the active PRD Lens when moving between the four primary workspace destinations.
- Mobile navigation includes focus management, Escape handling, body scroll locking, and focus trapping.
- Dialogs include focus containment, Escape handling, backdrop dismissal, and focus restoration.

I would **not redesign the current UI architecture**.

The main issues are now interaction correctness and state continuity.

---

# 2. Findings

## BLOCKER-001 - User role scenario is lost when opening a project

**Location:** Project Library and project switcher

### Observation

The Editor and Viewer fixture scenarios can unexpectedly become the Owner scenario after opening a project.

For example:

```text
/demo?scenario=viewer-ready
```

The user clicks:

```text
Open project
```

The generated link becomes:

```text
/demo?projectId=safara&view=workflow
```

The `scenario` parameter is no longer present.

The demo route defaults to:

```text
owner-ready
```

when no scenario is supplied.

This means the prototype can visually change a Viewer or Editor into an Owner simply by opening the project.

### Why this matters

This is not a backend authorization problem.

It is a prototype routing problem.

However, it materially misrepresents Atlas role behavior during a review.

A reviewer could see:

```text
Viewer library
  -> Open project
  -> Owner workspace
```

which makes the prototype's RBAC story unreliable.

### Requested outcome

Preserve the active `scenario` parameter whenever navigating:

- from Project Library to a project;
- through the project switcher; and
- between any fixture-dependent route.

Example:

```text
/demo?scenario=viewer-ready&projectId=safara&view=workflow
```

### Priority

**Blocker**

---

## IMPORTANT-001 - CES highlight mode behaves partly like isolation

**Location:** CES Result / PRD Lens

### Observation

When any PRD is selected, CES items are filtered by selected PRD source IDs.

This happens even when the PRD Lens is in:

```text
Highlight selected PRDs
```

mode.

The expected behavior for highlight mode is:

```text
Keep accumulated context visible
+
emphasize selected PRD contributions
```

The current CES behavior is closer to:

```text
Hide unrelated CES items
```

which is isolation behavior.

### Requested outcome

Use the following behavior:

#### All PRDs

```text
Show all CES items
```

#### Highlight selected PRDs

```text
Show all CES items
Mark or prioritize CES items affected by selected PRDs
Keep unaffected accumulated context visible
```

#### Isolate selected PRDs

```text
Show only CES items affected by selected PRDs
Retain only necessary structural context
```

### Priority

**Important**

---

## IMPORTANT-002 - CES PRD Lens matching is incomplete

**Location:** CES Result / PRD Lens

### Observation

CES matching currently relies mainly on:

```text
sourcePrdIds
```

However, the fixture model also contains relationships such as:

```text
linkedFactRowIds
linkedFactIds
relatedWorkflowIds
```

A CES result may be relevant to a selected PRD because its owning fact row was affected by that PRD, even when the CES item's direct `sourcePrdIds` do not contain the selected PRD.

### Why this matters

The intended relationship is:

```text
Main Workflow
  -> Project Fact
  -> CES Result
```

The PRD Lens should respect that relationship.

### Requested outcome

A CES item should count as affected when either:

```text
1. The CES item directly references the selected PRD
```

or:

```text
2. The CES item is grounded in a fact row affected by the selected PRD
```

### Priority

**Important**

---

## IMPORTANT-003 - Related workflow links do not open the actual related workflow

**Location:** Project Facts and CES Result

### Observation

A Project Fact row may contain multiple:

```text
relatedWorkflowIds
```

However, the UI currently:

```text
- shows only the first related workflow;
- links to Main Workflow generally; and
- does not open the specific workflow referenced by the fact.
```

Example expected relationship:

```text
Project Fact
  -> Main Workflow
      -> Menentukan status Siap atau Terhambat
```

Current behavior is closer to:

```text
Project Fact
  -> Main Workflow overview
```

### Additional issue

The related workflow link does not preserve the active PRD Lens.

### Requested outcome

The link should preserve:

```text
projectId
scenario
selected PRDs
lens mode
workflow target
```

For example:

```text
/demo?scenario=owner-ready&projectId=safara&view=workflow&workflowId=readiness&prd=safara-increment-02&lens=isolate
```

Also consider exposing all relevant workflow relationships when a fact genuinely applies to multiple workflows.

### Priority

**Important**

---

## IMPORTANT-004 - Changes Done destinations are visually precise but route generically

**Location:** Changes Done and Source Accounting

### Observation

The fixture model contains explicit target IDs.

Examples:

```text
targetId: registration
targetId: readiness
targetId: payments
targetId: ces-evidence-retention
```

The UI also shows precise destination labels such as:

```text
Main Workflow / Menentukan status Siap atau Terhambat
```

However, the route builder mainly uses the destination type:

```text
workflow
facts
ces
changes
```

and ignores the actual target ID for workflow and CES destinations.

So this:

```text
Open destination
Main Workflow / Menentukan status Siap atau Terhambat
```

can still land on:

```text
Main Workflow overview
```

instead of:

```text
Menentukan status Siap atau Terhambat
```

### Why this matters

Atlas is fundamentally about traceability.

A destination that looks precise should behave precisely.

### Requested outcome

Introduce routable semantic targets such as:

```text
workflowId
factId
factRowId
cesItemId
changeId
```

Then resolve them in the destination page.

Example:

```text
/demo?projectId=safara&view=workflow&workflowId=readiness
```

### Priority

**Important**

---

## IMPORTANT-005 - Approval state does not survive navigation

**Location:** Main Workflow, Project Facts, CES Result

### Observation

Approval states are stored in local component state.

For example:

```text
Approve Atlas understanding
```

updates only the currently mounted component.

If the user:

```text
1. approves Atlas understanding;
2. moves to another workspace destination;
3. returns to Main Workflow;
```

the approval may reset to the original fixture value.

The same issue applies to CES approval.

### Why this matters

The approval represents a project-level decision, not a local visual toggle.

The prototype should communicate:

```text
Atlas understanding has been approved
```

as persistent project state.

### Requested outcome

Store prototype approval state at a shared workspace level.

Possible prototype-only approaches:

```text
shared React context
URL state
session-level fixture state
top-level workspace state
```

A production backend is not required for this fix.

### Priority

**Important**

---

## IMPORTANT-006 - The PRD Lens has duplicate implementations

**Location:** Workspace top bar

### Observation

Main Workflow and CES Result use the shared:

```text
PrdLensControl
```

Project Facts and Changes Done use another locally implemented Lens control.

The two implementations already behave differently.

The shared component supports:

```text
- Escape dismissal;
- outside-click dismissal;
- consistent open/close behavior.
```

The local Project Facts / Changes implementation does not fully share those behaviors.

### Why this matters

The PRD Lens is supposed to be a global workspace-level control.

A global control should not behave differently depending on the destination.

### Requested outcome

Use one shared PRD Lens component across:

```text
Main Workflow
Project Facts
CES Result
Changes Done
```

If Project Facts and Changes Done need:

```text
Source accounting
```

add it as an optional action or extension to the shared component.

### Priority

**Important**

---

## IMPORTANT-007 - Create Project does not require a PDF selection

**Location:** New Project dialog

### Observation

The Create Project flow visually asks for:

```text
Project name
PRD PDFs
```

However, the submit button is effectively controlled only by whether the project name exists.

A user can therefore:

```text
enter a project name
select zero PDFs
click Create and process
```

### Why this matters

The UI tells the user that a project is created from PRD PDFs.

The interaction should reflect that statement.

This does not require backend validation.

### Requested outcome

Track selected files in prototype state.

Enable:

```text
Create and process
```

only when:

```text
project name is valid
AND
at least one valid PDF is selected
```

Optional prototype validation states could include:

```text
No PDF selected
Unsupported file type
PDF selected
Multiple PDFs selected
```

### Priority

**Important**

---

## IMPORTANT-008 - Share dialog state is not project-specific

**Location:** Project Library / Share dialog

### Observation

The Share button is available on multiple project cards.

However, collaborator state comes from:

```text
workspace.memberships
```

which represents the current workspace fixture.

This means opening Share for a different project can still show the same collaborator list.

Changes to membership state are also shared across those project cards.

### Why this matters

Even in a UI-only prototype, the Share dialog should visually belong to the selected project.

Otherwise a reviewer may interpret collaborators from one project as belonging to another.

### Requested outcome

Scope simulated membership data by project.

For example:

```text
project A
  -> memberships A

project B
  -> memberships B
```

This can remain entirely fixture-driven.

### Priority

**Important**

---

## OPTIONAL-001 - Whole project card behaves clickable but is not a semantic interactive element

**Location:** Project Library

### Observation

A document-level click listener makes most of a ready project card behave like a clickable card.

However, the `<article>` itself is not keyboard-focusable.

The explicit:

```text
project title link
Open project link
```

remain accessible, so the flow is not blocked.

### Requested outcome

Choose one consistent interaction model.

#### Option A - Explicit links only

Keep:

```text
Project title
Open project
```

as the only navigation targets.

Do not make the entire card visually imply clickability.

#### Option B - Whole-card navigation

Use a semantic whole-card link pattern with proper keyboard behavior.

### Priority

**Optional**

---

## OPTIONAL-002 - Account settings looks wired but routes to Projects

**Location:** Profile menu

### Observation

The profile menu contains:

```text
Account settings
```

but currently routes to:

```text
/demo
```

which is the Projects view.

### Why this matters

Missing routes are acceptable in this prototype.

However, a control that looks wired but routes to the wrong destination is more confusing than an intentionally disabled placeholder.

### Requested outcome

Until Account Settings exists:

```text
disable it
remove it
or mark it as unavailable
```

Do not route it to Projects.

### Priority

**Optional**

---

## OPTIONAL-003 - Next affected workflow can skip the first affected page

**Location:** Main Workflow detail pager

### Observation

In highlight mode, the user can navigate:

```text
Previous affected workflow
Next affected workflow
```

If the currently open workflow is not in the affected list:

```text
findIndex()
```

returns:

```text
-1
```

The current calculation can cause:

```text
Next affected
```

to start from the second affected workflow rather than the first.

### Requested outcome

Use explicit behavior:

```text
if current page is unaffected:
  Next affected -> first affected page
  Previous affected -> last affected page
```

### Priority

**Optional**

---

# 3. Main UX Concern: Relationship Navigation

The most important improvement after the role-state blocker is **semantic relationship navigation**.

Atlas increasingly communicates this chain:

```text
Source statement
  -> Atlas interpretation
  -> Project Fact
  -> Main Workflow
  -> CES Result
  -> Changes Done
```

This is the correct direction.

The problem is that several controls visually communicate a precise relationship while navigating only to a broad destination.

Example:

```text
Related main workflow
04 - Menentukan kesiapan keberangkatan
Menentukan status Siap atau Terhambat ->
```

The user reasonably expects that link to open:

```text
Menentukan status Siap atau Terhambat
```

not merely:

```text
Main Workflow
```

The same issue exists in:

```text
Changes Done
Source Accounting
CES destinations
Fact relationships
```

This is particularly important for Atlas because:

```text
traceability is the product
```

The good news is that the fixture model already contains the identities needed to implement this.

Examples include:

```text
workflow IDs
fact IDs
fact row IDs
CES IDs
relatedWorkflowIds
destination.targetId
```

So this is primarily a routing and UI-state improvement, not a redesign.

---

# 4. PRD Lens State Normalization Issue

There is another subtle PRD Lens behavior worth fixing.

A user can be in:

```text
isolate mode
```

with one selected PRD.

If they deselect the final PRD, the state can become:

```text
selectedPrdIds = []
mode = isolate
```

The UI mostly behaves like:

```text
All PRDs
```

because the pages calculate isolation using both:

```text
selected PRDs exist
AND
mode is isolate
```

However, selecting another PRD later can unexpectedly reactivate isolation.

### Recommended normalization

Whenever selected PRDs becomes empty:

```text
selectedPrdIds = []
mode = highlight
```

Also remove:

```text
lens=isolate
```

from the URL.

---

# 5. Why Existing Tests Can Still Pass

The current rendered tests are useful, but they mostly verify top-level route behavior.

For example, a test can confirm that a Changes Done link navigates to:

```text
view=workflow
```

while still not checking whether the link reaches:

```text
workflowId=readiness
```

Similarly, Editor and Viewer tests can confirm that their libraries render correctly without following:

```text
Open project
```

So the role-scenario reset can remain undetected.

### Recommended additional interaction tests

Add tests for:

```text
Viewer library
  -> Open project
  -> Viewer workspace remains Viewer
```

```text
Editor library
  -> Open project
  -> Editor workspace remains Editor
```

```text
Changes Done destination
  -> opens exact workflow target
```

```text
Project Fact related workflow
  -> opens exact workflow target
  -> preserves active PRD Lens
```

```text
CES highlight mode
  -> unrelated accumulated CES context remains visible
```

```text
CES isolate mode
  -> unrelated CES items are hidden
```

```text
Approve Atlas understanding
  -> change destination
  -> return
  -> approval remains approved
```

---

# 6. Recommended Fix Order

I recommend fixing the current prototype in this order:

```text
1. Preserve role/scenario state across project navigation
2. Add precise semantic destination routing
3. Correct CES PRD Lens highlight/isolate behavior
4. Preserve PRD Lens on all relationship links
5. Make Atlas/CES approval state persistent across workspace navigation
6. Consolidate the PRD Lens into one shared component
7. Require PDF selection in Create Project
8. Scope Share state per project
9. Normalize empty PRD Lens state
10. Clean up optional interaction inconsistencies
```

---

# 7. Final Assessment

The current Atlas UI architecture should be kept.

The core structure is already strong:

```text
Projects
  -> Main Workflow
  -> Project Facts
  -> CES Result
  -> Changes Done
```

The next pass should make the existing UI behavior more truthful and deterministic rather than redesigning the product.

The highest-value improvements are:

```text
role continuity
-> precise cross-links
-> correct PRD Lens semantics
-> persistent approval state
-> one shared PRD Lens
-> prototype form/state cleanup
```

After those fixes, the wired Atlas prototype should feel substantially more reliable during review without changing its current information architecture.

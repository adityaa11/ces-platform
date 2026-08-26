# Atlas UI/UX Prototype PRD

**Status:** Draft  
**Date:** 21 August 2026  
**Scope:** High-fidelity responsive prototype only, backed exclusively by local fixtures

## 1. Purpose

Create an interactive UI/UX prototype of Atlas that communicates the full user journey and the product's source-grounded, approval-governed experience. The prototype simulates system activity; it does not implement production authentication, PDF extraction, S3 storage, CES reasoning, email delivery, or authorization services. All prototype states and content must come from local fixture data.

## 2. Product experience

Atlas is a domain-neutral PRD-understanding workspace. The prototype must help a user see what a project’s PRDs say, what Atlas understood, how PRDs changed over time, and which baseline-awareness items CES Policy identifies.

Safara may be used as realistic example content, but the visual language, copy, and information architecture must remain domain-neutral.

### 2.1 Simplicity preference

Atlas is intended to feel straightforward for Gen X users and for anyone who prefers clear, low-friction software. This is a usability preference, not an assumption about a person's ability or technical experience.

The prototype must therefore:

- use familiar labels and plain language instead of unexplained jargon;
- make the next primary action obvious on every screen;
- prefer visible labels beside unfamiliar icons and provide accessible tooltips where space is limited;
- reveal advanced detail progressively rather than placing every option on the first screen;
- show clear status, progress, success, error, and approval feedback;
- use readable type, high-contrast hierarchy, generous touch targets, and predictable navigation;
- ask for confirmation only for consequential actions such as deleting a project, removing access, or approving a result; and
- keep each flow focused on one decision at a time, with clear ways to go back or cancel.

### 2.2 Design-quality baseline

Atlas must feel like a considered, modern professional workspace—not a generic dashboard, tutorial exercise, or collection of default cards and controls. Before designing or materially changing a product surface, the prototype owner must identify relevant, current UI/UX patterns from credible products or design-system guidance and apply a deliberate direction appropriate to Atlas’s job.

- Workspace and navigation patterns should take cues from established collaborative-product interfaces such as Figma and Linear, while retaining Atlas’s own domain-neutral visual language.
- The design must prioritize a clear hierarchy, purposeful density, restrained visual noise, meaningful empty space, and obvious primary actions; decorative borders, oversized empty regions, arbitrary pills, and disconnected controls are not substitutes for hierarchy.
- Components and layout decisions must have a documented purpose. A control may not be introduced merely because a generic dashboard pattern includes one.
- Prototype review requires visual inspection of the rendered experience at relevant desktop, tablet, and mobile sizes. Passing build, lint, or source-level checks alone is not evidence of acceptable UI/UX quality.
- When the team lacks a validated direction for a new surface, research and document the preferred pattern before implementation rather than filling the gap with an improvised UI.

### 2.3 Prototype design mode: reference-led, composition-first

Atlas UI/UX prototype work uses a v0-inspired delivery mode. The prototype owner starts from a coherent, product-quality visual composition rather than assembling isolated controls and correcting them afterward.

- Establish a brief visual direction for each screen or flow: hierarchy, density, surface system, navigation pattern, primary action, and responsive behavior.
- Research and name appropriate product-interface references when a pattern is not already approved; adapt their interaction logic and visual hierarchy rather than copying isolated decoration.
- Compose the complete visible state before declaring a screen ready: header, navigation, content hierarchy, cards, empty/loading states, overlays, and primary actions must read as one system.
- Use shared semantic tokens and reusable components for all recurring UI. A local shortcut that creates visual drift is not acceptable.
- Treat the rendered browser result as the design artifact. Source code, lint, and tests support it but never substitute for visual judgment.
- Prefer calm, immediately understandable controls and concise content over novel interaction or dashboard clutter, consistent with the Gen X preference.

## 3. Users and access states

The prototype must represent these user-facing roles:

- **Owner:** creates projects, uploads PRDs, shares projects, manages collaborators, and approves Atlas and CES results.
- **Editor:** can access a project explicitly shared with their email and make permitted project changes.
- **Viewer:** can access a project explicitly shared with their email and inspect content without editing.

The prototype must make clear that projects are private by default and only the owner or invited users can access them.

## 4. Required screens and flows

### 4.1 Authentication and account shell

- Sign up screen
- Sign in screen
- Password-reset entry state
- Persistent user profile control with avatar, name, and email
- Profile menu containing account settings and a clear Logout action

### 4.2 Home / project library

The home screen must resemble a calm Figma or Google Drive-style project library. It shows projects the user owns or that have been shared with them, including:

- project name;
- PRD count;
- collaborator indicator;
- latest activity; and
- processing or approval state.

The primary action is **New project**.

### 4.3 Create project and upload PRDs

The user must be able to move through a prototype flow that:

1. enters a project name;
2. selects or drag-and-drops one or more PDF PRDs;
3. confirms project creation; and
4. sees Atlas begin processing.

A persistent notification bar in the bottom-left communicates the processing lifecycle:

- Uploading documents
- Extracting text and structure
- Identifying workflows and facts
- Building the accumulated project model
- Ready to review
- Needs attention / failed

The project remains visible in the library while processing.

### 4.4 Sharing

The owner must be able to open a Share panel, enter an email, choose Viewer or Editor access, review existing collaborators, change access, and remove access. The shared-project state must be visible in the library.

## 5. Project workspace

The project workspace must provide four primary navigation destinations:

1. **Main Workflow**
2. **Project Facts**
3. **CES Result**
4. **Changes Done**

All four destinations must read from the same accumulated project model. They are
different reading views over the same source-grounded relationships, not four
independent lists. The workspace must keep three kinds of text visibly distinct:

- **Original PRD wording:** the exact source text written in the selected PRD,
  including the source document and page. This is authoritative for displayed
  source statements, workflow steps, fact rows, change evidence, and CES
  grounding.
- **Atlas interpretation:** a clearly labelled explanation of how Atlas grouped
  or understood the source wording. It must never be presented as if it were a
  quotation from the PRD.
- **CES knowledge:** the policy, obligation, concern, capability need, coverage
  state, or unresolved decision produced from approved project facts. It must be
  visibly separate from both the source fact and Atlas interpretation.

The visual composition must use compact scope cards, expandable detail, readable
rows, and direct links. It must not turn the accumulated model into a wall of
paragraphs or a grid of unrelated generic cards.

### 5.1 Main Workflow

**Goal:** answer “How does this project operate today?” through the major
workflow scope and the detailed workflows that make up each scope. The overview
is a compact operational map, not a full-project narrative or an all-in-one
process graph.

The hierarchy is:

```text
Main Workflow
  -> Major workflow
       -> Detailed workflow
            -> Ordered workflow steps
```

#### Major workflow overview

The opening view must show the current accumulated operational model in business
order. Each major workflow is a scope card or sequence entry that makes the size
and boundary of the work scannable before the user opens detail. It must show:

- a stable business-order number and source-grounded title;
- a concise scope statement using the original PRD wording where available;
- the detailed workflows included in that scope, so the user can see what the
  card covers;
- the expected business result of completing the scope;
- the roles or ownership involved when the PRD states them;
- contributing PRDs, increments, and dates;
- the number of detailed workflow pages as a model fact; and
- a clear action to open the first detailed workflow in that scope.

The card must communicate the scope of the work without requiring the user to
read every source paragraph. A short Atlas summary may orient the user, but the
expanded or linked detail must expose the original PRD statements and evidence.
Cross-workflow support such as reporting or activity history may be shown as a
separate supporting layer; it must not be misrepresented as a chronological
major workflow when the PRD treats it as support.

#### Detailed workflow

Opening a major workflow leads to focused semantic workflow pages. Each page
answers one business question and shows:

- the major workflow and page position in the accumulated model;
- the business question, using the PRD’s wording where it exists;
- the people or roles involved;
- the expected business result;
- a short, ordered sequence of meaningful workflow steps or decisions;
- the contributing PRD history and active PRD-lens state;
- links to the related Project Facts and the workflow’s CES baseline awareness;
- a selected-step evidence reading with Atlas interpretation and exact PRD
  wording, source document, and source page; and
- previous, next, and grouped-page navigation without losing the PRD Lens.

The detailed page is the bridge between “what happens” and “what must be
accounted for.” It may show a compact summary of linked fact groups and CES
coverage, but the full fact and CES reading remains in its dedicated destination.

### 5.2 Project Facts

**Goal:** display non-workflow knowledge as grouped, source-grounded facts that
can be referenced from the related workflow. Project Facts is a knowledge list,
not a flat source-note feed.

The hierarchy is:

```text
Project Facts
  -> Fact group
       -> Fact statement or row
            -> Related Main Workflow
                 -> Major workflow -> Detailed workflow
```

Each fact group is a durable reading unit and must show:

- a stable group number and source-grounded title;
- the scope of the group in a concise summary;
- its accumulated fact rows, with the original PRD wording as the displayed
  source statement where available;
- contributing PRDs, increments, dates, and source evidence;
- one or more related Main Workflow paths; and
- an expandable detail state so source wording and provenance are available
  without making the initial view a sea of text.

Representative groups include scope, people and responsibilities, constraints,
information protection, outputs, and commitments. The set must remain
data-driven so other projects can produce different groups.

Every fact row must retain a stable identity and be linkable to the major and/or
detailed workflow it informs. A fact may support multiple workflows, and a
workflow may reference multiple fact groups; links must resolve to the actual
fixture relationship rather than a display-only label. The row may include an
Atlas interpretation, but the exact source statement, source PRD, and page must
remain directly reachable.

### 5.3 CES Result

**Goal:** display the grouped project facts together with the CES output that was
derived from each approved fact. CES Result must have the same fact-grouped
reading shape as Project Facts, enriched with baseline-awareness output. It must
not become a separate, flat policy catalogue.

The hierarchy is:

```text
CES Result
  -> Project Fact group
       -> Project Fact statement or row
            -> Related Main Workflow
                 -> Major workflow -> Detailed workflow
            -> CES Result item(s)
```

The canonical relationship is:

```text
Main Workflow -> Detailed workflow -> Project Fact -> CES Result
```

The required cross-view links are:

- **Project Facts -> Main Workflow:** open the major and detailed workflow
  paths that use the fact;
- **Project Facts -> CES Result:** open the CES items evaluated against the
  fact; and
- **CES Result -> Project Facts -> Main Workflow:** show the fact grounding
  first, then the workflow context that gives the result its operational scope.

This relationship makes CES baseline awareness deterministic per workflow. A
detailed workflow owns or references its project facts; each fact owns the CES
items evaluated against it; the major workflow inherits the combined awareness
of its detailed workflows. If a fact is related to multiple workflows, the same
CES item may be surfaced in each workflow’s baseline summary, but it keeps one
stable identity and one source-grounded result in CES Result.

Each CES fact group or row must retain the Project Facts reading and add:

- the approved fact statement that grounds the result;
- the related major and detailed workflow path;
- applicable Policy identity and rule;
- the Policy obligation;
- CES conclusion;
- related Concern;
- Capability Need, expressed as what the solution must be able to account for;
- coverage state: covered, needs-review, out-of-scope, or unresolved;
- any unresolved decision;
- source PRD revisions and direct evidence; and
- links back to the fact, workflow, and source reading.

Source facts, Atlas interpretations, and CES knowledge must be visually
separable. CES must explain what matters, what is covered, what needs review,
and what remains unresolved. It must not prescribe technologies, architecture,
vendors, or implementation methods.

### 5.4 Changes Done

**Goal:** show how the accumulated project model evolved as each PRD increment
was added. Changes Done is a history of model changes, not a second current-state
workflow or a flat activity feed.

The hierarchy is:

```text
Changes Done
  -> PRD increment
       -> Change item
            -> Affected Main Workflow, Project Fact, CES Result, or project-level item
```

The increment is the primary reading unit. Each increment group must show its
identity, date, source document, number of changes, and a compact timeline of
items that were:

- established;
- clarified;
- expanded;
- superseded; or
- left unresolved.

Each change item must show the original PRD statement or exact supporting quote,
the source page, a clearly labelled Atlas change interpretation, and its real
destination in the accumulated model. Destinations must resolve to the affected
major or detailed workflow, fact group or row, CES item, project-level
destination, or an explicit unresolved-decision state. A user must be able to
move from a change to its destination and understand how that destination
changed without losing the active PRD Lens.

The change view must preserve the connection among increment, source wording,
affected fact, affected workflow, and affected CES result. It must not invent a
change summary that cannot be traced to a PRD increment.

## 6. Cross-workspace interactions

### Global PRD lens

The PRD Lens is the single workspace-level controller for what data is shown in
Main Workflow, Project Facts, CES Result, and Changes Done. It must be shared by
all four destinations; no destination may create its own PRD filter, independent
record set, or invented count. Changing the destination, opening detail, or
following a relationship must preserve the active lens.

The lens supports one or more selected PRDs and two display modes:

| Lens state | Display contract |
|---|---|
| **All PRDs** | Show the complete accumulated project model. This is the default state. |
| **Highlight selected PRDs** | Keep the complete accumulated model readable, while marking and visually prioritizing records that contain a contribution from a selected PRD. Unaffected context remains available but is subordinate. |
| **Isolate selected PRDs** | Show records with a selected contribution and retain only the structural context needed to understand their place in the model. Context anchors must be labelled; unrelated source-derived text is not shown. |

Lens matching must be deterministic:

| Destination | A record is affected when | Required result |
|---|---|---|
| **Main Workflow** | A major workflow, detailed workflow, or workflow step has a source contribution from a selected PRD. A parent remains in context when a visible child is affected. | Mark affected major workflows, pages, and steps; show affected-page counts; keep the major-to-detailed reading order and links to related facts and CES. |
| **Project Facts** | A fact group or fact row has a source contribution from a selected PRD. | Mark contributing groups and rows; retain each row’s related Main Workflow path; in isolation, keep the fact-group heading when one or more rows remain visible. |
| **CES Result** | A CES item has a direct source-PRD contribution or is grounded in a fact row that is affected by a selected PRD. | Keep the item under its owning fact group; show whether the match comes from the CES source or the linked fact; retain links to the fact, Main Workflow, and evidence. |
| **Changes Done** | The change belongs to a selected PRD increment. | Show the selected increment and its change items; retain each item’s destination to the affected workflow, fact, CES item, or unresolved decision. |

In highlight mode, visible counts and emphasis must be derived from the affected
records while the accumulated context remains readable. In isolate mode, visible
counts must be derived from the isolated result set; structural anchors do not
count as selected contributions. If no contribution exists, show an intentional
empty state explaining how to change the lens or restore all PRDs. Isolation must
never produce a blank canvas or change the underlying relationships.

### Source evidence

For representative workflow nodes, project facts, CES items, and changes, the user must be able to inspect:

- what Atlas or CES understood;
- the exact supporting PRD wording;
- the source document; and
- the source page.

When the interface uses a normalized UI language, a translation or concise
navigation label may be provided for orientation, but it must not replace the
original source wording. Source text remains the authoritative displayed value
for a fact statement, workflow step, change evidence, and the fact grounding a
CES result. Any paraphrase must be labelled as Atlas interpretation or CES
conclusion, never as source text.

### Approval states

The prototype must depict two clear approval gates:

1. **Approve Atlas understanding** after reviewing workflows, facts, evidence, and changes.
2. **Approve CES baseline** after reviewing policy coverage, concerns, capability needs, and unresolved decisions.

## 7. Responsive behavior

The prototype must be deliberately designed for desktop, tablet, and mobile.

- Desktop uses a persistent navigation rail and may show reading and evidence panels side by side.
- Tablet uses collapsible or adjustable panels without losing important context.
- Mobile uses a compact header and focused drawers or sheets for navigation, PRD selection, evidence, sharing, and profile controls.
- Provenance, approval, and CES coverage must remain accessible on all screen sizes; information may be stacked but not removed.

## 8. Security-aware visual constraints

The prototype must use patterns compatible with a strict Content Security Policy:

- no dependency on uncontrolled third-party embeds or widgets;
- no interaction pattern that assumes unsafe script execution; and
- clear private-project and permission states around sharing and document access.

## 9. Prototype implementation boundary

### 9.1 Fixture-only data

The prototype must use fixtures only. It must make no production network requests and must not depend on a live authentication provider, database, S3-compatible bucket, extraction service, CES knowledge service, email service, or realtime service.

Fixtures must simulate the states needed to review the experience, including:

- signed-in owner, editor, and viewer states;
- owned and shared projects;
- an empty project library and a populated library;
- selected PDF files and upload validation states;
- each processing notification state: uploading, extracting, modeling, ready, needs attention, and failed;
- multiple incremental PRDs and global PRD-lens selections;
- Atlas understanding awaiting approval and approved;
- CES Result awaiting approval and approved;
- covered, needs-review, out-of-scope, and unresolved-decision CES states; and
- sharing invitations, existing collaborators, changed permissions, and removed access.

Fixture records must preserve realistic relationships and stable identifiers among project, source PRD, workflow node, project fact, CES result, change item, collaborator, and approval state. Source quotes and page references must remain available in the fixture model so the evidence experience is real to the reviewer even though extraction is simulated.

### 9.2 Monorepo structure

The prototype UI must become the future Atlas application rather than being discarded or rebuilt in a separate prototype app. A monorepo is used only to isolate the temporary fixture layer from that future-facing UI. The planned boundary is:

```text
apps/
  atlas/                 # Atlas UI/UX that will later be wired to live services
packages/
  atlas-fixtures/        # temporary data source, scenarios, and fixture contracts
```

`pnpm` is the required package manager and workspace tool. The following boundaries are required:

- `apps/atlas` contains the actual responsive screens, flows, navigation, components, and interaction states intended for the future product.
- `apps/atlas` consumes prototype data only through `packages/atlas-fixtures`.
- Components must not embed large project records, source quotes, policy results, or mock user data directly in their source files.
- `packages/atlas-fixtures` owns realistic sample scenarios and the data contracts consumed by the UI.
- The fixture package is the sole temporary boundary: when full Atlas services are ready, its fixture exports are replaced by live data adapters with the same UI-facing contracts.
- Wiring live authentication, project access, storage, extraction, Atlas interpretation, CES evaluation, and progress updates must not require rebuilding or migrating the UI into another application.

### 9.3 Workspace and container hygiene

- Use `pnpm` for dependency management, workspace configuration, scripts, and lockfiles.
- If Docker is used for local development, bind-mount only source files needed by the container.
- Store downloaded dependencies, package-manager caches, and generated container downloads in named Docker volumes, not in the repository root or another host-root directory.
- Do not commit dependency directories, Docker volumes, or package caches.

### 9.4 Reusable component design

The Atlas UI must be composed from reusable, presentational components with explicit inputs and events. Reuse is required where the same interaction or information pattern appears in more than one screen, including:

- application shell, navigation, profile menu, and responsive drawers;
- project rows/cards, status badges, avatars, and empty states;
- upload controls and processing notifications;
- PRD chips, source-history indicators, and evidence panels;
- workflow nodes, fact cards, CES policy/concern/capability cards, and change rows;
- approval controls, coverage states, confirmation dialogs, and sharing controls.

Components must receive data and callbacks through UI-facing contracts rather than reading fixture records directly. Page-level composition may select a fixture scenario, but reusable components must be agnostic to whether their data eventually comes from fixtures, a database, S3-backed documents, Atlas extraction, or CES Policy.

Avoid premature abstractions: create a shared component when a pattern is repeated or when it represents a stable product concept. Keep business/data orchestration at the page or feature boundary and keep presentational components focused on rendering and accessible interaction.

### 9.4.1 Global component consistency

For every new or changed page-level UI pattern, the prototype owner must first determine whether it is a stable, global component or layout pattern. A pattern is global when it appears, or is expected to appear, across more than one route, state, or screen size—for example headers, navigation rails, profile controls, buttons, panels, dialogs, and status indicators.

- Global patterns must use one reusable component or shared layout primitive rather than copied markup or route-specific styling.
- The component must define its visual contract: relevant size, spacing, alignment, position, interaction behavior, and responsive behavior.
- Every use of that component must remain consistent with that contract across its routes and breakpoints. A difference is allowed only when it is an intentional, named variant with an explicit input and is validated across all uses.
- Before a checkpoint is presented for review, the prototype owner must compare every affected use of a changed global component in the rendered UI; passing a single route or a source-level check is insufficient.

### 9.5 Future-service simulation

Where the UI represents a future service, it must label and simulate the result rather than claim the service is live:

| Future service | Prototype behavior |
|---|---|
| Authentication and logout | Local fixture session and role switching |
| S3 PDF storage | Local file-selection and private-file states |
| PDF extraction | Timed or user-controlled fixture processing stages |
| Atlas model building | Predefined workflow, fact, evidence, and change scenarios |
| CES evaluation | Predefined policy, concern, capability-need, coverage, and decision scenarios |
| Email sharing | Invitation and membership state simulated from fixtures |

## 10. Prototype acceptance criteria

The prototype is ready for review when a user can:

1. navigate sign-up, sign-in, profile, and logout states;
2. create a named project and select PDF PRDs;
3. understand upload and processing progress through the bottom-left notification;
4. view processing, ready, needs-attention, and approval states;
5. navigate all four project destinations;
6. use the PRD lens to compare or isolate document contributions;
7. inspect representative source evidence;
8. understand Atlas and CES approval gates;
9. inspect policy coverage, concerns, capability needs, and unresolved decisions;
10. share a project by email and understand Owner, Editor, and Viewer states; and
11. complete the same core journey on desktop, tablet, and mobile layouts.
12. run the complete experience from local fixtures without a production-service dependency.
13. change fixture scenario or user role without rewriting screen components.
14. demonstrate that the only planned replacement for production wiring is the fixture data boundary, not the Atlas UI application.
15. reuse stable visual and interaction patterns through data-agnostic components without coupling them to fixture records.
16. allow a user to complete core flows using plain language, visible navigation, clear feedback, and progressive disclosure rather than specialist knowledge or hidden controls.
17. maintain global UI consistency by using shared components with declared visual and responsive contracts across every relevant route and state.
18. meet the design-quality baseline through researched, deliberate, and visually reviewed workspace patterns rather than generic scaffold UI;
19. understand the current operating model from compact major-workflow scope cards and open each card into its detailed workflows;
20. navigate from a Project Fact group or row to its related major and detailed workflow;
21. inspect CES Result in the same fact-grouped structure, including the fact grounding, related workflow, CES output, coverage state, and unresolved decision where applicable;
22. see the same fact-to-workflow-to-CES relationship represented in the detailed workflow’s baseline-awareness context;
23. move between workflow, fact, CES, and change destinations without losing the selected PRD Lens or source context; and
24. verify that source-derived displayed text is traceable to the original PRD wording, with Atlas interpretation and CES knowledge clearly labelled as separate layers.

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

### 5.1 Main Workflow

- Start with a compact journey overview.
- Lead users to focused semantic workflow pages rather than one large process graph.
- Each workflow page shows a business question, roles, expected result, source history, a focused sequence of workflow nodes, and an evidence panel.

### 5.2 Project Facts

- Present non-workflow knowledge as first-class, source-grounded fact groups.
- Include representative groups such as scope, people and responsibilities, constraints, information protection, outputs, and commitments.

### 5.3 CES Result

- Show representative applicable Policies, obligations, linked facts, Concerns, Capability Needs, coverage states, and unresolved decisions.
- Clearly distinguish CES knowledge from source facts.
- Provide direct paths to supporting workflow, fact, and source evidence.
- Do not present CES as prescribing technologies or implementation choices.

### 5.4 Changes Done

- Group representative changes by PRD increment.
- Show established, clarified, expanded, superseded, and unresolved items.
- Allow navigation from a change to its affected workflow, fact, CES item, or project-level destination.

## 6. Cross-workspace interactions

### Global PRD lens

The prototype must include a global PRD lens that allows a user to select one or more PRDs. It must visually support:

- highlighting selected-document contributions in their accumulated context;
- optionally isolating selected-document contributions while preserving necessary structural context;
- identifying affected workflow pages, facts, CES items, and changes; and
- clearly communicating whether all PRDs or a selected PRD view is active.

### Source evidence

For representative workflow nodes, project facts, CES items, and changes, the user must be able to inspect:

- what Atlas or CES understood;
- the exact supporting PRD wording;
- the source document; and
- the source page.

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

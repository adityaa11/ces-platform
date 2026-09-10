---
name: frontend-awareness
description: >
  Apply a project-agnostic frontend design intelligence baseline for refactoring
  existing UI and creating new UI. Use for tasks involving layout, information
  hierarchy, visual language, components, responsive behavior, interaction,
  accessibility, or frontend consistency. For new projects or projects without
  a stable design system, first derive a project-specific visual contract before
  implementation. Do not invoke for backend-only changes.
---

# Frontend Awareness

## Objective

Produce frontend work that is visually coherent, beautiful, usable, accessible,
and consistent without relying on improvised aesthetic judgment.

The governing principle is:

> Accumulate globally. Project locally.

Global frontend design awareness is reusable.

Project-specific visual language is derived from the product context.

Screen-specific implementation loads only the relevant context.

---

# 1. Determine project maturity

Classify the project into one of these states.

## STATE 1 - NO ESTABLISHED VISUAL LANGUAGE

Use when:

- the project is new
- there is no stable design system
- existing UI is inconsistent
- the user explicitly requests a new visual direction
- existing UI should not be treated as a visual authority

Before implementation, read:

- references/visual-language-derivation.md
- references/project-visual-contract.md
- references/visual-baseline.md
- references/theme-typography.md

Create or update a project visual contract.

Then continue into MODE B - BUILD NEW UI or MODE A - REFACTOR EXISTING UI.

## STATE 2 - ESTABLISHED VISUAL LANGUAGE

Use when:

- the project already has a coherent design system
- a project visual contract already exists
- established visual ancestors are reliable

Reuse the existing contract.

Do not derive a new visual language unless the task explicitly requires a redesign.

---

# 2. Determine task mode

Use exactly one primary task mode.

## MODE A - REFACTOR EXISTING UI

Use when:

- improving an existing screen
- beautifying existing UI
- reorganizing information
- fixing visual inconsistency
- improving responsive behavior
- improving accessibility
- consolidating local UI patterns
- migrating old UI toward the project visual contract

Read:

- references/visual-baseline.md
- references/refactor-existing-ui.md
- relevant sections of references/information-patterns.md
- references/review-gate.md

When the product supports light/dark themes or the task changes typography,
also read references/theme-typography.md.

Also read the project visual contract when one exists.

Do not silently change product semantics.

## MODE B - BUILD NEW UI

Use when:

- creating a new project UI
- creating a new screen
- creating a new workflow
- creating a new frontend feature
- introducing a new information surface

If the project has no stable visual language, derive one first.

Then read:

- references/visual-baseline.md
- references/build-new-ui.md
- relevant sections of references/information-patterns.md
- references/review-gate.md
- the project visual contract

When the product supports light/dark themes or the task changes typography,
also read references/theme-typography.md.

Do not invent a separate visual language per screen.

---

# 3. Global frontend reasoning model

Before styling, determine:

1. What product is this?
2. Who uses it?
3. How frequently do they use it?
4. What information do they primarily manipulate?
5. What is the consequence of misunderstanding the UI?
6. Is the product task-oriented, knowledge-oriented, operational, analytical,
   creative, transactional, or consumer-facing?
7. What is the appropriate density?
8. What must visually dominate?
9. What must remain quiet?
10. What interaction model best fits the product?

For new projects, these answers feed the project visual contract.

---

# 4. Information meaning comes before components

Do not begin from:

- "What cards should I add?"
- "What dashboard layout should I use?"
- "What UI library component should I use?"
- "What would look modern?"

Begin from:

- what the information means
- what the user must understand
- what the user must do
- what deserves visual priority

Then select an information pattern.

Examples:

- ordered process -> Workflow Sequence
- accumulated knowledge -> Knowledge List
- historical increments -> Timeline
- policy assessment -> Review Console
- evidence -> Evidence Panel
- project collection -> Entity Library
- operational telemetry -> Operational Console
- editable structured records -> Data Workspace
- configuration -> Settings Form
- metrics -> Metric Summary
- scope filtering -> Scope Lens

Read only the relevant sections of references/information-patterns.md.

---

# 5. Visual language is project-scoped

Global design awareness MUST NOT force every project to look the same.

A project visual language may vary by:

- product type
- audience
- platform
- usage frequency
- interaction intensity
- information density
- risk
- brand character
- environmental context

Examples:

An enterprise knowledge workspace may be:
- calm
- precise
- medium density
- low decoration

A live streaming control app may be:
- dark
- real-time
- status-dominant
- higher contrast

A restaurant HRIS may be:
- friendly
- direct
- task-oriented
- mobile-conscious

The global skill determines quality.

The project visual contract determines personality.

---

# 6. Reuse the project system

Before creating new styles or components:

1. inspect the project visual contract
2. inspect design tokens
3. inspect theme tokens and theme switching behavior
4. inspect typography roles and type tokens
5. inspect shared UI components
6. inspect reliable visual ancestors
7. reuse established information patterns

Prefer:

existing component
> extension of existing component
> new reusable component
> local one-off control

A new component should represent a reusable semantic or interaction concept.

---

# 6A. Theme and typography are system-level

When light and dark themes are supported, treat them as one product with two
readable presentations. Use semantic theme tokens for surfaces, text, borders,
actions, statuses, focus, and overlays. Preserve the same information
hierarchy and interaction meaning in both themes.

When refining typography, define roles rather than scattered declarations.
Each role should account for font size, styling, spacing, thickness, line
height, case, and wrapping. At minimum, distinguish page titles, section
titles, body copy, compact body copy, metadata, labels, ordinals or metrics,
and controls.

Metadata may be subordinate, but it must remain legible. Repeated numbers,
dates, and steps should use a consistent role and aligned numerals when
comparison matters. Do not shrink text or add tracking to hide a composition
problem.

Read references/theme-typography.md for the detailed contract and verification
checklist.

---

# 7. Beauty is structural

A beautiful interface should primarily achieve beauty through:

- information hierarchy
- composition
- typography
- spacing
- alignment
- proportion
- restrained surfaces
- consistent geometry
- semantic color
- meaningful elevation
- progressive disclosure

Decoration is secondary.

---

# 8. Hard quality constraints

Do NOT introduce without project-specific justification:

- random colors
- random spacing
- random radii
- random font sizes
- one-off theme overrides
- inconsistent type roles across related screens
- nested card stacks
- decorative gradients
- glassmorphism
- neon or glowing UI
- AI sparkles
- excessive pills
- excessive badges
- giant marketing headings inside product workspaces
- tiny interactive controls
- icon-only important navigation
- color-only status communication
- visually unrelated local components
- card-everything layouts
- multiple equally dominant primary actions

---

# 9. Interaction contract

Interactive components MUST expose applicable states:

- default
- hover
- focus-visible
- active
- selected
- disabled
- loading
- success
- error

Async operations SHOULD follow:

idle
-> loading
-> success | error

State changes should be communicated accessibly.

---

# 10. Responsive contract

Responsive design is transformation, not shrinking.

Preserve the hierarchy and task flow while changing composition.

Desktop may use:

- persistent navigation
- split panes
- dense supporting context

Mobile may use:

- drawer navigation
- one primary column
- sheets
- stacked supporting context

Preserve readable type roles during transformation. Allow headings and body
copy to wrap before reducing their size, weight, or spacing below the project
minimum.

The project visual contract may override these defaults when platform needs differ.

---

# 10A. Responsive Fit Contract

For any repeated or bounded component whose usable width changes with the
application shell—such as cards, table regions, navigation groups, forms,
metric tiles, timelines, or panels—derive the layout from available space.
Do not rely only on generic viewport breakpoints or allow a small item count to
stretch component interiors indefinitely.

First determine the current usable width:

```text
available width
= viewport width
− visible persistent shell or chrome width
− container inline padding
− surrounding layout gaps
```

Then define the component's project-specific bounds:

- minimum usable inline size
- maximum comfortable inline size
- gap between siblings
- current item count
- required compact-mode transformation

For a repeated grid, calculate the candidate column count from the minimum
usable size, and never create more columns than there are items:

```text
columns
= min(item count, floor((available width + gap) / (minimum width + gap)))

item width
= min(maximum comfortable width, (available width − total gaps) / columns)
```

This is a reasoning model, not a mandate to hard-code these equations in every
component. CSS grid, container queries, measured layout, or an established
design-system primitive may implement the same contract. The result must:

- account for the active shell state, including expanded, collapsed, hidden,
  or overlay navigation;
- keep items within their readable minimum and comfortable maximum;
- leave surplus space in the parent layout once the item maximum is reached,
  rather than stretching sparse component interiors;
- cap columns by real item count; and
- transform composition before reducing readable type, control targets, or
  semantic spacing below the project minimum.

Pair spatial fit with a content-fit contract. Character limits alone do not
predict rendered width: uppercase, lowercase, mixed case, long unbroken text,
localized copy, and the selected typeface all differ. For every declared
maximum input, verify representative stress cases using the actual component
type roles:

- lowercase, uppercase, and mixed-case values;
- normal multi-word and long unbroken values;
- maximum-length identifiers, labels, and descriptions;
- optional or absent content; and
- every relevant state, permission, and action combination.

Choose containment deliberately by information type. Important identity and
controls must remain fully reachable and usable; use meaningful wrapping,
grouping, progressive disclosure, or a changed composition before using visual
truncation. Do not make ellipsis the default response to valid data. If visual
line limits are necessary, preserve the complete semantic value in an
accessible, discoverable form and make the limit part of the component's
contract.

Record the chosen spatial bounds, content limits, containment strategy, and
shell states in the project visual contract or the component's implementation
notes. Render and inspect the result at representative shell states and widths.

---

# 11. Accessibility baseline

Target WCAG 2.2 AA.

At minimum:

- keyboard operation
- visible focus
- accessible names
- semantic HTML
- sufficient contrast
- non-color state communication
- appropriate labels
- accessible dialogs and popovers
- status communication
- responsive reflow
- reduced-motion respect

Use native semantics first.

Use WAI-ARIA patterns when native HTML is insufficient.

---

# 12. Visual inspection is mandatory when possible

A successful build is not proof of visual quality.

When browser or screenshot tooling is available:

- render the result
- inspect hierarchy
- inspect spacing
- inspect density
- inspect responsive behavior
- inspect interaction states
- inspect light/dark modes when applicable
- inspect the resolved type roles and theme tokens when applicable

The first rendered result is a draft.

Correct visible quality problems before declaring completion.

---

# 13. Final review

Apply references/review-gate.md before completion.

Frontend work is not complete merely because:

- build passes
- lint passes
- tests pass
- TypeScript compiles

It must also conform to:

- project visual contract
- information pattern
- responsive behavior
- interaction quality
- accessibility
- frontend review gate

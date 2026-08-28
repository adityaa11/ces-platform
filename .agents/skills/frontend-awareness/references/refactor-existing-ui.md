# Refactoring Existing UI

## Goal

Improve visual quality, hierarchy, consistency, accessibility, and responsive
behavior while preserving working product semantics.

---

# Step 1 - Determine visual authority

Before refactoring, decide whether the existing UI is:

A. a trustworthy visual ancestor
B. partially trustworthy
C. visually inconsistent and not authoritative

If C, use the project visual contract as the primary authority.

Do not preserve bad styling merely because it already exists.

---

# Step 2 - Inspect before editing

Inspect:

- rendered screen when possible
- parent layout
- affected component
- shared components
- design tokens
- project visual contract
- related screens
- responsive behavior
- tests

---

# Step 3 - Identify dominant information

Classify the screen.

Examples:

- workflow
- knowledge
- chronology
- review
- operational console
- data workspace
- library
- configuration
- form
- media

Use the matching information pattern.

---

# Step 4 - Identify visual debt

Look for:

- weak hierarchy
- excessive cards
- nested containers
- random spacing
- random colors
- random radii
- tiny text
- theme drift between light and dark modes
- inconsistent font size, style, spacing, weight, or line height
- duplicated controls
- inconsistent interaction
- unclear active state
- unclear selected state
- too many badges
- hidden interactions
- weak responsive transformation
- missing empty/error/loading states

---

# Step 5 - Preserve product semantics

Unless explicitly authorized, preserve:

- business behavior
- data behavior
- routes
- permissions
- domain rules
- workflow meaning
- API contracts

A visual refactor is not permission to change product semantics.

---

# Step 6 - Reduce before adding

Order of improvement:

1. remove visual noise
2. establish hierarchy
3. fix composition
4. fix typography
5. fix spacing
6. fix alignment
7. fix semantic surfaces
8. fix interaction states
9. add only necessary visual treatment

If themes or typography are in scope, use references/theme-typography.md while
auditing shared tokens and related screens. Apply the refinement across the
affected role family, not only the annotated element.

---

# Step 7 - Migrate toward the project contract

Refactoring should reduce divergence from the project visual contract.

Prefer convergence over creating screen-specific styling.

---

# Step 8 - Render and inspect

When possible inspect at:

- primary desktop width
- narrow desktop or tablet
- mobile

Also inspect:

- focus
- hover
- selected
- disabled
- empty
- error
- loading
- dark/light when supported
- type roles, resolved computed styles, and theme parity when supported

Do not approve based only on source code.

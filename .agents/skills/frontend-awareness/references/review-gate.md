# Frontend Review Gate

Use PASS, PASS WITH FINDINGS, or FAIL.

A successful build does not override a frontend FAIL.

---

## VIS-001 Project visual contract

Does the implementation conform to the project's frontend contract?

For a new project, does a contract exist?

FAIL if major visual decisions are being invented locally.

---

## VIS-002 Dominant hierarchy

Can the screen purpose and primary information be identified immediately?

FAIL if unrelated regions have equal dominance.

---

## VIS-003 Information-pattern correctness

Does the presentation reflect what the information means?

Examples:

workflow -> sequence
facts -> knowledge
changes -> timeline
review -> review console
live state -> operational console
records -> data workspace

---

## VIS-004 Token discipline

Are spacing, typography, radius, color, and elevation derived from the project
system?

FAIL for unnecessary arbitrary values.

---

## VIS-005 Surface discipline

Does every border, card, background, and elevation communicate:

- grouping
- hierarchy
- interaction
- state

FAIL for decorative container noise.

---

## VIS-006 Typography

Is primary content readable?

Is metadata subordinate but legible?

Does typography match project density?

---

## VIS-007 Action hierarchy

Is there at most one visually dominant primary action per logical region?

---

## VIS-008 State semantics

Are states clear without relying only on color?

---

## VIS-009 Interaction completeness

Check applicable:

- hover
- focus
- active
- selected
- disabled
- loading
- success
- error

---

## VIS-010 Responsive composition

Does the layout transform appropriately for target platforms?

FAIL if desktop is merely squeezed.

---

## VIS-011 Accessibility

Check:

- keyboard
- focus-visible
- semantic HTML
- accessible names
- contrast
- non-color status
- reduced motion
- dialogs/popovers
- reflow

---

## VIS-012 Project personality

Does the screen feel like the same product as established or contracted
surfaces?

FAIL if the screen introduces an unrelated aesthetic.

---

## VIS-013 Density

Is information density appropriate to user frequency and task type?

FAIL when the screen is cramped or excessively sparse without reason.

---

## VIS-014 Decoration test

For each non-essential treatment ask:

Does it improve:

- comprehension
- hierarchy
- interaction
- state
- grouping
- project personality

If none apply, remove it.

---

# Result

PASS:
All blocking rules pass.

PASS WITH FINDINGS:
Core quality passes with minor polish remaining.

FAIL:
Functionality may work, but the frontend is below the project baseline.

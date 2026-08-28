# Theme and Typography Refinement

Use this reference whenever a product supports light and dark themes, a theme
selector, or a shared type hierarchy across multiple screens.

Theme and typography are product systems, not isolated polish applied to one
component.

---

# 1. Treat themes as one product

Light and dark themes should express the same hierarchy, meaning, and states.
They may use different luminance and contrast strategies, but they should not
feel like unrelated products.

Before editing, inventory the existing semantic roles for:

- page background
- primary surface
- raised surface
- inset or quiet surface
- hover and active surface
- primary text
- secondary and muted text
- border and divider
- primary action and selection
- success
- warning
- danger
- information
- focus ring
- modal or drawer overlay

Prefer one token mapping per role with a light and dark value. Components
should consume semantic tokens rather than choosing theme-specific colors
locally.

Do not:

- hard-code a light-only or dark-only surface inside a shared component
- use the accent color for every status
- reduce muted text until it disappears in dark mode
- rely on color alone to communicate state
- create a different spacing or type hierarchy for each theme

Theme parity means checking default, hover, focus-visible, active, selected,
disabled, loading, success, error, and open states in every supported theme.

---

# 2. Build a type contract

Define the project type contract before adding local font declarations. At
minimum, record:

- approved font family and fallbacks
- display and page-title size
- section-title size
- body size
- compact body size
- metadata minimum
- label and kicker treatment
- ordinal and metric treatment
- control and action treatment
- weight hierarchy
- line-height hierarchy
- tracking behavior
- meaningful font-style usage

Use semantic roles instead of arbitrary declarations. A useful role set is:

| Role | Typical use | Required decisions |
| --- | --- | --- |
| Display | landing or major page title | size, weight, tracking, line-height |
| Page title | workspace heading | size, weight, tracking, wrapping |
| Section title | card, panel, or group heading | size, weight, line-height |
| Body | primary explanation or record content | size, line-height, readable measure |
| Compact body | supporting descriptions and dense rows | size, line-height, minimum legibility |
| Metadata | dates, counts, source labels | size, weight, tracking, numeric alignment |
| Label | kicker, field label, status context | size, weight, case, tracking |
| Ordinal or metric | step number, rank, count, KPI | size, weight, numeric alignment |
| Action | button, link, or control text | size, weight, line-height, state contrast |

For every role, decide all of the following together:

- font size
- font weight or thickness
- line height
- letter spacing
- font style
- text transform or case
- wrapping behavior
- numeric alignment when applicable

Guidance:

- Keep primary content comfortably readable.
- Make metadata subordinate through scale and contrast, not by making it
  illegibly small.
- Use tighter tracking for large headings only when it improves composition.
- Use positive tracking for short uppercase labels, and normal tracking for
  body copy.
- Use a stable weight hierarchy; do not make every element bold.
- Use italic or other font styles only when they communicate meaning.
- Use tabular or aligned numerals for repeated counts, dates, steps, or
  metrics when comparison matters.
- Let copy wrap before shrinking type to fit a layout.
- Keep control text large enough to scan and operate at the target platform.

Spacing around type is part of the type contract. Use the project spacing scale
for gaps, margins, and padding so that a change in line height does not create
accidental crowding or oversized gaps.

---

# 3. Apply the system across screens

When refining one screen:

1. inspect the shared shell, tokens, and reliable visual ancestors
2. identify the type role and theme role of each affected element
3. reuse the existing token or extend the shared contract
4. compare related screens for the same role
5. preserve semantics, behavior, and responsive composition

If a number is an ordinal in one workflow and another knowledge list, it may
have a different scale only when the project contract defines those as
different roles. Do not create one-off exceptions merely to fit a card.

Theme and type changes should preserve interaction clarity. A selected or
focused control must remain distinguishable after the theme or type update,
and increased line height must not clip text or collapse hit areas.

---

# 4. Render and verify

When browser or screenshot tooling is available, inspect:

- desktop and mobile compositions
- light and dark themes
- page title, section title, body, metadata, label, and ordinal roles
- default, hover, focus-visible, active, selected, disabled, and open states
- long labels, translated-looking copy, and multi-line descriptions
- keyboard focus and readable contrast
- 200 percent zoom or an equivalent narrow reflow check when practical
- horizontal overflow, clipping, and accidental text truncation

Check both the visual result and the resolved computed styles. A build can
pass while a token is overridden by a more specific selector or a type role is
inconsistent on a related page.

The refinement passes when:

- both themes retain the same information hierarchy
- each repeated role uses the same size, weight, tracking, and line-height
  rules
- primary content is readable and metadata remains legible
- state communication does not depend on color alone
- responsive layouts preserve reading order and usable controls


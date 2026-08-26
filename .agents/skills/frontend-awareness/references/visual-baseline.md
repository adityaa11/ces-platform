# Global Frontend Visual Baseline

This file defines quality principles that apply across projects.

It does NOT define one universal aesthetic.

Project personality belongs in PROJECT_FRONTEND_CONTRACT.md.

---

# 1. Visual hierarchy

Every screen must have one dominant hierarchy.

A user should be able to identify:

1. where they are
2. what the screen is for
3. what matters most
4. what requires attention
5. what they can do next

Secondary information must be visually subordinate.

---

# 2. Typography

Typography must provide clear levels.

Do not solve density problems by repeatedly shrinking text.

Primary content must remain comfortably readable.

Metadata may be smaller but must remain legible.

---

# 3. Spacing

Use a project token scale.

Do not improvise arbitrary values when an established token fits.

Spacing communicates grouping and hierarchy.

---

# 4. Surfaces

A border, background change, or elevation must communicate at least one of:

- grouping
- hierarchy
- interaction
- state

If it communicates none of these, remove it.

---

# 5. Cards

Cards are not a universal layout solution.

Use them for meaningful bounded objects.

Prefer lists, rows, timelines, workflows, split views, forms, tables, or prose
when those structures better represent the information.

Avoid nested cards.

---

# 6. Color

Use semantic roles.

Do not use color only for decoration when it creates visual noise.

Do not communicate state by color alone.

---

# 7. Actions

Each logical region should normally have at most one visually dominant primary
action.

Secondary and tertiary actions must be visually subordinate.

---

# 8. Progressive disclosure

Prefer:

summary
-> detail
-> supporting context

Do not expose all information at the same visual level.

---

# 9. Geometry

Use a small number of project-defined radii.

Do not introduce random geometry.

Pills are for compact metadata, tags, or states.

---

# 10. Iconography

Icons support recognition.

They should not replace important labels when meaning becomes ambiguous.

---

# 11. Density

Density must be intentional.

Dense interfaces require strong hierarchy.

Sparse interfaces require meaningful whitespace.

Neither should be accidental.

---

# 12. Motion

Motion must support:

- feedback
- continuity
- hierarchy
- spatial understanding

Avoid decorative animation unless the project contract explicitly allows it.

---

# 13. Beauty test

For each visual treatment ask:

1. Does it improve comprehension?
2. Does it improve hierarchy?
3. Does it communicate interaction?
4. Does it communicate state?
5. Does it communicate grouping?
6. Does it reinforce the project personality?

If all answers are NO, remove it.

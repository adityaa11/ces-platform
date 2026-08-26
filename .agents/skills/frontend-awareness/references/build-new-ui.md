# Building New UI

## Goal

Create new frontend work that is both visually strong and consistent with the
project.

---

# Step 1 - Ensure a project visual contract exists

If the project has no trustworthy visual system:

1. read visual-language-derivation.md
2. derive the project visual language
3. create PROJECT_FRONTEND_CONTRACT.md
4. treat that contract as the local visual authority

Do this before significant screen implementation.

---

# Step 2 - Define the screen purpose

Answer:

User goal:

Dominant information object:

Primary question:

Primary action:

Primary risk:

Supporting information:

---

# Step 3 - Select an information pattern

Choose the pattern that best represents the meaning.

Do not default to dashboard cards.

---

# Step 4 - Compose hierarchy before styling

Establish:

1. location/context
2. page purpose
3. primary information
4. state/attention
5. supporting context
6. actions
7. metadata

Then style.

---

# Step 5 - Apply project personality

Use the project contract for:

- density
- typography
- spacing
- color
- geometry
- surface hierarchy
- navigation
- motion
- responsive behavior

Do not invent visual personality at the screen level.

---

# Step 6 - Reuse shared primitives

Prefer shared:

- tokens
- controls
- navigation
- form elements
- overlays
- state presentation
- layout primitives

Create a new reusable component only for a real reusable semantic concept.

---

# Step 7 - Define states

Consider applicable:

- default
- loading
- empty
- error
- success
- disabled
- permission-limited
- filtered-empty
- offline/disconnected when relevant

---

# Step 8 - Define responsive transformation

Describe how the composition changes across the project's target platforms.

Do not rely on accidental wrapping.

---

# Step 9 - Render and refine

The first rendered result is a draft.

Inspect:

- hierarchy
- composition
- typography
- whitespace
- density
- interaction states
- responsiveness

Correct visible problems before completion.

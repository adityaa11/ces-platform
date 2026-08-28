# Visual Language Derivation

## Purpose

This process is used when a project does not yet have a trustworthy visual
language.

The goal is NOT to invent arbitrary aesthetics.

The goal is to derive an appropriate visual system from product context.

Output:

PROJECT_FRONTEND_CONTRACT.md

Do this BEFORE significant UI implementation.

---

# Step 1 - Classify the product

Choose the closest primary product mode.

Possible modes include:

- enterprise knowledge workspace
- operational control application
- analytics application
- transactional business application
- content or document application
- creative tool
- collaboration application
- consumer utility
- commerce application
- communications application
- developer tool
- internal administration tool

A product may have one primary mode and one secondary mode.

Do not classify every business app as a dashboard.

---

# Step 2 - Identify the user mode

Determine how users interact with the product.

Frequency:

- occasional
- recurring
- daily
- continuous

Session style:

- quick task
- focused work session
- monitoring
- exploratory
- long-form reading
- data entry
- review and approval

Expertise:

- novice
- mixed
- expert

These affect density and interaction complexity.

---

# Step 3 - Determine information character

Identify dominant information forms.

Examples:

- workflows
- records
- documents
- facts
- metrics
- live status
- forms
- media
- timelines
- conversations
- maps
- tasks
- approvals

The visual system should privilege the dominant information type.

---

# Step 4 - Determine consequence and risk

Classify the cost of misunderstanding.

Low:
- reversible
- casual
- exploratory

Medium:
- business consequence
- productivity loss
- recoverable mistakes

High:
- financial
- security
- legal
- operational
- safety
- irreversible action

Higher consequence generally requires:

- clearer state
- restrained decoration
- stronger confirmation
- stronger hierarchy
- better provenance
- less ambiguity

---

# Step 5 - Derive density

Choose:

LOW
MEDIUM
MEDIUM-HIGH
HIGH

Guidance:

LOW:
- consumer
- presentation-heavy
- infrequent use

MEDIUM:
- broad business use
- knowledge work
- mixed expertise

MEDIUM-HIGH:
- frequent operational use
- expert users
- many simultaneous signals

HIGH:
- only when task efficiency genuinely requires it

Do not choose high density merely to fit more information.

---

# Step 6 - Derive personality

Choose 3-5 project personality attributes.

Examples:

- calm
- precise
- trustworthy
- friendly
- efficient
- technical
- expressive
- premium
- direct
- energetic
- transparent
- serious
- approachable
- editorial
- utilitarian

Avoid contradictory combinations.

Personality must match product use.

---

# Step 7 - Derive emphasis

Choose the primary visual emphasis.

Examples:

- content
- workflow
- live state
- analysis
- action
- review
- creation
- discovery
- collaboration

This determines what receives the strongest visual hierarchy.

---

# Step 8 - Derive navigation model

Choose based on information architecture.

Possible models:

- persistent sidebar
- top navigation
- bottom navigation
- workspace tabs
- master-detail
- wizard or step flow
- command or search first
- hybrid

Do not choose navigation from fashion.

Choose it from task structure.

---

# Step 9 - Derive surface style

Choose one baseline.

FLAT:
minimal surface separation

LOW ELEVATION:
subtle panels and borders

LAYERED:
clear hierarchy of panels, drawers, and overlays

IMMERSIVE:
content or media dominates the canvas

Do not use excessive elevation.

---

# Step 10 - Derive typography

Define:

- system or approved font family
- page title range
- section title range
- body size
- metadata minimum
- weight hierarchy
- tracking behavior
- line-height hierarchy
- meaningful font-style usage
- ordinal and metric treatment

If the product supports light and dark themes, define these roles once for
the product and verify that both themes preserve their hierarchy. Use
references/theme-typography.md for the detailed type and theme checklist.

Typography should reflect personality and density.

---

# Step 11 - Derive spacing

Choose a token scale.

Recommended starting scale:

4
8
12
16
20
24
32
40
48
64

High-density products may use tighter subsets.

Low-density products may use larger section spacing.

Do not create random spacing per component.

---

# Step 12 - Derive geometry

Define:

- control radius
- content radius
- panel radius
- overlay radius

Possible geometry character:

SHARP
SOFT
ROUNDED

Do not use pill geometry for ordinary containers.

---

# Step 13 - Derive color semantics

Define roles rather than arbitrary hex usage.

At minimum:

- background
- surface
- surface-soft
- text-primary
- text-secondary
- text-muted
- border
- primary
- primary-soft
- success
- warning
- danger
- info

If light and dark themes are supported, define the mapping for every semantic
role in each theme, including focus, overlay, hover, active, and disabled
states. Do not derive a second visual language for dark mode.

Define what the primary accent MEANS.

Example:

Primary accent:
selection and primary interaction

Do not use the brand accent for every status.

---

# Step 14 - Derive motion policy

Choose:

MINIMAL
FUNCTIONAL
EXPRESSIVE

Enterprise and high-risk products should usually use MINIMAL or FUNCTIONAL.

Motion should communicate:

- state change
- hierarchy
- continuity
- spatial transition

Avoid decorative motion by default.

---

# Step 15 - Derive responsive model

Determine platform priority:

- desktop-first
- mobile-first
- equal desktop/mobile
- tablet-specialized
- large-screen operational

Describe how major compositions transform.

Do not rely only on breakpoints.

---

# Step 16 - Define forbidden patterns

Every project contract MUST explicitly state what visual patterns are prohibited.

Examples:

- no gradients
- no glassmorphism
- no giant cards
- no tiny text
- no card grids for workflows
- no dense tables on mobile
- no icon-only primary navigation

These constraints reduce aesthetic drift.

---

# Step 17 - Define design references by grammar, not copying

If reference products are known, record what qualities are useful.

Example:

Reference grammar:

Linear:
- restrained navigation
- compact precision

Notion:
- readable knowledge surfaces

Vercel:
- typography hierarchy
- restrained geometry

Do NOT instruct Codex to clone a copyrighted product screen.

Use references only as visual grammar.

---

# Step 18 - Freeze the contract

Before implementation, write:

PROJECT_FRONTEND_CONTRACT.md

Once accepted or established, future screens MUST derive from that contract.

Do not silently regenerate the project's personality per task.

Only revise the contract when:

- product direction changes
- the user explicitly requests a redesign
- the existing contract is demonstrably incomplete

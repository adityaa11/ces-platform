# Information Presentation Patterns

Select patterns based on information meaning.

Do not select based only on implementation convenience.

---

# Workflow Sequence

Use for ordered processes.

Must communicate:

- order
- relationship
- progression
- current or selected state

Prefer sequence visualization over unrelated cards.

---

# Workflow Detail

Use for inspecting one process or semantic workflow page.

Desktop may use:

workflow | contextual detail

Mobile may stack:

workflow
then detail

---

# Knowledge List

Use for facts, rules, roles, constraints, or accumulated knowledge.

Prefer readable hierarchy:

category
-> fact
-> supporting detail
-> source or action

Do not default to card grids.

---

# Timeline

Use for change over time.

Examples:

- revisions
- releases
- history
- incremental changes
- activity

Chronology must be visually obvious.

---

# Review Console

Use for:

- compliance
- validation
- approval
- readiness
- policy review
- assessment

Priority:

status
-> conclusion
-> attention required
-> grounding
-> reasoning

---

# Evidence Panel

Use when source grounding or provenance matters.

Possible structure:

interpretation
-> exact source
-> source identifier
-> location

Evidence must be directly reachable from the claim it supports.

---

# Operational Console

Use for real-time or near-real-time control applications.

Prioritize:

current state
-> primary control
-> warnings
-> live telemetry
-> diagnostics

Use strong state visibility.

Avoid decorative content competing with runtime status.

---

# Data Workspace

Use for frequent interaction with structured records.

Prioritize:

search/filter
-> current dataset
-> selection
-> actions
-> details

Tables are appropriate when comparison across columns is a real user task.

Do not use tables simply because the data is structured.

---

# Settings Form

Use for configuration.

Prioritize:

category
-> setting
-> explanation
-> control

Group semantically.

Avoid card-per-field layouts.

---

# Entity Library

Use for collections of standalone objects.

Examples:

- projects
- workspaces
- teams
- documents

Each entity should expose:

- identity
- meaningful state
- concise metadata
- explicit navigation/action

---

# Metric Summary

Use only when numbers answer meaningful user questions.

Metrics support the product.

They should not visually replace the product.

---

# Scope Lens

Use when users need to inspect context through selected sources, versions,
tenants, environments, or other scopes.

Behavior must remain consistent across surfaces.

---

# Empty State

Explain:

- what is absent
- why it may be absent
- what the user can do next

Avoid generic "No data" unless no further guidance is possible.

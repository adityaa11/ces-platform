# CES Atlas Workflow UI Context - Superseded

**Status:** Superseded by the recursive knowledge-explorer direction.

Do not use this file as implementation authority for Atlas contracts, APIs,
layout, graph selection, rendering, or qualification.

The authoritative product direction is now:

- [`graphs context.md`](graphs%20context.md)
- [`supporting graphs context.md`](supporting%20graphs%20context.md)
- [`tests/fixtures/safara/golden-main-workflow.json`](../tests/fixtures/safara/golden-main-workflow.json)
- [`CES-GF-ATLAS-HARD-027`](tickets/greenfield/atlas-hardening/CES-GF-ATLAS-HARD-027-golden-model-profile-safara-workflow-qualification.md)

The superseded design assumed a bounded overview plus fixed model/detail tabs.
The current design requires one permanently visible Main Workflow and a
renderer-neutral, backend-owned recursive knowledge hierarchy. No v2
implementation may preserve the old fixed-tab model as a parallel production
navigation path.

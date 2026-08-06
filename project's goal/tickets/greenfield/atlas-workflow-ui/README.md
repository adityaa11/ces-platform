# CES Atlas Recursive Knowledge Explorer UI Plan

**Status:** Clean-state redesign required; v1 fixed-detail tickets are legacy
implementation history, not v2 product authority.

## Authority

- [`graphs context.md`](../../../graphs%20context.md)
- [`supporting graphs context.md`](../../../supporting%20graphs%20context.md)
- [HARD-027 recursive golden](../atlas-hardening/CES-GF-ATLAS-HARD-027-golden-model-profile-safara-workflow-qualification.md)
- [`golden-main-workflow.json`](../../../../../tests/fixtures/safara/golden-main-workflow.json)

## Product boundary

The UI renders a backend-owned recursive knowledge hierarchy:

```text
Permanent Main Workflow
        ↓ selection
Breadcrumb
        ↓
Dynamic recursive detail workspace
```

The UI does not select graph types, infer children, assign semantic membership,
or create topology.

## Renderer policy

The experience must be interactive, but no product contract is locked to
Mermaid, React Flow, ELK, or another renderer. A backend renderer descriptor
selects an approved capability. Structured Atlas semantics remain authoritative
when renderer technology changes.

## Clean-state rule

ATLAS-UI-000 through ATLAS-UI-005 document the v1 model-review implementation.
Their fixed detail contract, fixed tabs, one-level navigation, and center-column
detail layout are superseded. Do not extend them for v2 and do not add a v1
fallback to the new UI.

Before v2 implementation starts, create a new ticket sequence covering:

1. Recursive knowledge wire contracts
2. Knowledge-node and child APIs
3. Permanent project-map workspace layout
4. Breadcrumb and recursive navigation
5. Renderer-neutral interactive visualization registry
6. Evidence and approval integration
7. Cross-domain browser and human qualification
8. Removal of v1 UI, APIs, prototype code, and unused renderer dependencies

The integrated release gate remains closed until v1 removal and v2
qualification are both complete.

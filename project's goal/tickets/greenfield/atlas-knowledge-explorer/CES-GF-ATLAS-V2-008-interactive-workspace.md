# CES-GF-ATLAS-V2-008 - Interactive Knowledge Workspace

**Status:** Planned  
**Depends on:** ATLAS-V2-007

## Outcome

Implement the Next.js workspace defined by `graphs context.md` using the v2 API.

## Scope

- Permanent minimizable Main Workflow.
- Left-side module and knowledge navigation.
- Breadcrumb above the active supporting graph.
- Selected supporting graph below the Main Workflow.
- Recursive selection at arbitrary depth.
- Source evidence and governed review actions.
- Renderer registry selected from backend capabilities.
- Accessible non-visual graph summaries and responsive layout.

## Acceptance

- Selecting a module never replaces the Main Workflow.
- Graph type and membership are rendered, never inferred in the browser.
- React Flow may be the first adapter but is not a contract requirement.
- No fixed flow/rules/validations/permissions/states tabs exist.
- Browser tests cover recursion, breadcrumbs, minimization, evidence, and stale
  revisions.


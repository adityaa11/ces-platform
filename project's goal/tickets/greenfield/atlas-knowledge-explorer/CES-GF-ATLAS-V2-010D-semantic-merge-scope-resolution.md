# CES-GF-ATLAS-V2-010D - Semantic Merge, Scope, and Endpoint Resolution

**Status:** Planned
**Depends on:** ATLAS-V2-010C

## Outcome

Merge section facts into one recursive project model without losing supporting
graphs or relationships because of superficial label differences.

## Scope

- Define canonical concepts from exact source labels while retaining every
  original representation and language.
- Deduplicate equivalent concepts only through deterministic evidence or human
  review; never create translated duplicates.
- Associate facts with modules through reconstructed section ownership and
  explicit semantic references, not page-only context paths.
- Resolve relationship endpoints through canonical identities and reviewed
  aliases rather than exact display-label equality.
- Preserve distinct relationships extracted from the same source statement.
- Run graph selection independently per concern and attach only fully supported
  graphs beneath their owning module.
- Build one recursive knowledge hierarchy in which the project-level Main
  Workflow owns its modules, each module owns only its applicable supporting
  graphs or knowledge children, and every child may own further children
  without a fixed maximum depth.
- Publish stable parent identities and ordered ancestry for every navigable
  item so the UI can derive the breadcrumb from semantic data rather than
  reconstructing or hardcoding a path.
- Keep graph kind, semantic membership, hierarchy, and topology backend-owned;
  renderer metadata may select a presentation but may not invent children,
  relationships, tabs, or breadcrumb segments.
- Construct a Business Workflow root only when explicit project-level sequence
  or dependency evidence supports it; otherwise use the appropriate project map
  without falsely claiming a workflow.

## Acceptance

- Number prefixes or benign source representation differences do not delete
  evidenced relationships.
- Supporting facts attach to the correct modules across page boundaries.
- Every detail child has exactly one valid navigation parent within the
  published project hierarchy, while evidence may support multiple items.
- A navigation path can be derived for every nested item beginning at `Main
  Workflow`; original document labels are preserved in all derived segments.
- Modules expose only evidence-supported children and do not receive a fixed
  set of Workflow, State Machine, Decision Tree, or other graph tabs.
- The Safara project map contains evidenced modules and relationships matching
  the agreed objectives without production fixture logic.
- Non-workflow input is not forced into a Business Workflow.
- Original labels remain exact and English is used only for standardized
  relationship descriptions.

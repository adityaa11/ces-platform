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
- Right-side PDF evidence workspace and governed review actions.
- Original PDF page rendering with page/zoom controls and synchronized
  evidence highlights.
- Evidence cards below the PDF containing exact original text and provenance.
- Renderer registry selected from backend capabilities.
- Accessible non-visual graph summaries and responsive layout.

## Acceptance

- Selecting a module never replaces the Main Workflow.
- Graph type and membership are rendered, never inferred in the browser.
- React Flow may be the first adapter but is not a contract requirement.
- No fixed flow/rules/validations/permissions/states tabs exist.
- Browser tests cover recursion, breadcrumbs, minimization, evidence, and stale
  revisions.
- Selecting a graph item opens the cited PDF page; selecting an evidence card
  focuses its page and highlight, and selecting a highlight focuses its card.
- Multiple and non-contiguous supporting regions are distinguishable.
- When coordinates are unavailable, the correct page and evidence card remain
  usable and the UI reports that highlighting is unavailable without guessing.
- Scanned-PDF highlights align to the original page image through OCR
  coordinates, while the card exposes OCR confidence.
- PDF loading is authorized, revision-pinned, CSP-compatible, accessible, and
  does not expose filesystem paths.

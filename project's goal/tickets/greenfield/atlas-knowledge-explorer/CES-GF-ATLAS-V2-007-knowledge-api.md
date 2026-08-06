# CES-GF-ATLAS-V2-007 - Recursive Knowledge API

**Status:** Planned  
**Depends on:** ATLAS-V2-005 and ATLAS-V2-006

## Outcome

Expose revision-pinned, backend-owned overview, child graph, breadcrumb,
evidence, and governance data to the UI.

## Scope

- Project overview endpoint.
- Knowledge-node endpoint with graph and immediate children.
- Breadcrumb and parent identity in every recursive response.
- Evidence and review endpoints keyed by canonical v2 identity.
- Authorized, revision-pinned PDF content/range endpoint with correct content
  type, byte-range support, project isolation, and no local-path disclosure.
- Evidence-location responses containing page, exact text, text span, bounding
  boxes, coordinate availability, and links to the selected knowledge item.
- Strict project isolation, path safety, caching, and stale-revision behavior.

## Acceptance

- The UI can navigate arbitrary depth without loading all graphs initially.
- Missing means unavailable, never silently empty.
- Responses validate against ATLAS-V2-001.
- `/api/atlas/detail-tabs` and v1 detail-index lookup are not used by v2.
- A client can move between several evidence locations without downloading or
  trusting an inferred browser-side evidence map.
- Stale document or evidence revisions fail closed.

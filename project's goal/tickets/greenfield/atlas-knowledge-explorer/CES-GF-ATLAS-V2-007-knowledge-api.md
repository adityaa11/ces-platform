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
- Strict project isolation, path safety, caching, and stale-revision behavior.

## Acceptance

- The UI can navigate arbitrary depth without loading all graphs initially.
- Missing means unavailable, never silently empty.
- Responses validate against ATLAS-V2-001.
- `/api/atlas/detail-tabs` and v1 detail-index lookup are not used by v2.


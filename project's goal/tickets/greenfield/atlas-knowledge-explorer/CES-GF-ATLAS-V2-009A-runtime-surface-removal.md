# CES-GF-ATLAS-V2-009A - Runtime Surface Removal

**Status:** Implemented
**Depends on:** ATLAS-V2-008

## Outcome

Only V2 UI and Agents Bridge runtime surfaces remain executable.

## Scope

- Delete V1 workspace, detail, detail-tab, evidence, and decision API routes.
- Delete the fixed-tab React workspace and unused static Atlas UI.
- Delete the `/v1/atlas/analyze` compatibility endpoint.
- Delete superseded requirement, structure, and candidate extraction agents.
- Retain the generic Bridge route and V2 semantic-fact agent.

## Acceptance

- The production Next.js route table contains only V2 Atlas APIs.
- Bridge clients can invoke the semantic-fact agent only through the generic route.
- No V1 UI dependency remains in the Next.js package.
- UI and Bridge typechecks, focused tests, and the production build pass.

## Implementation evidence

- Deleted the five V1 Next.js Atlas routes, fixed-tab workspace, its backing
  readers/tests, and the unused static UI implementation.
- Removed all V1 UI package dependencies; the optimized route table contains
  only `/api/atlas/v2/*` endpoints.
- Deleted the Bridge compatibility endpoint and superseded requirement,
  structure, and candidate agents; production registers only the V2 semantic
  fact agent through `/v1/agents/:agentId/execute`.
- CLI, Bridge, and UI typechecks pass; focused runtime tests pass 14/14 and the
  optimized Next.js production build succeeds.

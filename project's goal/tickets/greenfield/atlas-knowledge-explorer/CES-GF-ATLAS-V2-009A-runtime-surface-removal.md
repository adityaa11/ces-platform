# CES-GF-ATLAS-V2-009A - Runtime Surface Removal

**Status:** In Progress
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


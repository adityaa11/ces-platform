# BATCH-09 Integration and Handoff Validation

## Fixture boundary and future replacement point

`apps/atlas` consumes its UI-facing data only from `@atlas/fixtures`. The fixture package owns scenario selection, project/workspace identities, roles, PRDs, evidence, source accounting, destinations, approval states, and processing states. Future services replace that package's exports with adapters supplying the same contracts; no route or presentational component is a planned replacement point.

## End-to-end rendered walkthrough

| Journey / state | Rendered states inspected | Result / evidence |
|---|---|---|
| Owner workspace | Main Workflow, Project Facts with PRD 2 isolate lens, CES Result, and Changes Done using the Safara project. | Pass — each destination retained the shared project context and exposed fixture-derived workflow, fact, CES, change, source, and approval information. |
| PRD lens and source accounting | Opened the global PRD lens from Project Facts, then Source accounting for PRD 1. | Pass — accounting displayed 1 found / 1 placed / 0 needs-answer statement and its resolvable Main Workflow destination; the modal offered the global-lens action. |
| Role scenarios | Editor-ready and viewer-ready libraries. | Pass — both rendered the shared Safara project; owner-only project-management actions were absent from the viewer state. |
| Processing scenarios | Extracting state, backed by the six fixture processing stages in automated coverage. | Pass — the project library presented a processing project and fixture-provided status feedback without a live service. |
| Approval scenario | Approved-result CES Result. | Pass — rendered coverage became 4 Covered / 0 Needs Review and the fixture approval state was available without changing UI composition. |

## Relationship and regression validation

- `pnpm test` passed: fixture contract tests cover roles, all processing stages, approval states, source provenance, every cross-link/source-accounting destination, and fact-row evidence relationships; rendered app tests cover account entry, owner/editor/viewer, processing states, lens routes, and approved results.
- `pnpm lint` passed.
- The end-to-end walkthrough used the rendered fixture prototype. No network-backed production dependency was introduced.

## Handoff notes

- Replace `@atlas/fixtures` with live data adapters that maintain its UI-facing fixture contracts.
- Preserve typed project, PRD, evidence, destination, role, processing, and approval relationships; UI components must remain fixture/service agnostic.
- Keep the existing test coverage as a contract suite for future adapters.

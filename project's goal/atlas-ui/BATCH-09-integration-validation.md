# BATCH-09 Integration and Handoff Validation

## Fixture boundary and future replacement point

`apps/atlas` consumes its UI-facing data only from `@atlas/fixtures`. The fixture package owns scenario selection, project/workspace identities, roles, PRDs, evidence, source accounting, destinations, approval states, and processing states. Future services replace that package's exports with adapters supplying the same contracts; no route or presentational component is a planned replacement point.

## End-to-end rendered walkthrough

| Journey / state | Rendered states inspected | Result / evidence |
|---|---|---|
| Desktop owner workspace (1280 px) | Main Workflow, Project Facts, CES Result, and Changes Done using Safara; PRD 2 contextual highlight, PRD 2 isolate, Source accounting, and an accounting cross-destination return. | Pass — the highlight retained six fact groups; isolate reduced the rendered result to relevant contributions; accounting displayed its statement arithmetic and a resolvable Main Workflow return while retaining the project/lens URL context. |
| Tablet CES workspace (768 px) | CES coverage summary, four policy cards, evidence/destination links, and Atlas/CES approval gates. | Pass — all coverage states, source links, and separate approval gates remained rendered with the persistent workspace navigation. |
| Compact mobile changes workspace (573 px) | Changes by PRD increment; open mobile navigation; Account menu modal sheet with theme/account controls and explicit close. | Pass — the drawer exposed all four workspace destinations and the profile action opened its focused modal sheet without losing the changes timeline context. BATCH-08 separately validates Escape, backdrop dismissal, focus containment, and focus restoration. |
| Owner account, library, upload, and sharing (desktop) | Opened Create a project, entered a project name, confirmed the PDF-only PRD chooser, submitted Create and process, then opened Share for Safara. Invited `reviewer@example.com` as Editor and changed Raka Pratama from Editor to Viewer through the confirmation dialog. | Pass — the prototype clearly labels file/processing simulation; creation displayed the live processing notice (“Extracting text and structure”); the private-project sharing panel showed collaborators, Editor/Viewer choices, invitation state, and an explicit role-change confirmation. The resulting shared-role display showed the invited Editor and Raka as Viewer. |
| Role and processing scenarios | Editor-ready and viewer-ready libraries; extracting state; all six fixture processing stages in automated coverage. | Pass — both roles rendered the shared Safara project and viewer omitted owner-only project-management actions; processing feedback remained fixture-driven with no live service. |
| Approval scenario | Approved-result CES Result. | Pass — rendered coverage became 4 Covered / 0 Needs Review and the fixture approval state was available without changing UI composition. |

## Relationship and regression validation

- `pnpm test` passed: fixture contract tests cover roles, all processing stages, approval states, source provenance, every cross-link/source-accounting destination, CES destinations/source PRDs/linked facts/evidence, and fact-row evidence relationships; rendered app tests cover account entry, owner/editor/viewer, processing states, lens routes, and approved results.
- `pnpm lint` passed.
- The end-to-end walkthrough used the rendered fixture prototype. No network-backed production dependency was introduced.

## Handoff notes

- Replace `@atlas/fixtures` with live data adapters that maintain its UI-facing fixture contracts.
- Preserve typed project, PRD, evidence, destination, role, processing, and approval relationships; UI components must remain fixture/service agnostic.
- Keep the existing test coverage as a contract suite for future adapters.

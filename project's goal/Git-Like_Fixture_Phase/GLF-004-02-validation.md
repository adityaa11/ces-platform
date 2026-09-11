# GLF-004-02 validation record

- **Ticket / review batch:** GLF-004-02 / BATCH-20.2
- **Implementation checkpoint:** `f2f0bd4c3dbdd18be7159c759337b1de9f7f3728`
- **Validation date:** 11 September 2026
- **Fixture-contract suite:** 22/22 passed
- **App lint:** passed
- **App build and rendered-route suite:** 8/8 passed

## Rendered and interaction checks

| Check | Route / condition | Observed outcome |
|---|---|---|
| Field contract and order | `/demo`, owner session, Create a project modal | Project ID, Project Name, Project Description, and PRD PDFs render in the required order. The first, second, and fourth fields visibly state `* Required`; Project Description visibly states `Optional`. |
| Content limits | Empty text fields at desktop and 375px viewport | Live `0/48`, `0/80`, and `0/280` counts are directly below their respective fields; inputs enforce 48, 80, and 280-character maximums. |
| ID guidance | Project ID input | Required status and the lowercase-kebab-case rule render beside the label; `Example: project-id-001` is the input placeholder. |
| Empty and invalid input | Empty submission and a non-kebab-case Project ID | Field-level required and format errors render with `role="alert"`, are connected through `aria-describedby`, and use the semantic red error token. |
| Duplicate and file validation | Fixture-backed store / file selection contract | Existing `projectId` values are rejected before creation; an empty file selection reports `Select at least one PRD PDF.` and a non-PDF reports `Only PDF files can be added.` |
| Loading and success states | Valid request factory and client submit path | The submit action disables while creating; successful creation makes the non-blocking live notification say `Project <name> created. Extraction has started.` |
| Creation relationship | `createFixtureProject` contract test | The accepted request, Extracting project card record, and processing job use the identical normalized `projectId`; the new project has disabled Open project and Share actions. |
| Route adapter | Created fixture record passed to `resolveFixtureProjectRoute` | The adapter resolves the created project only by its stable ID and correctly prevents opening its workspace while extraction is in progress. |
| Keyboard and dismissal | Create modal | Labels, native controls, focus containment, and alerts are keyboard accessible. Backdrop and Escape dismissal are disabled for this modal; the visible X is the only manual close control. |
| Theme and responsive visual check | Dark and light token mapping; desktop and 375px viewport | The modal keeps its hierarchy, readable counts, reachable controls, and red error contrast without horizontal overflow. |

## Frontend review gate

| Gate | Result | Evidence |
|---|---|---|
| VIS-001 visual contract | PASS | Reuses Atlas tokens, form controls, dialog geometry, and type roles. |
| VIS-002 hierarchy | PASS | Field identity, required state, validation, then action are progressively ordered. |
| VIS-003 pattern | PASS | The modal is a grouped settings/intake form rather than a card collection. |
| VIS-004–005 tokens and surfaces | PASS | Semantic color and existing dialog/form surfaces are reused. |
| VIS-006 typography | PASS | Labels, guidance, counters, and errors use established readable roles. |
| VIS-007–009 actions and states | PASS | One primary submit action; disabled/loading/error/success states are explicit. |
| VIS-010 responsive composition | PASS | The modal maintains a single readable column at 375px. |
| VIS-011 accessibility | PASS | Native controls, labels, focus containment, alerts, visible focus, and non-color error messaging are present. |
| VIS-012–014 personality, density, decoration | PASS | The form remains consistent with the restrained Atlas workspace. |
| VIS-015 theme parity | PASS | Error, border, surface, and text roles have dark/light token mappings. |

## Decision

This record closes feedback finding F-001 by making the implemented validation
and review evidence traceable in the ticket set. It does not alter the intake
contract or introduce production uploads, storage, extraction, or publication.

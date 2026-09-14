# AUI-014: Prototype validation baseline

- **State:** `awaiting_review`
- **Review batch:** BATCH-35
- **Depends on:** AUI-013 complete; GLF golden fixture baseline
- **Baseline:** [AUI-002 Fixture scenarios and UI contracts](AUI-002-fixture-scenarios-and-ui-contracts.md); [AUI-013 Unselected project navigation state](AUI-013-unselected-project-navigation-state.md); [SFE workspace-source rule](../Skills_Fixture_Extraction_Phase/SFE-README.md#sfe-workspace-source-rule)

## Outcome

Restore the existing prototype validation suite after source PDFs were removed
from `docs/PRD`, while keeping SFE source authority workspace-scoped and
rendering built-in fixture workspaces on the server.

## Scope

- Keep raw PDFs out of routine golden-fixture tests. Seed deterministic
  regeneration from the extracted page text already stored in the committed
  golden bundle, and preserve the source hash and page-count metadata there.
- Make known scenario-owned project routes resolve directly from their
  scenario, while preserving the registry-backed client route for projects
  created through the runtime modal flow.
- Keep the Sources route inside the Atlas shell and explain the empty library
  when no uploaded workspace PDFs exist.
- Add regression coverage for both built-in and modal-created project routing.

## Acceptance criteria

- `pnpm --filter @atlas/fixtures test` regenerates and validates the golden
  bundle without reading source PDFs from `docs/PRD`.
- Golden artifact metadata uses a `golden-fixture:` identifier and retains the
  catalogued hashes, page counts, and extracted statements.
- SFE continues to resolve source bytes only from the selected workspace file
  record; no application runtime path consumes the GLF golden snapshot.
- Server-rendered built-in workflow, facts, changes, CES, and sources routes
  show their scenario content without the registry loading fallback.
- Unknown or modal-created project IDs continue through the runtime fixture
  registry route.
- With no PDFs under `docs/PRD`, the Sources route renders its shell and an
  actionable empty state.
- The Atlas application build and existing test suite pass.

## Validation

- Run the fixture golden test and Atlas build/test suite from a clean dependency
  install, with and without PDFs under `docs/PRD`.
- Inspect the rendered built-in Safara workflow and unavailable-project route;
  confirm the modal-created route retains its loading and registry behavior.
- Record the rendered states inspected below before review.

## Validation record

### Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
|---|---|---|---|
| Demo route selection | Resolve scenario-owned projects on the server; keep runtime modal projects registry-backed | Workflow, facts, changes, CES, sources | Runtime-created projects still use the client registry loader |
| Sources empty state | Keep the shell useful when a workspace has no PDFs | Sources | Existing PDF library/viewer remains unchanged when PDFs are present |
| Golden fixture generator | Keep regeneration and negative publication checks independent of source PDFs | `@atlas/fixtures` test/generate | Reads committed page-text snapshots; SFE continues to use uploaded workspace bytes |

### Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
|---|---|---|---|---|---|---|
| Sources with an empty library | Initial route load with no synced PDFs | Dark and light | Desktop 1270×1270; mobile 390×844 | Heading and body wrapping; action-free empty state | AX tree exposes “No sources yet” as a heading and the explanation as text; workspace navigation remains available | Empty-state card stays inside the app shell and viewport. Mobile document width is 390px with no horizontal overflow; card bounds are x=16, width=358px. |
| Built-in Safara workflow | Direct load of `/demo?projectId=safara&view=workflow` | Dark and light | Desktop 1270×1270 | Page introduction, ordered workflow titles, step chips, result summaries | AX tree exposes the page heading, five ordered workflow groups, and their workflow buttons | Server-rendered scenario content appears immediately with all five scopes; no registry loading fallback. |
| Unknown/modal-created project route | Rendered-HTML regression test for an unregistered project ID | N/A (automated test) | N/A (automated test) | N/A (automated test) | Test confirms the runtime registry loader remains on the route | Unknown/modal-created IDs retain the registry-backed client route; the browser test does not inspect this intermediate loading state visually. |

### Design-quality check

- **Reference or approved pattern used:** Existing AUI project shell and scenario fixtures.
- **Visual direction:** Preserve the established scenario presentation; change route resolution only.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** Route selection changes server resolution only; the empty state uses the existing workspace empty-state surface and tokens. Desktop and mobile layouts fit their viewports, and the built-in workflow retains its established ordered hierarchy.
- **Known limitations or intentional omissions:** No visual redesign is in scope.

### Regression learning

- **Any visual defect found after an earlier check:** The empty-state heading initially inherited the global narrow heading width; a route-specific override restored the expected full-width title. Reinspection confirmed the title wraps cleanly.
- **Previously missed state:** Scenario-owned projects were routed through the asynchronous modal registry, the fixture generator continued to require removed source PDFs, and the Sources route had no usable empty state when no PDFs were synced.
- **New mandatory state for this component:** Check scenario-owned and modal-created IDs separately; run fixture tests without raw source PDFs.

## Review checkpoint

- **Tickets included:** AUI-014 / BATCH-35
- **Review question:** Can prototype validation run without historical source PDFs while built-in scenarios render server-side and workspace source authority remains unchanged?
- **Combined acceptance:** The fixture suite regenerates from committed extracted text without raw PDFs; built-in project routes render their scenario content; modal-created IDs retain the registry route; and the no-PDF Sources route remains usable at desktop and mobile widths.
- **Commit to review:** `1776682`.

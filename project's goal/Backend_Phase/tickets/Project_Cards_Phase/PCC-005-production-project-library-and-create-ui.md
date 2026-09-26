# PCC-005: Production Project Library and create UI

- **State:** `awaiting_review`
- **Review batch:** `PCC-BATCH-05`
- **Depends on:** PCC-003 and PCC-004 `PASS`
- **Execution environment:** Docker Compose is authoritative for application builds/tests, authenticated production UI integration, and any PostgreSQL-backed validation; host-local commands are diagnostic only.
- **Baseline:** `SRC-PCC-02` §§1–4, 10–12, 20–26, 32, 35–36, 43–47; `SRC-PCC-05`; `SRC-PCC-06`; `SRC-PCC-07`

## Outcome

Wire the established Project Library presentation to the production create and
card contracts while keeping `/demo` fixture behavior explicit. The user can
open `+ New project` on `/home`, submit project metadata and PDF files through
the production multipart helper, and see the newly created production card in
the truthful waiting state.

This is a bounded UI/data-source refactor, not a redesign of the Atlas shell.

## Scope

- Keep `+ New project` in the existing Project Library heading row and reuse the established Atlas button/dialog/form language.
- Make the production/fixture authority distinction explicit at the `ProjectLibrary` call site or an equivalent discriminated adapter. Shared presentation is allowed; shared persistence authority is not.
- Preserve the proven fields and limits: Project ID (3–48 lowercase letters/numbers/hyphens), Project Name (1–80), optional description (0–280), and one or more PDF files.
- Keep client validation as usability behavior and let PCC-003 remain server authority for validation and uniqueness.
- Add a small production submission helper or equivalent that owns one in-flight request, `FormData` construction, safe response parsing, retryable errors, and success reconciliation. It must not contain database or DocumentStore logic.
- Submit same-origin multipart data to `POST /api/projects`; do not call `createFixtureProject`, `/api/local-fixtures`, base64 JSON, or any browser token path in production mode.
- Use production copy that does not claim extraction started: `Create project` or equivalent, and bounded success feedback that PRDs are waiting for extraction.
- On success, close/reset the dialog and refresh or reconcile the server-backed production list so the new card is visible. On failure, keep the dialog retryable and map bounded errors to the relevant fields/form alert.
- Consume the accepted PCC-004 `ProjectCardViewModel` for production presentation while preserving the fixture adapter. Do not rederive `Waiting for extraction`, PRD counts, metrics, or the disabled/unavailable action in client code.
- Keep `/demo` fixture creation, sharing, processing notice, and fixture card navigation unchanged in meaning.

### Frontend visual and interaction contract

The existing Atlas shell, Project Library, Dialog, Button, EmptyState, and
ProjectCard are the visual ancestors. The screen uses the Entity Library pattern:
identity -> meaningful state -> concise metadata -> explicit action/capability.

- Preserve the supplied reference relationship: `Projects` and its supporting copy on the left, `+ New project` at the upper-right of the heading row, and the existing card grid below.
- Reuse semantic theme tokens, type roles, spacing/radius scale, button/dialog primitives, and focus treatment. Do not introduce a production-only gradient, card geometry, status palette, or alternate shell.
- Preserve the existing shell-aware card fit contract: cards stay within the current comfortable bounds, column count is capped by item count, and the layout accounts for available content width rather than stretching a sparse card indefinitely.
- Cover applicable states: default, hover, focus-visible, disabled, loading, success, validation error, request error, empty, and unavailable project action. Communicate state with text/semantics, not color alone.
- Preserve the dialog's keyboard focus, labelled fields, `aria-invalid`/described-by error wiring, visible focus, readable counts/help text, and bounded mobile reflow.
- Inspect the affected `/home` and `/demo` uses at desktop, narrow desktop/tablet, mobile, 200% zoom or equivalent reflow, and light/dark themes. The production card and create dialog must remain readable without clipping or horizontal overflow.

Do not add production project sharing, production workspace navigation, drag/drop
as a new interaction requirement, upload progress, extraction progress, or a
second visual language.

## Acceptance criteria

- Authenticated `/home` shows `+ New project` in the established heading position; `/demo` keeps its fixture control and behavior.
- Production mode submits exactly the metadata/files through same-origin `FormData` to `/api/projects` and never reaches fixture persistence.
- The create control is disabled during the request, prevents duplicate client submissions, and restores retryability after bounded failure.
- Client validation covers required fields and obvious PDF/type/size usability errors without replacing server validation.
- Success closes/resets the dialog, shows bounded waiting-for-extraction feedback, and reconciles the production list from server-authorized data.
- The new production Project Card renders `Waiting for extraction`, no published Master work, `0 of N PRDs processed`, `0%`, and `N PRDs uploaded` with no enabled `/demo` or fixture Share action.
- Production card props do not require `ProjectFixture`; fixture mode adapts its existing records to the shared presentation contract.
- `/demo` preserves its fixture create handler, simulated processing notification, share interactions, fixture routes, and scenario hydration.
- Dialog and card states remain accessible and visually coherent in both themes and at representative narrow widths; important state is not color-only.
- No raw PDF bytes, storage keys, local paths, cookies, or internal errors appear in client state or rendered markup.

## Validation

- Start and health-check the required Compose services before authenticated UI or database-backed checks. Run app build, test, rendered HTML/CSP, and integration commands in the Compose-managed `atlas` service; host-local rendering or direct DB access is not checkpoint evidence.
- Add component/helper tests for FormData fields, no base64 transport, one-in-flight behavior, safe response mapping, success reconciliation, validation, and retryable errors.
- Add render assertions for `/home` button placement/label, production dialog fields, card waiting labels, disabled action, no `/demo` href, and absence of fixture processing copy in production.
- Run representative `/demo` scenario/render and fixture creation/share regressions after the shared presentation refactor.
- Perform visual inspection in desktop, narrow desktop/tablet, mobile, light, dark, keyboard-focus, loading, validation-error, request-error, and empty states. Record any mismatch against the existing shell/token contract.
- Run the app build, rendered HTML/CSP suite, directly affected app tests, and app lint/type checks in the supported Compose environment. Existing unrelated lint failures must be recorded rather than hidden.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-PCC-005-01` The parent route selects production versus fixture authority; reusable components render explicit data/callback contracts.
- `BOUNDARY-PCC-005-02` PCC-003 owns session/CSRF/upload authority; this ticket owns browser interaction only.
- `BOUNDARY-PCC-005-03` Production card capability state comes from PCC-004 Atlas projection; fixture processing remains `/demo` behavior.

### Trust boundaries

- `TRUST-PCC-005-01` User-entered metadata/files cross from the dialog into a same-origin FormData request.
- `TRUST-PCC-005-02` The server response crosses into client list reconciliation; client state must not declare project creation successful without an accepted response.

### Sensitive assets and identity context

- `ASSET-PCC-005-01` Selected PRD bytes, filenames, response errors, and project capability labels must not reveal storage or auth internals.
- `IDENTITY-PCC-005-01` The UI presents the session identity supplied by `/home` and does not create a role or membership from client state.

### Required seams

- `SEAM-PCC-005-01` Production submission helper separates browser orchestration from the API/domain boundary and keeps request state independently testable.
- `SEAM-PCC-005-02` Shared card/form presentation accepts production-safe view models plus an explicit fixture adapter rather than importing fixture authority into production.
- `SEAM-PCC-005-03` The visual contract remains attached to shared components and both `/home` and `/demo` uses, including responsive/theme states.

### Prohibited couplings

- `COUPLING-PCC-005-01` Do not use client project arrays, fixture validators, fixture roles, or local timers as production authority.
- `COUPLING-PCC-005-02` Do not put database/storage logic in React components or expose a storage key/path through the card.
- `COUPLING-PCC-005-03` Do not make a real production card navigate to `/demo` or claim extraction has started.

### Intentionally unresolved security policy

- `SEC-GAP-PCC-005-01` Upload malware scanning, resumable upload, progress telemetry, document download policy, and production sharing remain future scope.

### Mandatory review bindings

- `REV-READY-PCC-005-01`
  Ref: `SEAM-PCC-005-01`
  Question: Does the browser submit production data through one bounded, retryable FormData seam without owning persistence or authority?
  Evidence: helper/component tests and network contract assertions.
- `REV-READY-PCC-005-02`
  Ref: `SEAM-PCC-005-02`
  Question: Does shared presentation remain reusable while production `/home` and fixture `/demo` keep distinct data and mutation authorities?
  Evidence: call sites, adapters, render tests, and `/demo` regressions.
- `REV-READY-PCC-005-03`
  Ref: `SEAM-PCC-005-03`
  Question: Does the UI preserve Atlas visual/token/theme/responsive/accessibility contracts across both affected routes?
  Evidence: rendered inspection, focus/state checks, and frontend review gate VIS-001–015.

## Review checkpoint

- **Review question:** Does the established Project Library support real production project creation and truthful waiting cards without leaking fixture authority or degrading the Atlas visual/interaction contract?
- **Combined acceptance:** `/home` uses the production API and view model, `/demo` remains intact, the dialog/card states are bounded and accessible, and the visual review gate passes across route, theme, and responsive states.

## Implementation checkpoint

- **Commit:** `f3b67f1` (`feat(atlas): add production project creation UI`)
- **Implemented:** `/home` now exposes `+ New project` in the established heading row. Its client-only submission seam validates bounded fields/files, sends exactly one same-origin multipart `POST /api/projects`, prevents duplicate submits while pending, maps bounded errors, announces successful waiting-for-extraction creation, closes/resets, and refreshes the server-authorized card list. It contains no fixture persistence, base64 transport, storage, or database logic.
- **Validated:** a rebuilt Compose image passed the two focused PCC-005 helper tests. The healthy Compose-managed `atlas` service passed `corepack pnpm --filter @atlas/app test`: 26 passed, 0 failed, 1 intentional worker-runtime skip. This includes the existing authenticated project-create and two-user `/home` integration checks.
- **Rendered inspection:** inspected the established `/demo` Entity Library and create dialog at desktop width. The production implementation reuses the same Project Library heading, card-grid fit bounds, dialog/form classes, semantic theme tokens, native labelled controls, field error wiring, and focus trap. Browser viewport overrides were unavailable, so narrow/mobile and alternate-theme visual checks remain CK review evidence rather than claimed implementation evidence.
- **Known environment result:** `docker compose run --rm --build --no-deps atlas ... test` builds and runs isolated helper checks but cannot reach the Compose app at `127.0.0.1:3001`; the healthy service rerun is the authoritative route result. Full app lint continues to report three pre-existing, out-of-scope errors in `components/RuntimeFixtureRoute.tsx` and `vite.config.ts`; PCC-005 paths build and test cleanly.

## CFC remediation checkpoint

- **CK source:** `PCC-BATCH-05-f3b67f1-review-session-2.md`, Round 1 `CHANGES_REQUIRED`.
- **Remediation commit:** `779712f` (`fix(atlas): remediate PCC-005 CK-001 CK-002 CK-003 CK-004`).
- **Addressed findings:** `CK-001` validates the success payload before dialog close/refresh and maps only bounded error copy; `CK-002` coalesces concurrent submits through a single in-flight helper; `CK-003` maps 409/413/415 and other known failures to the appropriate field or form alert; `CK-004` adds validation, safe-response, retry, authority-separation, and rendered-alert regression coverage.
- **Validated:** rebuilt Compose focused helper suite passed 5/5. The healthy Compose-managed `atlas` service passed `corepack pnpm --filter @atlas/app test`: 29 passed, 0 failed, 1 intentional worker-runtime skip. Targeted eslint for the three remediation files passed. Full lint remains limited to the pre-existing out-of-scope errors recorded above.
- **Next state:** `awaiting_review`; only CK may resolve the findings or issue PASS.

## CFC CK-004 coverage checkpoint (session 2 Round 2 follow-up)

- **Base / review:** `e85f00f7ae8128ab36969279033f48892f09d081`, `PCC-BATCH-05-e85f00f-review.md`; only open finding `CK-004` is addressed by this bounded pass.
- **Change:** replaces the source-regex render claim with actual Chromium component flows and adds failure-then-success coverage on the same submitter. Production success uses the real API and verifies refreshed, persisted waiting cards; fixture creation/share interactions execute with isolated fixture persistence.
- **Evidence:** [commands, results, rendered-state captures and limitations](PCC-005-cfc-ck004-validation.md). Final rebuilt Compose validation: 9/9 browser tests; app build and 36 passing app tests with 1 intentional skip; targeted lint clean. Existing full lint/type failures remain recorded.
- **Visual observation:** request/dialog states were inspected in both themes at desktop, tablet, mobile and 200%-equivalent reflow. Inspection also exposed an inherited production-card Master text wrapping defect, recorded for CK without modifying accepted PCC-004 code. No complete frontend PASS is claimed.
- **Next state:** remains `awaiting_review`. CK owns closure of `CK-004` and assessment of the recorded visual mismatch. No automatic CK round or PCC-006 advancement.

## CK-005 shared Project Card remediation checkpoint

- **Human authorization / remediation commit:** the user explicitly authorized a new implementation revision after the prior review-session convergence block; `0ca18ff` (`fix(atlas): remediate PCC-005 CK-005 shared cards`).
- **Change:** extracts the established `/demo` card markup into a presentation-only component, while `/demo` and `/home` retain separate fixture and production adapters. The shared card preserves the Master-state icon/grid, three metric slots, and two-action composition. Production renders its Share control disabled with a production-only inaccessible-state explanation; it has no fixture route, handler, or persistence authority.
- **Grid contract:** extracts the `/demo` card-grid formula and its parent resize observation into one shared hook. Both routes now apply the same 304px minimum, 400px maximum, 16px gap, column cap by item count, and animation-frame scheduling.
- **Validation:** rebuilt Compose Atlas image; focused ESLint over the shared card/grid and affected tests passed; `corepack pnpm --filter @atlas/app test` passed with **36 passed, 0 failed, 1 intentional worker-runtime skip**. `git diff --check` passed before commit. A live `/home` visual inspection confirmed the shared Master panel, three metrics, and two-action row.
- **Browser limitation:** the rebuilt Compose image lacked Playwright runtime libraries. `test:browser` could not launch Chromium because `libglib-2.0.so.0` was unavailable; an attempted OS-dependency installation did not complete. Do not treat browser-suite PASS as evidence for this checkpoint.
- **Next state:** `awaiting_review`; this is a committed implementation checkpoint for an explicitly authorized CK review. CK owns all findings and any review result.

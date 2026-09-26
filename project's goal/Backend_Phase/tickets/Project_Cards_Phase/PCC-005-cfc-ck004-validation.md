# PCC-005 CK-004 remediation evidence

- Date: 2026-09-26.
- Base: `e85f00f7ae8128ab36969279033f48892f09d081`.
- Source: `feedback/PCC-BATCH-05-e85f00f-review.md`, session 2, Round 2,
  `CHANGES_REQUIRED`; only `CK-004` is open. One CK round remains.
- Authority trace: `CK-004` → frozen PCC-005 Validation (helper/component retry,
  reconciliation, production rendering, fixture regressions and visual inspection)
  and `REV-READY-PCC-005-01/02/03` → executable coverage and recorded rendered states.
- State: `awaiting_review`. This is remediation evidence, not a CK decision.
  Historical reviews and accepted PCC-003/PCC-004 checkpoints are unchanged.

## Changes

The misleading retry test is replaced with eight failure-then-success tests on
the **same** submitter (network, 400, 409, 413, 415, 500, malformed JSON/schema).
The existing concurrent-call test separately proves identical promises and one
request. Multipart assertions check the exact field set and selected file bytes.

The TSX-regex “render” test is removed. A pinned development-only Playwright runner
executes the actual hydrated production and fixture components. Eight production
cases cover light/dark × desktop/tablet/mobile/reflow. They assert heading button
placement, labelled fields, validation alerts, focus entry/containment/restoration,
Escape/backdrop dismissal, disabled/loading controls, duplicate prevention,
bounded field/form errors, retained metadata/files, retry, and malformed-success
rejection without close/reset/refresh. The final retry goes to the real production
API: success closes/resets, announces waiting state, refreshes `/home`, shows the
server-authorized waiting card, survives reload and exists in PostgreSQL. No
production request reaches fixture persistence.

The fixture case executes creation, simulated processing/dismissal, sharing,
invite, role change, removal and scenario hydration. Its persistence transport is
mocked with the existing fixture scenario; component behavior and
`createFixtureProject` are real. It verifies fixture links and absence of production
requests. Existing scenario/render/CSP and authorized home integration tests remain
in the app suite. This is not a claim of a new fixture persistence integration test.

No production component, CSS, route, provider, authority boundary or accepted
dependency implementation changes. The new test command and dependency, generated
artifact ignores and reproduction README support only this finding.

## Validation

Final validation used a freshly rebuilt/recreated Compose `atlas` service, with
the host source and frozen lockfile copied by Dockerfile. Earlier harness debugging
used `docker compose cp`; those exploratory runs are not the final checkpoint.
Initial sandbox Docker access was denied; escalated Docker execution succeeded.

| Exact command | Final result |
|---|---|
| `docker compose up -d` | Required services started/healthy before integration. |
| `docker compose build --quiet atlas` | Passed with the final test source and pinned lockfile. |
| `docker compose up -d --no-build --wait atlas` | Recreated Atlas and verified Atlas/PostgreSQL healthy. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec playwright install --with-deps chromium` | Passed; Chromium 145 / Playwright 1.58.2 and test-only system libraries installed in the running container. Reinstall after container recreation. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` | **9 passed, 0 failed, 0 skipped**, 35.2s; generated 80 state screenshots. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/production-project-create.test.mjs` | **12 passed, 0 failed, 0 skipped** in the focused run; also passed in the rebuilt full suite below. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app test` | App build passed; **37 total, 36 passed, 0 failed, 1 intentional worker-runtime skip**. Includes rendered HTML/CSP, auth, production creation, authorized home and demo scenarios. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec eslint playwright.config.mjs tests/browser/production-project-create.spec.mjs tests/production-project-create.test.mjs` | Passed against the final files in the rebuilt image. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app lint` | Failed: the same 3 existing errors in `RuntimeFixtureRoute.tsx:18` and `vite.config.ts:54,99`; none in this delta. |
| `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec tsc --noEmit --incremental false` | Failed in unchanged demo, SourcesWorkspace, WorkspaceSwitcherPreview, auth-server, project-creation-boundary, Vite/worker and atlas-fixtures files, consistent with the source CK record. No full type-check PASS claimed. |
| `docker compose ps --format 'table {{.Service}}\t{{.Status}}'` | Atlas, PostgreSQL, agents-bridge and agents-bridge-worker all healthy after final browser validation. |
| `git diff --check` | Passed. |

Reproduction and test-boundary details:
[`apps/atlas/tests/browser/README.md`](../../../../apps/atlas/tests/browser/README.md).
Exploratory harness failures (FileList serialization, unavailable multipart body
inspection, hydration timing, fixture GET handling and role selector) were fixed
before the final full run; they are not reported as app defects or passing checks.

## Rendered inspection

Visual authority: the frozen PCC-005 Entity Library contract, existing Atlas
shell/tokens and shared Dialog/Button/form presentation. No new design direction.
Browser states were rendered by the Compose app in Chromium, then screenshots
were viewed. This is not source-only visual validation.

- Both themes at 1440×1000 desktop, 900×1000 tablet/narrow desktop, 390×844 mobile
  and 640×720 reflow (equivalent CSS width to 1280px at 200% zoom; browser zoom was
  not changed).
- Production: empty/hover, open dialog, visible keyboard focus, validation errors,
  loading/disabled, field error, form request error, rejected malformed success,
  successful waiting notice/card and dialog reset. Fixture: library and open
  dialog across the same theme/size matrix; creation/share behavior executed.
- Representative inspected captures below show readable alert copy, labelled
  fields, counts and actions, visible light/dark focus treatment and vertical
  reflow. Horizontal page/dialog overflow assertions passed in all captures.
  Desktop shows persistent navigation; narrow widths use the established compact
  shell. No sidebar implementation changed.

| State | Retained screenshot |
|---|---|
| Request error, light desktop | [Capture](evidence/PCC-005-CK-004/request-error-light-desktop.png) |
| Request error, dark mobile | [Capture](evidence/PCC-005-CK-004/request-error-dark-mobile.png) |
| Field error, light tablet | [Capture](evidence/PCC-005-CK-004/field-error-light-tablet.png) |
| Malformed success, dark reflow | [Capture](evidence/PCC-005-CK-004/malformed-success-dark-reflow.png) |
| Loading/disabled, light reflow | [Capture](evidence/PCC-005-CK-004/loading-light-reflow.png) |
| Keyboard focus, dark mobile | [Capture](evidence/PCC-005-CK-004/focus-dark-mobile.png) |
| Validation, light mobile | [Capture](evidence/PCC-005-CK-004/validation-light-mobile.png) |
| Waiting card, dark desktop — inherited mismatch below | [Capture](evidence/PCC-005-CK-004/waiting-card-dark-desktop.png) |
| Fixture library, light desktop | [Capture](evidence/PCC-005-CK-004/fixture-library-light-desktop.png) |
| Fixture dialog, dark mobile | [Capture](evidence/PCC-005-CK-004/fixture-dialog-dark-mobile.png) |

### Inherited visual mismatch returned to CK

The newly inspected success state exposes **word-by-word wrapping of the Master
description in the production waiting card**. `ProductionProjectCard.tsx:16`
places its sole content `div` in the first column of the existing
`.repository-master-state` grid (`globals.css:387`, `2rem minmax(0, 1fr)`). The
fixture card supplies a separate icon in that column; production does not. The
result is an unnecessarily tall card at desktop and mobile, visible in the
retained waiting-card screenshot. Text remains present, so behavioral and
horizontal-overflow assertions do not detect this composition defect.

This markup predates the remediation (last touched at accepted PCC-004 commit
`1cd1631`), and the current review explicitly carries accepted dependency
boundaries forward. It is recorded for CK to assess and route under its authority,
not silently repaired or waived by this CFC. No complete frontend PASS is claimed:
the request-state evidence satisfies the missing inspection obligation, while
this inherited card composition mismatch remains visible. CK owns finding status
and any subsequent disposition.

# Review: GLF-004 / BATCH-20 - Projects Route repository overview

- Reviewed commit: `d7c5f6c64d4e27ba3d640a76b48e3602956b5585`
- Baseline: Architecture Checkpoint sections 12–17, 22.5–22.8, 24; UI/UX Prototype PRD sections 4.2–4.3, 5–6, 9.1, 9.4; Fixture Data-Intent Contract; AUI-002; AUI-004; AUI-013
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Blocker | `project's goal/Git-Like_Fixture_Phase/README.md:36,39`; `project's goal/feedback/BATCH-19-47b67a8-review.md:25-30` | Delivery control and GLF-004 dependency: GLF-004 depends on GLF-003 and `go` may begin the next ticket only after the dependency has a final `PASS` review. | Accepted | Resolve and re-review GLF-003/BATCH-19 through a final `PASS` checkpoint before authorizing GLF-004/BATCH-20. The current dependency remains `awaiting_review`, its latest BATCH-19 review is `CHANGES_REQUESTED`, and that review explicitly says not to begin GLF-004. |
| F-002 | Important | `packages/atlas-fixtures/src/index.ts:74`; rendered `vendor-onboarding` card | Fixture Data-Intent Contract identity/relationship rule and GLF-004 acceptance: repository lifecycle, extraction progress, and metrics must be fixture-owned and mutually consistent. | Accepted | Reconcile the ready-for-review fixture so the project PRD identity/count, Initial Draft `processedPrds`/`totalPrds`, and uploaded-PRD metric describe the same records (for example, `2 of 2` if the project has two PRDs), and add a regression invariant for this relationship. |
| F-003 | Important | `apps/atlas/components/ProjectLibrary.tsx:43,58-63`; `apps/atlas/components/ProjectCard.tsx:39-53` | Approved AUI-005 / UI/UX Prototype PRD 4.4 behavior must remain reachable from the project library: an owner can open Share, while Editor and Viewer experiences remain restricted. | Accepted | Restore a reachable owner-only Share action in the reusable project-card composition and wire it to the existing project-scoped dialog state, preserving invite, role-change, removal-confirmation, and role restrictions. The current diff removes `canShare` and the card button, leaving the dialog unreachable; the rendered owner route exposes no Share control. |
| F-004 | Important | `packages/atlas-fixtures/src/index.ts:74`; `apps/atlas/components/ProjectCard.tsx:53`; `apps/atlas/app/demo/page.tsx:21-25` | GLF-004 outcome and acceptance: a completed Initial Draft is ready to open for review/publication, and the project destination must resolve by the stable project ID. | Accepted | Make the enabled ready-for-review action resolve to a project workspace/review surface for `vendor-onboarding`, or keep it explicitly unavailable until GLF-004-01 supplies that route/read adapter. Do not expose an enabled `Open project` link that navigates back to the Projects library with `No project selected`. |
| F-005 | Important | `project's goal/Git-Like_Fixture_Phase/GLF-004-projects-route-repository-overview.md:59-64`; no `BATCH-20` visual-validation record | GLF-004 validation and the frontend review gate require rendered desktop, tablet/narrow, and mobile checks for the three lifecycle states, accessible focus/action states, and responsive card alignment. | Accepted | Add a committed BATCH-20 validation record naming the actual rendered widths/themes and inspected published, extracting, ready-for-review, disabled/enabled action, focus, wrapping, metric, progress, and no-project-selected states. Automated source assertions and the green build/test/lint results do not establish the required responsive visual validation. |

## Decision

The implementation does render all three lifecycle states through one reusable
ProjectCard, keeps extracting actions disabled, separates empty Master from
Initial Draft, and uses semantic status tokens. The focused validation passes:
fixture tests 18/18, app render tests 8/8, lint, and `git diff --check` are
clean. The desktop render is visually coherent and the card sections align.

The checkpoint cannot pass because the dependency gate is not satisfied, the
ready-for-review fixture contradicts its own PRD metrics, the approved owner
sharing flow was removed from the library, the enabled review action does not
resolve to a workspace, and the required responsive validation evidence is not
committed. Existing uncommitted changes in `apps/atlas/package.json` and
`apps/atlas/.dev.vars` were not reviewed or modified.

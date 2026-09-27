# IDSER-009: Production project-card lifecycle

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-09`
- **Depends on:** IDSER-008 `PASS`; frozen PCC-004/005/006 and auth/home boundaries.
- **Baseline:** SRC-IDSER-01 sections 26-28, 37, 41.8; AC-01/26/27/30/39; SRC-IDSER-08/09. See [README](README.md).
- **Execution environment:** Docker Compose app/read-model tests and rendered browser evidence.

## Outcome

Show the four truthful production lifecycle states and processed-document
progress in the existing project library, derived from authorized persisted
Atlas state. Review-ready cards do not imply that a review surface exists.

## Inspected seams and edit scope

- Extend `packages/atlas-core/src/project.ts` AccessibleAtlasProject, `packages/atlas-db/src/project-repository.ts` authorized read and bundle-aware projection data.
- Extend `apps/atlas/lib/home-projects.ts`, `home-project-read-service.ts`, `components/project-card-view-model.ts`, `ProductionProjectCard.tsx`, and existing `project-creation-boundary.ts` internal home read as needed.
- Reuse `ProjectCardPresentation.tsx`, `ProjectLibrary.tsx`, shared Button/theme/type/status tokens and existing authenticated home refresh path. Keep actual lifecycle mapping server-side.
- The current mapper rejects any `hasDownstreamExtractionState`; replace that predecessor-only guard rather than allowing new cards to disappear. Retain membership joins and fail-closed handling of invalid/incomplete state.

## State and progress contract

| Persisted condition | View-model state | Visible label |
|---|---|---|
| New bundle waiting, no active processing or technical failure | `waiting-for-extraction` | Waiting for extraction |
| Active pipeline queued/running after bundle activation | `extracting` | Extracting |
| Technical/integrity failure blocks progress after supported retries or deterministic rejection | `needs-attention` | Needs attention |
| Every member completed and completion gate passed | `ready-for-review` | Ready for review |

Derive X from completed bundle members and N from the immutable manifest.
Render `X of N PRDs processed`. Percentage is `floor(100 * X / N)` for valid
N > 0, reaching 100 only with X=N; the ready label still requires the completion
gate. OCR-only or extraction-only completion does not increment X.

- Keep published-fact count zero and Master `No published work` in every state.
- Semantic contradictions/ambiguities may coexist with ready-for-review. They do not display as Needs attention.
- Persisted technical failure may expose a bounded safe user-facing reason, never provider error bodies, source prompts, SQL or internal execution/capability details.
- Retain explicit legacy PCC waiting projection only for intact pre-IDSER projects with no bundle or downstream state. Do not invent a bundle or auto-start historical processing. New bundle-backed records must satisfy the new invariants; invalid missing bundles cannot masquerade as valid new work.
- No timer, simulated fixture transition, browser inference, queue length or local storage may create progress. A bounded authenticated refresh may fetch persisted state; no new transport infrastructure is required.
- Keep the production workspace/review action unavailable with a truthful reason until a real authorized review surface exists. No production `/demo` navigation, fixture Share authority, review UI or attention queue.

## Frontend contract

Apply [frontend awareness](../../../../.agents/skills/frontend-awareness/SKILL.md),
established-language mode, existing-UI extension. The information pattern is
the existing Entity Library: project identity, meaningful state, concise
progress and truthful action availability. Frozen PCC visual ancestors and
shared components remain authoritative; no redesign is requested.

- All four states must remain understandable without color alone; use existing semantic status tokens with light/dark parity.
- Progress/status updates use appropriate accessible text/semantics and do not create repeated noisy announcements on refresh.
- Preserve keyboard/focus behavior and a discoverable disabled-action reason. Keep titles, counts and action labels readable.
- Respect card min/max width, shell expanded/collapsed state, sparse and multi-card layouts, mobile reflow and existing type roles. Do not solve longer state copy with shrinking type or accidental truncation.
- Inspect long maximum-valid names/IDs/descriptions, unbroken and mixed-case text, all states, loading/error refresh and both themes.

## Acceptance criteria

1. Authorized real projects remain visible through all four persisted states; unauthorized users receive no project lifecycle/progress.
2. X changes only after validated reconciliation completion; percentage and label are exact, no accepted fact count or published Master work appears.
3. Technical failure and semantic uncertainty render differently according to persisted authority; ready requires the full gate.
4. Legacy waiting cards remain readable without invented progress; corrupt state is not projected as success.
5. Production action availability is truthful, and `/demo` retains fixture creation/sharing/simulation behavior.
6. Shared visual language, themes, responsive layout and accessible status/action semantics pass rendered inspection.

## Validation

- Compose unit/read-model tests for every lifecycle state, X=0/partial/N, invalid N/counts, incomplete readiness, OCR-only/extraction-only results, uncertainty and terminal failure.
- PostgreSQL-backed authorized home reads for owner vs unrelated user, new and legacy records and malformed state; retain signed internal identity checks.
- Browser integration against real persisted state, observing transitions via the app's refresh path; no fixture timer may drive the production test.
- Render all states at desktop/tablet/mobile and 200% reflow, expanded/collapsed shell, sparse/multiple cards, light/dark themes and valid content extremes. Record screenshots plus accessibility/focus observations.
- Apply the [frontend review gate](../../../../.agents/skills/frontend-awareness/references/review-gate.md); build/lint alone is not visual proof. Run app tests/build/lint and directly affected `/demo`, auth and CSP regression checks in Compose.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** Better Auth -> server identity assertion -> Atlas membership-scoped read -> browser-safe projection.
- **Trust boundaries / assets:** persisted lifecycle -> public card response; project membership, name/description and safe progress metadata.
- **Identity context:** server-derived user ID, project/workspace/bootstrap bundle identities; display names remain presentation only.
- **SEAM-IDSER-009-01:** Separate authorized repository read, deterministic card mapping and presentation for later read-policy changes.
- **SEAM-IDSER-009-02:** Safe failure/status mapping and existing refresh path preserve error and caching controls.
- **COUPLING-IDSER-009-01:** No direct UI DB/semantic access, provider-detail leakage, fixture identity, simulated progress or `/demo` route fallback.
- **Unresolved security policy:** sharing/review authorization and new public actions remain deferred.
- **Planning findings:** PLAN-IDSER-05 is resolved by lifecycle-aware reads and explicit legacy compatibility.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-009-01 | SEAM-IDSER-009-01 | Are all card states membership-scoped and derived from persisted invariants? Repository/read-model tests. |
| REV-READY-IDSER-009-02 | COUPLING-IDSER-009-01 | Are action boundaries, fixture separation and response privacy intact? Browser/negative route tests. |
| REV-READY-IDSER-009-03 | SEAM-IDSER-009-02 | Are failure/status semantics truthful and accessible across themes/widths? Rendered evidence and frontend gate. |

## Review checkpoint

**Question:** Do production cards accurately communicate persisted processing
and readiness without inventing review access, progress or published truth?

**Implementation checkpoint:** Not started; record commit, Compose and visual evidence.

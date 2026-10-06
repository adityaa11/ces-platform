# Review: PCC-BATCH-04

- Ticket / batch: `PCC-004` / `PCC-BATCH-04`
- Reviewed commit: `33cccfa5778344b39ec5fb44a5bb985607bddd21` (`docs(atlas): clarify PCC-004 projection handoff`); implementation checkpoint `b045a2570c0d2923fa03c385a5c71db0cecbde7d`
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-004-authorized-home-project-read-and-card-projection.md` as clarified by `33cccfa`; source anchors `SRC-PCC-02`, `SRC-PCC-03`, `SRC-PCC-05`, and `SRC-PCC-07`
- Review round: 1 (fresh session authorized by the explicit ticket-boundary clarification)
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-04-c56376d-review.md` (`CHANGES_REQUIRED`, superseded baseline)
- Remediation commit: None
- Result: `CHANGES_REQUIRED`
- Convergence: Not applicable (Round 1)

## Evidence

- `PCC-004` remains `awaiting_review`, records implementation checkpoint `b045a25`, and the reviewed `HEAD` is the committed ticket-clarification revision `33cccfa`. The clarification explicitly keeps PCC-004 bite-sized: server authorization, read-model projection, and route-level contract proof. PCC-005 owns final card presentation, create interaction, responsive/theme behavior, and visual validation.
- `PCC-001` is approved; the Sign-In and Sign-Out ticket sets are frozen/approved. The prior PCC-004 artifact is preserved as the review of the superseded ticket wording; this fresh session does not treat it as a prior round.
- `git status --short --branch` shows no uncommitted tracked or in-scope implementation changes. Only the existing untracked review/context artifacts are present.
- `git show --stat HEAD` shows only the PCC-004/PCC-005 documentation clarification. `git show --stat b045a25` and the implementation diff remain the reviewed application/read-model checkpoint.
- `git diff --check HEAD^ HEAD` passed.
- The checkpoint records Compose health and application evidence: 22 application tests passed, 0 failed, 1 intentional worker-runtime skip; core/db typecheck, migration check, targeted lint, and application checks passed. CK did not independently rerun Compose because `docker compose ps --format json` failed with `permission denied while trying to connect to the Docker API at npipe:////./pipe/docker_engine`.
- Static inspection confirms no fixture/demo matches in `ProductionProjectCard.tsx`, `ProductionProjectLibrary.tsx`, `home-projects.ts`, or the `/home` route. The repository query joins `atlas.project_member` before returning project rows, but the route/read seam still has the defects below.
- The authenticated local browser empty state is not a PCC-004 blocker. The clarified ticket requires route-level contract proof, not PCC-005 visual validation; the checkpoint records the relevant rendered HTML assertions. The open browser has no production project, so it is not used as card evidence.
- The required security-refactor-readiness extension was applied to the clarified PCC-004 scope. The declared authority, identity, trust-boundary, sensitive-data, seam, prohibited-coupling, and mandatory-review bindings were inspected.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | `EXPLICIT`: PCC-004 Scope requires the existing server route to resolve the Better Auth session and pass its user ID to an authorization-scoped Atlas project-list repository/service; `TRUST-PCC-004-01` requires the server-resolved identity to cross into that query. | `apps/atlas/app/home/page.tsx:15-18`; `apps/atlas/lib/home-projects.ts:10-18`; `apps/atlas/project-creation-boundary.ts:47-51` | The page resolves `identity.userId` but discards it. `listHomeProjectCards` accepts only request headers, performs an internal HTTP fetch, and the middleware resolves the session a second time before calling `listAccessibleTo`. The required route-to-repository identity seam is absent. | Pass the resolved `identity.userId` directly to an authorization-scoped read service/repository and map its result to the browser-safe view model. Do not re-resolve the session through an internal page-to-route HTTP hop. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | `NECESSARILY_ENTAILED`: `TRUST-PCC-004-01` and `ASSET-PCC-004-01` require server identity and private membership data to remain within the approved server boundary; `COUPLING-PCC-004-01` prohibits using request/client context as an authorization substitute. | `apps/atlas/lib/home-projects.ts:11-13` | The read path builds `http://${requestHeaders.get("host")}/api/projects/home` and forwards the incoming `cookie` header. A caller-controlled `Host` value selects the cookie-bearing destination, and the hard-coded `http` scheme can downgrade the internal hop. | Use a fixed trusted in-process/service boundary that receives the already-resolved user ID, or another explicitly approved authority. Never derive the destination from the request `Host` header or forward the browser session cookie to that destination; add a Host-independence regression. |
| CK-003 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | OPEN | `EXPLICIT`: PCC-004 requires lifecycle state to be derived from persisted Atlas records; the canonical `Waiting for extraction` condition requires an Initial Draft with PRDs, an empty Master, and no downstream extraction state. `SEAM-PCC-004-02` requires a future lifecycle attachment point without enabling later states. | `packages/atlas-db/src/project-repository.ts:27-29`; `packages/atlas-core/src/project.ts:27-34`; `apps/atlas/lib/home-projects.ts:5-7`; `apps/atlas/components/ProductionProjectCard.tsx:5-18` | The authorization query returns only project metadata and an Initial Draft document count. It does not read or establish the empty Master state or absence of downstream extraction state. The adapter accepts any count >= 1 and the component hard-codes `Waiting for extraction`, `No published work`, `0%`, and zero published facts. The changed tests cover count 2, zero, and `NaN`, but do not test the required projection behavior for empty Master, Initial Draft, and no downstream extraction state. | Return/check the required persisted state at the read-model boundary and derive the route-level projection from that state. Add focused projection coverage for zero/invalid state, one and multiple PRDs, empty Master, Initial Draft, and no downstream extraction state. |

## Advisory observations

- PCC-004's clarified handoff is now explicit: PCC-005 consumes the accepted server model and must not rederive lifecycle truth in client code.
- Full card visual/theme/responsive/accessibility validation is intentionally deferred to PCC-005 and is not a PCC-004 finding.
- The ticket records three unrelated pre-existing application lint violations in `RuntimeFixtureRoute.tsx` and `vite.config.ts`; they are outside the PCC-004 changed boundary.
- The Worker/Cloudflare runtime is not treated as mandatory scope because the frozen PCC-004 ticket names Docker Compose for validation but does not identify a production deployment runtime.

## Decision

The clarification correctly narrows PCC-004 without changing its required read/projection behavior. The implementation still has three open, repairable findings: the resolved user ID is not passed directly to the read service, the read path forwards cookies to a request-Host-derived destination, and the projection does not validate all persisted conditions behind `Waiting for extraction`. `PCC-BATCH-04` receives `CHANGES_REQUIRED`; keep PCC-004 at `awaiting_review`. CFC may address only CK-001 through CK-003. PCC-005 remains gated on a later PCC-004 `PASS`.

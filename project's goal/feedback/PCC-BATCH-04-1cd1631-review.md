# Review: PCC-BATCH-04

- Ticket / batch: `PCC-004` / `PCC-BATCH-04`
- Reviewed commit: `1cd16313390b8990f3425ab9d408ccfd3cdfa0ef` (`fix(atlas): remediate PCC-004 CK-001 CK-002 CK-003`)
- Frozen ticket baseline: `project's goal/Backend_Phase/tickets/Project_Cards_Phase/PCC-004-authorized-home-project-read-and-card-projection.md`, clarified by `33cccfa`; source anchors `SRC-PCC-02`, `SRC-PCC-03`, `SRC-PCC-05`, and `SRC-PCC-07`
- Review round: 2
- Maximum review rounds: 3
- Prior review: `project's goal/feedback/PCC-BATCH-04-33cccfa-review.md`
- Remediation commit: `1cd16313390b8990f3425ab9d408ccfd3cdfa0ef`
- Result: `PASS`
- Convergence: `IMPROVING`

## Evidence

- `PCC-004` remains `awaiting_review`, and `HEAD` is the committed remediation for the prior Round 1 `CHANGES_REQUIRED` review. `git status --short --branch` shows no tracked or in-scope implementation changes; only untracked review/context artifacts are present.
- PCC-001 is approved, and the Sign-In and Sign-Out ticket sets are frozen/approved. The frozen ticket keeps final shared-card presentation, create interaction, responsive/theme behavior, and visual validation in PCC-005; those deferred obligations were not used as blockers.
- `git diff --check 33cccfa..HEAD` passed.
- `docker compose ps --format json` reported `postgres`, `atlas`, `agents-bridge`, and `agents-bridge-worker` healthy. `docker compose build --quiet atlas` completed successfully once, followed by `docker compose up -d --no-deps atlas`.
- Compose checks run with `node .agents/skills/ck/scripts/run-compose-checks.mjs --service atlas --no-build`: migration check, core typecheck, core tests, and database typecheck passed. The runner's ephemeral `docker compose run --no-deps` app check could not reach `127.0.0.1:3001`; this was a topology limitation, not an application assertion failure. The authoritative rerun inside the healthy service, `docker compose exec -T atlas corepack pnpm --filter @atlas/app test`, passed with 24 tests passed, 0 failed, and 1 intentional worker-runtime skip.
- The targeted changed-path lint passed through Compose. Full application lint still reports exactly three pre-existing errors in `apps/atlas/components/RuntimeFixtureRoute.tsx` and `apps/atlas/vite.config.ts`; neither file is part of this checkpoint.
- The remediation passes the prior identity-boundary requirement: `/home` resolves Better Auth identity and passes `identity.userId` to the fixed internal read service; the internal endpoint validates a timestamped HMAC, queries `listAccessibleTo(userId)`, and does not re-resolve or forward the browser session cookie. The destination is fixed to `http://atlas:3001/internal/home-projects`, independent of the request `Host` header.
- The remediation passes the persisted lifecycle requirement: the repository reads the Initial Draft document count, Master state, Initial Draft state, and whether a project document has downstream perception execution state. The adapter fails closed unless there is at least one PRD, an empty Master, a draft Initial Draft, and no downstream extraction state, then emits only the browser-safe waiting projection.
- The focused projection tests cover one and multiple PRDs, zero/invalid counts, missing lifecycle prerequisites, downstream extraction state, identity forwarding, and the absence of request-header/cookie/Host-derived transport. The Compose route test proves User A sees only the member project and its required waiting-state labels while User B receives the established empty state; it also proves no `/demo` link, fixture Share, storage key, source bytes, or private storage path reaches the browser.
- All declared PCC-004 security-readiness bindings were applied: `REV-READY-PCC-004-01` (fixture-independent browser-safe view model), `REV-READY-PCC-004-02` (disabled unavailable action without `/demo` or Share), and `REV-READY-PCC-004-03` (membership authorization before browser output). No new authority, fixture coupling, or sensitive-data exposure was introduced by the remediation.

## Findings

| ID | Classification | Origin | Status | Requirement / authority source | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | `EXPLICIT`: PCC-004 Scope requires the existing server route to resolve Better Auth and pass its user ID to an authorization-scoped Atlas project-list service; `TRUST-PCC-004-01` requires that server-resolved identity seam. | `apps/atlas/app/home/page.tsx:18`; `apps/atlas/lib/home-project-read-service.ts:12-22`; `apps/atlas/project-creation-boundary.ts:66-74` | The route now passes `identity.userId`; the fixed internal service carries only that identity assertion, and the internal endpoint authorizes the repository query with it. The Compose route test passed. | Preserve the resolved-identity-to-authorized-read seam and its regression coverage. |
| CK-002 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | `NECESSARILY_ENTAILED`: `TRUST-PCC-004-01`, `ASSET-PCC-004-01`, and `COUPLING-PCC-004-01` prohibit request-Host-derived authority and browser-cookie forwarding across the read boundary. | `apps/atlas/lib/home-project-read-service.ts:3,14-20`; `apps/atlas/tests/home-projects.test.mjs:43-48` | The transport uses a fixed Compose service URL and timestamped HMAC headers; it contains no request headers, cookie, Host, or interpolated HTTP destination. Targeted tests and the full authoritative app suite passed. | Preserve the fixed trusted boundary and Host/cookie-independence regression. |
| CK-003 | IMPLEMENTATION_DEFECT | INITIAL_REVIEW | RESOLVED | `EXPLICIT`: PCC-004 requires `Waiting for extraction` to derive from persisted PRD, empty-Master, Initial-Draft, and no-downstream-extraction state; `SEAM-PCC-004-02` requires a future lifecycle attachment point without enabling later states. | `packages/atlas-db/src/project-repository.ts:27-29`; `apps/atlas/lib/home-projects.ts:5-8`; `apps/atlas/components/ProductionProjectCard.tsx:4-17` | The repository now returns the persisted lifecycle prerequisites, the adapter fails closed for incomplete/later state, and the card emits the required waiting metrics and unavailable action. Projection and two-user rendered-route tests passed. | Preserve the persisted lifecycle query, fail-closed adapter, and route-level contract assertions. |

## Advisory observations

- Full application lint remains blocked by three unrelated pre-existing errors in `RuntimeFixtureRoute.tsx` and `vite.config.ts`; targeted lint for all PCC-004 remediation files passes.
- The worker-runtime test remains an intentional skip. Docker Compose is the authoritative PCC-004 execution environment, and the frozen ticket does not require Worker/Cloudflare deployment validation.
- PCC-005 remains responsible for final shared-card presentation, visual/accessibility review, responsive/theme behavior, and create interaction; this PASS does not approve those deferred obligations.

## Decision

The remediation materially closes all three Round 1 implementation findings without regression. PCC-004 now preserves the Better Auth identity and Atlas membership authority boundary, derives the waiting card from persisted Atlas lifecycle state, keeps the production projection fixture-independent and browser-safe, and passes the authoritative Compose route/build/test checks. `PCC-BATCH-04` receives `PASS` for the reviewed commit `1cd1631`; no further CK/CFC round is required for this session, and PCC-005 may proceed only through the project's GO/approval workflow.

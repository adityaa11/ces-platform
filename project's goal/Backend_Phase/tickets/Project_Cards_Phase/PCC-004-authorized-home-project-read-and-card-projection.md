# PCC-004: Authorized `/home` project read and card projection

- **State:** `in_progress`
- **Review batch:** `PCC-BATCH-04`
- **Depends on:** PCC-001 `PASS`; SIN and SOUT ticket sets frozen/approved
- **Execution environment:** Docker Compose is authoritative for Better Auth session reads, PostgreSQL authorization queries, app rendering, and integration checks; host-local commands are diagnostic only.
- **Baseline:** `SRC-PCC-02` §§6, 9, 16–17, 20–24, 32–36, 43–47; `SRC-PCC-03` §§1–2; `SRC-PCC-05`; `SRC-PCC-07`

## Outcome

Replace the hard-coded `projects = []` production read on `/home` with a
server-authorized Atlas project query and a production-safe Project Card view
model. A new project must be projected from persisted project, workspace, and
document metadata into `Waiting for extraction`, without pretending to be a
`ProjectFixture` or opening a fixture route.

This ticket owns the read/projection seam. PCC-005 owns the client dialog,
submission interaction, shared presentation refactor, and visual validation.

## Scope

- Resolve the current Better Auth session in the existing server route and pass its user ID to an authorization-scoped Atlas project-list repository/service.
- Update `apps/atlas/app/home/page.tsx` or the repository-equivalent route composition to supply real production project view models.
- Define or adapt a production-safe `ProjectCardViewModel` that is independent of `ProjectFixture` while remaining consumable by shared presentation.
- Project only persisted Atlas data: human Project ID, name, description/summary, empty Master state, Initial Draft source-document count, and bounded card metrics/action state.
- Derive the initial lifecycle state deterministically:

  ```text
  Initial Draft has one or more uploaded PRDs
  AND no downstream extraction state exists
      -> Waiting for extraction
  ```

- Render the truthful new-project card state: `Waiting for extraction`, `No published work`, `0 of N PRDs processed`, `0%`, `0 published facts`, and `N PRDs uploaded` or equivalent labels consistent with the established card layout.
- Keep project listing server-authorized. Do not enumerate all projects and filter in React.
- Keep production card actions disabled/unavailable until a production workspace route exists. Do not calculate `demoHref(...)` for a real project, add production Share, or invent a production route.
- Preserve the empty state for an authenticated user with no memberships and keep the Better Auth identity/profile behavior frozen.
- Keep card state derived from Atlas records, not timers, fixture processing flags, filenames, project names, or hard-coded demo scenarios.

Do not add extraction states beyond this checkpoint, accepted semantic facts,
publication, project sharing, document download, workspace navigation, or any
review projection data.

## Acceptance criteria

- `/home` lists only projects accessible through the current user's Atlas membership.
- User A's project is visible to User A and absent for User B without membership; the browser receives no unauthorized projects.
- Production cards do not use `ProjectFixture` as their domain contract or import fixture records as a production fallback.
- A newly created project displays the required waiting state and correct `N` PRD count from persisted document metadata.
- A new card shows no published Master work, no published facts, no extraction-complete state, and no enabled production project-opening action.
- A production card never links to `/demo` and does not expose fixture Share behavior.
- A user with no production projects still receives the established empty state.
- The route does not create a project, mutate fixtures, enqueue jobs, query perception state as a UI shortcut, or infer project authorization from authentication alone.
- The production view model does not expose storage keys, filesystem paths, session IDs, raw source bytes, or private document URLs.

## Validation

- Start and health-check PostgreSQL through Docker Compose before authenticated `/home` or repository tests. Run the route, database, build, and rendering checks inside the Compose-managed `atlas` service; do not treat fixture-only or host-local DB results as authoritative.
- Add a server/read-model test for two users proving membership-scoped listing and no browser-side filtering.
- Add projection tests for zero PRDs/invalid state handling, one and multiple PRDs, empty Master, Initial Draft, and no downstream extraction state.
- Add rendered route assertions for the production card labels, absence of `/demo` project links, absence of fixture Share, and preserved empty state.
- Exercise `/home` with the existing Better Auth session integration and verify sign-in/sign-out route behavior remains unchanged.
- Run application build, rendered HTML/CSP tests, directly affected app tests, and app type/lint checks in the supported Compose environment.
- Inspect the route and view model for fixture imports, client-side authorization, timers, fake progress, and private storage metadata leakage.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-PCC-004-01` Better Auth identifies the current user; Atlas membership authorizes project reads.
- `BOUNDARY-PCC-004-02` `/demo` remains fixture authority; production cards are projections of Atlas records only.
- `BOUNDARY-PCC-004-03` Project Card state is a read projection and does not become accepted Atlas truth.

### Trust boundaries

- `TRUST-PCC-004-01` Server-resolved identity crosses into an authorization-scoped repository query.
- `TRUST-PCC-004-02` Atlas project/workspace/document metadata crosses into a UI-facing view model with private storage fields removed.

### Sensitive assets and identity context

- `ASSET-PCC-004-01` Membership visibility, project metadata, document counts, and lifecycle state can reveal private project information and must be scoped server-side.
- `IDENTITY-PCC-004-01` Profile identity remains Better Auth-backed and must not be used as a substitute for project membership.

### Required seams

- `SEAM-PCC-004-01` A production view-model adapter must allow shared Project Card presentation without coupling it to fixtures or persistence details.
- `SEAM-PCC-004-02` The read path must preserve a future attachment point for workspace authorization and later lifecycle states without enabling them now.
- `SEAM-PCC-004-03` The disabled/unavailable card action must remain an explicit capability boundary until a production workspace route is approved.

### Prohibited couplings

- `COUPLING-PCC-004-01` Do not treat successful authentication, project name, URL parameters, or client list membership as project authorization.
- `COUPLING-PCC-004-02` Do not map real Atlas records into fixture IDs, `demoHref`, fixture processing state, or fixture sharing state.
- `COUPLING-PCC-004-03` Do not expose storage identity or raw document content through card props or rendered HTML.

### Intentionally unresolved security policy

- `SEC-GAP-PCC-004-01` Fine-grained workspace/document authorization, production sharing, project deletion, and route-wide authorization remain future Atlas work.

### Mandatory review bindings

- `REV-READY-PCC-004-01`
  Ref: `SEAM-PCC-004-01`
  Question: Can real Atlas cards use shared presentation without making fixture records the production domain contract?
  Evidence: view-model/type diff, route render, and fixture isolation assertions.
- `REV-READY-PCC-004-02`
  Ref: `SEAM-PCC-004-03`
  Question: Does the card remain unable to open `/demo` or claim an unavailable production capability?
  Evidence: rendered production markup and action-state tests.
- `REV-READY-PCC-004-03`
  Ref: `COUPLING-PCC-004-01`
  Question: Is listing authorization enforced before data reaches the browser?
  Evidence: repository/read integration with two users and route output inspection.

## Review checkpoint

- **Review question:** Does authenticated `/home` read only authorized Atlas projects and render a truthful production card model without fixture/domain or route leakage?
- **Combined acceptance:** Real project state replaces the empty hard-code, waiting-state metrics are persisted-data projections, private metadata stays server-side, and no production card opens `/demo` or starts downstream work.

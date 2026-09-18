# SIN-002: Production identity and project-library authority boundary

- **State:** `planned`
- **Review batch:** `SIN-BATCH-02`
- **Depends on:** SIN-001 `PASS`
- **Baseline:** [Sign-In and Authenticated Home Implementation Context](../../atlas-sign-in-home-implementation-context.md) §§9–15, 18–19, 21, 24–28; [Backend Phase README](../../README.md) implementation expectations; AC-05–AC-11 and AC-14

## Outcome

Refactor the shared application-shell contracts so authenticated identity is represented by name/email independently from project membership, and make `ProjectLibrary` explicitly choose between fixture behavior and production-shaped behavior. `/home` must be able to pass `projects = []` without causing fixture hydration or fixture mutations.

## Scope

- Introduce an `AuthenticatedUser` shape or equivalent shared contract containing only `name` and `email`.
- Keep project membership/role as a separate optional context used only where an actual project membership exists; do not make `owner`, `editor`, or `viewer` a required property of base authenticated identity.
- Add an explicit `ProjectLibrary` mode/data-source contract, such as `mode="fixture" | "production"`, while preserving the current `/demo` fixture behavior.
- In production mode, initialize and render only the supplied production project list. With `projects=[]`, render zero project cards and the established empty state.
- In production mode, do not call `/api/local-fixtures`, hydrate fixture cards, import fixture session identity as runtime authority, create fixture records, share fixture memberships, or write fixture projects.
- In fixture mode, preserve the existing `/demo` scenario behavior, including deliberate fixture registry hydration and fixture-only create/share interactions covered by existing regression scenarios.
- In production mode, hide or disable `+ New project` and share actions until a separately approved production project boundary exists. Do not make fixture creation appear to be production behavior.
- Keep the shared visual components reusable rather than cloning the entire demo project-library UI.

This ticket may update `ProjectLibrary.tsx`, `AppShell.tsx`, `ProfileMenu.tsx`, and a shared identity/type module as needed to establish the contract. It does not yet add `/home`, change application root links, or implement session lookup; those are SIN-003 responsibilities.

## Acceptance criteria

- A base authenticated user can be represented with `name` and `email` and no synthetic project role.
- Project role/member data is supplied only as explicit project context; no default `owner`, `editor`, or `viewer` value is created to satisfy a component type.
- `ProjectLibrary` has an explicit fixture/production authority boundary visible at its call site or equivalent contract.
- Production mode with `projects=[]` renders no project cards and the existing empty state, without a later `/api/local-fixtures` fetch.
- Production mode exposes no fixture-backed create, share, membership, invite, or project mutation path.
- Fixture mode preserves the `/demo` scenario behavior and remains able to use its existing fixture data and fixture-only interactions.
- Shared presentation is reused; the implementation does not fork a second copy of the project-library UI solely for `/home`.
- No project persistence, project authorization, memberships, workspace access, roles, permissions, Master, Initial Draft, JWT, or custom auth session is introduced.

## Validation

- Add focused component/route-contract coverage proving production mode with an empty list makes no request to `/api/local-fixtures` and exposes no production create/share mutation.
- Run representative `/demo` scenario and fixture project-creation/share regressions to prove fixture mode remains unchanged.
- Render the shared shell with a name/email-only user and verify no project-role label is invented when membership context is absent.
- Run strict CSP, rendered HTML, app build, and directly affected test/lint/type checks.
- Inspect the final diff for any accidental import of fixture identity or fixture mutation logic into the production branch of the contract.

## Security Refactor Readiness

Status: planning-review-required

### Inherited boundaries

- `BOUNDARY-SIN-002-01` Better Auth identity/session is distinct from Atlas project membership and authorization.
- `BOUNDARY-SIN-002-02` `@atlas/fixtures` is test/demo/golden material and is not production identity, membership, or trusted project state.

### Trust boundaries

- `TRUST-SIN-002-01` Session-backed identity enters shared presentation from a server-owned route; it must not be reconstructed from fixture or browser state.
- `TRUST-SIN-002-02` Fixture authority and production-shaped project data are separate data-source branches, even when they share visual components.

### Sensitive assets and identity context

- `ASSET-SIN-002-01` Project cards, membership labels, invite state, and create/share actions can imply authorization; they must not be rendered from fixture data in production mode.
- `IDENTITY-SIN-002-01` Preserve name/email as the identity context while leaving project membership absent until Atlas supplies it.

### Required seams

- `SEAM-SIN-002-01` The explicit library mode is the attachment point for a future production project repository without importing fixture behavior.
- `SEAM-SIN-002-02` Separate authenticated identity from project membership so later authorization can attach at the project boundary without redesigning profile presentation.
- `SEAM-SIN-002-03` Keep create/share controls behind an explicit authority capability rather than deriving permission from identity alone.

### Prohibited couplings

- `COUPLING-SIN-002-01` Do not use fixture fetches, fixture stores, or fixture memberships as a fallback when production projects are empty.
- `COUPLING-SIN-002-02` Do not make a role required on `AuthenticatedUser` or infer ownership/editor/viewer access from successful authentication.

### Intentionally unresolved security policy

- `SEC-GAP-SIN-002-01` Production project authorization, membership resolution, RBAC, creation, sharing, and invitation policy remain future Atlas-owned work.

### Planning finding

- `FINDING-SIN-002-01` The current shared components combine identity and project-role data and embed fixture mutation behavior. Ticket finalization requires the explicit production/fixture contract and role separation described above; otherwise SIN-003 cannot safely render a real session with zero projects.

### Mandatory review bindings

- `REV-READY-SIN-002-01`
  Ref: `SEAM-SIN-002-01`
  Question: Can a future production project repository be attached without changing fixture mode or importing `/api/local-fixtures` behavior?
  Evidence: mode contract, production branch, and no-fixture-fetch test.
- `REV-READY-SIN-002-02`
  Ref: `SEAM-SIN-002-02`
  Question: Is authenticated identity represented without an invented project role or membership?
  Evidence: shared type/component contract and rendered shell assertion.
- `REV-READY-SIN-002-03`
  Ref: `COUPLING-SIN-002-01`
  Question: Are fixture creation, sharing, and hydration unavailable from production mode while `/demo` remains functional?
  Evidence: production negative tests and fixture regression tests.

## Review checkpoint

- **Review question:** Does the shared project-library boundary distinguish fixture authority from production-shaped empty state and keep authenticated identity separate from project membership?
- **Combined acceptance:** Production mode is explicitly selected, `projects=[]` remains genuinely empty, fixture reads/writes cannot leak into it, fixture `/demo` behavior remains available, and no role/authorization is invented.
- **Implementation commit:** Record when `SIN-BATCH-02` enters `awaiting_review`.

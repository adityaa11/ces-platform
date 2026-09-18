# Atlas Sign-In and Authenticated Home Ticket Set

- **State:** `in_progress` — `SIN-001` is approved; `SIN-002` / `SIN-BATCH-02` is authorized by `go`.
- **Primary implementation baseline:** [Sign-In and Authenticated Home Implementation Context](../../atlas-sign-in-home-implementation-context.md)
- **Phase boundary:** [Atlas Backend Phase README](../../README.md)
- **Approved authentication dependency:** [BSS-004 Better Auth persistence](../Stack_Setup/BSS-004-better-auth-persistence.md)
- **Related frozen work:** [Sign-Up Ticket Set](../Sign_Up_Phase/README.md)

## Purpose

Wire the existing `/sign-in` screen to the approved Better Auth email/password boundary and introduce `/home` as the first production-shaped authenticated landing route.

The result must be:

```text
/sign-in
    |
    +-- POST /api/auth/sign-in/email
    |
    v
Better Auth identity/session
    |
    v
/home
    |
    +-- session.user.name
    +-- session.user.email
    +-- projects = []
```

`/demo` remains the fixture/golden-scenario route. Shared presentation may be reused, but fixture identity, fixture projects, fixture memberships, and fixture mutations must not become production authority on `/home`.

## Scope decision

This set covers:

- browser-facing email/password sign-in;
- normal Better Auth session-cookie establishment;
- successful sign-in navigation to `/home`;
- the authenticated `/home` route and its session guard;
- a session-owned name/email presentation contract without an invented project role;
- explicit fixture versus production mode for the shared project-library shell;
- an empty production project library with no fixture hydration or fixture mutations; and
- focused sign-in, session, home, fixture-isolation, build, CSP, and regression validation.

This set does not reopen the approved sign-up tickets. In particular, changing successful sign-up navigation from `/demo` to `/home` is a separate follow-up scope change after this set is accepted. It also does not implement project persistence, project creation, sharing, memberships, RBAC, workspace authorization, JWTs, OAuth, MFA, password reset, email verification, sign-out UI, or production workflow data.

## Delivery order

Each ticket is its own review batch. The tickets change shared contracts or authority boundaries in sequence, so they are not batched together.

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | [SIN-001](SIN-001-sign-in-form-and-submission.md) / `SIN-BATCH-01` | `approved` | BSS-004 approved; SUS set approved/frozen | Does `/sign-in` submit existing credentials through Better Auth and navigate to `/home` only after a successful response, with bounded failure behavior? |
| 2 | [SIN-002](SIN-002-production-identity-and-project-library-boundary.md) / `SIN-BATCH-02` | `in_progress` | SIN-001 `PASS` | Does the shared shell distinguish authenticated identity from project membership and keep fixture project data/mutations behind an explicit fixture mode? |
| 3 | [SIN-003](SIN-003-authenticated-home-route-and-navigation.md) / `SIN-BATCH-03` | `planned` | SIN-002 `PASS` | Does `/home` resolve the current Better Auth session and render the shared shell with real name/email, empty production projects, route-correct navigation, and no fake logout/role? |
| 4 | [SIN-004](SIN-004-sign-in-home-end-to-end-validation.md) / `SIN-BATCH-04` | `planned` | SIN-001 through SIN-003 `PASS` | Does the complete sign-in-to-home flow work against the existing auth persistence while `/demo`, CSP, fixture, and authorization boundaries remain intact? |

## Review controls

- Tickets remain `planned` until explicitly authorized through `go`.
- Work only the current ticket or batch. A dependent ticket cannot begin until the prior batch has a `PASS` feedback file for its final reviewed commit and the user says `go`.
- When a batch is implemented, validated, and committed, set it to `awaiting_review` and record the implementation commit in the ticket.
- Use one consolidated `ck` feedback file per batch and at most one remediation commit for that review stage.
- A new requirement that changes this implementation context is a `SCOPE_CHANGE`; record it separately, update the baseline only with user approval, and do not absorb it into an active ticket.

## Shared acceptance boundary

The complete set must satisfy the source context's AC-01 through AC-15:

- real sign-in through `POST /api/auth/sign-in/email` and the existing Better Auth service;
- normal PostgreSQL-backed Better Auth session/cookie behavior;
- post-success navigation to `/home`;
- session-backed name/email in the profile area;
- no synthesized owner/editor/viewer role without project membership;
- genuinely empty production project state;
- no `/api/local-fixtures` hydration or fixture project mutation on `/home`;
- shared UI reuse with `/demo` isolation;
- production navigation that does not fall back to `/demo`;
- no JWT or parallel browser session architecture;
- no project authorization or project-state invention; and
- existing BSS-004, sign-up, build, CSP, fixture, and directly affected app checks remain valid.

## Frozen boundaries

The ticket set preserves these authorities:

```text
Better Auth  -> identity, email/password credentials, sessions, cookies
Atlas        -> project authorization, memberships, roles, trusted project state
@atlas/fixtures -> demo/golden/regression material only
```

The authenticated home route is allowed to be empty. Empty project state is evidence that authentication has not been confused with project ownership.

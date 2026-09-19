# Atlas Sign-Out Ticket Set

- **State:** `complete` — SOUT-001 through SOUT-004 are approved; the Sign-Out ticket set is frozen.
- **Primary implementation baseline:** [Sign-Out Implementation Context](../../atlas-sign-out-implementation-context.md)
- **Phase boundary:** [Atlas Backend Phase README](../../README.md)
- **Execution and validation environment:** use the [canonical Docker Compose environment](../../README.md#canonical-docker-compose-implementation-and-validation-environment) for runnable implementation checks, tests, builds, lint, type checks, and application validation; `docker compose ps` is the service-health gate only.
- **Frozen authentication dependency:** [BSS-004 Better Auth persistence](../Stack_Setup/BSS-004-better-auth-persistence.md)
- **Related frozen work:** [Sign-Up Ticket Set](../Sign_Up_Phase/README.md) and [Sign-In and Authenticated Home Ticket Set](../Sign_In_Phase/README.md)
- **UI baseline:** [Atlas UI/UX Prototype PRD](../../../Atlas_UI_UX_Prototype_PRD.md) §§4.1, 7, and 9.4; the existing shared Atlas shell/profile-menu visual language

## Purpose

Wire the existing production `/home` account menu to the approved Better Auth sign-out endpoint. A user must remain on the authenticated surface until `POST /api/auth/sign-out` succeeds; only then may Atlas replace navigation with `/sign-in`.

The account remains intact. Sign-out invalidates the current browser session only. `/demo` remains fixture authority and must not be forced through production session semantics.

## Frozen baseline and scope

The [Sign-Out Implementation Context](../../atlas-sign-out-implementation-context.md) is the authoritative feature baseline for this set. The existing mounted Better Auth catch-all route already exposes `POST /api/auth/sign-out`; no new auth route, auth service, session store, schema, migration, or direct database deletion path is planned.

The set preserves the established authority split:

```text
Better Auth       -> identity, credentials, sessions, session cookies
Atlas             -> project authorization and project/workspace state
@atlas/fixtures   -> /demo prototype, golden, and regression state
```

This set does not implement sign-out-all-devices, session management, account deletion/deactivation, password recovery/change, email verification, MFA, OAuth, route-wide middleware, project persistence, memberships, RBAC, invitations, or a sign-up destination change.

## Delivery order

Each ticket is its own review batch. The boundaries are sequential because the menu wiring depends on a testable submission seam, application proof depends on the wired control, and the final regression checkpoint depends on all preceding behavior.

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | [SOUT-001](SOUT-001-sign-out-submission-seam.md) / `SOUT-BATCH-01` | `approved` | BSS-004 approved; SUS and SIN sets approved/frozen | Does the browser-facing sign-out seam call the approved endpoint once, navigate only on success, and remain safely retryable on failure? |
| 2 | [SOUT-002](SOUT-002-production-account-menu-wiring.md) / `SOUT-BATCH-02` | `approved` | SOUT-001 `PASS` | Does the production account menu expose a real responsive `Sign out` button while `/demo` retains its explicit fixture behavior? |
| 3 | [SOUT-003](SOUT-003-application-sign-out-validation.md) / `SOUT-BATCH-03` | `approved` | SOUT-001 and SOUT-002 `PASS` | Does the browser-facing flow invalidate the current Better Auth session, preserve the account, and protect `/home` after sign-out? |
| 4 | [SOUT-004](SOUT-004-sign-out-regression-checkpoint.md) / `SOUT-BATCH-04` | `approved` | SOUT-001 through SOUT-003 `PASS` | Do the complete auth, fixture, CSP, build, and directly affected checks remain valid with real production sign-out? |

## Review controls

- Tickets remain `planned` until the user authorizes the relevant batch through `go`.
- Work only the current ticket or batch. A dependent ticket cannot begin until the prior batch has a `PASS` feedback file for its final reviewed commit and the user says `go`.
- When a batch is implemented, validated, and committed, set it to `awaiting_review` and record the implementation commit in the ticket.
- Use one consolidated `ck` feedback file per batch and at most one remediation commit for that review stage.
- A new requirement that changes this sign-out baseline is a `SCOPE_CHANGE`; record it separately, update the baseline only with user approval, and do not absorb it into an active ticket.

## Shared acceptance boundary

The complete set must satisfy the context's AC-01 through AC-16:

- production `/home` uses the existing `POST /api/auth/sign-out` Better Auth boundary;
- the control is a real button, not a navigation-only link;
- duplicate requests are prevented and navigation occurs only after success;
- bounded failures keep the user on the current surface, restore retryability, and avoid raw auth details;
- the previous session no longer resolves and `/home` redirects to `/sign-in` afterward;
- the Better Auth user/account and all Atlas project/workspace/membership/role/publication state remain intact;
- `/demo` remains fixture authority;
- no browser-owned token/session store, custom cookie, JWT, auth schema, or competing sign-out path is introduced;
- the BSS-004 lifecycle proof remains unchanged; and
- the production account menu works through the shared desktop and mobile presentations.

## Completion boundary

The ticket set is complete when an authenticated Atlas user can open the existing account menu on `/home`, press `Sign out`, have Better Auth invalidate the current session through `POST /api/auth/sign-out`, and reach `/sign-in` only after that invalidation succeeds, while the account, Atlas authority, fixture boundary, and approved SUS/SIN contracts remain unchanged.

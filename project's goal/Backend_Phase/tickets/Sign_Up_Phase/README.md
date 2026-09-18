# Atlas Sign-Up Ticket Set

- **State:** `approved`
- **Primary implementation baseline:** [Sign-Up Implementation Context](../../atlas-sign-up-implementation-context.md)
- **Architecture baseline:** [Atlas Backend Production Baseline](../../atlas-backend-production-baseline-mistral-synced.md) and [Atlas Core Architecture — Updated Checkpoint](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md)
- **Product context:** [Atlas Full Product Context](../../../Atlas_Full_Product_Context.md)
- **UI context:** [Atlas UI/UX Prototype PRD](../../../Atlas_UI_UX_Prototype_PRD.md)
- **Approved dependency:** [BSS-004 Better Auth persistence](../Stack_Setup/BSS-004-better-auth-persistence.md)

## Purpose

Wire the existing `/sign-up` screen to the approved BSS-004 Better Auth identity/session boundary. A successful sign-up creates a real identity and durable authenticated session, then enters the existing `/demo` surface without creating or granting Atlas project state.

This ticket set does not redesign authentication architecture. It does not implement sign-in UI, sign-out UI, password reset, email verification, OAuth, route protection, invitations, project creation, workspace creation, membership, RBAC, or any Agents Bridge, Mistral, document, knowledge, approval, or publication flow.

## Baseline and scope decision

The supplied [Sign-Up Implementation Context](../../atlas-sign-up-implementation-context.md) is the authoritative feature baseline for this set. It intentionally narrows the change to `/sign-up` and composes the approved BSS-004 boundary.

The fixture/production split is intentional. The sign-up fixture entry is being replaced by the real `@atlas/auth` implementation, while the separate `@atlas/fixtures` package continues to supply the fixture-backed `/demo` surface and golden/test scenarios. This is a safe transitional composition: real identity/session establishment enters a fixture-backed demo without turning fixture data into production authentication truth.

The ticket set does not merge the fixture package into the auth boundary, migrate demo fixtures into production tables, or require the rest of the prototype to become production-backed. Each ticket advances only through the normal review controls; this completed sign-up set is now approved and frozen.

## Delivery order

Each ticket is its own review batch because each checkpoint answers a distinct review question and the later tickets depend on the earlier implementation boundary.

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | [SUS-001](SUS-001-application-auth-boundary.md) / `SUS-BATCH-01` | `approved` | BSS-004 approved | Does the Atlas web app expose the existing Better Auth handler through one server-owned boundary without duplicating authentication or taking project authority? |
| 2 | [SUS-002](SUS-002-sign-up-form-and-auth-screen.md) / `SUS-BATCH-02` | `approved` | SUS-001 `PASS` | Does `/sign-up` collect the required identity fields and submit them through the browser-facing auth boundary with bounded success, loading, and failure behavior while other auth modes remain unchanged? |
| 3 | [SUS-003](SUS-003-sign-up-end-to-end-validation.md) / `SUS-BATCH-03` | `approved` | SUS-001 and SUS-002 `PASS` | Does the browser-facing sign-up flow create a durable Better Auth identity/session and preserve the existing app, CSP, fixture, and authorization boundaries? |

## Review controls

- Tickets remain `planned` until explicitly authorized through `go`; approved batches are frozen unless a new review stage is opened.
- Work only the ticket or batch currently authorized by `go`.
- When a batch is implemented, validated, and committed, set it to `awaiting_review` and record the commit in the ticket.
- Use one consolidated `ck` feedback file per batch and one remediation commit at most for that review stage.
- A dependent ticket cannot start until the prior batch has a `PASS` feedback file for its final reviewed commit and the user says `go`.
- A new requirement that changes the supplied sign-up baseline is a `SCOPE_CHANGE`; record it separately and stop for direction rather than absorbing it into an active ticket.

## Shared acceptance boundary

The complete set must satisfy AC-01 through AC-12 in the implementation context:

- real account creation through `@atlas/auth` and the existing `auth.*` boundary;
- durable Better Auth session cookie and post-success navigation to `/demo`;
- user-provided `name`, `email`, and `password`;
- safe, retryable failure behavior without internal details;
- no Atlas project/workspace/membership/role/permission creation;
- no architecture regression and no weakening of the existing auth lifecycle or frontend/CSP checks; and
- sign-up-only scope.

# Atlas Admin Auth Ticket Set

- **State:** `planned`
- **Primary baseline:** [Admin Auth Foundation + First Super Admin CLI Bootstrap](../../atlas-admin-auth-foundation.md)
- **Accepted dependency:** [BSS-004 Better Auth persistence](../Stack_Setup/BSS-004-better-auth-persistence.md)
- **Target branch:** `codex/new-atlas-backend`

## Purpose

Decompose the approved Atlas Admin Auth Foundation scope into finite implementation and review batches. The source baseline remains authoritative; these tickets do not add a second authentication system, a second identity store, or a new domain authorization model.

The complete set establishes:

```text
Better Auth identity + session authority
              |
              v
persisted admin role + durable bootstrap state
              |
              v
server-side admin guard
              |
              v
non-atomic bootstrap coordinator + controlled recovery
              |
              v
first-admin CLI bootstrap
              |
              v
real sign-in -> session -> protected Admin API evidence
```

## Scope boundary

In scope are the persisted Better Auth Admin `admin` role used as Atlas Platform Super Admin, the PostgreSQL bootstrap state machine, a server-side bootstrap coordinator with explicit same-attempt recovery, a repository-native password-prompting CLI, a reusable server-side authorization guard, one protected identity endpoint, integration tests AUTH-01 through AUTH-15, and an operator runbook.

Out of scope are Admin UI, dashboard or provider-profile UI, public administrator registration, invitations, multiple admin tiers, permission-management UI, mandatory MFA, password-recovery UI, a new auth service, unrelated BSS/GHR/IDSER/Semantic runtime changes, and changes to domain approval or activation authority.

## Delivery order

Each ticket is a separate review batch. A dependent ticket cannot begin until the required predecessor has passed review.

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | [AA-001](AA-001-admin-authority-and-bootstrap-state.md) / `AA-BATCH-01` | `planned` | BSS-004 `approved` | Does Atlas add only the persisted admin role and minimal durable bootstrap state while preserving Better Auth as the identity/session authority? |
| 2 | [AA-002](AA-002-server-admin-guard-and-identity-endpoint.md) / `AA-BATCH-02` | `planned` | AA-001 `PASS` | Does one reusable server guard enforce session validity, completed bootstrap state, and persisted Super Admin authority at the API boundary? |
| 3 | [AA-003](AA-003-bootstrap-coordinator-and-recovery.md) / `AA-BATCH-03` | `planned` | AA-001 `PASS` | Does the server-side coordinator enforce one durable reservation → provision → verify → seal/reconcile protocol without a parallel identity or credential authority? |
| 4 | [AA-004](AA-004-first-super-admin-bootstrap-cli.md) / `AA-BATCH-04` | `planned` | AA-003 `PASS` | Can an infrastructure operator invoke the approved coordinator through one password-safe native CLI, with no HTTP server or public sign-up path? |
| 5 | [AA-005](AA-005-auth-round-trip-regression-and-runbook.md) / `AA-BATCH-05` | `planned` | AA-002, AA-003, AA-004 `PASS` | Does the actual CLI → Better Auth sign-in → session cookie → protected Admin API round trip, restart/isolation regression evidence, and runbook prove the completed contract? |

## Workflow sizing decision

AA-001 and AA-002 each retain one durable boundary: respectively persistence authority and API authorization. The former AA-003 mixed two independently remediable boundaries—the non-atomic provisioning protocol and the operator interface—while the former AA-004 mixed every remaining implementation and acceptance concern. They are therefore replaced by AA-003 through AA-005 above.

Each new batch has one implementation or evidence owner, one review question, one bounded set of mutable files/behaviors, and a closed predecessor interface. This keeps a normal `go -> ck -> cfc -> ck` cycle reviewable; if a post-CFC result needs human/planning intervention, `hmn` can authorize only the frozen unresolved clauses for that one batch without reopening the coordinator, CLI, guard, or final evidence ticket as a whole.

## Review controls

- Tickets remain `planned` until explicitly authorized through the repository workflow.
- Work only the ticket or batch currently authorized.
- When a batch is implemented and validated, record the implementation commit and set the ticket to `awaiting_review`; do not self-assert `PASS`.
- Keep the source baseline and accepted BSS-004 boundary frozen. A requirement that changes either is a scope-change decision.
- Use the engineering implementation review for the base review. Each ticket's Security Refactor Readiness section supplies minimum mandatory bindings; it does not replace independent review.
- A repository-wide pre-existing typecheck failure is verification context, not permission to widen this scope into unrelated UI, fixture, or worker repairs.

## AUTH evidence ownership

Every baseline scenario remains required. To make each review batch independently reviewable, the required proof is owned by the narrowest implementing boundary; AA-005 re-executes the real cross-boundary round trip and verifies that the complete evidence map is present.

| Scenario | Owning ticket | Required proof |
|---|---|---|
| AUTH-01 | AA-004 | Fresh CLI bootstrap produces exactly one verified, active `admin` identity. |
| AUTH-02 | AA-004 | Credentials created through the coordinator are immediately eligible for normal Better Auth sign-in. |
| AUTH-03 | AA-005 | The real issued sign-in cookie accesses the protected Admin endpoint. |
| AUTH-04–AUTH-06 | AA-002 | No, ordinary, expired, and revoked session behavior is enforced by the reusable API guard. |
| AUTH-07–AUTH-10 | AA-003 | Replay, concurrency, interruption, and identity-collision behavior preserve one safe bootstrap attempt. |
| AUTH-11 | AA-005 | Role and sealed state survive application/database-client restart. |
| AUTH-12 | AA-003 | Public registration, ordinary mutation, and anonymous paths cannot gain `admin` authority. |
| AUTH-13 | AA-005 | Existing non-admin and service-to-service authentication behavior remains within the directly affected regression boundary. |
| AUTH-14 | AA-003 and AA-004 | Coordinator and CLI logs, metadata, errors, and output exclude password material and session secrets. |
| AUTH-15 | AA-005 | The actual Better Auth sign-in API issues the cookie used by the protected Admin request. |

This allocation does not relax any baseline scenario: each ID must have committed, database-backed evidence before AA-005 can complete.

## Shared acceptance boundary

The set is complete only when all of the following are demonstrated against the actual Better Auth/PostgreSQL configuration:

- one persisted `admin` role authority associated with the Better Auth user ID;
- one durable `UNINITIALIZED -> RESERVED -> SEALED` bootstrap state authority;
- immediate sign-in eligibility with `emailVerified = true`, active status, and Better Auth credentials;
- server-side `401` for absent/invalid sessions and `403` for ordinary users;
- successful access for a valid Super Admin session only after bootstrap is sealed;
- replay and concurrency rejection without duplicate administrators;
- interrupted-attempt handling that does not create an unauthorized usable admin and permits controlled same-attempt reconciliation;
- no public privilege escalation, password/hash/session-token leakage, or regression to existing application/service authentication; and
- a concise operator runbook with exact invocation, prerequisites, verification, repeat behavior, and recovery instructions.

## Non-goals and unresolved policy

This set does not define future MFA enforcement, admin-role management, audit-retention policy, account recovery policy, rate limiting, or the full future Admin Console authorization model. It preserves attachment points for those policies without inventing them now.

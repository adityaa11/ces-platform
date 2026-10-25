# AA-BATCH-01 GO checkpoint

- **Ticket:** AA-001 — Admin authority and durable bootstrap state
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Admin_Auth_Phase/AA-001-admin-authority-and-bootstrap-state.md`
- **Accepted predecessor:** BSS-004 Better Auth persistence (`approved`)
- **Review target:** `HEAD` (this committed AA-BATCH-01 checkpoint)
- **Ticket state:** `awaiting_review`

## Bounded implementation

- Enabled Better Auth 1.6.32's installed `admin` plugin with `user` as the default persisted role and `admin` as the only Atlas Platform Super Admin role.
- Added the plugin-owned role, ban, and impersonation columns to the existing `auth.*` mappings and PostgreSQL migration path. Better Auth remains the identity, password, credential, and session authority.
- Added the Atlas-owned singleton `admin_bootstrap_state` marker. It stores only state, attempt identity/email, the Better Auth user ID after creation, and timestamps; it stores no credentials, hashes, session tokens, or generic secret metadata.
- Added structural guards for `UNINITIALIZED -> RESERVED -> SEALED`, reservation-attempt immutability, sealed-state immutability, and a restrictive foreign key so deleting the initial user cannot erase/reopen a sealed marker.
- Granted coordination access only to `atlas_app`; the Agents Bridge role is explicitly denied access.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
|---|---|---|---|---|
| RC-AA001-01 | Scope; `BOUNDARY-AA001-01`; `REV-READY-AA001-01` | Better Auth remains the sole identity, credential, and session authority while persisting the single Atlas `admin` role; ordinary users receive the non-admin role. | `packages/atlas-auth/src/index.ts`; `packages/atlas-db/src/schema.ts`; `corepack pnpm --filter @atlas/auth test` passed, including durable session lifecycle and public signup role=`user`. | PROVEN |
| RC-AA001-02 | Scope; acceptance criteria; `SEAM-AA001-02`; `REV-READY-AA001-02` | One durable, exclusive bootstrap marker supports `UNINITIALIZED`, `RESERVED`, and `SEALED`, retains only non-secret recovery identity, and cannot reopen after sealing. | `packages/atlas-db/migrations/0109_aa001_admin_authority_and_bootstrap_state.sql`; `0110_aa001_bootstrap_reservation_fence.sql`; database-backed `corepack pnpm --filter @atlas/db test:admin-bootstrap-state` passed. | PROVEN |
| RC-AA001-03 | Scope; acceptance criteria; `COUPLING-AA001-01`; `REV-READY-AA001-03` | No parallel identity/credential/session/admin-user store; the bootstrap marker has no password or session-token fields and references only the Better Auth user ID. | Focused database test checks the exact bootstrap-table column inventory and foreign key; migration and changed-file inspection confirm no duplicate identity table. | PROVEN |
| RC-AA001-04 | Validation; inherited BSS-004 boundary | Migration is registered, applies through `@atlas/db`, preserves restricted role grants, and existing auth/database type boundaries remain valid. | `corepack pnpm --filter @atlas/db migrate` applied `0109`, `0110`; `corepack pnpm --filter @atlas/db migration:check` passed; database test confirmed `atlas_app` access and Bridge denial; `corepack pnpm --filter @atlas/db typecheck` and `corepack pnpm --filter @atlas/auth typecheck` passed. | PROVEN |

Internal readiness: READY_FOR_CK

This is an implementation readiness checkpoint, not a self-issued PASS. AA-002 through AA-005 remain out of scope.

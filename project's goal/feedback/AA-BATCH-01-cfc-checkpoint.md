# AA-BATCH-01 CFC checkpoint

- **Ticket:** AA-001 — Admin authority and durable bootstrap state
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Admin_Auth_Phase/AA-001-admin-authority-and-bootstrap-state.md`
- **Source CK artifact:** `project's goal/feedback/AA-BATCH-01-8a54297-review.md`
- **Reviewed implementation:** `8a54297f3774ce50880c047a4dad60da1212e06c`
- **CFC scope:** `CK-001.a`, `CK-002.a`, and `CK-003.a` only
- **Status:** `awaiting_review`

## Bounded remediation

- Added forward migration `0111_aa001_bootstrap_conflict_and_sealed_fence` and registered it in the repository-native migration runner.
- The reservation trigger now preserves attempt ID and email for every transition out of `RESERVED`, including the transition to `SEALED`.
- `atlas_app` no longer has `DELETE` on the singleton marker. `atlas.assert_admin_bootstrap_reconciliation_safe()` is the narrow, app-callable reconciliation guard that raises a distinct conflict when the marker is absent but `auth."user"` contains role `admin`.
- Extended the existing focused PostgreSQL test with rollback-only fixtures for the three frozen scenarios. No identity, credential, session, public endpoint, or future AA-002 through AA-005 behavior was added.

## Frozen Finding Closure Matrix

| Authorized clause | Status | Closure evidence | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `packages/atlas-db/tests/admin-bootstrap-state.test.mjs` removes the marker and adds exactly one `auth."user"` with role `admin` inside a rollback-only transaction; it invokes `atlas.assert_admin_bootstrap_reconciliation_safe()`, observes the distinct conflict, and confirms the admin count remains one. | `corepack pnpm --filter @atlas/db test:admin-bootstrap-state` — PASS, 1/1. | PASS — missing marker plus an existing admin fails closed without creating or authorizing a second admin. |
| `CK-002.a` | `PROVEN` | The same focused PostgreSQL test reserves attempt A, attempts to seal as attempt B against the real trigger, observes rejection, rolls back only the hostile statement, and confirms the durable row remains `RESERVED` with attempt A identity. | `corepack pnpm --filter @atlas/db test:admin-bootstrap-state` — PASS, 1/1. | PASS — a different attempt cannot seal or replace an existing reservation. |
| `CK-003.a` | `PROVEN` | The focused PostgreSQL test seals the marker through `atlas_app`, attempts deletion through that same application boundary, observes permission rejection, and confirms the marker remains `SEALED`; the fixture transaction is rolled back. | `corepack pnpm --filter @atlas/db test:admin-bootstrap-state` — PASS, 1/1. | PASS — the sealed marker remains present and sealed under the application boundary. |

## Direct regressions and validation

- `corepack pnpm --filter @atlas/db migrate` — PASS; applied `0111_aa001_bootstrap_conflict_and_sealed_fence`.
- `corepack pnpm --filter @atlas/db migration:check` — PASS.
- `corepack pnpm --filter @atlas/db typecheck` — PASS.
- `corepack pnpm --filter @atlas/auth typecheck` — PASS.
- `corepack pnpm --filter @atlas/db test:admin-bootstrap-state` — PASS, 1/1.
- `corepack pnpm --filter @atlas/db test:permissions` — PASS, 1/1.
- `corepack pnpm --filter @atlas/auth test` — PASS, 3/3.
- `git diff --check` — PASS.

Internal readiness: READY_FOR_CK

This is one bounded CFC remediation handoff. CK verification must reuse the frozen `CK-001.a`, `CK-002.a`, and `CK-003.a` oracles, inspect this remediation diff, and check only direct regressions.

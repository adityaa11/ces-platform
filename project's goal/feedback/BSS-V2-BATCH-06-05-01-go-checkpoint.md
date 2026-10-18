# GO checkpoint — BSS-V2-006-05-01

- **Ticket:** `BSS-V2-006-05-01` — Authorized enforcement-policy provenance
- **Batch:** `BSS-V2-BATCH-06-05-01`
- **Ticket state:** `awaiting_review`
- **Authority:** frozen ticket `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-05-01-authorized-enforcement-policy-provenance.md`, including its incorporated BSS-V2-006-05 split-map authority and `RC-00605-01` allocation.
- **Implementation commit:** `5e9fdeda` (`feat(capacity): authorize enforcement policy provenance`)

## Dependency gate

The required parent predecessors were checked before implementation. The
BSS-V2-005-01..04 and BSS-V2-005-05-01..04 records are CK `PASS`; the latter
is recorded at `project's goal/feedback/BSS-V2-BATCH-05-05-04-e76e43f-review.md`.
BSS-V2-006-04-01..06 are also CK `PASS`; the terminal `-04-06` verification is
`project's goal/feedback/BSS-V2-BATCH-06-04-06-c99da45-verification.md`. No
awaiting-review predecessor was treated as approval, and this leaf consumes no
BSS-V2-006 runtime implementation surface.

## Frozen implementation boundary

The BSS-V2-005-owned seam is frozen as three Bridge-owned, non-public,
append-only PostgreSQL relations: immutable approval provenance, immutable
policy versions, and append-only revocations. The sole deriving function,
`bridge.derive_effective_enforcement_policy(domain, profileVersion, route)`,
selects the current server-owned policy; it never accepts a caller mask or
policy identifier. It requires exact domain/profile/route/approval binding,
requires all known positive dimensions to be enforced, permits an unknown
dimension only through the exact approved `not_enforced` record, and fails
closed for missing, foreign, stale, revoked, zero, malformed, or
unknown-accounting inputs. It does not publish a plan, activate a route,
expose a snapshot, mutate the profile, change BSS-V2-006 admission, or call a
provider.

The durable Anoman policy is bound to `anoman-shared-prod`, profile
`2026-10-18.1`, and route `anoman-semantic`. It preserves catalogue values
RPM=20, TPM=40000, concurrency=25, and RPD=`unknown`; its only exception is
the separate immutable approval
`anoman-rpd-not-published-approval-2026-10-18` for RPD=`not_enforced`.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| `RC-00605-01` | The real migration-0076 Anoman profile must retain RPM=20, TPM=40000, concurrency=25, and RPD unknown. A separate immutable server-side exclusion must be necessary and sufficient; absent, forged/foreign, stale, wrong-domain/version/route, revoked, unknown-enforced, unknown-window, and known-zero cases must block. Known RPD must stay enforced and no route/client-selected conflicting mask may weaken a quota-domain/profile. | `packages/atlas-db/migrations/0077_bssv20060501_authorized_enforcement_policy_provenance.sql`; `packages/atlas-db/tests/authorized-enforcement-policy-provenance.integration.test.ts`. The integration test reads the real 0076 fixture and checks the exact effective output, role denial, immutability, all named negative controls, revocation, known-RPD enforcement, and cross-route mask rejection. | `PROVEN` |

Exact executed validation:

```text
packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/authorized-enforcement-policy-provenance.integration.test.ts — PASS (1/1)
packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/provider-capacity-catalogue.integration.test.ts — PASS (1/1)
packages/atlas-db> node --env-file=../../.env scripts/migrate.mjs --check — PASS
packages/atlas-db> corepack pnpm typecheck — PASS
git diff --check — PASS
```

Internal readiness: READY_FOR_CK

## Limits and handoff

This checkpoint is not a CK `PASS`. It hands the single frozen row to CK. The
next leaf (`BSS-V2-006-05-02`) remains blocked on this leaf's CK `PASS` and is
not implemented here.

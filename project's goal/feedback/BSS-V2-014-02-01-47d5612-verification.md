# CK verification — BSS-V2-014-02-01

- **Ticket:** `BSS-V2-014-02-01` — Model-bound durable qualified-route authority
- **Batch:** `BSS-V2-014`
- **Review type:** post-CFC verification
- **CFC checkpoint:** [BSS-V2-014-02-01 CFC checkpoint](BSS-V2-014-02-01-cfc-checkpoint.md)
- **Frozen CK source and closure oracle:** [BSS-V2-014-02-01 first review](BSS-V2-014-02-01-35a8723-review.md), `CK-001.a`
- **Reviewed remediation commit:** `47d5612e8e7d1dd9505f01000b82c92ae964a80` (`fix(bss-v2): guard qualified authority publication`)
- **Ticket state at verification:** `awaiting_review`
- **Decision:** `PASS`

## Verification scope and preconditions

This is the single bounded verification after the first CK `CHANGES_REQUIRED` result. It consumes only the frozen `CK-001.a` clause, the remediation committed in `47d5612`, the evidence required by that oracle, and direct regressions introduced by the remediation. No post-CFC HMN authorization is applicable.

The remediation commit is the current committed `HEAD` and contains the CFC checkpoint plus the forward migration and focused fixture changes. The CFC checkpoint's `Reviewed target` field retains the original implementation commit `35a8723`; that is the baseline named by the original CK review. The remediation target under this verification is the containing commit `47d5612`, which is unambiguous from the commit diff and checkpoint.

## Original finding verification

| Clause | Frozen closure oracle | Evidence inspected | Outcome |
| --- | --- | --- | --- |
| `CK-001.a` | A complete but non-qualified model identity must be rejected at the publication boundary before durable insert, while the attempted authority row and prior historical rows remain unchanged. Required proof is the PostgreSQL negative and runtime-publisher fixture, followed by the frozen migration check, focused fixture, and bridge typecheck. | `packages/atlas-db/migrations/0090_bssv20140201_qualified_tuple_publication_guard.sql` compares every supplied route/provider/model/adapter/qualification/capability field against the immutable capacity-profile association and raises before insert on mismatch. `apps/agents-bridge/tests/model-route-authority.integration.test.ts` exercises a forged complete SQL tuple and a forged runtime-publisher tuple, then compares authority history before and after each rejection. | `RESOLVED` — the exact frozen oracle passed. |

## Validation and evidence

Executed against `47d5612e8e7d1dd9505f01000b82c92ae964a80`:

```text
pnpm --filter @atlas/agents-bridge exec node --env-file=C:\Workspace\atlas\ces-platform\.env ./node_modules/jiti/lib/jiti-cli.mjs tests/model-route-authority.integration.test.ts
# PASS — 2/2

pnpm --filter @atlas/db exec node --env-file=C:\Workspace\atlas\ces-platform\.env scripts/migrate.mjs --check
# PASS — Atlas database migration check passed

pnpm --filter @atlas/agents-bridge typecheck
# PASS — tsc -p tsconfig.json

git diff --check 35a8723587019d45f4f50ef74631f8635588cb67^ 47d56112e8e7d1dd9505f01000b82c92ae964a80
# PASS
```

The focused fixture also retained the original append-only replay/successor, immutable-history, returned-reference, resolver-seam, no-binder, and zero attempt/reservation/dispatch/claim assertions. No direct remediation regression was observed.

## Scope-change observations

None. The remediation remains within the existing qualified registry/resolver/publisher seam and adds no downstream plan, binder, allocation, activation, reservation, claim, transport, or provider operation.

## Decision

`PASS`: `CK-001.a` is resolved against its frozen closure oracle, all required validation passed, and no direct in-scope regression remains. This verification does not authorize another CFC cycle.

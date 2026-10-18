# GO checkpoint — BSS-V2-006-05-02

- **Ticket:** `BSS-V2-006-05-02` — Effective-plan publication convergence
- **Batch:** `BSS-V2-BATCH-06-05-02`
- **Ticket state:** `awaiting_review`
- **Authority:** frozen ticket `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-05-02-effective-plan-publication-convergence.md`, its incorporated BSS-V2-006-05 split-map authority, and allocated row `RC-00605-02`.
- **Predecessor:** `BSS-V2-006-05-01` CK `PASS`, recorded at `project's goal/feedback/BSS-V2-BATCH-06-05-01-5e9fded-review.md`.
- **Implementation commit:** `fbfbaa7e` (`feat(capacity): converge effective policy plans`)

## Bounded implementation

The BSS-V2-005 planner now accepts only the immutable server-derived effective
policy when it creates an eligible-dimension plan. Its numeric capacities,
reserves, background costs, and dominant-share calculation contain RPM, TPM,
and concurrency for the authorized Anoman-style exclusion; RPD remains policy
provenance rather than an invented numeric capacity, refill, or denominator.
The existing four-known planner entry point preserves its compatibility output.

Migrations `0078`–`0080` add an immutable desired-profile-to-policy binding and
a policy-aware convergent publisher. It derives the policy server-side, binds
the exact domain/profile/route/version, validates canonical eligible-vector
arithmetic, and fingerprints both plan and policy. An unchanged input returns
`unchanged`; a qualified changed effective input publishes a new immutable
profile and activates it through the existing activation trigger, which is the
existing durable `active-plan:<revision>` wakeup seam. The timestamp wrapper
normalizes equivalent public timestamp spellings before this fingerprint; it
does not add an alternate publication or wakeup path.

The implementation does not touch BSS-V2-006 admission, direct Bridge-table
readers, consumer activation, provider transport, route qualification, or
policy authoring. Revoked/stale effective policy derivation is evaluated before
the no-op fingerprint lookup and blocks future publication.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| `RC-00605-02` | Canonically repeatable effective policy; nonfabricated eligible bounds; immutable versioned desired profile that preserves enforced RPM/TPM/concurrency ceilings and hard interactive protection. Known RPD remains enforced; known zero, wrong domain, unknown mandatory limit, unqualified reset, and stale/revoked policy block. Changed effective input must create one existing durable wakeup, identical input none, while prior profiles remain historical. | `apps/agents-bridge/src/capacity-planner.ts` introduces the policy-bound eligible planner and retains the four-known compatibility entry point. `packages/atlas-db/migrations/0078_bssv20060502_effective_plan_publication_convergence.sql` binds and validates the policy/profile then uses the approved activation fence; `0079`–`0080` canonically normalize the public timestamp at that same boundary. `packages/atlas-db/tests/effective-plan-publication-convergence.integration.test.ts` uses PostgreSQL, the real policy derivation and the actual durable wakeup dispatch table to assert 3-D capacity/no numeric RPD, hard reserve arithmetic, one wakeup on publish, zero extra activation/wakeup on identical replay, new immutable version on qualified change, fabricated RPD rejection, and revocation blocking. The approved predecessor integration test covers exact source values plus known-RPD, zero, wrong-domain/version/route, stale, unknown-window, and authorization negatives. | `PROVEN` |

Exact executed validation:

```text
packages/atlas-db> corepack pnpm --filter @atlas/agents-bridge typecheck  PASS
packages/atlas-db> corepack pnpm --filter @atlas/db typecheck  PASS
packages/atlas-db> corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts  PASS (3/3)
packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/effective-plan-publication-convergence.integration.test.ts  PASS (1/1)
packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/authorized-enforcement-policy-provenance.integration.test.ts  PASS (1/1)
packages/atlas-db> node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs scripts/migrate.mjs --check  PASS
git diff --check  PASS
```

Internal readiness: READY_FOR_CK

## Handoff

This is an implementation readiness record, not a self-issued CK result.
Control returns to CK for the single frozen row `RC-00605-02`.

# CK post-CFC verification: IDSER-010-01 / IDSER-BATCH-10-01

- **Ticket:** `IDSER-010-01-deterministic-production-single-document-foundation.md`
- **Original CK artifact:** `IDSER-BATCH-10-01-6d8b3bf-review.md`
- **CFC checkpoint:** `IDSER-BATCH-10-01-cfc-checkpoint.md`
- **Original reviewed commit:** `6d8b3bf3f8fa2feea37f9a55756f897a3e546a14`
- **Remediation commit:** `1259109` (`test(idser): close single-document evidence gaps`)
- **Result:** `PASS`

## Frozen clause verification

| Original clause | Outcome | Verification |
|---|---|---|
| CK-001.a | RESOLVED | Expected: persisted full extraction and reconciliation results with Mistral provenance and resolved scoped identities, alongside the existing ready/candidate/evidence assertions. Actual: the remediation harness asserts one versioned extraction result and one versioned reconciliation result per scenario, each tied to a completed scoped execution and document/bundle; it checks Mistral provider/endpoint provenance, source hash binding, and candidate/evidence/canonical-index joins within the same project/bundle. The focused Compose run passed both scenarios. Evidence: `apps/agents-bridge/tests/idser-010-compose.mjs` in commit `1259109`; `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` output: `IDSER-010-01 controlled Compose scenarios A/B passed.` |
| CK-001.b | RESOLVED | Expected: Scenario B's persisted `contradicts` relationship requires resolution, and the production card reports Ready for review without `Needs attention`, retaining two candidates, empty Master, and ready workspace. Actual: the harness asserts `requires_resolution=true` for the scoped conflict relationship and calls authenticated `/internal/home-projects` for both scenarios, checking `ready-for-review`, 1/1 progress, no attention reason and empty Master. The focused Compose run passed. Evidence: `apps/agents-bridge/tests/idser-010-compose.mjs` in commit `1259109` and the same executed output. |

## Remediation diff and direct regressions

- The remediation commit changes only `apps/agents-bridge/tests/idser-010-compose.mjs` and adds this CFC checkpoint record. It does not change production runtime, schema, queue, provider, worker, or card-projection behavior.
- The harness exercises the authenticated production project-card read model as required by CK-001.b. It passed both single-document scenarios and completed its cleanup/normal-stack restoration.
- No direct remediation regression was found within the behavior needed to evaluate CK-001.a or CK-001.b. `docker compose ps` after the run showed PostgreSQL, Atlas, Agents Bridge, and the Agents Bridge worker healthy.

## Validation performed

- `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` — passed; output: `IDSER-010-01 controlled Compose scenarios A/B passed.`
- `node --check apps/agents-bridge/tests/idser-010-compose.mjs` — passed.
- `git diff --check 6d8b3bf3f8fa2feea37f9a55756f897a3e546a14..1259109` — passed.
- `docker compose ps` — PostgreSQL, Atlas, Agents Bridge, and Agents Bridge worker all healthy.

## Decision

`PASS`. Both original frozen clauses, CK-001.a and CK-001.b, satisfy their closure oracles. No direct remediation regression remains. This is bounded post-CFC verification; it does not restart the broad review or add findings.

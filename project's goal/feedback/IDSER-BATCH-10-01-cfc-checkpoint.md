# CFC checkpoint: IDSER-010-01 / IDSER-BATCH-10-01

- **Frozen ticket:** `IDSER-010-01-deterministic-production-single-document-foundation.md`
- **Source CK artifact:** `IDSER-BATCH-10-01-6d8b3bf-review.md`
- **Reviewed commit:** `6d8b3bf3f8fa2feea37f9a55756f897a3e546a14`
- **Remediation scope:** `CK-001.a` and `CK-001.b` only.
- **Checkpoint state:** `awaiting_review`

## Bounded remediation

Extended the committed production-shaped Compose harness only. It now reads the
persisted extraction and reconciliation result rows, verifies their Mistral
provenance and scoped execution/document/bundle joins, and proves each
candidate's evidence and canonical identity resolve within that bundle. For the
conflict scenario it asserts `requires_resolution=true` on the persisted
`contradicts` relationship. For both scenarios it calls the authenticated
production `/internal/home-projects` read model and verifies the resulting card
is `ready-for-review`, 1/1, has no attention reason, and retains an empty
Master. No runtime, schema, queue, provider, or card-projection behavior
changed.

## Frozen Finding Closure Matrix

| Clause | Status | Evidence location | Required command and outcome | Frozen oracle |
|---|---|---|---|---|
| CK-001.a | PROVEN | Scenario A assertions in `apps/agents-bridge/tests/idser-010-compose.mjs` | `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` — passed; output: `IDSER-010-01 controlled Compose scenarios A/B passed.` | PASS — persisted full extraction and reconciliation results have Mistral provenance, completed scoped executions, valid result shapes, and resolved candidate/evidence/canonical identities, alongside the existing 1/1 ready outcome. |
| CK-001.b | PROVEN | Scenario B relationship and production home-project-card assertions in `apps/agents-bridge/tests/idser-010-compose.mjs` | `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` — passed; output: `IDSER-010-01 controlled Compose scenarios A/B passed.` | PASS — the persisted `contradicts` relationship requires resolution and the production card is Ready for review without `Needs attention`, while the existing two-candidate, empty-Master, and ready-workspace assertions remain. |

## Direct regressions checked

- `node --check apps/agents-bridge/tests/idser-010-compose.mjs` — passed.
- `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` — passed; the harness restored the normal Compose stack, whose four services were healthy after completion.
- `git diff --check` — passed.

No HMN authorization is consumed: this is the first CFC pass for the supplied
ordinary `CHANGES_REQUIRED` CK artifact. Unrelated pre-existing working-tree
changes remain outside this checkpoint.

Internal readiness: READY_FOR_CK

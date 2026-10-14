# CFC checkpoint — REL-03-DURABLE-001 full durable closure

- **Ticket:** `REL-03-DURABLE-001` — fenced durable composite staging and replay
- **Frozen CK artifact:** `project's goal/feedback/REL-03-DURABLE-001-f8f0fad-verification.md`
- **HMN authorization consumed:** `HMN-REL-03-DURABLE-001-010`
- **Authorized clauses:** `CK-001.a`, `CK-001.b`, `CK-003.a`
- **Remediation base:** `f95747aad97df8a87f69fd17686d1b8ce938e6bd`
- **Qualification database:** `rel03_durable_cfc_20261014` — newly created disposable database; migrated and removed after this checkpoint.

## Frozen-clause closure evidence

| Frozen row / clause | Original qualified authority and operation | Required observation and actual result | Evidence locator / command | Status |
| --- | --- | --- | --- | --- |
| `RC-DURABLE-01` / `CK-001.a` | REL-03 handoff is recreated from `buildStepwiseSourcePacket()` → `buildStepwiseRelationshipEnvelopeRequest()` → `prepareQualifiedStepwiseSemanticPreparation()`. Durable staging uses the published REL-03/SEM-006/SEM-005 APIs, not copied relationship rules. | Ordinary `run-1` provenance, exact visual asset, relationship lineage/revision, and distinct perception/semantic execution identities stage. Mutated provider candidate, removed source, semantic execution substitution, canonical substitution, and altered accounting reject before the counting SQL boundary. | `semantic-composite-replay.ts:80-112`; integration assertions at `semantic-composite-replay.integration.test.ts:91-110`; isolated command below — PASS. | `PROVEN` |
| `RC-DURABLE-01` / `CK-001.b` | The same qualified sequence projects SEM-006 output and obtains SEM-005 accounting via `prepareQualifiedStepwiseSemanticCompositeAccounting()`, then verifies it with retained independent request/provider evidence. | Ordinary, mixed, and fully essential-deferred inputs stage. The deferred winner has a PostgreSQL `NULL` canonical result, a `null` qualified canonical hash, exact deferred linkage, and no fabricated V1 placeholder. The persisted sidecar excludes `preparationContext` and binds `qualifiedPreparationHash` to the successfully verified accounting hash. | `semantic-composite-replay.ts:66-112`; assertions `semantic-composite-replay.integration.test.ts:88-106`; isolated command below — PASS. | `PROVEN` |
| `RC-DURABLE-04` / `CK-003.a` | Test-only effect ledger with fresh child processes and connections. It is not a provider integration and does not alter production delivery ownership. | Injected SQL failure leaves zero rows; trigger-confirmed in-flight cancellation leaves zero rows; child reaches observable post-commit/pre-delivery boundary and is terminated; fresh process reloads exact winner; delivery effect runs once then fails; acknowledgement attempt fails at its actual boundary, then retries to one acknowledgement effect. Winner remains unchanged throughout. | `semantic-composite-replay.integration.test.ts:117-134`; isolated command below — PASS. | `PROVEN` |
| `RC-DURABLE-06` / `CK-003.a` | Fresh isolated PostgreSQL database using real registered migration path and actual Bridge adapter. | `0025_rel03_semantic_composite_stage` appears in migration ledger; table owner is `agents_bridge`; `agents_bridge` has INSERT and `atlas_app` has no SELECT. The integration harness has no `DATABASE_URL` skip, requires isolation explicitly, and exercises real SQL. | `pnpm --filter @atlas/db migrate` — PASS through `0025`; `pnpm --filter @atlas/db migration:check` — PASS; role query — `0025_rel03_semantic_composite_stage`, `agents_bridge|t|f`; isolated command below — PASS. | `PROVEN` |

## Protected rows and direct regressions

| Row | Required protection | Evidence | Status |
| --- | --- | --- | --- |
| `RC-DURABLE-02` | Fenced atomic PostgreSQL staging, concurrent claimants, stale lease rejection. | Integration assertions at `semantic-composite-replay.integration.test.ts:112-114`: concurrent claimants yield one winner; superseded/expired lease is rejected. | `PROVEN` |
| `RC-DURABLE-03` | Immutable winner, identical retry, conflict rejection, fresh-process retrieval. | Assertions at `semantic-composite-replay.integration.test.ts:96-110` and `123-134`. | `PROVEN` |
| `RC-DURABLE-05` | Bridge-only durable material and denied Atlas trusted-state access. | `semantic-composite-replay.integration.test.ts:135`; effective-role query above. No Atlas/Master mutation code changed. | `PROVEN` |

## Executed qualification commands

```powershell
$env:DATABASE_URL='postgresql://atlas:atlas_local_dev_only@localhost:5432/rel03_durable_cfc_20261014'
$env:ATLAS_APP_PASSWORD='atlas_app_local_dev_only'
$env:AGENTS_BRIDGE_PASSWORD='agents_bridge_local_dev_only'
corepack pnpm --filter @atlas/db migrate                    # PASS through 0025
corepack pnpm --filter @atlas/db migration:check            # PASS
corepack pnpm --filter @atlas/agents-bridge typecheck        # PASS
node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts  # PASS, 1/1, 0 skipped
```

## Shadow CK result

The code and every named observation above were inspected against the frozen
oracles. The durable boundary now verifies a reproducible qualified
preparation using the predecessor owners' APIs; it persists only its explicitly
defined projection; it has real SQL and effect boundaries rather than
`load()` renamed as delivery; and the fresh isolated database proves migration
and role ownership.

Internal readiness: `READY_FOR_CK`

This checkpoint is not a CK result. `REL-03-DURABLE-001` remains
`awaiting_review`; `SEM-CUTOVER-007` remains blocked pending independent CK.

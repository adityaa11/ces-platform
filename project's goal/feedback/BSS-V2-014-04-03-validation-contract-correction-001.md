# BSS-V2-014-04-03 — validation-contract correction 001 and regression handoff

- **Frozen ticket:** `BSS-V2-014-04-03` (unchanged).
- **Authority:** explicit user authorization for bounded `RC-0140403-VAL` fixture and validation-command correction, 2026-10-23; BSS weighted-capacity implementation context r2 §§0, 3.1A, 6, and 9; and the accepted `BSS-V2-014-04-02` authority contract.
- **Historical record preserved:** `BSS-V2-014-04-03-go-checkpoint.md` remains immutable, including its original `BLOCKED_AUTHORITY` observation.
- **Disposition:** corrected validation contract is recorded below, but the fixture has exposed a substantive admission regression. This artifact is a handoff to the existing review authority, not a CK handoff.

## Append-only correction to `RC-0140403-VAL`

The frozen validation command names the wrong package. The historical fixture
is `packages/atlas-db/tests/policy-aware-runtime-admission-fairness.integration.test.ts`;
the corrected command is:

```text
DATABASE_URL=… pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts
```

This corrects package ownership only. It does not alter the fixture's original
fairness assertions, its `plan-v1` historical plan, or any frozen acceptance
condition.

The authorized fixture-only correction makes its setup conform to the current
published authority boundary:

- `associated_routes` now carries the complete qualified tuple:
  `routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`,
  `qualificationRef`, `qualificationVersion`, and `capability`.
- The fixture captures the publisher-issued `authority_version`.
- Registered work is bound through the current
  `bridge.bind_provider_work_route(text, integer, bigint)` authority binder.
- No calculated v2 allocation, desired-plan v2 route binding, compatibility
  branch, production code, SQL admission change, or migration was added.

## Execution and substantive regression

Executed against the configured local PostgreSQL environment:

```text
pnpm --filter @atlas/db exec node --env-file=C:\Workspace\atlas\ces-platform\.env ./node_modules/jiti/lib/jiti-cli.mjs tests/policy-aware-runtime-admission-fairness.integration.test.ts
```

Result: **FAIL (1/1)** before the historical fairness assertions can complete.
The corrected fixture successfully establishes its complete authority tuple and
reaches the public admission boundary. `bridge.admit_provider_work_admission_v1`
then calls the removed route-text overload:

```text
PostgresError: function bridge.bind_provider_work_route(text, integer, text) does not exist
where: PL/pgSQL function bridge.admit_provider_work_admission_v1(...) line 65 at PERFORM
internal query: SELECT bridge.bind_provider_work_route(p_logical_work_id,p_attempt_number,p_route_id)
```

`BSS-V2-014-04-02` deliberately removed that legacy overload and made the
bigint binder authoritative. This is therefore a substantive active admission
regression, not a fixture/package-location issue. Under the bounded authority,
no production repair, legacy-binder restoration, compatibility branch, SQL
admission change, or migration change is authorized here.

## Frozen-row evidence status

| Row | Status after this correction | Evidence / boundary |
| --- | --- | --- |
| `RC-0140403-01` | Historical evidence preserved; current completion blocked by the admission regression. | The prior GO record's focused borrowing and baseline fixtures remain unchanged. The corrected historical oracle cannot complete past public admission. |
| `RC-0140403-02` | Historical evidence preserved; current completion blocked by the admission regression. | **Yes — headroom protection is already demonstrated by accepted combined fixtures:** `BSS-V2-BATCH-06-05-04-bb36b323-verification.md`, `CK-002.a`, accepted the same historical fixture's concurrent protected-interactive admission after background borrowing; `BSS-V2-014-04-02-e4d4dae-verification.md`, `CK-001.a`, separately accepted protected-interactive-reserve saturation. This correction does not claim a new proof because the current fixture did not complete. |
| `RC-0140403-03` | Historical evidence preserved; not reopened. | No recovery, liability, reservation, pg-boss, transport, or route/model behavior changed by this fixture-only correction. |
| `RC-0140403-VAL` | `UNRESOLVED` — substantive admission regression reported. | The corrected `@atlas/db` command exercised the original historical oracle until the public `ProviderWorkAdmission/v1` path attempted the retired binder. No substitute validation is claimed. |

## Required review-authority disposition

Do not proceed to CK handoff. The existing review authority must assess the
active `ProviderWorkAdmission/v1` call to the retired text binder against the
accepted `BSS-V2-014-04-02` bigint-binder contract. All frozen requirements,
including the corrected validation contract, remain unsatisfied until that
substantive regression is resolved under separately authorized scope.

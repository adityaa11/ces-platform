# CK verification: IDSER-008 / IDSER-BATCH-08

- **Review type:** post-HMN-authorized CFC verification
- **Ticket:** IDSER-008 bundle completion and failure lifecycle
- **Ticket state:** `awaiting_review`
- **Reviewed remediation commit:** `8e0abcadb7c8f882ec2d28a50f7eb26656776892` (`fix(idser): prove restarted reconciliation recovery`)
- **Consumed authorization:** `HMN-IDSER-008-004`
- **CFC checkpoint:** `IDSER-BATCH-08-cfc-remediation-2.md`
- **Original frozen CK artifact:** `IDSER-BATCH-08-243f33e-review.md`
- **Prior CK verification:** `IDSER-BATCH-08-fe41a35-verification.md`
- **Result:** `CHANGES_REQUIRED`

This is bounded verification of original frozen clauses `CK-001.a` through `CK-001.c`, the remediation diff, evidence required by their oracles, and direct regressions introduced by this remediation. It does not restart broad review or add a finding.

## Frozen clause outcomes

| Original clause | Outcome | Verification against its frozen oracle |
|---|---|---|
| `CK-001.a` | **RESOLVED** | The Compose worker fixture injects replay-load, Atlas source-handoff (503), and replay-stage outages. For each, it observes the Bridge effect remain `pending` and the Atlas execution remain non-failed; after restoring the dependency, it observes Atlas and Bridge completion. The exact Compose command passed 1/1. |
| `CK-001.b` | **UNRESOLVED** | Bundle-wide candidate/evidence checks and exact page/type/locator matching are restored in `reconciliation-acceptance.ts`. The Compose fixture now rejects wrong extraction-result scope, wrong evidence document, missing locators on both the final and an earlier completed member, an unauthorized reconciliation reference, and a failed semantic execution, then proves successful atomic acceptance and replay. The frozen oracle specifically requires rejection of a queued/running active-version stage; the fixture's “active semantic stage” probe changes the execution to `failed` only (`reconciliation-acceptance.integration.test.ts`, `rejectsFinalAcceptance("an active semantic stage", ...)`). The required queued or running state is not exercised, so this clause's frozen oracle is not yet met. |
| `CK-001.c` | **UNRESOLVED** | The Compose perception path proves recovery from transient replay-load, source-handoff, and replay-stage outages. The semantic worker Compose integration proves durable replay through Atlas unavailability/retry, restart behavior, and bounded failure reporting. The reconciliation acceptance fixture proves queued delivery through a stopped/restarted worker. However, no passing Compose worker observation demonstrates perception retry exhaustion, delayed source/delivery beyond grant expiry followed by bounded failure/recovery, or accepted-completion-versus-failure races for perception and reconciliation. `perception-negative.integration.test.ts` directly rejects an expired grant and observes no trusted completion; it does not exercise the worker recovery/failure path after delayed expiry. The semantic authority race fixture exercises extraction success/failure ordering, not the separately named reconciliation race. The frozen oracle requires the named scenarios; these absent scenarios leave this clause unresolved. |

## Checks performed

- Confirmed the active tuple: IDSER-008 / IDSER-BATCH-08, ticket state `awaiting_review`, reviewed commit at `HEAD`, and consumed authorization `HMN-IDSER-008-004`.
- Inspected the original CK frozen matrix, the prior CK verification, HMN-004, the current CFC checkpoint, the remediation diff, and the ticket-authorized implementation/test locations.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` — **passed**, 1/1.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — **passed**, 1/1.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration` — **passed**, 1/1.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-negative.integration.test.ts` — **passed**, 1/1.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:semantic-authority` — **passed**, 1/1.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:perception-authority` — **passed**, 1/1.
- `git diff HEAD^ HEAD --check` — **passed**.

## Direct regressions

No direct remediation regression was identified in the reviewed diff. The new 5xx handoff classification supports the frozen retry behavior, and the final gate again checks candidates across the bundle and resolves normalized evidence locators by page, locator type, and exact ID.

## Decision

Record `CHANGES_REQUIRED` for IDSER-008 / IDSER-BATCH-08 at `8e0abcadb7c8f882ec2d28a50f7eb26656776892`. `CK-001.a` is resolved. `CK-001.b` and `CK-001.c` remain unresolved against their original frozen closure oracles for the specific missing observations recorded above. Return control to human/planning authority. This verification does not authorize another CFC cycle.

# CK verification: IDSER-008 / IDSER-BATCH-08

- **Review type:** post-CFC verification
- **Ticket:** IDSER-008 bundle completion and failure lifecycle
- **Ticket state:** `awaiting_review`
- **Reviewed remediation commit:** `fe41a3589f1b36fa62eff175ad9fb259a9ebb7dc` (`fix(idser): close bundle lifecycle feedback`)
- **Consumed authorization:** `HMN-IDSER-008-003`
- **CFC checkpoint:** `IDSER-BATCH-08-cfc-remediation.md`
- **Original frozen CK artifact:** `IDSER-BATCH-08-243f33e-review.md`
- **Result:** `CHANGES_REQUIRED`

This is bounded verification of the three original frozen clauses, the CFC diff, evidence required by their oracles, and direct regressions introduced by the CFC. No new review finding is added.

## Frozen clause outcomes

| Original clause | Outcome | Verification against its frozen oracle |
|---|---|---|
| `CK-001.a` | **UNRESOLVED** | Expected a Compose worker test to inject transient source and replay faults, observe the existing operational effect remain retryable without terminal Atlas state, and observe recovery after dependency restoration. CFC records `document-perception-worker.test.ts` passing 5/5, but that is a unit test and does not exercise the Compose worker or durable Bridge/pg-boss state. The reviewer reran that unit command and it passed 5/5. After rebuilding/recreating Atlas from the current checkout, the Compose acceptance command passed 1/1; its reconciliation restart scenario does not inject the frozen clause's transient perception source and replay faults or observe the perception operational effect recover. |
| `CK-001.b` | **UNRESOLVED** | The CFC adds candidate/result, evidence-document, missing-locator, and unauthorized-reference probes for the final document. However, `packages/atlas-db/src/reconciliation-acceptance.ts` now filters the gate query with `c.document_id=$4`, so candidates and evidence for earlier completed bundle members are not checked at final acceptance. It also validates a locator with `normalized_document::text NOT LIKE '%' || locator_id || '%'`, which can match a property name or unrelated text instead of the exact locator on the stated page/type. The new fixture only corrupts the final document and uses a unique absent string, so it does not prove the frozen bundle-wide and exact-locator oracle. The first Compose rerun failed in the earlier reconciliation-worker restart setup at `reconciliation-acceptance.integration.test.ts:219` (`Atlas semantic context handoff was rejected`, Bridge effect `pending`). After rebuilding/recreating Atlas from the current checkout, the exact Compose command passed 1/1 and reached the added probes; it does not cover the bundle-wide or exact-identity counterexamples described above. |
| `CK-001.c` | **UNRESOLVED** | Expected passing Compose observations for retry exhaustion, delayed grant expiry, Atlas unavailability and worker restart, plus success/failure races for perception, extraction, and reconciliation. CFC records the perception worker unit test and reconciliation acceptance integration command; these do not establish the complete ticket-named set. The unit test proves classification at the function boundary. The successful DB Compose rerun proves reconciliation worker restart/progression, but does not exercise end-to-end perception retry exhaustion, delayed grant expiry, Atlas failure-handoff outage/restart, or the required perception and both semantic-stage success/failure races. |

## Checks performed

- Inspected the frozen CK clauses, HMN authorization, CFC checkpoint, CFC diff, and relevant worker/gate/test code.
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — **passed**, 5/5.
- Initial `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — failed during the existing worker restart scenario: semantic context handoff rejected; the Bridge effect remained `pending`.
- `docker compose up -d --build atlas` — rebuilt and recreated Atlas from the current checkout.
- Rerun `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — **passed**, 1/1, including the new gate probes.
- `docker compose ps` — PostgreSQL, Atlas, Bridge, and Bridge worker reported healthy before the rebuild.
- `git diff HEAD^ HEAD --check` — passed.

## Direct remediation regression

The CFC changed the completion query from all candidates in the bundle to candidates whose `document_id` equals only the final document. The mandatory gate and frozen `CK-001.b` cover all candidates/evidence in the bundle, so corruption in a previously completed member can now escape this final check. The same query uses substring matching rather than exact normalized locator resolution. These are within the frozen candidate/evidence integrity boundary and remain unresolved under `CK-001.b`.

## Decision

Record `CHANGES_REQUIRED` for IDSER-008 / IDSER-BATCH-08 at `fe41a3589f1b36fa62eff175ad9fb259a9ebb7dc`. The original clauses remain unresolved against their frozen oracles, and the CFC introduced a direct regression in bundle-wide candidate/evidence checking. Return control to human/planning authority. This CK verification does not authorize another CFC cycle.


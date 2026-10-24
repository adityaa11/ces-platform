# GHR-04C GO checkpoint — ready for CK

- **Ticket:** `GHR-04C` — Worker HTTP cutover and durable receipt fencing.
- **Authority:** [frozen GHR-04C ticket](../Backend_Phase/tickets/GHR_Phase/GHR-04C-worker-http-cutover-and-durable-receipt-fencing.md), its incorporated GHR HTTP connector context §§5–11, and the approved GHR-03B, GHR-04A, and GHR-04B CK artifacts.
- **Predecessors:** GHR-03B `PASS` at `c84b9dfac8cf04ad8bfdc8901b3fa3ad2134a67a`; GHR-04A `PASS` at `e919b672b7295a584acc902f20ef5d8c756508e7`; GHR-04B `PASS` at `2e6579caf5f99790629d1852228ead8aa5a0df60`.
- **Implementation/review target:** `8089b773b69e7094dc964daba144e8eb7063b3ae` — `feat(ghr): cut worker delivery over to HTTP`.
- **Checkpoint state:** `awaiting_review`. This is implementer readiness only, not a self-issued `PASS`.

## Bounded change set

- Retires the worker's `receiveVerifiedBatchPlan()` import/invocation. The worker reconstructs the verified immutable envelope bytes, resolves the exact trusted registration, and dispatches only through its GHR-04A HTTP receiver.
- Preserves receipt and lease-fence authority in `delivery-worker.ts`: only an exact bounded `200 parsed_only` acknowledgement terminalizes `parsed_only`. The dispatcher cannot write receipts.
- Classifies receiver `400/422` as quarantined, authentication/path/redirect failures as fail-closed, malformed or mismatched acknowledgements as quarantined, and unavailable/network/timeout/5xx outcomes as pg-boss retryable transient delivery.
- Composes the accepted deployment-owned origin and credential into the production worker and existing Fastify service; canonical Compose supplies only `http://agents-bridge:3002` plus the shared server-owned credential.
- Extends the real pg-boss/PostgreSQL harness to post through the existing Fastify receiver and proves duplicate/lost-ack, restart, stale lease, concurrent-claim, invalid-credential, unavailable/final-attempt, receipt, and zero-downstream observations.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `GHR-04C-RC-01` | A real worker must use only the GHR-04A trusted registration/origin/credential seams to POST immutable bytes to GHR-04B Fastify and receive a matching authenticated `parsed_only` acknowledgement. | `delivery-worker.ts` composes `createGenericHandoffHttpDispatcher()` only from `resolveMainRouteBinding()` and worker-composed transport configuration. `ghr-03b-real-e2e.integration.test.ts` starts the actual Fastify app and pg-boss worker, sends a pointer job, and observes one matching `parsed_only` receipt. `GHR03B_REAL_E2E=1 … test:ghr-03b`: PASS (5/5). | `PROVEN` |
| `GHR-04C-RC-02` | One receipt terminalizes only after valid acknowledgement; duplicate/lost acknowledgement, restart, lease recovery, stale/expired lease, and concurrent claim retain identity and one terminal receipt. | The real PostgreSQL/Fastify suite exercises duplicate pointer delivery across worker restart, expired generation reclamation, concurrent claim, and final-attempt receipt fencing. It asserts one terminal receipt and retained identity in `ghr-03b-real-e2e.integration.test.ts`. `GHR03B_REAL_E2E=1 … test:ghr-03b`: PASS (5/5). | `PROVEN` |
| `GHR-04C-RC-03` | Credential, receiver-contract, forged/changed request, acknowledgement, unknown/redirect, timeout/network/5xx failures must have the stated no-success/quarantine/transient behavior without fallback. | Real-Fastify/receipt coverage asserts receiver `400` quarantine, invalid credential fail-closed, unavailable network retry then `retry_exhausted`, and zero downstream effects. `test:ghr-04a` uses a local HTTP listener to prove redirect, malformed/mismatched/oversized acknowledgement, timeout, and `5xx` statuses cannot acknowledge. `test:ghr-04b` proves Fastify authentication and forged/noncanonical/request-pin rejections. All commands below passed. | `PROVEN` |
| `GHR-04C-RC-04` | No former direct receiver caller/export/injection or active composition remains; only authenticated HTTP reaches reusable receiver code, with zero downstream effect and sanitized diagnostics. | Static assertions in `ghr-03b-real-e2e.integration.test.ts` and `ghr-04b-authenticated-http-receiver.test.ts` require dispatcher use and forbid `receiveVerifiedBatchPlan()` in the worker. The real PostgreSQL matrix compares semantic, BSS, and downstream queue effects before/after every covered outcome. `test:ghr-03b`: PASS (5/5). | `PROVEN` |

## Executed validation

```text
corepack pnpm --filter @atlas/agents-bridge typecheck                         PASS
corepack pnpm --filter @atlas/agents-bridge test:ghr-01b                      PASS (3/3)
corepack pnpm --filter @atlas/agents-bridge test:ghr-03a                      PASS (4/4)
DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/atlas_dev \
  GHR03B_REAL_E2E=1 corepack pnpm --filter @atlas/agents-bridge test:ghr-03b PASS (5/5)
corepack pnpm --filter @atlas/agents-bridge test:ghr-04a                      PASS (4/4)
corepack pnpm --filter @atlas/agents-bridge test:ghr-04b                      PASS (4/4)
docker compose config --quiet                                                 PASS
git diff --check                                                               PASS
```

## CK handoff

All four ticket-derived rows are proven with the named real Fastify/worker and PostgreSQL harnesses; no local receiver fallback or downstream capability remains. **Internal readiness: READY_FOR_CK**.

# GHR-04B GO checkpoint — ready for CK

- **Ticket:** `GHR-04B` — Authenticated semantic batch-plan HTTP receiver
- **Authority:** [frozen GHR-04B ticket](../Backend_Phase/tickets/GHR_Phase/GHR-04B-authenticated-semantic-batch-plan-http-receiver.md), its incorporated GHR HTTP connector context §§2, 4, 7, and 9, the approved [GHR-03B CK review](GHR-03B-c84b9df-review.md), and approved [GHR-04A CK verification](GHR-04A-e919b672-verification.md).
- **Predecessors:** GHR-03B is `PASS` at `c84b9dfac8cf04ad8bfdc8901b3fa3ad2134a67a`; GHR-04A is `PASS` at `e919b672b7295a584acc902f20ef5d8c756508e7`.
- **Implementation/review target:** `2e6579caf5f99790629d1852228ead8aa5a0df60` — `feat(ghr): add authenticated batch plan HTTP receiver`.
- **Checkpoint state:** `awaiting_review`. This is implementer readiness only, not a self-issued `PASS`.

## Bounded change set

- Registers the dormant receiver inside the existing Fastify app at the path imported from `semanticBatchPlanRoute.receiver.path`. Its encapsulated JSON parser yields a `Buffer` only for this route, leaving unrelated app routes unchanged.
- Authenticates only the GHR-04A deployment-owned service credential using a constant-time comparison. Missing receiver configuration or any missing/invalid credential is fail-closed and returns only `{ "error": "unauthorized" }`.
- Uses `parseGenericHandoffEnvelopeV1()` for the bounded duplicate-key-safe outer envelope, exact pins, and wrapped-body hash. The existing parser now exposes the original payload byte slice; the receiver passes those unchanged bytes to GHR-03A's canonical five-field parser, so noncanonical representations cannot become canonical through reserialization.
- Returns the exact `200` acknowledgement only after false-only canonical parse. It has no session identity, receipt write, delivery-worker integration, resolver, planner, BSS, SEM, provider, persistence, reconciliation, projection, or publication capability.
- Leaves `delivery-worker.ts` and GHR-03B's local receiver/receipt/retry/lease-fence path unchanged; GHR-04C remains the sole HTTP-delivery cutover ticket.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `GHR-04B-RC-01` | Existing Fastify app exposes the registered imported `POST` path; unknown path/method fails closed. | `apps/agents-bridge/src/ghr/authenticated-batch-plan-http-receiver.ts` registers only `semanticBatchPlanRoute.receiver.path`; real-listener test sends `GET` on that path and `POST` to an unknown path, both `404`. `corepack pnpm --filter @atlas/agents-bridge test:ghr-04b`: PASS (4/4). | `PROVEN` |
| `GHR-04B-RC-02` | Authenticated direct HTTP with valid original bytes gets the exact matching `200 parsed_only` acknowledgement after canonical five-field parse. | `apps/agents-bridge/tests/ghr-04b-authenticated-http-receiver.test.ts` starts the actual Fastify listener on `127.0.0.1`, POSTs the original envelope bytes, and asserts the full acknowledgement identity/digest/disposition. `test:ghr-04b`: PASS (4/4). | `PROVEN` |
| `GHR-04B-RC-03` | Invalid/missing credential, forged pins/hash/body, duplicate-key/noncanonical JSON, and `can_continue:true` cannot succeed or invoke downstream work. | The focused real-listener test asserts `401` for missing/forged credentials and `400` with bounded diagnostic for every named contract negative. It also statically forbids resolver/database/queue/downstream dependencies in the receiver. The shared raw parser test proves original payload-byte retention. `test:ghr-04b`: PASS (4/4); `corepack pnpm --filter @atlas/contracts test`: PASS (19/19). | `PROVEN` |
| `GHR-04B-RC-04` | GHR-03B's accepted local invocation and receipt/retry/fence behavior stay unchanged. | The bounded implementation diff does not touch `delivery-worker.ts`; focused static assertion confirms it still calls `receiveVerifiedBatchPlan()` and does not compose the HTTP dispatcher. `corepack pnpm --filter @atlas/agents-bridge test:ghr-03a`: PASS (4/4); `test:ghr-03b`: PASS (1 static; 4 protected-clone integration cases environment-gated); prior GHR-03B CK `PASS` supplies the required real E2E/receipt evidence. | `PROVEN` |

## Executed validation

```text
corepack pnpm --filter @atlas/contracts typecheck             PASS
corepack pnpm --filter @atlas/contracts test                  PASS (19/19)
corepack pnpm --filter @atlas/agents-bridge typecheck         PASS
corepack pnpm --filter @atlas/agents-bridge test:ghr-01b      PASS (3/3)
corepack pnpm --filter @atlas/agents-bridge test:ghr-03a      PASS (4/4)
corepack pnpm --filter @atlas/agents-bridge test:ghr-03b      PASS (1 static; 4 protected-clone cases skipped)
corepack pnpm --filter @atlas/agents-bridge test:ghr-04a      PASS (4/4)
corepack pnpm --filter @atlas/agents-bridge test:ghr-04b      PASS (4/4)
git diff --check                                               PASS
```

## CK handoff

All four ticket-derived rows are proven with the required local Fastify harness and observations. **Internal readiness: READY_FOR_CK**.

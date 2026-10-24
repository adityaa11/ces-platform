# GHR-04A GO checkpoint — ready for CK

- **Ticket:** `GHR-04A` — Registered HTTP transport contract and dispatcher
- **Authority:** [frozen GHR-04A ticket](../Backend_Phase/tickets/GHR_Phase/GHR-04A-registered-http-transport-contract-and-dispatcher.md), its incorporated GHR HTTP connector context §§2–3, 5–6, and 9, plus the approved [GHR-03B CK review](GHR-03B-c84b9df-review.md).
- **Predecessor:** GHR-03B is `PASS` at reviewed commit `c84b9dfac8cf04ad8bfdc8901b3fa3ad2134a67a`.
- **Implementation/review target:** `c4ad7a57b30b96e078bf7457ad631b9bb2d54c89` — `feat(ghr): add registered HTTP dispatcher contract`.
- **Checkpoint state:** `awaiting_review`. This is implementer readiness only, not a self-issued `PASS`.

## Bounded change set

- Extends the sole `semantic/batch-plan` branch registration with the exact receiver `{ transport: "http", method: "POST", path: "/internal/semantic/batch-plan" }`. Exact selector resolution remains pure and returns a registry-issued trusted registration.
- Adds an inactive generic dispatcher. It accepts only a resolver-issued registration, deployment-owned private HTTP origin, existing server-owned service credential, verified serialized bytes, and expected handoff/digest acknowledgement pins. It rejects untrusted destinations before I/O; redirects, timeout, oversized or malformed responses, and acknowledgement mismatches never report success.
- Adds an optional, validated `AGENTS_BRIDGE_GHR_HTTP_ORIGIN` configuration seam. It accepts only a credential-free private HTTP origin and uses the existing `AGENTS_BRIDGE_SERVICE_CREDENTIAL`; configuration is rejected at dispatcher composition when absent or invalid.
- Does not modify `delivery-worker.ts`, worker composition, Fastify route registration, Docker Compose, durable receipt handling, semantic parsing, or downstream dispatch. The existing direct GHR-03A receiver remains the active path until GHR-04C.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `GHR-04A-RC-01` | Exact `semantic/batch-plan` resolution exposes only the fully pinned `POST /internal/semantic/batch-plan` receiver; unknown/mismatched selectors fail closed. | `apps/agents-bridge/tests/ghr-branch-registry.test.ts` and `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts`; `corepack pnpm --filter @atlas/agents-bridge test:ghr-01b` (3/3) and `test:ghr-04a` (4/4): PASS. | `PROVEN` |
| `GHR-04A-RC-02` | Construction accepts only validated private-origin/server-credential configuration and a trusted registered receiver; payload-derived or unregistered destinations are rejected before I/O. | `loadGenericHandoffHttpTransportConfig` parses only deployment variables, allows no URL from a handoff, validates a private credential-free origin, and reuses the established service credential. `test:ghr-04a` proves invalid/missing configuration and cloned untrusted receiver rejection: PASS. | `PROVEN` |
| `GHR-04A-RC-03` | A local generic listener receives original verified bytes, server credential, registered path, and bounded request; redirect, oversized response, timeout, malformed response, and acknowledgement mismatch do not succeed. | `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts` starts a local `127.0.0.1` listener and asserts exact bytes, `Bearer` service credential, registered path, matching `200 parsed_only` acknowledgement, plus every named negative: `test:ghr-04a` (4/4): PASS. | `PROVEN` |
| `GHR-04A-RC-04` | No live worker dispatch, durable receipt, semantic/parser, or downstream capability changes. | Scope diff excludes worker/receipt/receiver/Fastify/Compose paths. `corepack pnpm --filter @atlas/agents-bridge test:ghr-03b` passes its static boundary test (1 pass; 4 protected-clone tests correctly skipped without their explicit environment); approved GHR-03B CK evidence remains the required real regression proof. | `PROVEN` |

## Executed validation

```text
corepack pnpm --filter @atlas/agents-bridge typecheck                         PASS
corepack pnpm --filter @atlas/agents-bridge test:ghr-01b                      PASS (3/3)
corepack pnpm --filter @atlas/agents-bridge test:ghr-03a                      PASS (4/4)
corepack pnpm --filter @atlas/agents-bridge test:ghr-03b                      PASS (1 static; 4 environment-gated skips)
corepack pnpm --filter @atlas/agents-bridge test:ghr-04a                      PASS (4/4)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/service.test.ts  PASS (7/7)
git diff --check -- [GHR-04A bounded paths]                                   PASS
```

## CK handoff

All four ticket-derived rows are proven. The dispatcher is intentionally uncomposed from the live worker and has no receipt authority. **Internal readiness: READY_FOR_CK**.

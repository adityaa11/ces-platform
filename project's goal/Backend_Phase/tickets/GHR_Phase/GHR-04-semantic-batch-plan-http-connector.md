# GHR-04 — Semantic batch-plan HTTP connector (split record)

- **State:** `superseded-for-sizing`; this document is the immutable parent scope record. It grants no GO and does not supersede GHR-03B's accepted delivery, retry, fencing, or terminal-receipt semantics.
- **Reason for split:** the original ticket simultaneously changes three authority-bearing boundaries: trusted outbound destination/configuration, authenticated raw HTTP ingress, and the worker's durable receipt/fence cutover. Those boundaries need different direct evidence and failure or correction paths; a single GO → CK → CFC → HMN flow would be materially too broad.
- **Source:** [GHR HTTP Delivery to Semantic Batch Plan implementation context](../../GHR-IDSER-Semantic-batch-plan-connector.md), §§1–11.

## Replacement sequence

1. [GHR-04A — Registered HTTP transport contract and dispatcher](GHR-04A-registered-http-transport-contract-and-dispatcher.md) freezes the sole registered destination, trusted-origin/configuration seam, and generic outbound transport boundary. It does not activate worker HTTP delivery.
2. [GHR-04B — Authenticated semantic batch-plan HTTP receiver](GHR-04B-authenticated-semantic-batch-plan-http-receiver.md) registers the Fastify ingress using that sole path and proves raw-byte/authentication/parser behaviour. It does not change worker delivery.
3. [GHR-04C — Worker HTTP cutover and durable receipt fencing](GHR-04C-worker-http-cutover-and-durable-receipt-fencing.md) consumes only the two accepted seams, replaces the local receiver call, and proves the GHR-03B receipt/fence behaviour through the real listener.

Each child requires the previous child’s CK `PASS`; GHR-04C is the only activation/cutover ticket. A failed child is corrected only within that child’s frozen boundary. If a correction needs to alter a predecessor contract, it must stop for HMN rather than silently expanding the active ticket.

## Coverage preservation

| Original requirement | Preserved by |
| --- | --- |
| Exact `semantic/batch-plan` registration, resolver purity, registered path, trusted origin, credential/configuration, and dispatch protocol | GHR-04A |
| Existing-Fastify path registration, internal authentication, raw-byte boundary, envelope/pin/hash checks, false-only canonical parse, and matching acknowledgement | GHR-04B |
| Worker replacement, acknowledgement-before-receipt rule, GHR-03B retries/fences/duplicate identity, Docker/composition wiring, and removal of local invocation | GHR-04C |
| No payload-derived destination, no fallback, no session identity, no duplicate parser, no downstream work, and sanitized diagnostics | GHR-04A–C; each child has a direct negative review contract |

The completed sequence remains the original GHR-04 outcome: a verified GHR handoff is sent only to the registered private HTTP receiver; only a matching `200 parsed_only` acknowledgement can cause the existing durable terminal receipt; the former direct-local delivery entry point and obsolete production wiring are removed; no semantic planning or downstream execution is activated.

## Shared hard stop

Stop the active child and report the narrow gap if the registered path cannot remain the sole endpoint authority, raw original bytes cannot be validated in the existing Fastify runtime, an already accepted server-owned credential/configuration mechanism is unavailable, or GHR-03B receipt/fence semantics cannot survive the HTTP acknowledgement. Do not hardcode a destination, invent credential policy, retain/add a local fallback, fake an acknowledgement, or activate downstream work.

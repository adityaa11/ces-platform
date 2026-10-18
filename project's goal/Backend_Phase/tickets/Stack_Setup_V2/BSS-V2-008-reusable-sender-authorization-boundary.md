# BSS-V2-008 — Reusable sender/producer authorization boundary

- **State:** `planned`; not GO/CFC/CK authority.
- **Review batch:** `BSS-V2-BATCH-08`.
- **Dependencies:** `BSS-V2-007` CK `PASS` for common service/work identity and scope semantics; existing approved Atlas perception execution and background handoff authority.
- **Owner:** shared BSS/Atlas sender-authorization contract and generic sender policy-verifier. GHR alone will own its eventual generic issuer, route registry, transactional outbox, delivery/ack and dispatcher.

## Outcome

Define and qualify **one reusable authorization seam for a domain producer to propose a handoff**. A producer must be an authenticated allowed service and prove a valid domain-owned, durable producer event/work transition for an *exact intended route, purpose, body contract version and immutable body reference/hash*. A producer cannot authorize itself merely by naming a route, possessing a generic service credential, or signing a fabricated event.

## Frozen scope / no dual routing

1. Reuse the **service principal and immutable work/scope provenance concepts** approved in BSS-007; sender and receiver have distinct permissions and distinct route policies. No universal `AGENTS_BRIDGE_SERVICE_CREDENTIAL`, no shared all-routes sender role, and no impersonation by caller-provided producer identity.
2. Freeze a versioned, **domain-agnostic proposed handoff intent** / authorization-result contract: producer service identity, domain source event identity and persisted version, authorized route/purpose, destination receiving policy identity, exact body schema/version, canonical body digest/reference, project/work/source scope where applicable, unique idempotency/replay identity, eligibility/revocation/cancellation state and provenance. Bind only **references/digests/metadata**; exclude PDF, prompt, media bytes, provider body, session cookies, keys and secrets.
3. The **producing domain** verifies that its own event is committed, immutable, currently eligible, and authorized to emit to the chosen route. BSS sender verifier checks authorized principal/purpose/route/scope; the resource authority never moves into GHR or Bridge. Unauthorized/missing/foreign/stale/revoked/mismatched hash/version and duplicate-conflicting intent are denied.
4. Produce only a `VerifiedProposedHandoffIntent` (conceptual name) for a **non-delivering test fixture**. Do not assert a real GHR envelope/signature, enqueue work, implement transactional outbox, call the receiver, activate a GHR route, or generate an independent sender worker. Exactly-once-like real issue/ack semantics remain later GHR-owned, not this ticket.
5. Keep v0.3 GHR header/issuer shape **proposed**: freeze only the interoperable sender authorization inputs and their proof obligations, not invent canonical GHR envelope fields. Require later GHR owner to bind a verified intent to authenticated delivery and receiving authorization, while each domain owns its body parser.
6. First sample producer is **Atlas accepted perception completion → future `semantic/batch-plan`**. Future `SemanticBatchPlanReady/v1` → `semantic/batch-execution-intake` and SEM/reconciliation producer policies reuse the same mechanism with separately qualified domain event grants.

## Frozen Review Contract

| ID | PASS iff |
| --- | --- |
| RC-BSSV2-008-01 | One route-agnostic typed sender principal and verified proposed-intent contract binds actual authenticated producer identity to authorized route/purpose, immutable domain event/source scope, body version/digest and policy version. |
| RC-BSSV2-008-02 | A real committed accepted-perception domain-event fixture produces a verified **unissued** intent; unaccepted, fabricated, cross-project, cross-route, wrong-body-hash, stale, cancelled or revoked producer work fails closed. |
| RC-BSSV2-008-03 | Repeated identical intent is idempotently identical while conflicting same-key bodies/source epochs cannot silently overwrite; no arbitrary target routing, session reuse or globally scoped service credential grants send authority. |
| RC-BSSV2-008-04 | A second independent future-domain fixture shows that generic sender verification does not hard-code perception, NormalizedDocument or semantic payload fields. Receiver and GHR are not implicitly authorized by producer evidence. |
| RC-BSSV2-008-05 | No live GHR issue/route/ack/outbox, no SEM/BSS admission/transport, no provider call, no Atlas semantic/reconciliation/publication mutation; positive domain-event proof and exact forbidden-effect oracles are non-inert. |

## Hard stop / handoff

A verified **proposed** intent is not a delivered GHR message and not a downstream resource permit. If a producer has no authorized persisted event, report `SENDER_EVENT_AUTHORITY_GAP` to that domain owner, rather than write or fake it. After CK PASS, the future GHR owner implements issuance/delivery and transactional origin binding in a separate GO; consumers integrate BSS-007 with their domain resolver in their own tickets. No other current or future BSS provider-capacity or usage-ledger ticket gains GHR delivery authority.

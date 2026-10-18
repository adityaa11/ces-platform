# BSS-V2-007 — Reusable receiving-work authorization boundary

- **State:** `planned`; not GO/CFC/CK authority.
- **Review batch:** `BSS-V2-BATCH-07`.
- **Dependencies:** approved Atlas internal-service/perception authority and its session-independent background handoff pattern; `IDSER-012-03-01-02` CK `PASS` as an *existing accepted-document resolver consumer*, not an invitation to reopen that review. No running GHR is required.
- **Owner:** shared BSS/Atlas receiving-authentication contract and common verifier. The resource owner retains all document/media/semantic authorization, and GHR retains issuance, route selection, ordering, delivery and acknowledgement.
- **First downstream consumer:** planned `IDSER-012-03-01-03` (semantic/batch-plan resolver binding). Future SEM and reconciliation receivers reuse this contract with their own policy adapters.

## Outcome

Provide **one reusable, fail-closed receiver authorization boundary** for handoff-driven background processing. A receiver must prove both (a) an authenticated, allowed internal service/receiving identity and (b) an Atlas-authorized work identity for a *specific purpose, route and resource scope*; neither receipt of a JSON body nor knowledge of a resource ref grants access. The mechanism is shared; the route's permission and resource validation remain domain-owned. Browser logout must not invalidate independently authorized durable background work.

## Frozen trust model and scope

1. Keep independent meanings for **service authentication**, **work authorization**, **GHR delivery provenance**, and **resource-owner authorization**. Define typed, server-verified `ReceivingPrincipal` and `AuthorizedReceivingWork` context with registered service identity, allowed receiver/route-purpose, immutable work identity, project/workspace/bundle/document scope where applicable, source/version binding, lifecycle/cancellation/revocation provenance and policy version. Route-specific fields are **policy adapters**, not requirements on all receiving routes.
2. Explicitly model interactive-user and authenticated-background-service principals as **disjoint variants**. Only interactive access depends on Better Auth session; a background caller must have its own service authentication and server-derived work authority. A caller-supplied `kind:"background"`, a copied user ID, a shared secret alone or the GHR body itself may never elevate an unverified context.
3. Reuse qualified Atlas/Bridge internal service-authentication conventions and Atlas-owned persisted work/source authority. Service credentials **remain service-scoped**: `AGENTS_BRIDGE_SERVICE_CREDENTIAL` is not centralized into a universal Atlas key, and does not by itself authorize a resource. No duplication of sessions, universal impersonation, Bridge read/write access to `atlas.*`, broad cache enumeration, or new parallel resource resolver.
4. Publish one small generic verifier/policy-adapter interface, typed success/deny outcomes, server-derived purpose/scope, bounded validation, origin/replay/staleness checking and deny-by-default behavior. The generic boundary must **not** parse domain payloads or know NormalizedDocument, semantic batches, provider quotas or future reconciliation schema.
5. A **trusted local delivery-context fixture** exercises the receiver in absence of active GHR. It cannot forge an issuer identity, pretend a real GHR route has delivered, mint a work permit from body values, or put bearer secrets/source bytes in handoff metadata.
6. Coordinate with `BSS-V2-008` via matching versioned principal/purpose/scope provenance concepts, but **do not** make the receiver trust a sender assertion alone. Final GHR delivery issuer/receipt binding will be a later GHR-owned integration; BSS-007 does not create an outbox, route registry, dispatcher or acknowledgement.

## Frozen Review Contract

| ID | PASS iff |
| --- | --- |
| RC-BSSV2-007-01 | A reusable typed receiving principal/work contract and single verifier support independently authorized background service identity without an active user session, with exact allowed route/purpose and scope. No domain-specific parser or second resolver is introduced. |
| RC-BSSV2-007-02 | Non-inert positive authorized fixture passes; missing/forged/cross-service/foreign-route/foreign-project/cross-document/stale/replayed-out-of-policy/cancelled/revoked or unsupported principal/work fails closed with no resource contents. |
| RC-BSSV2-007-03 | Expired/logout interactive sessions are rejected; a qualified independently authorized background work remains eligible despite logout, while revoked work and invalid service authentication are denied. No implicit background work grant is minted from an interactive session or the body. |
| RC-BSSV2-007-04 | Resource access is still gated by the **resource owner**; a verified receiver cannot read an arbitrary accepted document or media, and cannot derive an accepted semantic truth or send permit merely from generic authorization. |
| RC-BSSV2-007-05 | Existing Docling/perception and `IDSER-012-03-01-02` behavior has no direct regression; no GHR issuance/delivery, BSS admission, SEM execution, provider send, truth write or new runtime queue; positive and negative side-effect oracles are non-inert. |

## Review and handoff

Record principal derivation, durable work/source authority, verification policy, replay/revocation disposition and exact exercised fixture. Explicitly STOP `RECEIVING_WORK_AUTHORITY_GAP` when a qualified server-derived work permit for a receiving domain is missing; BSS must not invent an Atlas truth grant. CK `PASS` qualifies only the **shared mechanism**. `IDSER-012-03-01-03` alone owns the next semantic/batch-plan **domain adapter and existing resolver integration**; future SEM/reconciliation routes retain separate GO/CK. No current live GHR is asserted.

# IDSER-012-03-01-03 — Background-authorized semantic batch-plan resolver consumer

- **State:** `planned`; new successor only, not GO/CFC/CK authority.
- **Batch:** `IDSER-BATCH-12-03-01-03`.
- **Dependencies:** `IDSER-012-03-01-01` and `IDSER-012-03-01-02` CK `PASS` **preserved without reopening**; **new** `BSS-V2-007` receiving-work authorization CK `PASS` is required before GO. `BSS-V2-008` is sender-side integration authority for a later real GHR handoff, not a substitute for receiver proof.
- **Parent:** [IDSER-012-03-01 split map](IDSER-012-03-01-ghr-body-contract-accepted-document-resolver.md).
- **Purpose:** bind the **single approved** Atlas accepted-document resolver to the BSS-007 reusable authenticated receiving-work mechanism for the future GHR route `semantic/batch-plan`, still using non-delivering GHR-compatible fixture input.

## Bounded implementation

1. Preserve existing strict five-field `SemanticBatchPlanInput/v1` parser and existing `PostgresAcceptedSemanticBatchPlanDocumentResolver` source/cache/fingerprint/lifecycle/media checks; refactor only the authorization entry to consume a **trusted BSS-007 verified receiving context**. Never duplicate the document lookup, create a second resource authority, trust the body as an access grant or give Bridge direct Atlas SQL access.
2. Continue supporting legacy interactive access only with a current Better Auth session and scope/membership. The background path requires authenticated registered service identity + Atlas-authorized **durable purpose-bound work** for exactly `semantic/batch-plan`, matching project/workspace/bundle/document, accepted perception/source/fingerprint and current cancellation/revocation policy. Reuse existing Atlas work state if sufficient; if not, STOP `RECEIVING_WORK_AUTHORITY_GAP` and return to Atlas/BSS-007 owner rather than fabricate an issuer, forged fixture grant or new broad database privilege.
3. A user closing the browser, logout or session expiry **does not by itself revoke existing independently authorized background work**; unauthorized work, revoked project/work eligibility, cancelled/expired work, altered body, forged/foreign service, cross-route or foreign source still fail closed. Exact policy for revocation is server-authoritative, not the stale interactive session.
4. An actual production GHR envelope/route is not available. Use the BSS-007 qualified **trusted non-delivering local receiving fixture**; no real GHR delivery authenticity or sender authority is claimed. BSS-008 supplies later producer-side verified-intent seam, while GHR integration separately qualifies issuance/forwarding/ack.
5. Return the identical type-bounded accepted planner view with granted source/media metadata. **HARD STOP** before BSS planning read, corpus partition, plan publication, GHR issue/ack, SEM intake, provider admission/send or semantic/reconciliation truth mutation.

## Frozen Review Contract

| ID | PASS iff |
| --- | --- |
| RC-012030103-01 | Existing strict parser and **same resolver/document checks** consume a qualified BSS-007 receiving context for `semantic/batch-plan`; there is no duplicate SQL resolver or GHR header-derived authorization. |
| RC-012030103-02 | Real accepted persisted fixture + authorized service/work succeeds after the originating user's session has expired or logged out; interactive redemption with expired/deleted session fails closed. |
| RC-012030103-03 | Service credential only, forged/missing/stale/foreign-route/cross-project/cross-document/cancelled/revoked work, unaccepted lifecycle, bad source/fingerprint or unauthorized media fail closed and leak no normalized content. |
| RC-012030103-04 | Non-inert positive accepted-document read retains source/media fidelity, no new Atlas write/Bridge SQL privilege and zero GHR, BSS, SEM, provider, reconciliation or publication effects. |
| RC-012030103-05 | GHR delivery fixture remains explicitly non-delivering; no real sender permit, outbox, queue, issuer, route activation or historical `01-02` CK contract/evidence is overwritten. |

## Handoff

Only `01-03` CK `PASS` qualifies the *background* semantic planner receiver for `IDSER-012-03-02-01/02`. This is an additive integration successor to approved interactive `01-02`, not a CFC to the frozen historic ticket. Future real GHR ingress is separately owned.

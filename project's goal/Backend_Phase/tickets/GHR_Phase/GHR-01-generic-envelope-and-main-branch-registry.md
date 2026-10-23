# GHR-01 — Superseded split manifest: generic envelope and main → branch registry

- **State:** `superseded-by-split`; derived from [Generic Handoff Router (GHR) — Implementation Context v0.6](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md). This manifest is not GO, CFC, CK PASS, route activation, or authorization to change predecessor contracts.
- **Reason:** the prior ticket coupled a security-sensitive raw-byte contract/parser with application-layer registry composition. Those units have independent authority boundaries, failure modes, and review evidence, and are therefore not suitable for one bounded GO → CK → CFC → HMN flow.

## Replacement tickets and fixed dependency order

1. [GHR-01A — Generic envelope, raw ingress, and byte-integrity contract](GHR-01A-generic-envelope-raw-ingress-and-byte-integrity.md)
2. [GHR-01B — Directory-modular main → branch registry foundation](GHR-01B-directory-modular-main-branch-registry.md), after GHR-01A CK PASS
3. GHR-02 — same-transaction accepted-NDV1 issuance and pointer-only pg-boss dispatch, after GHR-01B CK PASS
4. GHR-03 — actual `semantic/batch-plan` receiver ingress and durable `parsed_only` ACK, after GHR-02

The split changes neither the Test-1 boundary nor the architecture. It preserves `can_continue=false` only, no active route, no issuance or dispatch in either replacement ticket, the receiver-owned `SemanticBatchPlanInput/v1` parser, and the separation from provider/model and BSS registries.

## Original-review mapping

| Prior review control | Replacement owner |
| --- | --- |
| GHR-01-RC-01, -02 | GHR-01A-RC-01, -02 |
| GHR-01-RC-03 | GHR-01A-RC-03 and GHR-01B-RC-02 |
| GHR-01-RC-04, -05 | GHR-01B-RC-01, -02 |
| GHR-01-RC-06 | GHR-01A-RC-04 and GHR-01B-RC-03 |
| GHR-01-RB-01, -02 | GHR-01A-RB-01, -02 |
| GHR-01-RB-03 | GHR-01B-RB-01 |
| GHR-01-RB-04 | GHR-01A-RB-03 and GHR-01B-RB-02 |

## Non-transferable controls

- Only a future trusted issuer establishes identity, authorization, scope, pins, idempotency, body bytes/hash, and mode. Zod parsing is never authentication or route authorization.
- `bodySha256` is integrity evidence over exact wrapped bytes; it is not message authentication.
- No generic payload parser, payload union, provider/BSS registry reuse, client-selected destination, fallback/wildcard, queue selection, or dynamic module path is permitted.
- Cross-service authentication, anti-replay, and keyed message authentication remain intentionally deferred; do not invent policy to make either replacement ticket fit.

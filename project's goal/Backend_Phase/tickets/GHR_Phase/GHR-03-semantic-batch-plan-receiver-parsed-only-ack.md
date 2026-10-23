# GHR-03 — Superseded split manifest: semantic receiver and durable delivery ACK

- **State:** `superseded-by-split`; this manifest is planning-only. It is not GO, CFC, CK PASS, route activation, or authority to expand the GHR Test-1 boundary.
- **Source:** [Generic Handoff Router (GHR) — Implementation Context v0.6](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md), §§3.1–3.2, 5.1, 6, 8–10.
- **Reason:** the former ticket coupled the semantic-owned payload interpretation boundary with Bridge-owned authenticated delivery, durable lease/fence state, retries, and terminal receipts. Those have independent failure modes and review evidence, and cannot be safely remediated as one GO → CK → CFC → HMN unit.

## Replacement tickets and fixed dependency order

1. [GHR-03A — Semantic batch-plan receiver adapter and parse-only decision](GHR-03A-semantic-batch-plan-receiver-adapter.md), after GHR-02B CK PASS.
2. [GHR-03B — Bridge delivery, lease fencing, and durable parsed-only ACK](GHR-03B-bridge-delivery-fencing-and-parsed-only-ack.md), after GHR-02B and GHR-03A CK PASS.

GHR-03A makes the exact first branch and receiver-owned canonical parser/false-only parse decision available, but has no queue, trusted-dispatch lookup, Bridge state, or durable ACK. GHR-03B is the only ticket that consumes a job, authenticates/validates the persisted handoff, claims a lease, invokes the actual GHR-03A receiver, and writes `parsed_only`. Its CK contains the complete real Test-1 E2E proof; no fake-only ACK can close the set.

## Preserved Test-1 contract

The split preserves the sole positive flow: accepted NDV1 → GHR-02B pointer-only pg-boss job → authenticated exact `semantic/batch-plan` route → existing five-field canonical parse → one durable idempotent `parsed_only` receipt → STOP. `false` remains the only mode. Neither successor may redeem source, call `resolveBackground()`, plan, use BSS/SEM/provider/reconciliation/projection, add a second activation gate, fallback/latest-route selection, manual replay/reissue/promotion, sensitive diagnostics, or any future route.

## Original-review mapping

| Former control | Replacement owner |
| --- | --- |
| GHR-03-RC-01 | GHR-03B-RC-01, using GHR-03A's real receiver |
| GHR-03-RC-02 | GHR-03A-RC-02 and GHR-03B-RC-02 |
| GHR-03-RC-03 | GHR-03B-RC-03 |
| GHR-03-RC-04 | GHR-03A-RC-03 and GHR-03B-RC-02 |
| GHR-03-RC-05 | GHR-03A-RC-04 and GHR-03B-RC-04 |
| GHR-03-RC-06 | GHR-03B-RC-05 |

## Historical source contract — non-executable

The material below is preserved only for audit/mapping. It has been superseded by the two tickets above and must not be used as GO/CK/CFC/HMN authority.

## Outcome

Make the first real GHR route deliverable: an authenticated Bridge worker receives an issued false-only handoff, resolves the exact pinned `semantic/batch-plan` registration, validates the trusted persisted envelope and exact body bytes, delegates `body.payload` to the existing canonical five-field semantic parser, durably records an idempotent `parsed_only` receipt, and stops.

The positive Test-1 proof is real end-to-end pg-boss delivery to the actual semantic receiver—not a fake receiver or mocked ACK. `parsed_only` is a terminal delivery success, not semantic planning or business completion.

## Exact scope

1. Register `semantic/branches/batch-plan.route.ts` with the exact GHR-02 Test-1 pins and compose it through the semantic domain index. No wildcard, fallback, alternate destination, or provider-route registry may be used.
2. Add `semantic/bodies/semantic-batch-plan-input.v1.ts` as a receiver-owned adapter to the one existing `@atlas/db` canonical `parseSemanticBatchPlanInputV1()` / `canonicalSemanticBatchPlanInputV1()` parser. Never create a second active five-field parser or add `can_continue` as a sixth semantic field.
3. Add `semantic/receivers/batch-plan.receiver.ts` and a Bridge delivery worker path that:
   - authenticates the trusted GHR delivery and loads the known immutable handoff only through the narrow GHR-02 dispatch authority;
   - validates raw transport limits, strict header/wrapper, exact persisted body bytes/hash/encoding, current policy and exact route/handler/body-contract pins before dispatch;
   - extracts the original payload bytes and invokes the existing canonical five-field parser;
   - accepts only `can_continue === false`; missing, nonboolean, coerced, or `true` values fail closed;
   - idempotently writes Bridge-owned delivery/receipt state with terminal disposition `parsed_only`, then returns without any domain work.
4. Implement Bridge-owned lease/fence/receipt state needed for at-least-once pg-boss delivery. Persist an immutable handoff binding, lease owner/generation/expiry, terminal disposition, and sanitized error class. Concurrent/stale claims must not create duplicate logical receiver effects.
5. Classify durable terminal outcomes: missing/disabled/revoked route or destination is `blocked`; invalid, corrupt, forged, malformed, or hash-mismatched material is `quarantined`; classified transient faults use existing pg-boss retry/backoff; exhaustion is `retry_exhausted`. There is no manual replay, reissue, promotion, or route migration.

## Required invariants

- For `false`, the receiver must stop immediately after canonical payload parsing and durable idempotent `parsed_only` receipt. It must make zero calls to `resolveBackground()`, IDSER candidates/partition/persistence, BSS, SEM, provider APIs, reconciliation, projection, or downstream GHR issuance.
- Delivery is at-least-once physically but exactly-once-like for logical receipt through durable idempotency and lease fencing. Retry preserves the original handoff identity, body bytes/hash and route/policy/handler pins.
- The generic router never interprets semantic fields; the semantic adapter rejects malformed/extra/noncanonical payload fields using the existing parser. Generic Zod success never substitutes for receiver parsing or trusted-delivery authentication.
- Diagnostics are sanitized and bounded. No raw source/PDF/media, prompt, provider output, credentials, or payload dump enters logs, dead-letter records, test evidence, or queue metadata.
- `can_continue=true` is explicitly outside this ticket. Do not create a future continuation path, source-redemption test, second activation gate, or semantically meaningful `true` fixture.

## Explicit non-goals

- No NDV1 redemption or accepted-source/scope/media-grant validation beyond this false-only canonical parse boundary.
- No IDSER v3 plan, corpus planning, BSS capacity/admission, semantic batch execution, provider call, reconciliation fan-in, projection eligibility, Master publication, or a follow-on handoff.
- No new semantic payload contract, fake-only receiver, GHR core domain validator, manual terminal replay, or automatic change to latest policy/handler during retry.
- No active reconciliation/projection/SEM receiver or Test-2 route.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-03-RC-01 | A genuine accepted NDV1 flows through the GHR-02 pointer-only pg-boss job into the actual registered `semantic/batch-plan` receiver; it parses the exact existing five-field payload and records one durable `parsed_only` receipt. | Isolated real PostgreSQL/pg-boss E2E proof with actual receiver/receipt records. |
| GHR-03-RC-02 | The receiver rejects forged issuer/producer context, invalid header, wrong route/scope/policy/handler/body contract, disabled policy, malformed/extra payload field, duplicate-key/raw-body corruption, and changed body hash/bytes. | False-only negative tests with sanitized durable `blocked`/`quarantined` outcomes. |
| GHR-03-RC-03 | Restart, lost ACK, duplicate/reordered jobs, concurrent claims, and expired/stale leases preserve one original false-only logical handoff and one idempotent terminal receipt; classified transient faults retry only through pg-boss. | Real queue/restart/lease-fence integration tests. |
| GHR-03-RC-04 | Missing/nonboolean/extra wrapper keys and `true` are rejected; false cannot default/coerce or accidentally invoke continuation. | Wrapper/receiver negative tests; no `true` positive test exists. |
| GHR-03-RC-05 | Each false-only positive and negative path has explicit zero effects for `resolveBackground()`, IDSER, BSS, SEM, provider, reconciliation, projection, and downstream queue work. | Spies/database/queue assertions plus static dependency boundary test. |
| GHR-03-RC-06 | Unknown/missing/disabled destination is terminal `blocked`; corrupt/forged material is terminal `quarantined`; exhausted transient retry is `retry_exhausted`; no manual replay/reissue/promotion or fallback handler exists. | Durable disposition, retry, and forbidden-surface tests. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-03-B1` — GHR-02 owns immutable issuance/policy and pointer-only dispatch; `GHR-03-B2` — semantic owns the five-field parser; `GHR-03-B3` — false-only receipt is not source redemption or planner authority.
- **Trust boundaries:** `GHR-03-T1` — Bridge reads a known issued handoff through narrow dispatch authority; `GHR-03-T2` — exact pinned route resolves to the semantic receiver; `GHR-03-T3` — opaque wrapped body crosses to the receiver-owned parser; `GHR-03-T4` — receipt/lease state controls duplicate delivery effects.
- **Sensitive assets:** `GHR-03-A1` — immutable handoff identity, bytes/hash/pins and delivery state; `GHR-03-A2` — Bridge lease/fence and ACK authority; `GHR-03-A3` — receiver diagnostics and payload confidentiality.
- **Identity context:** `GHR-03-I1` — retain authenticated delivery context, handoff ID, pinned producer/route/policy/handler/body-contract, and lease generation through receipt; do not trust job payload or caller JSON as authority.
- **Extension seams:** `GHR-03-S1` — receiver adapter can later attach ordinary source checks only under a separately approved continuation ticket; `GHR-03-S2` — terminal disposition/error class supports later operations without payload disclosure; `GHR-03-S3` — durable lease generation supports future retry/recovery policy without route migration.
- **Prohibited couplings:** `GHR-03-C1` — no `resolveBackground()` or domain work on false; `GHR-03-C2` — no generic semantic-field parsing; `GHR-03-C3` — no fallback/latest handler selection; `GHR-03-C4` — no manual replay/reissue/mode promotion; `GHR-03-C5` — no sensitive payload diagnostics.
- **Verification seams:** `GHR-03-V1` real receiver E2E evidence; `GHR-03-V2` forged/corrupt/policy negative evidence; `GHR-03-V3` restart/lost-ACK/concurrency/fence evidence; `GHR-03-V4` zero-downstream-effects evidence.
- **Unresolved security policy:** cross-service authentication/message authentication remains deferred; any future true-continuation source redemption must separately qualify scope/grant/lifecycle checks.
- **Planning findings:** none within the false-only parsed-receipt boundary.
- **Review bindings:** `GHR-03-RB-01` verifies `GHR-03-T1..T3` and `GHR-03-V1/V2` with real E2E and negative delivery evidence; `GHR-03-RB-02` verifies `GHR-03-T4`, `GHR-03-A2`, and `GHR-03-V3` with lease/retry evidence; `GHR-03-RB-03` verifies `GHR-03-B3`, `GHR-03-C1/C2`, and `GHR-03-V4`; `GHR-03-RB-04` verifies `GHR-03-C3..C5` using terminal-disposition and diagnostic-boundary tests.

## Hard stop

Stop if the first delivery cannot use the actual semantic receiver, if false-only parse/ACK cannot be durably fenced/idempotent, or if any necessary positive proof requires source redemption, planning, BSS, SEM, or a `true` continuation. Report the narrow delivery/authority gap; do not substitute a fake ACK, broaden Bridge privilege, or add downstream work.

# GHR-03B — Bridge delivery, lease fencing, and durable parsed-only ACK

- **State:** `planned`; not GO, CFC, CK PASS, source redemption, planning activation, or authority to alter approved predecessor contracts.
- **Dependencies:** GHR-02B and GHR-03A CK PASS. Consume GHR-02A's read-only dispatch seam and GHR-03A's real semantic receiver without widening either boundary.
- **Source:** [GHR v0.6 implementation context](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md), §§3.1–3.2, 5.1, 6, 8–10.

## Outcome

Close GHR Test-1: the authenticated Bridge worker consumes the real GHR-02B pointer-only job, loads one known immutable handoff through the narrow read seam, validates the fixed header/raw wrapper/hash/policy/pins, claims a fenced Bridge delivery row, invokes the real GHR-03A semantic receiver, and writes one durable `parsed_only` terminal receipt. This is the sole ticket that proves the actual end-to-end positive flow.

## Exact scope

1. Add Bridge-owned `bridge.generic_handoff_delivery` runtime state with immutable handoff binding, lease owner/generation/expiry, terminal disposition, and bounded sanitized error class. `agents_bridge` alone may claim/ACK it; `atlas_app` has no receipt/lease writes.
2. Add the existing pg-boss consumer path for `GenericHandoffJob/v1` / `handoffId` only. Authenticate the protected delivery context, load only that known handoff through GHR-02A's read seam, and reject any job payload as routing/body authority.
3. Before dispatch validate generic raw limits and strict fixed header/wrapper, exact persisted bytes/hash/encoding, current policy/revocation status, exact route/handler/body-contract pins, and GHR-03A's exact registration. The generic layer does not parse semantic fields.
4. Invoke GHR-03A with a verified delivery command. Persist `parsed_only` only after its canonical parser accepts `false`; then stop. A fake receiver or mocked ACK is insufficient.
5. Implement at-least-once physical delivery with exactly-once-like logical receipt through idempotency and lease fencing. Restart, lost ACK, duplicate/reordered job, concurrent claim, and stale/expired lease preserve one logical handoff and one terminal receipt.
6. Persist terminal `blocked` for missing/disabled/revoked route or destination; `quarantined` for invalid/corrupt/forged/header/body/hash material; and `retry_exhausted` after classified transient pg-boss retries. There is no manual replay, reissue, promotion, route migration, or fallback.

## Required invariants

- Retry always retains original handoff ID, body bytes/hash, and policy/handler pins. Only classified transient faults use existing pg-boss retry/backoff.
- False receipt stops immediately after GHR-03A's canonical parse and durable ACK: zero `resolveBackground()`, IDSER, BSS, SEM, provider, reconciliation, projection, or downstream queue effect.
- Diagnostics/queue/receipts contain no payload dump, source/PDF/media, prompt, provider output, credential, or secret.

## Explicit non-goals

- No `can_continue=true`, NDV1 redemption, normal source/grant/lifecycle checks for continuation, planner/provider work, future route, second activation gate, or semantic payload contract change.
- No mutation of Atlas intent/policy or Perception acceptance, broad cross-role grant, scheduler/outbox/poller/trigger, manual terminal replay/reissue/promotion, or fallback/latest handler.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-03B-RC-01 | A genuine accepted NDV1 reaches the real GHR-03A receiver through the GHR-02B pointer-only job, parses the existing five-field payload, and produces one durable `parsed_only` receipt. | Isolated real PostgreSQL/pg-boss E2E proof with actual route, receiver, and receipt records. |
| GHR-03B-RC-02 | Forged issuer/producer, invalid header/wrapper, wrong route/scope/policy/handler/contract, disabled policy, duplicate-key/raw-body corruption, changed bytes/hash, and receiver false-only rejection become sanitized durable `blocked`/`quarantined` outcomes as classified. | False-only end-to-end negative tests, including GHR-03A adapter evidence. |
| GHR-03B-RC-03 | Restart, lost ACK, duplicate/reordered jobs, concurrent claims, and stale/expired leases preserve one original false-only handoff and one terminal receipt; only classified transient faults retry and exhaustion is `retry_exhausted`. | Real queue/restart/lease-fence integration tests. |
| GHR-03B-RC-04 | Every positive and negative delivery path has zero resolver, IDSER, BSS, SEM, provider, reconciliation, projection, and downstream queue effects. | Database/queue spies plus static dependency boundary test. |
| GHR-03B-RC-05 | No manual replay/reissue/promotion, route migration/fallback, broad Atlas write access, or sensitive diagnostic surface exists. | Role authorization, forbidden-surface, and sanitized-diagnostic tests. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-03B-B1` GHR-02A/B own issuance and pointer publication; `GHR-03B-B2` GHR-03A owns semantic parsing; `GHR-03B-B3` Bridge owns delivery runtime only.
- **Trust boundaries:** `GHR-03B-T1` pointer job to read-only handoff lookup; `GHR-03B-T2` pinned generic dispatch to real semantic receiver; `GHR-03B-T3` lease/receipt state controls duplicate effects.
- **Sensitive assets:** `GHR-03B-A1` immutable handoff bytes/hash/pins; `GHR-03B-A2` Bridge lease/ACK authority; `GHR-03B-A3` diagnostics confidentiality.
- **Identity context:** `GHR-03B-I1` retain authenticated delivery context, handoff/pins, and lease generation; do not trust job payload/caller JSON as authority.
- **Extension seams:** `GHR-03B-S1` durable terminal class supports later operations without disclosure; `GHR-03B-S2` fence generation supports future recovery policy without route migration.
- **Prohibited couplings:** `GHR-03B-C1` no semantic-field parsing; `GHR-03B-C2` no false-mode domain work; `GHR-03B-C3` no fallback/replay/promotion; `GHR-03B-C4` no shared write role or sensitive diagnostics.
- **Verification seams:** `GHR-03B-V1` real E2E; `GHR-03B-V2` forged/corrupt rejection; `GHR-03B-V3` lease/retry recovery; `GHR-03B-V4` zero downstream effects; `GHR-03B-V5` role/diagnostic proof.
- **Unresolved security policy:** cross-service authentication/message authentication remains deferred; future `true` source redemption must separately qualify scope/grant/lifecycle checks.
- **Planning findings:** none if the narrow dispatch read and separate Bridge write schema remain enforceable.
- **Review bindings:** `GHR-03B-RB-01` verifies `T1/T2/A1/V1/V2`; `GHR-03B-RB-02` verifies `T3/A2/V3`; `GHR-03B-RB-03` verifies `B2/C1/C2/V4`; `GHR-03B-RB-04` verifies `C3/C4/A3/V5`.

## Hard stop

Stop if actual delivery cannot use GHR-03A's real receiver, false-only parse/ACK cannot be durably fenced, a valid route requires source redemption/domain work, or Bridge needs Atlas intent/policy write access. Report the narrow delivery/authority gap; do not fake an ACK, broaden privilege, or activate downstream work.

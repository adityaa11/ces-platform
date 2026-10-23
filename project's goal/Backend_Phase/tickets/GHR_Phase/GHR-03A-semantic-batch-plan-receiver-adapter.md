# GHR-03A — Semantic batch-plan receiver adapter and parse-only decision

- **State:** `planned`; not GO, CFC, CK PASS, queue consumption, trusted-dispatch authentication, durable receipt, or authority to alter an approved predecessor contract.
- **Dependency:** GHR-02B CK PASS. Consume its sole Test-1 pins and the approved GHR-01A/B generic and registry foundations.
- **Successor:** GHR-03B alone makes this receiver reachable through Bridge delivery and persists its outcome.
- **Source:** [GHR v0.6 implementation context](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md), §§3.1–3.2, 4, 5.1, 8–10.

## Outcome

Make the actual `semantic/batch-plan` route and receiver-owned adapter available for Test-1. Given a dispatcher-verified delivery command, it selects only the exact frozen registration, accepts only `can_continue === false`, strictly delegates the unchanged payload to `@atlas/db`'s existing canonical five-field parser, and returns a parse-only decision. It has no persistence or queue effect; `parsed_only` becomes durable only in GHR-03B.

## Exact scope

1. Add and compose `semantic/branches/batch-plan.route.ts`, `semantic/bodies/semantic-batch-plan-input.v1.ts`, and `semantic/receivers/batch-plan.receiver.ts` through the semantic domain index. The one live registration has only the GHR-02B `perception.acceptance` / `semantic/batch-plan` / `v1` / `v1` / `SemanticBatchPlanInput/v1` pins and exact 2,048/2,081-byte Test-1 bounds.
2. Make the body adapter call only existing `parseSemanticBatchPlanInputV1()` and `canonicalSemanticBatchPlanInputV1()`. It must not create a second active parser or regard `can_continue` as a sixth semantic field.
3. Define a narrow verified-delivery command interface from the future Bridge dispatcher. The receiver must not load a handoff, accept caller JSON, choose a route, authenticate a producer, or treat a generic parse/hash as semantic parsing authority.
4. Require a verified command whose mode is exact `false`; missing, nonboolean, coerced, or `true` mode cannot produce a parse-only success. Generic raw-wrapper shape, including extra-key rejection, remains a pre-dispatch concern for GHR-03B. A valid parse returns only an internal parse-only result for GHR-03B to durably record.

## Required invariants

- Registration is exact: no wildcard, fallback, provider/model route registry, dynamic path, latest-handler selection, or alternate destination.
- The adapter is semantic-owned; generic code remains opaque to business fields. The receiver has no `resolveBackground()` or domain-work dependency.
- No raw payload or confidential content enters diagnostics.

## Explicit non-goals

- No pg-boss worker/job consumption, dispatch authority lookup, route-policy/revocation check, lease/fence/receipt table, retry, terminal disposition, or ACK persistence.
- No NDV1 redemption, source/grant validation, planning, BSS/SEM/provider/reconciliation/projection/downstream work, `true` code/test, or future route.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-03A-RC-01 | Only the exact Test-1 pins select the live semantic branch; every mismatched/unknown selector has no receiver. No fallback/provider-route reuse exists. | Route composition and exact-selector negative tests. |
| GHR-03A-RC-02 | The adapter accepts the unchanged existing five-field payload only through the canonical parser and rejects malformed, extra, noncanonical, or wrong-contract payloads. | Parser-delegation/parity tests and static no-second-parser check. |
| GHR-03A-RC-03 | The receiver accepts only an explicit `false` verified command; missing/nonboolean/coerced/`true` modes cannot yield a parse-only success. | False-only receiver negative tests; no `true` positive test. |
| GHR-03A-RC-04 | Receiver execution has no database write, queue, resolver, planner, BSS, SEM, provider, reconciliation, projection, or downstream-handoff effect. | Focused static dependency and zero-side-effect oracle. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-03A-B1` GHR-02A/B own issuance/provenance; `GHR-03A-B2` semantic owns the existing canonical parser; `GHR-03A-B3` GHR-03B owns delivery durability.
- **Trust boundaries:** `GHR-03A-T1` a verified-delivery command crosses to the semantic adapter; `GHR-03A-T2` opaque payload crosses into the existing canonical parser.
- **Sensitive assets:** `GHR-03A-A1` pinned route/contract identity; `GHR-03A-A2` payload confidentiality.
- **Identity context:** `GHR-03A-I1` receiver retains supplied immutable pins for equality checks but does not establish their authenticity.
- **Extension seams:** `GHR-03A-S1` receiver can later attach source checks only under a separate continuation ticket; `GHR-03A-S2` parse-only decision separates domain parsing from delivery persistence.
- **Prohibited couplings:** `GHR-03A-C1` no generic semantic-field parser; `GHR-03A-C2` no domain work on false; `GHR-03A-C3` no dispatch/receipt persistence.
- **Verification seams:** `GHR-03A-V1` exact route selection; `GHR-03A-V2` canonical parser parity; `GHR-03A-V3` false-only rejection; `GHR-03A-V4` zero-side-effects.
- **Unresolved security policy:** trusted delivery authentication is deferred to GHR-03B; future `true` source redemption remains separate.
- **Planning findings:** none if the receiver can remain a pure adapter/decision seam.
- **Review bindings:** `GHR-03A-RB-01` verifies `T1/A1/V1`; `GHR-03A-RB-02` verifies `T2/V2/C1`; `GHR-03A-RB-03` verifies `S1/V3`; `GHR-03A-RB-04` verifies `C2/C3/V4`.

## Hard stop

Stop if a live route requires queue consumption, a database write, direct Atlas handoff lookup, a duplicate parser, or domain processing to demonstrate its boundary. Report the coupling; do not replace the eventual real ACK with a fake one.

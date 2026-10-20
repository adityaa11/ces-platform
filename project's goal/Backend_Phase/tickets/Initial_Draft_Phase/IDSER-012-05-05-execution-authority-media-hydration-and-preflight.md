# IDSER-012-05-05 — Execution authority, media hydration, and preflight

- **State:** `planned`; executable leaf only after explicit GO and IDSER-012-05-04 CK `PASS`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Scope

Consume only the verified **v3** `-05-04` reconstruction under existing execution lifecycle/replay protections. Do not accept old-version batch references or continue through a pre-IDSER whole-document fallback. For every authorized retry, issue fresh scoped derived-image redemptions for exactly the ordered selected manifest. Hydrate and validate asset reference, source identity, SHA-256, PNG MIME type, byte length, dimensions, and execution scope before attaching the selected images in manifest order to fake multipart transport. Correct preflight so `imageTpm: unknown` is provenance rather than multipart denial where route capability, internal demand, authorization, deadline, cancellation, and structural constraints are valid.

## Ordinary SEM worker and exact selected-media transport

Exercise the **ordinary SEM worker entrypoint and promoted composition**, not only `runStepwiseSemanticComposition` as an isolated helper. Supply the server-authorized v3 IDSER batch from an isolated snapshot of the existing canonical Safara professional accepted `NormalizedDocument V1`; require actual original verified selected PNG identities, fresh bound grants, selected-only hydration and exact attachment order. The worker must never rebuild the whole normalized document or redeem all five images unless that exact set was planned. Use fake provider transport; live provider, GHR dispatch and BSS reservation remain forbidden.

The adapter's actual JSON serializer is authoritative for outbound byte comparison. Capture only the byte count and redacted request identity from fake fetch. Every batch satisfies `actualSerializedRequestBytes <= plannedConservativeRequestBytes`; changed route, adapter, media capability, estimator, policy or configuration rejects/replans *before* hydration/outbound effects. No alternate image-less/legacy execution fallback.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-05-01` | Valid server-bound execution redeems, verifies, and attaches exactly the selected assets in order; no whole-document rebuild, omission, substitution, or extra attachment occurs. |
| `RC-01205-05-02` | v1/v2 or mixed-version plan/handoff, invalid grant/scope/integrity/metadata, cancellation, deadline expiry, unsupported media, or structural excess prevents all provider dispatch. No legacy whole-document or image-less fallback is invoked. |
| `RC-01205-05-03` | Fresh retry grants preserve immutable selected identities without persisting a grant or creating unbounded retries. |
| `RC-01205-05-04` | Unknown image TPM alone does not block a measured structurally valid request; known capability and structural violations still fail before dispatch. |
| `RC-01205-05-05` | Actual ordinary SEM worker path executes exactly selected v3 batch through server-bound reconstruction and fake provider transport, redeeming no unplanned image, including with five-visual source and smaller selected batches. |
| `RC-01205-05-06` | Fake-fetch observes the adapter's actual serialized body byte count within the immutable conservative estimate; route/adapter/image capability/estimator/config changes fail closed without provider effects. |

## Boundaries and workflow

No live provider call, production routing change, BSS reservation, replanning, persistence redesign, or semantic result acceptance is authorized. CFC may repair only execution/hydration/preflight rows with fake transport. HMN is required for an actual incompatibility in the established grant/lifecycle boundary; it cannot authorize a browser credential, alternate media store, or a provider call.

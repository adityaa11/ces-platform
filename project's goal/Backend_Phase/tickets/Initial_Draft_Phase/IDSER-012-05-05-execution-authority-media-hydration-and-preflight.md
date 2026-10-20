# IDSER-012-05-05 — Execution authority, media hydration, and preflight

- **State:** `planned`; executable leaf only after explicit GO and IDSER-012-05-04 CK `PASS`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Scope

Consume only the verified **v3** `-05-04` reconstruction under existing execution lifecycle/replay protections. Do not accept old-version batch references or continue through a pre-IDSER whole-document fallback. For every authorized retry, issue fresh scoped derived-image redemptions for exactly the ordered selected manifest. Hydrate and validate asset reference, source identity, SHA-256, PNG MIME type, byte length, dimensions, and execution scope before attaching the selected images in manifest order to fake multipart transport. Correct preflight so `imageTpm: unknown` is provenance rather than multipart denial where route capability, internal demand, authorization, deadline, cancellation, and structural constraints are valid.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-05-01` | Valid server-bound execution redeems, verifies, and attaches exactly the selected assets in order; no whole-document rebuild, omission, substitution, or extra attachment occurs. |
| `RC-01205-05-02` | v1/v2 or mixed-version plan/handoff, invalid grant/scope/integrity/metadata, cancellation, deadline expiry, unsupported media, or structural excess prevents all provider dispatch. No legacy whole-document or image-less fallback is invoked. |
| `RC-01205-05-03` | Fresh retry grants preserve immutable selected identities without persisting a grant or creating unbounded retries. |
| `RC-01205-05-04` | Unknown image TPM alone does not block a measured structurally valid request; known capability and structural violations still fail before dispatch. |

## Boundaries and workflow

No live provider call, production routing change, BSS reservation, replanning, persistence redesign, or semantic result acceptance is authorized. CFC may repair only execution/hydration/preflight rows with fake transport. HMN is required for an actual incompatibility in the established grant/lifecycle boundary; it cannot authorize a browser credential, alternate media store, or a provider call.

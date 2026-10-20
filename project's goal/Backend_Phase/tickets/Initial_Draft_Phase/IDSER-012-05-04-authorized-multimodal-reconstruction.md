# IDSER-012-05-04 — Authorized multimodal reconstruction

- **State:** `planned`; executable leaf only after explicit GO and IDSER-012-05-03 CK `PASS`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Scope

Extend the existing server-owned reconstruction boundary to accept an authorized v3 handoff without an interactive browser session. Validate execution identity, project/workspace/bundle/document scope, immutable plan/batch binding, lifecycle/cancellation/stale state, then resolve accepted media metadata and rebuild the `-05-01` canonical request from the persisted selection. Recompute and compare source-specification, manifest, logical-request, estimator/configuration, measurements, and resource envelope before returning a reconstruction result. Do not hydrate media or dispatch.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-04-01` | Authorized v3 selection reconstructs the identical complete logical request and all persisted identities/measurements from accepted document/media metadata. |
| `RC-01205-04-02` | Reordered, substituted, missing, duplicate, stale, foreign, changed-metadata, or estimator-mismatched media/records fail before hydration. |
| `RC-01205-04-03` | Background execution uses existing server-owned authority and rejects anonymous, client-controlled, hash-only, browser-session-dependent, cancelled, expired, or out-of-scope access. |

## Boundaries and workflow

This is a read-only reconstruction leaf. It cannot issue grants, consume bytes, reserve BSS work, call a provider, or finalize semantics. CFC repairs only resolver/authorization/reconstruction parity evidence. HMN is required for a genuine missing execution-authority seam; it cannot mint a new trusted principal or weaken scope/lifecycle checks.

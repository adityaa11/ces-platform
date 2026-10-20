# IDSER-012-05-04 — Read-only locator reconstruction and consumer parity

- **State:** `planned`; executable only after explicit GO and `IDSER-012-05-03` CK PASS.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Sole scope

Complete the **reference-only read-only reconstruction verifier** used to prove that a future SEM consumer can independently rebuild the *same ephemeral canonical logical SEM request* from an immutable v3 plan/handoff and accepted `NormalizedDocument V1`.

Input consists solely of a v3 plan ID/hash and one v3 handoff ID/hash, an authorized source-read scope, and approved deterministic composer/estimator/route-policy identities. Verify project/workspace/bundle/document/source identity, accepted perception/cache version and fingerprint, immutable parent/child membership, cancellation/staleness, exact owned/context locators, accepted derived-media reference identities and bounded hash commitments. Resolve the accepted source and accepted media metadata **read-only**; reconstruct source-slot order, source specification, ordered selected image descriptor manifest, complete logical request, conservative byte/token counts, reserved output and BSS resource demand **in memory**. Recompute and compare every stored hash/measurement/identity. Reject mismatches before returning a verified reference-only result.

The result is a proof/contract for future SEM consumption, **not** SEM worker execution authority. No provider request, hydrated PNG bytes, grants, BSS admitted job, browser session, transport, semantic output or result staging is involved. Scope checks must prevent foreign callers/sources; a later SEM server principal and execution lifecycle remain the downstream SEM-CUTOVER owner's implementation.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-04-01` | Every valid v3 handoff reconstructs exact logical request hash, source-specification hash, ordered selected-media manifest hash, slot/selection order, prompt/schema/composer identities, input/output token and request-byte measurements without reading a serialized request from DB. |
| `RC-01205-04-02` | Foreign/stale/cancelled/v1/v2/mixed-version, missing/reordered/substituted assets/locators, changed source fingerprint, estimator/route-policy drift or mismatched structural envelope fail closed. No fallback, source replacement, live SEM work or hydration. |
| `RC-01205-04-03` | The verifier is read-only and source-scope authorized, with no browser-session-dependent authority treated as a durable *execution* permission; emits only bounded reconstruction metadata and identities. |
| `RC-01205-04-04` | The expected SEM consumer contract is explicit (v3 ref/hash, selected media, stable composer/prompt/schema/estimator identities, exact hash and resource parity) and can be checked without a provider runtime. |

## Canonical Safara proof

Use the existing approved PERC-RESET `safara-professional-perception` accepted `NormalizedDocument V1` from `atlas-canonical-perception`, source SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`, via an isolated snapshot. Verify the five real visual/asset identities match accepted manifests. No re-perception, fixture substitution, mutation of canonical volumes, SEM worker or provider call.

## Ownership

This verifier may reside at the existing shared DB/IDSER reference-resolution seam. **SEM-CUTOVER** later owns its integration into authenticated/background SEM execution, image byte hydration and delivery, semantic envelope interpretation and finalization. HMN/CFC here are limited to read-only reconstruction and its reference contract.

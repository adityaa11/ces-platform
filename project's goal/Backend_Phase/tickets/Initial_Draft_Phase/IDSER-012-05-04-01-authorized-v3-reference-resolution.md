# IDSER-012-05-04-01 — Authorized v3 reference resolution

- **State:** `awaiting_review`; implementation commit and review evidence are recorded in the GO checkpoint.
- **Parent map:** [IDSER-012-05-04](IDSER-012-05-04-authorized-multimodal-reconstruction.md).

## Sole scope

Given only v3 plan ID/hash, v3 handoff ID/hash and an authorized source-read scope, perform read-only resolution and validation of project/workspace/bundle/document/source identity, accepted perception/cache version and fingerprint, immutable membership, cancellation/staleness, exact locators, accepted derived-media references and bounded commitments. Reject before returning resolved references if caller, source, version, membership, asset/locator order or identity is foreign, stale, cancelled, missing, substituted or mixed-version.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0401-01` | Resolution is source-scope authorized and read-only; it validates all v3 immutable bindings and accepted source/media reference identities without fallback or source replacement. |
| `RC-01205-0401-02` | Foreign/stale/cancelled/v1/v2/mixed, missing/reordered/substituted locator or asset, changed fingerprint and corrupt membership inputs fail closed. |
| `RC-01205-0401-03` | It returns only bounded resolved metadata/identities, never browser-session execution authority, hydrated content, grants or a materialized logical request. |

## Boundaries

No canonical composition/re-estimation, provider execution, hydration, transport, BSS admission, semantic output or result staging. CFC/HMN is limited to source-read authorization and reference integrity.

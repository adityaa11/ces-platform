# IDSER-012-05-01-02 — Conservative multimodal estimation and serializer-policy conformance

- **State:** `planned`; executable only after explicit GO and `IDSER-012-05-01-01` CK PASS.
- **Parent map:** [IDSER-012-05-01](IDSER-012-05-01-multimodal-canonical-composition-and-estimation.md).

## Sole scope

Consume the canonical composition from `-01-01` with the existing effective route/media capability metadata. Pin source specification, prompt/schema/profile, composer, adapter-serialization, estimator and configuration identities. Purely and conservatively measure text/image input tokens, projected base64/data-URL/transport-JSON framing bytes, output reservation exactly once and the BSS resource envelope. Validate positive dimensions and overflow-safe arithmetic. The image estimate `ceil(width/768) * ceil(height/768) * 516` is a versioned internal assumption, not Anoman quota or billed-token claim; provider image TPM stays `unknown` and cannot itself deny a plan.

Use the existing shared composer/estimator; deterministic fixtures may compare documented stable adapter serialization semantics without network, fetch, grants, provider calls or hydration. Missing/ambiguous adapter semantics must fail as a precise planner/SEM contract dependency.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0102-01` | Image tokens, conservative complete request bytes, input tokens, output reservation and BSS demand are deterministically measured from the `-01-01` manifest and effective limits without hydration. |
| `RC-01205-0102-02` | Image-only, mixed and text-only compositions count every selected owned/context PNG exactly once; dimensions/arithmetic failures reject safely. |
| `RC-01205-0102-03` | Route/profile/serializer, estimator/configuration and prompt/schema/source identities are pinned; serializer-policy conformance detects unsafe undercount/drift without SEM/Anoman invocation. |
| `RC-01205-0102-04` | Unknown image TPM is retained as provenance, never invented as a numeric limit or automatic denial; no second estimator or serializer is introduced. |

## Boundaries

No changes to source-slot selection, persistence, partitioning, BSS admission, GHR, provider transport, SEM work or durable request material. CFC/HMN is limited to estimation and serialization-policy evidence.

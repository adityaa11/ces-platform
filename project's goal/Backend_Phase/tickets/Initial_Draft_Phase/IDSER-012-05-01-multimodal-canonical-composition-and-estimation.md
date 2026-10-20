# IDSER-012-05-01 — Multimodal canonical composition and estimation

- **State:** `planned`; executable leaf only after explicit GO.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).
- **Predecessors:** approved IDSER-012-04 canonical packet/estimator interfaces and accepted PERC-RESET media metadata.

## Scope

Implement one pure, provider-neutral canonical selected-media composition surface used by IDSER planning and later SEM reconstruction. From verified selected text, tables, and PNG descriptors, produce deterministic source slots and an ordered manifest with `sourceSlot`, locator, asset reference, source/asset SHA-256, MIME type, dimensions, byte length, and attachment order. Bind prompt, schema, source-specification, manifest, and logical-request hashes.

Implement the pinned initial image estimator `ceil(width / 768) * ceil(height / 768) * 516`, including positive-dimension, configured maximum-dimension, and safe-arithmetic validation. Measure text/image/total input tokens, output reservation once, media totals, full Anoman serialized request bytes (including deterministic base64/data-URL/JSON framing without bytes), resource envelope, and estimator configuration hash. Obtain PNG/count/byte/dimension limits from the effective route capability; do not duplicate planner constants.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-01-01` | Equal verified selections produce byte-stable slots, manifest, hashes, and measurements; foreign, duplicate, missing, unsupported, malformed, or unsafe metadata fails closed. |
| `RC-01205-01-02` | Text-only behavior is unchanged; mixed and image-only requests account for each selected owned/context-only attachment once, and reserve output once. |
| `RC-01205-01-03` | Image tiles, base64/data-URL/JSON framing, complete request bytes, and resource envelope are deterministically measured from metadata without media hydration or persistence. |
| `RC-01205-01-04` | Route capability, estimator identity/configuration, and `imageTpm: unknown` provenance stay distinct; unknown TPM is neither a denial nor an invented limit. |

## Boundaries and workflow

No partitioning, persistence, reconstruction, grant, provider execution, parser/finalizer, or route configuration change is in scope. Reuse the qualified source packet and request estimator; no second serializer or estimator authority. CFC may repair only canonical composition/measurement rows. HMN is required for an incompatible accepted packet, estimator policy, or route-capability authority; it cannot authorize a new quota, provider, or pipeline.

**Evidence:** deterministic positive/negative fixtures, redacted hashes and measurements, and text/table regression results. Exclude image bytes, base64, raw source, provider bodies, grants, and credentials.

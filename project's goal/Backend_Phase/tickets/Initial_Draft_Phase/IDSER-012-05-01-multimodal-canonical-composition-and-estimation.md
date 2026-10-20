# IDSER-012-05-01 — Multimodal canonical composition and estimation

- **State:** `planned`; executable leaf only after explicit GO.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).
- **Predecessors:** approved IDSER-012-04 canonical packet/estimator interfaces and accepted PERC-RESET media metadata.

## Scope

Implement one pure, provider-neutral canonical selected-media composition surface used by IDSER planning and later SEM reconstruction. From verified selected text, tables, and PNG descriptors, produce deterministic source slots and an ordered manifest with `sourceSlot`, locator, asset reference, source/asset SHA-256, MIME type, dimensions, byte length, and attachment order. Bind prompt, schema, source-specification, manifest, and logical-request hashes.

Implement the pinned initial image estimator `ceil(width / 768) * ceil(height / 768) * 516`, including positive-dimension, configured maximum-dimension, and safe-arithmetic validation. Measure text/image/total input tokens, output reservation once, media totals, full Anoman serialized request bytes (including deterministic base64/data-URL/JSON framing without bytes), resource envelope, and estimator configuration hash. Obtain PNG/count/byte/dimension limits from the effective route capability; do not duplicate planner constants.

## Mandatory frozen visual role/status and serializer parity

Freeze the selected-image source semantics *now*, before immutable handoff hashing. An independently owned selected `visual_region` with a verified accepted PNG is an extraction-eligible `owned_source`, even while `status: pending_unexamined_visual` means its **meaning** is not yet examined. A context-only selected visual retains `context_only_reference` and cannot become an owned semantic result. Both are attachable and measured once from selected locators + verified `assetIdentity`; do not key attachment/estimation eligibility to `role === pending_authorized_media` or `status === ready`. Maintain deterministic slot assignment, pending-visual metadata and hashes. `-05-06` must accept this frozen source-slot contract without changing it.

Prove estimator-to-Anoman serializer conformance with bounded test PNG bytes and fake HTTP fetch: the *actual* adapter `JSON.stringify` outbound body, including base64/data URL, model, messages, response_format, temperature and stream, satisfies `actualSerializedRequestBytes <= plannedConservativeRequestBytes`. Bind the effective route/adapter/profile/configuration version. A real-data fixture test additionally requires the already accepted Safara professional source in `atlas-canonical-perception`, not a regenerated/mock copy.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-01-01` | Equal verified selections produce byte-stable slots, manifest, hashes, and measurements; foreign, duplicate, missing, unsupported, malformed, or unsafe metadata fails closed. |
| `RC-01205-01-02` | Text-only behavior is unchanged; mixed and image-only requests account for each selected owned/context-only attachment once, and reserve output once. |
| `RC-01205-01-03` | Image tiles, base64/data-URL/JSON framing, complete request bytes, and resource envelope are deterministically measured from metadata without media hydration or persistence. |
| `RC-01205-01-04` | Route capability, estimator identity/configuration, and `imageTpm: unknown` provenance stay distinct; unknown TPM is neither a denial nor an invented limit. |
| `RC-01205-01-05` | Source packet freezes owned versus contextual visual role, pending semantic-examination status and attachment eligibility independent of role/status; exact image identities, source-slot mapping, and hashes remain consumable by -05-06. |
| `RC-01205-01-06` | Fake-fetch test of the real Anoman JSON serialization proves actual request bytes do not exceed metadata-only planned conservative bytes, including image base64/data URL and all transport framing. Route/adapter/config drift cannot silently change the estimator. |

## Boundaries and workflow

No partitioning, persistence, reconstruction, grant, provider execution, parser/finalizer, or route configuration change is in scope. Reuse the qualified source packet and request estimator; no second serializer or estimator authority. CFC may repair only canonical composition/measurement rows. HMN is required for an incompatible accepted packet, estimator policy, or route-capability authority; it cannot authorize a new quota, provider, or pipeline.

**Evidence:** deterministic positive/negative fixtures, redacted hashes and measurements, and text/table regression results. Exclude image bytes, base64, raw source, provider bodies, grants, and credentials.

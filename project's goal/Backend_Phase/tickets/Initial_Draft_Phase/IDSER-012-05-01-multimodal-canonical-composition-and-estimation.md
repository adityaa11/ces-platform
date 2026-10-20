# IDSER-012-05-01 — In-memory multimodal composition and estimation

- **State:** `planned`; executable after explicit `GO IDSER-012-05-01`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).
- **Predecessors:** approved IDSER-012-04 shared packet/composer/estimator and accepted PERC-RESET media metadata.

## Sole scope

Compose the **complete canonical SEM logical request transiently in memory** for each selected candidate batch, using accepted `NormalizedDocument V1` text/table locators and verified derived-image identity/metadata. Define deterministic slot order and independently owned versus context-only visual roles. A selected owned `visual_region` is extraction-eligible for **future SEM**; `pending_unexamined_visual` describes *unexamined meaning*, not whether IDSER can count/select its image. Context-only visuals remain context-only. Media selection/counting is based on chosen locators + accepted asset identities, not `role === pending_authorized_media` or status `ready`.

Transiently construct an ordered visual manifest with page/locator, `assetRef`, source/asset SHA-256, PNG MIME, dimensions, byte length and attachment order. Determine source specification, prompt/schema/profile identities and canonical request identity, then conservatively measure text/image input tokens, overall request bytes (including projected base64/data URL/transport JSON overhead), output reservation exactly once, full resource envelope and effective structural policy identity. The pinned initial image estimate `ceil(width/768) * ceil(height/768) * 516` is an **internal, versioned assumption**, not an Anoman quota or guaranteed billed-token count. Unknown provider image TPM remains explicitly `unknown` and is not a sole planner denial.

Use one existing shared canonical composer and effective route/media capability metadata; do not create a second estimator or transport serializer. Pure deterministic conformance fixtures may compare planned conservative framing against the *documented stable adapter serialization contract*, without network/fetch, grants, provider calls or image hydration. If adapter semantics are missing/ambiguous, fail with a precise planner/SEM contract dependency rather than invent provider payload behavior.

Return the complete in-memory candidate/request identity and **reference-based reconstruction commitments** for downstream -02/-03. **No persistence at this leaf. No durable prompt, source packet, full image manifest payload, source/media bytes, base64, provider JSON body or request serialization.**

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-01-01` | Identical selected accepted locators/media metadata produce identical transient canonical request, ordered source slots/media manifest, prompt/schema/source/request/manifest hashes; foreign/duplicate/missing/unsafe/unsupported metadata rejects. |
| `RC-01205-01-02` | Selected owned and context-only PNGs are each counted once; image-only, mixed and text-only compositions remain deterministic, with output reservation exactly once and no status/role-based attachment-accounting omission. |
| `RC-01205-01-03` | Positive dimensions and safe arithmetic are validated; image tokens, full conservative bytes including framing, total input tokens and BSS resource demand are measured purely from verified metadata and effective limits without hydration. |
| `RC-01205-01-04` | Semantic role/examination-state and attachment selection are frozen before hashing; later SEM can identify owned/context slots without changing packet identity. Unknown image TPM remains provenance, not an invented numeric limit or automatic denial. |
| `RC-01205-01-05` | Adapter route/profile/serializer policy and estimator/configuration identities are pinned for later reconstruction; pure serializer-policy conformance detects unsafe undercount or drift without invoking SEM/Anoman. |
| `RC-01205-01-06` | No persisted full logical request, prompt/source text, image bytes, provider body or copy of the transient manifest is introduced. |

## Boundaries

No batch partitioning, database writes, GHR send, BSS admission, provider fetch, SEM preflight/worker, grant, image hydration/attachment or parser/finalizer. `-05-02` consumes this exact estimator; `-05-03` stores only reference commitments and measurements; `-05-04` verifies deterministic reconstruction. CFC/HMN limited to this pure composition contract. Redacted deterministic test evidence only.

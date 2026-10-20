# IDSER-012-05-01-01 — Canonical multimodal composition

- **State:** `planned`; executable after explicit GO.
- **Parent map:** [IDSER-012-05-01](IDSER-012-05-01-multimodal-canonical-composition-and-estimation.md).

## Sole scope

Using the approved shared composer and accepted `NormalizedDocument V1` locators plus verified derived-image metadata, deterministically construct the **in-memory canonical logical source slots** for one candidate batch. Freeze source-slot order; selected owned versus context-only visual roles; locator/source ownership; attachment order; and the ordered descriptor manifest containing page/locator, `assetRef`, source/asset SHA-256, PNG MIME, dimensions and byte length. `pending_unexamined_visual` means unexamined semantics, never that a selected valid image is uncountable. Do not choose behavior from `ready` status or `pending_authorized_media` role.

Return only ephemeral composition and identity commitments for `-01-02`; do not calculate token/byte demand, serialize a provider request, persist any material, partition, or access BSS.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0101-01` | Identical accepted selected locators and metadata yield identical ordered source slots, owned/context selection, descriptor-manifest identity and request-composition identity; foreign, duplicate, missing, unsafe or unsupported metadata rejects. |
| `RC-01205-0101-02` | Text-only, image-only and mixed inputs preserve deterministic slot and attachment order; each selected owned/context PNG occurs exactly once in the manifest and is never omitted by status/role. |
| `RC-01205-0101-03` | Semantic role/examination state and attachment selection are frozen before composition identity is committed; later SEM can distinguish owned/context slots without changing that identity. |
| `RC-01205-0101-04` | No durable prompt/source text, image bytes, base64, provider body, full manifest copy or request serialization is introduced. |

## Boundaries

No estimator, route/serializer policy, BSS structural fit, persistence, GHR, provider fetch, hydration, grant, SEM worker or parser/finalizer. CFC/HMN is limited to canonical composition and descriptor-manifest meaning.

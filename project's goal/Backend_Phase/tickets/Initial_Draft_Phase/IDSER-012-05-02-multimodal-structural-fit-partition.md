# IDSER-012-05-02 — Image-aware structural-fit corpus partition

- **State:** `planned`; executable only after explicit GO and `IDSER-012-05-01` CK PASS.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Sole scope

Project verified, accepted `NormalizedDocument V1` text/table/visual locators into the existing IDSER inventory. Replace unconditional `unexamined / image_accounting_unavailable` treatment for valid PNGs with actual image-token and conservative-byte accounting from `-05-01`. For every prospective candidate batch, construct **only a transient complete logical SEM request**, compare request bytes, total input tokens, reserved output, image count/aggregate bytes/dimensions and resource demand with the effective BSS **read-only prospective structural-fit** boundary and route capability; partition deterministically.

Produce exact batch-ordered `ownedLocators`, `contextOnlyLocators`, image selection commitments, in-memory request/manifest hashes and per-batch measurements for `-05-03`. Every accepted visual receives an explicit eligible owner/batch or structurally unavailable/rejected reason. Do not duplicate images into every batch or silently treat an unsupported image as text. Unknown provider image TPM is not an automatic refusal when internally estimated demand and known structural bounds fit.

## Canonical data requirement

The terminal real-data case must come from the **existing** PERC-RESET Safara professional accepted `NormalizedDocument V1` (source SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`) in Compose project `atlas-canonical-perception`, using actual verified project-owned `postgres-data` and `atlas-data` mounts. Historical acceptance records five visuals/PNG assets. Unit mocks may test edge cases, but cannot substitute for this real source at family closure.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-02-01` | Every accepted visual is accounted for; verified fitting visuals enter inventory, and malformed/foreign/unavailable/indivisible cases carry explicit reasons instead of silent omission. |
| `RC-01205-02-02` | BSS structural-fit reads use full composed in-memory request demand, effective route media limits and output reservation; no BSS reservation/admission, duplicate estimator or whole-document image attachment. |
| `RC-01205-02-03` | Deterministic partitioning and once-only owned coverage hold for text-only, mixed, image-only, and all five real Safara visuals; each batch has stable locator/manifest identity and measurements. |
| `RC-01205-02-04` | `imageTpm: unknown` alone does not classify verified structural-fit images as `unexamined` or `blocked`. Config/route structural changes produce explicit replan or fail-closed disposition. |

## Boundaries

Planner only: no persistence (owned by -03), no provider execution, media hydration/attachment, grants, GHR sending, BSS admission or semantic result interpretation. CFC/HMN limited to inventory and structural-fit authority.

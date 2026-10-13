# SEM-CUTOVER-003 — Nonblocking stepwise source ownership packet

**Status:** `approved` · **Size:** M · **Owner:** source packet construction only · **Dependencies:** SEM-CUTOVER-002 approved, current ownership check; explicit separate `GO SEM-CUTOVER-003`.

## Exact objective

Provide a deterministic **stepwise-owned** input packet from RUN-003 `NormalizedDocument V1` in which all independent text/table/visual sources retain attributable ownership, while proposed/unresolved contextual relationships can be supplied **without requiring accepted human authorization**. Keep the existing trusted accepted-relationship builder boundary for actual contextual evidence. Do not make unchecked context a trusted reference by changing its role or merely suppressing an error.

## Code boundaries

Likely permitted on exact local-owner validation: a **new** `packages/atlas-skills/src/stepwise-source-packet.ts` (or narrowly additive sibling) plus `packages/atlas-skills/tests/stepwise-source-packet.test.ts` and explicit exports. Changing existing `semantic-source-packet.ts` or `semantic-source-input-v031.ts` requires exact HMN approval and predecessor owner-impact proof. No finalizer, worker, provider, schema authority, DB, grant or Docker edits. Do not edit approved REL-01/02 output semantics.

## Review contract

| ID | Binary PASS oracle | Negative |
|---|---|---|
| RC-003-01 | One RUN-003 zero-visual input yields deterministic eligible owned text/table slots and **valid empty** provisional relationship extension | No image is fabricated or mandatory to start |
| RC-003-02 | Image-bearing input retains each visual locator, image asset-ref/hash/role and pending status; separately identified relationship proposals retain revision lineage | No hidden `non_fact`, no guessed table-image join, no duplicated visual business assertion |
| RC-003-03 | Missing/uncertain *essential* relationship still allows independent source packet construction; dependent interpretation explicitly labeled non-trusted/provisional | Attempt to use missing essential relationship as **accepted evidence** fails `SOURCE_RELATIONSHIP_BLOCKED` |
| RC-003-04 | Exact source SHA, execution/document identity, own/context slot semantics, sorted deterministic IDs and bounded sources | Foreign/duplicate/expired relationship revision, mismatched asset, stale snapshot or source-instructions-as-system rejected |
| RC-003-05 | Old accepted-relationship packet behavior not silently weakened; only genuinely shared source integrity properties retained as successor oracles | No hidden legacy prompt fallback or rewrite of existing CK gold |

## Validation

Use deterministic snapshots of Project A (table+visual) and Project B (zero-visual), supplemented with synthetic foreign/source-embedded-instructions fixtures. Build and run **no provider request**; no image hydration yet. Verify independent owned units survive in a scenario with an unverified legend.

**Stop:** Needed change to accepted-grant/relationship-authority owner -> `OWNERSHIP_CONFLICT_BLOCKED`; visual accounting impossible -> `SCHEMA_FIT_BLOCKED`. **Terminal:** `READY_FOR_CK`, independent CK PASS to proceed.

---

## Mandatory source-coverage cases

Freeze an exclusive source-locator accounting map across Semantic V1 and the companion state. Text/table independently owned and actually supplied requires exact provider source_result coverage. Meaningful visual examined and independently owned requires a true provider-owned result; meaningful captured visual not examined/interpretable remains pending with source/asset identity and reason, never non_fact or understood. A possible title/legend qualifying a table is proposed context, not accepted reference_context or a fabricated second business assertion. Context reuse may repeat without duplicate ownership. Zero-image inputs remain valid; test image-only, unexamined image and missing-essential-legend examples. Human acceptance absent only blocks dependent **trusted** interpretation, not unrelated packet creation.

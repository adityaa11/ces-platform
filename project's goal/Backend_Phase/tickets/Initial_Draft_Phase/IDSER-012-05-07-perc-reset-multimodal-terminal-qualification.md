# IDSER-012-05-07 — PERC-RESET image-aware planner terminal qualification

- **State:** `planned`; executable only after explicit GO and CK PASS for `IDSER-012-05-01` through `-05-04`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).
- **Role:** sole family closure for **semantic batch planning and locator-only handoff parity**. `-05-05/-06` are superseded and are not prerequisites.

## Sole scope

Prove the **planner** composes complete canonical logical SEM requests **in memory** (text/table/selected images), measures full request token/byte/resource demand, partitions by BSS prospective structural policy, persists **only locator/hash/version/measurement** v3 metadata, and can reproduce the *same transient logical request* via the read-only consumer/reconstruction verifier. No outbound provider request, image hydration or attachment, execution job, SEM worker, semantic result, REL-03, parser or finalizer is a required test or PASS condition.

## Protected real Safara canonical oracle

The only real-data terminal source is the *already accepted* PERC-RESET RUN-003 `NormalizedDocument V1` for `Safara_Buyer_Business_PRD_Professional.pdf`, project `safara-professional-perception`, SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`, profile `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`. Historical accepted baseline is **12 pages / 254 text blocks / 4 tables / 5 visual regions / 5 distinct accepted PNG assets**; current local state must be freshly checked read-only.

`atlas-canonical-perception` is the Docker **Compose project**, not a single volume. Inspect actual Compose labels, containers and volumes: Compose-owned `postgres-data` holds accepted normalized document/cache and derived manifest, while `atlas-data` holds canonical image bytes. Confirm source/document/project identity, perception execution, `perceived`, non-invalidated `NormalizedDocument V1` cache, count of all five visual/accepted `image/png` manifest rows (`accepted_at IS NOT NULL`) and manifest/asset integrity with authorized **read-only** access.

**No substitution:** `docs/example` source PDF, generated golden JSON, previous mapping fixtures, mock NormalizedDocument, another Safara document or Docker project, a new Docling run, generated PNG, or a freshly populated replacement DB **cannot** satisfy terminal source verification. Missing/mismatched mount/source/accepted assets => `BLOCKED_CANONICAL_SAFARA_SOURCE`, never PASS. Unit mocks remain allowed for deterministic edge cases, not for real-data proof.

## Isolation

1. Inspect canonical source and both actual data volumes read-only; capture sanitized source and manifest identities.
2. Use a PostgreSQL-supported logical backup/snapshot and restore to a separate disposable writable volume/database. Verify snapshot source and accepted media records still match canonical. Do not mount the canonical PG data directory into another running PostgreSQL server.
3. Run only *isolated* v3 schema/persistence tests and read-only reconstruction on this copy, with the exact source metadata and BSS **prospective read-only** structural policy fixture. Do not issue live GHR, BSS admission/reservation, SEM jobs, provider calls or any canonical write.
4. Confirm pre/post canonical state is unchanged; never run `docker compose down -v`, re-perceive Safara, reset/prune/migrate canonical volumes or persist raw contents in Git.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-07-01` | Inspect actual `atlas-canonical-perception` Compose/mount IDs read-only and verify the exact Safara source SHA, accepted `NormalizedDocument V1`, RUN-003, 12/254/4/5 locator count and five accepted PNG identities; isolated snapshot matches. |
| `RC-01205-07-02` | All five real visual locators have an explicit deterministic planner disposition; at least one real Safara PNG is positively selected in a structurally fitting batch with its original accepted asset identity. If none fits, terminal CK is BLOCKED with concrete structural/source evidence, never PASS. |
| `RC-01205-07-03` | For every selected batch, in-memory *planned* and independently *read-only reconstructed* canonical logical request, ordered media manifest, source-specification/request hashes, input/output tokens, conservative total bytes and BSS resource envelope are identical. No persisted full request or corpus contents. |
| `RC-01205-07-04` | V3 plan/handoff persisted atomically using only bounded locators/identities/hashes/measurements, with replay/cancellation and reference-only GHR validation; operational v1/v2 inputs and foreign/mixed/corrupt media references reject; text/table planning still works through v3. |
| `RC-01205-07-05` | Changing source, selected locator/media order, accepted image identity, BSS structural limits, serializer/estimator/configuration identity or immutable plan/handoff version causes deterministic rejection/replan before any SEM/provider effects. |
| `RC-01205-07-06` | Canonical PostgreSQL/image volumes remain unchanged, only isolated test DB receives writes, zero live GHR/BSS admission/SEM/provider/REL/finalizer effects, and no alternative corpus or new perception work was used. |
| `RC-01205-07-07` | A precise SEM-CUTOVER handoff record identifies the v3 reconstruction API/inputs, pinned composition and media hashes, all selected-image metadata commitments and the unimplemented SEM-only execution/semantic-result obligations. No SEM readiness is claimed. |

## Evidence, hard stop, workflow

Record reviewed commit, source hash, current Compose/container/volume identities, accepted source/asset counts and fingerprints, version and route/estimator profiles, in-memory sizing, partition trace, v3 reference/commitment hashes, read-only reconstructed parity, negative tests and canonical no-change checks. Exclude source text, table values, full prompt/schema bodies, media bytes, base64, serialized requests, grants, credentials and database dumps.

This is *composition-only terminal proof*. Return any defect to its owning **active IDSER child**; terminal CFC may fix only harness/evidence, not rewrite predecessor contracts. An incompatible accepted input, BSS policy or SEM request-composition identity requires precise HMN before changing its owner. Family CK PASS closes **image-aware semantic batch planning and reproducible locator-only handoff**, not SEM multimodal execution or end-to-end product extraction.

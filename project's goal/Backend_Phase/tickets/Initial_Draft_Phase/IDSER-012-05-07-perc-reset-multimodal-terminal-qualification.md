# IDSER-012-05-07 — PERC-RESET multimodal terminal qualification

- **State:** `planned`; executable leaf only after explicit GO and CK `PASS` for IDSER-012-05-01 through `-06`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).
- **Role:** sole family closure; composition-only, no predecessor repair.

## Scope

Using the accepted PERC-RESET fixture's actual persisted five-visual metadata and isolated/offline qualification boundary, prove the already approved surfaces compose: inventory, deterministic partition/disposition, v3 persistence, server-authorized reconstruction, fresh scoped hydration/attachment through fake multipart transport, and synthetic response parsing/finalization/replay. Preserve text/table behavior through v3 and retain authorization, BSS, media-grant, cancellation, and replay protections. Prove that historical v1/v2 plans cannot enter operational issuance, reconstruction, or execution; do not require their old runtime tests to keep passing.

## Mandatory canonical-volume provenance and protected qualification

The real-data oracle is the *existing accepted* `NormalizedDocument V1` for `Safara_Buyer_Business_PRD_Professional.pdf`, SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`, project `safara-professional-perception`, RUN-003 `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`: historical baseline **12 pages, 254 text blocks, 4 tables, 5 visual regions and 5 accepted verified PNG derived assets**.

Before any real-data test, inspect actual `docker compose -p atlas-canonical-perception -f docker-compose.yml ps` and container mounts in the selected Docker context. **`atlas-canonical-perception` is the Compose project, not the Docker volume name.** Verify the actual Compose-owned `postgres-data:/var/lib/postgresql` and `atlas-data:/workspace/.atlas-data` mounts using Docker inspection; read the *existing* canonical PostgreSQL records read-only. Verify exact source identity, `v1` NormalizedDocument, completed RUN-003, `perceived` lifecycle, non-invalidated cache, all locator counts, five `accepted_at IS NOT NULL` distinct PNG manifest rows, and each actual asset hash/byte count/dimensions via authorized read-only store access.

Create a supported **logical PostgreSQL copy** in a distinct disposable writable volume/database, and safely expose verified canonical PNG bytes through an authorized isolated asset-read boundary. Only the isolated copy may receive v3 schema changes/writes, structural-fit and SEM fake-transport execution. Never concurrently mount the canonical PostgreSQL data directory into another server, change canonical source/asset volumes, execute new perception, `docker compose down -v`, or call a live provider. Read-only verification must precede all qualification and must show canonical no-mutation/zero-live-effects afterward.

No `docs/example` PDF, synthetic generated NormalizedDocument, repository golden JSON, mapping fixture, alternative Safara PDF, another Compose project's volume, newly created empty DB or repeated Docling conversion may substitute for this source. Such fixtures may supplement pure unit negatives but never satisfy the final real-data CK oracle. Missing or mismatched canonical volume, accepted cache, 5 PNG assets, or unsafe snapshot -> `BLOCKED_CANONICAL_SAFARA_SOURCE`, **not PASS**.

On the isolated *real-source snapshot*, exercise v3 IDSER partition/persistence, GHR reference-only receiver, reconstruction, **ordinary SEM worker** under fake provider transport, visual semantic parser/finalizer/replay, source coverage, and adapter real JSON byte comparison. Prove negative route/profile/image-capability/estimator/config drift before dispatch. Five visual locators must all be explicitly accounted for; never let a whole-document request silently attach assets outside a selected batch.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-07-01` | Actual `atlas-canonical-perception` Compose-owned PostgreSQL/asset mounts and the exact existing Safara professional source SHA, RUN-003 accepted `NormalizedDocument V1`, `perceived` state, 12/254/4/5 counts and 5 verified accepted PNG assets are freshly proven read-only; an isolated logical copy retains their identities. No alternate source qualifies. |
| `RC-01205-07-02` | The **ordinary SEM worker** executes selected v3 batches on the isolated real Safara snapshot under fake transport, redeeming and attaching only planned original images in order with correct hash/bytes/dimensions; planned = reconstructed = dispatched logical request, except runtime authority/deadline/byte hydration. |
| `RC-01205-07-03` | Image-only candidate, image-only `non_fact`, and mixed visual results pass parser through replay without fabricated wording; text/table behavior through v3 and legacy-version rejection regressions remain passing. |
| `RC-01205-07-04` | Every amended family RC and closure-matrix boundary has child evidence plus composition observation; v1/v2 old writers, GHR receiver acceptance, reconstruction, mixed-version handoffs, and SEM execution are explicitly rejected. Legacy inventory/in-flight work has authorized disposition without rewriting immutable contents. Missing accepted media/cache remains an unresolved prerequisite, never replaced with invented identities. |

| `RC-01205-07-05` | Fake Anoman serializer proves `actualSerializedRequestBytes <= plannedConservativeRequestBytes` per batch; changed route/adapter/image capability/estimator/configuration or foreign/missing asset rejects before outbound effects. |
| `RC-01205-07-06` | Canonical source and both Docker data volumes remain unchanged and there are zero live provider, GHR, BSS, re-perception or semantic runtime effects; no mock/repository/newly converted source was substituted. |

## Evidence, hard stop, and workflow

Record commit, record versions, redacted identities/hashes, policy/configuration identities, measurements, BSS structural outcome, reconstruction comparisons, scoped hydration checks, semantic/replay results, and five-visual coverage. Exclude raw corpus, bytes, base64, provider bodies, grants, credentials, and source content.

This leaf may not repair child internals. A finding routes to the owning child and returns this terminal qualification to `planned`; CFC here can repair only the terminal harness/evidence locator, never an upstream contract. HMN may resolve only a precise cross-child incompatibility, not waive real-data evidence or authorize production/live-provider work. CK `PASS` is family completion only after all rows pass.

# IDSER-012-01-03-02: Atlas derived-asset handoff, replay, and authorized resolution

- **State:** `approved` following CK `PASS` for reviewed commit `7d842ad`.
- **Review batch:** `IDSER-BATCH-12-01-03-02`.
- **Dependencies:** `IDSER-012-01-03-01` CK `PASS`.
- **Parent:** [IDSER-012-01-03](IDSER-012-01-03-docling-evidence-preservation-and-semantic-handoff.md)

## Planning authority

- **2026-10-09, human planning authorization:** This ticket may use only the
  existing Atlas-owned persistent local filesystem infrastructure and Compose
  storage volume to persist and qualify derived images. The implementation may
  introduce a narrow derived-asset storage abstraction and `derived/`
  namespace, separate from immutable `documents/` keys. It must preserve the
  existing source-key validator, Atlas storage ownership, and authorization
  boundaries. Agents Bridge receives no filesystem access, database privilege,
  storage credential, or general storage grant. The abstraction must preserve
  future S3/R2-compatible portability, but this ticket must not add S3, R2,
  MinIO, another storage service, or another infrastructure component, and
  must not represent local qualification as cloud-storage readiness.
- This resolves `SEC-GAP-012010302-PRODUCTION-BACKEND` only for this ticket's
  local implementation and qualification scope. The production
  S3-compatible adapter remains deferred to separately authorized work.
- The preceding local-storage authorization intentionally left
  `SEC-GAP-012010302-RETENTION` unresolved; the later bounded decision below
  supplies that policy without altering any existing Review Contract row.
- **2026-10-09, human planning authorization — derived-evidence retention:**
  `SEC-GAP-012010302-RETENTION` is resolved for this bounded ticket as follows.
  Accepted derived assets are immutable and remain retrievable while any
  retained current or historical accepted evidence references them. Cache
  validity and evidence retention are separate lifecycle concerns: cache
  invalidation, profile changes, later perception runs, and newer accepted
  document versions must not automatically delete historical evidence bytes.
  Historical references remain resolvable only under the original document's
  authorization scope.
- An unaccepted derived asset may be reused only when source, profile, locator,
  content hash, and every required identity binding match. It is eligible for
  cleanup no sooner than seven days after becoming an orphan, and only after
  authoritative verification that no accepted manifest, active execution,
  pending replay, retry, staging record, or other recovery dependency still
  references it. Cleanup must remain safe under concurrent execution and
  replay. If reachability cannot be reliably established, retain the bytes.
  The seven-day period is a minimum eligibility boundary, not authority to
  delete referenced evidence or to add a background cleanup service.
- An accepted reference must never knowingly name missing or unverified bytes;
  availability metadata must reflect storage-integrity and lifecycle state.
  Silent deletion, overwrite, and historical-reference invalidation are
  forbidden. General project deletion, user-data erasure, organization-wide
  expiration, and storage-provider lifecycle rules remain deferred. This
  authorization preserves all existing Review Contract rows, including
  `RC-012010302-06`.

## Outcome

Establish the Atlas-controlled derived-visual contract so an accepted `NormalizedDocument v1` never holds a dangling `assetRef`. An authorized offline consumer can resolve verified evidence bytes by document scope. The original PDF remains the sole perception source; accepted work ends at `perceived`.

## Owned behavior

- Consume `-03-01`'s bounded visual-capture descriptors without re-conversion or a competing picture mapper. Issue `assetRef` only after verified durable Atlas persistence. Enable normal staged activation only after complete end-to-end qualification and CK PASS.
- Define a narrow Atlas-owned derived-asset storage interface/`derived/` namespace alongside immutable `documents/` keys. Preserve the existing source-key validator and production S3-compatible portability; Bridge receives no document-store mount, database privilege, storage path, or general storage grant.
- Validate bounded image transfer and decoded media type, actual bytes, dimensions, size, source/profile/page/locator identity, and SHA-256. Persist durable bytes first; read back and verify them; create an idempotent manifest/binding with media type, length, hash, and safe stable reference. Conflicting bytes for one identity fail closed.
- Stage replayable normalized JSON only after every referenced asset is durable and verified. At acceptance, revalidate scope, manifest and integrity, then atomically commit cache, derived-asset metadata, execution completion, and member `perceived` state under current Atlas transaction semantics.
- Specify and test idempotent state transitions for write-before-stage crash, stage-before-accept crash, lost acknowledgement, duplicate delivery, conflicting bytes, cancelled/partial transfer, invalid grant, Atlas/DB outage, integrity-readback failure, and bounded orphan reuse/cleanup. Do not consume another perception permit for asset reads.
- Provide an authenticated, document-scoped, read-only resolver for later semantic context/Sources reads that verifies caller scope, manifest, existence, hash, type, and size without leaking absolute paths. No UI rendering is owned.
- Prevent derived evidence from becoming an `atlas.document`, extraction-bundle member, source grant, perception execution, or pg-boss perception job under read, replay, cache invalidation, or semantic-like access.

## Forbidden behavior

No direct Bridge write to Atlas storage, PostgreSQL image payload, base64/binary in replay/job/log metadata, public/path-based fetch, new blob service/broker, source-store key weakening, source selection/UI work, semantic call/job/aggregation, or unapproved deletion of retained historical evidence.

## Review Contract

| Row | Required behavior | PASS iff |
| --- | --- | --- |
| RC-012010302-01 / RC-04 | Assets are durable and attributable. | Five decoded RUN-003 images have verified type/dimensions/size/hash, source/profile/page/locator binding, save/read/restart evidence, and no dangling accepted pointer. |
| RC-012010302-02 / RC-06 | Scope/authorization survives every boundary. | Foreign source/caller, expired grant, malformed reference, cross-document lookup, tamper, path traversal, oversize and unsupported media fail closed without leakage or a new job. |
| RC-012010302-03 / RC-08 | Offline handoff is deterministic. | An authorized consumer resolves accepted normalized text/tables and verified image bytes by valid locators, with no semantic provider/call/job. |
| RC-012010302-04 / RC-09 | Derived evidence cannot recurse. | Read/replay/UI-like/cache-invalidation/semantic-like fixtures create no original document/member/grant/execution/perception job from a derived asset. |
| RC-012010302-05 / RC-11 | Logical handoff is replay safe. | Each required crash/ack/duplicate/conflict/partial/outage case either converges idempotently or fails without accepted dangling reference or duplicate logical effect. |
| RC-012010302-06 / RC-13 | Historical evidence is explicit. | Cache/profile invalidation and later-run fixtures retain or delete bytes only under a documented authorized retention boundary; metadata never falsely asserts availability. |
| RC-012010302-07 / RC-14 | Resolver is bounded. | It verifies existence/hash/type/size/scope and rejects nonexistent, tampered, oversized, foreign, unsafe, and unsupported requests without paths or broad grants. |

| RC-012010302-08 | End-to-end production activation gate. | Incomplete derived persistence cannot produce a normal staged accepted result; fully qualified image-enabled admission is activated only with durable verified assets and zero early semantic work. |

## Qualification matrix

Use isolated Compose volumes and database only. Demonstrate real authenticated source-PDF → exact qualified RUN-003 capture → durable visual manifest → accepted V1 → `perceived`, alongside the storage, replay, admission, and two-concurrent/held-third controls. Assert zero semantic executions/jobs/providers. A storage, payload, or performance bound failure stops work for explicit human qualification rather than producing PASS.

## Security Refactor Readiness

**Status:** `applicable`.

- `TRUST-012010302-TRANSFER` covers bounded untrusted binary transfer into Atlas-owned persistence; `TRUST-012010302-ACCEPT` covers asset manifest verification before lifecycle acceptance; `TRUST-012010302-RESOLVE` covers scoped retrieval.
- `ASSET-012010302-BYTES`, `ASSET-012010302-MANIFEST`, and `ASSET-012010302-GRANT` are sensitive; `IDENTITY-012010302-ASSET` binds document/source hash/profile/execution/page/locator/ref/hash/type/size.
- `SEAM-012010302-STORE`, `SEAM-012010302-MANIFEST`, `SEAM-012010302-ORPHAN`, and `SEAM-012010302-RESOLVER` remain separately attachable for future policy.
- `COUPLING-012010302-BRIDGE-WRITE`, `COUPLING-012010302-DB-BLOB`, `COUPLING-012010302-REPLAY-BINARY`, `COUPLING-012010302-PATH-API`, and `COUPLING-012010302-RECURSION` are forbidden.
- `SEC-GAP-012010302-RETENTION` and `SEC-GAP-012010302-PRODUCTION-BACKEND` require human authority; do not resolve by assumption.
- `REV-READY-012010302-01` verifies durable/idempotent transfer and acceptance with crash/conflict tests; `REV-READY-012010302-02` verifies resolver authorization/integrity negatives; `REV-READY-012010302-03` verifies no recursion or semantic effects.

## CK handoff

Supply the state machine/failure ledger, isolated command and volume/DB identity, byte/hash/readback observations, resolver/admission negatives, effective limits, and zero-semantic evidence. Reach `READY_FOR_CK` only after all rows pass; no downstream semantic execution follows from this ticket alone.

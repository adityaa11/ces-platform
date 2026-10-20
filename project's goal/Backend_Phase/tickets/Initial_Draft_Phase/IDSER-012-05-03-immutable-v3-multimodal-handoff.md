# IDSER-012-05-03 — Locator-only immutable v3 plan/handoff

- **State:** `planned`; executable only after explicit GO and `IDSER-012-05-01` / `-05-02` CK PASS.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Sole scope

Introduce **one active operational** `ImmutableSemanticCorpusPlan/v3` with `PlannedSemanticCorpusHandoff/v3` in the existing immutable Atlas plan/handoff tables and reference-only GHR receiver. This is an explicit cutover from operational plan/handoff v1/v2; historical rows/hashes remain immutable but are not runnable or automatically translated. Before cutover, read-only inventory old plans/unfinished work; obtain authorized retirement/cancel/replan disposition when necessary.

Persist **only minimal durable reconstruction references and commitments**:
- Plan/batch IDs, source snapshot identity (`project/workspace/bundle/document`, source SHA, accepted normalized document/perception execution reference and fingerprint).
- Ordered `ownedLocators` and `contextOnlyLocators` (including selected visual locators), with source ownership and deterministic attachment ordering recoverable from canonical composition rules.
- A resolvable accepted-media locator/reference *where necessary*, and a canonical **ordered media-manifest hash** to commit asset identity/order/integrity; accepted manifest supplies asset SHA, MIME, dimensions and byte length at reconstruction. Do not store a duplicate full media manifest/payload if independently reconstructible from accepted records.
- Frozen prompt/schema/composer/route-capability/adapter-serialization/estimator/configuration identities and hashes, logical-request hash, source-specification hash, conservative byte and token measurements, output reservation, resource envelope, BSS prospective structural provenance and plan ancestry/cancellation identity.

**Never persist** the materialized complete request, compiled prompt/schema payload, source specification/body, text/table contents, media bytes/base64, full adapter JSON, provider response, grants, credentials or a second corpus copy. Re-read accepted immutable sources when SEM later reconstructs.

No second table, queue, request-body store, media cache or GHR path. GHR message remains reference-only and validates **v3 plan and v3 handoff** against immutable membership; no dispatch in IDSER.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-03-01` | Strict v3 record schema stores only bounded scope/locator/identity/hash/measurement commitments; v3 parent-child, manifest/request identities, ownership/coverage and estimates are internally consistent, unknown fields/duplicates/foreign data rejected. |
| `RC-01205-03-02` | Atomic persistence, rollback, idempotent replay, cancellation/ancestry and reference-only GHR validation operate in the existing tables. DB inspection proves no complete request, prompt, source/media bytes, base64 or provider body persisted. |
| `RC-01205-03-03` | Operational plan/handoff v1/v2 writer/parser/GHR alternatives and implicit v1 defaults are retired; v1/v2/mixed-version records fail at active boundaries without rewriting immutable historical rows. Text/table planning persists through v3. |
| `RC-01205-03-04` | Every persisted locator/metadata reference is sufficient for `-05-04` to rederive exact transient request/manifest identity and resource measurements without needing any serialized request from DB. |

## Canonical-data/retirement constraints

Use a protected read-only inspection of existing `atlas-canonical-perception` accepted Safara professional `NormalizedDocument V1` (source SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`). Test v3 writes only against a PostgreSQL-supported, isolated logical copy with original accepted media identities. Do not mutate or mount the canonical live PG data directory elsewhere. For nonempty old v1/v2 in-flight inventory require explicit operator/HMN disposition; no silent conversion.

## Boundaries

No runtime SEM resolver adoption, browser-session delegation, execution grant, image hydration, provider transport, parser, finalizer, new production GHR delivery or BSS admission. CFC/HMN confined to v3 locator persistence and active-version retirement.

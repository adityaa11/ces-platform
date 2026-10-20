# IDSER-012-05-03-01 — Immutable v3 locator persistence

- **State:** `planned`; executable only after explicit GO and `IDSER-012-05-02-02` CK PASS.
- **Parent map:** [IDSER-012-05-03](IDSER-012-05-03-immutable-v3-multimodal-handoff.md).

## Sole scope

Add `ImmutableSemanticCorpusPlan/v3` and `PlannedSemanticCorpusHandoff/v3` records in the existing immutable Atlas plan/handoff tables. Atomically persist only source snapshot identity, ordered owned/context locators, necessary resolvable accepted-media references, manifest/request/source hashes, pinned prompt/schema/composer/route/adapter/estimator/configuration identities, conservative measurements, output reservation, resource envelope, BSS prospective provenance and plan ancestry/cancellation identity. Do not persist a full request, prompt/schema/source body, text/table content, media bytes/base64, adapter JSON, provider response, grants, credentials or duplicated manifest/payload.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0301-01` | Strict v3 schemas reject unknown, duplicate and foreign data; parent/child, locator ownership/coverage, manifest/request identities and estimates are internally consistent. |
| `RC-01205-0301-02` | Persistence is atomic, rollback-safe and idempotent; cancellation/ancestry identity is retained without dispatching work. |
| `RC-01205-0301-03` | DB inspection proves no complete request, prompt, source/media bytes, base64, provider body or duplicate full manifest is persisted. |
| `RC-01205-0301-04` | The persisted commitments are sufficient for later read-only reconstruction to rederive the transient request/manifest identity and measurements. |

## Boundaries

No v1/v2 retirement, GHR validation, runtime resolver, provider work, hydration, grant, transport or BSS admission. Test writes use only an isolated PostgreSQL-supported logical copy with original accepted media identities. CFC/HMN is limited to v3 persistence.

# BSS-V2-007: Provider execution usage and provenance ledger

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-07`
- **Dependencies:** BSS-V2-004-03 at CK `PASS` (future external semantic-extraction route qualification)
- **References:** V3 §§19–21, 27–28, 33; Baseline V2 §§24, 32–33, 36, 44–45, 48; implementation context §§11, 25, 29–30

## Outcome and current seam

Persist secret-safe Bridge operational telemetry for qualified external semantic reasoning paths, with an interactive execution seam where a qualified external route exists. Local Docling records processor provenance/runtime separately and does not require provider economics. Current normalized provider usage is in-memory provenance and not a durable, route-attributable operational ledger.

## Scope and forbidden work

Create Bridge-owned usage persistence and integration for external execution ID, capability, work class, route/provider/model, qualification/quota identities, request/retry counts, reported tokens/pages, queue delay, provider latency/total duration, final normalized status/failure, and safe project/workspace/bundle/document references when supplied. Do not apply provider ledger fields to local Docling. Do not persist raw input/output, source grants, credentials, or provider bodies; do not calculate costs, implement entitlement/billing, or grant Bridge write access to `atlas.*` trusted tables.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-007-01 | Each integrated external-provider execution records required route, qualification, quota, work-class, status, timing, retry, and reported usage provenance. | Local integration with deterministic adapter. **PASS iff** a completed/failed execution is queryable by execution ID with all available normalized fields; local Docling remains on its separate processor-provenance seam. | external semantic worker |
| RC-BSSV2-007-02 | Ledger rows contain metrics/provenance only and exclude prohibited content/secrets. | Database/log/snapshot inspection test. **PASS iff** raw bytes, PRD/prompt/body, key/header, and source grant are absent. | adapter redaction |
| RC-BSSV2-007-03 | Ledger persistence is Bridge-owned operational state and failure cannot advance Atlas truth. | Migration/role-denial and failure-path tests. **PASS iff** `agents_bridge` writes only `bridge.*`, lacks trusted Atlas writes, and telemetry failure yields an explicit safe execution outcome. | PostgreSQL role checks |
| RC-BSSV2-007-04 | Existing semantic/perception envelopes preserve their public normalized technical failure behavior. | Focused handoff tests. **PASS iff** fine-grained ledger details do not require frozen IDSER contract changes. | semantic/perception replay |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-USAGE-DB` — Bridge operational state is separate from Atlas trusted/domain state.
- **Trust transition:** `SEAM-BSSV2-USAGE-REDACTION` — source-minimized telemetry records only identifiers, counts, timing, status, and cost references.
- **Prohibited coupling:** `COUPLING-BSSV2-USAGE-CONTENT` — observability cannot become a duplicate document/prompt store.
- **Unresolved policy:** `SEC-GAP-BSSV2-007-RETENTION` — final telemetry retention is future policy.
- **Review bindings:** `REV-READY-BSSV2-007-01` verifies row content redaction; `REV-READY-BSSV2-007-02` verifies database role restriction; `REV-READY-BSSV2-007-03` verifies safe behavior on ledger failure.

## Validation, Docker, and handoff

Run migration, permission-denial, usage-row, redaction, failure-path, and affected semantic/perception replay tests against Compose PostgreSQL; inspect scoped rows only. Hard stop: commercial aggregation/customer policy is not ledger scope. On PASS, BSS-V2-008 owns effective-dated prices and shadow COGS.

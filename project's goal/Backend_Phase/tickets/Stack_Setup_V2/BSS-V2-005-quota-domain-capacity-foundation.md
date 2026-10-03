# BSS-V2-005: Quota-domain and capacity-profile foundation

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-05`
- **Dependencies:** BSS-V2-004-03 at CK `PASS` (future external semantic-extraction route qualification)
- **References:** V3 §§15–18, 24, 27, 33; Baseline V2 §§19–23, 32, 48; implementation context §§11, 23–24, 29–30

## Outcome and current seam

Represent shared upstream external-provider capacity with secret-free quota domains and route capacity profiles. Local Docling capacity is a distinct local runtime/resource concern and is not a quota domain.

## Scope and forbidden work

Create Bridge-owned configuration/operational model for external quota-domain identity, non-secret provider/project/account alias, source/effective timestamp, known request/token/page/concurrency limits, route association, and bounded admission primitive. Do not attach this model to local processor routes. Normalize zero entitlement separately from transient quota exhaustion. Unknown limits remain explicit unknowns or conservative profile settings. Do not set customer allowances, product plans, worker priority, usage ledger, cost, privacy, fallback, or fixed production numeric limits.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-005-01 | A quota domain represents an upstream shared pool using an alias with no credential material. | Config/schema/redaction tests. **PASS iff** routes reference a valid non-secret domain and aliases cannot expose keys. | Bridge config |
| RC-BSSV2-005-02 | Capacity profiles express known or explicitly unknown request/token/page/concurrency limits with source/effective metadata. | Profile validation tests. **PASS iff** invalid values/references fail and no invented provider limits are silently assumed. | route profile |
| RC-BSSV2-005-03 | Local admission keys shared capacity by quota domain rather than API-key count or model ID alone. | Deterministic multi-route/key tests. **PASS iff** keys/models in one configured domain contend for the same bounded primitive. | worker config |
| RC-BSSV2-005-04 | Known zero entitlement is a structural unavailable outcome; transient quota exhaustion remains separately classified. | Error/admission tests. **PASS iff** zero entitlement causes no retry scheduling and transient exhaustion preserves a distinct cooldown-eligible code. | BSS-008 error mapping |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-005-OPERATIONAL` — provider capacity is Bridge operational authority, not Atlas entitlement.
- **Seam:** `SEAM-BSSV2-CAPACITY-OPERATIONAL` — profile/domain data supports later policy without semantic coupling.
- **Prohibited coupling:** `COUPLING-BSSV2-CAPACITY-KEY` — keys/models are never presumed independent capacity pools.
- **Unresolved policy:** `SEC-GAP-BSSV2-005-LIMIT-SOURCE` — unverified provider limits remain unknown/conservative.
- **Review bindings:** `REV-READY-BSSV2-005-01` verifies alias secret exclusion; `REV-READY-BSSV2-005-02` verifies capacity cannot become customer-plan authority.

## Validation, Docker, and handoff

Run deterministic profile, domain-sharing, classification, and config-redaction tests with affected Bridge typechecks. If Bridge schema/migrations are needed, prove `agents_bridge` owns only `bridge.*`; do not add trusted Atlas privileges. Hard stop: any customer allowance decision returns to product planning. On PASS, BSS-V2-006 owns integration into execution admission.

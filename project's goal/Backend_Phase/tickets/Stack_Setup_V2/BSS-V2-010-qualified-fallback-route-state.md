# BSS-V2-010: Qualified fallback and route-state foundation

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-10`
- **Dependencies:** BSS-V2-009 at CK `PASS`
- **References:** V3 §§5–6, 22–24, 27, 33; Baseline V2 §§11–12, 23, 29–31, 38, 48; implementation context §§11, 27, 29–30

## Outcome and current seam

Allow route selection to fail over only to an explicitly qualified, compatible route. The active development profile need not have a second real provider; deterministic qualified test routes can prove policy. Blocked Mistral is not live fallback.

## Scope and forbidden work

Define primary/fallback relations, enabled/disabled/blocked state, bounded health/cooldown state where necessary, and eligible failure conditions. Enforce same capability, qualification version/validity, privacy compatibility, input/output contract compatibility, and actual-route provenance. Do not add an opaque router, OpenRouter/gateway, a provider, automatic use of any model, production multi-provider activation, customer policy, new queue, or semantic change.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-010-01 | Fallback relation is explicit and targets an enabled, currently qualified same-capability route. | Route-state matrix tests. **PASS iff** absent, disabled, blocked, expired, or capability-mismatched candidates cannot be selected. | route resolver |
| RC-BSSV2-010-02 | Privacy, schema/bounded input-output, and qualification compatibility are rechecked for fallback. | Deterministic incompatibility tests. **PASS iff** any incompatible candidate fails closed rather than executing. | privacy preflight |
| RC-BSSV2-010-03 | Eligible transient failure/cooldown can select a qualified fallback; zero entitlement and post-stream events follow their separate safe behavior. | Adapter double/integration tests. **PASS iff** only configured eligible conditions fall back, zero entitlement does not loop, and emitted streams do not transparently replay. | admission; SSE |
| RC-BSSV2-010-04 | Actual selected route and fallback reason are retained in normalized provenance/usage. | Ledger integration test. **PASS iff** execution record identifies actual route and selection cause without source/secret content. | BSS-V2-007 ledger |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-010-QUALIFICATION` — qualification is capability-specific and required for active use.
- **Trust transition:** `SEAM-BSSV2-FALLBACK-QUALIFIED` — only prequalified compatible routes may execute.
- **Prohibited coupling:** `COUPLING-BSSV2-AUTO-ROUTER` — truth-producing work cannot escape to arbitrary/opaque routing; blocked Mistral is not fallback.
- **Unresolved policy:** `SEC-GAP-BSSV2-010-SECOND-LIVE-ROUTE` — a future provider must be separately qualified.
- **Review bindings:** `REV-READY-BSSV2-010-01` verifies compatibility gates; `REV-READY-BSSV2-010-02` verifies no arbitrary selection; `REV-READY-BSSV2-010-03` verifies provenance.

## Validation, Docker, and handoff

Run deterministic route-state, compatibility, cooldown/zero-entitlement, no-post-stream-retry, and ledger-provenance tests; use only local doubles for a second route. Hard stop: a new provider/gateway selection needs architecture authorization and a new qualification ticket. On PASS, BSS-V2-011 consumes all predecessor PASS artifacts.

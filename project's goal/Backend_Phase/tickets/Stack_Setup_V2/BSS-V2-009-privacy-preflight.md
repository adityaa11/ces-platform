# BSS-V2-009: Privacy-class execution preflight

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-09`
- **Dependencies:** BSS-V2-006 and BSS-V2-008 at CK `PASS`
- **References:** V3 §§18, 22, 27, 31–33; Baseline V2 §§22, 28–30, 40–41, 48; implementation context §§11, 26, 29–30

## Outcome and current seam

Create a provider-neutral privacy requirement seam and enforce route compatibility before any provider transport. Existing adapter-specific ZDR configuration cannot represent a route-qualified privacy contract across providers.

## Scope and forbidden work

Freeze a shared conceptual class/ordering for `EVALUATION`, `NO_TRAINING`, and `ZDR_REQUIRED`; attach qualified external route capability and a caller/policy-provided required class; compare before adapter request. A future external semantic development route may be `EVALUATION` only for approved non-sensitive use. Diagnostics are secret-safe. Do not invent legal/compliance, residency, enterprise administration, consent UI, plan design, or final workspace-policy source; do not transmit and then check privacy.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-009-01 | Privacy requirement and route capability use one provider-neutral ordered contract. | Contract/route validation tests. **PASS iff** unknown or incoherent privacy class/mapping is rejected at configuration or request boundary. | route resolver |
| RC-BSSV2-009-02 | Incompatible required/route classes fail before external adapter transport or source transmission. | Spy-transport negative tests. **PASS iff** mismatch has zero outbound request and returns a stable policy failure; local Docling remains governed by BSS-009 authorization rather than provider privacy classes. | external semantic paths; future external perception |
| RC-BSSV2-009-03 | No adapter or fallback caller can silently lower the requirement to make a call succeed. | Downgrade-attempt tests. **PASS iff** chosen route and recorded provenance preserve the original requirement. | admission/usage integration |
| RC-BSSV2-009-04 | Evaluation routes are visibly constrained to the declared development qualification and do not imply stronger terms. | Profile/status and secret-safe diagnostic tests. **PASS iff** runtime status identifies class without claiming NO_TRAINING/ZDR evidence not qualified. | Compose readiness |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-009-ATLAS-REQUIREMENT` — later Atlas policy supplies a requirement; `BOUNDARY-BSSV2-009-BRIDGE-ROUTE` — Bridge enforces route compatibility.
- **Trust transition:** `SEAM-BSSV2-PRIVACY-PREFLIGHT` — compatibility is decided before network transmission.
- **Prohibited coupling:** `COUPLING-BSSV2-PRIVACY-DOWNGRADE` — no provider, route, or retry/fallback may reduce required privacy.
- **Unresolved policy:** `SEC-GAP-BSSV2-009-LEGAL` — final legal, residency, retention, and tenant mapping policy is deferred.
- **Review bindings:** `REV-READY-BSSV2-009-01` verifies zero-network mismatch proof; `REV-READY-BSSV2-009-02` verifies downgrade resistance; `REV-READY-BSSV2-009-03` verifies evaluation does not imply production guarantees.

## Validation, Docker, and handoff

Run privacy contract/order, route validation, zero-network negative, downgrade, provenance, and affected adapter/admission/ledger tests. Rebuild/recreate affected Bridge services and inspect redacted route status if configuration changes. Hard stop: missing final legal policy is not a reason to invent a stronger class. On PASS, BSS-V2-010 owns compatible fallback selection.

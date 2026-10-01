# BSS-V2-004: Gemini live route qualification and development activation

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04`
- **Dependencies:** BSS-V2-003 at CK `PASS`
- **References:** V3 §§5–6, 8–9, 21, 27, 31; Baseline V2 §§12–14, 31, 36–38; implementation context §§11, 21, 28–29

## Outcome and current seam

Prove real Gemini capability-specific routes with an opt-in, secret-safe live harness; activate only the recorded qualified route identities in the development profile. Authentication, model listing, or a mock never qualify a route.

## Scope and forbidden work

Use a real server-side credential and synthetic/public/non-confidential material to test minimal inference, non-zero usable entitlement, pinned configured identity, structured output with actual Atlas schema and complete validation, PDF perception/`NormalizedDocument` compatibility, representative extraction/reconciliation, normalized usage/latency, and 429 classification. Include streaming/cancellation only if the activated chat route exists. Record a qualification version and redacted evidence. Do not implement multi-user capacity, ledger, cost, privacy policy beyond evaluation evidence, fallback, product entitlement, or a replacement IDSER live-acceptance set.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-004-01 | Each active capability route has a pinned provider/model/processor ID, qualification version, and real minimal-inference evidence. | Opt-in live harness and secret-safe qualification record. **PASS iff** real inference succeeds with non-zero entitlement; listing/authentication alone cannot close the row. | route/profile readiness |
| RC-BSSV2-004-02 | Structured extraction/reconciliation output passes complete current Atlas v1 validation. | Live synthetic representative requests plus parser evidence. **PASS iff** both requested capabilities pass actual validation, not merely provider constrained output. | semantic worker/handoff |
| RC-BSSV2-004-03 | PDF perception returns a result that normalizes to `NormalizedDocument v1` without invented fields. | Live synthetic PDF result and normalization evidence. **PASS iff** source-grant/normalization contract remains intact. | BSS-009 perception |
| RC-BSSV2-004-04 | Observed usage, latency, 429/rate-limit behavior, and evaluation privacy/account evidence are recorded without a secret or source leak. | Redacted harness output/evidence review. **PASS iff** required observations are classified and all prohibited content is absent. | adapter redaction |
| RC-BSSV2-004-05 | Only passed capability routes are enabled in the development profile; failures remain inactive/blocked. | Config/profile/readiness inspection. **PASS iff** no failed or unqualified route becomes active and Mistral remains inactive. | Compose readiness |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-004-SECRET` — credential remains Bridge-only; `BOUNDARY-BSSV2-004-SOURCE` — qualification uses only approved non-confidential input.
- **Trust transition:** `SEAM-BSSV2-004-LIVE-EVIDENCE` — qualification record identifies a route without recording sensitive provider or source material.
- **Prohibited coupling:** `COUPLING-BSSV2-004-MOCK-QUALIFICATION` — deterministic doubles cannot stand in for live entitlement.
- **Unresolved policy:** `SEC-GAP-BSSV2-004-PRODUCTION-PRIVACY` — EVALUATION proof is not NO_TRAINING/ZDR approval.
- **Review bindings:** `REV-READY-BSSV2-004-01` verifies secret-safe live evidence; `REV-READY-BSSV2-004-02` verifies only approved synthetic/public material; `REV-READY-BSSV2-004-03` verifies failed routes stay disabled.

## Validation, Docker, and handoff

First rebuild/recreate changed Bridge services, verify reviewed image/config, migrations, readiness, and fresh scoped state. Run the opt-in harness to terminal state; never print expanded environment or authorization headers. A zero-entitlement, outage, or provider mismatch is an honestly recorded external blocker: it does not become a mock PASS or `READY_FOR_CK`. CFC may repair harness/evidence/configuration observations, not substitute a provider. On PASS, BSS-V2-005 and BSS-V2-007 may start.

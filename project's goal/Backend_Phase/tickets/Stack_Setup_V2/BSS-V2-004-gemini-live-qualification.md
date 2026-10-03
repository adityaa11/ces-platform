# BSS-V2-004: historical Gemini live route qualification and development activation

- **State:** `superseded`; **Former review batch:** `BSS-V2-BATCH-04`
- **Historical dependency:** BSS-V2-003 at CK `PASS`
- **Superseded by:** BSS-V2-004-01, BSS-V2-004-02, BSS-V2-004-03, BSS-V2-004-04

## Supersession record

The architecture now separates local document perception from external semantic reasoning. The original BSS-V2-004 combined independently qualifiable capabilities and is no longer a valid executable review unit.

Historical blocker/evidence artifacts remain unchanged. They retain their original meaning and do not establish a qualified Docling route, semantic extraction route, or reconciliation route.

This historical ticket is not a GO target. Do not implement, remediate, or use its former combined Review Contract as acceptance authority. The approved BSS-V2-001/002/003 history remains unchanged.

## Historical ticket body (preserved; not executable)

### Former outcome and current seam

Prove real Gemini capability-specific routes with an opt-in, secret-safe live harness; activate only the recorded qualified route identities in the development profile. Authentication, model listing, or a mock never qualify a route.

### Former scope and forbidden work

Use a real server-side credential and synthetic/public/non-confidential material to test minimal inference, non-zero usable entitlement, pinned configured identity, structured output with actual Atlas schema and complete validation, PDF perception/`NormalizedDocument` compatibility, representative extraction/reconciliation, normalized usage/latency, and 429 classification. Include streaming/cancellation only if the activated chat route exists. Record a qualification version and redacted evidence. Do not implement multi-user capacity, ledger, cost, privacy policy beyond evaluation evidence, fallback, product entitlement, or a replacement IDSER live-acceptance set.

### Former Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-004-01 | Each active capability route has a pinned provider/model/processor ID, qualification version, and real minimal-inference evidence. | Opt-in live harness and secret-safe qualification record. **PASS iff** real inference succeeds with non-zero entitlement; listing/authentication alone cannot close the row. | route/profile readiness |
| RC-BSSV2-004-02 | Structured extraction/reconciliation output passes complete current Atlas v1 validation. | Live synthetic representative requests plus parser evidence. **PASS iff** both requested capabilities pass actual validation, not merely provider constrained output. | semantic worker/handoff |
| RC-BSSV2-004-03 | PDF perception returns a result that normalizes to `NormalizedDocument v1` without invented fields. | Live synthetic PDF result and normalization evidence. **PASS iff** source-grant/normalization contract remains intact. | BSS-009 perception |
| RC-BSSV2-004-04 | Observed usage, latency, 429/rate-limit behavior, and evaluation privacy/account evidence are recorded without a secret or source leak. | Redacted harness output/evidence review. **PASS iff** required observations are classified and all prohibited content is absent. | adapter redaction |
| RC-BSSV2-004-05 | Only passed capability routes are enabled in the development profile; failures remain inactive/blocked. | Config/profile/readiness inspection. **PASS iff** no failed or unqualified route becomes active and Mistral remains inactive. | Compose readiness |

### Historical Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-004-SECRET` — credential remains Bridge-only; `BOUNDARY-BSSV2-004-SOURCE` — qualification uses only approved non-confidential input.
- **Trust transition:** `SEAM-BSSV2-004-LIVE-EVIDENCE` — qualification record identifies a route without recording sensitive provider or source material.
- **Prohibited coupling:** `COUPLING-BSSV2-004-MOCK-QUALIFICATION` — deterministic doubles cannot stand in for live entitlement.
- **Unresolved policy:** `SEC-GAP-BSSV2-004-PRODUCTION-PRIVACY` — EVALUATION proof is not NO_TRAINING/ZDR approval.
- **Review bindings:** `REV-READY-BSSV2-004-01` verifies secret-safe live evidence; `REV-READY-BSSV2-004-02` verifies only approved synthetic/public material; `REV-READY-BSSV2-004-03` verifies failed routes stay disabled.

### Historical validation and handoff

First rebuild/recreate changed Bridge services, verify reviewed image/config, migrations, readiness, and fresh scoped state. Run the opt-in harness to terminal state; never print expanded environment or authorization headers. A zero-entitlement, outage, or provider mismatch is an honestly recorded external blocker: it does not become a mock PASS or `READY_FOR_CK`. CFC may repair harness/evidence/configuration observations, not substitute a provider. The former downstream references to BSS-V2-005 and BSS-V2-007 are superseded by the current README dependency graph.

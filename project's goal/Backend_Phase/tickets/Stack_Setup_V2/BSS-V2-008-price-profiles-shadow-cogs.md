# BSS-V2-008: Effective-dated provider price profiles and shadow COGS

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-08`
- **Dependencies:** BSS-V2-007 at CK `PASS`
- **References:** V3 §§17, 19–21, 25–26, 33; Baseline V2 §§25–27, 39, 48; implementation context §§11, 25, 29

## Outcome and current seam

Make external-provider execution costs explainable through effective-dated profiles linked to Bridge usage records, while retaining a strict boundary between operational COGS and customer billing. Local Docling has no fabricated provider price profile.

## Scope and forbidden work

Model external provider/model meter rules, currency, effective interval, decimal-safe rates, applied profile reference, actual cash cost, and shadow production cost. Calculate from normalized ledger meters; when an approved paid-equivalent profile exists, a free development execution records `actual_cash_cost = 0` and the independently calculated shadow estimate. Do not implement subscription price, invoice, payment, allowance, customer plan, UI, or hard-code prices in semantic skills.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-008-01 | Price profiles are external-provider/model-specific, effective-dated, currency-labelled, and validate meter/rate/interval consistency. | Profile validation/migration tests. **PASS iff** overlapping/invalid profiles and unknown meter definitions fail deterministically; a local processor cannot acquire a fictitious profile. | Bridge usage schema |
| RC-BSSV2-008-02 | Cost calculation uses decimal-safe arithmetic and only supported reported/derived usage meters. | Calculation vectors. **PASS iff** expected token/page/request/cached-meter totals match exact decimal outcomes and unavailable meters are not guessed. | ledger integration |
| RC-BSSV2-008-03 | Historical execution retains the applied profile identity and distinct actual/shadow values. | Ledger accounting integration. **PASS iff** later profile changes cannot alter a completed record's applied profile/cost explanation. | BSS-V2-007 ledger |
| RC-BSSV2-008-04 | Free development and paid-equivalent costs remain distinguishable without product billing behavior. | Free-route example test. **PASS iff** zero actual cost can coexist with calculated shadow cost, and no customer entitlement/invoice write occurs. | affected Bridge role checks |

## Security Refactor Readiness

**Status:** `minimal-relevance`.

- **Inherited boundary:** `BOUNDARY-BSSV2-008-ECONOMICS` — Bridge records operational cost; Atlas product policy owns customer entitlement/billing.
- **Extension seam:** `SEAM-BSSV2-008-PRICE-PROFILE` — effective-dated profile links usage to explainable cost.
- **Prohibited coupling:** `COUPLING-BSSV2-008-BILLING` — provider COGS must not create customer charge or plan logic.
- **Unresolved policy:** `SEC-GAP-BSSV2-008-FINANCIAL-RETENTION` — commercial/retention policy is deferred.
- **Review binding:** `REV-READY-BSSV2-008-01` verifies price calculations cannot mutate customer/Atlas trusted billing state.

## Validation, Docker, and handoff

Run deterministic decimal calculation vectors, effective-date/profile immutability, ledger linkage, and role-boundary tests. Apply any Bridge-owned migration against the local Compose database and verify no Atlas trusted table privilege changes. Hard stop: a pricing-plan decision is outside scope. On PASS, BSS-V2-009 may consume the complete route/capacity/telemetry substrate.

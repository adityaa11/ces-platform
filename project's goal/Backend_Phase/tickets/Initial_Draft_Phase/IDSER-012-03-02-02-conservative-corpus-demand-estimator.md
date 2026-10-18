# IDSER-012-03-02-02 — Conservative corpus demand estimator

- **State:** `planned`; GO requires IDSER-012-03-01-02 CK `PASS`.
- **Batch:** `IDSER-BATCH-12-03-02-02`.
- **Parent:** [IDSER-012-03-02 split map](IDSER-012-03-02-bss-effective-capacity-corpus-partition.md).
- **Dependencies:** `-03-01-02` CK `PASS`; a pinned qualified BSS workload-estimator identity supplied by `-03-02-01` evidence or an already approved equivalent.

## Outcome

Implement and qualify a pure deterministic conservative source-unit and request-demand estimator. It maps an authenticated resolved accepted document to canonical eligible/deferred units and bounded candidate demand; it performs no BSS read or fit decision. **STOP before capacity planning, partition publication, persistence, GHR, SEM, or provider work.**

## Authorized scope

Canonical locator identity is document + page + source kind + local ID. Use real text blocks, tables, visual regions, source language/temporal/legend/scope facts, granted media, and only separately accepted REL context. Reject or preserve an explicit unexamined/deferred state for duplicate/conflicting locators, foreign pages, missing attribution, missing required media, or inseparable fidelity dependencies. Never infer a REL graph or convert an unexamined visual into a fact.

For each candidate, conservatively and deterministically bound request bytes/input tokens for source, bounded context/REL placeholders, media, system prompt, schema and reserved output; then project the existing finite nonnegative integer `RequestResourceEnvelope`. Freeze fixtures, model/route assumptions, estimator identity/version, overheads and failure margins. The estimator identity must match the BSS-owned registered workload identity; if it cannot, return `SEM_BATCH_ESTIMATOR_GAP`. `NO_ELIGIBLE_SOURCE` is a typed zero-unit disposition, not an empty batch.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| RC-012030202-01 | Actual resolved accepted sources produce deterministic canonical locators and eligible/deferred/unexamined classifications; duplicate, foreign, missing and fidelity-breaking cases reject or remain explicit. |
| RC-012030202-02 | Measured fixtures demonstrate conservative bytes/tokens and each existing envelope dimension for text, tables, context, schema/output allowance and granted media, with pinned estimator identity/version and no page-count magic. |
| RC-012030202-03 | REL absence stays absent; context/REL placeholders own no output and cannot fabricate semantic structure or visual facts. |
| RC-012030202-04 | Empty corpus returns `NO_ELIGIBLE_SOURCE`; the pure estimator creates zero BSS reads/writes, plans, reservations, GHR effects, durable handoffs, SEM calls, provider sends or truth effects. |

## Security Readiness

- `SR-012030202-T1`: authenticated bounded resolved source/grants → pure canonical candidate and demand data.
- `SR-012030202-C1`: no raw media/body persistence, source-path access, inferred REL, BSS policy math, prompt transport, or semantic acceptance.
- `SR-012030202-R1`: CK replays versioned fixtures and estimator output; `SR-012030202-R2` verifies fidelity/deferred failures and zero side effects.

## Evidence and hard stop

Retain canonical input identities, measured bound fixtures, exact output/envelope JSON, estimator revision and margin calculations. Missing BSS metadata/registration belongs to BSS; unsupported safe bounds return `SEM_BATCH_ESTIMATOR_GAP`. CK `PASS` provides only a pure estimator surface to `-03-02-03`.

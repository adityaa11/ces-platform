# BSS-V2-006-03A-01 — Route-bound admitted execution and authoritative feedback ingress

- **State:** `awaiting_review`; implemented by the explicit `GO BSS-V2-006-03A-01` checkpoint below.
- **Batch:** `BSS-V2-BATCH-06-03A-01`.
- **Depends on:** BSS-V2-001/002, BSS-V2-005-01..04, and BSS-V2-006-01/02 CK `PASS`.
- **Original traceability:** 03A RC01–04 (only their route/claim/ingress portions), E01, E08, E09.

## Outcome and scope

Create the first internal Bridge-only vertical slice: server-qualified route binding before the existing 006-02 admission transaction, an actual consumer of the existing `bridge-provider-admitted-execution-v1` job, one fenced outbound transport call, and one typed redacted feedback ingress. The test composition may replace only outbound transport and carries no prompt, source bytes, credentials, headers, or provider response body.

This ticket does **not** claim physical-window settlement, pressure, plan wakeup, replan intent, background parity, public consumer API, fallback, BSS-005 publication, or provider-specific behavior.

## Frozen review contract

| ID | CK PASS iff |
| --- | --- |
| RC-01-01 | A server-selected qualified route/capability/domain identity is persisted before reservation; forged, unqualified, contradictory, or client-chosen identities create zero reservation, job, or send. |
| RC-01-02 | A real pg-boss consumer claims the persisted reservation before calling one outbound transport port. Duplicate delivery, claim replay, or crash after claim cannot cause a second send. |
| RC-01-03 | The sole feedback ingress validates bounded identity, trust, freshness, and redaction; raw/secret fields, unknown schema, stale input, wrong route/domain/plan, and conflicting duplicate identity are non-mutating. |
| RC-01-04 | The test route uses the production resolver and ordinary admitted job path, with only outbound transport substituted; it proves non-inert persisted reservation, job, claim, send, and outcome rows and no live transport. |

## Workflow: GO, CK, CFC, and HMN

GO first maps each RC to the 006-02 transaction, resolver, worker, and ingress locator, then proves the whole vertical path before `awaiting_review`. CK reviews only the four rows and either returns `PASS` or `CHANGES_REQUIRED`. CFC may repair only a cited RC without widening to accounting or pressure. HMN may authorize a bounded interpretation only when the approved resolver, atomic route fence, or transport-only test seam is genuinely incompatible; it may not authorize a second runtime or client route selection.

## Handoff to 03A-02

On CK `PASS`, hand off immutable attempt/reservation/route/domain/plan/qualification attribution; a single durable transport claim; the typed redacted ingress envelope; and a real-worker test harness. 03A-02 owns how that accepted terminal envelope settles exact dimension/window usage. It must not alter the route selection, job consumer, or claim fence.

## Uncommitted-work allocation and SecurityReadiness

The current dirty-tree candidates are migrations `0037–0046`, `provider-admitted-worker.ts`, `provider-operational-runtime.ts`, the admitted-worker tests, worker admitted-queue registration, and migration bootstrap support. They are starting material, not accepted evidence; GO must stage only reviewed changes and preserve migration order. `SR-01-TRUST` preserves resolver→binding→claim→ingress authority; `SR-01-DATA` excludes raw transport material; `SR-01-COUPLING` prohibits a shadow scheduler/accounting path. CK bindings: `RB-01` proves route/claim authority; `RB-02` proves redaction and transport isolation.

# BSS-V2-004-03-06: Live Anoman production extraction qualification

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.03-06`
- **Dependencies:** BSS-V2-004-03-01 through -05 CK `PASS`; their artifacts/tests and hashes reproduce; approved BSS-V2-004-02 parser boundary; explicit `go`; local Anoman configuration and secret-safe evidence location
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§7–9.06, 12–14, 16
- **Historical reference:** [SEM-ANM-SPIKE-004 ticket](../Anoman_Spike_Phase/SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md) and [GO evidence](../../../feedback/SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md). The implementation context records runner terminal `FAIL` and CK `PASS`; preserve both results. CK reviewed bounded execution/evidence and did not turn the route into a production qualification.

## Outcome and bounded question

Determine whether the complete production extraction path can produce semantically acceptable, correctly accounted Semantic V1 output through the pinned Anoman route, without repair or authority transfer. Only this live ticket may call Anoman for production extraction qualification.

## Frozen execution path and scope

```text
accepted/synthetic NormalizedDocument v1
  -> production source-unit builder
  -> production PROMPT-003 compiler
  -> production reasoning packet
  -> production Anoman adapter
  -> real Anoman inference
  -> proposal Zod validation
  -> exact source accounting
  -> deterministic finalizer
  -> final Semantic V1 Zod validation
  -> existing staging/handoff
```

This ticket is opt-in and secret-safe. Before any call, GO records the exact non-confidential input identity/hash, prompt/schema/profile hashes, configured endpoint, requested model, fixed request settings, number of independent calls, local gate results, and written semantic acceptance oracle. Run only that frozen plan. Capture served/routed identity, latency, usage and cost/routing telemetry when exposed. A semantic mismatch is a terminal qualification `FAIL`, not permission for a correction call, prompt mutation, retry, fallback, alternate model, repair or weaker oracle. Never commit raw provider output or confidential source; retain only approved ignored local artifacts and secret-safe report/evidence.

Preserve the historical SPIKE-004 runner terminal `FAIL` and its CK result unchanged. This ticket does not qualify every Semantic V1 kind beyond its frozen oracle, rewrite old evidence, enable a live route by itself, or continue the D1 lifecycle. After this ticket, normal D1 still stops at the BSS-V2-004-02 terminal checkpoint.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040306-01 | Live call starts only after all predecessor CK PASS, exact artifact identities/local gates, ignored evidence root and explicit GO are verified. | Pre-call gate report binds each predecessor, hashes, config identity and frozen run plan. **PASS iff** every gate passes before credentials are read or a request is sent. | qualification preflight negatives |
| RC-BSSV2-0040306-02 | Real execution traverses every production stage in order, the generic worker uses only `StructuredReasoningProvider`, and the written semantic/source-accounting oracle runs without repair. | Secret-safe per-run result records requested/served identity, stage outcomes and oracle result; static/import-boundary evidence proves the worker does not inspect `route.providerId`. **PASS iff** the qualification result accurately reflects the frozen oracle; semantic failure is recorded as route `FAIL`, not an execution-contract failure. | production pipeline/integration and provider-neutral static checks |
| RC-BSSV2-0040306-03 | No retry, correction, arbitrary fallback, model/prompt/schema/oracle change or extra call occurs beyond the frozen plan. | Request count and run identities crosschecked against local report/evidence; no repair path in execution trace. **PASS iff** all calls and variables match frozen GO plan. | run-plan gate negatives |
| RC-BSSV2-0040306-04 | Evidence safely records latency, usage, exposed routing/cost telemetry and semantic result without leaking secrets/source/raw responses. | Redaction scans, ignored artifact inventory, evidence manifest and bounded committed report. **PASS iff** no key/header, raw source or full provider body enters versioned evidence. | secret/redaction scans |
| RC-BSSV2-0040306-05 | Historical SPIKE-004 evidence and BSS-V2-004-02 stop remain unchanged. | Path/diff inspection and lifecycle stop regression. **PASS iff** old terminal remains `FAIL` and normal D1 remains stopped before semantics. | BSS-V2-004-02 regression |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-0040306-ATLAS-SEMANTIC-TRUTH` — Atlas Zod, source accounting and deterministic finalizer own accepted truth; `BOUNDARY-BSSV2-0040306-SECRET-LOCAL` — key remains Bridge deployment-only.
- **Trust boundary:** `TRUST-BSSV2-0040306-LIVE-PROVIDER` — remote response is untrusted until proposal parse, source accounting, finalization and final parse succeed.
- **Sensitive assets:** `ASSET-BSSV2-0040306-ANOMAN-KEY`, `ASSET-BSSV2-0040306-SOURCE-FIXTURE`, and `ASSET-BSSV2-0040306-RAW-RESPONSE` — credentials, prompt/source material and response bodies require separate handling.
- **Identity context:** `IDENTITY-BSSV2-0040306-QUALIFICATION-RUN` — bind route/model, source and prompt/schema hashes, request settings, call count and telemetry to each result.
- **Extension seam:** `SEAM-BSSV2-0040306-OPT-IN-QUALIFICATION` — explicit preflight, bounded run plan and safe evidence retention precede live inference.
- **Prohibited coupling:** `COUPLING-BSSV2-0040306-SEMANTIC-REPAIR` — no response repair, correction call, unqualified fallback or truth-authority transfer.
- **Verification seam:** `VERIFY-BSSV2-0040306-SECRET-SAFE-ORACLE` — exact run-plan, redaction, provenance, source-accounting, final validation and semantic oracle checks.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040306-ANOMAN-DATA-POLICY` — production legal/residency, retention, customer consent and incident policy remain outside this qualification.
- **Review bindings:** `REV-READY-BSSV2-0040306-01` verifies pre-call authorization, route/source/artifact identity and credential isolation; `REV-READY-BSSV2-0040306-02` verifies untrusted-output handling, no repair and safe evidence.

## Validation, terminal result and handoff

Run all deterministic local gates in Docker Compose before live use. Record one qualification result (`PASS` only if the frozen semantic oracle passes; otherwise `FAIL`; use `ENVIRONMENT_BLOCKED` only when the predeclared environment gate prevents meaningful inference). The execution/review contract can pass when a correctly bounded experiment records semantic `FAIL`; in that case the route is not qualified and 004-03-07 cannot start. On completed evidence, set `awaiting_review` and stop for CK. Even a CK `PASS` with semantic qualification `PASS` does not release normal D1 or authorize reconciliation; only 004-03-07 owns the lifecycle release.

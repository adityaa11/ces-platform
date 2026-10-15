# IDSER-011-01: Live Mistral runtime and credential qualification

- **State:** `superseded-unimplemented` — non-executable; no independent CK `PASS` was obtained; **Review batch:** `IDSER-BATCH-11-01`.
- **Predecessors:** every executable IDSER-010 child through IDSER-010-06 at CK `PASS`.
- **Consumes:** frozen BSS-008 provider configuration/secret boundary, BSS-009 worker route, Compose topology, and approved IDSER-010 deterministic evidence. It does not reopen them.
- **Execution environment:** the real four-service Compose stack and a deliberately configured real Mistral deployment secret. No mock overlay qualifies.


## Prospective perception-route supersession — 2026-10-15

**Prospective perception authority:** [PERC-RESET-008 CK PASS](../../../feedback/PERC-RESET-BATCH-08-9f31026-review.md), [CANONICAL-PERCEPTION-BASELINE-v1](../../../feedback/CANONICAL-PERCEPTION-BASELINE-v1.md), and [IDSER perception winner map](../../../feedback/IDSER-PERCEPTION-WINNER-AUTHORITY-MAP-20261015.md). This is a 2026-10-15 perception-only amendment; historical evidence/approved IDSER and BSS contracts are unchanged. The only currently qualified ordinary digital-PDF perception route is `docling-run-003-capture` / `atlas-digital-pdf-run-003-capture-v1`, which yields source-bound `NormalizedDocument v1` and verified derived assets where captured, then stops at durable `perceived`. A valid zero-visual digital PDF follows this same route. No Mistral OCR or image-disabled Docling route, qualification-only selector, or automatic fallback is an allowed future canonical staged-perception option. Scanned/OCR-only PDFs and visual semantic interpretation remain unsupported without separate qualification.

- **RC-011-01-01 / RC-011-01-03 (perception portions): RETIRED as future perception gates.** Requiring Mistral OCR model/endpoint configuration, a Mistral-only worker or Mistral OCR provenance cannot gate or replace already-qualified RUN-003 local perception. BSS-008 Mistral configuration may remain independently useful historical or future *external semantic-provider* qualification, not a second `atlas.document.perceive` route.
- **KEEP / REHOME:** immutable reviewed service/image/route provenance, true configured/actual identity, deployment-only external-provider credentials, secret-safe redaction, honest ZDR/limit claims and provider preflight failure classification survive as security/quality obligations for a separately authorized semantic-provider qualification owner. Normal RUN-003 Docling does not require a Mistral credential.
- **Execution guard:** This child remains `planned`; its historical Mistral-specific text and RCs below cannot be used for future staged-perception GO/CK. Its remaining external semantic live-provider purpose awaits separate semantic-contract realignment. Do not report CK PASS, activate a provider, or silently replace the canonical local perception baseline.

## Terminal prospective implementation disposition — 2026-10-15

**RETIRE the whole original executable ticket; do not implement it as written.** Authority: [PERC-RESET-008 CK PASS](../../../feedback/PERC-RESET-BATCH-08-9f31026-review.md), [SEM-CUTOVER winner](../../../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md), and the [prospective disposition register](../../../feedback/IDSER-PERCEPTION-TICKET-DISPOSITION-20261015.md). The proposed Mistral-only credential/runtime qualification is NOT an additional local-perception implementation after PERC-RESET-008. Its separate external-provider function is covered by future bounded live stepwise qualification (BSS-V2-004-03-06) and an as-yet-unassigned official-provider privacy/deployment decision.

**KEEP / REHOME:** Credential isolation, reviewed image and configured-versus-actual provider identity, ZDR/limits truthfulness, failed-access classification and redacted evidence remain required for their actual external-provider owner.

**PROHIBITED:** No Mistral OCR key/endpoint or alternate route may gate ordinary RUN-003 Docling. GO, CFC and CK must not execute the original retired `IDSER-BATCH-11-01` as the future staged path. Future quality/security checks still require named successor CK proof; neither this status nor PERC-RESET alone proves semantic or reconciliation completion.

**Archival note:** All original review rows, Mistral-specific descriptions and procedural checkpoints below remain unmodified *historical planning text*, never an authorized future GO or a source of inherited CK PASS.

## Authority and bounded outcome

Answer one question only: **is the approved production Mistral runtime available through the existing secret boundary, with a reviewable non-secret qualification record?** Add only the smallest live-harness/configuration/evidence capability needed to preflight the real worker route and record configured/actual non-secret provider identities. The child neither creates a project nor processes a document.

The live credential is supplied only through the existing deployment/Compose environment consumed by `agents-bridge-worker` (and the existing Bridge configuration boundary). `MistralProvider` remains the only provider. The qualification must distinguish an absent/unreachable/invalid real-provider gate from code and stale-runtime causes without printing a secret or expanding Compose configuration.

## Explicit non-authority

This child does not call `perceive`, create PDFs/projects, execute either semantic skill, assert persistence, advance a bundle, inspect cards, or prove Scenario I. It does not add a provider, OCR route, worker, queue, fallback, TestRuntime handling, secret store, provenance column, or architecture change. A predecessor-contract incompatibility is an `AUTHORITY_PROBLEM`, not work to absorb here.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-011-01-01 | The reviewed Compose services and migrations run the reviewed image/configuration, with `agents-bridge-worker` wired to BSS-008's configured base URL, models, ZDR and limits. | Secret-safe service image/health/migration inspection plus immutable reviewed HEAD record. **PASS iff** every required service is healthy, its image/config revision is attributable to HEAD, and no stale/reused service is used as final evidence. |
| RC-011-01-02 | The live key is present only at the approved deployment-secret boundary and real-provider preflight is classified honestly without exposing its value. | A harness command that observes secret-safe initialization/actual provider outcome and redacted logs; it must not run `env`, `printenv`, `docker compose config`, or equivalent expanded-secret output. **PASS iff** the outcome is real-provider success, or an evidenced `BLOCKED`/`FAIL` that leaves the child unready; no mock/TestRuntime/fallback can satisfy the row. |
| RC-011-01-03 | OCR and structured model/endpoint identities, retry/limit policy and configured ZDR flag are captured only through approved non-secret provenance/configuration summaries. | Redacted structured evidence with configured identities and, if available, actual adapter provenance. **PASS iff** it contains no API key, authorization header, raw provider body, source content, or expanded environment value and identifies the existing `MistralProvider` path. |

## Security, repair and handoff

**Security readiness: applicable.** This child is primary owner of `SEAM-IDSER-011-01` for credential qualification and secret-safe evidence. It preserves BSS-008's Bridge-only secret, stateless `/v1/ocr` and `/v1/chat/completions` boundary, and synthetic-data requirement. `REV-READY-IDSER-011-01` begins here: only a real configured provider outcome may unlock the live series.

The stale-runtime diagnostic order is mandatory before classifying a code failure: reviewed image, recreated affected container, process readiness, scoped database/jobs/document artifacts, fixture identifiers, then provider credential/network outcome. Do not use `docker compose down -v`, volume pruning, or broad cleanup. A live harness must use fresh unique identifiers and bounded approved-harness cleanup only.

CFC may repair one qualification harness assertion, redaction, image-attribution check, or configuration observation. HMN may authorize one unresolved row in that same seam. It may not authorize a credential in tickets/artifacts, a fallback, or any document/pipeline/lifecycle work.

## Required validation, regression and review checkpoint

Run the secret-safe Compose qualification harness to terminal state, inspect migrations, service health and reviewed image identity, and preserve only redacted command/output summaries. Run the focused BSS-008 configuration/redaction and worker-startup regressions affected by any harness/configuration change; do not claim unrelated deterministic suites ran. **CK question:** does the existing real-provider configuration boundary qualify honestly and without exposing a credential?

## Hard stop and required handoff

Before `awaiting_review`, all rows are `PROVEN` with exact secret-safe commands, reviewed image/head, health/migration status and redacted evidence. If the provider gate is genuinely unavailable, retain the factual `BLOCKED`/`FAIL` state and do not create `READY_FOR_CK`. On success record `Internal readiness: READY_FOR_CK`; IDSER-011-02 alone may then begin D1 live-path proof.

# IDSER-009-04: Integrated production project-card regression checkpoint

- **State:** `approved` at `286eaee`; **Review batch:** `IDSER-BATCH-09-04`.
- **Depends on:** IDSER-009-01, IDSER-009-02 and IDSER-009-03 `PASS`.
- **Execution environment:** Compose authenticated app plus existing Playwright/browser and direct integration harnesses.

## Authority and outcome

This final evidence checkpoint proves the approved 009-01 -> 009-02 -> 009-03 path in authenticated `/home` with real persisted state and the existing refresh path. It is not another architecture or broad UI implementation ticket. A defect requiring substantial read, mapper or presentation architecture returns to its owning child; this checkpoint cannot absorb it.

Use real persisted state and owner/unrelated-user sessions to prove waiting, partial progress, technical failure, ready-for-review, semantic uncertainty distinct from failure, intact legacy behavior, zero facts, empty Master and unavailable production review/workspace action. Observe refresh from persisted state, never timer/fixture simulation. Prove `/demo` remains fixture-only and production cards neither route, share nor use fixture authority. Retain directly affected auth, CSP and shared Project Card regressions.

Apply the existing browser harness and frontend review gate to desktop, tablet, mobile and 200% reflow-equivalent widths; expanded/collapsed shell; light/dark; sparse/multiple cards; keyboard/focus; loading/error refresh; and maximum-valid names/IDs/descriptions including unbroken and mixed-case content. Record and inspect screenshots; test pass alone is not visual proof.

## Explicit non-authority

This ticket does not add lifecycle semantics, mapper rules, view-model fields, new UI capabilities, review UI, sharing, migrations, semantic-pipeline scenarios from IDSER-010, a timer or a new transport. It may make only a bounded regression repair directly required to exercise an approved child contract; a major architectural change returns to the owning child/planning authority.

## Review contract and proof

| Row | Required behavior | Smallest authoritative proof |
|---|---|---|
| RC-009-04-01 | Authenticated production route shows each persisted lifecycle truth to its member and nothing to an unrelated user. | Compose PostgreSQL + authenticated route/Playwright assertions. |
| RC-009-04-02 | Real refresh observes exact partial/ready progress, technical failure, semantic uncertainty, legacy/invalid handling, empty Master/zero facts and unavailable action. | Persisted-state browser/integration cases. |
| RC-009-04-03 | Production and fixture/demo authority remain separate; no `/demo`, Share, simulated transition or private/internal detail leaks into production. | Browser route/network/markup negatives plus direct `/demo` regression. |
| RC-009-04-04 | Card stays readable, keyboard-accessible and coherent across named viewport, shell, theme, density and extreme-content matrix. | Existing Playwright screenshots plus recorded frontend-gate inspection. |
| RC-009-04-05 | Direct auth, CSP and shared-card regressions remain green with exact Compose commands/results. | Existing app/browser regression commands. |

## Security, CK and repair boundary

**Security readiness: applicable.** Inherited scope is cross-layer proof for all original 009 seams, `REV-READY-IDSER-009-02` fixture/action/response privacy and the rendered portion of `REV-READY-IDSER-009-03`. CK evaluates one integrated proof bundle, not sibling internals. CFC findings should isolate to one missing browser assertion, regression or visual/accessibility observation; HMN may only authorize that finite residual.

## Hard stop

Before `awaiting_review`, GO records every integrated row as `PROVEN`, exact Compose/browser commands and results, screenshots and frontend-gate inspection. This completes the IDSER-009 series. IDSER-010 starts only after CK `PASS`; no IDSER-010 semantic-pipeline scenario is added here.

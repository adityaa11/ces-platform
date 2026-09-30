# IDSER-009-03: Production project-card lifecycle presentation

- **State:** `approved` at `2a6a8f0`; **Review batch:** `IDSER-BATCH-09-03`.
- **Depends on:** IDSER-009-02 `PASS`.
- **Execution environment:** Existing app component/render/accessibility-focused tests.

## Authority and outcome

Own faithful, accessible rendering of the approved browser-safe `ProjectCardViewModel`, primarily in `ProductionProjectCard.tsx` and `ProjectCardPresentation.tsx` only when a shared presentation change is necessary. Reuse frozen PCC Entity Library visual language, semantic tokens, Button/theme/type roles and the existing card structure; this is an established-UI extension, not a redesign.

GO renders all four states with their approved label, exact approved progress, Master/metrics and bounded technical-failure presentation. Status is understandable without color alone; progress and status use appropriate semantics without noisy refresh announcements. Preserve semantic article, heading, progress, button, disabled-action reason and keyboard/focus contracts. The production review/workspace action remains disabled/unavailable until an actual authorized surface exists.

## Explicit non-authority

The component consumes 009-02; it must not query persistence, reconstruct lifecycle states, calculate X/N/percent, inspect queues/local storage/timers, or map failure internals. It does not own responsive/theme/zoom screenshots, authenticated cross-user proof, `/demo` regression, auth/CSP regression or any review/workspace feature.

## Review contract and proof

| Row | Required behavior | Smallest authoritative proof |
|---|---|---|
| RC-009-03-01 | Each supplied approved state renders its exact state/progress/Master/metric content without local reinterpretation. | Component/render tests with one fixed model per state. |
| RC-009-03-02 | Status is not color-only; progress/status/action have accessible names and semantics; disabled action has a truthful reason. | Semantic render/accessibility assertions. |
| RC-009-03-03 | Failure display is bounded and safe; unavailable action does not imply a review/workspace route or `/demo` authority. | Component negative assertions. |
| RC-009-03-04 | Existing shared card composition and keyboard/focus behavior remain consumable for the approved model. | Focused component interaction/render regression. |

## Security, CK and repair boundary

**Security readiness: applicable.** Inherited scope is the presentation boundary of `SEAM-IDSER-009-01` and `COUPLING-IDSER-009-01`: no client authority reconstruction, fixture identity, unsafe error rendering or enabled unavailable action. CK reviews a component contract only. CFC can repair a status, semantic, accessibility or safe-render defect locally; HMN could only authorize that same narrow presentation residual.

## Hard stop

GO must have component/render/accessibility proof for all rows before review. Full authenticated browser, responsive/reflow, theme, shell and regression proof is deferred to 009-04; no persistence or mapping authority is reopened here.

## GO checkpoint

- **Implementation checkpoint:** `project's goal/feedback/IDSER-BATCH-09-03-go-checkpoint.md`
- **Implementation commit:** this GO handoff commit; CK remains the sole authority to issue `PASS`.

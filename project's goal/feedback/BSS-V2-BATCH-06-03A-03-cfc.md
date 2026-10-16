# CFC Checkpoint — BSS-V2-006-03A-03

- **Ticket:** `BSS-V2-006-03A-03` — Scoped runtime pressure and bounded probe recovery
- **Batch:** `BSS-V2-BATCH-06-03A-03`
- **Authority:** explicit user command `Cfc BSS-V2-006-03A-03`; frozen ticket at `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-03-scoped-pressure-and-probe-recovery.md`.
- **Original CK artifact and reviewed commit:** `project's goal/feedback/BSS-V2-BATCH-06-03A-03-ace06af-review.md`, `ace06afb193b99a9b10bfdbd1d8443e98d6242ba`.
- **State:** `awaiting_review`; this is an internal CFC readiness record, not a CK decision.

## Bounded remediation

This is the first CFC pass following the consolidated `CHANGES_REQUIRED` CK
review. It repairs only frozen clauses `CK-001.a` through `CK-001.d`. No HMN
authorization was required or consumed: this is not a post-CFC cycle.

- Added a forward migration that makes the canonical pressure identity
  NULL-aware, consolidates any accidental pre-existing duplicate identities
  conservatively, and keeps a domain-scoped incident as a numeric clamp rather
  than a direct route-style admission fence.
- Expanded the focused operational-runtime integration suite with server-owned
  selected-route fixtures, an independent domain, persisted policy/cooldown
  observations, a fresh-connection restart probe, and invalid/repeated feedback
  observations. No provider, wakeup consumer, retry loop, or BSS-005 numeric
  policy was added.

## Frozen Finding Closure Matrix

| CK clause | Status | Evidence and closure oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `provider-route-bound-operational-runtime.integration.test.ts` exercises two server-selected capabilities in one shared domain plus an independent domain. Route-only pressure produces `pressure_limited` with no reservation; shared-domain numeric pressure makes both shared routes unavailable; the independent route is admitted and transport-claimed. The persisted matrix has exactly one domain numeric owner and no route numeric fallback. |
| `CK-001.b` | `PROVEN` | The focused scenario observes policy version `v1`, route scope, a trusted two-second Retry-After cooldown, and the distinct seven-second metadata-free cooldown. Its missing-policy case persists no policy version, stays blocked, and denies probe claiming. The frozen policy/no-transport oracle passes. |
| `CK-001.c` | `PROVEN` | The fresh-connection scenario claims once, closes the original SQL client, then proves the same stable incident has a durable `probe_claimed_at`, no second claim, no recovery, and no additional admitted-execution job. The frozen restart/failure/no-recursion oracle passes. |
| `CK-001.d` | `PROVEN` | The focused scenario rejects stale and malformed recovery/feedback, preserves stable route/domain identity across repeated feedback, prevents a higher numeric report from raising the clamp, rejects unrelated recovery, and allows only one matching qualified recovery. The frozen negative-matrix oracle passes. |

## Direct regressions checked

- The original route binding, reservation, physical-window, transport-claim,
  feedback, deficit, and mixed-usage scenarios remain in the same focused
  suite; all seven tests pass.
- The forward migration was applied from a pristine disposable database and
  `migration:check` confirmed the full registered migration list.

## Validation evidence

Executed against a fresh disposable PostgreSQL database and removed after the
run:

```text
corepack pnpm --filter @atlas/db migrate                                                        PASS
corepack pnpm --filter @atlas/db migration:check                                                PASS
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-operational-runtime.integration.test.ts  PASS (7 tests)
corepack pnpm --filter @atlas/db typecheck                                                      PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                           PASS
git diff --check                                                                                PASS
```

The focused suite emits the existing expected PostgreSQL `25P01` cleanup
warning after explicit rollback; all assertions pass. The repository's
unrelated dirty and untracked paths were neither edited nor staged.

Internal readiness: READY_FOR_CK

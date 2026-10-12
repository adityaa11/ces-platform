# PERC-RESET-002 CK verification — 9a0ef58

- **Ticket:** `PERC-RESET-002` — Sole normal RUN-003 perception route
- **Batch:** `PERC-RESET-BATCH-02`
- **Review type:** bounded verification after CFC
- **Ticket state:** `awaiting_review`
- **Original CK artifact:** `PERC-RESET-BATCH-02-c9c4a2f-review.md` (`CHANGES_REQUIRED`)
- **CFC checkpoint:** `PERC-RESET-002-cfc-progress.md`
- **Reviewed remediation commit:** `9a0ef58cae68afb5fc31b934209e3d3a9860d36c` (`HEAD`)
- **Result:** `PASS`

## Bounded scope

This verification checks only frozen clause `CK-001.a`, its required evidence, the remediation diff, and direct regressions introduced by that diff. The committed remediation changes `apps/agents-bridge/src/route-registry.ts`, `apps/agents-bridge/tests/route-registry.test.ts`, and the CFC checkpoint. Those scoped paths are clean in the current worktree. Other dirty and untracked workspace paths do not overlap this remediation.

## Frozen clause outcome

| Original clause | Frozen closure oracle | Outcome and evidence |
|---|---|---|
| **CK-001.a — RESOLVED** | With normal `qualificationOnly=false`, the approved `qualificationVersion=idser-012-01-03-02-local` and `qualificationRef=qualification://idser-012-01-03-02-local` are admitted; changing either value causes `assertConfiguredRouteAdapter` to reject the route. | `apps/agents-bridge/src/route-registry.ts` now rejects mismatched qualification metadata with `RouteResolutionError` code `invalid_route` when qualification-only mode is not enabled. The committed `normal RUN-003 admission permits only its exact pinned route identity` test proves the approved pair is admitted and independently rejects a version mismatch, a reference mismatch, and both mismatched. Existing profile, capability-identity, and digest negatives remain in the same test. |

## Validation and direct-regression check

- `node node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/route-registry.test.ts` — **PASS**, 9 tests, 0 failures. This includes the frozen exact-qualification oracle and the static canonical Compose assertion.
- `git diff --check HEAD^ HEAD` — **PASS**.
- The remediation diff is limited to the Docling route admission guard, its focused tests, and the CFC record. No direct regression was found in the behavior needed to evaluate `CK-001.a`.
- The CFC progress table still labels its working row `UNRESOLVED`, while its later closure section records the oracle as PASS. The committed behavior and independently rerun assertions resolve the frozen clause; this record discrepancy does not alter or expand the original oracle.
- No Docker startup, pull, or rebuild was run.

## Decision

`CK-001.a` is **RESOLVED** against its frozen closure oracle, and the bounded remediation introduced no direct regression. Result: **`PASS`**. This is post-CFC verification only; it does not restart the broad review or add findings.

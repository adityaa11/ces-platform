# BSS-V2-004-03-08-02-05 CFC checkpoint — CK-001.a

- **Ticket:** `BSS-V2-004-03-08-02-05` — Concrete Anoman multimodal transport conformance
- **Batch:** `BSS-V2-BATCH-04.03-08.02-05`
- **State:** `awaiting_review`
- **Human authorization:** explicit user `cfc BSS-V2-004-03-08-02-05`; the first consolidated CK review has one ticket-traceable, implementation-repairable clause.
- **Original CK artifact / frozen oracle:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.02-05-77304fc-review.md`
- **Reviewed implementation:** `77304fcbb868e4993b57b21c84c8e0d475376a34`
- **Remediation base:** `9331a02`
- **Remediation commit:** `0339f158660eb14ea7705989a68e1105d99fc0e2` (`fix(bridge): reject invalid Anoman image metadata`)

## Bounded remediation

Only `CK-001.a` was addressed. `AnomanProvider.structuredMultipart()` now rejects zero-byte images and zero or negative image dimensions before the Anoman fetcher can observe a request. The lower-bound guard is confined to the ticket-authorized Anoman serialization seam; the shared neutral capability still owns negotiated upper bounds and the change introduces no provider schema, route, activation, retry, fallback, semantic-job, reservation, reconciliation, or publication behavior.

## Frozen-clause remediation progress

| CK clause | Status | Evidence location and frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/tests/anoman-provider.test.ts`, test `Anoman multipart capability rejects invalid media and cancellation before HTTP side effects`, supplies empty bytes, zero width, negative width, zero height, and negative height. Each assertion requires `invalid_request` and verifies fake fetch count `0`. Existing unsupported-MIME and mismatched-byte-length cases remain in the same loop. **Frozen oracle: passed.** |

The already-proven `RC-01` and `RC-03` rows are preserved: the valid mixed text/image fake capture still establishes ordered bounded wire serialization and JSON object mode, while all observed requests use an injected fake transport. No image bytes, base64, credentials, or request snapshots are recorded in this checkpoint.

## Exact validation on remediation commit `0339f158660eb14ea7705989a68e1105d99fc0e2`

| Exact command | Outcome |
| --- | --- |
| `docker compose run --rm --no-deps agents-bridge node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/anoman-provider.test.ts` | PASS — 6 tests, 0 failures; the frozen fake-fetch oracle passed for every empty/non-positive metadata case. |
| `docker compose run --rm --no-deps agents-bridge sh -c 'for file in apps/agents-bridge/tests/multipart-provider-capabilities.test.ts apps/agents-bridge/tests/gemini-provider.test.ts apps/agents-bridge/tests/provider-capabilities-boundary.test.ts apps/agents-bridge/tests/route-registry.test.ts; do node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs "$file" || exit $?; done'` | PASS — 3 multipart-capability, 8 Gemini, 2 provider-boundary, and 7 route-registry tests; no direct regression. |
| `docker compose run --rm --no-deps agents-bridge corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `git diff --check 9331a02 0339f158660eb14ea7705989a68e1105d99fc0e2` | PASS — no whitespace errors. |

All validation uses deterministic injected fake transports. `external_provider_attempt_count = 0`; no semantic provider activation, semantic/perception jobs, or admission reservations were created.

## Changed-file inventory

Remediation commit `0339f158660eb14ea7705989a68e1105d99fc0e2` contains only:

- `apps/agents-bridge/src/providers/anoman.ts`
- `apps/agents-bridge/tests/anoman-provider.test.ts`

Unrelated generated fixtures and untracked workspace artifacts were preserved and not staged. The frozen ticket, original CK artifact, shared capability contract, and adapter lifecycle/route owner remain unchanged.

## Internal readiness and handoff

`CK-001.a` is `PROVEN` against its original frozen oracle, all required validation passed on the remediation commit, and no direct regression is known. **Internal readiness: READY_FOR_CK**.

**Handoff:** Stop for independent CK verification of `CK-001.a` and directly impacted regressions. This checkpoint does not declare CK `PASS` and does not authorize another CFC cycle.

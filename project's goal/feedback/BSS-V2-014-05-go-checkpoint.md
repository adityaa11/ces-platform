# GO checkpoint — BSS-V2-014-05 initial v2 IDSER capacity consumer

- **Ticket / batch:** `BSS-V2-014-05` / `BSS-V2-014`
- **Authorized action:** explicit `GO AUTHORIZED — BSS-V2-014-05 Initial V2 Capacity Consumer` on 2026-10-24.
- **Authority:** frozen ticket, [initial v2 activation planning amendment 001](BSS-V2-014-05-initial-v2-activation-planning-amendment-001.md), and [replacement contract freeze 001](BSS-V2-014-05-replacement-contract-freeze-001.md). Replacement `RRC-01405-05.a`–`.e` are the active acceptance clauses; historical `RC-01405-01..04` are preserved.
- **Implementation commit:** `6c93922c` (`feat(idser): add v2 capacity snapshot consumer`).
- **State:** `awaiting_review`.
- **Activation status:** not activated. This checkpoint is consumer-readiness evidence only and does not claim parent release acceptance or production-active IDSER processing.

## Bounded implementation

- Added `createIdserCapacityPlanningSnapshotV2Consumer`, the sole new IDSER capacity consumer. It calls the existing authenticated BSS reader with complete demand including IDSER-selected `reservedOutputTokens`; it does not expose a planner, database, admission, reservation, provider, queue, or send surface.
- The consumer accepts only authenticated, qualified `CapacityPlanningSnapshot/v2`, pins its server-owned identity, validates revisions, calculated allocation, policy provenance (including approved unknown/not-enforced RPD), all structural/output/prompt-byte bounds, estimator/safety identities, canonical fingerprint form, and qualification provenance.
- Both existing IDSER structural-fit and multimodal candidate partitioners now require the v2 consumer shape. They preserve typed `BLOCKED`, `REPLAN`, and structural-unfit behavior, send reserved output with every fit read, and fence changed v2 policy/fingerprint evidence.
- Text and multimodal partitions keep using the existing complete-request estimator. IDSER selects output reservation and deterministic packing; BSS bounds and evaluates `inputTokens + reservedOutputTokens` against `sizing.maxEligibleCompleteRequestTokens`. No TPM/concurrency division, second tokenizer, capacity synthesis, borrow-sized batch, direct BSS SQL, v1 adapter, fallback, or dual read was added.

## Changed-file inventory

- `apps/agents-bridge/src/idser-capacity-planning-snapshot-v2.ts`
- `apps/agents-bridge/src/idser-structural-fit-corpus-partition.ts`
- `apps/agents-bridge/src/idser-multimodal-structural-fit-partition.ts`
- `apps/agents-bridge/tests/idser-capacity-planning-snapshot-v2.test.ts`
- `apps/agents-bridge/tests/idser-multimodal-structural-fit-partition.test.ts`
- `apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts`
- `apps/agents-bridge/package.json`

No GHR source, route, receiver, delivery, acknowledgement, or migration file changed.

## Validation evidence

```text
pnpm --filter @atlas/db exec node --env-file=C:\Workspace\atlas\ces-platform\.env scripts\migrate.mjs --check
# PASS — Atlas database migration check passed

pnpm --filter @atlas/agents-bridge exec node --env-file=C:\Workspace\atlas\ces-platform\.env .\node_modules\jiti\lib\jiti-cli.mjs tests\calculated-capacity-snapshot-v2.integration.test.ts
# PASS — 2/2.  The actual authenticated BSS reader returned the exact qualified v2 candidate; the composed IDSER consumer checked the canonical fingerprint, complete-request ceiling, prompt-byte bound, unknown-RPD provenance, and zero BSS operational effects.

pnpm --filter @atlas/agents-bridge exec jiti tests/idser-capacity-planning-snapshot-v2.test.ts
# PASS — 6/6.  Covers v2 identity/revision/fingerprint/provenance negatives, complete-request byte/input/output/context/ceiling negatives, text structural-fit composition, and v1/adapter/fallback inventory.

pnpm --filter @atlas/agents-bridge exec jiti tests/idser-structural-fit-corpus-partition.test.ts
# PASS — 7/7.  Covers deterministic structural packing, typed unfit/blocked/replan, prompt/context limits, estimator fencing, and zero-effect construction.

pnpm --filter @atlas/agents-bridge exec jiti tests/idser-multimodal-structural-fit-partition.test.ts
# PASS — 4/4.  Covers the v2-only composed consumer for selected-image complete demand, approved unknown-RPD behavior, typed unfit, and replan fencing.

pnpm --filter @atlas/agents-bridge exec tsc -p tsconfig.json --noEmit
# PASS

pnpm --filter @atlas/agents-bridge exec jiti tests/ghr-03a-semantic-receiver.test.ts
pnpm --filter @atlas/contracts exec jiti tests/ghr-generic-handoff-envelope.test.ts
pnpm --filter @atlas/db exec node --env-file=C:\Workspace\atlas\ces-platform\.env .\node_modules\jiti\lib\jiti-cli.mjs tests\ghr-03b-boundary.test.mjs
# PASS — preserves explicit can_continue:false and parsed_only parsing/delivery boundary.

git diff --check
# PASS
```

The broader `pnpm --filter @atlas/agents-bridge test` was also run. It reached a pre-existing, unrelated Docling route-qualification assertion failure in `tests/docling-provider.test.ts` (the configured route lacks the approved RUN-003 qualification). All preceding IDSER capacity suites, including this ticket's added v2 suite, passed. No Docling/GHR/activation code was changed or remediated by this ticket.

An opt-in real GHR-03B run additionally passed its static boundary, negative-effect matrix, restart/concurrency fencing, and replay-control tests. Its one remaining fixture test requires a separately seeded protected GHR-02B issued handoff; the fresh local database has none. This is not a `-05` behavioral regression and no GHR change is authorized.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence locator and executed result | Status |
| --- | --- | --- | --- |
| `RC-01405-01` | Qualified authenticated v2 only; exact identity/revisions/fingerprint/allocation/structural/estimator/approved-RPD provenance; typed stop for foreign/stale/non-qualified/missing data. | `idser-capacity-planning-snapshot-v2.test.ts` (identity, revision, fingerprint, prompt, unknown-RPD, and unfit negatives); actual-reader `calculated-capacity-snapshot-v2.integration.test.ts`; commands above pass. | `PROVEN` |
| `RC-01405-02` | Shared complete estimator measures text/image/framing/output and rejects process/model byte/input/context/output limits without per-seat TPM or a second tokenizer. | `idser-capacity-planning-snapshot-v2.test.ts` complete-bound and text-fit cases; `idser-multimodal-structural-fit-partition.test.ts` selected-image v2 case; actual-reader BSS boundary matrix; commands above pass. | `PROVEN` |
| `RC-01405-03` | Approved Anoman unknown/not-enforced RPD is non-blocking; absent/revoked/mismatched provenance fails closed, with no numeric RPD fallback. | Consumer unit provenance negative; actual-reader integration exercises approved, missing, mismatched, and revoked policy cases; commands above pass. | `PROVEN` |
| `RC-01405-04` | Consumer/readiness produces no BSS admission/reservation/window/job/transport, GHR delivery, SEM, provider, or semantic-truth effect. | Actual-reader before/after BSS counters; pure-consumer and partition static-effect tests; GHR-03A/03B boundary commands; no changed GHR/SEM/provider files. | `PROVEN` |
| `RRC-01405-05.a` | Exactly one v2-only IDSER consumer composition; no executable v1 consumer/reader binding, adapter, fallback, dual read, direct SQL, or alternate authority. | `idser-capacity-planning-snapshot-v2.test.ts` source inventory and static negative imports; changed-file inventory. Historical v1 library/fixtures remain unbound. | `PROVEN` |
| `RRC-01405-05.b` | Actual-reader composed consumer accepts only authenticated qualified exact v2 and typed-stops/replans stale/unavailable/foreign/non-qualified/mismatched reads; `productionActive:false` valid for readiness. | Actual PostgreSQL integration plus consumer negative matrix; both pass with `qualification.productionActive:false`. | `PROVEN` |
| `RRC-01405-05.c` | Complete request obeys `inputTokens + reservedOutputTokens <= sizing.maxEligibleCompleteRequestTokens`, plus input/output/context/request-byte/media bounds. | Consumer boundary matrix, structural text integration, and multimodal image composition; commands above pass. | `PROVEN` |
| `RRC-01405-05.d` | Parent release verifies readiness/dependencies/inventory then invokes only the existing BSS activation epoch; failed prerequisites block activation. | `-05` readiness evidence is proven above. Actual production activation is parent-owned and expressly not GO-authorized; existing reader integration continues to prove premature parent activation rejects. | `NOT_APPLICABLE` — parent-owned release verification/epoch activation remains the exact blocker; no activation mechanism was added or invoked. |
| `RRC-01405-05.e` | Reads/readiness create no runtime or downstream effects and GHR remains `can_continue:false`, `parsed_only`. | Actual-reader zero-effect counters; GHR boundary regression commands; unchanged GHR inventory. | `PROVEN` |

Internal readiness: READY_FOR_CK

## Parent-owned activation blocker

The parent must assemble this readiness record with accepted `BSS-V2-014-03` and `BSS-V2-014-04-03` evidence, bind it to the selected activation profile/revision and canonical fingerprint, complete its release inventory, and only then invoke the existing `bridge.activate_desired_admission_profile(...)` epoch. `BSS-V2-014-05` neither implements nor invokes that epoch. This checkpoint therefore requests independent CK of consumer readiness only; it is not production activation and does not self-issue CK `PASS`.

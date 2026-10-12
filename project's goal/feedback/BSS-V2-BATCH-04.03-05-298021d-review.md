# CK review — BSS-V2-004-03-05

- **Ticket:** BSS-V2-004-03-05 — Deterministic extraction finalizer and provider-neutral worker composition
- **Batch:** BSS-V2-BATCH-04.03-05
- **Ticket state before review:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-05-deterministic-extraction-finalizer.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-004-03-05-go-checkpoint.md`
- **Reviewed commit:** `298021dc9726cb8ee5fae15de5b19394ae28995e` (`feat(bridge): finalize extraction proposals deterministically`)
- **Administrative state alignment:** `a53a4d1139dceeb7ed8010849b11c9a9ed8a663e` changes only the ticket state to `awaiting_review`; it is not part of the implementation target.
- **Review type:** first consolidated review

## Review boundary

The reviewed implementation target is the GO checkpoint's recorded `HEAD`, `298021dc9726cb8ee5fae15de5b19394ae28995e`.  The subsequent administrative commit changes only the frozen ticket workflow state. `git diff --quiet 298021d...a53a4d1 -- apps/agents-bridge` confirms that the implementation paths are identical at the review target and current `HEAD`.

The frozen ticket's five Review Contract rows are the complete acceptance contract. This review consumes the accepted source-packet and multimodal packet interfaces without reopening their owners. It does not activate a provider, semantic route, admission, reconciliation change, or D1 execution.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-BSSV2-0040305-01` | UNRESOLVED | Strict proposal parsing, owned-slot accounting, and rejection of context-only slots are present. However, the finalizer represents an allegedly accepted context relationship only as `{ ownedSourceSlot, contextSourceSlot }` and accepts it after checking only those slot roles. It drops the accepted packet's lineage, revision, authorization, document/source identity, asset identity, contextual role, and necessity; an arbitrary matching slot pair can therefore be supplied as accepted context. See `CK-001.a`. |
| `RC-BSSV2-0040305-02` | UNRESOLVED | The finalizer derives deterministic candidate/source IDs, trusted source wording, inventory locators, and canonical output. The same unverified two-string relationship can add contextual visual evidence to a candidate, so the required “where actually authorized” dual-evidence condition is not established. See `CK-001.b`. |
| `RC-BSSV2-0040305-03` | PROVEN | The extraction worker depends only on `StructuredReasoningProvider`, contains no route/provider-ID inspection or concrete adapter import, and leaves the legacy packet/profile path explicit. The source-skills suite proves legacy `prompt-003/v1` is byte-identical before, during, and after explicit stepwise compilation. |
| `RC-BSSV2-0040305-04` | PROVEN | The extraction diff retains the existing stage-before-delivery/replay branch and reconciliation branch. The focused worker suite covers staged replay, stale claimant recovery, post-stage delivery failure, malformed proposal failure, and canonical handoff rejection; the retained multipart capability suite owns the preflight side-effect fakes. |
| `RC-BSSV2-0040305-05` | PROVEN | The reviewed diff adds no route, admission, scheduler, provider configuration, or D1 code. It uses the already injected provider seam only after the existing semantic worker receives a job; it does not alter the upstream D1 `perceived` terminal gate. |

## Validation and evidence

Executed independently against the reviewed implementation plus its state-only successor:

| Command | Result |
| --- | --- |
| `docker compose run --rm --build --no-deps agents-bridge sh -lc "corepack pnpm --filter @atlas/agents-bridge typecheck && corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts && corepack pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts"` | PASS: bridge typecheck; 7 worker/finalizer tests; 18 source-packet/profile tests |
| `git diff --check 298021d^ 298021d` | PASS |
| `git diff --quiet 298021d...a53a4d1 -- apps/agents-bridge` | PASS: state alignment does not alter the reviewed implementation |

All executed provider interactions were deterministic local fakes. No external provider request, credential, raw response, media bytes, job, permit, or reservation was produced.

## Frozen Finding Closure Matrix

### CK-001 — Context evidence is not bound to an accepted relationship

**Ticket authority:** Required proposal-to-result rules 2–5 require accepted context authority, exact execution/document/source/profile binding, blocking of missing essential links, and dual evidence only where an Atlas-validated accepted relationship permits it. `RC-BSSV2-0040305-01` and `RC-BSSV2-0040305-02` make those properties binary acceptance conditions.

**Unsatisfied evidence:** `apps/agents-bridge/src/semantic-extraction-finalizer.ts:20-23` defines `AcceptedContextEvidence` with only two slot strings. At `:84-91`, finalization verifies only that the owner is locally owned and the context has `reference_context` role. In contrast, the approved multimodal packet's `referenceContexts` preserve relationship lineage/revision, context role, necessity, and derived asset identity, and are built only after document/source/authorization checks. The finalizer neither consumes nor validates that accepted evidence, so a caller can supply a fabricated matching pair and cause contextual evidence to reach canonical output.

#### CK-001.a

- **Required observable state:** Contextual evidence is accepted only from an Atlas-validated relationship whose execution/document/source identity, accepted lineage/revision/authorization, owned and context slot binding, contextual role, necessity, and asset identity match the exact source packet/finalization request. A fabricated, foreign, expired, duplicate, unsupported, or mismatched relationship fails `SOURCE_RELATIONSHIP_BLOCKED` before canonical result construction.
- **Exact evidence / validation:** Deterministic finalizer tests construct an accepted packet-derived relationship and prove table-plus-context evidence only for that relationship. They separately prove each forged/mismatched relationship category reaches no staged/canonical result. Run the bridge typecheck and focused finalizer suite in Compose.
- **Direct-regression boundary:** Existing source-packet relationship validation, exact owned-slot coverage, provider-neutral worker injection, and canonical Semantic V1 parsing. No adapter, schema, route, grant, or relationship-authority owner may be changed without separate authorization.

#### CK-001.b

- **Required observable state:** A required essential context relationship that is absent or cannot be faithfully represented blocks its owning decision; it is not dropped or converted to `non_fact`. Contextual evidence may reference the same table-owned candidate ID but cannot mint a visual-owned candidate.
- **Exact evidence / validation:** Deterministic fixtures prove accepted optional and essential context behavior, with missing-essential, context-only, arbitrary-pair, duplicate, and visual-owned-candidate negatives. The resulting canonical output has the same candidate ID for the table inventory/evidence rows and no independent visual candidate. Run the bridge typecheck and focused finalizer suite in Compose.
- **Direct-regression boundary:** `buildUnhydratedMultimodalSourcePacket()` accepted-relationship/necessity behavior, source inventory accounting, candidate ID derivation, and canonical final-result validation.

## Scope-change observations

None. This is a bounded repair to the ticket's existing finalization trust boundary. It must proceed through the applicable CFC/HMN workflow; this CK review does not authorize a repair.

## Decision

`CHANGES_REQUIRED`

The ticket-state mismatch is resolved, but the implementation does not yet prove or enforce that contextual evidence originates from an accepted Atlas relationship. Keep BSS-V2-004-03-05 at `awaiting_review` pending bounded remediation and a later CK re-review.

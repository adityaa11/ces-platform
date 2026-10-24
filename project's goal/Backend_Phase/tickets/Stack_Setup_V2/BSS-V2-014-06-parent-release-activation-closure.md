# BSS-V2-014-06 — Parent release/activation closure

- **State:** `approved` following post-CFC CK `PASS` for remediation commit `daf15184`; this is the one parent-owned executable closure ticket. It is not GO, a production activation, an environment promotion, or authorization for a new IDSER scheduler, GHR continuation, SEM execution, or provider send.
- **Parent:** [BSS-V2-014](BSS-V2-014-weighted-capacity-ticket-set.md).
- **Frozen child input:** BSS-V2-014-01 through -05 CK `PASS`, preserved as accepted predecessor evidence. This ticket does not reopen a child except for a concrete defect in the integration seam it consumes.
- **Contract freeze:** [BSS-V2-014-06 parent-release closure freeze 001](../../../feedback/BSS-V2-014-06-parent-release-closure-contract-freeze-001.md).

## Outcome

Close the difference between an immutable, isolated `CapacityPlanningSnapshot/v2` candidate and the one exact calculated desired-admission profile that is active in production. The existing authenticated BSS reader remains the sole read authority and `bridge.activate_desired_admission_profile(...)` remains the sole activation epoch. A verified parent release record is the only way a qualified v2 successor can satisfy that function's current successor guard; an unrecorded direct call remains rejected.

The implementation produces release-capable code, deterministic release evidence, and an operator-facing activation procedure. It does **not** perform the environment-specific production activation. That later procedure consumes a reviewed release record and uses the existing epoch exactly once.

## Precise non-GHR IDSER invocation finding

`apps/agents-bridge/src/main.ts` creates `idserCapacityPlanningSnapshotV2Consumer` and immediately discards it with `void idserCapacityPlanningSnapshotV2Consumer`. The approved IDSER planner functions, `proposeStructuralFitCorpusPartition` and `partitionMultimodalStructuralFit`, have no production caller: repository callers are tests and the offline qualification script. The active IDSER-012-03 authority intentionally stops before GHR issue/delivery, SEM intake, BSS attempts, provider work, and downstream execution.

Therefore **no existing non-GHR production IDSER planning invocation point exists** to receive the v2 consumer. The missing owner is the future IDSER planner-orchestration/entrypoint owner, which must first establish a real, independently authorized, non-GHR invocation from an accepted planning request to the approved planner. It must preserve IDSER-012-03's current no-downstream-effects hard stop unless a later owner receives separate authority to change it. This parent ticket must not create that entrypoint, a scheduler, a test-only fake consumer, or a GHR-to-IDSER continuation.

**Hard stop `IDSER_PRODUCTION_PLANNING_INVOCATION_GAP`:** until that owner supplies a reviewed callable invocation and its identity/lifecycle contract, BSS-V2-014-06 cannot enter GO and cannot claim an active IDSER consumer. This is an ownership gap, not a child defect and not a reason to modify GHR.

## Bounded implementation scope after the hard-stop dependency is closed

1. **Wire only at the legitimate IDSER invocation.** The IDSER owner injects the existing `createIdserCapacityPlanningSnapshotV2ProductionComposition` result into that one real planning invocation. The composition calls only the existing authenticated reader and the approved structural-fit planner. It creates no BSS work, reservation, quota/window mutation, job, transport, GHR delivery/continuation, SEM call, provider send, reconciliation, projection, or semantic truth. `main.ts` must no longer contain an inert `void` composition after the real injection exists.
2. **Make the one v2 reader explicit about view.** Evolve `CapacityPlanningSnapshot/v2` in place, on the same endpoint, principal binding, reader authority, and SQL projection:
   - the isolated candidate view resolves the exact release-selected immutable candidate and returns `qualification.productionActive: false`, candidate profile/revision, canonical fingerprint, and no active-plan assertion;
   - the production-active view resolves only `bridge.active_desired_admission_profile`, joins that exact desired profile to its candidate/allocation/route authority tuple, and returns `qualification.productionActive: true`, `desiredProfileVersion`, `activationRevision`, allocation revision/fingerprint, route-authority revision, and canonical fingerprint;
   - active reads never select the latest candidate. A candidate published after activation is neither an active plan nor a fallback. Missing, foreign, stale, mismatched, or non-qualified state is typed stop/replan with no numeric fallback.

   View selection and expected release identity are server-bound from the authenticated principal/release configuration; no HTTP query parameter, caller-selected profile, route, domain, revision, or fingerprint is accepted. The endpoint remains `/v1/capacity-planning-snapshot`; no parallel read path or v1/v2 adapter is added.
3. **Preserve and gate the existing activation epoch.** Retain `bridge.activate_desired_admission_profile(...)`, its advisory transaction lock, monotonic `activation_revision`, profile/input validation, and active-pointer update as the only activation operation. Replace the unconditional shared-domain-successor rejection only with a release-record lookup performed inside that same locked activation path. The lookup must require one unconsumed, immutable parent release record whose exact domain, desired-profile version, candidate activation revision, expected predecessor active revision, allocation revision/fingerprint, route-authority revisions, effective-policy revision, canonical fingerprint, and v2 consumer readiness fingerprint match the target. The function consumes/binds the record atomically with the existing activation-row and active-pointer write. It must reject absent, stale, already-consumed, wrong-domain/profile/revision/fingerprint, or changed-active-revision records.

   The release record is a parent-owned immutable attestation produced only by the existing controlled release/promotion invocation after it verifies the frozen evidence manifest. It is not a new planner, reader, scheduler, consumer registry, or activation epoch. The parent implementation must identify the existing promotion invocation that writes the attestation; if none exists, stop `RELEASE_ATTESTATION_AUTHORITY_GAP` rather than creating an unauthorised write API or treating a caller-supplied boolean/hash as approval. Direct callers cannot bypass the guard by supplying a self-asserted record.
4. **Bind and verify the release record.** The record is canonical, immutable, and contains at least:

| Binding | Required value |
| --- | --- |
| Release identity | release ID, manifest hash, environment identity, issuance time, attesting promotion identity |
| Target profile | quota domain, desired-profile version, candidate activation revision, expected predecessor activation revision, resulting activation revision |
| BSS authority | provider-capacity profile version, effective-policy ID/version, allocation version/fingerprint, route IDs plus authority revisions, process/workload/estimator/safety identities |
| Consumer readiness | v2-only composition inventory hash, authenticated principal identity, planner invocation identity, candidate-read fingerprint and full-request sizing result |
| Active-read expectation | target canonical fingerprint and the exact profile/revision/fingerprint expected after the epoch commits |
| Evidence | immutable references/hashes for accepted child CK evidence, pre-activation negatives, zero-effect observations, and the independent-review decision |

The record is proof and activation input; it does not grant admission or provider execution.

## Ownership boundaries

| Owner | Owns in this ticket | Must not own |
| --- | --- | --- |
| Parent release closure | frozen manifest, release-record schema/validation, successor gate inside the existing epoch, orchestration evidence and activation procedure | new capacity authority, planner, reader endpoint, scheduler, or environment activation |
| BSS reader/activation owner | one authenticated v2 candidate/active projection and existing epoch locking/activation semantics | IDSER batch sizing, consumer lifecycle, GHR, SEM, provider work |
| IDSER planner-entrypoint owner | the real non-GHR planning invocation and injection of the already-approved v2 consumer | direct BSS SQL, profile activation, capacity synthesis, admission, or downstream execution |
| Release/promotion owner | attests the reviewed manifest through the existing controlled promotion invocation and later runs environment activation | fabricating CK evidence or bypassing the database gate |
| GHR/SEM/NDV1/Better Auth owners | unchanged | any work in this ticket |

## Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| `RC-01406-01` | The v2 consumer is reachable only from the identified, legitimate non-GHR IDSER planning invocation; exactly one production v2 composition exists and `main.ts` has no discarded production composition. If no invocation exists, the ticket stops with `IDSER_PRODUCTION_PLANNING_INVOCATION_GAP`, not a fabricated binding. | Production caller/import/credential inventory; positive invocation fixture; negative no-invocation decision record. |
| `RC-01406-02` | Before activation, the same authenticated reader returns only the exact immutable candidate with `productionActive:false`; it rejects stale/foreign/revision/fingerprint mismatch and exposes no active-plan claim or numeric fallback. | Candidate tuple comparison and negative matrix through the existing endpoint. |
| `RC-01406-03` | A valid, reviewed release record permits only `bridge.activate_desired_admission_profile(...)` to activate its exact successor under its existing lock; direct, absent, stale, consumed, or forged-record calls fail and leave the active pointer unchanged. | PostgreSQL concurrent/negative activation fixture and record-consumption assertion. |
| `RC-01406-04` | After authorized activation, the same reader returns only the active desired profile and exact activation revision/fingerprint. A newer inactive candidate, stale record, changed allocation/authority/policy, or fingerprint mismatch is typed stop/replan and never becomes the active plan. | Post-epoch HTTP/reader fixture with candidate-after-activation and mutation negatives. |
| `RC-01406-05` | The release record binds all required consumer, profile, activation, allocation/authority, policy, and fingerprint values; its manifest is immutable and independently reviewable. | Canonicalization/replay/field-omission/alteration tests and reviewed artifact. |
| `RC-01406-06` | The integrated planning read and release procedure create zero legacy consumer bindings and zero BSS admission/reservation/window/job/transport, GHR continuation/delivery, NDV1 redemption, Better Auth interaction, SEM execution, provider send, reconciliation, projection, or semantic-truth effects. GHR remains `can_continue:false` and `parsed_only`. | Non-inert before/after effect counters, static boundary inventory, and GHR regression. |

## Validation matrix

| Scenario | Expected result |
| --- | --- |
| No non-GHR invocation | `IDSER_PRODUCTION_PLANNING_INVOCATION_GAP`; no new caller, scheduler, or GHR route |
| Exact v2 pre-activation readiness | one authenticated candidate view, exact candidate/revision/allocation/authority/fingerprint, `productionActive:false`, zero effects |
| Pre-activation activation attempt | rejected by the existing epoch guard; no active-pointer or activation-row change |
| Missing/foreign/stale/consumed record | activation rejected; no state change |
| Authorized release record | existing epoch activates exactly its target and consumes/binds the record under the same lock |
| Post-activation read | same endpoint/reader returns exact active profile and activation revision with `productionActive:true` |
| Newer inactive candidate / changed authority, allocation, policy, or fingerprint | typed stop/replan; no latest-candidate-as-active behavior or numeric fallback |
| Legacy inventory | zero executable v1 consumer, adapter, dual-read, prospective conversion, alternate BSS reader, or direct BSS SQL |
| Forbidden effects | zero listed effects; GHR is still `can_continue:false` and `parsed_only` |

## SecurityReadiness

- **Status:** `applicable`.
- `SR-01406-T1`: immutable candidate/release evidence crosses into the existing activation epoch.
- `SR-01406-T2`: authenticated BSS projection crosses into the sole IDSER planning invocation.
- `SR-01406-A1`: activation revision, allocation/policy/authority revisions, fingerprints, and promotion attestation are sensitive release authority.
- `SR-01406-C1`: prohibit caller-selected activation identity, direct guard bypass, untrusted self-attestation, alternate reader/SQL, v1 compatibility, and latest-candidate-as-active resolution.
- `SR-01406-C2`: prohibit GHR continuation, NDV1, Better Auth, SEM/provider execution, and all admitted-work effects.
- `SR-01406-R1`: `RC-01406-02..05` independently test revision/fingerprint fencing and epoch-only activation; `SR-01406-R2` binds `RC-01406-01` and `RC-01406-06` to invocation and zero-effect inventory.

## GO boundary

Independent review must first confirm the two precise ownership findings, the immutable record/evidence design, epoch-lock preservation, single-reader active resolution, and all GHR exclusions. Only after the non-GHR invocation and attestation authority are independently established may a separate explicit GO authorize implementation. Environment-specific production activation remains a separate post-CK release operation.

## Amendment 001 — corrected BSS implementation and activation dependencies

**Effective authority:** [BSS-V2-014-06 GO-dependency planning amendment 001](../../../feedback/BSS-V2-014-06-go-dependency-planning-amendment-001.md), issued under [HMN-BSS-V2-014-06-001](../../../feedback/BSS-V2-014-06-hmn-001.md) and frozen by [replacement contract freeze 001](../../../feedback/BSS-V2-014-06-go-dependency-replacement-contract-freeze-001.md). This append-only amendment supersedes only the historical separate-IDSER-trigger GO dependency and the treatment of missing release-attestation authority as a blanket BSS implementation blocker.

The approved v2-only IDSER-to-BSS authenticated-reader composition and its exact candidate-read readiness are sufficient BSS integration evidence. It does not claim that IDSER live planning is executing. Future GHR-to-IDSER initiation remains separately owned, inactive, and outside this ticket; neither GHR nor a new scheduler, fake entrypoint, or alternate consumer may be used to manufacture a trigger.

BSS implementation may, after independent review and a separate explicit GO, implement only the replacement freeze's release-capable rows: one-reader candidate/active semantics, exact active-profile resolution, composition/readiness proof, and fail-closed rejection of absent or self-asserted activation evidence. `RELEASE_ATTESTATION_AUTHORITY_GAP` remains a production-activation `BLOCKED_AUTHORITY`: until a real controlled attestation authority is independently authorized and proven, the existing epoch must reject the v2 successor and no positive activation or production-active claim is allowed.

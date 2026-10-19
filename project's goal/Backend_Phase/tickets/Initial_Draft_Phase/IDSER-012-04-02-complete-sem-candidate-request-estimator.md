# IDSER-012-04-02 — Complete SEM candidate-request estimator

- **State:** `awaiting_review`; GO implementation is recorded at `3de09b92996abef5bde7832530f3c12bdf0b2f5d` and awaits independent CK.
- **Batch:** `IDSER-BATCH-12-04-02`.
- **Parent:** [IDSER-012-04 split map](IDSER-012-04-canonical-sem-request-sizing-immutable-locator-handoff-and-reconstruction.md).
- **Dependencies:** `IDSER-012-04-01` CK `PASS`; established SEM prompt/response-schema and BSS estimator-configuration identities.

## Outcome

Implement one deterministic conservative measurement of a fully composed prospective SEM request for one already-selected candidate packet. **STOP before BSS fit/partition, persistence, GHR, reconstruction, or execution.**

## Authorized scope

Compose the actual SEM system prompt, `-04-01` canonical `sourceSpecification`, applicable response-schema allowance, bounded framing allowance, permitted selected-media transport allowance, and configured safety margin. Freeze `ConservativeLogicalRequestBytes/v1`:

```text
estimatedRequestBytes = systemPromptBytes + sourceSpecificationBytes + schemaAllowanceBytes
  + framingAllowanceBytes + mediaTransportAllowanceBytes + requestByteSafetyMargin
estimatedTextTokens = ceil(textBearingRequestBytes / inputBytesPerToken)
estimatedInputTokens = estimatedTextTokens + estimatedImageTokens + inputTokenSafetyMargin
prospectiveTokenDemand = estimatedInputTokens + reservedOutputTokens
```

The result carries `requestBytes`, `inputTokens`, `reservedOutputTokens`, applicable existing `RequestResourceEnvelope`, and pinned prompt/schema/estimator/configuration provenance. Output reservation is excluded from `inputTokens`, is included once in the envelope under established BSS policy, and never represents incoming request bytes. This is logical request sizing, not exact HTTP-wire or provider-token prediction. Do not create a second BSS planner, call the BSS reader, partition, or send a provider request.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-0120402-01` | Measurement uses the actual canonical packet and actual prompt/schema identities; fixed overhead is counted once and selected source content is not counted again. |
| `RC-0120402-02` | Byte/token arithmetic follows the frozen formulas; `inputTokens` excludes reservation, reservation enters the resource envelope exactly once, and inconsistent/overflowing configuration fails closed. |
| `RC-0120402-03` | Changed canonical packet, media selection, framing/schema allowance, or pinned estimator configuration changes measurement deterministically with versioned provenance. |
| `RC-0120402-04` | The estimator makes no exact-provider-token claim and creates zero BSS reads/writes, plan records, GHR effects, SEM calls, or source-content storage. |

## SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-0120402-B1` preserves SEM prompt authority and BSS-owned estimator/profile registration.
- **Trust / sensitive assets:** `SR-0120402-T1` canonical packet and pinned configuration → conservative in-memory demand; `SR-0120402-A1` covers packet and profile hashes, not raw corpus export.
- **Prohibited couplings:** `SR-0120402-C1` prohibits BSS quota planning, admission, provider transport, and a second packet compiler.
- **Verification / unresolved policy:** `SR-0120402-V1` requires accounting-boundary and changed-input tests; `SR-0120402-U1` leaves image accounting unavailable rather than estimating it without authorized policy.
- **Review binding:** `SR-0120402-R1` verifies `T1/C1` with deterministic arithmetic/provenance fixtures and zero-side-effect evidence.

## Evidence and hard stop

Record formulas, bounded configuration identity/hash, inputs as hashes/counts only, and demand outputs. Missing valid estimator/profile configuration is `SEM_BATCH_ESTIMATOR_GAP` or the owning BSS configuration gap; it does not authorize synthetic limits. CK `PASS` exposes a pure estimator only to `-04-03`.

# SEM-CUTOVER-007 — Canonical offline stepwise worker composition and replay

**Status:** `planned` · **Size:** M · **Owner:** extraction-specific worker/composition seam, offline fake only · **Dependencies:** 006 independent CK PASS and all approved new packet/envelope/sidecar interfaces. Explicit GO required.

## Exact objective

Replace the legacy **extraction** invocation in `apps/agents-bridge/src/semantic-worker.ts` with a single explicitly selected stepwise successor path. Wire prepared prompt + owned/context packet + verified ephemeral media (when present) + neutral typed multipart + resource preflight + strict REL envelope parsing + canonical finalizer + provisional sidecar + existing fenced winner/replay. Keep reconciliation's generic skill and string-message API untouched. No live route/provider/admission is enabled by this ticket.

## Implementation guardrails

- Inject a provider-neutral stepwise capability through the composition root; never branch on `route.providerId` inside the worker. Do not cast Anoman-specific multipart into `StructuredReasoningProvider.structured()`; use an explicitly qualified typed capability seam. If the neutral shared interface must change, STOP for owner HMN rather than hiding new ownership here.
- One authored profile ID/hash selected before dispatch for **both zero-visual and image-bearing** RUN-003 documents; no silent legacy/profile fallback, no 'if image then use stepwise' dispatch.
- Resolve visual bytes solely through previously approved exact-source grants/hydration; verify byte length, digest, type and dimensions. No raw media/base64/secret stored in jobs, SQL, replay or log artifacts.
- `preflightMultimodalRequest()` is a request-spec/estimator interface only, **not admission permission**. Unknown image TPM yields `RESOURCE_ENVELOPE_BLOCKED`. Later IDSER-012-02-01 owns exact `RequestResourceEnvelope`, later BSS-V2-005/006 own admission. Consequently positive fake integration may use controlled provisioned resource fixtures, but cannot claim live provider readiness.
- Stage/replay both semantic result and sidecar in an authorized atomic/idempotent manner; if the already protected REL-03/persistence owner must change, stop for separate permission and incorporate it as an explicit dependency. A replay winner cannot trigger a second provider execution.
- Preserve canonical D1 STOP at `perceived` with zero semantic execution/jobs even while the future worker code exists.

## Review contract

| ID | PASS iff | Negative |
|---|---|---|
| RC-007-01 | Exactly one stepwise request path used in deterministic fake extraction of text-only and image-bearing source fixtures | Attempted old prompt/default or image-dependent fallback fails canonical admission |
| RC-007-02 | Multipart typed fake receives exact authorized owned source/asset references and remains neutral across adapters | Wrong asset SHA, missing grant, unsupported capability, oversize, unknown profile rejected pre-dispatch |
| RC-007-03 | Strict REL envelope parsed; provisional revisions materialized; independent candidate finalized; no accepted context minted | Forged relationship, uppercase schema, extra field, missing owned slot fail before staging |
| RC-007-04 | Idempotent staging/lease fencing/ack-loss/restart/cancel preserve winner and sidecar identity, no duplicate effect | Stale claim, stage mismatch, delivery failure, abort are instrumented |
| RC-007-05 | All denied routes have zero provider/admission/job side effects under **working non-inert counter fakes** with positive control | Empty arrays without instrumented effect boundary DO NOT count |
| RC-007-06 | Normal canonical D1 remains `perceived` without semantic jobs/accepted Master; reconciliation unchanged | No automatic provider key/route enabling or new background execution |

## Testing and terminal

Compose tests must use isolated resources only, never accepted `atlas-canonical-perception` DB/volumes. Zero external calls. Verify source/packet/provider/finalizer imports, resource bounds, service credentials, replay and strict trace. If fulfilling this requires scope crossing provider-neutral API/REL-03 DB ownership, stop `OWNERSHIP_CONFLICT_BLOCKED` and request a narrow sub-ticket.

**Terminal:** `READY_FOR_CK` after positive/negative tests; independent CK PASS unlocks final 03-05 review, not live provider enablement.

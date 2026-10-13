# SEM-CUTOVER-006 — BSS-V2-004-03-05 CK-001.a/b contextual trust remediation

**Status:** `planned` · **Size:** M · **Owner:** 03-05 deterministic finalizer only, bounded independent CK findings · **Dependencies:** 005 CK PASS plus **specific HMN/CFC authorization** for existing `BSS-V2-BATCH-04.03-05-298021d-review.md` `CK-001.a/b`. **GO is not implied by this ZIP**.

## Exact objective

Close the **real defect**: current `AcceptedContextEvidence` trusts `{ownedSourceSlot, contextSourceSlot}` pair after checking roles alone. Replace this weak claim with a verifier-derived immutable accepted-context binding, or an equivalent trusted reference to a validator's **actual authorization decision**, matched against exact execution, document, source SHA, asset identity/hash, lineage/revision, necessity and ownership. Keep proposals strictly provisional. Human confirmation is **not** an extraction-time requirement; the accepted-context positive fixture simulates the later issuer only for offline gate qualification.

## Correct scoped behavior

1. Pure deterministic finalizer parses existing strict provider proposal; exact owned slot coverage; Atlas-only local IDs/evidence; canonical V1 parse before any stage.
2. If a verified/accepted relationship exists and matches exact trusted slot/map/grant/attestation, a table-owned candidate may get table+visual evidence with one canonical meaning, not an extra visual-owned assertion.
3. If relationship is only `proposed`/`unresolved`, do **not** attach contextual visual evidence to a canonical candidate. Independent candidates proceed; dependent interpretations remain in the approved provisional outcome/sidecar. Missing essential trust blocks **the dependent authoritative decision only**.
4. Malformed/foreign/expired/duplicate/revoked/wrong-source/wrong-image authorization must fail at the trust boundary; never repair by treating proposal as accepted.
5. Source wording, question evidence and provider meaning remain untouched; existing replay/fencing/reconciliation remains intact. Finalizer never becomes a policy issuer.

## Owner boundaries

Expected: `apps/agents-bridge/src/semantic-extraction-finalizer.ts` and *focused* finalizer tests only, plus exact new approved trusted port/type if the approved HMN names an owner. No worker/main, adapter, compiler, grant, DB migration, REL-03 candidate, resource admission, schema rewrite, live provider or Master change. If the fix actually needs any separately mutable trust/authority owner, STOP for HMN split.

## Review contract (original CK findings remain authoritative)

| ID | PASS iff |
|---|---|
| RC-006-01 / CK-001.a | Contextual evidence is accepted only from exact validated accepted relationship and authorization, not caller-supplied pair; reject forged, foreign, stale, duplicate, unsupported, mismatched, revoked identities before canonical output |
| RC-006-02 / CK-001.b | Accepted optional/essential context yields correct same-candidate table/legend evidence; missing essential never silently drops, invents `non_fact` or makes an unrelated unit fail |
| RC-006-03 | Proposed/unresolved REL-01/02 relationship stays provisional with no trusted evidence; independent semantic candidate/source accounting stays valid |
| RC-006-04 | Duplicate-run deterministic IDs and trusted wording/evidence/origin; illegal uppercase schema, rogue locator, dangling and missing slots fail |
| RC-006-05 | No provider-specific imports, reconciliation changes, staging side effects or normal D1 semantic activity |

**Special review rule:** Do not reclassify `CK-001.a/b` as non-findings or silently narrow the original CK oracle. If successor contract realignment changes the expected outcome, reference the **approved additive amendment**, show original-vs-successor mapping, test both retained security invariants and new nonblocking behavior, and request independent re-review of the **exact candidate SHA**.

**Terminal:** bounded `READY_FOR_CK` after actual code/tests or `OWNERSHIP_CONFLICT_BLOCKED`; only independent CK can close findings.

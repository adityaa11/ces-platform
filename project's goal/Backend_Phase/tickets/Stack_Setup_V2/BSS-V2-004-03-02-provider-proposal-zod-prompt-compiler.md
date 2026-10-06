# BSS-V2-004-03-02: Provider proposal Zod and PROMPT-003 production compiler

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.03-02`
- **Dependencies:** BSS-V2-004-03-01 CK `PASS`; approved PROMPT-003 artifacts and CK `PASS`; explicit `go`
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§4–6, 9.02, 10, 13, 15
- **Qualification reference:** [PROMPT-003 integrated offline qualification CK PASS](../../../feedback/SEM-ANM-PROMPT-003-BATCH-03-603ecca-review.md). This reference is evidence for prompt behavior, not production runtime code.

## Outcome

Create a provider-facing extraction proposal Zod projection that reuses canonical Semantic V1 meaning components, and productionize a deterministic provider-independent compiler equivalent to the CK-approved PROMPT-003 prompt.

## Scope and forbidden work

Own provider proposal Zod, cross-field semantic composition policy, descriptions derived from the canonical schemas, deterministic system-prompt compilation, provenance/profile identity, generated portable provider schema, and byte/structural differential evidence against the qualified PROMPT-003 artifacts. The compiler accepts a profile and proposal schema; it has no provider argument. Keep fixed behavioral policy visibly distinct from Zod-owned semantic instruction.

Do not duplicate kind descriptions in another enum table; import spike files at production runtime; call Anoman/Gemini; read `DocumentStore`; create Atlas IDs/evidence or final Semantic V1 results; change canonical Semantic V1; add provider-specific prompt compilers; or copy provider transport behavior into this package. PROMPT-003/SPIKE-004 remain qualification references only. Preserve historical terminal `FAIL` for SPIKE-004 and its CK decision.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040302-01 | Proposal schema is a projection of canonical Semantic V1 meaning components, without duplicate semantic vocabulary. | Schema-source graph and generated-schema inspection. **PASS iff** meaning descriptions have one canonical owner. | contracts schema tests |
| RC-BSSV2-0040302-02 | Compiler has no provider input and deterministically renders the approved PROMPT-003-equivalent instruction structure. | Two-build byte equality, exact section/provenance differential against approved PROMPT-003, and static signature/import checks. **PASS iff** provider choice cannot affect prompt construction. | compiler differential tests |
| RC-BSSV2-0040302-03 | Generated provider compatibility schema is derived; final Atlas validation remains stronger and authoritative. | Schema generation/compile checks plus negative tests for nonportable constraints. **PASS iff** no manual schema drift or weakened local validation is possible. | BSS-V2-003 schema compatibility |
| RC-BSSV2-0040302-04 | Production runtime has no dependency on spike implementation or qualification-only data. | Dependency boundary and artifact provenance inspection. **PASS iff** spike paths are absent from production imports and generated artifacts identify frozen sources. | prompt package boundary |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-0040302-SEMANTIC-PROMPT-AUTHORITY` — Atlas composes semantic instructions from canonical schemas before provider execution.
- **Trust boundary:** `TRUST-BSSV2-0040302-PROMPT-PROJECTION` — generated provider schema/prompt are bounded projections and do not accept or authorize Atlas truth.
- **Sensitive asset:** `ASSET-BSSV2-0040302-PROMPT-PROVENANCE` — frozen semantic instructions and their source identities must remain attributable.
- **Extension seam:** `SEAM-BSSV2-0040302-STATIC-POLICY-PROVENANCE` — fixed cross-field policy, schema descriptions and profile identity remain independently inspectable.
- **Prohibited coupling:** `COUPLING-BSSV2-0040302-PROVIDER-PROMPT` — provider ID, transport, spike runtime, fixture content or reconciliation behavior cannot influence compilation.
- **Verification seam:** `VERIFY-BSSV2-0040302-EXACT-DIFFERENTIAL` — deterministic artifacts and exact differential oracle against approved PROMPT-003.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040302-PROVIDER-SCHEMA-USE` — each adapter's use/enforcement of generated schema hints remains separately qualified.
- **Review binding:** `REV-READY-BSSV2-0040302-01` verifies source ownership, generated identity, exact differential, determinism and forbidden-import checks.

## Validation and handoff

Run proposal/schema/compiler tests, exact PROMPT-003 artifact comparisons and affected package typechecks in Docker Compose. Preserve immutable PROMPT-003 inputs and hashes; do not regenerate or alter its historical artifacts. Record exact evidence. On PASS, mark `awaiting_review` and stop for CK. Hard stop: deterministic prompt and proposal schema exist offline; no provider call.

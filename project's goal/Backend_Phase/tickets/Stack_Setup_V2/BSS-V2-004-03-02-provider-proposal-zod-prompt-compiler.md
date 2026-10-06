# BSS-V2-004-03-02: Provider proposal Zod and PROMPT-003 production compiler

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.03-02`
- **Dependencies:** BSS-V2-004-03-01 CK `PASS`; approved PROMPT-003 artifacts and CK `PASS`; explicit `go`
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§4–6, 9.02, 10, 13, 15
- **Qualification reference:** [PROMPT-003 integrated offline qualification CK PASS](../../../feedback/SEM-ANM-PROMPT-003-BATCH-03-603ecca-review.md). It preserves compiler architecture and fixed-policy evidence; it is not production runtime code or the post-03-01 authority for schema-derived text.

## Outcome

Create a provider-facing extraction proposal Zod projection that reuses the CK-approved BSS-V2-004-03-01 canonical Semantic V1 meaning components, and productionize a deterministic provider-independent compiler. Historical PROMPT-003 remains the qualified design reference for compiler structure and frozen static policy; 03-01 governs all schema-derived production content. This retains `atlas.semantic.extract/v1`; it does not create Semantic V2.

## Scope and forbidden work

Own provider proposal Zod, cross-field semantic composition policy, descriptions regenerated from the approved 03-01 canonical schemas, deterministic system-prompt compilation, provenance/profile identity, generated portable provider schema, and bounded structural differential evidence against qualified PROMPT-003 artifacts. The compiler accepts a profile and proposal schema; it has no provider argument. Keep fixed behavioral policy visibly distinct from Zod-owned semantic instruction. New production prompt/schema/provenance hashes are expected and must bind the approved 03-01 authority, this compiler, and frozen static policy; they must not be required to equal historical PROMPT-003 hashes.

Do not duplicate kind descriptions in another enum table; import spike files at production runtime; call Anoman/Gemini; read `DocumentStore`; create Atlas IDs/evidence or final Semantic V1 results; change canonical Semantic V1; add provider-specific prompt compilers; or copy provider transport behavior into this package. PROMPT-003/SPIKE-004 remain qualification references only. Preserve historical terminal `FAIL` for SPIKE-004 and its CK decision.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040302-01 | Proposal schema and every schema-derived semantic description are projections of approved 03-01 canonical Semantic V1 Zod, without duplicate semantic vocabulary or copied historical descriptions. | Schema-source graph and generated schema/prompt provenance trace every schema-derived description to 03-01. **PASS iff** canonical Zod is the sole production semantic-description owner. | contracts schema tests |
| RC-BSSV2-0040302-02 | Compiler has no provider input and deterministically renders the 03-01-derived semantic profile while preserving PROMPT-003-qualified section ordering, ownership, static-policy separation, authority exclusions, and leakage exclusions. | Two builds from identical 03-01 schema/profile inputs are byte-identical; structural section/provenance and static signature/import checks compare PROMPT-003 design properties, not historical schema-derived bytes. **PASS iff** provider choice cannot affect prompt construction. | compiler differential tests |
| RC-BSSV2-0040302-03 | Generated provider compatibility schema is derived; final Atlas validation remains stronger and authoritative. | Schema generation/compile checks plus negative tests for nonportable constraints. Generated artifact identities bind 03-01 authority, compiler, and frozen static policy. **PASS iff** no manual schema drift or weakened local validation is possible. | BSS-V2-003 schema compatibility |
| RC-BSSV2-0040302-04 | Frozen PROMPT-003 cross-field policy remains byte-identical and production runtime has no dependency on spike implementation or qualification-only data. | Policy-byte comparison, dependency-boundary inspection, and artifact provenance inspection. **PASS iff** static policy/placement/ownership are retained, spike paths are absent from production imports, and only new production artifact hashes are emitted. | prompt package boundary |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-0040302-SEMANTIC-PROMPT-AUTHORITY` — Atlas composes semantic instructions from canonical schemas before provider execution.
- **Trust boundary:** `TRUST-BSSV2-0040302-PROMPT-PROJECTION` — generated provider schema/prompt are bounded projections and do not accept or authorize Atlas truth.
- **Sensitive asset:** `ASSET-BSSV2-0040302-PROMPT-PROVENANCE` — frozen semantic instructions and their source identities must remain attributable.
- **Extension seam:** `SEAM-BSSV2-0040302-STATIC-POLICY-PROVENANCE` — fixed cross-field policy, schema descriptions and profile identity remain independently inspectable.
- **Prohibited coupling:** `COUPLING-BSSV2-0040302-PROVIDER-PROMPT` — provider ID, transport, spike runtime, fixture content or reconciliation behavior cannot influence compilation.
- **Verification seam:** `VERIFY-BSSV2-0040302-CANONICAL-DIFFERENTIAL` — deterministic 03-01-derived artifacts, exact frozen-static-policy proof, and structural PROMPT-003 design differential.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040302-PROVIDER-SCHEMA-USE` — each adapter's use/enforcement of generated schema hints remains separately qualified.
- **Review binding:** `REV-READY-BSSV2-0040302-01` verifies 03-01 source ownership, generated identity, frozen-static-policy equivalence, structural differential, determinism and forbidden-import checks.

## Validation and handoff

Run proposal/schema/compiler tests, two-build production determinism checks, PROMPT-003 structural/frozen-policy comparisons, and affected package typechecks in Docker Compose. Preserve immutable PROMPT-003 inputs and hashes; do not regenerate or alter its historical artifacts. Record the new production identities and their 03-01/compiler/static-policy bindings. On PASS, mark `awaiting_review` and stop for CK. Hard stop: deterministic prompt and proposal schema exist offline; no provider call.

# BSS-V2-004-03-03: NormalizedDocument source-unit and user-prompt pipeline

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.03-03`
- **Dependencies:** BSS-V2-004-03-01 and -02 CK `PASS`; BSS-V2-004-02 `NormalizedDocument v1` boundary; explicit `go`
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§5–6, 9.03, 10, 12–13

## Outcome

Convert an accepted `NormalizedDocument v1` into a deterministic, bounded, provider-neutral reasoning packet containing source units/slots and the extraction user prompt. Establish complete source accounting before any provider call can occur.

## Scope and forbidden work

Own stable temporary slot IDs, deterministic enumeration and ordering of source units, slot-to-page/locator/source mapping, text-block and table handling, meaningful/labeled visual-region handling where required by current acceptance, bounded user payload/prompt generation, and the source-accounting completeness gate. The reasoning packet combines this output with the production extraction profile/compiler result while containing no provider-specific endpoint or SDK values.

Do not classify semantic kind; call a provider; create Atlas candidate IDs; invent/alter evidence or source wording; alter `NormalizedDocument v1`; access `DocumentStore`; or depend on a fixed four-slot S1–S4 assumption. Provider-returned source references remain untrusted and must be checked against this exact map downstream.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040303-01 | The same `NormalizedDocument v1` produces the same ordered source units, stable temporary IDs, source mappings and packet bytes. | Repeat-build tests across text, table and accepted visual regions. **PASS iff** outputs are deterministic with no network or mutable identity source. | source-unit builder tests |
| RC-BSSV2-0040303-02 | Every eligible source unit is represented or explicitly rejected under frozen limits before provider invocation. | Completeness accounting and boundary/overflow tests. **PASS iff** omitted, duplicate, dangling or over-bound units fail closed. | source-accounting tests |
| RC-BSSV2-0040303-03 | Temporary slots map exactly to page/locator/source evidence without minting trusted Atlas identities. | Mapping round-trip and invalid-reference tests. **PASS iff** every output reference resolves to the originating normalized unit. | NormalizedDocument fixtures |
| RC-BSSV2-0040303-04 | The builder is provider-neutral and does not classify/extract/finalize meaning. | Static import and bounded responsibility inspection. **PASS iff** no provider SDK/ID generation/semantic classifier or repair path is present. | import-boundary checks |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-0040303-NORMALIZED-SOURCE` — accepted Docling-normalized output is the sole perception input; source authorization remains upstream at BSS-009.
- **Trust boundary:** `TRUST-BSSV2-0040303-PROVIDER-SOURCE-REFERENCES` — slot IDs and later provider references are temporary/untrusted until resolved against Atlas's local source map.
- **Sensitive asset:** `ASSET-BSSV2-0040303-SOURCE-CONTENT` — normalized source text/locators may contain confidential customer material.
- **Identity context:** `IDENTITY-BSSV2-0040303-SOURCE-LOCATOR-MAP` — preserve page/locator lineage and bounded execution context through packet construction.
- **Extension seam:** `SEAM-BSSV2-0040303-SOURCE-PACKET-BOUNDS` — limits and accounting are explicit before future provider privacy/admission controls.
- **Prohibited coupling:** `COUPLING-BSSV2-0040303-SEMANTIC-AUTHORING` — source preparation does not create meaning, evidence, candidate IDs, or provider-specific request policy.
- **Verification seam:** `VERIFY-BSSV2-0040303-DETERMINISTIC-COMPLETENESS` — repeatability, exact mapping, completeness, negative/overflow checks.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040303-SOURCE-RETENTION` — retention/residency policy remains outside this child.
- **Review binding:** `REV-READY-BSSV2-0040303-01` verifies source lineage, deterministic bounds and provider-free construction from local fixtures.

## Validation and handoff

Use synthetic or repository-approved non-confidential `NormalizedDocument v1` fixtures. Run focused builder/accounting tests and typechecks in Docker Compose. No external call is permitted. On PASS, mark `awaiting_review` and stop for CK. Hard stop: a fixture document deterministically produces the complete provider-neutral packet offline.

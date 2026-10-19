# IDSER-012-04-01 — Canonical SEM batch packet builder

- **State:** `planned`; GO is required.
- **Batch:** `IDSER-BATCH-12-04-01`.
- **Parent:** [IDSER-012-04 split map](IDSER-012-04-canonical-sem-request-sizing-immutable-locator-handoff-and-reconstruction.md).
- **Dependencies:** approved IDSER-012 semantic-batch-planner terminal interfaces; accepted-document and existing SEM source-packet boundaries.

## Outcome

Add one shared, deterministic batch-selection capability to `buildStepwiseSourcePacket()`. It creates the canonical SEM `sourceSpecification` for an exact authorized selection while preserving the existing whole-document path. **STOP before estimation, BSS fit, plan persistence, GHR compatibility, SEM reconstruction, or any execution.**

## Authorized scope

Accept a verified accepted `NormalizedDocument V1`, exact owned locators, authorized context-only locators, verified media identities, validated relationship inputs, and deterministic ordering. Resolve every selected locator from the supplied document; reject foreign, missing, duplicate, malformed, or unauthorized selections. Include exactly selected source units, retain original text/table content and Docling grid metadata, retain visual identity metadata without hydrating image bytes, and assign deterministic source slots.

Emit the existing canonical `sourceSpecification`, its exact UTF-8 serialization, and SHA-256. The whole-document caller remains byte/behavior compatible. Do not add an IDSER serializer, provider client, BSS interaction, storage schema, or persisted source content. `rel: { state: "unavailable" }` cannot justify invented relationships or context ownership.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-0120401-01` | Same verified document, selection, media identities, and relationship authority yields byte-identical packet text and SHA-256; changed selection changes the packet appropriately. |
| `RC-0120401-02` | Foreign, missing, duplicate, malformed, unauthorized owned/context selection and invalid media/relationship inputs reject before packet emission. |
| `RC-0120401-03` | Selected text/table content, grid metadata, authorized context, deterministic slots/order, and visual identities are preserved exactly without persisted image bytes. |
| `RC-0120401-04` | Existing whole-document packet tests remain passing and no second packet serializer or downstream side effect is introduced. |

## SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-0120401-B1` keeps SEM as the sole canonical packet owner and Atlas as accepted-document authority.
- **Trust / identity:** `SR-0120401-T1` verified document plus authorized selection/media/REL inputs → in-memory packet; opaque locators never establish authority.
- **Prohibited couplings:** `SR-0120401-C1` prohibits a second serializer, direct store access, provider/BSS use, or raw source/media persistence.
- **Verification / unresolved policy:** `SR-0120401-V1` requires selection-rejection and deterministic whole-document compatibility tests; `SR-0120401-U1` leaves unavailable REL and image-token policy unresolved.
- **Review binding:** `SR-0120401-R1` verifies `T1/C1` through deterministic byte/hash, invalid-selection, and zero-side-effect test evidence.

## Evidence and hard stop

Record packet/version identities, selected-locator hashes, deterministic output hashes, and synthetic/non-confidential fixture evidence only. A missing accepted-document or authorization boundary is `BLOCKED_AUTHORITY`, never justification for a second source resolver. CK `PASS` exposes only this builder interface to `-04-02`.

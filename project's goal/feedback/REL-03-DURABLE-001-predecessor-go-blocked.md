# GO blocked — REL-03-DURABLE-001 predecessor contract batch

- Ticket: `REL-03-DURABLE-001` — fenced durable composite staging and replay
- Authorization: `HMN-REL-03-DURABLE-001-006`
- Branch: `codex/new-atlas-backend`
- Outcome: `OWNERSHIP_CONFLICT_BLOCKED`

## Pre-implementation interface check

The authorized predecessor interfaces can establish **completeness relative to
the exact supplied request and strictly parsed provider proposal**:

- `parseStepwiseRelationshipEnvelope()` enumerates and requires the request's
  owned slots, and bounds every provider candidate to that map.
- `prepareStepwiseRel03Interoperability()` can preserve strict parsing,
  lineage, provenance, revision identity, and tuple classification.
- A SEM-006 projection can receive `request.sourceSlots`, which contain the
  source wording needed for canonical evidence; a locator-only projection is
  not required.

They cannot establish **authenticity of that request relative to the original
authorized normalized document**. `StepwiseRelationshipEnvelopeRequest` is a
plain structural value with caller-owned `sourceSlots`, `sourceSpecification`,
and hashes. Its builder verifies only
`sha256(packet.sourceSpecification) === packet.sourceSpecificationSha256` and
then recomputes `requestSha256`; strict parsing trusts that supplied slot map.
Neither the request nor the HMN-006-owned interfaces carries an authority
attestation, immutable source-owner handle, or verifier capable of binding
those bytes to the original authorized normalized document.

Consequently, a caller can construct a different normalized-document-shaped
packet with changed source wording/slots, recompute `sourceSpecificationSha256`
and `requestSha256`, and obtain a self-consistent strict parse and REL-03
qualification. Recomputed hashes prove the altered request's internal
consistency, not original-source authenticity.

## Smallest reproducible counterexample

1. Start with an authorized normalized document whose ready text slot is
   `"Original source."`.
2. Construct another valid normalized-document-shaped input using the same
   snapshot identity but the ready text slot `"Forged source."`.
3. Call `buildStepwiseSourcePacket()` and
   `buildStepwiseRelationshipEnvelopeRequest()` on the altered input.
4. Submit a provider envelope whose source-result slot matches the altered
   request. `parseStepwiseRelationshipEnvelope()` accepts it because it checks
   the supplied map, while the recomputed source-specification/request hashes
   also match.

No REL-03, SEM-005, or SEM-006 operation authorized by HMN-006 can distinguish
this packet from one derived from the original authorized document.

## Review contract matrix

| Row | Original authority | Implemented change | Positive test | Adversarial negative | Observed outcome | Remaining limitation |
| --- | --- | --- | --- | --- | --- | --- |
| `RC-PRED-01` | HMN-006 REL-03 handoff; existing strict parser | None — stopped before code | Existing strict parser can account for an exact supplied request/proposal | Recomputed request/source hashes after changing caller-held source bytes | Self-consistent altered request remains structurally admissible | No independently verifiable original-source authority handoff. |
| `RC-PRED-02` | HMN-006 SEM-006 projection | None — stopped before code | `request.sourceSlots` include text/table content for canonical evidence | Locator-only input would fail finalizer evidence production | Source content is available if the request is trusted | Content is still caller-held; its original-document authenticity is not verifiable here. |
| `RC-PRED-03` | HMN-006 SEM-005 qualified accounting | None — stopped before code | Exact supplied request/proposal can derive complete source and candidate universes | Smaller caller arrays can be rejected against that supplied universe | Completeness can be proved relative to request/proposal | It cannot promote the request into independent proof of original source authority. |

## Required decision

The smallest missing owner contract is an authenticated source-authority
handoff from the normalized-document/authorized-source owner. It must bind the
original authorized document (including source content/slot map, snapshot, and
asset identities) to a verifier or opaque authority artifact consumable by the
predecessor sequence. That owner is outside HMN-006's seven-file allowlist.

No code, tests, durable replay, migrations, SQL, worker/provider path,
accepted-context authority, publication, Master, RUN-003 resource, or
`SEM-CUTOVER-007` material was modified. `REL-03-DURABLE-001` remains
`awaiting_review`; `SEM-CUTOVER-007` remains blocked.

# IDSER-012-05-06 — Visual semantic-result completion

- **State:** `planned`; executable leaf only after explicit GO and IDSER-012-05-05 CK `PASS`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Scope

Complete the existing response parser, REL-03 projection, finalizer, staging, and composite replay path for authorized visual result slots. A selected independently owned visual is extraction-eligible and yields exactly one valid `candidate` or bounded `non_fact` accounting result; selected contextual media remains context-only. Permit image-only/unlabelled evidence without fabricated text: retain verified locator grounding and optional absent `source_wording`, plus normalized meaning, payload, uncertainty, questions, and `needs_resolution`.

## Upstream contract and actual visual provenance

-05-01 owns the *frozen* request/slot/manifest contract: independently owned selected visuals are extraction-eligible `owned_source` with verified media even while `pending_unexamined_visual` remains an examination state; selected contextual visuals remain context-only and may still be attached. Parser, REL-03 and finalizer must accept those specific source slots **without changing** packet bytes/hashes after -05-01/-05-03 qualification. No requirement for a fabricated label or trusted textual `source_wording` on visual-only candidates; use verified visual locator evidence. Selected contextual images may not produce independent candidate source_results.

Terminal image acceptance must use the *original* five Safara professional PNGs from the existing accepted `NormalizedDocument V1` in `atlas-canonical-perception` (SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`) via an isolated qualification snapshot. Synthetic provider responses may test semantic result branches, but cannot substitute for the actual normalized source or original image attachments.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-06-01` | Image-only owned candidate, image-only bounded `non_fact`, and mixed owned/contextual responses traverse production parser, REL-03, finalizer, staging, and replay with exact visual locators. |
| `RC-01205-06-02` | A visual lacks no required fabricated textual wording; optional absent wording does not erase visual grounding or semantic uncertainty. |
| `RC-01205-06-03` | Foreign slot, renamed/substituted slot, context-only-as-owned slot, failed attachment, and unresolved/unsupported response fail explicitly and are never silently classified as `non_fact`. |

## Boundaries and workflow

This leaf consumes fake transport responses and existing semantic contracts; it cannot alter provider composition, grants, immutable records, acceptance/publication authority, reconciliation, Master, or CES. CFC repairs only the cited result-accounting seam. HMN is required for an impossible existing parser/finalizer representation; it cannot invent a caption, promote contextual authority, or accept provider output without the authorized slot.

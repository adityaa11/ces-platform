# IDSER-012-05-06 — Visual semantic-result completion

- **State:** `planned`; executable leaf only after explicit GO and IDSER-012-05-05 CK `PASS`.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

## Scope

Complete the existing response parser, REL-03 projection, finalizer, staging, and composite replay path for authorized visual result slots. A selected independently owned visual is extraction-eligible and yields exactly one valid `candidate` or bounded `non_fact` accounting result; selected contextual media remains context-only. Permit image-only/unlabelled evidence without fabricated text: retain verified locator grounding and optional absent `source_wording`, plus normalized meaning, payload, uncertainty, questions, and `needs_resolution`.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-06-01` | Image-only owned candidate, image-only bounded `non_fact`, and mixed owned/contextual responses traverse production parser, REL-03, finalizer, staging, and replay with exact visual locators. |
| `RC-01205-06-02` | A visual lacks no required fabricated textual wording; optional absent wording does not erase visual grounding or semantic uncertainty. |
| `RC-01205-06-03` | Foreign slot, renamed/substituted slot, context-only-as-owned slot, failed attachment, and unresolved/unsupported response fail explicitly and are never silently classified as `non_fact`. |

## Boundaries and workflow

This leaf consumes fake transport responses and existing semantic contracts; it cannot alter provider composition, grants, immutable records, acceptance/publication authority, reconciliation, Master, or CES. CFC repairs only the cited result-accounting seam. HMN is required for an impossible existing parser/finalizer representation; it cannot invent a caption, promote contextual authority, or accept provider output without the authorized slot.

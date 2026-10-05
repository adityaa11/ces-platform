# SEM-ANM-PROMPT-003-03: Integrated offline qualification checkpoint

- **State:** `approved`
- **Review batch:** `SEM-ANM-PROMPT-003-BATCH-03`
- **Parent context:** [SEM-ANM-PROMPT-003 implementation context](../../SEM-ANM-PROMPT-003-cross-field-composition-implementation-context.md)
- **Predecessors:** CK `PASS` for [PROMPT-003-01](SEM-ANM-PROMPT-003-01-frozen-cross-field-policy-insertion.md) and [PROMPT-003-02](SEM-ANM-PROMPT-003-02-differential-artifacts-and-provenance.md)
- **Start gate:** Both predecessor artifact sets reproduce, all findings are closed, and explicit `go` authorizes this integrated offline checkpoint.

## Outcome

Run the complete deterministic PROMPT-003 qualification and produce `generated/qualification-report.json`. Crosswalk every parent review requirement to machine-inspectable evidence, record one CK-ready checkpoint, and stop. This is a verification/package ticket: it does not reopen wording, design, or live qualification.

## Required checks and evidence

- PROMPT-002 identity, checkpoint, Zod hash, schema bytes/hash, 16 kinds, provider fields, candidate/non-fact classification, and slot/source-result accounting remain intact.
- Cross-field section title/body is exact and singular; `STATIC_POLICY` ownership and frozen location are proven.
- Removing it restores every predecessor section/provenance attribute exactly.
- Prompt excludes the exact S4 sentence, S1-S4 fixture labels/answers, manual provider responses, and reconciliation definitions.
- Negative tests fail for Zod/schema/kind/policy/placement/duplicate/leakage/predecessor-mutation/determinism violations, keyword repair, post-provider repair, or live-provider additions.
- Two identical builds yield byte-identical prompt, schema, provenance, and hash records.
- The report maps `RC-PROMPT3-001` through `RC-PROMPT3-015` from the parent context to evidence and records only `PASS` or `CHANGES_REQUIRED`.

No Anoman, Gemini, or other provider call is authorized. Do not read `ANOMAN_API_KEY`, `.env`, or authorization material; do not add Safara execution, finalization, parsing integration, persistence, reconciliation, BSS-V2, or production routing.

## Acceptance and review contract

| ID | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-PROMPT3-03-001` | Complete the parent contract crosswalk. | Qualification report links deterministic evidence for each `RC-PROMPT3-001`–`RC-PROMPT3-015`. |
| `RC-PROMPT3-03-002` | Preserve immutable authority and exact remediation. | Approved predecessor/Zod/schema identities, one exact policy body, static ownership, and placement all pass. |
| `RC-PROMPT3-03-003` | Prove exact delta and deterministic bundle. | Differential oracle and repeated-build equality cover prompt, schema, provenance, and hashes. |
| `RC-PROMPT3-03-004` | Cover mandatory negatives and exclusions. | Fixture leakage, reconciliation leakage, repairs/heuristics, provider/secret access, and predecessor mutation are all rejected. |
| `RC-PROMPT3-03-005` | Produce a bounded CK handoff. | One `PASS` or `CHANGES_REQUIRED` is recorded; no live or downstream work is implied. |

## SecurityReadiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-PROMPT3-03-IB-01` | Final evidence preserves immutable predecessor authority and treats PROMPT-003 as a derived offline artifact. |
| `SR-PROMPT3-03-ID-01` | Qualification report binds checkpoint, approved hashes, policy hash, generated hashes, and result. |
| `SR-PROMPT3-03-SA-01` | No credential, authorization header, environment content, raw provider response, or confidential source is required or retained. |
| `SR-PROMPT3-03-PC-01` | The checkpoint cannot expand into live inference, response repair, reconciliation, parsing/finalization, persistence, or production work. |
| `SR-PROMPT3-03-VS-01` | Deterministic qualification covers all frozen invariants, negatives, and repeat-build evidence. |

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- |
| `SR-PROMPT3-03-RB-01` | `SR-PROMPT3-03-IB-01`, `SR-PROMPT3-03-ID-01` | Is the final result completely attributable to immutable predecessor inputs and the frozen policy? | Qualification report, hash/provenance bundle, scope diff. |
| `SR-PROMPT3-03-RB-02` | `SR-PROMPT3-03-SA-01`, `SR-PROMPT3-03-PC-01`, `SR-PROMPT3-03-VS-01` | Does qualification prove the required behavior without secrets, provider execution, or scope expansion? | Test logs, negative checks, artifact inventory, dependency review. |

## Terminal classification and hard stop

GO records `PASS` or `CHANGES_REQUIRED`, sets this ticket to `awaiting_review`, and stops for CK. CK `PASS` requires every parent review row, deterministic artifact, provenance/hash link, and negative check. A pass does not authorize `SEM-ANM-SPIKE-004`, an Anoman/Gemini call, Safara work, reconciliation, BSS-V2, finalization, or production integration; each needs separately frozen authorization.

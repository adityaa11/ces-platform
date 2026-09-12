# GLF-008: Skill execution comparison contract

- **State:** blocked
- **Review batch:** BATCH-24
- **Depends on:** Agents Bridge pipeline; GLF-001, GLF-002, GLF-003-02 approved
- **Baseline:** Architecture Checkpoint sections 3, 9, 21–24; GLF-001–GLF-003-02

## Retirement record

This ticket was never started and is intentionally retired from the completed
GLF-001–GLF-005 ticket set on 12 September 2026. It is historical planning
context only and must not be resumed here. Any execution-comparison work must
be proposed and approved in a separate re-extraction lifecycle bundle.

## Outcome

After a provider-neutral Agents Bridge pipeline exists, compare normalized
golden-fixture candidate output from `codex` and `agents_bridge` execution.

## Blocker

No Agents Bridge pipeline exists in the repository. This ticket must not begin
or introduce a provider integration until the bridge is separately designed,
implemented, and approved.

## Scope

- Use the same skill ID/version, validated input, and output schema in both
  modes.
- Compare provenance, normalized JSON, source evidence, and semantic values.
- Compare source-inventory coverage and candidate-to-inventory provenance as
  part of normalized output; a mode cannot omit, duplicate, or reclassify a
  material source statement while still being considered equivalent.
- Report schema mismatches, evidence mismatches, semantic differences, and
  harmless ordering/format differences separately.
- Retain candidate-only status and the same deterministic validation in both
  modes.

## Acceptance criteria

- A branch's current execution mode resolves from HEAD revision provenance.
- `SKILLS_MODE` defaults to `codex`; a missing bridge executor fails explicitly.
- Neither execution mode can bypass validation, approval, or commit authority.
- Equivalent comparison output retains the authoritative three-PDF / eleven-page
  source set and the reconciliation relationships required by GLF-003-02.

## Validation

- Use captured Codex output as a comparison baseline.
- Run equal and unequal normalized JSON comparisons after the bridge exists,
  including a coverage/provenance mismatch that must be reported separately
  from harmless ordering or formatting differences.

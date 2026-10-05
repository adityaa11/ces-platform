# Anoman Schema-Driven Semantic Qualification Ticket Set

- **State:** `awaiting_review`
- **Ticket prefix:** `SEM-ANM-SPIKE`
- **Authoritative context:** [SEM-ANM-SPIKE001 implementation context](../../SEM-ANM-SPIKE001-implementation-context.md)
- **Predecessor boundary:** accepted `BSS-V2-004-02` `NormalizedDocument v1` result

## Purpose

This set qualifies one bounded provider route: whether Anoman AI's
OpenAI-compatible `gemini-2.5-flash` route can provide the strict,
schema-driven semantic-proposal boundary required after `BSS-V2-004-02`.
It is feasibility evidence only. A failure is a valid completed result.

```text
accepted NormalizedDocument v1
  -> deterministic S1-S4 source slots
  -> spike-local Zod proposal schema and generated JSON Schema
  -> Anoman / gemini-2.5-flash strict structured output
  -> same Zod validation
  -> deterministic Atlas finalization
  -> unchanged atlas.semantic.extract/v1 validation
  -> frozen S1-S4 oracle
```

The set neither activates a production semantic route nor changes Atlas
semantic authority, perception, reconciliation, publication, or workspace
state.

## Delivery order

| Order | Ticket / batch | Depends on | Bounded review question |
| ---: | --- | --- | --- |
| 1 | [SEM-ANM-SPIKE001](SEM-ANM-SPIKE001-anoman-schema-driven-semantic-route-qualification.md) / `SEM-ANM-BATCH-001` | Accepted `BSS-V2-004-02` parser boundary, existing `atlas.semantic.extract/v1` contract, explicit `go`, and local Anoman configuration | Can one frozen Anoman/Gemini route accept strict schema output, then complete two equivalent S1-S4 semantic runs without repair or authority transfer? |

## Shared controls

- Gate A is one strict-schema authenticated call. Gate B may begin only after
  `STRICT_SCHEMA_PASS`, and consists of exactly two equivalent calls.
- The provider is an untrusted proposer. Only the approved non-confidential
  fixture crosses the boundary; Atlas retains identity, evidence, finalization,
  and all truth authority.
- `ANOMAN_API_KEY` is loaded from the ignored repository `.env`; keys,
  authorization headers, environment dumps, and confidential source material
  must never be committed or preserved as evidence.
- No provider/model fallback, adaptive retry, prompt mutation, semantic repair,
  or contract weakening is permitted to obtain a PASS.
- Store raw/sanitized run artifacts only in the ignored spike artifact root and
  commit only the prescribed secret-safe report.

## Completion boundary

The ticket ends after Gate A's terminal result and, only if it passes, two
equivalent Gate B runs plus all validation, telemetry, security-redaction, and
review evidence. Record exactly one result: `PASS`, `PASS_WITH_LIMITS`,
`FAIL`, or `ENVIRONMENT_BLOCKED`; then set the ticket to `awaiting_review`
and stop for CK. No result authorizes production `BSS-V2-004-03` work.

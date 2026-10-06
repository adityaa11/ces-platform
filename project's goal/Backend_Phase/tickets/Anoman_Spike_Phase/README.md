# Anoman Semantic Prompt and Route Qualification Ticket Set

- **State:** `planned`
- **Ticket prefixes:** `SEM-ANM-PROMPT`, `SEM-ANM-SPIKE`
- **Authoritative contexts:** [SEM-ANM-PROMPT-001 implementation context](../../SEM-ANM-PROMPT-001-implementation-context.md), [SEM-ANM-PROMPT-002 implementation context](../../SEM-ANM-PROMPT-002-trimmed-v2-implementation-context.md), [SEM-ANM-SPIKE001 implementation context](../../SEM-ANM-SPIKE001-implementation-context.md), [SEM-ANM-SPIKE-002 live qualification context](../../SEM-ANM-SPIKE-002-PROMPT001-live-qualification-implementation-context(1).md), [SEM-ANM-SPIKE-003 live qualification context](../../SEM-ANM-SPIKE-003-PROMPT002-live-semantic-qualification-implementation-context-v2.md), and [SEM-ANM-SPIKE-004 live qualification context](../../SEM-ANM-SPIKE-004-PROMPT003-live-semantic-qualification-implementation-context.md)
- **Predecessor boundary:** accepted `BSS-V2-004-02` `NormalizedDocument v1` result

## Purpose

This set contains separately gated semantic-extraction work: the offline
PROMPT-001 and PROMPT-002 Zod-driven prompt-builder proofs, the original
strict-schema route qualification, and a follow-on live qualification that
consumes the approved PROMPT-001 generated prompt using `json_object` mode.
Both prompt-builder sequences are offline and do not call Anoman; neither
route ticket can change a prompt-builder contract.

`SEM-ANM-SPIKE001` qualifies whether Anoman AI's OpenAI-compatible
`gemini-2.5-flash` route can provide the strict, schema-driven
semantic-proposal boundary required after `BSS-V2-004-02`. It is feasibility
evidence only. A failure is a valid completed result.

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

## Delivery order and separation

| Order | Ticket / batch | Depends on | Bounded review question |
| ---: | --- | --- | --- |
| 1 | [SEM-ANM-PROMPT-001](SEM-ANM-PROMPT-001-zod-driven-semantic-prompt-builder.md) / `SEM-ANM-PROMPT-BATCH-001` | Frozen manual semantic-prompt checkpoint and explicit `go` | Can a provider-independent Zod contract plus a small fixed behavioral scaffold deterministically reproduce the frozen prompt behavior without a second ontology? |
| 2 | [SEM-ANM-PROMPT-002-01](SEM-ANM-PROMPT-002-01-frozen-reference-and-schema-projection.md) / `SEM-ANM-PROMPT-002-BATCH-01` | Frozen PROMPT-002 context and supplied reference; explicit `go` | Is the exact frozen Atlas Semantic V1 reference integrity-checked and converted through the public Zod JSON-Schema boundary into the provider schema? |
| 3 | [SEM-ANM-PROMPT-002-02](SEM-ANM-PROMPT-002-02-deterministic-extraction-prompt-compiler.md) / `SEM-ANM-PROMPT-002-BATCH-02` | PROMPT-002-01 `PASS`; explicit `go` | Does a deterministic renderer combine Zod-owned extraction semantics with the frozen fixed policy, excluding reconciliation definitions? |
| 4 | [SEM-ANM-PROMPT-002-03](SEM-ANM-PROMPT-002-03-integrated-qualification-checkpoint.md) / `SEM-ANM-PROMPT-002-BATCH-03` | PROMPT-002-01 and -02 `PASS`; explicit `go` | Do coverage, negative, provenance, hash, and repeat-build checks prove the complete offline prompt artifact is ready for CK review? |
| 5 | [SEM-ANM-SPIKE001](SEM-ANM-SPIKE001-anoman-schema-driven-semantic-route-qualification.md) / `SEM-ANM-BATCH-001` | Accepted `BSS-V2-004-02` parser boundary, existing `atlas.semantic.extract/v1` contract, explicit `go`, and local Anoman configuration | Can one frozen Anoman/Gemini route accept strict schema output, then complete two equivalent S1-S4 semantic runs without repair or authority transfer? |
| 6 | [SEM-ANM-SPIKE-002](SEM-ANM-SPIKE-002-prompt001-live-semantic-qualification.md) / `SEM-ANM-SPIKE-BATCH-002` | CK `PASS` for `SEM-ANM-PROMPT-001`, accepted `BSS-V2-004-02` parser boundary, explicit `go`, and local Anoman configuration | Does the exact approved generated prompt preserve successful manual S1-S4 behavior over two equivalent `json_object` calls without semantic repair? |
| 7 | [SEM-ANM-SPIKE-003](SEM-ANM-SPIKE-003-prompt002-live-semantic-qualification.md) / `SEM-ANM-SPIKE-BATCH-003` | CK `PASS` for integrated `SEM-ANM-PROMPT-002`, exact artifact hashes, explicit `go`, and local Anoman configuration | Does the exact PROMPT-002 prompt/schema preserve source meaning across two equivalent `json_object` calls, including S2's overlapping rule/constraint facets? |
| 8 | [SEM-ANM-SPIKE-004](SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md) / `SEM-ANM-SPIKE-BATCH-004` | CK `PASS` for integrated `SEM-ANM-PROMPT-003`, exact artifact and payload hashes, explicit `go`, local gates, and local Anoman configuration | Does the exact PROMPT-003 prompt resolve SPIKE-003's S4 failure in both calls while preserving S1-S3 over the same route, fixture, and oracle? |

PROMPT-002 is a ticket decomposition of its frozen implementation context,
not authorization to call a provider. Its final checkpoint ends at CK review;
it does not become a predecessor to either live route ticket automatically.

The table records related work, not a silent amendment to the frozen
`SEM-ANM-SPIKE001` contract. A later provider qualification may consume the
prompt-builder output only through a separately authored, explicitly approved
ticket.

`SEM-ANM-SPIKE-002` is a separate qualification that consumes the CK-approved
prompt-builder artifacts and uses `json_object` mode. It does not amend or
reuse the strict `json_schema` experiment in `SEM-ANM-SPIKE001`.

`SEM-ANM-SPIKE-003` is a new qualification of the CK-approved PROMPT-002
artifacts. It preserves the same S1-S4 comparison corpus while applying the
PROMPT-002 primary-kind and overlapping-facets semantics. It does not rewrite
the historical PROMPT-001/SPIKE-002 result and does not run Atlas finalization.

`SEM-ANM-SPIKE-004` is a controlled live follow-up to SPIKE-003. It consumes
the CK-approved PROMPT-003 artifacts, preserves the exact S1-S4 payload,
route, and SPIKE-003 oracle, and changes only the approved system prompt. It
does not rewrite SPIKE-003's terminal `FAIL`; its two calls and comparison
stop at CK review without Atlas finalization or production routing.

## Shared controls

- `SEM-ANM-SPIKE001` Gate A is one strict-schema authenticated call. Gate B may begin only after
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

`SEM-ANM-PROMPT-001` ends after its deterministic local artifacts, provenance
and coverage evidence, tests, terminal classification, and review artifact are
complete. It makes no authenticated request and reads no provider credential.

`SEM-ANM-PROMPT-002` ends after its frozen reference, generated provider
schema and extraction prompt, deterministic provenance/coverage/hash artifacts,
local checks, terminal classification, and CK review handoff. It performs no
provider call and does not authorize a later live qualification.

`SEM-ANM-SPIKE001` ends after Gate A's terminal result and, only if it passes,
two equivalent Gate B runs plus all validation, telemetry, security-redaction,
and review evidence. Record exactly one result: `PASS`, `PASS_WITH_LIMITS`,
`FAIL`, or `ENVIRONMENT_BLOCKED`; then set that ticket to `awaiting_review`
and stop for CK.

`SEM-ANM-SPIKE-002` ends after exactly two equivalent `json_object` runs,
their validation, telemetry, security-redaction, manual-baseline comparison,
terminal classification, and review evidence. It also stops at `awaiting_review`
for CK; neither qualification authorizes production `BSS-V2-004-03` work.

`SEM-ANM-SPIKE-003` ends after exactly two equivalent PROMPT-002
`json_object` runs, exact-schema validation, source accounting, semantic-oracle
evaluation, telemetry/redaction evidence, terminal classification, and CK
handoff. It stops at `awaiting_review`; it does not authorize finalization,
broader coverage, or production routing.

`SEM-ANM-SPIKE-004` ends after exactly two equivalent PROMPT-003
`json_object` runs (or an environment block preventing meaningful inference),
exact-schema validation, source accounting, unchanged semantic-oracle
evaluation, telemetry/redaction evidence, historical SPIKE-003 comparison,
terminal classification, and CK handoff. It stops at `awaiting_review`; it
does not authorize finalization, broader coverage, or production routing.

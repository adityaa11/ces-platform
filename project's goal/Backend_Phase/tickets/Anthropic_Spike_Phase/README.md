# Anthropic Semantic IR Qualification Ticket Set

- **State:** `awaiting_review`
- **Ticket prefix:** `SEMSPIKE`
- **Authoritative context:** [SEMSPIKE-007 Anthropic Claude Sonnet 5.5 implementation context](../../SEMSPIKE-007-anthropic-sonnet-5-5-implementation-context.md)
- **Execution branch:** `codex/new-atlas-backend`
- **Baseline evidence:** frozen `SEMSPIKE-006` result at `68cd835` (`ENVIRONMENT_BLOCKED`); provider-wire remediation `2da8577`

## Purpose

This set qualifies whether the existing, frozen 12-case Atlas Semantic IR
experiment can complete correctly and stably on Anthropic Claude Sonnet 5.5.
It changes the provider only. Atlas semantic authority, the corpus, the
provider-wire contract, normalization, evidence validation, and oracle remain
unchanged.

```text
same 12 authorized source units
  -> frozen semantic instruction
  -> existing provider-wire Zod contract
  -> Anthropic Zod structured-output transformation
  -> local original Zod validation
  -> unchanged normalization / Semantic IR validation
  -> source accounting + evidence grounding + semantic oracle
  -> cross-run stability result
```

`SEMSPIKE-006` is valid frozen predecessor evidence despite its
`ENVIRONMENT_BLOCKED` result. This is a sibling qualification: do not reopen,
modify, or reinterpret SEMSPIKE-006.

## Delivery order

| Order | Ticket / batch | Depends on | Bounded review question |
| ---: | --- | --- | --- |
| 1 | [SEMSPIKE-007](SEMSPIKE-007-anthropic-sonnet-5-5-semantic-ir-qualification.md) / `SEMSPIKE-BATCH-07` | Frozen SEMIR-001 through SEMIR-004 authority; frozen SEMSPIKE-006 evidence; `2da8577` provider-wire remediation; explicit `go` | Can two independent Claude Sonnet 5.5 structured generations satisfy the unchanged 12-case Semantic IR qualification without repair or critical instability? |

## Shared controls

- Begin only after the ticket's complete offline gate passes. Provider calls
  before then are prohibited; a connectivity probe is not allowed.
- Use exactly two independent authenticated calls. No retry, fallback, repair,
  batch, conversation continuation, input change, or Run 1 output sharing is
  allowed.
- The provider is an untrusted semantic proposer. Only controlled,
  non-confidential fixtures may cross the boundary. Credentials and headers
  remain environment/request-only and absent from artifacts and logs.
- Keep code and evidence spike-local. Raw or detailed run artifacts belong
  only in the ignored Anthropic spike artifact root; commit a sanitized report
  only.
- After a terminal result, set the ticket to `awaiting_review` and stop for
  CK. A result does not authorize production extraction, canonicalization,
  reconciliation, prompt/schema redesign, or a further provider test.

## Completion boundary

The set ends in exactly one ticket result: `PASS`, `FAIL`, or
`ENVIRONMENT_BLOCKED`. `PASS` is feasibility evidence for the existing
Semantic IR only; it is not production, privacy-governance, economics, real
PRD, or reconciliation approval.

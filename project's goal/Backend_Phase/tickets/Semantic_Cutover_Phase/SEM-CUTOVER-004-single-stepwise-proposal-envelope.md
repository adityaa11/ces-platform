# SEM-CUTOVER-004 — One versioned stepwise extraction request and response envelope

**Status:** `planned` · **Size:** M · **Owner:** offline request/response specification and compiler selection, not live dispatch · **Dependency:** 003 independent CK PASS + 002 approved authority. Explicit `GO` required.

## Exact objective

Compose the eight-stage stepwise prompt, validated source packet and REL-01/REL-02 relationship extension into **one versioned provider-neutral semantic request specification**. The response has **one** strict envelope containing a canonical `semantic_proposal` and bounded `relationship_proposals`. Do not build a second legacy path, trigger one request per reasoning stage, or auto-select profile based on whether an image is present.

## Exact structural seam

Approved `atlasProviderRelationshipExtractionEnvelopeV1Schema` already models:

```ts
{ contract_version: "atlas.relationship-extraction-envelope/v1",
  semantic_proposal: AtlasProviderExtractionProposalV1,
  relationship_proposals: readonly AtlasProviderRelationshipProposalV1[] }
```

The old `atlasProviderExtractionProposalV1Schema` is STRICT, so relationship fields must not be stuffed into it. Use an explicit versioned successor request schema/profile and hash if any frozen v0.3.1 bytes/schema/provenance need to change. The canonical Semantic V1 result and Zod authority remain the same. REL-01 materialization is separate from finalizer acceptance.

## Ownership and prohibitions

Own a narrowly new request composition module (e.g. `packages/atlas-skills/src/stepwise-extraction-request.ts`) and focused tests, plus explicit new exports. A change to frozen compiler `semantic-prompt.ts`, transport `provider-capabilities.ts`, Anoman adapter, semantic-worker, or REL-01/02 contracts is an **owner escalation**; no scope creep through 'small changes'. No provider calls, bytes hydration, grants, admission or Master mutation.

## Review contract

| ID | PASS iff | Required negative |
|---|---|---|
| RC-004-01 | Exactly one profile selected from the approved successor authority; all eight stages present in correct order and prompt/schema/part identity is deterministic | Mutable same-profile hash, hidden legacy fallback, unknown profile -> fail |
| RC-004-02 | Request uses trusted source slots + optional provisional extension (including empty first-run) without converting proposals to accepted context | Provisional extension with `authorization` or accepted claim -> fail |
| RC-004-03 | Strict response envelope parses positive fake; REL-01 proposal parser can retain source-attributed hypotheses and semantic proposal remains individually Zod-validated | Fenced raw response, uppercase kind, invalid source slot, illegal relationship, provider IDs -> fail |
| RC-004-04 | Frozen semantic meaning authority and provider-neutral contract retained; source content never interpolates into system policy | Source string attempting to overwrite rules does not change prompt policy |
| RC-004-05 | One logical request; zero external provider calls/jobs/permits/reservations | Model stages do not cause eight provider invocations |

**Stop:** `PROFILE_ID_COLLISION`, `OWNERSHIP_CONFLICT_BLOCKED`, new Zod contract authority required, missing source integrity. **Terminal:** independent CK PASS on exact request/schema/provenance fixtures.

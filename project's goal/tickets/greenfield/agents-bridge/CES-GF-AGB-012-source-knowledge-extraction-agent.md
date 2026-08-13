# CES-GF-AGB-012 - Source Knowledge Extraction Agent

**Status:** Implemented candidate; pending REVIEW_GATE
**Review class:** REVIEW_GATE
**Depends on:** Accepted AGB-006 and AGB-011
**Blocks:** AGB-013 and AGB-014

## Outcome

Register a source-knowledge agent that proposes bounded raw CES concepts for an
`EXTRACTION_GAP` using only governed, authorized source material.

## Scope

- Governed source release, rights/prerequisite, exact locator, bounded demand,
  and existing raw-vocabulary context.
- Proposed raw identity, meaning, provenance, relevance, and predecessor.
- Golden replays for accepted ASVS V14.1.1 and V14.2.6 extraction paths.

## Acceptance contract

- Extraction is prohibited when source authorization or required material is
  absent.
- Every proposal cites an exact governed release and locator and preserves the
  source meaning without project-specific generalization.
- Existing equivalent raw knowledge is detected rather than duplicated.
- Output remains proposed and cannot grant POL-006 authority.
- Unsupported, over-broad, rights-violating, or fabricated source claims fail.

## Explicit non-goals

- Exhaustive ontology generation, web discovery outside governed sources,
  canonicalization, Policy decisions, or raw successor publication.

## Review focus

Source authorization, exact provenance, bounded meaning, duplicate avoidance,
project independence, and POL-006 authority separation.

## Implementation evidence

- Registered `ces.source-knowledge-agent@1.0.0` in the existing stateless
  Agents Bridge with structured output, no tools, and mandatory human review.
- A server-controlled resolver accepts only active releases explicitly
  authorized for structured extraction and AI-assisted analysis and requires
  one exact governed locator from a hash-validated row artifact.
- Provider output must preserve the governed release, locator, and bounded
  meaning. Governed semantic atoms resolve equivalent predecessor meanings;
  fabricated, missing, blocked, or over-broad material fails closed.
- Golden replays cover ASVS V14.1.1 and V14.2.6 through the AGB-006 proposed
  raw-concept envelope. Output cannot accept or publish POL-006 authority.
- Runtime extraction now consumes committed bounded rows from the authorized
  pinned ASVS CSV plus the exact raw-v1.1 predecessor identity/hash. Accepted
  raw v1.2 is test-oracle-only, and replay runs through `executeRegisteredAgent`.
- Duplicate decisions are derived semantically from the server-resolved v1.1
  predecessor, independent of caller hints or proposed identifiers.
- The backward-compatible AGB-006 evidence successor preserves source artifact
  ID/hash, exact source-term and excerpt identity, role, scope, agent provenance,
  predecessor identity, rights evidence, and processing authorization evidence
  through bridge serialization for independent Policies validation.
- Row locator, term, excerpt, and semantic atoms are bound to committed content
  evidence and mutation-tested. Rights and processing-decision references
  resolve deterministically to the exact governed release records.
- Focused agent and architecture tests pass with Agents Bridge typechecking.

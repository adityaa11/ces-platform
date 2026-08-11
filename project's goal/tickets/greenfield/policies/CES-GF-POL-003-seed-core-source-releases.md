# CES-GF-POL-003 - Seed Four Core Source Releases

**Status:** Accepted
**Depends on:** POL-002

## Outcome

Create the governed initial source-family and release records for the four
frozen CES Policies v1 sources.

## Scope

- Seed one stable family identity for each frozen source.
- Select and record an explicit initial edition/release for each family.
- Record authoritative provenance, release metadata, and last-checked evidence.
- Document lawful source access and extraction constraints where applicable.

## Acceptance contract

- Exactly four v1 core families are active.
- Every family has an explicit, valid, immutable release record.
- Seeds are idempotent and reject conflicting identity reuse.
- Release selection and provenance are reviewable without relying on memory.
- No unapproved fifth source enters the core baseline.

## Explicit non-goals

- Extracting source vocabulary or copying protected source text into CES.
- Defining policies, concerns, capabilities, or source mappings.
- Adding conditional or implementation sources.

## Implementation evidence

- Deterministic seeds contain exactly the four frozen families and one pinned,
  published release per family.
- Release metadata was checked against official ISO, OWASP, and versioned
  GitHub/OWASP release pages on 2026-08-11.
- Normalized metadata observation hashes, evidence URIs, release dates, roles,
  and access constraints are stored without copying protected ISO content.
- ISO content extraction is explicitly blocked pending licensed written
  authorization; OWASP processing requires CC BY-SA 4.0 compliance.
- Five focused tests cover exact family membership, idempotence, observation
  hashes, conflicting identity rejection, and access-policy classification.
- Round 2 correction separates metadata `observation_hash` provenance from
  retrieved-source `content_hash` provenance without weakening immutability or
  ISO access restrictions.
- Terminal Round 2 result: `ACCEPTED` for commit `ce0460e`.

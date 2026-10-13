# SEM-CUTOVER-005 — Provisional semantic accounting and replay-safe handoff

**Status:** `planned` · **Size:** M · **Owner:** separate provisional result/sidecar contract, not Master truth · **Dependencies:** 004 independent CK PASS, 002 approved sidecar ownership. Explicit `GO` required.

## Exact objective

Define and offline-qualify the representation allowing **independent canonical Semantic V1 candidates** to complete their authorized portion while storing the *unverified dependent meaning* and its source relationship/visual dependencies separately. Do not require user confirmation to record a candidate proposal; do not attach provisional context as canonical trusted evidence. This is necessary because Semantic V1 source inventory only permits `candidate` and `non_fact`.

## Lifecycle semantics

**Complete independent extraction** does NOT mean all visual semantics understood or trusted. Define an explicit source-accounting statement that identifies: every owned source; what was finalized into Semantic V1; what remains provisional/conditional; required dependency/revision IDs; and meaningful unexamined visuals. Keep `pending_verification` as a **sidecar/lifecycle concept** if approved, not a silent new `atlasSourceClassificationV1Schema` value.

A valid legacy-shaped V1 envelope must never be staged as *complete coverage* if that would omit pending meaningful source material. Specify exactly what scope-level partial completion is legitimate; if neither separate sidecar nor existing acceptance can preserve required information atomically, return a precise `SCHEMA_FIT_BLOCKED` and request owner decision—do not claim PASS.

## Implementation ownership

Prefer new sidecar interface, deterministic revision-hash functions and fake repository/stage tests owned in a new module. REL-01/02 existing ports and history are reused; actual Postgres adapter, migration and worker atomic composition belong to a separately authorized persistence owner (including existing protected REL-03 candidate), not silently this ticket. Never stage a sidecar in a way that can detach it from the related semantic snapshot on retry.

## Review contract

| ID | PASS iff | Negative |
|---|---|---|
| RC-005-01 | Independently supported candidates can be canonical Semantic V1 reviewable candidates with exact evidence while unverified dependent meaning remains explicitly non-authoritative | Dependent interpretation is not copied into trusted candidate payload/dual evidence |
| RC-005-02 | All meaningful source units, pending visual locators and relationship dependencies are accounted for in a bounded attributable companion outcome; no false completeness | A meaningful unexamined asset may NOT become `non_fact` or disappear |
| RC-005-03 | Empty provisional relationship set and zero-visual input are valid; no user verifier required to make independent progress | No synthetic accepted revision required on first extraction |
| RC-005-04 | Sidecar/revision hashes are source/execution/bundle/document scoped and stable under replay; ack-loss uses same winner | Wrong source SHA, foreign revision, duplicate, stale lease and staged-mismatch reject |
| RC-005-05 | Pending verification cannot change Master, accepted relationship authority, reconciliation truth or publishing status | Any attempted implicit acceptance/publish effect rejected |

## Validation and STOP

Use deterministic in-memory fake repository with tested positive-effect controls. No real DB mutation, real provider, admission or semantic queue. If fully atomic staging requires changes to REL-03 or DB owner, stop at exact handoff, create reviewable interface/evidence and obtain separate GO/HMN rather than violating REL-03 protection.

**Terminal:** independent CK PASS of contract and fake replay behavior, or explicit `SCHEMA_FIT_BLOCKED` with a bounded alternative decision request.

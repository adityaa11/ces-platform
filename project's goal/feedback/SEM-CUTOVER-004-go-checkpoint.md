# SEM-CUTOVER-004 GO checkpoint — versioned stepwise REL proposal envelope

- **Ticket:** `SEM-CUTOVER-004` — One versioned stepwise extraction request and response envelope
- **Authorization:** explicit user `GO SEM-CUTOVER-004`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-004-single-stepwise-proposal-envelope.md`
- **Implementation commit:** `1f4519ec292b2a5ef6fa326116d5f85d0887b7cf` (`feat(sem-cutover): add stepwise relationship envelope request`)
- **Required predecessors:** `SEM-CUTOVER-002` independent CK `PASS` at `330eae8b1f63dd69855f307e2ac0df1444a2e3dd`, consuming approved successor authority `HMN-SEM-CUTOVER-002-002`; `SEM-CUTOVER-003` independent CK `PASS` at `cd6a8006e12e3f7caeeaea6f77f9d3181947760f`.
- **Checkpoint state:** `awaiting_review`

## Bounded change set

`packages/atlas-skills/src/stepwise-extraction-request.ts` adds the sole pure
composition and parser surface. It explicitly selects
`atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0`,
while retaining `atlas.semantic.extract.stepwise_multimodal/v0.3.1` as the
frozen eight-stage methodology. The immutable successor profile fingerprint is
`869b5885e05b6db13b56caac815565100753abc087e7140de3fe3ab2b58a87d8`.

The implementation imports the existing strict
`atlasProviderRelationshipExtractionEnvelopeV1Schema`; it creates no new Zod
contract authority. The request binds the source snapshot, slots, provisional
extension (including empty first-run), unresolved requirements, source bytes
specification/hash, strict response schema, immutable profile hash, and request
hash. The parser validates the strict envelope first, then exact owned-slot
coverage, source-slot coordinates, relationship evidence ordering, duplicates,
and candidate references without materializing revisions or causing effects.

Only these ticket-owned paths changed in the implementation commit:

- `packages/atlas-skills/src/stepwise-extraction-request.ts`
- `packages/atlas-skills/src/index.ts`
- `packages/atlas-skills/tests/stepwise-extraction-request.test.ts`

No compiler, transport, adapter, worker, finalizer, REL-01/02 contract,
provider, hydration, persistence, admission, reservation, job, or Master path
was changed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
|---|---|---|---|
| `RC-004-01` | One explicitly selected successor profile; all eight stages stay ordered; profile/request identity deterministic; no mutable same-profile hash, legacy fallback, or unknown profile. | `stepwise-extraction-request.test.ts`, `one deterministic successor profile preserves all eight stages and carries an empty provisional extension`; asserts stages 1–8, distinct v0.4.0 profile, deterministic request equality, immutable fingerprint, tampered methodology rejection (`PROFILE_ID_COLLISION`), and unknown-profile rejection. `pnpm --filter @atlas/skills exec jiti tests/stepwise-extraction-request.test.ts` — PASS, 5/5. | **PROVEN** |
| `RC-004-02` | Trusted source slots plus optional provisional extension, including an empty first run, without proposal-to-accepted-context promotion. | Same deterministic request fixture asserts the empty `atlas.relationship-packet-extension/v1` extension. Builder accepts only the predecessor stepwise packet and parser has no accepted-context input or materializer call. Source-packet regression `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` — PASS, 8/8. | **PROVEN** |
| `RC-004-03` | Strict positive fake envelope; semantic proposal remains individually Zod-validated; source-attributed relationship coordinates remain bounded. Fenced raw response, uppercase kind, invalid/foreign slot, illegal relationship, and provider ID fail. | `strict envelope accepts a valid fake and keeps semantic validation separate` and `raw fencing, uppercase kinds, foreign slots, illegal relationships, and provider IDs fail closed` in the focused suite — PASS. Parser uses the existing strict envelope and semantic schemas, exact owned slot map, evidence-pair ordering, duplicate/candidate-reference guards. | **PROVEN** |
| `RC-004-04` | Preserve frozen semantic meaning authority and provider-neutral contract; source content cannot alter system policy. | `source content remains request evidence and cannot alter the compiled system policy` asserts adversarial source content stays in the source specification and is absent from the compiled system prompt — PASS. Existing legacy/stage regression `pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts` — PASS, 18/18. | **PROVEN** |
| `RC-004-05` | Exactly one logical request; zero external provider calls, jobs, permits, or reservations. | `composition has no provider, job, permit, reservation, or persistence seam` source-boundary assertion — PASS; the owned module exposes only synchronous deterministic composition/parsing and contains no transport, worker, provider, persistence, or materializer seam. | **PROVEN** |

## Validation

| Command | Outcome |
|---|---|
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-extraction-request.test.ts` | PASS — 5/5 focused request/envelope tests. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS — 8/8 predecessor-boundary regressions. |
| `pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts` | PASS — 18/18 compiler and legacy-boundary regressions. |
| `pnpm --filter @atlas/skills typecheck` | PASS. |
| `git diff --check` | PASS — no whitespace diagnostics. |

All applicable ticket-derived rows are proven by the prescribed offline,
deterministic harnesses. No stop condition was encountered: the successor has a
distinct profile identity, no owner escalation was required, no new Zod
authority was introduced, and the supplied predecessor packet preserves source
integrity.

`Internal readiness: READY_FOR_CK`.

This checkpoint does not issue a CK `PASS` or authorize SEM-CUTOVER-005.

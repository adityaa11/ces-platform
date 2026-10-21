# GO checkpoint: IDSER-012-05-07-02 — blocked qualification record

- **Ticket:** `IDSER-012-05-07-02 — Isolated multimodal terminal parity qualification`.
- **Authority:** frozen ticket `Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-07-02-isolated-multimodal-terminal-parity-qualification.md`.
- **Reviewed commit:** `4183c445fee6dc5b9691d8a811e00af40b289024`.
- **Prerequisite:** `IDSER-012-05-07-01` is CK `PASS` at `a1c40d0587be49ae10fa43155b94bd637873760e`.
- **Lifecycle:** `blocked` — no `READY_FOR_CK` claim.

## Isolated preflight

The exact retained isolated artifacts were inspected before any qualification
write: container `idser012050701-qualification-postgres-20261021` (ID prefix
`5aa7eaca7c51`, image `postgres:18-alpine`) mounts only volume
`idser012050701_qualification_pgdata_20261021` at `/var/lib/postgresql`.
The canonical `atlas-canonical-perception` containers remained stopped.

The isolated Safara binding is present and matches the qualified oracle:

- `Safara_Buyer_Business_PRD_Professional.pdf`, source SHA-256
  `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`,
  314167 bytes;
- RUN-003 execution/cache identity with `NormalizedDocument V1` and
  `atlas.document.perceive` / `v1`;
- 12 pages, 254 text blocks, 4 tables, 5 visual regions; and
- five accepted, distinct `image/png` manifest rows (pages 3, 5, 7, 8, and
  10), all with verified original manifest dimensions, byte lengths, and
  SHA-256 identities.

### Restore limitation assessment

The logical restore retained four known failed foreign-key recreations.  They
remain absent; no constraint was disabled or repaired in this qualification.

| Constraint | Affected table | Referenced table | Restore failure |
| --- | --- | --- | --- |
| `document_created_by_user_id_fkey` | `atlas.document` | `auth.user` | historical `ready-owner-*` document owner is absent |
| `document_project_id_fkey` | `atlas.document` | `atlas.project` | historical `ready-project-*` document project is absent |
| `extraction_bundle_project_id_fkey` | `atlas.extraction_bundle` | `atlas.project` | historical `ready-project-*` bundle project is absent |
| `workspace_project_id_fkey` | `atlas.workspace` | `atlas.project` | historical `ready-project-*` workspace project is absent |

These four dangling historical records do not involve the Safara project,
document, accepted execution/cache/manifest/media identities, or the v3
plan/handoff/sidecar tables.  All source rows used by the approved resolver
remain present and their in-scope constraints are intact.  Classification:
`ISOLATED_SCHEMA_LIMITATION_NON_BLOCKING`.

The snapshot originally recorded migrations `0085` and `0086`, but not
`0087_idser012_semantic_multimodal_reconstruction_policy_binding`.  As an
isolated-environment prerequisite, `0087` was applied only to the retained
qualification database.  Its role ownership clauses required the otherwise
absent dump-external roles `atlas_app` and `agents_bridge`; isolated `NOLOGIN`
roles were created solely so the frozen migration could complete unchanged.
The sidecar table, its two immutability/insert guards, owner, and migration
record were then verified.  No canonical database, volume, role, or service
was touched.

## Bounded blocker

The qualified snapshot contains one provider-capacity profile, but **zero**
`bridge.desired_admission_profile`,
`bridge.active_desired_admission_profile`, `bridge.provider_process_profile`,
and `bridge.workload_envelope_profile` rows.  Therefore
`bridge.read_capacity_planning_snapshot` cannot return the required
authenticated, prospective-planning-only BSS policy for a background semantic
route.  In particular, no accepted structural bound, route/profile, output
reservation, estimator configuration, or image-TPM policy is available.

This prevents calling the approved `partitionMultimodalStructuralFit()` with
an actual BSS prospective consumer.  Supplying those values in the harness
would fabricate the very policy the ticket requires to be read-only and
accepted.  The condition is neither an image incompatibility nor evidence
that an individual Safara PNG cannot fit: the planner has not received an
eligible BSS policy against which to test the five genuine visuals.

No substitute candidate, synthetic asset, route limit, estimator
configuration, serializer policy, BSS capacity, image TPM limit, or legacy
reconstruction path was used.  No production/predecessor code was changed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact command family | Status |
| --- | --- | --- | --- |
| `RC-01205-0702-01` | Deterministically disposition all five visuals and select an original PNG in a fitting batch, or return a proven structural blocker. | Isolated Safara source/manifest counts and five original PNG identities revalidated.  BSS prospective policy rows are absent, so the approved partitioner cannot make any structural disposition without fabricated policy. | `BLOCKED_ENVIRONMENT` |
| `RC-01205-0702-02` | Persist a fitting v3 batch then prove independent v3 reconstruction parity. | No fitting batch can be selected while the required BSS policy is unavailable; no v3 plan/handoff/sidecar write was attempted by this ticket. | `BLOCKED_ENVIRONMENT` |
| `RC-01205-0702-03` | Exercise atomic v3 persistence, replay/cancellation, and reference-only v3 rejection/validation. | `0087` schema is now present only in the isolated copy, but the prerequisite fitting proposal cannot be produced under an accepted policy. | `BLOCKED_ENVIRONMENT` |
| `RC-01205-0702-04` | Demonstrate stale/foreign/order/identity/version rejection before SEM/provider effect. | Requires the same persisted qualifying v3 reference; no such reference can be legitimately created. | `BLOCKED_ENVIRONMENT` |
| `RC-01205-0702-05` | Prove isolated-only writes and zero canonical/downstream effects. | Canonical Compose services remained stopped.  Isolated effect counts are zero for semantic execution, extraction result, reconciliation result, BSS admission, and BSS reservation.  No provider, GHR, REL, finalizer, hydration, or attachment surface was invoked. | `PROVEN` |
| `RC-01205-0702-06` | Record precise v3 SEM-CUTOVER handoff without claiming SEM readiness. | No valid v3 fitting batch/reference exists to hand off.  The future handoff must name `PostgresSemanticBatchV3ReferenceResolver`, the plan/handoff hashes and refs, selected-media commitments, and retain SEM-only execution/result duties. | `BLOCKED_ENVIRONMENT` |

## Required owner and continuation

**Owner:** the accepted BSS prospective-policy environment for the retained
isolated snapshot, not `-02-01` or `-02-02` implementation.  The smallest
continuation is to make the already accepted BSS read-only planning policy
(capacity, process, workload, desired/active admission-profile identity and
route/image policy) available in this isolated qualification environment.
It must not create admission, reservation, dispatch, provider, or SEM work.

This checkpoint does not assert `READY_FOR_CK`, does not claim SEM runtime
readiness, and does not use CK as a remedy path.

# BSS-V2-005-05-03 — Authorized desired-plan convergence

- **State:** `awaiting_review`; GO implementation recorded at `445c6366a8ca5483cdb8950d2e82b184881e4733`, pending independent CK.
- **Review batch:** `BSS-V2-BATCH-05-05-03`.
- **GO checkpoint:** [BSS-V2-BATCH-05-05-03-go-checkpoint](../../../feedback/BSS-V2-BATCH-05-05-03-go-checkpoint.md).
- **Parent and frozen family authority:** [BSS-V2-005-05 split map](BSS-V2-005-05-process-agnostic-registry-and-plan-convergence.md).
- **Dependencies:** BSS-V2-005-05-01 and BSS-V2-005-05-02 CK `PASS`; BSS-V2-005-01..04 CK `PASS`; separately authorized provenance-bound BSS-V2-005-01 capacity-profile versions. It does not claim durable BSS-V2-006 wakeup consumption.

## Outcome

For an already-qualified effective registry/workload/policy or BSS-V2-005-01 capacity-profile revision, deterministically recompute and atomically publish/activate a new immutable `DesiredAdmissionProfile` through the approved BSS-V2-005-04 per-domain revision fence. Preserve history and in-flight references, deduplicate identical effective input, and surface precise version-bound stale/unfit planning evidence. This is policy convergence only: BSS-V2-006 retains runtime pressure, admission, and wakeup-consumer authority.

## Frozen review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-00505-03a` | The publication/input portion of parent `RC-00505-03`: an authorized, qualified **effective** process/workload/policy change produces one new immutable desired plan and atomically activates it through the 005-04 per-domain revision fence; repeated identical inputs produce no new publication or activation revision; concurrent stale changes fail/reconcile without lost updates; registration alone is not activation authority. The full parent oracle, including durable wakeup effect, is terminally closed only by `-05-04`. |
| `RC-00505-07a` | The publication/input portion of parent `RC-00505-07`: a separately authorized, provenance-bound BSS-V2-005-01 capacity-profile version, including a qualified lower limit, is a deterministic recomputation/005-04 activation input. A 03A `capacity_revision_request` or `owner_replan_required` intent is not provider-limit evidence or publication authority; unattributable 429, transient pressure/cooldown, and stale/high observations cannot mint or raise numeric BSS-V2-005 policy. The full parent oracle, including actual 03A wakeup, is terminally closed only by `-05-04`. |
| `RC-00505-08` | A qualified structural/per-request bound downgrade yields **versioned stale/unfit planning evidence** only for affected process/workload/domain envelopes; the specific existing 03A `owner_replan_required` and `capacity_revision_request` intents remain governed by their actual membership/vector-fit predicates, not a new generic semantic-replan path. Unrelated domains and eligible work remain live; consumer-owned corpus invalidation/replanning, source splitting and Atlas-truth changes do not occur in BSS. |

## Boundary and evidence

Prove the effective-input fingerprint, per-domain atomic fence, immutable prior versions, concurrent stale/reconcile behavior, identical-input no-op, qualified lower capacity revision, structural downgrade isolation, and exact stale/unfit snapshot result. Any activation used here must traverse the approved BSS-V2-005-04 seam; the durable worker-consumption and end-to-end no-duplicate proof remains deliberately deferred to `-05-04`, which alone depends on the completed 03A series.

No operational intent may become provider-capacity publication authority; no 429/pressure/cooldown becomes a numeric policy; no consumer corpus/source is changed; no alternate notifier, broker, scheduler, admission, feedback path, or provider transport is added. The family map's provider-drift and STOP constraints are incorporated by reference. GO/CK/CFC/HMN are bounded to these three rows.

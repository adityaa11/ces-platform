# IDSER-012-05-02-02 — BSS multimodal structural-fit partition

- **State:** `planned`; executable only after explicit GO and `IDSER-012-05-02-01` CK PASS.
- **Parent map:** [IDSER-012-05-02](IDSER-012-05-02-multimodal-structural-fit-partition.md).

## Sole scope

Use the existing BSS **read-only prospective structural-fit** boundary and effective route media limits to compare the complete transient candidate demand from `-02-01`. Deterministically assign fitting candidates to batches, preserve once-only owned coverage and bounded context-only repeats, or return an explicit structural-unavailable/rejected disposition. `imageTpm: unknown` alone is not refusal when internal estimated demand and known structural bounds fit. Configuration/route structural changes require replan or fail-closed disposition.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0202-01` | Structural-fit reads use full composed request bytes/tokens, reserved output, image count/aggregate bytes/dimensions, resource envelope and effective media limits; no reservation/admission occurs. |
| `RC-01205-0202-02` | Partition and per-batch locator/manifest identity are deterministic; owned visual coverage is once-only and unsupported/over-limit cases carry explicit reasons. |
| `RC-01205-0202-03` | Unknown image TPM alone never produces `unexamined`/`blocked`; changed route/configuration/policy causes explicit replan or fail-closed outcome. |

## Boundaries

No inventory-rule changes, persistence, BSS admission, provider work, GHR, hydration, grants or semantic interpretation. CFC/HMN is limited to BSS prospective structural-fit and partition authority.

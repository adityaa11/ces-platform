# IDSER-012-05-03 — Split map: immutable v3 handoff and cutover

- **State:** `planned`; non-executable split map. Do not invoke GO/CK/CFC/HMN here.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

The former leaf mixed bounded new-record persistence with operational v1/v2 retirement and GHR active-boundary behavior. Cutover must not be repaired through the persistence contract, and vice versa.

| Order | Executable child | Sole owned outcome |
| --- | --- | --- |
| 1 | [IDSER-012-05-03-01](IDSER-012-05-03-01-immutable-v3-locator-persistence.md) | Atomic, idempotent v3 locator/hash/measurement persistence only |
| 2 | [IDSER-012-05-03-02](IDSER-012-05-03-02-v3-operational-cutover-and-reference-ghr-validation.md) | Explicit old-work disposition, v1/v2 retirement and reference-only v3 GHR validation |

Both children require `-05-02-02` CK PASS. Neither authorizes runtime SEM resolution, grants, hydration, transport, dispatch, BSS admission or production GHR delivery.

| Former row | Preserved by |
| --- | --- |
| `RC-01205-03-01`, `-02`, `-04` | `RC-01205-0301-01..04` |
| `RC-01205-03-03` | `RC-01205-0302-01..03` |

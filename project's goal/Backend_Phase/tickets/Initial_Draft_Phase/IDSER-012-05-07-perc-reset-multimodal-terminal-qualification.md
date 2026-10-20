# IDSER-012-05-07 — Split map: PERC-RESET terminal qualification

- **State:** `planned`; non-executable split map. Do not invoke GO/CK/CFC/HMN here.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

The former terminal leaf coupled protected canonical-source proof with writable isolated end-to-end qualification and the SEM-CUTOVER handoff record. Canonical-data integrity is an independent hard gate and must not be remediated in the integration harness.

| Order | Executable child | Sole owned outcome |
| --- | --- | --- |
| 1 | [IDSER-012-05-07-01](IDSER-012-05-07-01-canonical-safara-source-qualification.md) | Read-only verification and isolated logical snapshot qualification of the canonical Safara oracle |
| 2 | [IDSER-012-05-07-02](IDSER-012-05-07-02-isolated-multimodal-terminal-parity-qualification.md) | Isolated v3 planner-to-reconstruction parity, no-effect proof and SEM-CUTOVER handoff record |

`-07-01` requires all `-01-01` through `-04-02` CK PASS; `-07-02` also requires `-07-01` CK PASS. Neither child authorizes SEM execution, provider calls, image hydration, BSS admission, semantic results, REL-03, parser/finalizer work, live GHR or canonical writes.

| Former row | Preserved by |
| --- | --- |
| `RC-01205-07-01`, `-06` | `RC-01205-0701-01..04` |
| `RC-01205-07-02` | `RC-01205-0702-01` |
| `RC-01205-07-03`, `-04`, `-05` | `RC-01205-0702-02..04` |
| `RC-01205-07-07` | `RC-01205-0702-06` |

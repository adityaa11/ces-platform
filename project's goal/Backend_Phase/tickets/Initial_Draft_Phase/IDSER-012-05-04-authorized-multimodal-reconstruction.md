# IDSER-012-05-04 — Split map: authorized resolution and reconstruction parity

- **State:** `planned`; non-executable split map. Do not invoke GO/CK/CFC/HMN here.
- **Parent:** [IDSER-012-05](IDSER-012-05-multimodal-request-parity-and-sem-execution-completion.md).

The former leaf combined an authorization/integrity resolver with deterministic request reconstruction. A scope-control finding and a composer-parity finding need independent CFC/HMN boundaries.

| Order | Executable child | Sole owned outcome |
| --- | --- | --- |
| 1 | [IDSER-012-05-04-01](IDSER-012-05-04-01-authorized-v3-reference-resolution.md) | Read-only, source-scoped v3 plan/handoff and accepted-record resolution |
| 2 | [IDSER-012-05-04-02](IDSER-012-05-04-02-transient-multimodal-reconstruction-parity.md) | Exact in-memory request/manifest/measurement parity using that resolver |

Both children require `-05-03-02` CK PASS. No provider request, PNG hydration, grant, browser authority, BSS admitted job, transport, semantic output or result staging is authorized.

| Former row | Preserved by |
| --- | --- |
| `RC-01205-04-01`, `-04` | `RC-01205-0402-01..04` |
| `RC-01205-04-02`, `-03` | `RC-01205-0401-01..03` and `RC-01205-0402-02..03` |

# SEMIR-004: Real NormalizedDocument qualification harness

- **State:** `approved`
- **Review batch:** `SEMIR-BATCH-04`
- **Implementation context:** [SEMIR context §§38–39](../../SEMIR-context.md)
- **Start gate:** SEMIR-001, SEMIR-002, and SEMIR-003 `PASS`; explicit `go`; an existing real `NormalizedDocument v1` path.

## Outcome

Prove that the full offline Semantic IR qualification path begins with the same real `NormalizedDocument v1` boundary Atlas uses—not bespoke raw strings—and retains exact source accounting and evidence grounding through to deterministic semantic evaluation.

```text
deterministic fixture document
  -> real parse/NormalizedDocument v1
  -> authorized source units and stable slots
  -> frozen corpus mapping
  -> Semantic IR fixture
  -> Zod / evidence / accounting / semantic oracle
```

## Frozen scope

Create or reuse a deterministic non-confidential fixture document; parse it through the existing real normalizer; derive source slots from parsed source units; connect corpus cases to those units; and verify evidence quotes against those actual normalized units. Preserve the corpus’s human-authored expectations as the semantic authority.

Run the complete offline release gate: all known-good corpus fixtures parse and pass; required semantic/evidence/accounting mutations fail; provider JSON Schema generates with required descriptions; exact source accounting and deterministic evidence validation pass; affected tests and `git diff --check` pass.

Do not call a provider, replace/relax `NormalizedDocument v1`, use unvalidated raw-string bypasses as qualification proof, read document/project context beyond authorized fixture units, alter perception routes, add persistence/worker behavior, or activate a production semantic route.

## Acceptance and review contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-SEMIR-004-01` | Qualification uses the real Atlas document boundary. | Deterministic fixture parses through the unmodified real `NormalizedDocument v1` path and produces the slots used by the harness. |
| `RC-SEMIR-004-02` | Corpus mapping is source-unit explicit. | Every executed fixture expectation maps to authorized parsed units with stable source-slot identity; no source is silently substituted. |
| `RC-SEMIR-004-03` | Evidence is exact and slot-bound. | Quotes validate as deterministic normalized-text substrings of their current slot; foreign, missing, and fabricated evidence fail. |
| `RC-SEMIR-004-04` | Accounting is exact. | Missing, duplicate, and unknown slots fail; every authorized slot is accounted for exactly once under the harness contract. |
| `RC-SEMIR-004-05` | Full offline release gate is proven. | Good fixtures pass, mandatory mutations fail, schema descriptions survive generation, and all affected tests/`git diff --check` pass. |
| `RC-SEMIR-004-06` | Boundary remains offline and non-production. | Zero provider calls; no normalizer/perception/production-route contract change; artifacts remain fixture-safe and isolated. |

## Validation and reporting

Provide a single reproducible command for the complete offline qualification suite, including schema-generation evidence. Record parser path, source-slot manifest, evidence/accounting results, oracle/mutation summary, test commands, and zero provider calls in an evidence-safe report. Raw/non-fixture document material must remain local/ignored unless already approved as repository fixture data.

## Security readiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-004-IB-01` | `NormalizedDocument v1` remains the authoritative source boundary; only deterministic authorized fixture units enter the harness. |
| `SR-004-TB-01` | Preserve a verifiable slot/evidence boundary so a later provider receives only explicitly authorized units. |
| `SR-004-SA-01` | Fixture and diagnostic handling exclude credentials, private source, and secret-bearing metadata from committed evidence. |
| `SR-004-ES-01` | Keep perception parsing, source-slot derivation, IR validation, evidence validation, oracle, and future provider execution separate. |
| `SR-004-PC-01` | Do not weaken normalizer validation, create a second source authority, or couple the harness to production workers/persistence. |
| `SR-004-VS-01` | Verify parser provenance, deterministic slot identity, quote grounding, exact accounting, and complete offline gate closure. |
| `SR-004-UP-01` | Provider data transfer/retention and document-context policy remain unresolved until the live ticket. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Evidence |
| --- | --- | --- | --- |
| `SR-004-RB-01` | `SR-004-IB-01`, `SR-004-TB-01` | Are all evaluated units derived from the actual normalized fixture boundary? | Parser run, slot manifest, and mapping inspection. |
| `SR-004-RB-02` | `SR-004-SA-01`, `SR-004-PC-01` | Are source artifacts safe and existing Atlas authority unchanged? | Artifact/git and contract/route inspection. |
| `SR-004-RB-03` | `SR-004-ES-01`, `SR-004-VS-01` | Does the complete offline gate independently prove evidence, accounting, and semantic validation? | Reproducible qualification output and mutation report. |

## Handoff

Set `awaiting_review` only after the full offline gate closes. Failure blocks SEMSPIKE-006; do not make an early provider call to diagnose an offline contract failure.

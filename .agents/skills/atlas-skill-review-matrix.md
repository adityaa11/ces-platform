# Atlas shared-skill review matrix

This matrix is the GLF-002 review contract for the provider-neutral skill set.
Every skill returns a candidate or advisory report only. JSON Schema validation,
evidence resolution, ambiguity blocking, approval, revision creation, branch
HEAD movement, materialization, and normal reads are deterministic Atlas gates.

| Skill | Purpose and responsibility | Required input | Output | Authority boundary | Review checks |
|---|---|---|---|---|---|
| `atlas.prd-extraction` | Extract atomic, source-grounded assertions from one immutable PRD or Addendum. | Artifact metadata and page text; targeted state is optional context. | Candidate assertions, unaccounted statements, and questions with skill/mode provenance. | Cannot create truth, projections, revisions, approvals, or commits. | Proposal-not-truth; exact artifact/page/quote evidence; ambiguity becomes a question. |
| `atlas.fixture-repository` | Assemble an append-only repository candidate. | Project ID, source artifacts, requested scenario, optional accepted base. | Candidate branches, revisions, and branch/HEAD-keyed materialized states. Every revision records producing skill ID, skill version, and actual mode. | Cannot approve, commit, mutate storage, or move HEAD. | Stable IDs; branch isolation; every `headRevisionId` resolves; provenance is present. |
| `atlas.fixture-changes` | Stage a proposed change from extraction, correction, or merge context. | Input kind, branch, base revision, current state, and supporting input. | ChangeProposal candidate or explicit question/conflict, with skill/mode provenance. | Cannot resolve conflicts, approve, seal addenda, create revisions, or move HEAD. | Proposal-not-truth; evidence; stale-base/ambiguity handling; approval remains an external gate. |
| `atlas.fixture-projections` | Produce branch-aware Workflow, Facts, CES, and chatbot-read candidates. | Selected branch, matching HEAD revision, resolved facts, requested surfaces, and dependencies. | Projection candidate keyed by `branchId` and `headRevisionId`, with skill/mode provenance. | Cannot create canonical assertions, approvals, revisions, or branch updates. | Deterministic read path; branch isolation; shared semantic value across surfaces. |
| `atlas.fixture-verification` | Report repository and projection invariant violations. | Repository, projections, and optional requested checks. | Advisory pass/fail/inconclusive report with skill/mode provenance. | Cannot repair data, approve proposals, resolve conflict, or assert validity by assumption. | Evidence resolution; ambiguity; approval and HEAD invariants; branch isolation; deterministic read path. |

## Gate classification

| Check | Classification |
|---|---|
| Model-generated candidate or advisory conclusion | Advisory; never truth by itself. |
| JSON Schema manifest/request/response validation | Deterministic gate. |
| Evidence, revision topology, branch/HEAD, and projection consistency | Deterministic gate. |
| Ambiguity or conflict | Deterministic stop until explicit resolution. |
| Approval, immutable revision creation, and HEAD movement | Deterministic repository authority only. |

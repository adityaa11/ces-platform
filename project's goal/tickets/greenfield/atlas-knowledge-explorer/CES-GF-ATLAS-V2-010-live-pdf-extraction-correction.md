# CES-GF-ATLAS-V2-010 - Live PDF Extraction Correction

**Status:** Planned
**Depends on:** ATLAS-V2-009
**Priority:** Blocking

## Confirmed Diagnostic Evidence

- Native PDF ingestion read all 7 pages and 12,540 normalized characters.
- It produced 383 line-level source units, including all nine expected module
  headings, so the primary failure is not missing PDF text.
- 143 units contain fewer than four characters and wrapped paragraphs are split
  across units.
- Only synthetic `PDF page N` headings became section paths; real numbered PRD
  headings remained ordinary paragraphs.
- The single provider request was about 325 KB and asked for facts across all
  383 units without an exhaustive coverage contract.
- Module scoping currently depends on section paths, so facts under `PDF page N`
  cannot attach to actual business modules.
- Main Workflow endpoint resolution uses exact label equality, so numbering or
  harmless source-label variation can erase evidenced relationships.
- Assembly creates a Business Workflow root after any single module fact, even
  when graph selection found no workflow support.

## Why This Ticket Exists

Atlas V2 passed synthetic qualification but failed its first real Safara PDF
run. The CLI published a structurally valid bundle containing one introductory
sentence classified as a module, no relationships, and no supporting graphs.
This is not a workflow and must never have been reported as successful.

This ticket supersedes any claim that Atlas V2 live extraction is complete.
Contracts, recursive assembly, CLI publication, and UI rendering exist, but the
live semantic extraction and publication-quality boundary are not production
ready.

## Observed Failure

The real run against `Safara_Buyer_Business_PRD.pdf` produced:

- one module from introductory context;
- two total knowledge nodes;
- zero Main Workflow relationships;
- no supporting graph children;
- a partial Main Workflow presented as if it were usable;
- initially invalid provider `schema_version` output;
- provider paraphrases that violated exact-source requirements;
- automatic paraphrase replacement that preserved source wording but retained
  an incorrect semantic classification;
- no persisted sanitized intermediate facts sufficient to diagnose coverage;
- no quality gate preventing publication of clearly incomplete output.

The synthetic fixtures proved only that downstream components work when given
good facts. They did not prove that the live provider can extract those facts
from a real PDF.

## Current Reusable State

Subject to verification, these V2 components remain useful:

- exact PDF/source-unit ingestion and evidence locations;
- renderer-neutral recursive knowledge contracts;
- graph selection from already-valid semantic facts;
- recursive knowledge assembly;
- proposed/approved governance identities;
- V2-only CLI, API, and Next.js workspace;
- permanent Main Workflow with supporting detail below it.

They must not be used as evidence that live extraction quality is complete.

## Expected Output

For a PRD, Atlas must first determine what structures the document explicitly
supports. It must not assume every PRD contains a workflow.

For the Safara qualification document, the expected project map contains
source-worded modules such as:

- `Paket dan Jadwal Keberangkatan`;
- `Data Jemaah`;
- `Pendaftaran Jemaah`;
- `Tagihan dan Pembayaran`;
- `Dokumen Jemaah`;
- `Status Perjalanan dan Kesiapan`;
- `Manifest Keberangkatan`;
- `Dashboard dan Laporan`;
- `Riwayat Aktivitas`.

Relationships use standardized English descriptions supported by explicit PDF
evidence. Applicable supporting structures are selected independently per
module, including workflow, state machine, decision tree, entity lifecycle,
dependency graph, audit flow, or entity relationship. Original document labels
must never be translated or replaced by invented terminology.

The Main Workflow remains pinned. Selecting a module renders its supporting
knowledge below it, maintains recursive breadcrumbs, and synchronizes the cited
original PDF evidence on the right.

Safara is qualification evidence, not production logic. A non-Safara workflow
document and a non-workflow document must pass through the same implementation.

## Required Correction

### 1. Audit the emergency changes

- Review all uncommitted schema-version, semantic-identity, diagnostic, and
  paraphrase-replacement changes.
- Retain only independently justified behavior.
- Remove automatic conversion of a provider paraphrase into an arbitrary whole
  source unit; invalid semantic meaning must not be hidden by exact wording.

### 2. Extract by bounded source scope

- Process the document by section or another deterministic bounded source-unit
  group instead of relying on one provider call for the entire PDF.
- Pass section identity and exact source units to the generic Agents Bridge.
- Merge section results deterministically using canonical semantic identities.
- Preserve cross-section relationship candidates for a separate evidenced pass.

### 3. Separate context from semantic modules

- Introductions, goals, background, and broad application descriptions are
  context unless the document explicitly defines them as modules.
- A module requires evidence such as a section heading, explicit module/domain
  definition, or repeated business capability identity.
- A sentence describing the desire for an application is not a module merely
  because it mentions business activity.

### 4. Enforce exact-source semantics

- `exact_statement`, labels, and terms must be exact substrings of cited source
  units.
- Paraphrased or invented facts are rejected or retried, never silently promoted.
- Provider correction attempts are bounded and auditable.
- Failed facts retain safe diagnostic categories without exposing document text
  or credentials.

### 5. Add extraction coverage and publication gates

Before writing a usable knowledge bundle, Atlas must check:

- major document sections were considered;
- extracted modules have valid module evidence;
- supported relationships have valid endpoints and evidence;
- graph suitability follows explicit semantic facts;
- vague introductory prose is not the only module;
- uncertainty and missing coverage are reported;
- the result is not misleadingly presented as a complete Main Workflow.

If these gates fail, the CLI must return a distinct incomplete-extraction exit
status, persist review diagnostics, and not publish `atlas-knowledge.json` as a
usable proposal.

### 6. Persist safe qualification evidence

- Persist sanitized provider intermediate facts per bounded source scope.
- Persist coverage, rejected-fact reasons, retry history, and publication-gate
  decisions.
- Never persist credentials, unrestricted prompts, or hidden reasoning.

### 7. Qualify the live path

- Run the actual provider path against the real Safara PDF.
- Compare extracted source-worded modules, relationships, graph selection,
  hierarchy, and evidence against the agreed context documents.
- Run the same path against one unrelated workflow PRD and one unrelated
  non-workflow PRD.
- Synthetic provider-result fixtures remain unit tests only and cannot close
  live-provider acceptance.

## Acceptance Criteria

- The introductory Safara sentence is not classified as a module.
- The Safara output contains the evidenced major modules and relationships needed
  for the agreed project map, without production hardcoding of their labels.
- Applicable supporting graphs are recursively attached to their modules.
- Original document wording is exact; relationship descriptions are English.
- A structurally different non-Safara workflow passes.
- A non-workflow PRD selects appropriate non-workflow structures and is not
  forced into a business workflow.
- Invalid, sparse, or misleading extraction is rejected before proposal
  publication with actionable diagnostics.
- Repeated identical input and provider results produce identical artifacts.
- Proposed and approved bundles retain identical evidence and topology.
- The PDF workspace opens the cited original document and synchronizes evidence
  only after the semantic bundle passes publication gates.
- No completion claim is allowed from synthetic fixtures alone.

## Explicit Non-Goals

- Do not hardcode Safara labels, section numbers, relationships, or topology.
- Do not repair semantic meaning by replacing it with a larger exact paragraph.
- Do not modify the UI to make incomplete extraction appear more convincing.
- Do not restore any Atlas V1 fallback, Mermaid-only path, or fixed detail model.
- Do not mark this ticket complete merely because schemas, tests, or builds pass.

## Completion Evidence Required

The ticket may be completed only with:

1. committed implementation and tests;
2. sanitized artifacts from all three live qualification documents;
3. an explicit coverage-gate report;
4. a comparison against the expected Safara project-map objectives;
5. passing typecheck, architecture, security, determinism, and production build;
6. a manual UI review showing the correct generated knowledge and PDF evidence.

## Required Execution Tickets

Execute and commit these in order. This parent remains planned until all six are
complete:

1. [ATLAS-V2-010A](CES-GF-ATLAS-V2-010A-emergency-change-audit-diagnostics.md)
   - audit emergency changes and establish safe live diagnostics.
2. [ATLAS-V2-010B](CES-GF-ATLAS-V2-010B-pdf-structural-reconstruction.md)
   - reconstruct headings, paragraphs, and section hierarchy.
3. [ATLAS-V2-010C](CES-GF-ATLAS-V2-010C-bounded-exhaustive-extraction.md)
   - extract every relevant section through bounded provider calls.
4. [ATLAS-V2-010D](CES-GF-ATLAS-V2-010D-semantic-merge-scope-resolution.md)
   - merge facts, scope supporting graphs, and resolve canonical endpoints.
5. [ATLAS-V2-010E](CES-GF-ATLAS-V2-010E-coverage-publication-gates.md)
   - reject sparse or misleading output before proposal publication.
6. [ATLAS-V2-010F](CES-GF-ATLAS-V2-010F-live-provider-qualification.md)
   - qualify the real provider and UI across three unrelated document shapes.

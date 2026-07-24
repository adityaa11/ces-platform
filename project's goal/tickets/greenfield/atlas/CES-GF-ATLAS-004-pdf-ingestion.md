# CES-GF-ATLAS-004 — Atlas: PDF Document Ingestion

**Phase:** 3C — Atlas Operationalization  
**Parent:** Greenfield Product Suite  
**Status:** Implemented locally

**Evidence:** [`evidence/CES-GF-ATLAS-004-local-pdf-ingestion.md`](evidence/CES-GF-ATLAS-004-local-pdf-ingestion.md)

## Goal

Convert text-based and scanned PDF PRDs into normalized, provenance-preserving
source documents that can enter the existing Atlas candidate-extraction
boundary without using an agent to invent or rewrite source text.

## Work

- Add a PDF ingestion package behind a document-format-neutral ingestion port.
- Extract text from text-based PDFs in deterministic page order.
- Add an optional, explicitly configured OCR adapter for image-only pages.
- Pin and record parser, OCR engine, language-data, and normalization versions.
- Extend source provenance backward-compatibly with page ranges, page hashes,
  extraction method, and OCR confidence where applicable.
- Normalize extracted text, whitespace, line endings, and page boundaries.
- Preserve the original PDF hash and per-page source identity.
- Detect encrypted, corrupt, empty, mixed text/image, and unsupported PDFs.
- Enforce configurable file-size, page-count, decompression, and processing-time
  limits.
- Ignore active content, attachments, scripts, links, and embedded executables.
- Feed normalized documents into ATLAS-001 without granting the parser or OCR
  adapter access to agent-provider or approval APIs.

## Acceptance criteria

- [x] Ingestion itself does not call an agent or infer requirements.
- [x] Identical supported PDFs with identical pinned tool versions produce
      byte-identical normalized text and provenance.
- [x] Every extracted span traces to the original PDF, page, and page revision.
- [x] OCR-derived text is visibly distinct from native PDF text.
- [x] Low-confidence OCR produces reviewable uncertainty and cannot silently
      become confirmed source text.
- [x] Encrypted, malformed, empty, oversized, or over-limit inputs fail closed
      with structured diagnostics.
- [x] Existing Markdown ingestion remains backward-compatible.
- [x] Normalized PDF output can enter ATLAS-001 candidate extraction.

## Required evidence

- [x] Native-text, scanned, mixed-content, multi-page, and repeated-run fixtures.
- [x] Page provenance and content-hash fixtures.
- [x] OCR confidence and unavailable-OCR fixtures.
- [x] Encrypted, malformed, oversized, decompression-limit, and timeout fixtures.
- [x] Architecture test proving no PDF-ingestion-to-agent dependency.
- [x] PDF-to-ATLAS-001 integration test.
- [x] License and supply-chain review for the selected parser and optional OCR
      runtime.

## Security and privacy

- PDF bytes and extracted text stay local unless the later agent-extraction step
  is explicitly configured to send normalized content to a provider.
- Logs must not contain full PDF text, credentials, or document bytes.
- Temporary files must use bounded workspace-owned locations and be removed
  safely after processing.
- OCR is disabled unless configured; unavailable OCR fails explicitly for
  image-only pages.

## Out of scope

- Requirement inference during PDF parsing.
- Automatic correction of OCR text by an agent.
- Handwriting recognition.
- General-purpose PDF editing.
- Layout-perfect document reconstruction.
- Legal conclusions about document authenticity.

## Depends on

- `CES-GF-ATLAS-003`

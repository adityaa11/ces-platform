# CES-GF-ATLAS-004 Local PDF Ingestion Evidence

**Validated:** 24 July 2026  
**Status:** Implemented locally; hosted validation pending

## Delivered package

Package: `@company/ces-pdf-ingestion`

- Pins Mozilla PDF.js distribution `5.7.284`.
- Accepts workspace-relative `.pdf` inputs as bytes.
- Extracts native text in stable page and text-item order.
- Emits one normalized virtual Markdown document compatible with ATLAS-001.
- Preserves original PDF hash, normalized content hash, page numbers, normalized
  line ranges, extraction method, and derived page revision hashes.
- Exposes an optional OCR adapter without selecting or installing an OCR
  runtime.
- Marks OCR text in normalized source and emits structured low-confidence
  warnings.
- Uses no temporary files and writes no document content to logs.

## Agent boundary

PDF parsing and OCR do not import or call the agent-provider SDK. The
architecture matrix permits PDF ingestion to depend only on deterministic
document ingestion. Page provenance contracts are defined locally and handed
off through backward-compatible shared source fields.

The integration fixture sends only the normalized virtual Markdown document
into ATLAS-001. Original PDF bytes do not enter the provider request. Page
provenance survives extraction, human review, and Requirement Package emission.

## Determinism and provenance

Repeated ingestion of the same multi-page PDF with the same parser version
produces equal normalized content, document hashes, page line ranges, page
revision hashes, parser metadata, and warnings.

Each page revision binds:

- original PDF hash;
- page number;
- parser and parser version;
- extraction method;
- normalized text;
- OCR engine, OCR version, language-data version, and confidence when present.

## Fail-closed evidence

Structured `PdfIngestionError` codes cover:

- unsafe or non-PDF paths;
- invalid headers and malformed PDFs;
- encrypted PDFs;
- byte, page-count, extracted-character, and processing-time limits;
- image-only pages when OCR is disabled;
- OCR adapter failure;
- empty extracted pages.

Low-confidence OCR returns a structured warning and a visible source marker. It
is never represented as native or confirmed text.

## Parser and supply-chain evidence

- Package: `pdfjs-dist`
- Version: `5.7.284`
- License: Apache-2.0
- Registry audit: no known vulnerabilities reported on 24 July 2026
- Parser documentation:
  [`getDocument` API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html)
- Upstream distribution:
  [`mozilla/pdf.js`](https://github.com/mozilla/pdf.js)

No OCR dependency is installed. A future OCR adapter requires its own pinned
runtime, language-data, license, and vulnerability evidence.

## Local validation

```text
corepack pnpm check

Typecheck: passed
Tests:     214 passed, 0 failed, 0 skipped
Test files: 31 passed
Build:     passed
```

## Remaining evidence

Hosted CI must pass on the committed ATLAS-004 implementation before
`CES-GF-ATLAS-005` begins.

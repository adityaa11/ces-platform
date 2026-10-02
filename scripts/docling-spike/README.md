# DOCSPIKE-001 local Docling runner

This runner is intentionally separate from production dependencies and uses only local PDF bytes. It writes raw Docling diagnostics and Atlas-facing artifacts under the ignored `.atlas-data/docling-spike/` directory.

Use the already installed Python runtime:

```powershell
& 'C:\Users\ASUS\AppData\Local\Programs\Python\Python313\python.exe' scripts/docling-spike/extract.py --input "project's goal/Safara_Buyer_Business_PRD.pdf" --output .atlas-data/docling-spike/safara-full/run-1
pnpm --filter @atlas/core exec jiti ../../scripts/docling-spike/normalize.mts .atlas-data/docling-spike/safara-full/run-1/docling.provider-result.json .atlas-data/docling-spike/safara-full/run-1/atlas.normalized-document.json safara-full "project's goal/Safara_Buyer_Business_PRD.pdf"
```

`extract.py` keeps Docling's item iteration order, maps only source-backed fields, and omits geometry when Docling's serialized coordinate origin cannot be established as a valid top-left coordinate within page dimensions. The baseline uses Docling's local PDF pipeline with OCR disabled because the three frozen inputs are digital PDFs; pass `--ocr` only for the ticket's justified OCR follow-up. It emits no confidence scores because the normal local Docling PDF result does not expose block-specific source confidence through this mapper. Visual regions are also omitted: their Docling geometry was not stable across equivalent primary runs, and v1 permits honest omission.

To run the entire frozen document matrix and primary repeat:

```powershell
scripts/docling-spike/run-all.ps1
```

The generated `summary.json` stays ignored with the remaining diagnostic material; it contains hashes and counts but no raw diagnostic export.

param(
  [string]$Python = "C:\Users\ASUS\AppData\Local\Programs\Python\Python313\python.exe",
  [string]$OutputRoot = ".atlas-data/docling-spike"
)

$ErrorActionPreference = "Stop"
$documents = @(
  @{ Id = "safara-full"; Path = "project's goal/Safara_Buyer_Business_PRD.pdf" },
  @{ Id = "safara-finance"; Path = "docs/example/Safara_PRD_02_Finance_Documents.pdf" },
  @{ Id = "safara-readiness"; Path = "docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf" }
)

foreach ($document in $documents) {
  $run = Join-Path $OutputRoot "$($document.Id)/run-1"
  & $Python -u scripts/docling-spike/extract.py --input $document.Path --output $run
  if ($LASTEXITCODE -ne 0) { throw "Docling extraction failed: $($document.Id)" }
  $provider = (Resolve-Path (Join-Path $run 'docling.provider-result.json')).Path
  $normalized = (Join-Path (Resolve-Path $run).Path 'atlas.normalized-document.json')
  pnpm --filter @atlas/core exec jiti (Resolve-Path scripts/docling-spike/normalize.mts) $provider $normalized $document.Id (Resolve-Path $document.Path)
  if ($LASTEXITCODE -ne 0) { throw "Atlas normalization failed: $($document.Id)" }
}

# A second equivalent primary run is the deterministic comparison input.
$repeat = Join-Path $OutputRoot 'safara-full/run-2'
& $Python -u scripts/docling-spike/extract.py --input $documents[0].Path --output $repeat
if ($LASTEXITCODE -ne 0) { throw "Docling repeat extraction failed" }
$repeatProvider = (Resolve-Path (Join-Path $repeat 'docling.provider-result.json')).Path
$repeatNormalized = (Join-Path (Resolve-Path $repeat).Path 'atlas.normalized-document.json')
pnpm --filter @atlas/core exec jiti (Resolve-Path scripts/docling-spike/normalize.mts) $repeatProvider $repeatNormalized safara-full (Resolve-Path $documents[0].Path)
if ($LASTEXITCODE -ne 0) { throw "Atlas repeat normalization failed" }

& $Python scripts/docling-spike/summarize.py --root $OutputRoot

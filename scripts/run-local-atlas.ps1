param(
  [string]$Prd = "docs/prd/Safara_Buyer_Business_PRD.pdf",
  [string]$ProjectIntent = "docs/prd/safara-project-intent.json",
  [string]$Output = ".ces/generated/safara-atlas"
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $repositoryRoot "agent.env"
if (-not (Test-Path -LiteralPath $environmentFile)) {
  throw "Missing local agent.env"
}

foreach ($line in [System.IO.File]::ReadAllLines($environmentFile)) {
  $trimmed = $line.Trim()
  if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
  $parts = $trimmed.Split("=", 2)
  if ($parts.Count -ne 2) { throw "Invalid agent.env entry" }
  [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
}
if (-not $env:GEMINI_API_KEY -or $env:GEMINI_API_KEY.StartsWith("replace-")) {
  throw "GEMINI_API_KEY is not configured"
}
if (-not $env:AGENTS_BRIDGE_API_KEY -or $env:AGENTS_BRIDGE_API_KEY.StartsWith("replace-")) {
  throw "AGENTS_BRIDGE_API_KEY is not configured"
}

$env:HOST = "127.0.0.1"
$env:PORT = "8787"
$env:CES_ATLAS_API_KEY = $env:AGENTS_BRIDGE_API_KEY
if (-not $env:GEMINI_MODEL) { $env:GEMINI_MODEL = "gemini-3.5-flash-lite" }
$logDirectory = Join-Path $repositoryRoot ".ces/runtime"
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$stdoutLog = Join-Path $logDirectory "agents-bridge.stdout.log"
$stderrLog = Join-Path $logDirectory "agents-bridge.stderr.log"

$bridge = Start-Process -FilePath "node" `
  -ArgumentList "apps/agents-bridge/dist/main.js" `
  -WorkingDirectory $repositoryRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8787/readyz"
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {
      Start-Sleep -Milliseconds 200
    }
  }
  if (-not $ready) { throw "Agents Bridge did not become ready; inspect $stderrLog" }

  $model = $env:GEMINI_MODEL
  & node apps/cli/dist/index.js atlas run `
    --prd $Prd `
    --project-intent $ProjectIntent `
    --provider-endpoint "http://127.0.0.1:8787/v1/atlas/analyze" `
    --provider "ces-agents-bridge" `
    --model $model `
    --output $Output
  $atlasExitCode = $LASTEXITCODE
  if ($atlasExitCode -ne 7) {
    throw "Atlas exited with code $atlasExitCode (expected 7 for review pending)"
  }
  Write-Output "Atlas extraction completed and paused for review at $Output"
} finally {
  if (-not $bridge.HasExited) {
    Stop-Process -Id $bridge.Id
    $bridge.WaitForExit()
  }
}

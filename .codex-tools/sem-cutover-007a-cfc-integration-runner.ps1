param(
  [Parameter(Mandatory = $true)]
  [string]$EvidenceDir
)

$ErrorActionPreference = "Stop"
$stdoutPath = Join-Path $EvidenceDir "stdout.log"
$stderrPath = Join-Path $EvidenceDir "stderr.log"
$exitPath = Join-Path $EvidenceDir "exit-code.txt"
& node --env-file=.env apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-worker.integration.test.ts 1> $stdoutPath 2> $stderrPath
$runExitCode = $LASTEXITCODE
[System.IO.File]::WriteAllText($exitPath, "$runExitCode`n")
exit $runExitCode

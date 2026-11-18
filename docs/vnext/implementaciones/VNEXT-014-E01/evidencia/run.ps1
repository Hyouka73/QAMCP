param([Parameter(Mandatory=$true)][string]$Name, [string[]]$Filters = @(), [switch]$Instrumented, [switch]$Serial)
$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
Set-Location -LiteralPath $repository
$argumentsForRun = @('--filter', '@qap/mcp', 'exec', 'vitest', 'run') + $Filters
if ($Instrumented) {
  $env:QAP_E01_TRACE = Join-Path $PSScriptRoot ($Name + '-stages')
  $argumentsForRun += @('--config', '../../docs/vnext/implementaciones/VNEXT-014-E01/evidencia/diagnostic.config.ts')
} else { Remove-Item Env:QAP_E01_TRACE -ErrorAction SilentlyContinue }
if ($Serial) { $argumentsForRun += '--no-file-parallelism' }
$argumentsForRun += @('--reporter=default', '--reporter=json', ('--outputFile=../../docs/vnext/implementaciones/VNEXT-014-E01/evidencia/' + $Name + '.json'))
$started = [DateTime]::UtcNow
& pnpm @argumentsForRun *> (Join-Path $PSScriptRoot ($Name + '.log'))
$code = $LASTEXITCODE
@{ name=$Name; arguments=$argumentsForRun; started_at=$started.ToString('o'); finished_at=[DateTime]::UtcNow.ToString('o'); exit_code=$code } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot ($Name + '-manifest.json')) -Encoding utf8
Get-Content -LiteralPath (Join-Path $PSScriptRoot ($Name + '.log')) -Tail 10
Write-Output ('exit=' + $code)

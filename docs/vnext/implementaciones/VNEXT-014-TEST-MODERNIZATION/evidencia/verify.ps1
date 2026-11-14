$ErrorActionPreference = 'Stop'
$evidenceDirectory = $PSScriptRoot
$repositoryDirectory = (Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
Set-Location -LiteralPath $repositoryDirectory
$checks = @(
  @{ Name = 'final-build'; Arguments = @('run', 'build') },
  @{ Name = 'final-engine'; Arguments = @('--fail-if-no-match', '--filter', '@qap/engine', 'test') },
  @{ Name = 'final-knowledge'; Arguments = @('--fail-if-no-match', '--filter', '@qap/knowledge', 'test') },
  @{ Name = 'final-runner'; Arguments = @('--fail-if-no-match', '--filter', '@qap/playwright-runner', 'test') },
  @{ Name = 'final-cli-verified'; Arguments = @('--fail-if-no-match', '--filter', '@hyouka73/qap-cli', 'test') }
)
$manifest = @()
foreach ($check in $checks) {
  $startedAt = [DateTime]::UtcNow
  $argumentsForCheck = $check.Arguments
  $logPath = Join-Path $evidenceDirectory ($check.Name + '.log')
  & pnpm @argumentsForCheck *> $logPath
  $code = $LASTEXITCODE
  $finishedAt = [DateTime]::UtcNow
  $manifest += @{
    name = $check.Name; command = ('pnpm ' + ($argumentsForCheck -join ' ')); exit_code = $code
    started_at = $startedAt.ToString('o'); finished_at = $finishedAt.ToString('o')
    elapsed_ms = ($finishedAt - $startedAt).TotalMilliseconds
    log_sha256 = (Get-FileHash -LiteralPath $logPath -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  $manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $evidenceDirectory 'verification-manifest.json') -Encoding utf8
  Write-Output ($check.Name + ': exit ' + $code + ', ' + [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2) + 's')
}
if (@($manifest | Where-Object { $_.exit_code -ne 0 }).Count -gt 0) { exit 1 }

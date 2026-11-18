$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
Set-Location -LiteralPath $repository
$checks = @(
  @{ Name='build'; Arguments=@('run','build') },
  @{ Name='engine'; Arguments=@('--fail-if-no-match','--filter','@qap/engine','test') },
  @{ Name='knowledge'; Arguments=@('--fail-if-no-match','--filter','@qap/knowledge','test') },
  @{ Name='runner'; Arguments=@('--fail-if-no-match','--filter','@qap/playwright-runner','test') },
  @{ Name='cli'; Arguments=@('--fail-if-no-match','--filter','@hyouka73/qap-cli','test') },
  @{ Name='shared'; Arguments=@('--fail-if-no-match','--filter','@qap/shared','test') },
  @{ Name='adapter'; Arguments=@('--fail-if-no-match','--filter','@qap/playwright-adapter','test') },
  @{ Name='host-drain'; Arguments=@('--filter','@qap/mcp','exec','vitest','run','host-composition','dispatcher-integration','dispatcher.test') }
)
$manifest = @()
foreach ($check in $checks) {
  $started = [DateTime]::UtcNow
  $argumentsForCheck = $check.Arguments
  & pnpm @argumentsForCheck *> (Join-Path $PSScriptRoot ($check.Name + '.log'))
  $manifest += @{ name=$check.Name; arguments=$argumentsForCheck; exit_code=$LASTEXITCODE; started_at=$started.ToString('o'); finished_at=[DateTime]::UtcNow.ToString('o') }
  $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'verification-manifest.json') -Encoding utf8
  Write-Output ($check.Name + ': exit ' + $LASTEXITCODE)
}
if (@($manifest | Where-Object { $_.exit_code -ne 0 }).Count -gt 0) { exit 1 }

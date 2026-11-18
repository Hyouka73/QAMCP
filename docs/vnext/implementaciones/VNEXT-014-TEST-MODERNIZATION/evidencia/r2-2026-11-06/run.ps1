$ErrorActionPreference = 'Continue'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../../../../../..')).Path
Set-Location -LiteralPath $repo
$manifest = @()
foreach ($suite in @('p3-canonical-discovery','p4-2-canonical-contract','p4-5a2-canonical-integrity','server-canonical-discovery')) {
  $commandArgs = @('--filter','@qap/mcp','exec','vitest','run',"src/__tests__/$suite.test.ts",'--reporter=verbose','--reporter=json',"--outputFile.json=$PSScriptRoot/$suite.json")
  $started = [DateTime]::UtcNow
  & pnpm @commandArgs *> (Join-Path $PSScriptRoot "$suite.log")
  $code = $LASTEXITCODE
  $manifest += @{name=$suite; command=('pnpm '+($commandArgs -join ' ')); exit_code=$code; started_at=$started.ToString('o'); elapsed_ms=([DateTime]::UtcNow-$started).TotalMilliseconds}
  ConvertTo-Json -InputObject $manifest -Depth 6 | Set-Content (Join-Path $PSScriptRoot 'manifest.json') -Encoding utf8
  Write-Output "$suite exit=$code"
}

foreach ($check in @(
  @{name='typecheck';args=@('--filter','@qap/mcp','exec','tsc','--noEmit')},
  @{name='eslint-focal';args=@('exec','eslint','packages/mcp/src/__tests__/fixtures/lifecycle-canonical.ts','packages/mcp/src/__tests__/p3-canonical-discovery.test.ts','packages/mcp/src/__tests__/p4-2-canonical-contract.test.ts','packages/mcp/src/__tests__/p4-5a2-canonical-integrity.test.ts','packages/mcp/src/__tests__/server-canonical-discovery.test.ts','--format','json','--output-file',"$PSScriptRoot/eslint-focal.json")}
)) {
  $commandArgs=$check.args
  $started=[DateTime]::UtcNow
  & pnpm @commandArgs *> (Join-Path $PSScriptRoot ($check.name+'.log'))
  $code=$LASTEXITCODE
  @{command=('pnpm '+($commandArgs -join ' '));exit_code=$code;started_at=$started.ToString('o');elapsed_ms=([DateTime]::UtcNow-$started).TotalMilliseconds} | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot ($check.name+'-command.json')) -Encoding utf8
  Write-Output ($check.name+' exit='+$code)
}
& node (Join-Path $PSScriptRoot 'analyze.mjs')

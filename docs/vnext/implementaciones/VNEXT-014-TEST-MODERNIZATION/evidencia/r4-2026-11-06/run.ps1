$ErrorActionPreference = 'Continue'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../../../../../..')).Path
Set-Location -LiteralPath $repo
$sha = (git rev-parse HEAD).Trim()
$checks = @()
foreach ($suite in @('p3-canonical-discovery','p4-2-canonical-contract','p4-5a-canonical-integrity','p4-5a2-canonical-integrity','server-canonical-discovery','server-canonical-operations','server','plan-handler','test-handler')) {
  $checks += @{name=$suite;arguments=@('--filter','@qap/mcp','exec','vitest','run',"src/__tests__/$suite.test.ts",'--reporter=verbose','--reporter=json',"--outputFile.json=$PSScriptRoot/$suite.json")}
}
$checks += @{name='typecheck';arguments=@('--filter','@qap/mcp','exec','tsc','--noEmit')}
$checks += @{name='eslint-focal';arguments=@('exec','eslint','packages/mcp/src/__tests__/fixtures/lifecycle-canonical.ts','packages/mcp/src/__tests__/p3-canonical-discovery.test.ts','packages/mcp/src/__tests__/p4-5a2-canonical-integrity.test.ts','packages/mcp/src/__tests__/server-canonical-discovery.test.ts','packages/mcp/src/__tests__/server-canonical-operations.test.ts','packages/mcp/src/__tests__/server.test.ts','--format','json','--output-file',"$PSScriptRoot/eslint-focal.json")}
$checks += @{name='build';arguments=@('build')}
$manifest=@()
foreach($check in $checks) {
  $started=[DateTime]::UtcNow
  $commandArgs=$check.arguments
  & pnpm @commandArgs *> (Join-Path $PSScriptRoot ($check.name+'.log'))
  $code=$LASTEXITCODE
  $manifest += @{name=$check.name;sha=$sha;command=('pnpm '+($commandArgs -join ' '));exit_code=$code;started_at=$started.ToString('o');elapsed_ms=([DateTime]::UtcNow-$started).TotalMilliseconds}
  ConvertTo-Json -InputObject $manifest -Depth 6 | Set-Content (Join-Path $PSScriptRoot 'manifest.json') -Encoding utf8
  Write-Output ($check.name+' exit='+$code)
}

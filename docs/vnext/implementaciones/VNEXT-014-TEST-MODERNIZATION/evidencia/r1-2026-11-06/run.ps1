$ErrorActionPreference = 'Continue'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../../../../../..')).Path
Set-Location -LiteralPath $repo
$checks = @()
foreach ($suite in @('p3-canonical-discovery','p4-2-canonical-contract','p4-5a-canonical-integrity','p4-5a2-canonical-integrity','server-canonical-discovery','lifecycle-v3-e2e')) {
  $checks += @{ Name=$suite; Arguments=@('--filter','@qap/mcp','exec','vitest','run',"src/__tests__/$suite.test.ts",'--reporter=verbose','--reporter=json',"--outputFile.json=$PSScriptRoot/$suite.json") }
}
$checks += @{Name='serial';Arguments=@('--filter','@qap/mcp','exec','vitest','run','--no-file-parallelism','--reporter=default','--reporter=json',"--outputFile.json=$PSScriptRoot/serial.json")}
$checks += @{Name='parallel';Arguments=@('--filter','@qap/mcp','exec','vitest','run','--reporter=default','--reporter=json',"--outputFile.json=$PSScriptRoot/parallel.json")}
$checks += @{Name='typecheck';Arguments=@('--filter','@qap/mcp','exec','tsc','--noEmit')}
$checks += @{Name='lint';Arguments=@('lint','--format','json','--output-file',"$PSScriptRoot/lint.json")}
$manifest = @()
foreach ($check in $checks) {
  $start = [DateTime]::UtcNow
  $checkArgs = $check.Arguments
  & pnpm @checkArgs *> (Join-Path $PSScriptRoot ($check.Name+'.log'))
  $code=$LASTEXITCODE
  $manifest += @{name=$check.Name;command=('pnpm '+($checkArgs -join ' '));exit_code=$code;started_at=$start.ToString('o');elapsed_ms=([DateTime]::UtcNow-$start).TotalMilliseconds}
  ConvertTo-Json -InputObject $manifest -Depth 5 | Set-Content (Join-Path $PSScriptRoot 'manifest.json') -Encoding utf8
  Write-Output ($check.Name+': exit '+$code)
}

param([string]$Phase)
$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Judirico\Documents\QAMCP\QAMCP'
$evidence = 'C:\Users\Judirico\Documents\QAMCP\rescate-evidence\20261105-integracion'
Set-Location -LiteralPath $repo
$env:TEMP = Join-Path $evidence "tmp-$Phase"
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
function Run-Check([string]$Name, [string[]]$Arguments) {
  $start = [DateTime]::UtcNow
  & pnpm @Arguments *> (Join-Path $evidence "$Name.log")
  $code = $LASTEXITCODE
  $record = @{name=$Name; args=$Arguments; exit=$code; start=$start.ToString('o'); duration_s=([DateTime]::UtcNow-$start).TotalSeconds}
  $record | ConvertTo-Json -Compress | Set-Content (Join-Path $evidence "$Name.command.json")
  Write-Output "$Name exit=$code"
}
if ($Phase -eq 'auxiliary') {
  foreach ($spec in @(@('engine','@qap/engine'),@('knowledge','@qap/knowledge'),@('cli','@hyouka73/qap-cli'))) {
    $name="final-$($spec[0])"
    Run-Check $name @('--filter',$spec[1],'exec','vitest','run','--reporter=default','--reporter=json',"--outputFile=$evidence/$name.json")
  }
} else {
  $name="final-$Phase"
  $testArgs=@('--filter','@qap/mcp','exec','vitest','run','--reporter=default','--reporter=json',"--outputFile=$evidence/$name.json")
  if ($Phase -eq 'serial') { $testArgs += '--no-file-parallelism' }
  Run-Check $name $testArgs
}

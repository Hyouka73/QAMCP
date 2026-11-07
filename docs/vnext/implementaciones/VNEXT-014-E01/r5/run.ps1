param([Parameter(Mandatory=$true)][string]$Name, [switch]$Serial, [string[]]$Filters=@(), [switch]$Instrumented)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
Set-Location -LiteralPath $repo
$sha=(git rev-parse HEAD).Trim()
$runArgs=@('--filter','@qap/mcp','exec','vitest','run')+$Filters
if($Serial){$runArgs+='--no-file-parallelism'}
if($Instrumented){
  $env:QAP_E01_TRACE=Join-Path $PSScriptRoot ($Name+'-stages')
  $env:DEBUG='pw:browser'
  $runArgs+=@('--config',"$PSScriptRoot/diagnostic.config.ts")
} else {
  Remove-Item Env:QAP_E01_TRACE,Env:DEBUG -ErrorAction SilentlyContinue
}
$runArgs+=@('--reporter=verbose','--reporter=json',"--outputFile.json=$PSScriptRoot/$Name.json")
$started=[DateTime]::UtcNow
& pnpm @runArgs *> (Join-Path $PSScriptRoot ($Name+'.log'))
$code=$LASTEXITCODE
@{name=$Name;sha=$sha;arguments=$runArgs;started_at=$started.ToString('o');finished_at=[DateTime]::UtcNow.ToString('o');elapsed_ms=([DateTime]::UtcNow-$started).TotalMilliseconds;exit_code=$code;instrumented=[bool]$Instrumented} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot ($Name+'-manifest.json')) -Encoding utf8
Get-Content -LiteralPath (Join-Path $PSScriptRoot ($Name+'.log')) -Tail 12
Write-Output ('exit='+$code)

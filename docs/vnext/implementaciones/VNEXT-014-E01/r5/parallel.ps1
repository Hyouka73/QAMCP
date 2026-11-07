param([string[]]$Names=@('parallel-1','parallel-2'),[switch]$Instrumented)
$ErrorActionPreference='Stop'
foreach($name in $Names) {
  # Read-only, whole-host sampling; no command lines, credentials or file contents.
  $stop=Join-Path $PSScriptRoot ($name+'.stop')
  $job=Start-Job -ArgumentList $PSScriptRoot,$name,$stop -ScriptBlock {
    param($output,$name,$stop)
    $rows=@()
    while(!(Test-Path -LiteralPath $stop)) {
      $memory=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory
      $cpu=Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"
      $disk=Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk -Filter "Name='_Total'"
      $processes=@(Get-Process node,chrome,headless_shell -ErrorAction SilentlyContinue | ForEach-Object {
        @{pid=$_.Id;name=$_.ProcessName;working_set_bytes=$_.WorkingSet64;cpu_seconds=$_.CPU}
      })
      $rows+=@{at=[DateTime]::UtcNow.ToString('o');available_mb=$memory.AvailableMBytes;pages_input_per_sec=$memory.PagesInputPersec;cpu_percent=$cpu.PercentProcessorTime;disk_queue=$disk.CurrentDiskQueueLength;processes=$processes}
      Start-Sleep -Seconds 1
    }
    ConvertTo-Json -InputObject $rows -Depth 6 | Set-Content -LiteralPath (Join-Path $output ($name+'-host.json')) -Encoding utf8
  }
  try { & (Join-Path $PSScriptRoot 'run.ps1') -Name $name -Instrumented:$Instrumented }
  finally {
    Set-Content -LiteralPath $stop -Value 'done'
    $job | Wait-Job | Receive-Job
    Remove-Job $job
    Remove-Item -LiteralPath $stop
  }
}

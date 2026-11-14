param([ValidatePattern('^[a-zA-Z0-9_-]+$')][string]$Name='baseline', [ValidateRange(1,120)][int]$Samples=30)
$ErrorActionPreference='Stop'
$output=Join-Path $PSScriptRoot ($Name+'.json')
if(Test-Path -LiteralPath $output){throw 'Output already exists; choose a new window name.'}
# Read-only metadata. No command lines, sessions, owners or private paths.
$machine=Get-CimInstance Win32_ComputerSystem
$rows=@()
for($i=0;$i -lt $Samples;$i++) {
  $started=[DateTime]::UtcNow
  $mem=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory
  $cpu=Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"
  $disk=Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk -Filter "Name='_Total'"
  $proc=@(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object {$_.IDProcess -gt 0 -and $_.Name -ne '_Total'})
  $groups=@()
  foreach($kind in @('node','chromium','observer','other')) {
    $selected=@($proc | Where-Object {
      $k=if($_.Name -match '^node(?:#|$)'){'node'}elseif($_.Name -match '^(chrome|headless_shell)(?:#|$)'){'chromium'}elseif($_.IDProcess -eq $PID){'observer'}else{'other'}
      $k -eq $kind
    })
    $groups+=@{category=$kind;count=$selected.Count;cpu_percent_logical_capacity=(($selected | Measure-Object PercentProcessorTime -Sum).Sum / $machine.NumberOfLogicalProcessors);working_set_private_bytes=($selected | Measure-Object WorkingSetPrivate -Sum).Sum;page_faults_per_sec=($selected | Measure-Object PageFaultsPersec -Sum).Sum}
  }
  $rows+=@{started_at=$started.ToString('o');finished_at=[DateTime]::UtcNow.ToString('o');cpu_percent=$cpu.PercentProcessorTime;available_mb=$mem.AvailableMBytes;committed_bytes=$mem.CommittedBytes;commit_limit_bytes=$mem.CommitLimit;pages_input_per_sec=$mem.PagesInputPersec;pages_output_per_sec=$mem.PagesOutputPersec;disk_queue=$disk.CurrentDiskQueueLength;groups=$groups}
  Start-Sleep -Milliseconds 1000
}
@{name=$Name;sha=(git rev-parse HEAD).Trim();logical_processors=$machine.NumberOfLogicalProcessors;physical_memory_bytes=$machine.TotalPhysicalMemory;suites_running_by_this_campaign=0;exclusive_reservation=$false;samples=$rows} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $output -Encoding utf8
Write-Output "$Name samples=$($rows.Count)"

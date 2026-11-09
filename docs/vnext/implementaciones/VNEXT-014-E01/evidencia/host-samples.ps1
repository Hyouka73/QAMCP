param([Parameter(Mandatory=$true)][string]$Name, [int]$Samples = 12)
$ErrorActionPreference = 'Stop'
$rows = @()
for ($index = 0; $index -lt $Samples; $index++) {
  $memory = Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory
  $cpu = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor | Where-Object Name -eq '_Total'
  $disk = Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk | Where-Object Name -eq '_Total'
  $groups = @(Get-Process node,chrome,headless_shell -ErrorAction SilentlyContinue | Group-Object ProcessName | ForEach-Object {
    @{ name=$_.Name; count=$_.Count; working_set_bytes=($_.Group | Measure-Object WorkingSet64 -Sum).Sum; cumulative_cpu_seconds=($_.Group | Measure-Object CPU -Sum).Sum }
  })
  $rows += @{ at=[DateTime]::UtcNow.ToString('o'); available_mb=$memory.AvailableMBytes; pages_input_per_sec=$memory.PagesInputPersec; page_reads_per_sec=$memory.PageReadsPersec; cpu_percent=$cpu.PercentProcessorTime; disk_bytes_per_sec=$disk.DiskBytesPersec; disk_queue=$disk.CurrentDiskQueueLength; processes=$groups }
  $rows | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot ($Name + '-host.json')) -Encoding utf8
  Start-Sleep -Seconds 1
}

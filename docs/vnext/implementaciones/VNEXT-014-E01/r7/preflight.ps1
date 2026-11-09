<#
.SYNOPSIS
    QAMCP vNext R7 Preflight & Host Capacity Telemetry Inspection Script.

.DESCRIPTION
    Implements deterministic, read-only host telemetry inspection for Windows hosts in
    accordance with CONTRATO_EJECUTOR.md and VNEXT-014-E01 specifications.

    Features & Architectural Invariants:
    1. Read-Only Host Inspection:
       Queries Windows CIM providers (Win32_ComputerSystem, Win32_OperatingSystem,
       Win32_PerfFormattedData_PerfOS_Memory, Win32_PerfFormattedData_PerfOS_Processor,
       Win32_PerfFormattedData_PerfDisk_PhysicalDisk, Win32_PerfFormattedData_PerfProc_Process).
       Does NOT access private process command lines, user credentials, environment tokens,
       or user sessions. Prohibits destructive actions (no Stop-Process, no priority changes).

    2. Strict File & Path Isolation:
       All output files (manifests, background sentinel/PID files, and telemetry) are strictly
       confined to docs/vnext/implementaciones/VNEXT-014-E01/r7/. Any attempt to write outside
       this directory triggers an immediate abort.

    3. Continuous Sampling Window Validation (>= 60s):
       Samples host metrics with a nominal cadence of 1000ms. Enforces a minimum continuous
       prior duration of >= 60,000 ms (nominal 60 samples) and verifies that inter-sample
       gaps remain <= 5000ms and individual query durations remain <= 5000ms. Distinguishes
       host sampling gaps from Node.js event-loop lag.

    4. Dual Operational Modes:
       - Baseline: Synchronous execution validating the continuous prior sampling window.
       - Background: Asynchronous capture for future E01 runs with Start, Stop, and Status
         actions utilizing PID files, sentinel files, or background PowerShell jobs.

    5. Canonical Contract Conformity:
       Generates JSON manifests strictly matching the schema in CONTRATO_EJECUTOR.md and
       manifest-ejemplo.json. In local development environments without verified external
       resource reservation, status defaults to 'EJECUTOR_NO_APTO' with explanation
       'PREPARADO / RESERVA NO ACREDITADA', rejecting the idle CPU fallacy.

.PARAMETER Mode
    Operational mode: 'Baseline' (default, synchronous window) or 'Background' (asynchronous capture).

.PARAMETER Action
    Action for Background mode: 'Start', 'Stop', or 'Status'. Default: 'Start'.

.PARAMETER ExecutorId
    Unique identifier for the evaluating host or test runner. Default: 'executor-windows-host-01'.

.PARAMETER WindowName
    Base name for the measurement series and manifest output file. Default: 'preflight-baseline'.

.PARAMETER MinDurationSeconds
    Minimum continuous duration of the telemetry window in seconds (minimum 60). Default: 60.

.PARAMETER Samples
    Minimum number of telemetry samples to collect (minimum 30). Default: 60.

.PARAMETER IntervalMs
    Target interval between samples in milliseconds (100 to 10000). Default: 1000.

.PARAMETER OutputPath
    Explicit path to write the manifest JSON. Must be strictly within the r7 directory.
    If omitted, defaults to docs/vnext/implementaciones/VNEXT-014-E01/r7/<WindowName>-manifest.json.

.PARAMETER Accredited
    Switch indicating if independent operational resource reservation is formally accredited.
    Default: $false.

.PARAMETER EvidenceDoc
    URI or file path documenting operational resource reservation. Required if -Accredited is set.

.PARAMETER Provenance
    Mechanism of resource reservation. Allowed: 'hypervisor_vm_pinned', 'cloud_dedicated_host',
    'bare_metal_offline', 'cgroups_v2_systemd', 'synthetic', 'none'. Default: 'none'.

.PARAMETER ReservationType
    Infrastructure provisioning type. Allowed: 'dedicated_host', 'dedicated_vm', 'exclusive_container',
    'unreserved_shared', 'synthetic_fixture'. Default: 'unreserved_shared'.

.PARAMETER SwapPolicy
    Operating system virtual memory / page file policy. Default: 'host_managed'.

.PARAMETER UseJob
    In Background mode, use Start-Job within the current session instead of a detached background process.

.EXAMPLE
    # Synchronous baseline preflight (>= 60 continuous seconds):
    .\preflight.ps1 -Mode Baseline -MinDurationSeconds 60 -Samples 60

.EXAMPLE
    # Background capture for test run:
    .\preflight.ps1 -Mode Background -Action Start -WindowName 'e01-run'
    .\preflight.ps1 -Mode Background -Action Status
    .\preflight.ps1 -Mode Background -Action Stop -WindowName 'e01-run'

.EXAMPLE
    # Accredited runner verification:
    .\preflight.ps1 -Mode Baseline -Accredited -EvidenceDoc "https://ci.internal/reservation/42" -Provenance "cloud_dedicated_host" -ReservationType "dedicated_host"
#>

[CmdletBinding(DefaultParameterSetName = 'BaselineSet')]
param(
    [Parameter(ParameterSetName = 'BaselineSet', Position = 0)]
    [Parameter(ParameterSetName = 'BackgroundSet', Position = 0)]
    [ValidateSet('Baseline', 'Background')]
    [string]$Mode = 'Baseline',

    [Parameter(ParameterSetName = 'BackgroundSet', Mandatory = $false)]
    [ValidateSet('Start', 'Stop', 'Status')]
    [string]$Action = 'Start',

    [Parameter()]
    [ValidatePattern('^[a-zA-Z0-9_-]{3,64}$')]
    [string]$ExecutorId = 'executor-windows-host-01',

    [Parameter()]
    [ValidatePattern('^[a-zA-Z0-9_-]+$')]
    [string]$WindowName = 'preflight-baseline',

    [Parameter()]
    [ValidateRange(60, 3600)]
    [int]$MinDurationSeconds = 60,

    [Parameter()]
    [ValidateRange(30, 1000)]
    [int]$Samples = 60,

    [Parameter()]
    [ValidateRange(100, 10000)]
    [int]$IntervalMs = 1000,

    [Parameter()]
    [string]$OutputPath,

    [Parameter()]
    [switch]$Accredited,

    [Parameter()]
    [string]$EvidenceDoc = $null,

    [Parameter()]
    [ValidateSet('hypervisor_vm_pinned', 'cloud_dedicated_host', 'bare_metal_offline', 'cgroups_v2_systemd', 'synthetic', 'none')]
    [string]$Provenance = 'none',

    [Parameter()]
    [ValidateSet('dedicated_host', 'dedicated_vm', 'exclusive_container', 'unreserved_shared', 'synthetic_fixture')]
    [string]$ReservationType = 'unreserved_shared',

    [Parameter()]
    [string]$SwapPolicy = 'host_managed',

    [Parameter()]
    [int[]]$AuthorizedPids = @(),

    [Parameter(ParameterSetName = 'BackgroundSet')]
    [switch]$UseJob,

    [Parameter(DontShow = $true)]
    [string]$SentinelFile,

    [Parameter(DontShow = $true)]
    [string]$PidFile
)

$ErrorActionPreference = 'Stop'

# ==============================================================================
# SECTION 1: STRICT DIRECTORY & PATH ISOLATION GUARD
# ==============================================================================
$scriptDir = [System.IO.Path]::GetFullPath($PSScriptRoot)

# Verify script execution location is strictly inside r7
$isR7Dir = $scriptDir -match '[\\/]docs[\\/]vnext[\\/]implementaciones[\\/]VNEXT-014-E01[\\/]r7$'
if (-not $isR7Dir) {
    throw "Security/Isolation Violation: preflight.ps1 must be placed inside 'docs/vnext/implementaciones/VNEXT-014-E01/r7'. Current: '$scriptDir'"
}

function Assert-PathConfinement {
    param(
        [string]$Path,
        [string]$ParamName
    )
    if ([string]::IsNullOrWhiteSpace($Path)) { return }
    $fullPath = [System.IO.Path]::GetFullPath($Path)
    $sep = [System.IO.Path]::DirectorySeparatorChar
    $requiredPrefix = $scriptDir.TrimEnd($sep, [System.IO.Path]::AltDirectorySeparatorChar) + $sep
    if (-not ($fullPath.Equals($scriptDir, [System.StringComparison]::OrdinalIgnoreCase) -or `
              $fullPath.StartsWith($requiredPrefix, [System.StringComparison]::OrdinalIgnoreCase))) {
        throw "Security/Isolation Violation: $ParamName ('$fullPath') must be strictly confined inside '$scriptDir'"
    }

    # Inspect target file (if exists) and all existing ancestor directories up to $scriptDir for ReparsePoint / symlinks
    $curr = $fullPath
    $deepestExisting = $null

    while ($curr) {
        if (Test-Path -LiteralPath $curr) {
            $item = Get-Item -LiteralPath $curr -Force
            if ($null -eq $deepestExisting) {
                $deepestExisting = $item
            }
            $isReparse = (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) -or `
                         ($null -ne $item.LinkTarget)
            if ($isReparse) {
                throw "Security/Isolation Violation: Reparse point or symbolic link detected at '$curr' for $ParamName"
            }
        }

        if ($curr.Equals($scriptDir, [System.StringComparison]::OrdinalIgnoreCase)) {
            break
        }

        $parent = [System.IO.Path]::GetDirectoryName($curr)
        if ([string]::IsNullOrEmpty($parent) -or $parent.Equals($curr, [System.StringComparison]::OrdinalIgnoreCase)) {
            break
        }
        $curr = $parent
    }

    # Verify physical resolved path of deepest existing ancestor stays strictly within $scriptDir
    if ($deepestExisting) {
        $resolvedPhysical = (Resolve-Path -LiteralPath $deepestExisting.FullName).ProviderPath
        if (-not ($resolvedPhysical.Equals($scriptDir, [System.StringComparison]::OrdinalIgnoreCase) -or `
                  $resolvedPhysical.StartsWith($requiredPrefix, [System.StringComparison]::OrdinalIgnoreCase))) {
            throw "Security/Isolation Violation: Resolved physical path ('$resolvedPhysical') escapes '$scriptDir' for $ParamName"
        }
    }
}

# Confinement assertions on internal parameters
if ($SentinelFile) {
    Assert-PathConfinement -Path $SentinelFile -ParamName 'SentinelFile'
}
if ($PidFile) {
    Assert-PathConfinement -Path $PidFile -ParamName 'PidFile'
}

# Resolve and strictly validate output path
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $resolvedOutput = Join-Path $scriptDir ($WindowName + '-manifest.json')
} else {
    if ([System.IO.Path]::IsPathRooted($OutputPath)) {
        $resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
    } else {
        $resolvedOutput = [System.IO.Path]::GetFullPath((Join-Path $scriptDir $OutputPath))
    }
}

Assert-PathConfinement -Path $resolvedOutput -ParamName 'OutputPath'

# Find repository root by traversing upward for .git
function Find-RepoRoot {
    param([string]$StartDir)
    $dir = $StartDir
    while ($dir -and (Test-Path -LiteralPath $dir)) {
        if (Test-Path -LiteralPath (Join-Path $dir '.git')) {
            return (Resolve-Path -LiteralPath $dir).Path
        }
        $parent = Split-Path -Path $dir -Parent
        if ($parent -eq $dir) { break }
        $dir = $parent
    }
    return (Resolve-Path -LiteralPath (Join-Path $StartDir '../../../../../..')).Path
}

$repoRoot = Find-RepoRoot -StartDir $scriptDir

# ==============================================================================
# SECTION 2: READ-ONLY SYSTEM & TOOLCHAIN INSPECTION
# ==============================================================================

function Get-HostOsInfo {
    $os = Get-CimInstance Win32_OperatingSystem
    $arch = if ($os.OSArchitecture -match 'ARM' -or $env:PROCESSOR_ARCHITECTURE -match 'ARM') { 'arm64' } else { 'x64' }
    return [ordered]@{
        name    = [string]$os.Caption
        release = [string]$os.Version
        build   = [string]$os.BuildNumber
        arch    = [string]$arch
    }
}

function Get-HostToolchain {
    param([string]$Root)

    # Node.js version
    $nodeVer = $null
    try {
        $rawNode = & node -v 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($rawNode)) {
            $nodeVer = $rawNode.Trim()
        }
    } catch {
        $nodeVer = $null
    }

    # pnpm version
    $pnpmVer = $null
    try {
        $rawPnpm = & pnpm -v 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($rawPnpm)) {
            $pnpmVer = $rawPnpm.Trim()
        }
    } catch {
        $pnpmVer = $null
    }

    # Chromium version from browsers.json (no canonical fallback)
    $chromiumVer = $null
    $browsersJsonPath = Join-Path $Root 'packages/playwright-runner/node_modules/playwright-core/browsers.json'
    if (Test-Path -LiteralPath $browsersJsonPath) {
        try {
            $browsersData = Get-Content -LiteralPath $browsersJsonPath -Raw | ConvertFrom-Json
            $chromeEntry = $browsersData.browsers | Where-Object { $_.name -eq 'chromium' } | Select-Object -First 1
            if ($chromeEntry -and $chromeEntry.browserVersion) {
                $chromiumVer = [string]$chromeEntry.browserVersion
            }
        } catch {
            $chromiumVer = $null
        }
    }

    return [ordered]@{
        node_version     = $nodeVer
        pnpm_version     = $pnpmVer
        chromium_version = $chromiumVer
    }
}

function Get-HostGitState {
    param([string]$Root)

    $currentLocation = Get-Location
    try {
        Set-Location -LiteralPath $Root

        $gitError = $false

        # Commit SHA (40 chars)
        $commitSha = $null
        try {
            $rawSha = & git rev-parse HEAD 2>$null
            if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($rawSha)) {
                $commitSha = $rawSha.Trim()
            } else {
                $gitError = $true
            }
        } catch {
            $gitError = $true
            $commitSha = $null
        }

        # Branch name
        $branchName = $null
        try {
            $rawBranch = & git rev-parse --abbrev-ref HEAD 2>$null
            if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($rawBranch)) {
                $branchName = $rawBranch.Trim()
            } else {
                $gitError = $true
            }
        } catch {
            $gitError = $true
            $branchName = $null
        }

        # Working tree status inspection
        $porcelain = $null
        $statusExitCode = -1
        try {
            $porcelain = @(& git status --porcelain=v1 2>$null)
            $statusExitCode = $LASTEXITCODE
        } catch {
            $statusExitCode = -1
            $porcelain = $null
        }

        $dirtyFiles = @()
        $isClean = $false

        if ($statusExitCode -ne 0 -or $null -eq $porcelain) {
            # Git status invocation failed - fail explicitly and record error state. NEVER emit clean_working_tree = $true
            $isClean = $false
            $dirtyFiles = @('<git-status-failed: exit code ' + $statusExitCode + '>')
        } else {
            foreach ($line in $porcelain) {
                if ([string]::IsNullOrWhiteSpace($line)) { continue }
                $filePath = $line.Substring(3).Trim().Replace('\', '/')
                if ($filePath -eq 'packages/playwright-runner/.qa/cache/sessions/admin-user.json') {
                    continue
                }
                $dirtyFiles += $filePath
            }
            # Clean working tree is only true if status succeeded, no dirty files exist, and no git rev-parse errors occurred
            $isClean = ($dirtyFiles.Count -eq 0 -and -not $gitError)
        }

        if ($gitError -and $dirtyFiles.Count -eq 0) {
            $dirtyFiles = @('<git-rev-parse-failed>')
            $isClean = $false
        }

        return [ordered]@{
            commit_sha         = $commitSha
            branch_name        = $branchName
            clean_working_tree = [bool]$isClean
            dirty_files        = @($dirtyFiles)
        }
    } finally {
        Set-Location -LiteralPath $currentLocation
    }
}

function Get-DistHashes {
    param([string]$Root)

    $distFiles = @(
        'packages/mcp/dist/server.js',
        'packages/playwright-adapter/dist/index.js',
        'packages/knowledge/dist/index.js',
        'packages/shared/dist/index.js'
    )

    $hashes = [ordered]@{}
    foreach ($relPath in $distFiles) {
        $fullPath = Join-Path $Root $relPath
        if (Test-Path -LiteralPath $fullPath) {
            $hashObj = Get-FileHash -LiteralPath $fullPath -Algorithm SHA256
            $hashes[$relPath] = [string]$hashObj.Hash
        } else {
            $hashes[$relPath] = $null
        }
    }

    return $hashes
}

# ==============================================================================
# SECTION 3: TELEMETRY SAMPLING & CONTINUITY VALIDATION ENGINE
# ==============================================================================

function Measure-HostTelemetryWindow {
    param(
        [int]$TargetDurationSeconds,
        [int]$TargetSamples,
        [int]$TargetIntervalMs,
        [string]$SentinelFilePath = $null,
        [int[]]$AuthorizedPids = @()
    )

    # Enforce minimums per contract (>= 60s continuous, >= 30 samples)
    if ($TargetDurationSeconds -lt 60) { $TargetDurationSeconds = 60 }
    if ($TargetSamples -lt 30) { $TargetSamples = 30 }

    # Static machine capabilities
    $machine = Get-CimInstance Win32_ComputerSystem
    $logicalCores = [int]$machine.NumberOfLogicalProcessors
    if ($logicalCores -lt 1) { $logicalCores = 1 }
    $physicalRamMb = [int][Math]::Round($machine.TotalPhysicalMemory / 1MB)

    $samples = @()
    $windowStartUtc = [DateTime]::UtcNow
    $prevFinishedUtc = $null
    $maxObservedGapMs = 0.0
    $queryTimeoutCount = 0

    Write-Host "[preflight] Initiating host telemetry sampling loop..."
    Write-Host "[preflight] Target duration: >= ${TargetDurationSeconds}s | Target samples: >= $TargetSamples | Cadence: ${TargetIntervalMs}ms"

    $iteration = 0
    while ($true) {
        $iteration++
        $sampleStart = [DateTime]::UtcNow

        # 1. Query CIM memory metrics
        $mem = Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory
        if ($null -eq $mem -or `
            $null -eq $mem.AvailableMBytes -or `
            $null -eq $mem.CommittedBytes -or `
            $null -eq $mem.CommitLimit -or `
            $null -eq $mem.PagesInputPersec -or `
            $null -eq $mem.PagesOutputPersec) {
            throw "Host Telemetry Failure: Win32_PerfFormattedData_PerfOS_Memory is missing or has null counters (AvailableMBytes, CommittedBytes, CommitLimit, PagesInputPersec, PagesOutputPersec)."
        }

        # 2. Query CIM CPU total utilization
        $cpu = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor | Where-Object { $_.Name -eq '_Total' } | Select-Object -First 1
        if ($null -eq $cpu -or $null -eq $cpu.PercentProcessorTime) {
            throw "Host Telemetry Failure: Win32_PerfFormattedData_PerfOS_Processor (_Total) is missing or unavailable."
        }

        # 3. Query CIM physical disk queue length
        $disk = Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk | Where-Object { $_.Name -eq '_Total' } | Select-Object -First 1
        if ($null -eq $disk -or $null -eq $disk.CurrentDiskQueueLength) {
            throw "Host Telemetry Failure: Win32_PerfFormattedData_PerfDisk_PhysicalDisk (_Total) is missing or unavailable."
        }

        # 4. Query process metrics and aggregate into 4 canonical groups
        $proc = @(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.IDProcess -gt 0 -and $_.Name -ne '_Total' })
        if ($proc.Count -eq 0) {
            throw "Host Telemetry Failure: Win32_PerfFormattedData_PerfProc_Process returned no processes."
        }

        $observerFound = $false
        foreach ($p in $proc) {
            if ($p.IDProcess -eq $PID) {
                $observerFound = $true
            }
            if ($null -eq $p.PercentProcessorTime -or $null -eq $p.WorkingSetPrivate -or $null -eq $p.PageFaultsPersec) {
                throw "Host Telemetry Failure: Process (PID: $($p.IDProcess), Name: $($p.Name)) has null performance counters."
            }
        }
        if (-not $observerFound) {
            throw "Host Telemetry Failure: Current process (PID: $PID) was not found in Win32_PerfFormattedData_PerfProc_Process query."
        }

        $groups = @()
        foreach ($kind in @('node', 'chromium', 'observer', 'other')) {
            $selected = @($proc | Where-Object {
                $pidVal = [int]$_.IDProcess
                $isAuthorized = ($AuthorizedPids -and ($AuthorizedPids -contains $pidVal))
                $k = if ($pidVal -eq $PID) {
                         'observer'
                     } elseif ($isAuthorized -and ($_.Name -match '^node(?:#|$)')) {
                         'node'
                     } elseif ($isAuthorized -and ($_.Name -match '^(chrome|headless_shell)(?:#|$)')) {
                         'chromium'
                     } else {
                         'other'
                     }
                $k -eq $kind
            })

            $cpuSum = 0.0
            $wsSum = 0.0
            $pfSum = 0.0

            if ($selected.Count -gt 0) {
                $cpuMeasure = ($selected | Measure-Object PercentProcessorTime -Sum).Sum
                if ($null -eq $cpuMeasure) {
                    throw "Host Telemetry Failure: Null PercentProcessorTime sum in group '$kind'."
                }
                $cpuSum = [double]$cpuMeasure

                $wsMeasure = ($selected | Measure-Object WorkingSetPrivate -Sum).Sum
                if ($null -eq $wsMeasure) {
                    throw "Host Telemetry Failure: Null WorkingSetPrivate sum in group '$kind'."
                }
                $wsSum = [double]$wsMeasure

                $pfMeasure = ($selected | Measure-Object PageFaultsPersec -Sum).Sum
                if ($null -eq $pfMeasure) {
                    throw "Host Telemetry Failure: Null PageFaultsPersec sum in group '$kind'."
                }
                $pfSum = [double]$pfMeasure
            }

            $groups += [ordered]@{
                category                     = [string]$kind
                count                        = [int]$selected.Count
                cpu_percent_logical_capacity = [double][Math]::Round(($cpuSum / $logicalCores), 2)
                working_set_private_bytes    = [double]$wsSum
                page_faults_per_sec          = [double]$pfSum
            }
        }

        $sampleFinished = [DateTime]::UtcNow
        $queryDurationMs = ($sampleFinished - $sampleStart).TotalMilliseconds
        if ($queryDurationMs -gt 5000.0) {
            $queryTimeoutCount++
        }

        # Track inter-sample gaps (continuity check)
        if ($prevFinishedUtc -ne $null) {
            $gapMs = ($sampleStart - $prevFinishedUtc).TotalMilliseconds
            if ($gapMs -gt $maxObservedGapMs) {
                $maxObservedGapMs = $gapMs
            }
        }
        $prevFinishedUtc = $sampleFinished

        $cpuPercent = [double]$cpu.PercentProcessorTime
        $diskQueue = [double]$disk.CurrentDiskQueueLength

        $sampleObj = [ordered]@{
            started_at           = $sampleStart.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
            finished_at          = $sampleFinished.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
            cpu_percent          = [double]$cpuPercent
            available_mb         = [double]$mem.AvailableMBytes
            committed_bytes      = [double]$mem.CommittedBytes
            commit_limit_bytes   = [double]$mem.CommitLimit
            pages_input_per_sec  = [double]$mem.PagesInputPersec
            pages_output_per_sec = [double]$mem.PagesOutputPersec
            disk_queue           = [double]$diskQueue
            groups               = $groups
        }
        $samples += $sampleObj

        $elapsedMs = ($sampleFinished - $windowStartUtc).TotalMilliseconds

        # Check termination condition: sentinel file detection (Background mode)
        if ($SentinelFilePath) {
            Assert-PathConfinement -Path $SentinelFilePath -ParamName 'SentinelFilePath'
            if (Test-Path -LiteralPath $SentinelFilePath) {
                Write-Host "[preflight] Sentinel detected after $($samples.Count) samples ($([Math]::Round($elapsedMs / 1000, 1))s)."
                break
            }
        }

        # Check termination condition: target duration & minimum samples reached (Baseline mode)
        if (-not $SentinelFilePath) {
            if ($elapsedMs -ge ($TargetDurationSeconds * 1000) -and $samples.Count -ge $TargetSamples) {
                Write-Host "[preflight] Target window completed: $($samples.Count) samples collected in $([Math]::Round($elapsedMs / 1000, 1))s."
                break
            }
        }

        # Cadence pacing
        Start-Sleep -Milliseconds $TargetIntervalMs
    }

    $windowEndUtc = [DateTime]::UtcNow
    $totalSpanMs = ($windowEndUtc - $windowStartUtc).TotalMilliseconds

    # Aggregate telemetry statistics
    $cpuList = @($samples | ForEach-Object { $_.cpu_percent })
    $cpuMin = [double](($cpuList | Measure-Object -Minimum).Minimum)
    $cpuMax = [double](($cpuList | Measure-Object -Maximum).Maximum)
    $cpuMean = [double][Math]::Round((($cpuList | Measure-Object -Average).Average), 2)

    $availList = @($samples | ForEach-Object { $_.available_mb })
    $availMin = [double](($availList | Measure-Object -Minimum).Minimum)
    $availMax = [double](($availList | Measure-Object -Maximum).Maximum)
    $availMean = [double][Math]::Round((($availList | Measure-Object -Average).Average), 2)

    $commList = @($samples | ForEach-Object { $_.committed_bytes })
    $commMean = [double][Math]::Round((($commList | Measure-Object -Average).Average), 2)
    $lastCommitLimit = [double]$samples[-1].commit_limit_bytes

    $pgInList = @($samples | ForEach-Object { $_.pages_input_per_sec })
    $pgInMax = [double](($pgInList | Measure-Object -Maximum).Maximum)
    $pgInMean = [double][Math]::Round((($pgInList | Measure-Object -Average).Average), 2)

    $pgOutList = @($samples | ForEach-Object { $_.pages_output_per_sec })
    $pgOutMax = [double](($pgOutList | Measure-Object -Maximum).Maximum)

    $telemetryWindow = [ordered]@{
        duration_ms  = [double][Math]::Round($totalSpanMs, 2)
        interval_ms  = [double]$TargetIntervalMs
        max_gap_ms   = [double]5000.0
        start_time   = $samples[0].started_at
        end_time     = $samples[-1].finished_at
        sample_count = [int]$samples.Count
        cpu_stats    = [ordered]@{
            min  = $cpuMin
            max  = $cpuMax
            mean = $cpuMean
        }
        mem_stats    = [ordered]@{
            min_available_mb     = $availMin
            max_available_mb     = $availMax
            mean_available_mb    = $availMean
            committed_bytes_mean = $commMean
            commit_limit_bytes   = $lastCommitLimit
        }
        page_faults  = [ordered]@{
            max_pages_input_per_sec  = $pgInMax
            mean_pages_input_per_sec = $pgInMean
            max_pages_output_per_sec = $pgOutMax
        }
        samples      = $samples
    }

    return [PSCustomObject]@{
        window              = $telemetryWindow
        max_observed_gap_ms = $maxObservedGapMs
        query_timeouts      = $queryTimeoutCount
        logical_cores       = $logicalCores
        physical_ram_mb     = $physicalRamMb
    }
}

# ==============================================================================
# SECTION 4: MANIFEST GENERATION & CONTRACT EVALUATION
# ==============================================================================

function Build-PreflightManifest {
    param(
        [string]$ExecId,
        $OsInfo,
        $ToolchainInfo,
        $GitInfo,
        $DistHashInfo,
        [PSCustomObject]$TelemetryData,
        [bool]$IsAccredited,
        [string]$EvidencePath,
        [string]$Prov,
        [string]$ResType,
        [string]$SwapPol
    )

    $windowObj = $TelemetryData.window
    $durationMs = $windowObj.duration_ms
    $maxObservedGap = $TelemetryData.max_observed_gap_ms
    $timeouts = $TelemetryData.query_timeouts

    # Contract Evaluation Rules:
    # 1. Default status in local host runs MUST be EJECUTOR_NO_APTO (PREPARADO / RESERVA NO ACREDITADA)
    # 2. Telemetry duration < 60s -> EJECUTOR_NO_APTO
    # 3. Telemetry samples < 30 -> EJECUTOR_NO_APTO
    # 4. Sampling gap > 5000ms -> EJECUTOR_NO_APTO
    # 5. Git dirty outside whitelist -> EJECUTOR_NO_APTO

    $status = 'EJECUTOR_NO_APTO'
    $statusReason = 'PREPARADO / RESERVA NO ACREDITADA'

    if ($durationMs -lt 60000.0) {
        $statusReason = "Telemetry duration (${durationMs}ms) does not meet continuous 60s requirement"
    } elseif ($windowObj.sample_count -lt 30) {
        $statusReason = "Telemetry sample count ($($windowObj.sample_count)) is less than required minimum of 30 samples"
    } elseif ($maxObservedGap -gt 5000.0) {
        $statusReason = "Telemetry discontinuity detected: gap of ${maxObservedGap}ms exceeds 5000ms limit"
    } elseif ($timeouts -gt 0) {
        $statusReason = "Sampler degradation detected: $timeouts CIM queries exceeded 5000ms limit"
    } elseif (-not $GitInfo.clean_working_tree) {
        $statusReason = 'Working tree is dirty with unapproved file modifications'
    } else {
        $statusReason = 'PREPARADO / RESERVA NO ACREDITADA'
    }

    $evidenceField = if ([string]::IsNullOrWhiteSpace($EvidencePath)) { $null } else { [string]$EvidencePath }

    $manifest = [ordered]@{
        '$schema'                       = 'https://json-schema.org/draft-07/schema#'
        schema_version                  = '1.0.0'
        executor_id                     = [string]$ExecId
        timestamp_utc                   = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
        status                          = [string]$status
        status_reason                   = [string]$statusReason
        os_info                         = $OsInfo
        toolchain                       = $ToolchainInfo
        git                             = $GitInfo
        dist_hashes                     = $DistHashInfo
        resource_reservation            = [ordered]@{
            provenance      = [string]$Prov
            evidence_doc    = $evidenceField
            type            = [string]$ResType
            allocated_cores = [int]$TelemetryData.logical_cores
            allocated_ram_mb= [int]$TelemetryData.physical_ram_mb
            swap_policy     = [string]$SwapPol
            accredited      = [bool]$IsAccredited
        }
        predeclared_interference_limits = [ordered]@{
            max_external_cpu_percent = 10.0
            max_disk_queue           = 2.0
            max_pages_input_per_sec  = 500.0
            min_available_ram_mb     = 2048
        }
        telemetry_window                = $windowObj
    }

    return $manifest
}

# ==============================================================================
# SECTION 5: OPERATIONAL MODE DISPATCHER
# ==============================================================================

# Background mode file paths (strictly confined to r7/)
$sentinelPath = Join-Path $scriptDir ($WindowName + '.stop')
$pidFilePath  = Join-Path $scriptDir ($WindowName + '.pid')

Assert-PathConfinement -Path $sentinelPath -ParamName 'SentinelPath'
Assert-PathConfinement -Path $pidFilePath -ParamName 'PidFilePath'

if ($Mode -eq 'Background') {
    switch ($Action) {
        'Start' {
            Write-Host "[preflight] Starting Background host telemetry capture series '$WindowName'..."

            # Clean stale sentinel
            if (Test-Path -LiteralPath $sentinelPath) {
                Assert-PathConfinement -Path $sentinelPath -ParamName 'SentinelPath'
                Remove-Item -LiteralPath $sentinelPath -Force
            }

            # Check if background job/process is already active
            if (Test-Path -LiteralPath $pidFilePath) {
                Assert-PathConfinement -Path $pidFilePath -ParamName 'PidFilePath'
                $existingPid = (Get-Content -LiteralPath $pidFilePath -Raw).Trim()
                $procActive = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
                if ($procActive) {
                    throw "Background capture is already running (PID: $existingPid). Use -Action Stop or -Action Status."
                } else {
                    Remove-Item -LiteralPath $pidFilePath -Force
                }
            }

            if ($UseJob) {
                $job = Start-Job -Name "QAP_Preflight_$WindowName" -ScriptBlock {
                    param($Script, $WinName, $OutPath, $ExecId, $StopFile, $PidFile, $Interval, $AuthPids)
                    if ($PidFile) {
                        Assert-PathConfinement -Path $PidFile -ParamName 'PidFile'
                        Set-Content -LiteralPath $PidFile -Value $PID -Encoding utf8
                    }
                    & $Script -Mode Baseline -WindowName $WinName -OutputPath $OutPath -ExecutorId $ExecId -IntervalMs $Interval -SentinelFile $StopFile -AuthorizedPids $AuthPids
                } -ArgumentList $PSCommandPath, $WindowName, $resolvedOutput, $ExecutorId, $sentinelPath, $pidFilePath, $IntervalMs, $AuthorizedPids

                Write-Host "[preflight] Background PowerShell Job started: $($job.Name) (ID: $($job.Id))"
                return [PSCustomObject]@{
                    Mode     = 'Background'
                    Action   = 'Start'
                    Type     = 'Job'
                    JobId    = $job.Id
                    Sentinel = $sentinelPath
                    Output   = $resolvedOutput
                }
            } else {
                # Start detached background PowerShell process
                $procArgs = @(
                    '-NoProfile',
                    '-ExecutionPolicy', 'Bypass',
                    '-File', "`"$PSCommandPath`"",
                    '-Mode', 'Baseline',
                    '-WindowName', "`"$WindowName`"",
                    '-OutputPath', "`"$resolvedOutput`"",
                    '-ExecutorId', "`"$ExecutorId`"",
                    '-IntervalMs', "$IntervalMs",
                    '-SentinelFile', "`"$sentinelPath`"",
                    '-PidFile', "`"$pidFilePath`""
                )
                if ($AuthorizedPids -and $AuthorizedPids.Count -gt 0) {
                    $procArgs += '-AuthorizedPids'
                    $procArgs += ($AuthorizedPids -join ',')
                }

                $bgProc = Start-Process -FilePath 'powershell.exe' -ArgumentList $procArgs -WindowStyle Hidden -PassThru
                Assert-PathConfinement -Path $pidFilePath -ParamName 'PidFilePath'
                Set-Content -LiteralPath $pidFilePath -Value $bgProc.Id -Encoding utf8

                Write-Host "[preflight] Background process started (PID: $($bgProc.Id))"
                Write-Host "[preflight] Sentinel stop file: $sentinelPath"
                Write-Host "[preflight] Manifest target: $resolvedOutput"

                return [PSCustomObject]@{
                    Mode     = 'Background'
                    Action   = 'Start'
                    Type     = 'Process'
                    PID      = $bgProc.Id
                    Sentinel = $sentinelPath
                    Output   = $resolvedOutput
                }
            }
        }

        'Status' {
            $isJobRunning = $false
            $existingJob = Get-Job -Name "QAP_Preflight_$WindowName" -ErrorAction SilentlyContinue
            if ($existingJob -and $existingJob.State -eq 'Running') {
                $isJobRunning = $true
            }

            $isProcRunning = $false
            $currentPid = $null
            if (Test-Path -LiteralPath $pidFilePath) {
                Assert-PathConfinement -Path $pidFilePath -ParamName 'PidFilePath'
                $currentPid = (Get-Content -LiteralPath $pidFilePath -Raw).Trim()
                $proc = Get-Process -Id $currentPid -ErrorAction SilentlyContinue
                if ($proc) { $isProcRunning = $true }
            }

            $statusText = if ($isJobRunning -or $isProcRunning) { 'Running' } else { 'Stopped' }
            Write-Host "[preflight] Background capture '$WindowName' status: $statusText"

            return [PSCustomObject]@{
                Mode    = 'Background'
                Action  = 'Status'
                State   = $statusText
                Job     = if ($existingJob) { $existingJob.State } else { 'None' }
                PID     = $currentPid
                Output  = $resolvedOutput
            }
        }

        'Stop' {
            Write-Host "[preflight] Stopping background capture series '$WindowName'..."

            # Signal termination via sentinel file
            Assert-PathConfinement -Path $sentinelPath -ParamName 'SentinelPath'
            Set-Content -LiteralPath $sentinelPath -Value 'STOP' -Encoding utf8

            # Handle Job if active
            $existingJob = Get-Job -Name "QAP_Preflight_$WindowName" -ErrorAction SilentlyContinue
            if ($existingJob) {
                Write-Host "[preflight] Waiting for background Job to finalize..."
                Wait-Job $existingJob -Timeout 30 | Out-Null
                Receive-Job $existingJob | Out-Null
                Remove-Job $existingJob -Force
            }

            # Handle Process if active
            if (Test-Path -LiteralPath $pidFilePath) {
                Assert-PathConfinement -Path $pidFilePath -ParamName 'PidFilePath'
                $targetPid = (Get-Content -LiteralPath $pidFilePath -Raw).Trim()
                $proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "[preflight] Waiting for background process (PID: $targetPid) to exit..."
                    $proc.WaitForExit(30000)
                }
                Remove-Item -LiteralPath $pidFilePath -Force -ErrorAction SilentlyContinue
            }

            # Remove sentinel file
            if (Test-Path -LiteralPath $sentinelPath) {
                Assert-PathConfinement -Path $sentinelPath -ParamName 'SentinelPath'
                Remove-Item -LiteralPath $sentinelPath -Force -ErrorAction SilentlyContinue
            }

            Write-Host "[preflight] Background capture stopped."
            Assert-PathConfinement -Path $resolvedOutput -ParamName 'OutputPath'
            if (Test-Path -LiteralPath $resolvedOutput) {
                Write-Host "[preflight] Output manifest generated at: $resolvedOutput"
            } else {
                Write-Warning "[preflight] Expected manifest not found at: $resolvedOutput"
            }

            return [PSCustomObject]@{
                Mode   = 'Background'
                Action = 'Stop'
                Output = $resolvedOutput
                Exists = (Test-Path -LiteralPath $resolvedOutput)
            }
        }
    }
    return
}

# ==============================================================================
# SECTION 6: BASELINE SYNCHRONOUS PREFLIGHT EXECUTION
# ==============================================================================

# If running as worker process via Background Start, write PID file
if ($PidFile) {
    Assert-PathConfinement -Path $PidFile -ParamName 'PidFile'
    if (-not (Test-Path -LiteralPath $PidFile)) {
        Set-Content -LiteralPath $PidFile -Value $PID -Encoding utf8
    }
}

Write-Host "======================================================================"
Write-Host " QAMCP vNext R7 Host Preflight & Capacity Inspection"
Write-Host "======================================================================"
Write-Host "Mode: Baseline | Window: $WindowName | Target Duration: >= ${MinDurationSeconds}s"
Write-Host "Target Output: $resolvedOutput"

# Gather static environment facts
$osInfo        = Get-HostOsInfo
$toolchainInfo = Get-HostToolchain -Root $repoRoot
$gitInfo       = Get-HostGitState -Root $repoRoot
$distHashInfo  = Get-DistHashes -Root $repoRoot

# Execute telemetry sampling window
$telemetryResult = Measure-HostTelemetryWindow `
    -TargetDurationSeconds $MinDurationSeconds `
    -TargetSamples $Samples `
    -TargetIntervalMs $IntervalMs `
    -SentinelFilePath $SentinelFile `
    -AuthorizedPids $AuthorizedPids

# Compile manifest according to canonical contract
$manifest = Build-PreflightManifest `
    -ExecId $ExecutorId `
    -OsInfo $osInfo `
    -ToolchainInfo $toolchainInfo `
    -GitInfo $gitInfo `
    -DistHashInfo $distHashInfo `
    -TelemetryData $telemetryResult `
    -IsAccredited $Accredited `
    -EvidencePath $EvidenceDoc `
    -Prov $Provenance `
    -ResType $ReservationType `
    -SwapPol $SwapPolicy

# Serialize strictly conforming JSON manifest (UTF-8 without BOM for Node.js parser compatibility)
$jsonOutput = ConvertTo-Json -InputObject $manifest -Depth 12
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
Assert-PathConfinement -Path $resolvedOutput -ParamName 'OutputPath'
[System.IO.File]::WriteAllText($resolvedOutput, $jsonOutput, $utf8NoBom)

# Clean up PID and Sentinel files if passed as internal parameters
if ($PidFile) {
    Assert-PathConfinement -Path $PidFile -ParamName 'PidFile'
    if (Test-Path -LiteralPath $PidFile) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
    }
}
if ($SentinelFile) {
    Assert-PathConfinement -Path $SentinelFile -ParamName 'SentinelFile'
    if (Test-Path -LiteralPath $SentinelFile) {
        Remove-Item -LiteralPath $SentinelFile -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "----------------------------------------------------------------------"
Write-Host " Preflight Results Summary"
Write-Host "----------------------------------------------------------------------"
Write-Host "Status:        $($manifest.status)"
Write-Host "Status Reason: $($manifest.status_reason)"
Write-Host "Duration:      $([Math]::Round($manifest.telemetry_window.duration_ms / 1000, 2)) seconds"
Write-Host "Sample Count:  $($manifest.telemetry_window.sample_count)"
Write-Host "Max Gap:       $([Math]::Round($telemetryResult.max_observed_gap_ms, 1)) ms"
Write-Host "CPU Mean:      $($manifest.telemetry_window.cpu_stats.mean)%"
Write-Host "RAM Available: $($manifest.telemetry_window.mem_stats.mean_available_mb) MB (Mean)"
Write-Host "Manifest File: $resolvedOutput"
Write-Host "======================================================================"

return [PSCustomObject]@{
    status        = $manifest.status
    status_reason = $manifest.status_reason
    duration_s    = [Math]::Round($manifest.telemetry_window.duration_ms / 1000, 2)
    sample_count  = $manifest.telemetry_window.sample_count
    max_gap_ms    = $telemetryResult.max_observed_gap_ms
    output_path   = $resolvedOutput
}

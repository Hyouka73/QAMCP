param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectName,

  [Parameter(Mandatory=$true)]
  [string]$Origin,

  [Parameter(Mandatory=$true)]
  [string]$ModuleName,

  [int]$CaseCount = 1,

  [int]$TimeoutSec = 120
)

# Host-managed interactive test execution authorization dialog for QAP.
$ErrorActionPreference = 'Stop'
trap {
  [Console]::Error.WriteLine('QAP_DIALOG_ERROR ' + $_.Exception.GetType().FullName + ' ' + $_.Exception.HResult)
  Write-Output 'ERROR'
  exit 4
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

try {
  if (-not ([System.Management.Automation.PSTypeName]'QapDialogWindowUtils').Type) {
    Add-Type @'
using System;
using System.Runtime.InteropServices;
public class QapDialogWindowUtils {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);
}
'@
  }
} catch {}

if (-not [System.Windows.Forms.SystemInformation]::UserInteractive -or [System.Diagnostics.Process]::GetCurrentProcess().SessionId -eq 0) {
  Write-Output "UNAVAILABLE"
  exit 3
}

[System.Windows.Forms.Application]::EnableVisualStyles()

$decision = "CANCELLED"

$form = New-Object System.Windows.Forms.Form
$form.Text = "QAP — Autorización de Ejecución de Pruebas"
$form.Size = New-Object System.Drawing.Size(560, 420)
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ShowInTaskbar = $true
$form.TopMost = $true
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen

$header = New-Object System.Windows.Forms.Label
$header.Text = "Autorizar ejecución de casos aprobados en navegador"
$header.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$header.Location = New-Object System.Drawing.Point(20, 16)
$header.Size = New-Object System.Drawing.Size(500, 26)
$form.Controls.Add($header)

$desc = New-Object System.Windows.Forms.Label
$desc.Text = "Proyecto: $ProjectName`r`nOrigen autorizado: $Origin`r`nMódulo: $ModuleName   |   Casos aprobados: $CaseCount`r`n`r`nSe abrirá un navegador aislado únicamente sobre el origen y casos confirmados, registrando evidencias paso a paso."
$desc.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$desc.Location = New-Object System.Drawing.Point(20, 54)
$desc.Size = New-Object System.Drawing.Size(500, 140)
$form.Controls.Add($desc)

$note = New-Object System.Windows.Forms.Label
$note.Text = "Este permiso aplica al módulo y origen indicados y puede revocarse en cualquier momento."
$note.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Italic)
$note.Location = New-Object System.Drawing.Point(20, 210)
$note.Size = New-Object System.Drawing.Size(500, 40)
$form.Controls.Add($note)

$btnAuthorize = New-Object System.Windows.Forms.Button
$btnAuthorize.Text = "Autorizar ejecución"
$btnAuthorize.Location = New-Object System.Drawing.Point(20, 290)
$btnAuthorize.Size = New-Object System.Drawing.Size(210, 40)
$btnAuthorize.Add_Click({
  $script:decision = "AUTHORIZED"
  $form.Close()
})
$form.Controls.Add($btnAuthorize)

$btnReject = New-Object System.Windows.Forms.Button
$btnReject.Text = "Rechazar"
$btnReject.Location = New-Object System.Drawing.Point(250, 290)
$btnReject.Size = New-Object System.Drawing.Size(120, 40)
$btnReject.Add_Click({
  $script:decision = "REJECTED"
  $form.Close()
})
$form.Controls.Add($btnReject)

$btnCancel = New-Object System.Windows.Forms.Button
$btnCancel.Text = "Cancelar"
$btnCancel.Location = New-Object System.Drawing.Point(390, 290)
$btnCancel.Size = New-Object System.Drawing.Size(120, 40)
$btnCancel.Add_Click({
  $script:decision = "CANCELLED"
  $form.Close()
})
$form.Controls.Add($btnCancel)

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = [Math]::Max(1000, $TimeoutSec * 1000)
$timer.Add_Tick({
  $script:decision = "EXPIRED"
  $timer.Stop()
  $form.Close()
})
$timer.Start()

$form.Add_Shown({
  $form.Activate() | Out-Null
  try {
    [QapDialogWindowUtils]::BringWindowToTop($form.Handle) | Out-Null
    [QapDialogWindowUtils]::SetForegroundWindow($form.Handle) | Out-Null
  } catch {}
  [Console]::Error.WriteLine('QAP_DIALOG_SHOWN')
})

[void]$form.ShowDialog()
$timer.Stop()

Write-Output $decision
if ($decision -eq "AUTHORIZED") { exit 0 }
elseif ($decision -eq "REJECTED") { exit 1 }
else { exit 2 }

param(
  [Parameter(Mandatory=$true)]
  [string]$CanonicalPath
)

# Host-managed interactive workspace authorization dialog for QAP.
# This UI requests a human decision. It is NOT a security boundary against
# other processes running as the same Windows user; UIPI isolation is not claimed.
# Exit codes:
#   0 = Authorized by operator (stdout: AUTHORIZED)
#   1 = Rejected by operator (stdout: REJECTED)
#   2 = Cancelled / closed / timeout (stdout: CANCELLED)

$ErrorActionPreference = 'Stop'
trap {
  [Console]::Error.WriteLine('QAP_DIALOG_ERROR ' + $_.Exception.GetType().FullName + ' ' + $_.Exception.HResult)
  Write-Output 'ERROR'
  exit 4
}
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

if (-not [System.Windows.Forms.SystemInformation]::UserInteractive -or [System.Diagnostics.Process]::GetCurrentProcess().SessionId -eq 0) {
  Write-Output "UNAVAILABLE"
  exit 3
}

$decision = "CANCELLED"

$form = New-Object System.Windows.Forms.Form
$form.Text = "QAP — Autorización de Workspace"
$form.Size = New-Object System.Drawing.Size(560, 430)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ShowInTaskbar = $true

# Header Label
$header = New-Object System.Windows.Forms.Label
$header.Text = "Solicitud de autorización de workspace"
$header.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$header.Location = New-Object System.Drawing.Point(20, 16)
$header.Size = New-Object System.Drawing.Size(500, 26)
$form.Controls.Add($header)

# Subtitle
$sub = New-Object System.Windows.Forms.Label
$sub.Text = "QAP solicita permiso para operar localmente en este directorio:"
$sub.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$sub.Location = New-Object System.Drawing.Point(20, 44)
$sub.Size = New-Object System.Drawing.Size(500, 20)
$form.Controls.Add($sub)

# Canonical Path Box
$pathBox = New-Object System.Windows.Forms.TextBox
$pathBox.Text = $CanonicalPath
$pathBox.ReadOnly = $true
$pathBox.Location = New-Object System.Drawing.Point(20, 68)
$pathBox.Size = New-Object System.Drawing.Size(500, 24)
$pathBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$form.Controls.Add($pathBox)

# Details Box
$details = New-Object System.Windows.Forms.Label
$details.Text = @"
Operaciones locales permitidas tras autorizar:
  [x] Inicialización y scaffolding de la carpeta técnica (.qa/)
  [x] Base de datos de conocimiento SQLite local en el host (~/.qap/workspaces)
  [x] Detección e inspección de documentación existente (README, OpenAPI, PRD)

Operaciones NO permitidas por esta autorización:
  [ ] NO autoriza navegación web, escaneo de red ni llamadas HTTP
  [ ] NO autoriza inicio de sesión ni acceso a credenciales
  [ ] NO autoriza ejecución de pruebas ni aprobación de reglas de negocio
"@
$details.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$details.Location = New-Object System.Drawing.Point(20, 102)
$details.Size = New-Object System.Drawing.Size(500, 220)
$form.Controls.Add($details)

# Action Buttons
$btnAuth = New-Object System.Windows.Forms.Button
$btnAuth.Text = "Autorizar"
$btnAuth.Location = New-Object System.Drawing.Point(290, 340)
$btnAuth.Size = New-Object System.Drawing.Size(110, 34)
$btnAuth.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$btnAuth.Add_Click({
  $script:decision = "AUTHORIZED"
  $form.Close()
})
$form.Controls.Add($btnAuth)

$btnReject = New-Object System.Windows.Forms.Button
$btnReject.Text = "Rechazar"
$btnReject.Location = New-Object System.Drawing.Point(410, 340)
$btnReject.Size = New-Object System.Drawing.Size(110, 34)
$btnReject.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$btnReject.Add_Click({
  $script:decision = "REJECTED"
  $form.Close()
})
$form.Controls.Add($btnReject)

# Closing or pressing Escape is cancellation, never a human rejection.
$form.KeyPreview = $true
$form.Add_KeyDown({ if ($_.KeyCode -eq 'Escape') { $form.Close() } })
$form.Add_Shown({ [Console]::Error.WriteLine('QAP_DIALOG_SHOWN'); $form.Activate() })

# Safety timeout of 120 seconds if unattended
$timeoutSec = 120
$timeoutTimer = New-Object System.Windows.Forms.Timer
$timeoutTimer.Interval = $timeoutSec * 1000
$timeoutTimer.Add_Tick({
  $script:decision = 'EXPIRED'
  $form.Close()
})
$timeoutTimer.Start()

$null = $form.ShowDialog()
$timeoutTimer.Stop()

Write-Output $decision
if ($decision -eq "AUTHORIZED") { exit 0 }
elseif ($decision -eq "REJECTED") { exit 1 }
else { exit 2 }

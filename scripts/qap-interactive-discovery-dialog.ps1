param(
  [Parameter(Mandatory=$true)]
  [string]$ApplicationId,

  [Parameter(Mandatory=$true)]
  [string]$EnvironmentId,

  [Parameter(Mandatory=$true)]
  [int]$EnvironmentRevision,

  [Parameter(Mandatory=$true)]
  [string]$BaseUrl,

  [Parameter(Mandatory=$true)]
  [string]$TargetUrl,

  [int]$MaxPages = 10,
  [int]$MaxRequests = 50,
  [int]$TimeoutSec = 60,
  [ValidateSet('login', 'test', 'discovery_profile')]
  [string]$Operation,
  [string]$ProjectRoot,
  [string]$Profile,
  [string]$ScopeDetails
)

# Host-managed interactive discovery authorization dialog for QAP.
# This UI requests human consent from the operator. It is NOT a security boundary
# against other processes running under the same Windows user account; UIPI isolation is not claimed.
# Exit codes:
#   0 = Authorized by operator (stdout: AUTHORIZED)
#   1 = Rejected by operator (stdout: REJECTED)
#   2 = Cancelled / closed / timeout (stdout: CANCELLED or EXPIRED)
#   3 = Desktop session not interactive (stdout: UNAVAILABLE)
#   4 = Error during dialog execution (stdout: ERROR)

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
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
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
$form.Text = "QAP — Autorización de Navegación (Discovery)"
$form.Size = New-Object System.Drawing.Size(600, 560)
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ShowInTaskbar = $true
$form.TopMost = $true
$form.WindowState = [System.Windows.Forms.FormWindowState]::Normal

# Position dialog on active monitor (where operator mouse or focus resides)
$targetScreen = [System.Windows.Forms.Screen]::PrimaryScreen
try {
  $cursorPos = [System.Windows.Forms.Cursor]::Position
  $screenFromCursor = [System.Windows.Forms.Screen]::FromPoint($cursorPos)
  if ($screenFromCursor) {
    $targetScreen = $screenFromCursor
  }
} catch {}

$wa = $targetScreen.WorkingArea
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.Location = New-Object System.Drawing.Point(
  ($wa.Left + [Math]::Max(0, [int](($wa.Width - 600) / 2))),
  ($wa.Top + [Math]::Max(0, [int](($wa.Height - 560) / 2)))
)

# Header Label
$header = New-Object System.Windows.Forms.Label
$header.Text = "Solicitud de autorización de navegación exploratoria"
$header.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$header.Location = New-Object System.Drawing.Point(20, 14)
$header.Size = New-Object System.Drawing.Size(540, 24)
$form.Controls.Add($header)

# Subtitle
$sub = New-Object System.Windows.Forms.Label
$sub.Text = "QAP solicita consentimiento para explorar e inspeccionar la siguiente aplicación:"
$sub.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$sub.Location = New-Object System.Drawing.Point(20, 40)
$sub.Size = New-Object System.Drawing.Size(540, 18)
$form.Controls.Add($sub)

# Scope Box (App + Environment + Revision)
$scopeLabel = New-Object System.Windows.Forms.Label
$scopeLabel.Text = "Aplicación: $ApplicationId   |   Entorno: $EnvironmentId (rev $EnvironmentRevision)"
$scopeLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$scopeLabel.Location = New-Object System.Drawing.Point(20, 62)
$scopeLabel.Size = New-Object System.Drawing.Size(540, 20)
$form.Controls.Add($scopeLabel)

# Target URL Label & Box
$lblTarget = New-Object System.Windows.Forms.Label
$lblTarget.Text = "URL u origen solicitado para descubrimiento:"
$lblTarget.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$lblTarget.Location = New-Object System.Drawing.Point(20, 86)
$lblTarget.Size = New-Object System.Drawing.Size(540, 18)
$form.Controls.Add($lblTarget)

$targetBox = New-Object System.Windows.Forms.TextBox
$targetBox.Text = $TargetUrl
$targetBox.ReadOnly = $true
$targetBox.Location = New-Object System.Drawing.Point(20, 106)
$targetBox.Size = New-Object System.Drawing.Size(540, 24)
$targetBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$form.Controls.Add($targetBox)

# Details Box
$details = New-Object System.Windows.Forms.Label
$details.Text = @"
Alcance y condiciones de navegación autorizadas:
  [x] Navegación GET observacional estrictamente acotada a esta URL y su origen.
  [x] Navegación inicialmente anónima (sin autenticación ni uso de credenciales).
  [!] ADVERTENCIA: Solicitudes HTTP GET pueden tener efectos colaterales en el servidor.
  [x] Límites acotados: Máx $MaxPages páginas | Máx $MaxRequests peticiones | Timeout ${TimeoutSec}s.

Operaciones ESTRICTAMENTE PROHIBIDAS:
  [ ] PROHIBIDO: Enviar peticiones POST / PUT / PATCH / DELETE o mutaciones.
  [ ] PROHIBIDO: Operaciones destructivas o alteración del estado de la aplicación.
  [ ] PROHIBIDO: Inicio de sesión o captura de perfiles de autenticación en este paso.
  [ ] PROHIBIDO: Ejecución de suites de prueba o aprobación implícita de casos.
"@
$details.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$details.Location = New-Object System.Drawing.Point(20, 140)
$details.Size = New-Object System.Drawing.Size(540, 180)
$form.Controls.Add($details)

# Notice Label
$notice = New-Object System.Windows.Forms.Label
$notice.Text = "Si apruebas, la decisión quedará registrada de forma persistente y duradera en el host local. Si rechazas, QAP continuará únicamente con investigación documental local sin realizar ninguna solicitud HTTP externa."
$notice.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Italic)
$notice.Location = New-Object System.Drawing.Point(20, 325)
$notice.Size = New-Object System.Drawing.Size(540, 42)
$form.Controls.Add($notice)

if ($Operation) {
  $form.Text = "QAP - Autorización del host"
  $header.Text = switch ($Operation) {
    'login' { 'Inicio de sesión manual (handoff)' }
    'test' { 'Ejecución de pruebas funcionales' }
    'discovery_profile' { 'Discovery con sesión autenticada' }
  }
  $sub.Text = "Perfil: $Profile"
  $lblTarget.Text = 'URL solicitada y origen autorizado'
  $details.Visible = $false

  $scopeBox = New-Object System.Windows.Forms.TextBox
  $scopeBox.ReadOnly = $true
  $scopeBox.Multiline = $true
  $scopeBox.ScrollBars = 'Vertical'
  $scopeBox.Location = New-Object System.Drawing.Point(20, 140)
  $scopeBox.Size = New-Object System.Drawing.Size(540, 174)
  $scopeBox.Text = "Proyecto: $ProjectRoot`r`n" +
    [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($ScopeDetails))
  $form.Controls.Add($scopeBox)

  $notice.Size = New-Object System.Drawing.Size(540, 115)
  $notice.Text = switch ($Operation) {
    'login' { 'Introduce tus credenciales directamente en Chromium. Esta aprobación permite iniciar sesión y verificarla dentro del origen indicado.' }
    'test' { 'Autoriza una sola ejecución del conjunto indicado. Solo se permiten solicitudes GET y HEAD dentro del origen. Un GET puede tener efectos en el servidor.' }
    'discovery_profile' { 'Autoriza una captura de solo lectura con el perfil indicado. El permiso de navegación de Discovery sigue siendo obligatorio.' }
  }

  $btnCancel = New-Object System.Windows.Forms.Button
  $btnCancel.Text = 'Cancelar'
  $btnCancel.Location = New-Object System.Drawing.Point(190, 470)
  $btnCancel.Size = New-Object System.Drawing.Size(110, 34)
  $btnCancel.Add_Click({ $form.Close() })
  $form.Controls.Add($btnCancel)
  $form.CancelButton = $btnCancel
  $form.ActiveControl = $btnCancel
}

# Action Buttons
$btnAuth = New-Object System.Windows.Forms.Button
$btnAuth.Text = "Autorizar"
$btnAuth.Location = New-Object System.Drawing.Point(320, 470)
$btnAuth.Size = New-Object System.Drawing.Size(110, 34)
$btnAuth.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$btnAuth.Add_Click({
  $script:decision = "AUTHORIZED"
  $form.Close()
})
$form.Controls.Add($btnAuth)

$btnReject = New-Object System.Windows.Forms.Button
$btnReject.Text = "Rechazar"
$btnReject.Location = New-Object System.Drawing.Point(450, 470)
$btnReject.Size = New-Object System.Drawing.Size(110, 34)
$btnReject.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$btnReject.Add_Click({
  $script:decision = "REJECTED"
  $form.Close()
})
$form.Controls.Add($btnReject)

# Key handlers
$form.KeyPreview = $true
$form.Add_KeyDown({ if ($_.KeyCode -eq 'Escape') { $form.Close() } })

# Shown event
$form.Add_Shown({
  [Console]::Error.WriteLine('QAP_DIALOG_SHOWN')
  try {
    # Force top-most and bring to foreground across virtual desktops/displays
    [QapDialogWindowUtils]::SetWindowPos($form.Handle, [IntPtr](-1), 0, 0, 0, 0, 0x0043)
    [QapDialogWindowUtils]::SetForegroundWindow($form.Handle)
    [QapDialogWindowUtils]::BringWindowToTop($form.Handle)
    [QapDialogWindowUtils]::SwitchToThisWindow($form.Handle, $true)
  } catch {}
  $form.BringToFront()
  $form.Activate()
  $form.Focus()
  try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
})

# Safety timeout of 120 seconds if unattended
$timeoutSecWatchdog = 120
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = $timeoutSecWatchdog * 1000
$timer.Add_Tick({
  $timer.Stop()
  $script:decision = "EXPIRED"
  $form.Close()
})
$timer.Start()

[void]$form.ShowDialog()
$timer.Dispose()
$form.Dispose()

Write-Output $decision
switch ($decision) {
  "AUTHORIZED" { exit 0 }
  "REJECTED"   { exit 1 }
  "EXPIRED"    { exit 2 }
  default      { exit 2 }
}

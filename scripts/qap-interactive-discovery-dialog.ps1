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
  [ValidateSet('login', 'test', 'discovery_profile', 'credential_provision')]
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
$provision = $Operation -eq 'credential_provision'
trap {
  [Console]::Error.WriteLine('QAP_DIALOG_ERROR ' + $_.Exception.GetType().FullName + ' ' + $_.Exception.HResult)
  if (-not $provision) { Write-Output 'ERROR' }
  exit 4
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

try {
  if (-not ([System.Management.Automation.PSTypeName]'QapDialogWindowUtils').Type) {
    Add-Type @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class QapDialogWindowUtils {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("dwmapi.dll")]
    public static extern int DwmGetWindowAttribute(IntPtr hWnd, int attribute, out int value, int size);
    [DllImport("user32.dll")]
    public static extern IntPtr GetProcessWindowStation();
    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")]
    public static extern IntPtr GetThreadDesktop(uint threadId);
    [DllImport("user32.dll")]
    private static extern IntPtr OpenInputDesktop(uint flags, bool inherit, uint access);
    [DllImport("user32.dll")]
    private static extern bool CloseDesktop(IntPtr desktop);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern bool GetUserObjectInformation(IntPtr handle, int index, StringBuilder value, uint size, out uint needed);
    [DllImport("wtsapi32.dll")]
    private static extern bool WTSQuerySessionInformation(IntPtr server, int session, int info, out IntPtr buffer, out int size);
    [DllImport("wtsapi32.dll")]
    private static extern void WTSFreeMemory(IntPtr buffer);

    public static string Name(IntPtr handle) {
        var buffer = new StringBuilder(256);
        uint needed;
        return GetUserObjectInformation(handle, 2, buffer, 512, out needed) ? buffer.ToString() : "unknown";
    }

    public static string InputDesktop() {
        IntPtr desktop = OpenInputDesktop(0, false, 1);
        if (desktop == IntPtr.Zero) return "unavailable";
        try { return Name(desktop); }
        finally { CloseDesktop(desktop); }
    }

    public static int SessionState(int session) {
        IntPtr buffer;
        int size;
        if (!WTSQuerySessionInformation(IntPtr.Zero, session, 8, out buffer, out size)) return -1;
        try { return size >= 4 ? Marshal.ReadInt32(buffer) : -1; }
        finally { WTSFreeMemory(buffer); }
    }
}
'@
  }
} catch { if ($provision) { throw } }

$session = [System.Diagnostics.Process]::GetCurrentProcess().SessionId
function Test-InputDesktop {
  $station = [QapDialogWindowUtils]::Name([QapDialogWindowUtils]::GetProcessWindowStation())
  $desktop = [QapDialogWindowUtils]::Name([QapDialogWindowUtils]::GetThreadDesktop([QapDialogWindowUtils]::GetCurrentThreadId()))
  $inputDesktop = [QapDialogWindowUtils]::InputDesktop()
  $connection = [QapDialogWindowUtils]::SessionState($session)
  [Console]::Error.WriteLine("QAP_CREDENTIAL_DESKTOP $session $station $desktop $inputDesktop $connection")
  return $session -ne 0 -and [System.Windows.Forms.SystemInformation]::UserInteractive -and
    $connection -eq 0 -and $station -eq 'WinSta0' -and $desktop -eq 'Default' -and $inputDesktop -eq $desktop
}
if ($provision) {
  if (-not (Test-InputDesktop)) { exit 3 }
} elseif (-not [System.Windows.Forms.SystemInformation]::UserInteractive -or $session -eq 0) {
  Write-Output 'UNAVAILABLE'
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
    'login' { 'Autorización de sesión QA (login y pruebas de lectura)' }
    'test' { 'Autorización de sesión QA (pruebas funcionales de lectura)' }
    'discovery_profile' { 'Autorización de sesión QA (Discovery con sesión autenticada)' }
    'credential_provision' { 'Guardar una credencial de pruebas' }
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
    'login' { 'Concede autorización de sesión QA acotada a este proyecto, entorno, origen y perfil (vigencia predeterminada: 4 horas) para iniciar sesión y ejecutar pruebas o descubrimiento de lectura sin repetir ventanas. Revocable con action: "revoke".' }
    'test' { 'Concede autorización de sesión QA acotada a este proyecto, entorno, origen y perfil para ejecutar pruebas y descubrimiento de lectura dentro del origen autorizado.' }
    'discovery_profile' { 'Concede autorización de sesión QA acotada a este proyecto, entorno, origen y perfil para captura y pruebas de solo lectura.' }
    'credential_provision' { 'Al pulsar Guardar autorizas a QAP a almacenar esta contraseña en el Administrador de credenciales de Windows. El inicio de sesión requiere su propia autorización.' }
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

if ($provision) {
  $form.Text = 'QAP - Guardar credencial de pruebas'
  $scopeBox.Size = New-Object System.Drawing.Size(540, 152)
  $notice.Location = New-Object System.Drawing.Point(20, 300)
  $noticeHeight = [Math]::Max(48, [System.Windows.Forms.TextRenderer]::MeasureText(
    $notice.Text, $notice.Font, (New-Object System.Drawing.Size(540, 0)),
    [System.Windows.Forms.TextFormatFlags]::WordBreak).Height + 8)
  $notice.Size = New-Object System.Drawing.Size(540, $noticeHeight)

  $passwordLabel = New-Object System.Windows.Forms.Label
  $passwordLabel.Text = 'Contraseña de pruebas'
  $passwordLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
  $passwordLabelHeight = [Math]::Max(22, [System.Windows.Forms.TextRenderer]::MeasureText(
    $passwordLabel.Text, $passwordLabel.Font).Height + 4)
  $passwordLabel.Location = New-Object System.Drawing.Point(20, ($notice.Bottom + 8))
  $passwordLabel.Size = New-Object System.Drawing.Size(540, $passwordLabelHeight)
  $form.Controls.Add($passwordLabel)

  $passwordBox = New-Object System.Windows.Forms.TextBox
  $passwordBox.Font = New-Object System.Drawing.Font("Segoe UI", 9)
  $passwordBox.UseSystemPasswordChar = $true
  $passwordBox.MaxLength = 2048
  $passwordBox.Location = New-Object System.Drawing.Point(20, ($passwordLabel.Bottom + 4))
  $passwordBox.Size = New-Object System.Drawing.Size(540, [Math]::Max(26, $passwordBox.PreferredHeight))
  $form.Controls.Add($passwordBox)
  $form.ActiveControl = $passwordBox
  $btnAuth.Text = 'Guardar'
  $btnAuth.Enabled = $false
  $passwordBox.Add_TextChanged({ $btnAuth.Enabled = $passwordBox.TextLength -gt 0 })
  $btnReject.Visible = $false
}

# Key handlers
$form.KeyPreview = $true
$form.Add_KeyDown({ if ($_.KeyCode -eq 'Escape') { $form.Close() } })

# Shown event
$form.Add_Shown({
  if (-not $provision) { [Console]::Error.WriteLine('QAP_DIALOG_SHOWN') }
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
  if ($provision) {
    if (-not (Test-InputDesktop)) {
      $script:decision = 'UNAVAILABLE'
      $form.Close()
      return
    }
    [void]$passwordBox.Focus()
    $handle = $form.Handle
    $cloaked = 0
    $visible = [QapDialogWindowUtils]::IsWindowVisible($handle) -and
      [QapDialogWindowUtils]::DwmGetWindowAttribute($handle, 14, [ref]$cloaked, 4) -eq 0 -and
      $cloaked -eq 0 -and $form.Bounds.IntersectsWith($targetScreen.WorkingArea)
    $foreground = [QapDialogWindowUtils]::GetForegroundWindow() -eq $handle
    [Console]::Error.WriteLine("QAP_CREDENTIAL_WINDOW $($handle.ToInt64()) $([int]$visible) $([int]$foreground)")
    if (-not $visible) { $form.Close(); return }
  }
  try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
})

# Safety timeout of 120 seconds if unattended
$timeoutSecWatchdog = 120
if ($provision) { $timeoutSecWatchdog = 45 }
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
if ($provision) {
  try {
    if ($decision -eq 'UNAVAILABLE') { exit 3 }
    if ($decision -eq 'EXPIRED') { exit 5 }
    if ($decision -ne 'AUTHORIZED' -or $passwordBox.TextLength -eq 0) { exit 2 }
    # Only the host's private stdout pipe receives the accepted value.
    [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
    [Console]::Write($passwordBox.Text)
    exit 0
  } finally {
    $passwordBox.Clear()
    $form.Dispose()
  }
}
$form.Dispose()

Write-Output $decision
switch ($decision) {
  "AUTHORIZED" { exit 0 }
  "REJECTED"   { exit 1 }
  "EXPIRED"    { exit 2 }
  default      { exit 2 }
}

import { spawn } from 'node:child_process';
import { win32 } from 'node:path';

import { CredentialError } from './credential-provider.js';

// The script is fixed. Display metadata enters via stdin; the masked value leaves only via a private pipe.
const SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
trap { exit 4 }
if (-not [Environment]::UserInteractive -or [Diagnostics.Process]::GetCurrentProcess().SessionId -eq 0) {
    exit 3
}
Add-Type -AssemblyName PresentationFramework
$window = [Windows.Window]::new()
$window.Title = 'QAP - Credencial local'
$window.MinWidth = 420
$window.SizeToContent = 'WidthAndHeight'
$window.WindowStartupLocation = 'CenterScreen'
$window.ResizeMode = 'NoResize'
$window.Topmost = $true
$window.ShowActivated = $true
$window.ShowInTaskbar = $true
$panel = [Windows.Controls.StackPanel]::new()
$panel.Margin = [Windows.Thickness]::new(18)
$heading = [Windows.Controls.TextBlock]::new()
$heading.Text = 'QAP solicita una credencial de prueba'
$heading.FontWeight = 'Bold'
$heading.Margin = [Windows.Thickness]::new(0,0,0,8)
[void]$panel.Children.Add($heading)
$label = [Windows.Controls.TextBlock]::new()
$label.MaxWidth = 480
$label.TextWrapping = 'Wrap'
[Console]::InputEncoding = [Text.UTF8Encoding]::new($false)
$label.Text = [Console]::In.ReadToEnd()
[void]$panel.Children.Add($label)
$inputBox = [Windows.Controls.PasswordBox]::new()
$inputBox.Margin = [Windows.Thickness]::new(0,12,0,12)
$inputBox.MaxLength = 2048
[void]$panel.Children.Add($inputBox)
$accept = [Windows.Controls.Button]::new()
$accept.Content = 'Aceptar'
$accept.IsDefault = $true
$accept.Add_Click({ if ($inputBox.SecurePassword.Length -gt 0) { $window.DialogResult = $true } })
[void]$panel.Children.Add($accept)
$cancel = [Windows.Controls.Button]::new()
$cancel.Content = 'Cancelar'
$cancel.IsCancel = $true
[void]$panel.Children.Add($cancel)
$window.Content = $panel
$window.Add_ContentRendered({
    [void]$window.Activate()
    [void]$inputBox.Focus()
    [Console]::Error.WriteLine('QAP_CREDENTIAL_DIALOG_RENDERED')
})
try {
    if ($window.ShowDialog() -ne $true) { exit 2 }
    $secret = $inputBox.SecurePassword
    try {
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        try {
            [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
            [Console]::Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr))
        } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    } finally { $secret.Dispose() }
} finally { $inputBox.Clear() }
`;

const PRESENTATION_TIMEOUT_MS = 8_000;
const RESPONSE_TIMEOUT_MS = 120_000;

export function promptLocalSecret(label: string, signal?: AbortSignal, onPresented?: () => void): Promise<string | undefined> {
  if (process.platform !== 'win32') return Promise.reject(new CredentialError('DIALOG_DESKTOP_UNAVAILABLE'));
  if (signal?.aborted) return Promise.resolve(undefined);
  const powershell = win32.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const encoded = Buffer.from(SCRIPT, 'utf16le').toString('base64');
  return new Promise((resolve, reject) => {
    const child = spawn(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-STA', '-EncodedCommand', encoded],
      { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: false });
    const secret = Buffer.alloc(8 * 1024);
    let bytes = 0;
    let controlTail = '';
    let started = false;
    let presented = false;
    let settled = false;
    let timer = setTimeout(() => {
      finish(new CredentialError(started ? 'DIALOG_NOT_PRESENTED' : 'DIALOG_START_FAILED'));
    }, PRESENTATION_TIMEOUT_MS);

    function finish(error?: CredentialError, password?: string): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      secret.fill(0);
      if (error) {
        child.kill();
        reject(error);
      } else resolve(password);
    }

    function abort(): void {
      finish();
      child.kill();
    }

    child.once('spawn', () => { started = true; });
    child.once('error', () => {
      finish(new CredentialError(started ? 'DIALOG_FAILED' : 'DIALOG_START_FAILED'));
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (settled || !started || presented) return;
      const control = controlTail + chunk.toString('utf8');
      controlTail = control.slice(-128);
      if (!/(?:^|\r?\n)QAP_CREDENTIAL_DIALOG_RENDERED\r?\n/.test(control)) return;
      presented = true;
      clearTimeout(timer);
      timer = setTimeout(() => finish(new CredentialError('DIALOG_RESPONSE_TIMEOUT')), RESPONSE_TIMEOUT_MS);
      onPresented?.();
    });
    child.stdout.on('data', (chunk: Buffer) => {
      if (!settled) {
        if (bytes + chunk.length > secret.length) finish(new CredentialError('DIALOG_FAILED'));
        else {
          chunk.copy(secret, bytes);
          bytes += chunk.length;
        }
      }
      chunk.fill(0);
    });
    child.once('close', code => {
      if (settled) return;
      if (code === 3 && !presented) finish(new CredentialError('DIALOG_DESKTOP_UNAVAILABLE'));
      else if (code === 2 && presented && bytes === 0) finish();
      else if (code === 0 && presented && bytes > 0) finish(undefined, secret.toString('utf8', 0, bytes));
      else finish(new CredentialError(presented || code === 4 ? 'DIALOG_FAILED' : 'DIALOG_NOT_PRESENTED'));
    });
    child.stdin.on('error', () => { /* The process exit handler owns failure reporting. */ });
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    else child.stdin.end(Buffer.from(label, 'utf8'));
  });
}

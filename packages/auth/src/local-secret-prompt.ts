import { execFile } from 'node:child_process';
import { win32 } from 'node:path';

import { CredentialError } from './credential-provider.js';

// The script is fixed. Display metadata enters via stdin; the masked value leaves only via a private pipe.
const SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationFramework
$window = [Windows.Window]::new()
$window.Title = 'QAP - Credencial local'
$window.SizeToContent = 'WidthAndHeight'
$window.WindowStartupLocation = 'CenterScreen'
$window.ResizeMode = 'NoResize'
$window.Topmost = $true
$panel = [Windows.Controls.StackPanel]::new()
$panel.Margin = [Windows.Thickness]::new(18)
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
$window.Add_ContentRendered({ [void]$inputBox.Focus() })
if ($window.ShowDialog() -eq $true) {
    $secret = $inputBox.SecurePassword
    try {
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        try {
            [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
            [Console]::Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr))
        } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    } finally { $secret.Dispose() }
}
$inputBox.Clear()
`;

export function promptLocalSecret(label: string, signal?: AbortSignal): Promise<string | undefined> {
  if (process.platform !== 'win32') return Promise.reject(new CredentialError('UNAVAILABLE'));
  if (signal?.aborted) return Promise.resolve(undefined);
  const powershell = win32.join(process.env.SystemRoot ?? 'C:\\\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const encoded = Buffer.from(SCRIPT, 'utf16le').toString('base64');
  return new Promise((resolve, reject) => {
    const child = execFile(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-STA', '-EncodedCommand', encoded],
      { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024, timeout: 120_000, signal },
      (error, stdout) => {
        if (signal?.aborted) resolve(undefined);
        else if (error) reject(new CredentialError('UNAVAILABLE'));
        else resolve(stdout || undefined);
      });
    child.stdin?.on('error', () => { /* The process exit callback owns failure reporting. */ });
    child.stdin?.end(Buffer.from(label, 'utf8'));
  });
}

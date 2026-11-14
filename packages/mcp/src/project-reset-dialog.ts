import { spawn } from 'node:child_process';
import { join } from 'node:path';

import type { ResetAuthorizer } from './project-reset.js';

// Tool clients (including elicitation responders) cannot answer this dialog.
const script = String.raw`
$ErrorActionPreference = 'Stop'
if (-not [Environment]::UserInteractive) { exit 3 }
Add-Type -AssemblyName System.Windows.Forms
$input64 = [Console]::ReadLine()
$message = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($input64))
$form = New-Object Windows.Forms.Form
$form.Text = 'QAP: borrado definitivo del proyecto'
$form.Width = 780
$form.Height = 540
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true
$text = New-Object Windows.Forms.TextBox
$text.Multiline = $true
$text.ReadOnly = $true
$text.ScrollBars = 'Vertical'
$text.Dock = 'Fill'
$text.Text = $message
$panel = New-Object Windows.Forms.FlowLayoutPanel
$panel.Dock = 'Bottom'
$panel.Height = 42
foreach ($item in @(@('Cancelar','Cancel'), @('Rechazar','No'), @('Eliminar definitivamente','Yes'))) {
  $button = New-Object Windows.Forms.Button
  $button.AutoSize = $true
  $button.Text = $item[0]
  $button.DialogResult = [Windows.Forms.DialogResult]$item[1]
  $panel.Controls.Add($button)
  if ($item[1] -eq 'Cancel') { $form.CancelButton = $button }
}
$form.Controls.Add($text)
$form.Controls.Add($panel)
$form.Add_Shown({ $form.CancelButton.Focus() })
$result = $form.ShowDialog()
if ($result -eq 'Yes') { [Console]::WriteLine('QAP_RESET_APPROVED'); exit 0 }
if ($result -eq 'No') { [Console]::WriteLine('QAP_RESET_REJECTED'); exit 1 }
[Console]::WriteLine('QAP_RESET_CANCELLED')
exit 2
`;

export const windowsProjectResetAuthorizer: ResetAuthorizer = async (preview, signal) => {
  if (process.platform !== 'win32' || process.env.QAP_DISABLE_INTERACTIVE_AUTH || process.env.NODE_ENV === 'test') return 'unavailable';
  if (signal.aborted) return 'cancelled';
  const message = [
    'Esta operación elimina definitivamente los datos QAP enumerados. La carpeta del proyecto se conserva.',
    '', preview.project, 'Inventario: ' + preview.inventory_digest, 'Vence: ' + preview.expires_at, '',
    ...preview.inventory.map(item => [item.action, item.resource, String(item.count)].join(' | ')),
  ].join('\r\n');
  return new Promise(resolve => {
    const exe = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const child = spawn(exe, ['-NoProfile', '-NonInteractive', '-STA', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
      { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true, signal });
    let response = '';
    child.stdout.on('data', (chunk: Buffer) => { response = (response + chunk.toString('utf8')).slice(-128); });
    child.on('error', () => resolve(signal.aborted ? 'cancelled' : 'unavailable'));
    child.stdin.on('error', () => { /* Exit status is authoritative. */ });
    child.on('close', code => {
      const decision = response.trim();
      resolve(signal.aborted || (code === 2 && decision === 'QAP_RESET_CANCELLED') ? 'cancelled' :
        code === 0 && decision === 'QAP_RESET_APPROVED' ? 'approved' :
          code === 1 && decision === 'QAP_RESET_REJECTED' ? 'rejected' : 'unavailable');
    });
    child.stdin.end(Buffer.from(message, 'utf8').toString('base64') + '\n');
  });
};

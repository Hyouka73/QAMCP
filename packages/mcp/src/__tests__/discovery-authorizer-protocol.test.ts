import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

const launch = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', async importOriginal => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  spawn: launch,
}));
vi.mock('../authorization-diagnostics.js', () => ({ authorizationDiagnostic: () => 'synthetic-id' }));
import { WindowsInteractiveDiscoveryAuthorizer } from '../discovery-authorizer.js';

afterEach(() => { vi.useRealTimers(); launch.mockReset(); });

describe.skipIf(process.platform !== 'win32')('Windows discovery child protocol (synthetic, not GUI evidence)', () => {
  function start(signal?: AbortSignal, provision = false) {
    const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough(), pid: 123, kill: vi.fn() });
    launch.mockReturnValue(child);
    const authorizer = new WindowsInteractiveDiscoveryAuthorizer(new URL('../../../../scripts/qap-interactive-discovery-dialog.ps1', import.meta.url).pathname.replace(/^\//, ''));
    const request = {
      projectRoot: 'C:\\fixture',
      applicationId: 'test-app',
      environmentId: 'staging',
      environmentRevision: 1,
      baseUrl: 'https://staging.test.invalid/',
      targetUrl: 'https://staging.test.invalid/',
    };
    const result = provision ? authorizer.requestCredential(request, 'fixture', 'Synthetic scope', signal ?? new AbortController().signal)
      : authorizer.requestAuthorization(request, signal);
    return { child, result };
  }

  it('exit 1 without REJECTED is a launch error, not human rejection', async () => {
    const { child, result } = start(); child.emit('close', 1);
    expect(await result).toMatchObject({ decision: 'unavailable', code: 'discovery_dialog_start_failed' });
  });

  it('does not accept a substring such as NOT_AUTHORIZED', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_SHOWN'); child.stdout.write('NOT_AUTHORIZED'); child.emit('close', 0);
    expect(await result).toMatchObject({ decision: 'unavailable' });
  });

  it('handles a shown marker split across pipe chunks and registers rejection', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_'); child.stderr.write('SHOWN\n'); child.stdout.write('REJECTED\r\n'); child.emit('close', 1);
    expect(await result).toMatchObject({ decision: 'rejected' });
  });

  it('shown marker followed by AUTHORIZED and exit 0 approves', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_SHOWN\n'); child.stdout.write('AUTHORIZED\r\n'); child.emit('close', 0);
    expect(await result).toMatchObject({ decision: 'approved', targetUrl: 'https://staging.test.invalid/' });
  });

  it('handles CANCELLED and EXPIRED responses properly', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_SHOWN\n'); child.stdout.write('EXPIRED\r\n'); child.emit('close', 2);
    expect(await result).toMatchObject({ decision: 'cancelled', code: 'discovery_authorization_expired' });
  });

  it('spawn failure exposes a fixed public classification', async () => {
    const { child, result } = start(); child.emit('error', Object.assign(new Error('PRIVATE'), { code: 'EACCES' }));
    const value = await result;
    expect(value).toMatchObject({ code: 'discovery_dialog_start_failed' });
    expect(JSON.stringify(value)).not.toContain('PRIVATE');
  });

  it('watchdog terminates the child and reports expiration', async () => {
    vi.useFakeTimers(); const { child, result } = start(); await vi.advanceTimersByTimeAsync(125_000);
    expect(await result).toMatchObject({ decision: 'cancelled', code: 'discovery_authorization_expired' });
    expect(child.kill).toHaveBeenCalledOnce();
  });

  it('requires a visible HWND marker from a started process before accepting private pipe bytes', async () => {
    const { child, result } = start(undefined, true);
    child.emit('spawn');
    child.stderr.write('QAP_DIALOG_SHOWN\nQAP_CREDENTIAL_WINDOW 123 0 0\n');
    child.stdout.write('synthetic');
    child.emit('close', 0);
    await expect(result).rejects.toMatchObject({ code: 'DIALOG_NOT_PRESENTED' });
  });

  it('preserves the password bytes only on confirmed acceptance and distinguishes cancellation', async () => {
    const accepted = start(undefined, true);
    accepted.child.emit('spawn');
    accepted.child.stderr.write('QAP_CREDENTIAL_WIN');
    accepted.child.stderr.write('DOW 123 1 0\r\n');
    accepted.child.stdout.write(Buffer.from('  sintetíco  ', 'utf8'));
    accepted.child.emit('close', 0);
    await expect(accepted.result).resolves.toBe('  sintetíco  ');
    const cancelled = start(undefined, true);
    cancelled.child.emit('spawn');
    cancelled.child.stderr.write('QAP_CREDENTIAL_WINDOW 123 1 1\n');
    cancelled.child.emit('close', 2);
    await expect(cancelled.result).resolves.toBeUndefined();
  });

  it('fails promptly without the input desktop or a visible window', async () => {
    vi.useFakeTimers();
    const desktop = start(undefined, true);
    desktop.child.emit('spawn');
    desktop.child.emit('close', 3);
    await expect(desktop.result).rejects.toMatchObject({ code: 'DIALOG_DESKTOP_UNAVAILABLE' });
    const unseen = start(undefined, true);
    const rejection = expect(unseen.result).rejects.toMatchObject({ code: 'DIALOG_NOT_PRESENTED' });
    unseen.child.emit('spawn');
    await vi.advanceTimersByTimeAsync(8000);
    await rejection;
    expect(unseen.child.kill).toHaveBeenCalledOnce();
  });

  it('lays out credential_provision controls without overlap across 100%, 125% and 150% DPI scaling', () => {
    const powershell = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const scriptPath = fileURLToPath(new URL('../../../../scripts/qap-interactive-discovery-dialog.ps1', import.meta.url));
    for (const scale of [1, 1.25, 1.5]) {
      const check = spawnSync(powershell, [
        '-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-Command',
        `
        $scale = ${scale}
        $raw = (Get-Content -Raw -LiteralPath '${scriptPath.replace(/'/g, "''")}') \`
          -replace 'if \\(-not \\(Test-InputDesktop\\)\\) \\{ exit 3 \\}', '' \`
          -replace '\\[void\\]\\$form\\.ShowDialog\\(\\)', 'return'
        $sb = [ScriptBlock]::Create($raw)
        $details = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('Origen: https://qap-fixture.invalid'))
        . $sb -ApplicationId 'test-app' -EnvironmentId 'local' -EnvironmentRevision 1 \`
          -BaseUrl 'https://qap-fixture.invalid/' -TargetUrl 'https://qap-fixture.invalid/' \`
          -Operation 'credential_provision' -ProjectRoot 'C:\\fixture' -Profile 'qap-mcp-p0-synthetic' -ScopeDetails $details
        if ($scale -gt 1) {
          foreach ($c in $form.Controls) {
            if ($c.Font) { $c.Font = New-Object System.Drawing.Font($c.Font.FontFamily, [float]($c.Font.Size * $scale), $c.Font.Style) }
          }
          $notice.Size = New-Object System.Drawing.Size(540, [Math]::Max(48, [System.Windows.Forms.TextRenderer]::MeasureText($notice.Text, $notice.Font, (New-Object System.Drawing.Size(540, 0)), [System.Windows.Forms.TextFormatFlags]::WordBreak).Height + 8))
          $passwordLabel.Location = New-Object System.Drawing.Point(20, ($notice.Bottom + 8))
          $passwordLabel.Size = New-Object System.Drawing.Size(540, [Math]::Max(22, [System.Windows.Forms.TextRenderer]::MeasureText($passwordLabel.Text, $passwordLabel.Font).Height + 4))
          $passwordBox.Location = New-Object System.Drawing.Point(20, ($passwordLabel.Bottom + 4))
          $passwordBox.Size = New-Object System.Drawing.Size(540, [Math]::Max(26, $passwordBox.PreferredHeight))
        }
        $controls = @($header, $sub, $scopeLabel, $lblTarget, $targetBox, $scopeBox, $notice, $passwordLabel, $passwordBox, $btnCancel, $btnAuth)
        $overlaps = @()
        for ($i = 0; $i -lt $controls.Count; $i++) {
          for ($j = $i + 1; $j -lt $controls.Count; $j++) {
            if ($controls[$i].Bounds.IntersectsWith($controls[$j].Bounds)) {
              $overlaps += "$($controls[$i].Text)->$($controls[$j].Text)"
            }
          }
        }
        $initialSave = $btnAuth.Enabled
        $passwordBox.Text = 'synthetic'
        $enabledSave = $btnAuth.Enabled
        $passwordBox.Clear()
        $clearedSave = $btnAuth.Enabled
        $out = @{
          overlaps = $overlaps
          noticeBottom = $notice.Bottom
          labelTop = $passwordLabel.Top
          labelBottom = $passwordLabel.Bottom
          passwordTop = $passwordBox.Top
          passwordBottom = $passwordBox.Bottom
          buttonsTop = $btnAuth.Top
          rejectVisible = $btnReject.Visible
          initialSave = $initialSave
          enabledSave = $enabledSave
          clearedSave = $clearedSave
        } | ConvertTo-Json -Compress
        $timer.Dispose()
        $form.Dispose()
        Write-Output $out
        `,
      ], { encoding: 'utf8' });
      expect(check.status).toBe(0);
      const layout = JSON.parse(check.stdout.trim());
      expect(layout.overlaps).toEqual([]);
      expect(layout.noticeBottom).toBeLessThan(layout.labelTop);
      expect(layout.labelBottom).toBeLessThan(layout.passwordTop);
      expect(layout.passwordBottom).toBeLessThan(layout.buttonsTop);
      expect(layout.rejectVisible).toBe(false);
      expect(layout.initialSave).toBe(false);
      expect(layout.enabledSave).toBe(true);
      expect(layout.clearedSave).toBe(false);
    }
  });
});

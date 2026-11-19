import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { resolveDialogScriptPath } from './dialog-script-path.js';

export type NativeRuleReviewOutcome = 'confirm' | 'reject' | 'defer' | 'cancelled' | 'unavailable';
export interface NativeRuleReviewDialog {
  review(message: string, signal?: AbortSignal): Promise<NativeRuleReviewOutcome>;
}

const DIALOG_TIMEOUT_MS = 120_000;

export class WindowsRuleReviewDialog implements NativeRuleReviewDialog {
  async review(message: string, signal?: AbortSignal): Promise<NativeRuleReviewOutcome> {
    if (signal?.aborted) return 'cancelled';
    const script = resolveDialogScriptPath('qap-interactive-rule-review-dialog.ps1');
    if (process.platform !== 'win32' || !existsSync(script)) return 'unavailable';
    const powershell = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    return new Promise(resolve => {
      const child = spawn(powershell, [
        '-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-File', script,
      ], { windowsHide: false, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let settled = false;
      const finish = (outcome: NativeRuleReviewOutcome) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        resolve(outcome);
      };
      const abort = () => {
        child.kill();
        finish('cancelled');
      };
      const timer = setTimeout(abort, DIALOG_TIMEOUT_MS + 5000);
      signal?.addEventListener('abort', abort, { once: true });
      child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout = (stdout + chunk).slice(-256); });
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr = (stderr + chunk).slice(-256); });
      child.on('error', () => finish('unavailable'));
      child.stdin.on('error', () => { child.kill(); finish('unavailable'); });
      child.on('close', code => {
        if (signal?.aborted) return finish('cancelled');
        if (code !== 0 || !stderr.split(/\r?\n/).includes('QAP_REVIEW_SHOWN')) return finish('unavailable');
        const decision = stdout.trim();
        return finish(decision === 'confirm' || decision === 'reject' || decision === 'defer' || decision === 'cancelled'
          ? decision : 'unavailable');
      });
      // The proposed statement travels over a private pipe. It is never a shell argument or an executable script.
      child.stdin.end(Buffer.from(message, 'utf8'));
      if (signal?.aborted) abort();
    });
  }
}

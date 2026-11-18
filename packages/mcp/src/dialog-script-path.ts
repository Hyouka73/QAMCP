import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Resolves a bundled PowerShell interactive dialog asset across:
 * 1) packaged distribution (`dist/assets/dialogs/<fileName>` / `../assets/dialogs/<fileName>`)
 * 2) monorepo workspace sources (`../../../scripts/<fileName>`).
 */
export function resolveDialogScriptPath(fileName: string): string {
  const candidates = [
    fileURLToPath(new URL(`./assets/dialogs/${fileName}`, import.meta.url)),
    fileURLToPath(new URL(`../assets/dialogs/${fileName}`, import.meta.url)),
    fileURLToPath(new URL(`../../../scripts/${fileName}`, import.meta.url)),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

/**
 * Resolves a bundled host helper script (`dist/assets/scripts/<fileName>` or `scripts/<fileName>`).
 */
export function resolveHelperScriptPath(fileName: string): string {
  const candidates = [
    fileURLToPath(new URL(`./assets/scripts/${fileName}`, import.meta.url)),
    fileURLToPath(new URL(`../assets/scripts/${fileName}`, import.meta.url)),
    fileURLToPath(new URL(`../../../scripts/${fileName}`, import.meta.url)),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

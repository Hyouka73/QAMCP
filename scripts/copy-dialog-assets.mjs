import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIALOG_SCRIPTS = [
  'qap-interactive-dialog.ps1',
  'qap-interactive-discovery-dialog.ps1',
  'qap-interactive-auth-dialog.ps1',
  'qap-interactive-test-dialog.ps1',
];

const HELPER_SCRIPTS = ['qap-authorize-workspace.mjs'];

export function copyPackagedAssets(distDir, options = {}) {
  const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const scriptsDir = join(repoRoot, 'scripts');

  const dialogsDest = join(distDir, 'assets', 'dialogs');
  mkdirSync(dialogsDest, { recursive: true });
  for (const script of DIALOG_SCRIPTS) {
    const src = join(scriptsDir, script);
    if (!existsSync(src)) {
      throw new Error(`Missing dialog script asset: ${src}`);
    }
    copyFileSync(src, join(dialogsDest, script));
  }

  const helpersDest = join(distDir, 'assets', 'scripts');
  mkdirSync(helpersDest, { recursive: true });
  for (const script of HELPER_SCRIPTS) {
    const src = join(scriptsDir, script);
    if (!existsSync(src)) {
      throw new Error(`Missing helper script asset: ${src}`);
    }
    copyFileSync(src, join(helpersDest, script));
  }

  if (options.includeReporterTemplate) {
    const templateSrc = join(repoRoot, 'packages', 'reporter', 'src', 'template', 'index.html');
    if (existsSync(templateSrc)) {
      mkdirSync(join(distDir, 'template'), { recursive: true });
      copyFileSync(templateSrc, join(distDir, 'template', 'index.html'));
      copyFileSync(templateSrc, join(distDir, 'index.html'));
    }
  }
}

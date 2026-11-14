import { defineConfig } from 'tsup';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyPackagedAssets } from '../../scripts/copy-dialog-assets.mjs';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageRoot, '../..');
const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as { version: string };
const revision = (() => {
  try { return execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return null; }
})();

function collectSources(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name === 'dist' ? [] : collectSources(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.') && !entry.name.includes('.spec.') ? [path] : [];
  });
}

const sourceFiles = readdirSync(join(repoRoot, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => collectSources(join(repoRoot, 'packages', entry.name, 'src')))
  .sort();
const fingerprintHash = createHash('sha256');
for (const file of sourceFiles) fingerprintHash.update(relative(repoRoot, file).replaceAll('\\', '/') + '\0' + readFileSync(file));
const buildFingerprint = fingerprintHash.digest('hex');

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['esm'],
  target: 'node18',
  platform: 'node',
  clean: true,
  define: {
    'process.env.QAP_BUILD_REVISION': JSON.stringify(revision),
    'process.env.QAP_BUILD_FINGERPRINT': JSON.stringify(buildFingerprint),
    'process.env.QAP_MCP_VERSION': JSON.stringify(packageJson.version),
  },
  async onSuccess() {
    const { createHash: hashFile } = await import('node:crypto');
    const { writeFileSync: writeFile, readFileSync: readFile } = await import('node:fs');
    const { join: joinPath } = await import('node:path');
    const outputDir = joinPath(packageRoot, 'dist');
    const bundleSha256Hash = hashFile('sha256');
    for (const name of readdirSync(outputDir).filter((entry) => entry.endsWith('.js')).sort()) {
      bundleSha256Hash.update(name + '\0').update(readFile(joinPath(outputDir, name)));
    }
    const bundleSha256 = bundleSha256Hash.digest('hex');
    writeFile(joinPath(packageRoot, 'dist', 'build-meta.json'), JSON.stringify({
      schemaVersion: 1,
      packageVersion: packageJson.version,
      repositoryHead: revision,
      buildFingerprint,
      bundleSha256,
      builtAt: new Date().toISOString(),
    }, null, 2) + '\n');
    copyPackagedAssets(resolve('dist'));
  },
  dts: true,
  external: ['playwright-core'],
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __qapMcpCreateRequire } from 'node:module';
const require = __qapMcpCreateRequire(import.meta.url);`,
  },
});

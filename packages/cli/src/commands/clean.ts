import { realpathSync } from 'node:fs';

import { localProjectResetOptions, ProjectReset, windowsProjectResetAuthorizer } from '@qap/mcp';

import { CliError, UsageError } from '../errors.js';

export interface CleanOptions { preview?: boolean; yes?: boolean; force?: boolean }

export async function handleClean(options: CleanOptions = {}): Promise<void> {
  if (options.force || options.yes) throw new UsageError('El borrado de proyectos requiere autorización humana local. Usa qap clean --preview o qap clean.');
  if (process.env.QAP_MCP_HOST_CONFIG_PATH !== undefined) throw new CliError('reset_host_ownership_unavailable');
  const root = realpathSync(process.cwd());
  const reset = new ProjectReset(localProjectResetOptions(), windowsProjectResetAuthorizer);
  const preview = reset.preview(root);
  console.log(JSON.stringify(preview, null, 2));
  if (preview.status !== 'preview') throw new CliError(preview.code);
  if (options.preview) return;
  const result = await reset.confirm(root, preview.reset_id, new AbortController().signal);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'success') throw new CliError(result.code);
}

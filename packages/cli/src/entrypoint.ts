/**
 * Entrypoint binario del CLI `qap`.
 *
 * Responsabilidades de este archivo, y solo estas:
 *  1. Construir el programa (routing de subcomandos + parseo de flags),
 *     delegado en `program.ts` / `commands.ts`.
 *  2. Ejecutar el parseo sobre `process.argv`.
 *  3. Capturar cualquier error (de parseo, de un subcomando, o inesperado)
 *     y entregarlo al manejador centralizado (`errors.ts`), que es quien
 *     decide el código de salida POSIX del proceso.
 *
 * Este es el único módulo del paquete con permiso para terminar el
 * proceso (`process.exit`, vía `handleFatalError`); el resto del código
 * del CLI se limita a lanzar errores.
 */

import { realpathSync } from 'node:fs';

import { acknowledgeProjectInitialization, acquireProjectOperation, isLocalQapWorkspace, readProjectResetState, resetHostDirectory } from '@qap/mcp';

import { CliError, handleFatalError } from './errors.js';
import { createProgram } from './program.js';

async function main(): Promise<void> {
  const program = createProgram();
  let release: (() => void) | undefined;
  let initialized: (() => void) | undefined;
  program.hook('preAction', (_program, command) => {
    const name = command.name();
    if (['mcp', 'clean', 'register'].includes(name)) return;
    const host = resetHostDirectory();
    const options = command.opts();
    const root = realpathSync(name === 'report' && typeof options.cwd === 'string' ? options.cwd : process.cwd());
    // Canonical tool dispatch takes its own workspace fence. The CLI must not hold a second SQLite lock.
    const dispatchesCanonical = name === 'test' ||
      (((name === 'plan' && !options.preview) || (name === 'report' && !options.serve)) && isLocalQapWorkspace(root));
    if (!dispatchesCanonical) release = acquireProjectOperation(host);
    const state = readProjectResetState(host, root);
    if (state?.state === 'pending') throw new CliError('project_reset_incomplete');
    if (state?.state === 'complete') {
      if (name === 'init') initialized = () => acknowledgeProjectInitialization(host, root, state);
      else if (name !== 'status') throw new CliError('project_not_initialized');
    }
  });
  try {
    await program.parseAsync(process.argv);
    initialized?.();
  } finally { release?.(); }
}

main().catch(handleFatalError);

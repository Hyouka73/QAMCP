/**
 * Construcción del árbol de comandos (`Command`) de Commander.
 *
 * Centraliza:
 *  - Metadata del binario (nombre, versión, descripción).
 *  - Opciones globales (`--debug`).
 *  - El routing de subcomandos (ver `commands.ts`).
 *  - `exitOverride()`, para que Commander nunca llame a `process.exit()`
 *    por su cuenta (ayuda, versión, flags/argumentos inválidos): en su
 *    lugar lanza un `CommanderError` que termina siendo resuelto por el
 *    manejador centralizado de `errors.ts`.
 */

import { Command } from 'commander';

import { registerCommands } from './commands.js';
import { CLI_VERSION } from './version.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('qap')
    .description('QA Agent Platform - CLI de automatización de pruebas.')
    .version(CLI_VERSION, '-v, --version', 'Muestra la versión del CLI.')
    .option('--debug', 'Muestra el stack trace completo cuando ocurre un error.')
    .showHelpAfterError('(usa --help para ver los comandos disponibles)')
    .exitOverride();

  registerCommands(program);

  return program;
}
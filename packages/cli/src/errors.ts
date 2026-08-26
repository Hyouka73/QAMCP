/**
 * Manejo centralizado de errores del CLI `qap`.
 *
 * Ningún subcomando debe llamar a `process.exit()` directamente: en su lugar
 * lanza (throw) un `CliError` (o una subclase). `entrypoint.ts` es el único
 * punto del proceso donde un error se traduce a un código de salida real,
 * lo que garantiza un comportamiento consistente sin importar qué comando
 * haya fallado.
 *
 * Códigos de salida (convención POSIX / sysexits.h):
 *   0        OK              - éxito.
 *   1        GENERAL_ERROR   - error genérico o no controlado.
 *   2        USAGE           - uso incorrecto del CLI (flags/subcomando/argumentos inválidos).
 *   65-78    ...             - subconjunto de sysexits.h para errores de dominio específicos.
 */

import { CommanderError } from 'commander';

export const ExitCode = {
  OK: 0,
  GENERAL_ERROR: 1,
  USAGE: 2,
  DATA_ERROR: 65,
  NO_INPUT: 66,
  UNAVAILABLE: 69,
  SOFTWARE: 70,
  IO_ERROR: 74,
  CONFIG_ERROR: 78,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

export interface CliErrorOptions {
  exitCode?: ExitCode;
  cause?: unknown;
}

/** Error base para todo error controlado del CLI. */
export class CliError extends Error {
  readonly exitCode: ExitCode;

  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'CliError';
    this.exitCode = options.exitCode ?? ExitCode.GENERAL_ERROR;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** El usuario invocó el CLI de forma incorrecta (argumentos o flags). */
export class UsageError extends CliError {
  constructor(message: string, options: Omit<CliErrorOptions, 'exitCode'> = {}) {
    super(message, { ...options, exitCode: ExitCode.USAGE });
    this.name = 'UsageError';
  }
}

/** El subcomando existe en el routing pero aún no tiene implementación. */
export class NotImplementedError extends CliError {
  constructor(command: string) {
    super(`El subcomando "${command}" todavía no está implementado.`, {
      exitCode: ExitCode.UNAVAILABLE,
    });
    this.name = 'NotImplementedError';
  }
}

/** Entrada, schema o archivo con datos inválidos. */
export class DataError extends CliError {
  constructor(message: string, options: Omit<CliErrorOptions, 'exitCode'> = {}) {
    super(message, { ...options, exitCode: ExitCode.DATA_ERROR });
    this.name = 'DataError';
  }
}

/** Configuración del proyecto QAP ausente o inválida. */
export class ConfigError extends CliError {
  constructor(message: string, options: Omit<CliErrorOptions, 'exitCode'> = {}) {
    super(message, { ...options, exitCode: ExitCode.CONFIG_ERROR });
    this.name = 'ConfigError';
  }
}

/**
 * Punto único de traducción error -> proceso.
 * Escribe en stderr y termina el proceso con el código de salida adecuado.
 */
export function handleFatalError(error: unknown): never {
  if (error instanceof CommanderError) {
    exitFromCommanderError(error);
  }

  const message = formatErrorMessage(error);
  process.stderr.write(`qap: error: ${message}\n`);

  if (isDebugEnabled() && error instanceof Error && error.stack) {
    process.stderr.write(`${error.stack}\n`);
  }

  process.exit(resolveExitCode(error));
}

/**
 * Commander ya escribió su propio mensaje (ayuda, versión o error de
 * parseo) antes de delegar el control vía `exitOverride`. Aquí solo se
 * decide el código de salida del proceso.
 */
function exitFromCommanderError(error: CommanderError): never {
  const isInformational =
    error.code === 'commander.helpDisplayed' ||
    error.code === 'commander.version' ||
    error.exitCode === ExitCode.OK;

  process.exit(isInformational ? ExitCode.OK : ExitCode.USAGE);
}

function resolveExitCode(error: unknown): ExitCode {
  if (error instanceof CliError) {
    return error.exitCode;
  }
  return ExitCode.GENERAL_ERROR;
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Error desconocido.';
}

function isDebugEnabled(): boolean {
  return process.argv.includes('--debug') || process.env.QAP_DEBUG === '1';
}
// @qap/cli - Entry point de librería (uso programático / testing).
//
// El binario ejecutable vive en `entrypoint.ts` (registrado como `bin` en
// package.json); este módulo expone las piezas reutilizables del CLI para
// quien quiera embeberlo o testearlo sin invocar el proceso real.

export { createProgram } from './program.js';
export { handleClean } from './commands/clean.js';
export { handleMcp } from './commands/mcp.js';
export {
  CliError,
  UsageError,
  NotImplementedError,
  DataError,
  ConfigError,
  ExitCode,
  handleFatalError,
} from './errors.js';
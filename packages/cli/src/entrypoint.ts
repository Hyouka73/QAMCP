#!/usr/bin/env node
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

import { handleFatalError } from './errors.js';
import { createProgram } from './program.js';

async function main(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

main().catch(handleFatalError);
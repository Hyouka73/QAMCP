/**
 * Routing de subcomandos del CLI `qap`.
 *
 * Cada entrada mapea 1:1 con una operación pública de `QAPEngine`
 * (@qap/engine): discover, plan, test, update, report, status, context y
 * runFlow. En esta etapa solo se resuelve el *routing* y el parseo de sus
 * argumentos posicionales; el wiring real con `@qap/engine` se conecta en
 * un ticket posterior, por lo que cada acción lanza `NotImplementedError`.
 *
 * Añadir un subcomando nuevo consiste en agregar una entrada a `COMMANDS`;
 * `registerCommands` se encarga de darlo de alta en el árbol de Commander.
 */

import type { Command } from 'commander';

import { NotImplementedError } from './errors.js';

interface CommandDefinition {
  /** Nombre del subcomando, p.ej. "test" -> `qap test`. */
  name: string;
  description: string;
  /** Argumentos posicionales en sintaxis Commander, p.ej. "<module>". */
  args?: string;
}

const COMMANDS: readonly CommandDefinition[] = [
  { name: 'discover', description: 'Descubre un módulo a partir de una especificación.', args: '<spec>' },
  { name: 'plan', description: 'Genera el plan de pruebas de un módulo.', args: '<module>' },
  { name: 'test', description: 'Ejecuta el plan de pruebas de un módulo.', args: '<module>' },
  { name: 'update', description: 'Actualiza un módulo ya descubierto.', args: '<module>' },
  { name: 'report', description: 'Genera el reporte de resultados de un módulo.', args: '<module>' },
  { name: 'status', description: 'Muestra el estado general del proyecto QAP.' },
  { name: 'context', description: 'Muestra el contexto (local o global) de un módulo.', args: '[module]' },
  { name: 'flow', description: 'Ejecuta un flow definido sobre uno o más módulos.', args: '<flow>' },
];

export function registerCommands(program: Command): void {
  for (const definition of COMMANDS) {
    const subcommand = program.command(definition.name).description(definition.description);

    if (definition.args) {
      subcommand.arguments(definition.args);
    }

    subcommand.action(() => {
      throw new NotImplementedError(definition.name);
    });
  }
}
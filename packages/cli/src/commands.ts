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
import { handleInitCommand } from './init.js'; // 1. Importamos la función del wizard
import { handleAuthAdd, handleAuthList, handleAuthSetSecret, handleAuthRemove} from './auth.js'; // 1. Importamos las funciones de auth

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
  // 1. Registrar el comando `init` con su implementación real y flag `--config`
  program
    .command('init')
    .description('Inicializa la estructura .qa/ en el proyecto actual')
    .option('-c, --config <path>', 'Ruta al archivo JSON de configuración para modo silencioso')
    .action(async (options: { config?: string }) => {
      await handleInitCommand(options);
    });

  // 2. Grupo de subcomandos 'auth' (Tarea s2-003)
  const authGroup = program
    .command('auth')
    .description('Gestion de perfiles de autenticación y credenciales locales');

  authGroup
    .command('add <profile>')
    .description('Registra un nuevo perfil de autenticación')
    .action(async (profile: string) => {
      await handleAuthAdd(profile);
    });

  authGroup
    .command('list')
    .description('Lista perfiles configurados sin exponer secretos')
    .action(async () => {
      await handleAuthList();
    });

  authGroup
  .command('set-secret <profile> <secret>')
  .description('Almacena un secreto directamente en el llavero local')
  .action(async (profile: string, secret: string) => {
    await handleAuthSetSecret(profile, secret);
  });

  authGroup
  .command('remove <profile>')
  .description('Elimina un perfil del llavero local')
  .action(async (profile: string) => {
    await handleAuthRemove(profile);
  });

  // 3. Registrar el resto de comandos placeholders que lanzan NotImplementedError
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
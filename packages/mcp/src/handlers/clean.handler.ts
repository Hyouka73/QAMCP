import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { IMcpToolHandler } from '../dispatcher.js';

import { definition, validateBase, isObject, projectRoot, result, type StateDependencies } from './state-services.js';

/** The historical contract requests a general reset, not a bounded cache purge. */
export class CleanHandler implements IMcpToolHandler {
  readonly definition = definition('qap_clean');
  constructor(private readonly dependencies: StateDependencies) {}
  validateArguments(args: unknown): boolean {
    return validateBase(args, ['targetPath', 'force']) && (!isObject(args) || args.force === undefined || typeof args.force === 'boolean');
  }
  execute(args: unknown): CallToolResult {
    projectRoot(args, this.dependencies, true);
    return result({ status: 'blocked', code: 'persistent_memory_reset_not_authorized',
      message: 'El contrato solicita un reseteo general de .qa/. No puede distinguirse de la eliminación de memoria, perfiles o sesiones. force no autoriza ese borrado.',
      removed: [], desbloquear_con: 'No hay reseteo general autorizado en VNEXT-012. La limpieza selectiva requiere un contrato y un inventario de recursos temporales propios.' }, true);
  }
}

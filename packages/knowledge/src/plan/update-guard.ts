import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { parse } from 'yaml';

export interface GuardCheckResult {
  isProtected: boolean;
  reason?: string;
}

export class UpdateGuard {
  /**
   * Evalúa si una cadena en formato YAML está protegida por contenes `manually_edited: true`.
   */
  public static isProtectedContent(yamlContent: string): boolean {
    try {
      const parsed: unknown = parse(yamlContent);
      return UpdateGuard.isProtectedObject(parsed as Record<string, unknown> | null | undefined);
    } catch {
      return false;
    }
  }

  /**
   * Evalúa si un objeto JavaScript/TypeScript tiene la bandera `manually_edited: true`.
   */
  public static isProtectedObject(obj: Record<string, unknown> | null | undefined): boolean {
    return Boolean(obj && typeof obj === 'object' && obj.manually_edited === true);
  }

  /**
   * Lee de forma asíncrona un archivo YAML y determina si está protegido contra sobrescritura.
   */
  public static async isFileProtected(filePath: string): Promise<boolean> {
    try {
      if (!existsSync(filePath)) {
        return false;
      }
      const content = await readFile(filePath, 'utf-8');
      return UpdateGuard.isProtectedContent(content);
    } catch {
      return false;
    }
  }

  /**
   * Determina si se permite actualizar o sobrescribir el recurso.
   * Retorna `true` si NO está protegido (se puede actualizar), `false` si está protegido.
   */
  public static canUpdate(yamlContentOrFilePath: string): boolean {
    if (existsSync(yamlContentOrFilePath)) {
      try {
        const content = readFileSync(yamlContentOrFilePath, 'utf-8');
        return !UpdateGuard.isProtectedContent(content);
      } catch {
        return true;
      }
    }
    return !UpdateGuard.isProtectedContent(yamlContentOrFilePath);
  }
}

/**
 * Función exportada directa para conveniencia funcional.
 */
export function isProtected(target: string | Record<string, unknown>): boolean {
  if (typeof target === 'string') {
    return UpdateGuard.canUpdate(target) === false;
  }
  return UpdateGuard.isProtectedObject(target);
}
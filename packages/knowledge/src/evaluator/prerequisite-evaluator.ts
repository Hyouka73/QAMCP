import type { PrerequisiteGroup, StateRequirement } from '../types.js';

/**
 * Evalúa una lista de grupos de prerrequisitos contra el estado de runtime.
 *
 * Reglas de evaluación (qap-v3-architect/SKILL.md):
 * 1. Estructura booleana acotada a 2 niveles:
 *    - Nivel externo: Conjunción estricta (AND) entre todos los grupos en `groups`.
 *    - Nivel interno: Modo 'ALL' (AND) o 'ANY' (OR) dentro de cada grupo.
 * 2. Si `groups` está vacío, retorna `true`.
 * 3. En modo 'ALL': todos los requisitos deben cumplirse; los marcados con `isOptional: true` no bloquean si faltan o son falsos.
 * 4. En modo 'ANY': al menos un requisito debe cumplirse (`runtimeState[capabilityId] === true`).
 * 5. Equivalencia unitaria: Un grupo 'ANY' con un único requisito se comporta de forma idéntica a un grupo 'ALL' con ese mismo requisito.
 *
 * @param groups Grupos de prerrequisitos de la capacidad.
 * @param runtimeState Mapa del estado de ejecución (capabilityId -> boolean: passed/failed).
 * @returns `true` si se satisfacen todas las condiciones de prerrequisito; `false` en caso contrario.
 */
export function evaluateGroups(
  groups: PrerequisiteGroup[],
  runtimeState: Record<string, boolean>
): boolean {
  if (!groups || groups.length === 0) {
    return true;
  }

  return groups.every((group) => {
    if (!group.requirements || group.requirements.length === 0) {
      return true;
    }

    if (group.mode === 'ALL') {
      return group.requirements.every((req: StateRequirement) => {
        if (req.isOptional) {
          return true;
        }
        return Boolean(runtimeState[req.capabilityId]);
      });
    }

    if (group.mode === 'ANY') {
      // Garantizar equivalencia con grupo ALL unitario
      if (group.requirements.length === 1) {
        const singleReq = group.requirements[0];
        return singleReq.isOptional ? true : Boolean(runtimeState[singleReq.capabilityId]);
      }

      return group.requirements.some((req: StateRequirement) => {
        return Boolean(runtimeState[req.capabilityId]);
      });
    }

    return false;
  });
}

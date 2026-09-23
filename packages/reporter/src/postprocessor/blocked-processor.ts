import { evaluateGroups } from '@qap/knowledge';
import type { CapabilityDefinition } from '@qap/knowledge';

import type { StepResult } from '../types.js';

/**
 * Post-procesador de Estado `blocked` (QAP v3.0 Regla 3).
 *
 * `blocked` es un estado estrictamente derivado: nunca lo declara el test runner.
 * Este procesador recorre los pasos en orden topológico/secuencial:
 * si un prerrequisito upstream falló ('failed' o 'blocked') impidiendo la satisfacción
 * de sus grupos de prerrequisitos, los pasos dependientes quedan automáticamente marcados como 'blocked'.
 *
 * @param steps Lista de resultados de pasos emitida por la corrida.
 * @param capabilities Definiciones de capacidades estáticas del sistema.
 * @returns Lista de pasos con los estados 'blocked' asignados de forma determinista.
 */
export function processBlockedSteps(
  steps: StepResult[],
  capabilities: CapabilityDefinition[]
): StepResult[] {
  const capMap = new Map<string, CapabilityDefinition>();
  for (const cap of capabilities) {
    capMap.set(cap.id, cap);
  }

  // Mapa de satisfacción para el evaluador booleano
  const runtimeState: Record<string, boolean> = {};
  const failedOrBlockedCaps = new Set<string>();

  // Ordenar deterministamente por stepIndex
  const sortedSteps = [...steps].sort((a, b) => a.stepIndex - b.stepIndex);

  return sortedSteps.map((step) => {
    const capDef = capMap.get(step.capabilityId);

    // Si la capacidad tiene prerrequisitos definidos, evaluar si el upstream falló
    if (capDef && capDef.prerequisiteGroups && capDef.prerequisiteGroups.length > 0) {
      // Verificar si algún prerrequisito directo falló o fue bloqueado
      let hasFailedUpstream = false;
      for (const group of capDef.prerequisiteGroups) {
        for (const req of group.requirements) {
          if (failedOrBlockedCaps.has(req.capabilityId) && !req.isOptional) {
            hasFailedUpstream = true;
            break;
          }
        }
        if (hasFailedUpstream) break;
      }

      // También verificar mediante el evaluador booleano si las condiciones no se satisfacen
      const prerequisitesSatisfied = evaluateGroups(capDef.prerequisiteGroups, runtimeState);

      if (hasFailedUpstream || !prerequisitesSatisfied) {
        // Si el upstream falló y no se satisfacen los prerrequisitos, marcar como 'blocked'
        failedOrBlockedCaps.add(step.capabilityId);
        runtimeState[step.capabilityId] = false;
        return {
          ...step,
          status: 'blocked',
        };
      }
    }

    // Si el paso falló naturalmente en ejecución
    if (step.status === 'failed') {
      failedOrBlockedCaps.add(step.capabilityId);
      runtimeState[step.capabilityId] = false;
    } else if (step.status === 'passed') {
      runtimeState[step.capabilityId] = true;
    }

    return step;
  });
}

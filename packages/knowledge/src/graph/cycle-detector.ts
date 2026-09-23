import type { CapabilityDefinition } from '../types.js';

export const NodeColor = {
  WHITE: 0, // No visitado
  GRAY: 1,  // En pila de recursión (rama activa)
  BLACK: 2, // Completado
} as const;

export type NodeColor = (typeof NodeColor)[keyof typeof NodeColor];

export interface MissingReference {
  fromCapabilityId: string;
  targetCapabilityId: string;
  moduleId: string;
}

export interface DependencyGraphResult {
  adjacencyList: Map<string, string[]>;
  knownCapabilityIds: Set<string>;
  missingReferences: MissingReference[];
}

export interface CycleValidationResult {
  valid: boolean;
  cycles: string[][];
  formattedCycles: string[];
  missingReferences: MissingReference[];
  errors: string[];
}

/**
 * Construye la lista de adyacencia de dependencias entre capacidades
 * e identifica referencias rotas hacia capacidades inexistentes.
 */
export function buildDependencyGraph(
  capabilities: CapabilityDefinition[]
): DependencyGraphResult {
  const knownCapabilityIds = new Set<string>();
  const adjacencyList = new Map<string, string[]>();
  const missingReferences: MissingReference[] = [];

  for (const cap of capabilities) {
    knownCapabilityIds.add(cap.id);
    if (!adjacencyList.has(cap.id)) {
      adjacencyList.set(cap.id, []);
    }
  }

  for (const cap of capabilities) {
    const dependencies = new Set<string>();

    if (cap.prerequisiteGroups) {
      for (const group of cap.prerequisiteGroups) {
        if (group.requirements) {
          for (const req of group.requirements) {
            if (!knownCapabilityIds.has(req.capabilityId)) {
              missingReferences.push({
                fromCapabilityId: cap.id,
                targetCapabilityId: req.capabilityId,
                moduleId: cap.moduleId,
              });
            } else {
              dependencies.add(req.capabilityId);
            }
          }
        }
      }
    }

    adjacencyList.set(cap.id, Array.from(dependencies));
  }

  return {
    adjacencyList,
    knownCapabilityIds,
    missingReferences,
  };
}

/**
 * Ejecuta el algoritmo de detección de ciclos por DFS de 3 colores.
 * Reporta la ruta visual exacta de cada ciclo detectado (ej. `A → B → C → A`).
 */
export function detectCycles(
  adjacencyList: Map<string, string[]>
): { cycles: string[][]; formattedCycles: string[] } {
  const colors = new Map<string, NodeColor>();
  for (const id of adjacencyList.keys()) {
    colors.set(id, NodeColor.WHITE);
  }

  const cycles: string[][] = [];
  const formattedCycles: string[] = [];
  const currentPath: string[] = [];
  const visitedCycleSignatures = new Set<string>();

  function dfs(node: string): void {
    colors.set(node, NodeColor.GRAY);
    currentPath.push(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      const neighborColor = colors.get(neighbor) ?? NodeColor.WHITE;

      if (neighborColor === NodeColor.GRAY) {
        // Ciclo detectado: neighbor ya está en la pila de recursión
        const cycleStartIndex = currentPath.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cyclePath = currentPath.slice(cycleStartIndex).concat(neighbor);
          const signature = cyclePath.join('->');

          if (!visitedCycleSignatures.has(signature)) {
            visitedCycleSignatures.add(signature);
            cycles.push(cyclePath);
            formattedCycles.push(cyclePath.join(' → '));
          }
        }
      } else if (neighborColor === NodeColor.WHITE) {
        dfs(neighbor);
      }
    }

    currentPath.pop();
    colors.set(node, NodeColor.BLACK);
  }

  for (const node of adjacencyList.keys()) {
    if (colors.get(node) === NodeColor.WHITE) {
      dfs(node);
    }
  }

  return { cycles, formattedCycles };
}

/**
 * Valida de forma integral el grafo de dependencias de capacidades:
 * - Detecta referencias a capacidades inexistentes.
 * - Detecta ciclos directos e indirectos en build-time con DFS 3-color.
 *
 * @returns Resultado estructurado con booleano valid y listado de errores descriptivos.
 */
export function validateDependencyGraph(
  capabilities: CapabilityDefinition[]
): CycleValidationResult {
  const { adjacencyList, missingReferences } = buildDependencyGraph(capabilities);
  const { cycles, formattedCycles } = detectCycles(adjacencyList);

  const errors: string[] = [];

  for (const missing of missingReferences) {
    errors.push(
      `Referencia rota en capacidad '${missing.fromCapabilityId}' (módulo '${missing.moduleId}'): la capacidad prerrequisito '${missing.targetCapabilityId}' no existe en las definiciones.`
    );
  }

  for (const formattedCycle of formattedCycles) {
    errors.push(`Ciclo de dependencias detectado: ${formattedCycle}`);
  }

  return {
    valid: errors.length === 0,
    cycles,
    formattedCycles,
    missingReferences,
    errors,
  };
}

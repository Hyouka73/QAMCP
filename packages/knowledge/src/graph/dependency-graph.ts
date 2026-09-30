import type { CaseResult } from '@qap/shared';

import { detectCycles } from './cycle-detector.js';

export interface TestNode {
  id: string;
  depends_on?: string[];
  [key: string]: unknown;
}

export type NodeExecutionResultStatus = CaseResult;

export interface ExecutionNodeResult<T extends TestNode = TestNode> {
  node: T;
  result: NodeExecutionResultStatus;
  reason?: string;
}

export interface ResolvedGraphOrder<T extends TestNode = TestNode> {
  orderedNodes: T[];
  hasCycles: boolean;
  cycles?: string[][];
}

export class DependencyGraphResolver {
  /**
   * Ordena topológicamente una lista de nodos de prueba respetando sus dependencias declaradas (`depends_on`).
   */
  public static resolveOrder<T extends TestNode>(nodes: T[]): ResolvedGraphOrder<T> {
    const nodeMap = new Map<string, T>();
    const adjacencyList = new Map<string, string[]>();

    for (const node of nodes) {
      nodeMap.set(node.id, node);
      adjacencyList.set(node.id, node.depends_on ? [...node.depends_on] : []);
    }

    // Validar si existen dependencias circulares usando DFS 3 colores
    const { cycles } = detectCycles(adjacencyList);
    if (cycles.length > 0) {
      return {
        orderedNodes: [],
        hasCycles: true,
        cycles,
      };
    }

    const visited = new Set<string>();
    const orderedNodes: T[] = [];

    function visit(id: string) {
      if (visited.has(id)) return;
      visited.add(id);

      const deps = adjacencyList.get(id) || [];
      for (const depId of deps) {
        if (nodeMap.has(depId)) {
          visit(depId);
        }
      }

      const node = nodeMap.get(id);
      if (node) {
        orderedNodes.push(node);
      }
    }

    for (const node of nodes) {
      visit(node.id);
    }

    return {
      orderedNodes,
      hasCycles: false,
    };
  }

  /**
   * Evalúa la ejecución del grafo. Si una dependencia padre falla, se omite o resulta en `not_run`,
   * todos sus dependientes directos e indirectos son marcados automáticamente como `result: 'not_run'`.
   */
  public static propagateResults<T extends TestNode>(
    nodes: T[],
    executedResults: Map<string, NodeExecutionResultStatus>
  ): ExecutionNodeResult<T>[] {
    const resolution = this.resolveOrder(nodes);
    if (resolution.hasCycles) {
      throw new Error(`No se puede resolver el grafo porque contiene ciclos: ${JSON.stringify(resolution.cycles)}`);
    }

    const finalResults = new Map<string, { result: NodeExecutionResultStatus; reason?: string }>();

    for (const node of resolution.orderedNodes) {
      const deps = node.depends_on || [];
      let parentFailedOrBlocked = false;
      let blockingParentId = '';

      for (const depId of deps) {
        const parentRes = finalResults.get(depId);
        if (!parentRes || parentRes.result !== 'passed') {
          parentFailedOrBlocked = true;
          blockingParentId = depId;
          break;
        }
      }

      if (parentFailedOrBlocked) {
        finalResults.set(node.id, {
          result: 'not_run',
          reason: `Omitido porque la dependencia '${blockingParentId}' no tuvo estado 'passed'`,
        });
      } else {
        const status = executedResults.get(node.id) ?? 'not_run';
        finalResults.set(node.id, { result: status });
      }
    }

    return nodes.map((node) => {
      const res = finalResults.get(node.id) || { result: 'not_run' };
      return {
        node,
        result: res.result,
        reason: res.reason,
      };
    });
  }
}
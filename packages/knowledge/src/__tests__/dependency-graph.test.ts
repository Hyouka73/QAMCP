import { describe, it, expect } from 'vitest';

import { DependencyGraphResolver, type TestNode, type NodeExecutionResultStatus } from '../graph/dependency-graph.js';

describe('Suite S6-004: DependencyGraphResolver - Resolutor de Grafo de Dependencias', () => {
  it('debe ordenar topológicamente los nodos respetando las dependencias declaradas', () => {
    const nodes: TestNode[] = [
      { id: 'TC-003', depends_on: ['TC-002'] },
      { id: 'TC-001', depends_on: [] },
      { id: 'TC-002', depends_on: ['TC-001'] },
    ];

    const result = DependencyGraphResolver.resolveOrder(nodes);

    expect(result.hasCycles).toBe(false);
    expect(result.orderedNodes.map((n) => n.id)).toEqual(['TC-001', 'TC-002', 'TC-003']);
  });

  it('debe marcar como not_run los nodos dependientes cuando el nodo padre falla', () => {
    const nodes: TestNode[] = [
      { id: 'TC-001', depends_on: [] },
      { id: 'TC-002', depends_on: ['TC-001'] },
      { id: 'TC-003', depends_on: ['TC-002'] },
    ];

    const executionMap = new Map<string, NodeExecutionResultStatus>([
      ['TC-001', 'failed'],
      ['TC-002', 'passed'],
    ]);

    const results = DependencyGraphResolver.propagateResults(nodes, executionMap);

    const tc1 = results.find((r) => r.node.id === 'TC-001');
    const tc2 = results.find((r) => r.node.id === 'TC-002');
    const tc3 = results.find((r) => r.node.id === 'TC-003');

    expect(tc1?.result).toBe('failed');
    expect(tc2?.result).toBe('not_run');
    expect(tc3?.result).toBe('not_run');
  });

  it('debe detectar ciclos en el grafo de dependencias', () => {
    const nodes: TestNode[] = [
      { id: 'TC-A', depends_on: ['TC-B'] },
      { id: 'TC-B', depends_on: ['TC-A'] },
    ];

    const result = DependencyGraphResolver.resolveOrder(nodes);

    expect(result.hasCycles).toBe(true);
    expect(result.cycles).toBeDefined();
    expect(result.cycles?.length).toBeGreaterThan(0);
  });
});
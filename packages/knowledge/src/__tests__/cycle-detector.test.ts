import { describe, expect, it } from 'vitest';

import { validateDependencyGraph } from '../graph/cycle-detector.js';
import type { CapabilityDefinition } from '../types.js';

describe('Detector de Ciclos y Grafo de Dependencias (DFS 3-Colores)', () => {
  it('valida exitosamente un grafo de dependencias acíclico', () => {
    const capabilities: CapabilityDefinition[] = [
      {
        id: 'cap.a',
        name: 'Cap A',
        type: 'ui-interaction',
        moduleId: 'mod1',
        prerequisiteGroups: [],
        emits: [],
      },
      {
        id: 'cap.b',
        name: 'Cap B',
        type: 'api-rest',
        moduleId: 'mod1',
        prerequisiteGroups: [
          { mode: 'ALL', requirements: [{ capabilityId: 'cap.a' }] },
        ],
        emits: [],
      },
      {
        id: 'cap.c',
        name: 'Cap C',
        type: 'db-state',
        moduleId: 'mod1',
        prerequisiteGroups: [
          { mode: 'ALL', requirements: [{ capabilityId: 'cap.b' }] },
        ],
        emits: [],
      },
    ];

    const result = validateDependencyGraph(capabilities);
    expect(result.valid).toBe(true);
    expect(result.cycles).toHaveLength(0);
    expect(result.formattedCycles).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('detecta un ciclo directo (A → B → A) con ruta visual legible (Checklist Gate)', () => {
    const capabilities: CapabilityDefinition[] = [
      {
        id: 'cap.a',
        name: 'Cap A',
        type: 'ui-interaction',
        moduleId: 'mod1',
        prerequisiteGroups: [
          { mode: 'ALL', requirements: [{ capabilityId: 'cap.b' }] },
        ],
        emits: [],
      },
      {
        id: 'cap.b',
        name: 'Cap B',
        type: 'ui-interaction',
        moduleId: 'mod1',
        prerequisiteGroups: [
          { mode: 'ALL', requirements: [{ capabilityId: 'cap.a' }] },
        ],
        emits: [],
      },
    ];

    const result = validateDependencyGraph(capabilities);
    expect(result.valid).toBe(false);
    expect(result.cycles.length).toBeGreaterThan(0);
    
    // Verificar que la ruta visual contenga la secuencia directa esperada
    const hasDirectCyclePath = result.formattedCycles.some(
      (path) => path === 'cap.a → cap.b → cap.a' || path === 'cap.b → cap.a → cap.b'
    );
    expect(hasDirectCyclePath).toBe(true);
    expect(result.errors[0]).toContain('Ciclo de dependencias detectado:');
  });

  it('detecta un ciclo indirecto de 4+ nodos (A → B → C → D → A) con ruta legible (Checklist Gate)', () => {
    const capabilities: CapabilityDefinition[] = [
      {
        id: 'node.a',
        name: 'Node A',
        type: 'ui-interaction',
        moduleId: 'mod',
        prerequisiteGroups: [
          { mode: 'ALL', requirements: [{ capabilityId: 'node.b' }] },
        ],
        emits: [],
      },
      {
        id: 'node.b',
        name: 'Node B',
        type: 'api-rest',
        moduleId: 'mod',
        prerequisiteGroups: [
          { mode: 'ALL', requirements: [{ capabilityId: 'node.c' }] },
        ],
        emits: [],
      },
      {
        id: 'node.c',
        name: 'Node C',
        type: 'event-stream',
        moduleId: 'mod',
        prerequisiteGroups: [
          { mode: 'ALL', requirements: [{ capabilityId: 'node.d' }] },
        ],
        emits: [],
      },
      {
        id: 'node.d',
        name: 'Node D',
        type: 'db-state',
        moduleId: 'mod',
        prerequisiteGroups: [
          { mode: 'ALL', requirements: [{ capabilityId: 'node.a' }] },
        ],
        emits: [],
      },
    ];

    const result = validateDependencyGraph(capabilities);
    expect(result.valid).toBe(false);
    expect(result.cycles.length).toBeGreaterThan(0);

    const hasFourNodeCycle = result.formattedCycles.some(
      (path) =>
        path === 'node.a → node.b → node.c → node.d → node.a' ||
        path === 'node.b → node.c → node.d → node.a → node.b' ||
        path === 'node.c → node.d → node.a → node.b → node.c' ||
        path === 'node.d → node.a → node.b → node.c → node.d'
    );
    expect(hasFourNodeCycle).toBe(true);
  });

  it('identifica y reporta referencias a capabilityId inexistentes de forma descriptiva (Checklist Gate)', () => {
    const capabilities: CapabilityDefinition[] = [
      {
        id: 'auth.mfa.verify',
        name: 'Verify MFA',
        type: 'ui-interaction',
        moduleId: 'auth',
        prerequisiteGroups: [
          {
            mode: 'ALL',
            requirements: [{ capabilityId: 'non.existent.capability' }],
          },
        ],
        emits: [],
      },
    ];

    const result = validateDependencyGraph(capabilities);
    expect(result.valid).toBe(false);
    expect(result.missingReferences).toHaveLength(1);
    expect(result.missingReferences[0]).toEqual({
      fromCapabilityId: 'auth.mfa.verify',
      targetCapabilityId: 'non.existent.capability',
      moduleId: 'auth',
    });

    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain(
      "Referencia rota en capacidad 'auth.mfa.verify' (módulo 'auth'): la capacidad prerrequisito 'non.existent.capability' no existe"
    );
  });
});

import { describe, expect, it } from 'vitest';

import { evaluateGroups } from '../evaluator/prerequisite-evaluator.js';
import type { PrerequisiteGroup, StateRequirement } from '../types.js';

describe('Evaluador Booleano de Prerrequisitos (QAP v3.0)', () => {
  it('retorna true cuando la lista de grupos está vacía', () => {
    const result = evaluateGroups([], { 'auth.login': true });
    expect(result).toBe(true);
  });

  describe('Modo ALL (Conjunción dentro del grupo)', () => {
    it('retorna true cuando todos los requisitos obligatorios están satisfechos', () => {
      const groups: PrerequisiteGroup[] = [
        {
          mode: 'ALL',
          requirements: [
            { capabilityId: 'cap.a' },
            { capabilityId: 'cap.b' },
          ],
        },
      ];
      const runtimeState = { 'cap.a': true, 'cap.b': true };
      expect(evaluateGroups(groups, runtimeState)).toBe(true);
    });

    it('retorna false si al menos un requisito obligatorio no está satisfecho', () => {
      const groups: PrerequisiteGroup[] = [
        {
          mode: 'ALL',
          requirements: [
            { capabilityId: 'cap.a' },
            { capabilityId: 'cap.b' },
          ],
        },
      ];
      const runtimeState = { 'cap.a': true, 'cap.b': false };
      expect(evaluateGroups(groups, runtimeState)).toBe(false);
    });

    it('no bloquea la evaluación si un requisito con isOptional: true no está presente o es false', () => {
      const groups: PrerequisiteGroup[] = [
        {
          mode: 'ALL',
          requirements: [
            { capabilityId: 'cap.a' },
            { capabilityId: 'cap.opt', isOptional: true },
          ],
        },
      ];
      // cap.opt no está en runtimeState
      expect(evaluateGroups(groups, { 'cap.a': true })).toBe(true);
      // cap.opt está en false
      expect(evaluateGroups(groups, { 'cap.a': true, 'cap.opt': false })).toBe(true);
      // cap.a es false (obligatorio falla)
      expect(evaluateGroups(groups, { 'cap.a': false, 'cap.opt': true })).toBe(false);
    });
  });

  describe('Modo ANY (Disyunción dentro del grupo)', () => {
    it('retorna true si al menos un requisito está satisfecho', () => {
      const groups: PrerequisiteGroup[] = [
        {
          mode: 'ANY',
          requirements: [
            { capabilityId: 'cap.a' },
            { capabilityId: 'cap.b' },
          ],
        },
      ];
      expect(evaluateGroups(groups, { 'cap.a': true, 'cap.b': false })).toBe(true);
      expect(evaluateGroups(groups, { 'cap.a': false, 'cap.b': true })).toBe(true);
    });

    it('retorna false si ninguno de los requisitos está satisfecho', () => {
      const groups: PrerequisiteGroup[] = [
        {
          mode: 'ANY',
          requirements: [
            { capabilityId: 'cap.a' },
            { capabilityId: 'cap.b' },
          ],
        },
      ];
      expect(evaluateGroups(groups, { 'cap.a': false, 'cap.b': false })).toBe(false);
      expect(evaluateGroups(groups, {})).toBe(false);
    });
  });

  describe('Equivalencia de grupo ANY unitario con grupo ALL unitario (Checklist Gate)', () => {
    const testCases: Array<{
      description: string;
      req: StateRequirement;
      runtimeState: Record<string, boolean>;
    }> = [
      {
        description: 'requisito presente y true',
        req: { capabilityId: 'cap.x' },
        runtimeState: { 'cap.x': true },
      },
      {
        description: 'requisito presente y false',
        req: { capabilityId: 'cap.x' },
        runtimeState: { 'cap.x': false },
      },
      {
        description: 'requisito ausente de runtimeState',
        req: { capabilityId: 'cap.x' },
        runtimeState: {},
      },
      {
        description: 'requisito opcional y ausente',
        req: { capabilityId: 'cap.x', isOptional: true },
        runtimeState: {},
      },
      {
        description: 'requisito opcional y true',
        req: { capabilityId: 'cap.x', isOptional: true },
        runtimeState: { 'cap.x': true },
      },
      {
        description: 'requisito opcional y false',
        req: { capabilityId: 'cap.x', isOptional: true },
        runtimeState: { 'cap.x': false },
      },
    ];

    testCases.forEach(({ description, req, runtimeState }) => {
      it(`evalúa idéntico para ANY vs ALL con 1 requisito (${description})`, () => {
        const groupAny: PrerequisiteGroup[] = [{ mode: 'ANY', requirements: [req] }];
        const groupAll: PrerequisiteGroup[] = [{ mode: 'ALL', requirements: [req] }];

        const resultAny = evaluateGroups(groupAny, runtimeState);
        const resultAll = evaluateGroups(groupAll, runtimeState);

        expect(resultAny).toBe(resultAll);
      });
    });
  });

  describe('Evaluación Multinivel Acotada (AND entre grupos)', () => {
    it('retorna true solo si todos los grupos (AND entre grupos) se satisfacen', () => {
      const groups: PrerequisiteGroup[] = [
        {
          mode: 'ANY',
          requirements: [{ capabilityId: 'auth.pwd' }, { capabilityId: 'auth.sso' }],
        },
        {
          mode: 'ALL',
          requirements: [{ capabilityId: 'auth.mfa' }],
        },
      ];

      // Uno de ANY satisfecho y ALL satisfecho
      expect(
        evaluateGroups(groups, { 'auth.pwd': true, 'auth.sso': false, 'auth.mfa': true })
      ).toBe(true);

      // ANY satisfecho pero ALL fallido
      expect(
        evaluateGroups(groups, { 'auth.pwd': true, 'auth.sso': false, 'auth.mfa': false })
      ).toBe(false);

      // ALL satisfecho pero ANY no satisfecho
      expect(
        evaluateGroups(groups, { 'auth.pwd': false, 'auth.sso': false, 'auth.mfa': true })
      ).toBe(false);
    });
  });
});

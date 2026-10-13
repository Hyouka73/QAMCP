import { describe, it, expect } from 'vitest';

import {
  validarEmisionPregunta,
  guardPregunta,
  type Pregunta,
} from '../pregunta.js';
import { obtenerSiguientePreguntaOnboarding } from '../onboarding-interview.js';

describe('Criterio 6: Guardia de emisión central de preguntas (guardPregunta)', () => {
  it('todas las preguntas generadas por obtenerSiguientePreguntaOnboarding pasan la guardia de emisión', () => {
    // 1. Sin documentos encontrados
    const qNoDocs = obtenerSiguientePreguntaOnboarding({}, null, { documentos: [] });
    expect(qNoDocs).not.toBeNull();
    expect(() => guardPregunta(qNoDocs!)).not.toThrow();

    // 2. Con 1 documento encontrado (README.md)
    const qOneDoc = obtenerSiguientePreguntaOnboarding({}, null, { documentos: ['README.md'] });
    expect(qOneDoc).not.toBeNull();
    expect(() => guardPregunta(qOneDoc!)).not.toThrow();

    // 3. Con 3 documentos encontrados
    const qMultiDocs = obtenerSiguientePreguntaOnboarding({}, null, { documentos: ['docs/prd.md', 'README.md', 'SPEC.md'] });
    expect(qMultiDocs).not.toBeNull();
    expect(() => guardPregunta(qMultiDocs!)).not.toThrow();

    // 4. Pregunta de resumen para confirmación única
    const qSummary = obtenerSiguientePreguntaOnboarding({
      source_of_truth: { declared: true, type: 'prd', ref: 'docs/prd.md', source: 'user' },
      objective: 'Sistema de pagos empresariales',
      objective_source: 'inferred',
      roles: [{ name: 'admin', source: 'inferred' }],
      critical_flows: [{ name: 'checkout', source: 'inferred' }],
    }, null, { documentos: [] });
    expect(qSummary).not.toBeNull();
    expect(() => guardPregunta(qSummary!)).not.toThrow();

    // 5. Fallbacks abiertos de objetivo, roles, flujos
    const qObj = obtenerSiguientePreguntaOnboarding({
      source_of_truth: { declared: true, type: 'readme', ref: 'README.md', source: 'user' },
    }, null, { documentos: [] });
    expect(qObj).not.toBeNull();
    expect(qObj?.id).toBe('onboarding.objetivo');
    expect(() => guardPregunta(qObj!)).not.toThrow();

    const qRoles = obtenerSiguientePreguntaOnboarding({
      source_of_truth: { declared: true, type: 'readme', ref: 'README.md', source: 'user' },
      objective: 'Objetivo ya confirmado por el usuario para pruebas',
      objective_source: 'user',
    }, null, { documentos: [] });
    expect(qRoles).not.toBeNull();
    expect(qRoles?.id).toBe('onboarding.roles');
    expect(() => guardPregunta(qRoles!)).not.toThrow();

    const qFlows = obtenerSiguientePreguntaOnboarding({
      source_of_truth: { declared: true, type: 'readme', ref: 'README.md', source: 'user' },
      objective: 'Objetivo ya confirmado por el usuario para pruebas',
      objective_source: 'user',
      roles: [{ name: 'admin', source: 'user' }],
    }, null, { documentos: [] });
    expect(qFlows).not.toBeNull();
    expect(qFlows?.id).toBe('onboarding.flujos_criticos');
    expect(() => guardPregunta(qFlows!)).not.toThrow();

    // 6. Confirmación de resumen y seguimiento
    const qSummary2 = obtenerSiguientePreguntaOnboarding({
      source_of_truth: { declared: true, type: 'readme', ref: 'README.md', source: 'user' },
      objective: 'Objetivo ya confirmado por el usuario para pruebas',
      objective_source: 'user',
      roles: [{ name: 'admin', source: 'user' }],
      critical_flows: [{ name: 'login', source: 'user' }],
    }, null, { documentos: [] });
    expect(qSummary2).not.toBeNull();
    expect(qSummary2?.id).toBe('onboarding.confirmar_resumen');
    expect(qSummary2?.seguimiento).toBeDefined();
    expect(() => guardPregunta(qSummary2!)).not.toThrow();
    expect(() => guardPregunta(qSummary2!.seguimiento!)).not.toThrow();
  });

  it('guardPregunta rechaza etiquetas tautológicas generadas por el motor', () => {
    const tautologicalQ: Pregunta = {
      id: 'test.tautological',
      texto: 'Selecciona cómo proceder con el propósito del módulo:',
      formato: 'una_opcion',
      opciones: [
        { id: 'opt1', etiqueta: 'Confirmar propósito y comportamiento esperado' },
        { id: 'opt2', etiqueta: 'Modificar propósito' },
      ],
      permite_otra: true,
      registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
    };

    expect(() => guardPregunta(tautologicalQ)).toThrow(/etiqueta tautológica/);
  });

  it('guardPregunta rechaza preguntas que comiencen por "¿Deseas" o "Deseas"', () => {
    const deseasQ: Pregunta = {
      id: 'test.deseas',
      texto: '¿Deseas cerrar el módulo ahora?',
      formato: 'una_opcion',
      opciones: [
        { id: 'si', etiqueta: 'Sí, cerrar' },
        { id: 'no', etiqueta: 'No, continuar' },
      ],
      permite_otra: true,
      registrar_con: { tool: 'qap_module_close', campo: 'action' },
    };

    expect(() => guardPregunta(deseasQ)).toThrow(/preguntas de permiso/);
  });

  it('guardPregunta rechaza preguntas con opciones insuficientes (<2) en una_opcion o multiple', () => {
    const singleQ: Pregunta = {
      id: 'test.single',
      texto: 'Selecciona la ruta del módulo:',
      formato: 'una_opcion',
      opciones: [{ id: 'opt1', etiqueta: 'Ruta /dashboard' }],
      permite_otra: true,
      registrar_con: { tool: 'qap_session_plan', campo: 'modules' },
    };

    expect(() => guardPregunta(singleQ)).toThrow(/al menos 2 opciones/);
  });

  it('validarEmisionPregunta reporta todos los errores de emisión', () => {
    const badQ: Pregunta = {
      id: 'bad.q',
      texto: 'Deseas confirmar la vista default?',
      formato: 'una_opcion',
      opciones: [{ id: 'o1', etiqueta: 'Confirmar propósito y comportamiento esperado' }],
      permite_otra: false,
      registrar_con: { tool: 'tool', campo: 'field' },
    };

    const res = validarEmisionPregunta(badQ);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(3);
  });
});

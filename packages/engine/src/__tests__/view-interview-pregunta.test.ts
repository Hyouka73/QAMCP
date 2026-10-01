import type { RuleEntry } from '@qap/shared';
import { describe, it, expect } from 'vitest';

import { generateNextInterviewBatch, type ViewDiscoveryContext } from '../interview-engine.js';
import { validarPregunta } from '../pregunta.js';

describe('E3: Entrevista de vista con contrato de Pregunta (Criterio 5)', () => {
  it('la pregunta de confirmar_hipotesis enumera las hipótesis, ofrece las 3 opciones con sus efectos y el seguimiento anidado', () => {
    const ctx: ViewDiscoveryContext = {
      module: 'auth',
      view: 'default',
      route: '/auth/login',
    };

    const pendingHypotheses: RuleEntry[] = [
      {
        id: 'auth.username.required',
        description: 'El campo usuario es obligatorio para iniciar sesión',
        category: 'campo',
        status: 'inferred',
        source: 'dom',
        view: 'default',
      },
      {
        id: 'auth.password.sensible',
        description: 'El campo contraseña contiene información confidencial',
        category: 'sensibilidad',
        status: 'inferred',
        source: 'dom',
        view: 'default',
      },
    ];

    const questions = generateNextInterviewBatch(ctx, pendingHypotheses, ['campo', 'proposito'], []);
    expect(questions.length).toBeGreaterThan(0);

    const confirmQ = questions[0];
    expect(confirmQ.tipo).toBe('confirmar_hipotesis');

    // 1. Enumera las hipótesis en el texto (id y enunciado, una por línea)
    expect(confirmQ.texto).toContain('- [auth.username.required] El campo usuario es obligatorio para iniciar sesión');
    expect(confirmQ.texto).toContain('- [auth.password.sensible] El campo contraseña contiene información confidencial');

    // 2. Ofrece las 3 opciones exactas con sus efectos
    expect(confirmQ.opciones).toHaveLength(3);
    const optConf = confirmQ.opciones.find((o) => o.etiqueta === 'Confirmo todas');
    expect(optConf).toBeDefined();
    expect(optConf?.recomendada).toBe(true);
    expect(optConf?.efecto?.estado).toBe('confirmed');

    const optCorr = confirmQ.opciones.find((o) => o.etiqueta === 'Quiero corregir alguna');
    expect(optCorr).toBeDefined();
    expect(optCorr?.efecto?.abre_seguimiento).toBe(true);

    const optDef = confirmQ.opciones.find((o) => o.etiqueta === 'Las dejo pendientes');
    expect(optDef).toBeDefined();
    expect(optDef?.efecto?.estado).toBe('deferred');

    // 3. Seguimiento anidado
    expect(confirmQ.seguimiento).toBeDefined();
    const seg = confirmQ.seguimiento!;
    expect(seg.formato).toBe('multiple');
    expect(seg.opciones.length).toBeGreaterThanOrEqual(2);
    for (const opt of seg.opciones) {
      if (opt.id !== 'ninguna') {
        expect(opt.efecto?.estado).toBe('rejected');
      }
    }

    // 4. Pasa validarPregunta
    const validacion = validarPregunta(confirmQ);
    expect(validacion.valid).toBe(true);
    expect(validacion.errors).toHaveLength(0);

    // 5. Todas las preguntas del lote son Preguntas válidas
    for (const q of questions) {
      const v = validarPregunta(q);
      expect(v.valid).toBe(true);
    }
  });
});

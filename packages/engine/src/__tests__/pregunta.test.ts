import { describe, it, expect } from 'vitest';

import { validarPregunta, type Pregunta } from '../pregunta.js';

describe('E1: Contrato de Pregunta y validarPregunta', () => {
  const validBaseQuestion: Pregunta = {
    id: 'onboarding.fuente_de_verdad',
    texto: 'Selecciona la fuente de verdad inicial del proyecto:',
    formato: 'una_opcion',
    opciones: [
      { id: 'readme', etiqueta: 'README.md', recomendada: true },
      { id: 'none', etiqueta: 'No existe documento, definimos desde cero' },
    ],
    permite_otra: true,
    registrar_con: { tool: 'qap_context_set', campo: 'source_of_truth' },
  };

  it('acepta una pregunta válida con formato una_opcion y >= 2 opciones', () => {
    const res = validarPregunta(validBaseQuestion);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('acepta formato abierta con opciones estrictamente vacío', () => {
    const abiertaQ: Pregunta = {
      id: 'onboarding.objetivo',
      texto: 'Describe el objetivo del proyecto y el valor que entrega al usuario final:',
      formato: 'abierta',
      opciones: [],
      permite_otra: true,
      registrar_con: { tool: 'qap_context_set', campo: 'objective' },
    };
    const res = validarPregunta(abiertaQ);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rechaza formato abierta si contiene opciones', () => {
    const abiertaConOpciones: Pregunta = {
      ...validBaseQuestion,
      formato: 'abierta',
      opciones: [{ id: 'opt1', etiqueta: 'Opción 1' }],
    };
    const res = validarPregunta(abiertaConOpciones);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("formato 'abierta' exige que 'opciones' esté vacío"))).toBe(true);
  });

  it('rechaza una sola opción en formato una_opcion o multiple (una tarjeta de una sola opción es inválida)', () => {
    const singleOption: Pregunta = {
      ...validBaseQuestion,
      formato: 'una_opcion',
      opciones: [{ id: 'single', etiqueta: 'Única opción' }],
    };
    const res = validarPregunta(singleOption);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('exige al menos 2 opciones reales'))).toBe(true);

    const singleMultiple: Pregunta = {
      ...validBaseQuestion,
      formato: 'multiple',
      opciones: [{ id: 'single', etiqueta: 'Única opción' }],
    };
    const resMult = validarPregunta(singleMultiple);
    expect(resMult.valid).toBe(false);
    expect(resMult.errors.some((e) => e.includes('exige al menos 2 opciones reales'))).toBe(true);
  });

  it('rechaza si hay más de una opción recomendada', () => {
    const multiRecomendada: Pregunta = {
      ...validBaseQuestion,
      opciones: [
        { id: 'opt1', etiqueta: 'Opción 1', recomendada: true },
        { id: 'opt2', etiqueta: 'Opción 2', recomendada: true },
      ],
    };
    const res = validarPregunta(multiRecomendada);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Como máximo una opción puede estar marcada como recomendada'))).toBe(true);
  });

  it('rechaza textos con preguntas de permiso o la palabra "Deseas" o "Quieres"', () => {
    const conDeseas: Pregunta = {
      ...validBaseQuestion,
      texto: '¿Deseas registrar un documento de especificación?',
    };
    const res1 = validarPregunta(conDeseas);
    expect(res1.valid).toBe(false);
    expect(res1.errors.some((e) => e.includes('preguntas de permiso'))).toBe(true);

    const conQuieres: Pregunta = {
      ...validBaseQuestion,
      texto: '¿Quieres confirmar estas reglas?',
    };
    const res2 = validarPregunta(conQuieres);
    expect(res2.valid).toBe(false);
    expect(res2.errors.some((e) => e.includes('preguntas de permiso'))).toBe(true);
  });

  it('rechaza textos con id interno de vista (default)', () => {
    const conDefault: Pregunta = {
      ...validBaseQuestion,
      texto: "Configuración para la vista default del módulo 'auth'",
    };
    const res = validarPregunta(conDefault);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("id interno de vista ('default')"))).toBe(true);
  });

  it('rechaza textos con identificadores internos de formulario', () => {
    const conFormId: Pregunta = {
      ...validBaseQuestion,
      texto: "Valida las reglas para el formulario form-login-1 del módulo 'auth'",
    };
    const res = validarPregunta(conFormId);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('identificadores internos de formulario'))).toBe(true);
  });

  it('rechaza textos con selectores CSS o sintaxis DOM', () => {
    const conSelector: Pregunta = {
      ...validBaseQuestion,
      texto: 'Confirma la acción para el botón button:has-text("Ingresar")',
    };
    const res = validarPregunta(conSelector);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('selectores CSS'))).toBe(true);
  });

  it('valida recursivamente la pregunta de seguimiento si existe', () => {
    const conSeguimientoInvalido: Pregunta = {
      ...validBaseQuestion,
      seguimiento: {
        id: 'seguimiento.invalido',
        texto: '¿Deseas descartar alguna regla?', // Inválido por "Deseas"
        formato: 'multiple',
        opciones: [
          { id: 'r1', etiqueta: 'Regla 1' },
          { id: 'r2', etiqueta: 'Regla 2' },
        ],
        permite_otra: true,
        registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
      },
    };
    const res = validarPregunta(conSeguimientoInvalido);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('[seguimiento]'))).toBe(true);

    const conSeguimientoValido: Pregunta = {
      ...validBaseQuestion,
      seguimiento: {
        id: 'seguimiento.valido',
        texto: 'Selecciona las reglas incorrectas para descartarlas:',
        formato: 'multiple',
        opciones: [
          { id: 'r1', etiqueta: 'Regla 1' },
          { id: 'r2', etiqueta: 'Regla 2' },
        ],
        permite_otra: true,
        registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
      },
    };
    const resValido = validarPregunta(conSeguimientoValido);
    expect(resValido.valid).toBe(true);
  });
});

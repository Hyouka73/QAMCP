import { isTautologicalOptionLabel, normalizeRuleText } from '@qap/shared';

import { sanitizeDomString } from './interview-engine.js';

export type FormatoPregunta = 'una_opcion' | 'multiple' | 'abierta';

export type AccionOpcion = 'declarar_fuente' | 'sin_documento' | 'confirmar_resumen' | 'corregir' | 'definir_url';

export interface Opcion {
  id: string;
  etiqueta: string;
  recomendada?: boolean;
  efecto?: {
    estado?: 'confirmed' | 'rejected' | 'deferred';
    accion?: AccionOpcion;
    abre_seguimiento?: boolean;
  };
}

export interface RegistrarCon {
  tool: string;
  campo: string;
}

export interface Pregunta {
  id: string;
  texto: string;
  render_texto?: string;
  formato: FormatoPregunta;
  opciones: Opcion[];
  permite_otra: boolean;
  registrar_con: RegistrarCon;
  seguimiento?: Pregunta;
}

export interface ValidacionPreguntaResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validador puro para el contrato de Pregunta (E1 / P4.2)
 *
 * Reglas canónicas:
 * - id estable y determinista (alfanumérico con puntos, guiones y guiones bajos).
 * - formato una_opcion o multiple exige >= 2 opciones reales; una sola opción es inválida.
 * - formato abierta exige opciones vacío.
 * - como máximo una opción recomendada.
 * - texto en español, dirigido al usuario:
 *     - sin ids de formulario (ej: form-login, form_1, etc.)
 *     - sin selectores CSS (ej: #id, button:has-text, input[name=...], etc.)
 *     - sin id interno de vista (ej: 'default' como vista interna)
 *     - sin la frase "Deseas" ni preguntas de permiso (¿Deseas...?, ¿Quieres...?, etc.)
 * - si tiene seguimiento, se valida recursivamente como Pregunta.
 */
export function validarPregunta(pregunta: unknown): ValidacionPreguntaResult {
  const errors: string[] = [];

  if (!pregunta || typeof pregunta !== 'object') {
    return { valid: false, errors: ['La pregunta debe ser un objeto definido.'] };
  }

  const p = pregunta as Partial<Pregunta>;

  // 1. ID estable y determinista
  if (typeof p.id !== 'string' || !p.id.trim()) {
    errors.push("El campo 'id' es obligatorio y debe ser una cadena no vacía.");
  } else if (!/^[a-zA-Z0-9_.-]+$/.test(p.id.trim())) {
    errors.push(`El id '${p.id}' no es determinista ni estable (solo caracteres alfanuméricos, '.', '_' y '-').`);
  }

  // 2. Formato
  const formatosValidos: FormatoPregunta[] = ['una_opcion', 'multiple', 'abierta'];
  if (!p.formato || !formatosValidos.includes(p.formato)) {
    errors.push(`El formato '${p.formato}' no es válido. Debe ser: ${formatosValidos.join(', ')}.`);
  }

  // 3. Opciones
  if (!Array.isArray(p.opciones)) {
    errors.push("El campo 'opciones' debe ser un arreglo.");
  } else {
    if (p.formato === 'una_opcion' || p.formato === 'multiple') {
      if (p.opciones.length < 2) {
        errors.push(`El formato '${p.formato}' exige al menos 2 opciones reales; se encontraron ${p.opciones.length}.`);
      }
      for (let i = 0; i < p.opciones.length; i++) {
        const op = p.opciones[i];
        if (!op || typeof op !== 'object') {
          errors.push(`La opción en el índice ${i} debe ser un objeto.`);
          continue;
        }
        if (typeof op.id !== 'string' || !op.id.trim()) {
          errors.push(`La opción en el índice ${i} carece de un 'id' no vacío.`);
        }
        if (typeof op.etiqueta !== 'string' || !op.etiqueta.trim()) {
          errors.push(`La opción en el índice ${i} carece de una 'etiqueta' no vacía.`);
        }
        if (op.efecto && typeof op.efecto === 'object') {
          if (op.efecto.estado !== undefined) {
            const estadosValidos = ['confirmed', 'rejected', 'deferred'];
            if (!estadosValidos.includes(op.efecto.estado)) {
              errors.push(`El estado de efecto '${op.efecto.estado}' en la opción '${op.id}' no es válido.`);
            }
          }
          if (op.efecto.accion !== undefined) {
            const accionesValidas: AccionOpcion[] = ['declarar_fuente', 'sin_documento', 'confirmar_resumen', 'corregir', 'definir_url'];
            if (!accionesValidas.includes(op.efecto.accion)) {
              errors.push(`La acción de efecto '${op.efecto.accion}' en la opción '${op.id}' no es válida.`);
            }
          }
        }
      }
    } else if (p.formato === 'abierta') {
      if (p.opciones.length !== 0) {
        errors.push(`El formato 'abierta' exige que 'opciones' esté vacío; se encontraron ${p.opciones.length}.`);
      }
    }

    // Como máximo una opción recomendada
    const recomendadas = p.opciones.filter((o) => o && typeof o === 'object' && o.recomendada === true);
    if (recomendadas.length > 1) {
      errors.push(`Como máximo una opción puede estar marcada como recomendada; se encontraron ${recomendadas.length}.`);
    }
  }

  // 4. permite_otra
  if (typeof p.permite_otra !== 'boolean') {
    errors.push("El campo 'permite_otra' debe ser booleano.");
  }

  // 5. registrar_con
  if (!p.registrar_con || typeof p.registrar_con !== 'object') {
    errors.push("El campo 'registrar_con' debe ser un objeto con 'tool' y 'campo'.");
  } else {
    if (typeof p.registrar_con.tool !== 'string' || !p.registrar_con.tool.trim()) {
      errors.push("El campo 'registrar_con.tool' debe ser una cadena no vacía.");
    }
    if (typeof p.registrar_con.campo !== 'string' || !p.registrar_con.campo.trim()) {
      errors.push("El campo 'registrar_con.campo' debe ser una cadena no vacía.");
    }
  }

  // 6. Texto en español, dirigido al usuario:
  // - sin ids de formulario
  // - sin selectores CSS
  // - sin id interno de vista ('default')
  // - sin frase "Deseas" ni preguntas de permiso
  if (typeof p.texto !== 'string' || !p.texto.trim()) {
    errors.push("El campo 'texto' es obligatorio y debe ser una cadena no vacía.");
  } else {
    const texto = p.texto;

    // Sin frase "Deseas" ni preguntas de permiso
    if (/\bdeseas?\b/i.test(texto) || /\bquieres?\b/i.test(texto) || /¿?\s*deseas/i.test(texto) || /¿?\s*quieres/i.test(texto)) {
      errors.push('El texto no debe contener preguntas de permiso ni la palabra "Deseas" o "Quieres".');
    }

    // Sin id interno de vista ('default')
    if (/\bdefault\b/i.test(texto)) {
      errors.push("El texto no debe exponer el id interno de vista ('default').");
    }

    // Sin ids de formulario (ej: form-login, form_123, id de form)
    if (/\bform[-_][a-zA-Z0-9_-]+/i.test(texto)) {
      errors.push('El texto no debe contener identificadores internos de formulario.');
    }

    // Sin selectores CSS
    if (/button:has-text|input\[name=|\.css-|#form-|#[a-zA-Z0-9_-]+\b.*selector/i.test(texto)) {
      errors.push('El texto no debe contener selectores CSS ni sintaxis de localización DOM.');
    }
  }

  // 7. render_texto si está presente
  if (p.render_texto !== undefined) {
    if (typeof p.render_texto !== 'string' || !p.render_texto.trim()) {
      errors.push("El campo 'render_texto' debe ser una cadena no vacía.");
    }
  }

  // 8. Seguimiento recursivo si existe
  if (p.seguimiento !== undefined && p.seguimiento !== null) {
    const resSeg = validarPregunta(p.seguimiento);
    if (!resSeg.valid) {
      errors.push(...resSeg.errors.map((e) => `[seguimiento] ${e}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Genera una representación plana y numerada de la pregunta con indicador
 * de respuesta libre o de opciones, lista para clientes sin ask_question.
 */
export function generarRenderTexto(p: {
  texto: string;
  formato: FormatoPregunta;
  opciones?: Opcion[];
  permite_otra?: boolean;
}): string {
  const cleanTexto = (p.texto || '').trim();
  const lineas: string[] = [cleanTexto];

  if (p.formato === 'abierta') {
    lineas.push('');
    lineas.push('(Escribe tu respuesta libremente)');
    return lineas.join('\n');
  }

  const ops = p.opciones ?? [];
  if (ops.length > 0) {
    lineas.push('');
    ops.forEach((op, idx) => {
      const rec = op.recomendada ? ' [Recomendada]' : '';
      lineas.push(`${idx + 1}. ${op.etiqueta}${rec}`);
    });
  }

  lineas.push('');
  if (p.permite_otra) {
    lineas.push('(Responde con el número de tu opción o escribe una respuesta libre)');
  } else {
    lineas.push('(Responde con el número de tu opción elegida)');
  }

  return lineas.join('\n');
}

/**
 * Sanitiza una cadena asegurando que todo texto proveniente de fuentes
 * no confiables (DOM, package.json, PRD, nombres de archivo) quede libre
 * de inyecciones y caracteres no aptos.
 */
export function sanitizeTextoOpcion(raw: string | undefined | null): string {
  return sanitizeDomString(raw);
}

export interface PreguntaInvalidaError {
  status: 'error';
  code: 'pregunta_invalida';
  mensaje: string;
  detalles: string[];
}

export function isPreguntaInvalidaError(val: unknown): val is PreguntaInvalidaError {
  return (
    typeof val === 'object' &&
    val !== null &&
    (val as PreguntaInvalidaError).status === 'error' &&
    (val as PreguntaInvalidaError).code === 'pregunta_invalida'
  );
}

/**
 * Valida una pregunta aplicando validarPregunta y las reglas de emisión de C1:
 * - Formato abierta (con opciones vacías), o al menos 2 opciones distintas.
 * - Ninguna opción con etiqueta tautológica.
 * - Ningún texto que empiece por "Deseas".
 */
export function validarEmisionPregunta(pregunta: unknown): ValidacionPreguntaResult {
  const baseRes = validarPregunta(pregunta);
  const errors = [...baseRes.errors];

  if (!pregunta || typeof pregunta !== 'object') {
    return { valid: false, errors };
  }

  const p = pregunta as Partial<Pregunta>;

  // Formato abierta, o al menos 2 opciones distintas
  if (p.formato !== 'abierta') {
    if (!Array.isArray(p.opciones) || p.opciones.length < 2) {
      if (!errors.some((e) => e.includes('al menos 2 opciones'))) {
        errors.push(`El formato '${p.formato}' exige al menos 2 opciones reales y distintas.`);
      }
    } else {
      const ids = new Set<string>();
      const labels = new Set<string>();
      for (let i = 0; i < p.opciones.length; i++) {
        const op = p.opciones[i];
        if (op && typeof op === 'object') {
          const opId = typeof op.id === 'string' ? op.id.trim() : '';
          if (opId) {
            if (ids.has(opId)) {
              errors.push(`Las opciones deben ser distintas: id duplicado '${opId}'.`);
            }
            ids.add(opId);
          }

          const opEtiqueta = typeof op.etiqueta === 'string' ? op.etiqueta.trim() : '';
          const normLabel = normalizeRuleText(opEtiqueta);
          if (normLabel) {
            if (labels.has(normLabel)) {
              errors.push(`Las opciones deben ser distintas: etiqueta duplicada '${opEtiqueta}'.`);
            }
            labels.add(normLabel);
          }

          // Ninguna opción con etiqueta tautológica
          if (isTautologicalOptionLabel(opEtiqueta)) {
            errors.push(`La opción '${op.id}' contiene una etiqueta tautológica no permitida: '${opEtiqueta}'.`);
          }
        }
      }
    }
  }

  // Ningún texto que empiece por "Deseas"
  if (typeof p.texto === 'string' && /^¿?\s*deseas\b/i.test(p.texto.trim())) {
    if (!errors.some((e) => e.includes('Deseas'))) {
      errors.push('El texto no debe empezar por "Deseas".');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Guardia de emisión (C1): pasa toda pregunta antes de devolverse al cliente.
 * En tests lanza Error si la pregunta es inválida.
 * En producción devuelve el error estructurado PreguntaInvalidaError.
 */
export function guardPregunta<T extends Pregunta = Pregunta>(
  pregunta: T
): T | PreguntaInvalidaError {
  const res = validarEmisionPregunta(pregunta);
  if (!res.valid) {
    const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
    const isTest = Boolean(
      proc &&
        (proc.env?.NODE_ENV === 'test' ||
          proc.env?.VITEST !== undefined ||
          proc.env?.npm_lifecycle_event === 'test')
    );

    if (isTest) {
      throw new Error(`[guardPregunta] Pregunta inválida: ${res.errors.join('; ')}`);
    }

    return {
      status: 'error',
      code: 'pregunta_invalida',
      mensaje: 'La pregunta no cumple las reglas de emisión y fue bloqueada para proteger la integridad.',
      detalles: res.errors,
    };
  }

  return pregunta;
}

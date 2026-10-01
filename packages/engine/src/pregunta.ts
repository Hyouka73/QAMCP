import { sanitizeDomString } from './interview-engine.js';

export type FormatoPregunta = 'una_opcion' | 'multiple' | 'abierta';

export interface Opcion {
  id: string;
  etiqueta: string;
  recomendada?: boolean;
  efecto?: {
    estado?: 'confirmed' | 'rejected' | 'deferred';
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

  // 7. Seguimiento recursivo si existe
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
 * Sanitiza una cadena asegurando que todo texto proveniente de fuentes
 * no confiables (DOM, package.json, PRD, nombres de archivo) quede libre
 * de inyecciones y caracteres no aptos.
 */
export function sanitizeTextoOpcion(raw: string | undefined | null): string {
  return sanitizeDomString(raw);
}

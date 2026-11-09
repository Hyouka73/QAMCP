import { createHash } from 'node:crypto';

import type { ModuleSelectors } from '@qap/engine';
import type { RuleEntry, TCCase, TCStep } from '@qap/shared';

/**
 * Genera un UUID v4 determinista a partir de una cadena semilla.
 */
function generateDeterministicUuid(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  const timeLow = hash.substring(0, 8);
  const timeMid = hash.substring(8, 12);
  const timeHighAndVersion = `4${hash.substring(13, 16)}`;
  const clockSeq = `a${hash.substring(17, 20)}`;
  const node = hash.substring(20, 32);

  return `${timeLow}-${timeMid}-${timeHighAndVersion}-${clockSeq}-${node}`;
}

/** Categorías de regla sobre las que aplica BVA (enum real de rules.schema.json + legacy sin categoría). */
const BVA_CATEGORIES: ReadonlyArray<string | undefined> = ['campo', 'dato', 'error', undefined];

/** Procedencias acreditadas para reglas BVA (excluye inferencias no validadas como 'agent' o 'dom'). */
const TRUSTED_RULE_SOURCES: ReadonlySet<string | undefined> = new Set([
  'user_confirmed',
  'prd',
  'user_text',
  'user',
  'doc',
  undefined,
]);

/** Tipos de frontera. */
type BoundaryType = 'under_min' | 'min' | 'nominal' | 'max' | 'over_max';

interface Boundary {
  type: BoundaryType;
  value: number;
  valid: boolean;
}

interface Bounds {
  min?: number;
  max?: number;
  step?: number;
  valueType?: 'number' | 'string';
  hasConflict?: boolean;
  conflictReason?: string;
}

interface FieldGroup {
  field: string;
  rules: RuleEntry[];
  bounds: Bounds;
  hasConflict: boolean;
  conflictReason?: string;
}

// Token numérico estricto (entero, decimal o notación científica completa)
const STRICT_NUMBER_TOKEN = /^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i;

// Nivel 1: atributos del DOM en rule.evidence y rule.id:
// Consume el token completo del atributo (entre comillas o hasta delimitador) para impedir truncación de prefijos.
const ATTR_VALUE_TOKEN = '(?:"([^"]*)"|\'([^\']*)\'|([^\\s,;"\']+?)(?=[.;,]?(?:\\s|$)))';
const ATTR_LEN_MIN = new RegExp(`(?:^|[\\s,;.])\\bminlength\\b\\s*[=:]\\s*${ATTR_VALUE_TOKEN}`, 'gi');
const ATTR_LEN_MAX = new RegExp(`(?:^|[\\s,;.])\\bmaxlength\\b\\s*[=:]\\s*${ATTR_VALUE_TOKEN}`, 'gi');
const ATTR_NUM_MIN = new RegExp(`(?:^|[\\s,;.])\\bmin\\b\\s*[=:]\\s*${ATTR_VALUE_TOKEN}`, 'gi');
const ATTR_NUM_MAX = new RegExp(`(?:^|[\\s,;.])\\bmax\\b\\s*[=:]\\s*${ATTR_VALUE_TOKEN}`, 'gi');
const ATTR_NUM_STEP = new RegExp(`(?:^|[\\s,;.])\\bstep\\b\\s*[=:]\\s*${ATTR_VALUE_TOKEN}`, 'gi');

// Nivel 2: texto libre (description y condition):
// Unifica el token numérico completo y su unidad opcional (caracteres/letras) sin retroceso parcial sobre dígitos.
const TEXT_RANGE_PHRASE =
  /\bentre\s+([+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?|[+-]?\d[^\s,;:!?()[\]"']*?)(?=[.,;:!?)\]]*(?:\s|$)|\s*(?:caracteres?|letras?)\b)(?:\s*(caracteres?|letras?)\b)?\s+y\s+([+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?|[+-]?\d[^\s,;:!?()[\]"']*?)(?=[.,;:!?)\]]*(?:\s|$)|\s*(?:caracteres?|letras?)\b)(?:\s*(caracteres?|letras?)\b)?/gi;
const TEXT_MIN_PHRASE =
  /\bm[ií]nim[oa]\s*(?:de\b\s*)?([+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?|[+-]?\d[^\s,;:!?()[\]"']*?)(?=[.,;:!?)\]]*(?:\s|$)|\s*(?:caracteres?|letras?)\b)(?:\s*(caracteres?|letras?)\b)?/gi;
const TEXT_MAX_PHRASE =
  /\bm[aá]xim[oa]\s*(?:de\b\s*)?([+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?|[+-]?\d[^\s,;:!?()[\]"']*?)(?=[.,;:!?)\]]*(?:\s|$)|\s*(?:caracteres?|letras?)\b)(?:\s*(caracteres?|letras?)\b)?/gi;

function parseExtractedNumber(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (!STRICT_NUMBER_TOKEN.test(trimmed)) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isStepAligned(distance: number, step: number): boolean {
  if (step <= 0 || !Number.isFinite(distance) || !Number.isFinite(step)) return false;
  const quotient = distance / step;
  return Math.abs(quotient - Math.round(quotient)) < 1e-9;
}

function countDecimals(n: number | undefined): number {
  if (n === undefined || !Number.isFinite(n) || Number.isInteger(n)) return 0;
  const str = String(n).toLowerCase();
  if (str.includes('e-')) {
    const [mantissa = '', expStr = '0'] = str.split('e-');
    const mantissaDecimals = mantissa.split('.')[1]?.length ?? 0;
    const exp = parseInt(expStr, 10);
    return Number.isFinite(exp) ? mantissaDecimals + exp : mantissaDecimals;
  }
  const parts = str.split('.');
  return parts[1]?.length ?? 0;
}

function roundToPrecision(n: number, decimals: number): number {
  if (decimals <= 0) return Math.round(n);
  const factor = Math.pow(10, Math.min(decimals, 12));
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

/**
 * Combina dos candidatos de Bounds detectando contradicciones internas
 * (p. ej. evidence min="10" frente a description "mínimo de 18", o múltiples min en la misma fuente).
 */
function mergeCandidateBounds(base: Bounds, incoming: Bounds): Bounds {
  if (incoming.hasConflict) {
    return {
      ...base,
      ...incoming,
      hasConflict: true,
      conflictReason: incoming.conflictReason ?? base.conflictReason ?? 'Contradicción interna en regla',
    };
  }
  if (incoming.min === undefined && incoming.max === undefined && incoming.step === undefined) {
    return base;
  }
  if (base.min === undefined && base.max === undefined && base.step === undefined && !base.hasConflict) {
    return { ...incoming };
  }

  const merged: Bounds = { ...base };

  if (incoming.valueType !== undefined) {
    if (merged.valueType !== undefined && merged.valueType !== incoming.valueType) {
      merged.hasConflict = true;
      merged.conflictReason = `Contradicción interna de tipo: ${merged.valueType} vs ${incoming.valueType}`;
    } else {
      merged.valueType = incoming.valueType;
    }
  }

  if (incoming.min !== undefined) {
    if (merged.min !== undefined && merged.min !== incoming.min) {
      merged.hasConflict = true;
      merged.conflictReason = `Contradicción interna en min: ${merged.min} vs ${incoming.min}`;
    } else {
      merged.min = incoming.min;
    }
  }

  if (incoming.max !== undefined) {
    if (merged.max !== undefined && merged.max !== incoming.max) {
      merged.hasConflict = true;
      merged.conflictReason = `Contradicción interna en max: ${merged.max} vs ${incoming.max}`;
    } else {
      merged.max = incoming.max;
    }
  }

  if (incoming.step !== undefined) {
    if (merged.step !== undefined && merged.step !== incoming.step) {
      merged.hasConflict = true;
      merged.conflictReason = `Contradicción interna en step: ${merged.step} vs ${incoming.step}`;
    } else {
      merged.step = incoming.step;
    }
  }

  return merged;
}

function extractAllAttrTokens(text: string, pattern: RegExp): string[] {
  const regex = new RegExp(pattern.source, pattern.flags);
  const tokens: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1] ?? match[2] ?? match[3] ?? '';
    tokens.push(raw);
  }
  return tokens;
}

/**
 * Límites que aporta una sola regla confirmada:
 * Distingue límites numéricos (enteros, decimales, exponenciales) de longitud de cadena (minlength/maxlength).
 * Extrae todas las coincidencias de cada fuente en Nivel 1 (id, evidence) y Nivel 2 (description, condition)
 * y las fusiona detectando cualquier contradicción interna o token malformado.
 */
function extractRuleBounds(rule: RuleEntry): Bounds {
  if (rule.status !== 'confirmed' || !TRUSTED_RULE_SOURCES.has(rule.source)) {
    return {};
  }

  let combined: Bounds = {};

  const level1Sources = [rule.id, rule.evidence].filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );

  for (const source of level1Sources) {
    // 1. Longitud de cadena desde atributos DOM (minlength / maxlength)
    for (const raw of extractAllAttrTokens(source, ATTR_LEN_MIN)) {
      const val = parseExtractedNumber(raw);
      if (val === undefined || !Number.isInteger(val) || val < 0) {
        return { hasConflict: true, conflictReason: 'Longitud mínima de cadena inválida en atributo DOM' };
      }
      combined = mergeCandidateBounds(combined, { min: val, valueType: 'string' });
    }

    for (const raw of extractAllAttrTokens(source, ATTR_LEN_MAX)) {
      const val = parseExtractedNumber(raw);
      if (val === undefined || !Number.isInteger(val) || val < 0) {
        return { hasConflict: true, conflictReason: 'Longitud máxima de cadena inválida en atributo DOM' };
      }
      combined = mergeCandidateBounds(combined, { max: val, valueType: 'string' });
    }

    // 2. Límites numéricos desde atributos DOM (min / max / step)
    for (const raw of extractAllAttrTokens(source, ATTR_NUM_MIN)) {
      const val = parseExtractedNumber(raw);
      if (val === undefined) {
        return { hasConflict: true, conflictReason: 'Valor numérico min inválido en atributo DOM' };
      }
      combined = mergeCandidateBounds(combined, { min: val, valueType: 'number' });
    }

    for (const raw of extractAllAttrTokens(source, ATTR_NUM_MAX)) {
      const val = parseExtractedNumber(raw);
      if (val === undefined) {
        return { hasConflict: true, conflictReason: 'Valor numérico max inválido en atributo DOM' };
      }
      combined = mergeCandidateBounds(combined, { max: val, valueType: 'number' });
    }

    for (const raw of extractAllAttrTokens(source, ATTR_NUM_STEP)) {
      const val = parseExtractedNumber(raw);
      if (val === undefined || val <= 0) {
        return { hasConflict: true, conflictReason: 'Valor numérico step inválido en atributo DOM' };
      }
      combined = mergeCandidateBounds(combined, { step: val, valueType: 'number' });
    }
  }

  // 3. Nivel 2: texto libre en description y condition (todas las apariciones por fuente)
  const level2Sources = [rule.description, rule.condition].filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );

  for (const source of level2Sources) {
    const rangeRegex = new RegExp(TEXT_RANGE_PHRASE.source, TEXT_RANGE_PHRASE.flags);
    let match: RegExpExecArray | null;
    while ((match = rangeRegex.exec(source)) !== null) {
      const minVal = parseExtractedNumber(match[1]);
      const maxVal = parseExtractedNumber(match[3]);
      const isString = Boolean(match[2] || match[4]);
      if (minVal === undefined || maxVal === undefined) {
        return { hasConflict: true, conflictReason: 'Rango malformado en texto libre' };
      }
      if (isString) {
        if (!Number.isInteger(minVal) || minVal < 0 || !Number.isInteger(maxVal) || maxVal < 0) {
          return { hasConflict: true, conflictReason: 'Longitud de cadena inválida en texto (negativa o decimal)' };
        }
        combined = mergeCandidateBounds(combined, { min: minVal, max: maxVal, valueType: 'string' });
      } else {
        combined = mergeCandidateBounds(combined, { min: minVal, max: maxVal, valueType: 'number' });
      }
    }

    const minRegex = new RegExp(TEXT_MIN_PHRASE.source, TEXT_MIN_PHRASE.flags);
    while ((match = minRegex.exec(source)) !== null) {
      const minVal = parseExtractedNumber(match[1]);
      const isString = Boolean(match[2]);
      if (minVal === undefined) {
        return { hasConflict: true, conflictReason: 'Límite mínimo malformado en texto libre' };
      }
      if (isString) {
        if (!Number.isInteger(minVal) || minVal < 0) {
          return { hasConflict: true, conflictReason: 'Longitud mínima de cadena inválida en texto' };
        }
        combined = mergeCandidateBounds(combined, { min: minVal, valueType: 'string' });
      } else {
        combined = mergeCandidateBounds(combined, { min: minVal, valueType: 'number' });
      }
    }

    const maxRegex = new RegExp(TEXT_MAX_PHRASE.source, TEXT_MAX_PHRASE.flags);
    while ((match = maxRegex.exec(source)) !== null) {
      const maxVal = parseExtractedNumber(match[1]);
      const isString = Boolean(match[2]);
      if (maxVal === undefined) {
        return { hasConflict: true, conflictReason: 'Límite máximo malformado en texto libre' };
      }
      if (isString) {
        if (!Number.isInteger(maxVal) || maxVal < 0) {
          return { hasConflict: true, conflictReason: 'Longitud máxima de cadena inválida en texto' };
        }
        combined = mergeCandidateBounds(combined, { max: maxVal, valueType: 'string' });
      } else {
        combined = mergeCandidateBounds(combined, { max: maxVal, valueType: 'number' });
      }
    }
  }

  return combined;
}

/**
 * Agrupa las reglas por rule.field y combina sus límites.
 * Detecta y registra contradicciones (internas en una regla o entre reglas del mismo campo).
 */
function groupRulesByField(rules: RuleEntry[]): FieldGroup[] {
  const groups = new Map<string, FieldGroup>();

  for (const rule of rules) {
    const field = rule.field;
    if (!field) continue;

    const group = groups.get(field) ?? {
      field,
      rules: [],
      bounds: {},
      hasConflict: false,
    };

    const ruleBounds = extractRuleBounds(rule);
    if (ruleBounds.hasConflict) {
      group.hasConflict = true;
      group.conflictReason = ruleBounds.conflictReason ?? 'Contradicción interna en regla';
      group.rules.push(rule);
      groups.set(field, group);
      continue;
    }

    if (ruleBounds.min === undefined && ruleBounds.max === undefined) {
      continue;
    }

    group.rules.push(rule);

    // Detección de conflicto de tipo (numérico vs longitud de cadena)
    if (ruleBounds.valueType !== undefined) {
      if (group.bounds.valueType !== undefined && group.bounds.valueType !== ruleBounds.valueType) {
        group.hasConflict = true;
        group.conflictReason = `Tipos de valor contradictorios: ${group.bounds.valueType} vs ${ruleBounds.valueType}`;
      } else {
        group.bounds.valueType = ruleBounds.valueType;
      }
    }

    // Detección de conflicto en límite inferior (min)
    if (ruleBounds.min !== undefined) {
      if (group.bounds.min !== undefined && group.bounds.min !== ruleBounds.min) {
        group.hasConflict = true;
        group.conflictReason = `Valores min contradictorios: ${group.bounds.min} vs ${ruleBounds.min}`;
      } else {
        group.bounds.min = ruleBounds.min;
      }
    }

    // Detección de conflicto en límite superior (max)
    if (ruleBounds.max !== undefined) {
      if (group.bounds.max !== undefined && group.bounds.max !== ruleBounds.max) {
        group.hasConflict = true;
        group.conflictReason = `Valores max contradictorios: ${group.bounds.max} vs ${ruleBounds.max}`;
      } else {
        group.bounds.max = ruleBounds.max;
      }
    }

    // Detección de conflicto en step
    if (ruleBounds.step !== undefined) {
      if (group.bounds.step !== undefined && group.bounds.step !== ruleBounds.step) {
        group.hasConflict = true;
        group.conflictReason = `Valores step contradictorios: ${group.bounds.step} vs ${ruleBounds.step}`;
      } else {
        group.bounds.step = ruleBounds.step;
      }
    }

    groups.set(field, group);
  }

  // Validación posterior de consistencia matemática (min <= max, longitudes no negativas y alineación con step)
  for (const group of groups.values()) {
    if (group.bounds.valueType === 'string') {
      if (
        (group.bounds.min !== undefined && (group.bounds.min < 0 || !Number.isInteger(group.bounds.min))) ||
        (group.bounds.max !== undefined && (group.bounds.max < 0 || !Number.isInteger(group.bounds.max)))
      ) {
        group.hasConflict = true;
        group.conflictReason = 'Rango de longitud de cadena inválido (negativo o decimal)';
      }
    }
    if (group.bounds.min !== undefined && group.bounds.max !== undefined) {
      if (group.bounds.min > group.bounds.max) {
        group.hasConflict = true;
        group.conflictReason = `Rango invertido: min (${group.bounds.min}) > max (${group.bounds.max})`;
      }
    }
    if (group.bounds.valueType === 'number' && group.bounds.step !== undefined) {
      if (group.bounds.step <= 0) {
        group.hasConflict = true;
        group.conflictReason = `Valor step inválido (${group.bounds.step})`;
      } else if (group.bounds.min !== undefined && group.bounds.max !== undefined) {
        if (!isStepAligned(group.bounds.max - group.bounds.min, group.bounds.step)) {
          group.hasConflict = true;
          group.conflictReason = `Rango [${group.bounds.min}, ${group.bounds.max}] incompatible con step (${group.bounds.step})`;
        }
      } else if (group.bounds.min === undefined && group.bounds.max !== undefined) {
        if (!isStepAligned(group.bounds.max, group.bounds.step)) {
          group.hasConflict = true;
          group.conflictReason = `Límite max (${group.bounds.max}) incompatible con step (${group.bounds.step})`;
        }
      }
    }
  }

  return [...groups.values()];
}

/**
 * Construye los valores de frontera sin inventar límites artificiales,
 * preservando precisión decimal, alineando el valor nominal a la retícula de step
 * y omitiendo fronteras imposibles (ej. longitud < 0).
 */
function buildBoundaries(bounds: Bounds): Boundary[] {
  const { min, max, step, valueType } = bounds;
  if (min === undefined && max === undefined) {
    return [];
  }
  if (min !== undefined && max !== undefined && min > max) {
    return [];
  }

  if (valueType === 'string') {
    if (
      (min !== undefined && (min < 0 || !Number.isInteger(min))) ||
      (max !== undefined && (max < 0 || !Number.isInteger(max)))
    ) {
      return [];
    }

    // Rango bilateral de longitud de cadena
    if (min !== undefined && max !== undefined) {
      const nominal = Math.floor((min + max) / 2);
      const result: Boundary[] = [];
      if (min > 0) {
        result.push({ type: 'under_min', value: min - 1, valid: false });
      }
      result.push(
        { type: 'min', value: min, valid: true },
        { type: 'nominal', value: nominal, valid: true },
        { type: 'max', value: max, valid: true },
        { type: 'over_max', value: max + 1, valid: false }
      );
      return result;
    }

    // Rango unilateral inferior de longitud (solo minlength)
    if (min !== undefined) {
      const result: Boundary[] = [];
      if (min > 0) {
        result.push({ type: 'under_min', value: min - 1, valid: false });
      }
      result.push(
        { type: 'min', value: min, valid: true },
        { type: 'nominal', value: min + 1, valid: true }
      );
      return result;
    }

    // Rango unilateral superior de longitud (solo maxlength)
    if (max !== undefined) {
      const result: Boundary[] = [];
      if (max > 0) {
        result.push({ type: 'nominal', value: max - 1, valid: true });
      }
      result.push(
        { type: 'max', value: max, valid: true },
        { type: 'over_max', value: max + 1, valid: false }
      );
      return result;
    }

    return [];
  }

  // Rango numérico (entero, decimal o notación exponencial)
  const decimals = Math.max(countDecimals(min), countDecimals(max), countDecimals(step));
  const delta = step && step > 0 ? step : decimals > 0 ? roundToPrecision(Math.pow(10, -decimals), decimals) : 1;

  // Rango bilateral numérico
  if (min !== undefined && max !== undefined) {
    let nominal: number;
    if (step !== undefined && step > 0) {
      if (!isStepAligned(max - min, step)) {
        return [];
      }
      const totalSteps = Math.round((max - min) / step);
      const midSteps = Math.floor(totalSteps / 2);
      nominal = roundToPrecision(min + midSteps * step, decimals);
    } else if (decimals > 0) {
      nominal = roundToPrecision((min + max) / 2, Math.max(decimals, countDecimals((min + max) / 2)));
    } else {
      nominal = Math.floor((min + max) / 2);
    }

    return [
      { type: 'under_min', value: roundToPrecision(min - delta, decimals), valid: false },
      { type: 'min', value: min, valid: true },
      { type: 'nominal', value: nominal, valid: true },
      { type: 'max', value: max, valid: true },
      { type: 'over_max', value: roundToPrecision(max + delta, decimals), valid: false },
    ];
  }

  // Rango unilateral inferior (solo min confirmado)
  if (min !== undefined) {
    return [
      { type: 'under_min', value: roundToPrecision(min - delta, decimals), valid: false },
      { type: 'min', value: min, valid: true },
      { type: 'nominal', value: roundToPrecision(min + delta, decimals), valid: true },
    ];
  }

  // Rango unilateral superior (solo max confirmado)
  if (max !== undefined) {
    return [
      { type: 'nominal', value: roundToPrecision(max - delta, decimals), valid: true },
      { type: 'max', value: max, valid: true },
      { type: 'over_max', value: roundToPrecision(max + delta, decimals), valid: false },
    ];
  }

  return [];
}

function readSelector(entry: unknown): string | undefined {
  if (typeof entry === 'string' && entry.trim().length > 0) return entry.trim();
  if (entry && typeof entry === 'object') {
    const nested = (entry as { selector?: unknown }).selector;
    if (typeof nested === 'string' && nested.trim().length > 0) return nested.trim();
  }
  return undefined;
}

/**
 * Resuelve el selector CSS del campo estrictamente desde ModuleSelectors.
 * Prohibido recurrir a un fallback ciego '#${field}'.
 */
function resolveFieldSelector(selectors: ModuleSelectors | undefined, field: string): string | undefined {
  if (!selectors || !field) return undefined;
  const raw = selectors as unknown as Record<string, unknown>;
  const nestedMap = raw.selectors as Record<string, unknown> | undefined;

  return readSelector(nestedMap?.[field]) ?? readSelector(raw[field]);
}

/**
 * Resuelve el selector del botón submit estrictamente desde ModuleSelectors.
 * Prohibido usar selectores genéricos hardcodeados si no están acreditados.
 */
function resolveSubmitSelector(selectors: ModuleSelectors | undefined): string | undefined {
  if (!selectors) return undefined;
  const raw = selectors as unknown as Record<string, unknown>;
  const nestedMap = raw.selectors as Record<string, unknown> | undefined;

  return (
    readSelector(nestedMap?.submit) ??
    readSelector(nestedMap?.submitButton) ??
    readSelector(nestedMap?.submit_button) ??
    readSelector(nestedMap?.['submit-btn']) ??
    readSelector(raw.submit) ??
    readSelector(raw.submitButton) ??
    readSelector(raw.submit_button) ??
    readSelector(raw['submit-btn'])
  );
}

/**
 * Resuelve el oráculo de éxito estrictamente desde ModuleSelectors.
 */
function resolveSuccessSelector(selectors: ModuleSelectors | undefined, field: string): string | undefined {
  if (!selectors) return undefined;
  const raw = selectors as unknown as Record<string, unknown>;
  const nestedMap = raw.selectors as Record<string, unknown> | undefined;

  return (
    readSelector(nestedMap?.[`${field}_success`]) ??
    readSelector(nestedMap?.[`${field}Success`]) ??
    readSelector(nestedMap?.success) ??
    readSelector(nestedMap?.success_message) ??
    readSelector(nestedMap?.successMessage) ??
    readSelector(nestedMap?.['success-message']) ??
    readSelector(raw[`${field}_success`]) ??
    readSelector(raw[`${field}Success`]) ??
    readSelector(raw.success) ??
    readSelector(raw.success_message) ??
    readSelector(raw.successMessage) ??
    readSelector(raw['success-message'])
  );
}

/**
 * Resuelve el oráculo de error estrictamente desde ModuleSelectors.
 */
function resolveErrorSelector(selectors: ModuleSelectors | undefined, field: string): string | undefined {
  if (!selectors) return undefined;
  const raw = selectors as unknown as Record<string, unknown>;
  const nestedMap = raw.selectors as Record<string, unknown> | undefined;

  return (
    readSelector(nestedMap?.[`${field}_error`]) ??
    readSelector(nestedMap?.[`${field}Error`]) ??
    readSelector(nestedMap?.error) ??
    readSelector(nestedMap?.error_message) ??
    readSelector(nestedMap?.errorMessage) ??
    readSelector(nestedMap?.['error-message']) ??
    readSelector(raw[`${field}_error`]) ??
    readSelector(raw[`${field}Error`]) ??
    readSelector(raw.error) ??
    readSelector(raw.error_message) ??
    readSelector(raw.errorMessage) ??
    readSelector(raw['error-message'])
  );
}

/**
 * Genera el valor de prueba a rellenar y valida que pertenezca al dominio representable:
 * - Para longitud de cadena: requiere un entero >= 0 ('a'.repeat(length)); retorna null si es < 0.
 * - Para numérico: genera String(boundary.value).
 */
function generateBoundaryValue(boundary: Boundary, valueType?: 'number' | 'string'): string | null {
  if (valueType === 'string') {
    if (!Number.isInteger(boundary.value) || boundary.value < 0) {
      return null;
    }
    return 'a'.repeat(boundary.value);
  }
  return String(boundary.value);
}

/**
 * Verifica después de materializar el valor que el resultado esperado (valid/invalid)
 * corresponde genuinamente al valor real frente a los límites declarados (min, max y step).
 */
function matchesExpectedValidity(fillValue: string, bounds: Bounds, expectedValid: boolean): boolean {
  const { min, max, step, valueType } = bounds;
  const metric = valueType === 'string' ? fillValue.length : Number(fillValue);
  if (!Number.isFinite(metric)) return false;

  const withinRange =
    (min === undefined || metric >= min) &&
    (max === undefined || metric <= max);

  let alignedWithStep = true;
  if (valueType !== 'string' && step !== undefined && step > 0) {
    const stepBase = min ?? 0;
    alignedWithStep = isStepAligned(metric - stepBase, step);
  }

  const isActuallyValid = withinRange && alignedWithStep;
  return isActuallyValid === expectedValid;
}

/**
 * Genera casos de prueba de análisis de valores límite (BVA) para las reglas
 * confirmadas con límites verificables.
 *
 * Garantías:
 * 1. No inventa límites artificiales (soporta unilaterales y fail-closed).
 * 2. Preserva números decimales exactos y distingue longitud de cadena ('a'.repeat(length)).
 * 3. No emite fronteras fuera del dominio representable (ej. longitud < 0) ni oráculos contradictorios para el mismo valor.
 * 4. Resuelve selectores estrictamente de ModuleSelectors (sin fallback genérico).
 * 5. Oráculo de error visible para casos inválidos (NUNCA not_visible).
 * 6. Detección y rechazo fail-closed de contradicciones internas o entre reglas.
 * 7. Emite únicamente casos ejecutables con procedencia y oráculos acreditados.
 */
export function generateBvaCases(
  moduleName: string,
  rules: RuleEntry[],
  selectors: ModuleSelectors,
  baseRoute?: string
): TCCase[] {
  const bvaCases: TCCase[] = [];
  const route = baseRoute ?? '/';

  // Validación estricta del selector de envío
  const submitSelector = resolveSubmitSelector(selectors);
  if (!submitSelector) {
    return [];
  }

  const targetRules = rules.filter(
    (rule) =>
      rule.status === 'confirmed' &&
      TRUSTED_RULE_SOURCES.has(rule.source) &&
      BVA_CATEGORIES.includes(rule.category)
  );

  for (const group of groupRulesByField(targetRules)) {
    // Si hay contradicción de reglas o no hay límites, omitir fail-closed
    if (group.hasConflict) continue;
    const { min, max, valueType } = group.bounds;
    if (min === undefined && max === undefined) continue;

    // Selector del campo obligatorio desde ModuleSelectors
    const fieldSelector = resolveFieldSelector(selectors, group.field);
    if (!fieldSelector) continue;

    const sourceRule = group.rules[0];
    if (!sourceRule) continue;

    const successSelector = resolveSuccessSelector(selectors, group.field);
    const errorSelector = resolveErrorSelector(selectors, group.field);

    const boundaries = buildBoundaries(group.bounds);
    const emittedOutcomeByValue = new Map<string, boolean>();

    for (const boundary of boundaries) {
      // Oráculo verificado obligatorio según el resultado esperado
      const oracleSelector = boundary.valid ? successSelector : errorSelector;
      if (!oracleSelector) {
        // No emitir casos sin oráculo acreditado
        continue;
      }

      const fillValue = generateBoundaryValue(boundary, valueType);
      if (fillValue === null) {
        continue;
      }

      // Validar que el valor materializado siga correspondiendo a la validez esperada
      if (!matchesExpectedValidity(fillValue, group.bounds, boundary.valid)) {
        continue;
      }

      // Impedir emitir oráculos opuestos para un mismo valor de entrada
      const previousValid = emittedOutcomeByValue.get(fillValue);
      if (previousValid !== undefined && previousValid !== boundary.valid) {
        continue;
      }
      emittedOutcomeByValue.set(fillValue, boundary.valid);

      const steps: TCStep[] = [
        { type: 'navigate', url: route },
        { type: 'fill', selector: fieldSelector, value: fillValue },
        { type: 'click', selector: submitSelector },
        {
          type: 'assert',
          selector: oracleSelector,
          // Para entradas inválidas, el selector de error DEBE ser visible (nunca not_visible)
          assertion_type: 'visible',
        },
      ];

      bvaCases.push({
        _version: '1',
        id: generateDeterministicUuid(`${moduleName}:bva:${sourceRule.id}:${boundary.type}`),
        name: `BVA_${sourceRule.id}_${boundary.type}`,
        title: `BVA Boundary Case for ${group.field}: ${boundary.type} (${boundary.value})`,
        priority: 'medium',
        sequence: 1,
        manually_edited: false,
        case_category: 'bva',
        source_rule_id: sourceRule.id,
        tags: ['bva', moduleName, group.field],
        steps,
      });
    }
  }

  return bvaCases;
}

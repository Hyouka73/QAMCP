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
  valueType?: 'number' | 'string';
}

interface FieldGroup {
  field: string;
  rules: RuleEntry[];
  bounds: Bounds;
  hasConflict: boolean;
  conflictReason?: string;
}

// Nivel 1: atributos del DOM en rule.evidence y rule.id:
// Distinguir explícitamente límites de longitud de cadena de límites numéricos
const ATTR_LEN_MIN = /(?:^|[\s,;.])\bminlength\s*[=:]\s*["']?(-?\d+)["']?/i;
const ATTR_LEN_MAX = /(?:^|[\s,;.])\bmaxlength\s*[=:]\s*["']?(-?\d+)["']?/i;
const ATTR_NUM_MIN = /(?:^|[\s,;.])\bmin\b\s*[=:]\s*["']?(-?\d+)["']?/i;
const ATTR_NUM_MAX = /(?:^|[\s,;.])\bmax\b\s*[=:]\s*["']?(-?\d+)["']?/i;

// Nivel 2: texto libre (description y condition)
const TEXT_LEN_RANGE = /entre\s+(-?\d+)\s+y\s+(-?\d+)\s*(?:caracteres|caracteres\b|letras)/i;
const TEXT_LEN_MIN = /m[ií]nimo\s*(?:de)?\s*(-?\d+)\s*(?:caracteres|caracteres\b|letras)/i;
const TEXT_LEN_MAX = /m[aá]ximo\s*(?:de)?\s*(-?\d+)\s*(?:caracteres|caracteres\b|letras)/i;

const TEXT_RANGE = /entre\s+(-?\d+)\s+y\s+(-?\d+)/i;
const TEXT_MIN = /m[ií]nimo\s*(?:de)?\s*(-?\d+)/i;
const TEXT_MAX = /m[aá]ximo\s*(?:de)?\s*(-?\d+)/i;

function firstNumber(text: string, pattern: RegExp): number | undefined {
  const match = pattern.exec(text);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Límites que aporta una sola regla confirmada:
 * Distingue límites numéricos de longitud de cadena (minlength/maxlength).
 * Solo procesa reglas con status 'confirmed'.
 */
function extractRuleBounds(rule: RuleEntry): Bounds {
  if (rule.status !== 'confirmed') {
    return {};
  }

  const level1 = `${rule.id} ${rule.evidence ?? ''}`;
  const level2 = `${rule.description} ${rule.condition ?? ''}`;

  // 1. Longitud de cadena desde evidencia/id DOM
  const lenMinL1 = firstNumber(level1, ATTR_LEN_MIN);
  const lenMaxL1 = firstNumber(level1, ATTR_LEN_MAX);
  if (lenMinL1 !== undefined || lenMaxL1 !== undefined) {
    return {
      min: lenMinL1,
      max: lenMaxL1,
      valueType: 'string',
    };
  }

  // 2. Límites numéricos desde evidencia/id DOM
  const numMinL1 = firstNumber(level1, ATTR_NUM_MIN);
  const numMaxL1 = firstNumber(level1, ATTR_NUM_MAX);
  if (numMinL1 !== undefined || numMaxL1 !== undefined) {
    return {
      min: numMinL1,
      max: numMaxL1,
      valueType: 'number',
    };
  }

  // 3. Longitud de cadena desde texto libre
  const lenRange = TEXT_LEN_RANGE.exec(level2);
  const lenMinL2 = lenRange ? parseInt(lenRange[1], 10) : firstNumber(level2, TEXT_LEN_MIN);
  const lenMaxL2 = lenRange ? parseInt(lenRange[2], 10) : firstNumber(level2, TEXT_LEN_MAX);
  if (lenMinL2 !== undefined || lenMaxL2 !== undefined) {
    return {
      min: lenMinL2,
      max: lenMaxL2,
      valueType: 'string',
    };
  }

  // 4. Rango numérico desde texto libre
  const numRange = TEXT_RANGE.exec(level2);
  const numMinL2 = numRange ? parseInt(numRange[1], 10) : firstNumber(level2, TEXT_MIN);
  const numMaxL2 = numRange ? parseInt(numRange[2], 10) : firstNumber(level2, TEXT_MAX);
  if (numMinL2 !== undefined || numMaxL2 !== undefined) {
    return {
      min: numMinL2,
      max: numMaxL2,
      valueType: 'number',
    };
  }

  return {};
}

/**
 * Agrupa las reglas por rule.field y combina sus límites.
 * Detecta y registra contradicciones (min > max, min contradictorio, max contradictorio o tipos incompatibles)
 * en lugar de silenciarlas con '??'.
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

    groups.set(field, group);
  }

  // Validación posterior de consistencia matemática (min <= max)
  for (const group of groups.values()) {
    if (group.bounds.min !== undefined && group.bounds.max !== undefined) {
      if (group.bounds.min > group.bounds.max) {
        group.hasConflict = true;
        group.conflictReason = `Rango invertido: min (${group.bounds.min}) > max (${group.bounds.max})`;
      }
    }
  }

  return [...groups.values()];
}

/**
 * Construye los valores de frontera sin inventar límites artificiales.
 * - Si existen min y max: 5 valores (min-1 [invalid], min, nominal, max, max+1 [invalid]).
 * - Si solo existe min: 3 valores unilaterales (min-1 [invalid], min [valid], min+1 [valid]).
 *   PROHIBIDO inventar max = min + 10.
 * - Si solo existe max: 3 valores unilaterales (max-1 [valid], max [valid], max+1 [invalid]).
 *   PROHIBIDO inventar min = max - 10.
 * - Si ninguno: retorna [] (fail-closed).
 */
function buildBoundaries(min: number | undefined, max: number | undefined): Boundary[] {
  if (min === undefined && max === undefined) {
    return [];
  }
  if (min !== undefined && max !== undefined && min > max) {
    return [];
  }

  // Rango bilateral completo
  if (min !== undefined && max !== undefined) {
    const nominal = Math.floor((min + max) / 2);
    return [
      { type: 'under_min', value: min - 1, valid: false },
      { type: 'min', value: min, valid: true },
      { type: 'nominal', value: nominal, valid: true },
      { type: 'max', value: max, valid: true },
      { type: 'over_max', value: max + 1, valid: false },
    ];
  }

  // Rango unilateral inferior (solo min confirmado)
  if (min !== undefined) {
    return [
      { type: 'under_min', value: min - 1, valid: false },
      { type: 'min', value: min, valid: true },
      { type: 'nominal', value: min + 1, valid: true },
    ];
  }

  // Rango unilateral superior (solo max confirmado)
  if (max !== undefined) {
    return [
      { type: 'nominal', value: max - 1, valid: true },
      { type: 'max', value: max, valid: true },
      { type: 'over_max', value: max + 1, valid: false },
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
 * Genera el valor de prueba a rellenar:
 * - Para longitud de cadena: genera una cadena con la longitud exacta requerida ('a'.repeat(length)).
 * - Para numérico: genera String(boundary.value).
 */
function generateBoundaryValue(boundary: Boundary, valueType?: 'number' | 'string'): string {
  if (valueType === 'string') {
    const length = Math.max(0, boundary.value);
    return 'a'.repeat(length);
  }
  return String(boundary.value);
}

/**
 * Genera casos de prueba de análisis de valores límite (BVA) para las reglas
 * confirmadas con límites verificables.
 *
 * Garantías:
 * 1. No inventa límites artificiales (soporta unilaterales y fail-closed).
 * 2. Distingue límites numéricos de longitud de cadena ('a'.repeat(length)).
 * 3. Resuelve selectores estrictamente de ModuleSelectors (sin fallback genérico).
 * 4. Oráculo de error visible para casos inválidos (NUNCA not_visible).
 * 5. Detección y rechazo fail-closed de reglas contradictorias.
 * 6. Emite únicamente casos ejecutables con oráculos acreditados.
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
    (rule) => rule.status === 'confirmed' && BVA_CATEGORIES.includes(rule.category)
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

    const boundaries = buildBoundaries(min, max);

    for (const boundary of boundaries) {
      // Oráculo verificado obligatorio según el resultado esperado
      const oracleSelector = boundary.valid ? successSelector : errorSelector;
      if (!oracleSelector) {
        // No emitir casos sin oráculo acreditado
        continue;
      }

      const fillValue = generateBoundaryValue(boundary, valueType);

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
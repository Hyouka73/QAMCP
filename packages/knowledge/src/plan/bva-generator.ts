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

/** Tipos de frontera, en el orden en que se generan los 5 casos. */
type BoundaryType = 'under_min' | 'min' | 'nominal' | 'max' | 'over_max';

interface Boundary {
  type: BoundaryType;
  value: number;
  valid: boolean;
}

interface Bounds {
  min?: number;
  max?: number;
}

interface FieldGroup {
  field: string;
  rules: RuleEntry[];
  bounds: Bounds;
}

// Nivel 1: atributos del DOM en rule.evidence y rule.id: min="X", max="Y", minlength="N", maxlength="M"
const ATTR_MIN = /(?:^|[\s,;.])(?:min|minlength)\s*[=:]\s*["']?(-?\d+)["']?/i;
const ATTR_MAX = /(?:^|[\s,;.])(?:max|maxlength)\s*[=:]\s*["']?(-?\d+)["']?/i;

// Nivel 2: texto libre (description y condition)
const TEXT_RANGE = /entre\s+(-?\d+)\s+y\s+(-?\d+)/i;
const TEXT_MIN = /m[ií]nimo\s*(?:de)?\s*(-?\d+)/i;
const TEXT_MAX = /m[aá]ximo\s*(?:de)?\s*(-?\d+)/i;

function firstNumber(text: string, pattern: RegExp): number | undefined {
  const match = pattern.exec(text);
  return match ? parseInt(match[1], 10) : undefined;
}

/** Límites que aporta una sola regla: Nivel 1 (evidence/id) y, si falta, Nivel 2 (description/condition). */
function extractRuleBounds(rule: RuleEntry): Bounds {
  const level1 = `${rule.id} ${rule.evidence ?? ''}`;
  const level2 = `${rule.description} ${rule.condition ?? ''}`;

  let min = firstNumber(level1, ATTR_MIN);
  let max = firstNumber(level1, ATTR_MAX);

  const range = TEXT_RANGE.exec(level2);
  if (min === undefined) min = range ? parseInt(range[1], 10) : firstNumber(level2, TEXT_MIN);
  if (max === undefined) max = range ? parseInt(range[2], 10) : firstNumber(level2, TEXT_MAX);

  return { min, max };
}

/**
 * Agrupa las reglas por rule.field y combina sus límites. generateDomHypotheses()
 * emite una regla por atributo (min="18" y max="99" son dos reglas del mismo campo),
 * así que el rango completo solo se obtiene combinando el grupo.
 */
function groupRulesByField(rules: RuleEntry[]): FieldGroup[] {
  const groups = new Map<string, FieldGroup>();

  for (const rule of rules) {
    const field = rule.field || 'default_field';
    const group = groups.get(field) ?? { field, rules: [], bounds: {} };
    const { min, max } = extractRuleBounds(rule);

    group.rules.push(rule);
    group.bounds.min = group.bounds.min ?? min;
    group.bounds.max = group.bounds.max ?? max;
    groups.set(field, group);
  }

  return [...groups.values()];
}

/**
 * Los 5 valores de frontera. Si el campo define un solo límite, el otro se
 * deriva con una holgura de 10 (suposición a confirmar con el equipo).
 */
function buildBoundaries(min: number | undefined, max: number | undefined): Boundary[] {
  const effectiveMin = min ?? (max !== undefined ? max - 10 : 0);
  const effectiveMax = max ?? effectiveMin + 10;
  const nominal = Math.floor((effectiveMin + effectiveMax) / 2);

  return [
    { type: 'under_min', value: effectiveMin - 1, valid: false },
    { type: 'min', value: effectiveMin, valid: true },
    { type: 'nominal', value: nominal, valid: true },
    { type: 'max', value: effectiveMax, valid: true },
    { type: 'over_max', value: effectiveMax + 1, valid: false },
  ];
}

function readSelector(entry: unknown): string | undefined {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    const nested = (entry as { selector?: unknown }).selector;
    if (typeof nested === 'string') return nested;
  }
  return undefined;
}

/**
 * Resuelve el selector CSS del campo desde selectors.json ('#campo' si no existe).
 * Acepta la forma real { selectors: { campo: '...' } } y también un mapa plano.
 */
function resolveSelector(selectors: ModuleSelectors | undefined, field: string): string {
  const raw = selectors as unknown as Record<string, unknown> | undefined;
  const nestedMap = raw?.selectors as Record<string, unknown> | undefined;

  return readSelector(nestedMap?.[field]) ?? readSelector(raw?.[field]) ?? `#${field}`;
}

/**
 * Genera casos de prueba de análisis de valores límite (BVA) para las reglas
 * confirmadas con límites numéricos extraíbles (S81-001). Los casos se generan
 * una vez por campo, con los límites combinados de todas sus reglas.
 */
export function generateBvaCases(
  moduleName: string,
  rules: RuleEntry[],
  selectors: ModuleSelectors,
  baseRoute?: string
): TCCase[] {
  const bvaCases: TCCase[] = [];
  const route = baseRoute ?? '/';

  const targetRules = rules.filter((rule) => rule.status === 'confirmed' && BVA_CATEGORIES.includes(rule.category));

  for (const group of groupRulesByField(targetRules)) {
    const { min, max } = group.bounds;
    if (min === undefined && max === undefined) continue;

    const sourceRule = group.rules[0];
    const selectorPath = resolveSelector(selectors, group.field);

    for (const boundary of buildBoundaries(min, max)) {
      const steps: TCStep[] = [
        { type: 'navigate', url: route },
        { type: 'fill', selector: selectorPath, value: String(boundary.value) },
        { type: 'click', selector: 'button[type="submit"], #submit, [data-testid="submit"]' },
        {
          type: 'assert',
          selector: boundary.valid
            ? '.success-message, [data-testid="success"]'
            : '.error-message, [data-error], .invalid-feedback',
          assertion_type: boundary.valid ? 'visible' : 'not_visible',
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
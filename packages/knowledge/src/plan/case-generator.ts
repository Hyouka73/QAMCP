import { createHash } from 'node:crypto';
import type { TCCase, TCStep } from '@qap/shared';

/**
 * Genera un UUID v4 determinista a partir de una cadena semilla (semilla: moduleName + caseName).
 */
export function generateDeterministicUuid(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  const timeLow = hash.substring(0, 8);
  const timeMid = hash.substring(8, 12);
  const timeHighAndVersion = `4${hash.substring(13, 16)}`;
  const clockSeq = `a${hash.substring(17, 20)}`;
  const node = hash.substring(20, 32);

  return `${timeLow}-${timeMid}-${timeHighAndVersion}-${clockSeq}-${node}`;
}

export interface CaseGeneratorOptions {
  moduleName: string;
  caseName: string;
  tags?: string[];
  dependsOn?: string[];
  steps?: TCStep[];
  manuallyEdited?: boolean;
}

export class CaseGenerator {
  /**
   * Genera un objeto TCCase con UUID determinista basado en el módulo y nombre del caso.
   */
  public static generateCase(options: CaseGeneratorOptions): TCCase & { manually_edited?: boolean } {
    const seed = `${options.moduleName}:${options.caseName}`;
    const uuid = generateDeterministicUuid(seed);

    const defaultSteps: TCStep[] = options.steps && options.steps.length > 0
      ? options.steps
      : [
          {
            type: 'navigate',
            url: `/${options.moduleName}`,
          },
          {
            type: 'assert',
            selector: 'body',
            assertion_type: 'visible',
          },
        ];

    const testCase: TCCase & { manually_edited?: boolean } = {
      _version: '1.0.0',
      id: uuid,
      name: options.caseName,
      tags: options.tags ?? [options.moduleName],
      depends_on: options.dependsOn ?? undefined,
      steps: defaultSteps,
    };

    if (options.manuallyEdited) {
      testCase.manually_edited = true;
    }

    return testCase;
  }
}
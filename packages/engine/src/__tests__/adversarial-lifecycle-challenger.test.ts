import { describe, it, expect } from 'vitest';

import type { CanExitOnboardingContext, CanExitOnboardingEnvironments } from '../lifecycle.js';
import { canExitOnboarding } from '../lifecycle.js';
import type { HallazgosProyectoMin, DocumentoCandidatoMin } from '../onboarding-interview.js';
import { obtenerSiguientePreguntaOnboarding, esDocumentoSubstantivo } from '../onboarding-interview.js';

describe('Adversarial Lifecycle & Onboarding Challenger Test Suite (M2)', () => {
  const baseValidContext: CanExitOnboardingContext = {
    project_name: 'test-project',
    objective: 'Validar funcionalmente EXATO Center, plataforma de gestión de procesos de reclutamiento',
    objective_source: 'user',
    roles: [{ name: 'Administrador', source: 'user' }],
    critical_flows: [{ name: 'Registro de expediente', source: 'user' }],
    source_of_truth: {
      type: 'readme',
      ref: 'README.md',
      declared: true,
      source: 'user',
    },
  };

  const validEnvironments: CanExitOnboardingEnvironments = {
    environments: {
      local: { url: 'http://localhost:3000' },
    },
  };

  describe('Dimension 1: canExitOnboarding against Varied Stub Objectives', () => {
    const stubVariations: Array<{ label: string; value: string; expectedMotiveContains?: string }> = [
      // Exact strings from assignment
      { label: 'Exact "Documento vacío"', value: 'Documento vacío' },
      { label: 'Padded and uppercase "   DOCUMENTO VACÍO   "', value: '   DOCUMENTO VACÍO   ' },
      { label: 'Exact "TODO"', value: 'TODO' },
      { label: 'Lowercase "tbd"', value: 'tbd' },
      { label: 'Lowercase "none"', value: 'none' },
      { label: 'Lowercase "placeholder"', value: 'placeholder' },
      { label: 'Unaccented "Documento vacio"', value: 'Documento vacio' },

      // Casing and accent combinations
      { label: 'Lowercase accented "documento vacío"', value: 'documento vacío' },
      { label: 'Uppercase unaccented "DOCUMENTO VACIO"', value: 'DOCUMENTO VACIO' },
      { label: 'Mixed case accented "DoCuMeNtO VaCíO"', value: 'DoCuMeNtO VaCíO' },
      { label: 'Mixed case unaccented "dOcUmEnTo vAcIo"', value: 'dOcUmEnTo vAcIo' },
      { label: 'Title case "Documento Vacio"', value: 'Documento Vacio' },
      { label: 'Mixed case "ToDo"', value: 'ToDo' },
      { label: 'Mixed case "tOdO"', value: 'tOdO' },
      { label: 'Uppercase "TBD"', value: 'TBD' },
      { label: 'Mixed case "tBd"', value: 'tBd' },
      { label: 'Title case "None"', value: 'None' },
      { label: 'Uppercase "NONE"', value: 'NONE' },
      { label: 'Mixed case "nOnE"', value: 'nOnE' },
      { label: 'Title case "Placeholder"', value: 'Placeholder' },
      { label: 'Uppercase "PLACEHOLDER"', value: 'PLACEHOLDER' },
      { label: 'Mixed case "pLaCeHoLdEr"', value: 'pLaCeHoLdEr' },

      // Other canonical stubs
      { label: 'Lowercase "sin objetivo"', value: 'sin objetivo' },
      { label: 'Title case "Sin Objetivo"', value: 'Sin Objetivo' },
      { label: 'Uppercase "SIN OBJETIVO"', value: 'SIN OBJETIVO' },
      { label: 'Mixed case "sIn ObJeTiVo"', value: 'sIn ObJeTiVo' },
      { label: 'Lowercase "null"', value: 'null' },
      { label: 'Title case "Null"', value: 'Null' },
      { label: 'Uppercase "NULL"', value: 'NULL' },
      { label: 'Lowercase "n/a"', value: 'n/a' },
      { label: 'Uppercase "N/A"', value: 'N/A' },
      { label: 'Mixed case "N/a"', value: 'N/a' },

      // Whitespace and internal spacing variations
      { label: 'Tabs and newline around stub', value: '\t\tDocumento vacío\n' },
      { label: 'Multiple spaces between words "Documento    vacío"', value: 'Documento    vacío' },
      { label: 'Tab between words "Documento\tvacío"', value: 'Documento\tvacío' },
      { label: 'Padded spaces "   sin   objetivo   "', value: '   sin   objetivo   ' },
      { label: 'Padded spaces "   TODO   "', value: '   TODO   ' },
      { label: 'Padded spaces "   tbd   "', value: '   tbd   ' },
      { label: 'Padded spaces "   placeholder   "', value: '   placeholder   ' },
      { label: 'Padded spaces "   none   "', value: '   none   ' },
      { label: 'Padded spaces "   n/a   "', value: '   n/a   ' },
      { label: 'CRLF around stub "\r\n  TODO  \r\n"', value: '\r\n  TODO  \r\n' },

      // Empty and short strings
      { label: 'Empty string ""', value: '', expectedMotiveContains: 'falta definir' },
      { label: 'Whitespace only "      "', value: '      ', expectedMotiveContains: 'falta definir' },
      { label: 'Generic short string (< 20 chars)', value: 'Objetivo corto', expectedMotiveContains: '20 caracteres' },
    ];

    for (const testCase of stubVariations) {
      it(`debe rechazar estrictamente el stub: ${testCase.label} (${JSON.stringify(testCase.value)})`, () => {
        const testContext: CanExitOnboardingContext = {
          ...baseValidContext,
          objective: testCase.value,
          objective_source: 'user',
        };

        const result = canExitOnboarding(testContext, validEnvironments);

        // Invariant 1: Transition gate must fail
        expect(result.passed).toBe(false);

        // Invariant 2: Faltantes list must include 'objective'
        const objFaltante = result.faltantes.find((f) => f.campo === 'objective');
        expect(objFaltante).toBeDefined();

        // Invariant 3: Motive must be appropriate
        if (testCase.expectedMotiveContains) {
          expect(objFaltante?.motivo).toContain(testCase.expectedMotiveContains);
        } else {
          expect(objFaltante?.motivo).toBe('el objetivo es un marcador de posición o stub inválido');
        }
      });
    }

    it('debe rechazar stubs incluso si objective_source es "prd"', () => {
      const testContext: CanExitOnboardingContext = {
        ...baseValidContext,
        objective: 'Documento vacío',
        objective_source: 'prd',
      };
      const result = canExitOnboarding(testContext, validEnvironments);
      expect(result.passed).toBe(false);
      const objFaltante = result.faltantes.find((f) => f.campo === 'objective');
      expect(objFaltante?.motivo).toBe('el objetivo es un marcador de posición o stub inválido');
    });

    it('debe rechazar stubs incluso si vienen a través de context.description (legacy)', () => {
      const testContext = {
        ...baseValidContext,
        objective: undefined,
        description: '   DOCUMENTO VACÍO   ',
        objective_source: 'user' as const,
      };
      const result = canExitOnboarding(testContext, validEnvironments);
      expect(result.passed).toBe(false);
      const objFaltante = result.faltantes.find((f) => f.campo === 'objective');
      expect(objFaltante?.motivo).toBe('el objetivo es un marcador de posición o stub inválido');
    });
  });

  describe('Dimension 2: Stress-testing obtenerSiguientePreguntaOnboarding with Mock Findings', () => {
    describe('esDocumentoSubstantivo helper oracle', () => {
      it('evalúa correctamente documentos sustantivos vs stubs/vacíos', () => {
        // Disqualified
        expect(esDocumentoSubstantivo({ path: 'a.md', es_ingerible: false })).toBe(false);
        expect(esDocumentoSubstantivo({ path: 'a.md', tamano_bytes: 0 })).toBe(false);
        expect(esDocumentoSubstantivo({ path: 'a.md', tamano_bytes: -10 })).toBe(false);
        expect(esDocumentoSubstantivo({ path: 'a.md', categoria: 'placeholder' })).toBe(false);
        expect(esDocumentoSubstantivo({ path: 'a.md', categoria: 'archivo_vacio' })).toBe(false);
        expect(esDocumentoSubstantivo({ path: 'a.md', es_ingerible: false, tamano_bytes: 0, categoria: 'placeholder' })).toBe(false);

        // Substantive
        expect(esDocumentoSubstantivo({ path: 'a.md', es_ingerible: true, tamano_bytes: 500, categoria: 'documento_funcional' })).toBe(true);
        expect(esDocumentoSubstantivo({ path: 'a.md', es_ingerible: true, tamano_bytes: 300, categoria: 'readme_instalacion' })).toBe(true);
      });
    });

    describe('Scenario 2.1: Scan contains only 0-byte files', () => {
      const zeroByteCases: Array<{ label: string; docs: DocumentoCandidatoMin[] }> = [
        {
          label: 'Single 0-byte PRD.md with explicit flags',
          docs: [{ path: 'PRD.md', nombre: 'PRD.md', tamano_bytes: 0, es_ingerible: false, categoria: 'placeholder' }],
        },
        {
          label: 'Single 0-byte PRD.md with only tamano_bytes: 0',
          docs: [{ path: 'PRD.md', nombre: 'PRD.md', tamano_bytes: 0 }],
        },
        {
          label: 'Multiple 0-byte files across categories',
          docs: [
            { path: 'PRD.md', nombre: 'PRD.md', tamano_bytes: 0, es_ingerible: false, categoria: 'placeholder' },
            { path: 'SPEC.md', nombre: 'SPEC.md', tamano_bytes: 0, es_ingerible: false, categoria: 'archivo_vacio' },
            { path: 'README.md', nombre: 'README.md', tamano_bytes: 0, es_ingerible: false },
          ],
        },
      ];

      for (const zCase of zeroByteCases) {
        it(`en ${zCase.label}: NINGÚN archivo de 0 bytes se marca recomendada: true y hace fallback a custom`, () => {
          const hallazgos: HallazgosProyectoMin = {
            documentos: zCase.docs,
          };

          const pregunta = obtenerSiguientePreguntaOnboarding({}, null, hallazgos);
          expect(pregunta).not.toBeNull();
          expect(pregunta?.id).toBe('onboarding.fuente_de_verdad');

          // Invariant 1: Ningún archivo de 0 bytes debe aparecer en opciones
          for (const doc of zCase.docs) {
            const found = pregunta?.opciones.find((o) => o.id === doc.path);
            expect(found).toBeUndefined();
          }

          // Invariant 2: Ninguna opción de archivo puede ser recomendada
          const docOptions = pregunta?.opciones.filter((o) => o.id !== 'custom' && o.id !== 'none') ?? [];
          expect(docOptions).toHaveLength(0);

          // Invariant 3: Fallback a manual entry ('custom') existe y está recomendada
          const customOption = pregunta?.opciones.find((o) => o.id === 'custom');
          expect(customOption).toBeDefined();
          expect(customOption?.recomendada).toBe(true);

          // Invariant 4: Opción 'none' (definir desde cero) existe
          const noneOption = pregunta?.opciones.find((o) => o.id === 'none');
          expect(noneOption).toBeDefined();
        });
      }
    });

    describe('Scenario 2.2: Scan contains only stub or placeholder files (> 0 bytes but disqualified)', () => {
      const stubCases: Array<{ label: string; docs: DocumentoCandidatoMin[] }> = [
        {
          label: 'Single stub file with categoria: placeholder',
          docs: [{ path: 'PRD.md', nombre: 'PRD.md', tamano_bytes: 18, es_ingerible: false, categoria: 'placeholder' }],
        },
        {
          label: 'Single stub file with categoria: archivo_vacio',
          docs: [{ path: 'empty_spec.txt', nombre: 'empty_spec.txt', tamano_bytes: 5, es_ingerible: false, categoria: 'archivo_vacio' }],
        },
        {
          label: 'Single stub file with es_ingerible: false',
          docs: [{ path: 'NOTES.md', nombre: 'NOTES.md', tamano_bytes: 22, es_ingerible: false }],
        },
        {
          label: 'Multiple stubs with mixed disqualifications',
          docs: [
            { path: 'PRD.md', tamano_bytes: 15, es_ingerible: false, categoria: 'placeholder' },
            { path: 'TODO.md', tamano_bytes: 20, es_ingerible: false, categoria: 'placeholder' },
            { path: 'spec.txt', tamano_bytes: 10, es_ingerible: false, categoria: 'archivo_vacio' },
          ],
        },
      ];

      for (const sCase of stubCases) {
        it(`en ${sCase.label}: NINGÚN stub se ofrece ni se marca recomendada: true`, () => {
          const hallazgos: HallazgosProyectoMin = {
            documentos: sCase.docs,
          };

          const pregunta = obtenerSiguientePreguntaOnboarding({}, null, hallazgos);
          expect(pregunta).not.toBeNull();
          expect(pregunta?.id).toBe('onboarding.fuente_de_verdad');

          // Ningún stub en opciones
          for (const doc of sCase.docs) {
            expect(pregunta?.opciones.find((o) => o.id === doc.path)).toBeUndefined();
          }

          // Fallback a custom
          const customOption = pregunta?.opciones.find((o) => o.id === 'custom');
          expect(customOption).toBeDefined();
          expect(customOption?.recomendada).toBe(true);
        });
      }
    });

    describe('Scenario 2.3: Scan contains no files (null, undefined, empty array)', () => {
      const emptyScanCases: Array<{ label: string; hallazgos: HallazgosProyectoMin | null | undefined }> = [
        { label: 'hallazgos is null', hallazgos: null },
        { label: 'hallazgos is undefined', hallazgos: undefined },
        { label: 'hallazgos is empty object {}', hallazgos: {} },
        { label: 'hallazgos has empty documentos array []', hallazgos: { documentos: [] } },
      ];

      for (const eCase of emptyScanCases) {
        it(`en ${eCase.label}: ofrece opciones [custom, none] con custom recomendada: true`, () => {
          const pregunta = obtenerSiguientePreguntaOnboarding({}, null, eCase.hallazgos);
          expect(pregunta).not.toBeNull();
          expect(pregunta?.id).toBe('onboarding.fuente_de_verdad');
          expect(pregunta?.opciones).toHaveLength(2);

          const custom = pregunta?.opciones[0];
          expect(custom?.id).toBe('custom');
          expect(custom?.recomendada).toBe(true);

          const none = pregunta?.opciones[1];
          expect(none?.id).toBe('none');
          expect(none?.recomendada).toBeFalsy();
        });
      }
    });

    describe('Scenario 2.4: Scan contains mixed files (stubs + genuine substantive documents)', () => {
      it('SOLO el primer documento genuinamente sustantivo se marca recomendada: true', () => {
        const hallazgos: HallazgosProyectoMin = {
          documentos: [
            { path: 'PRD.md', nombre: 'PRD.md', tamano_bytes: 0, es_ingerible: false, categoria: 'placeholder' },
            { path: 'TODO.txt', nombre: 'TODO.txt', tamano_bytes: 15, es_ingerible: false, categoria: 'placeholder' },
            { path: 'docs/funcional.md', nombre: 'funcional.md', tamano_bytes: 3500, es_ingerible: true, categoria: 'documento_funcional' },
            { path: 'README.md', nombre: 'README.md', tamano_bytes: 1200, es_ingerible: true, categoria: 'readme_instalacion' },
            { path: 'old_draft.txt', nombre: 'old_draft.txt', tamano_bytes: 0, es_ingerible: false, categoria: 'placeholder' },
          ],
        };

        const pregunta = obtenerSiguientePreguntaOnboarding({}, null, hallazgos);
        expect(pregunta).not.toBeNull();
        expect(pregunta?.id).toBe('onboarding.fuente_de_verdad');

        // Los stubs no deben existir en opciones
        expect(pregunta?.opciones.some((o) => o.id === 'PRD.md')).toBe(false);
        expect(pregunta?.opciones.some((o) => o.id === 'TODO.txt')).toBe(false);
        expect(pregunta?.opciones.some((o) => o.id === 'old_draft.txt')).toBe(false);

        // Los documentos sustantivos deben existir
        const docFuncional = pregunta?.opciones.find((o) => o.id === 'docs/funcional.md');
        expect(docFuncional).toBeDefined();
        expect(docFuncional?.recomendada).toBe(true);

        const readme = pregunta?.opciones.find((o) => o.id === 'README.md');
        expect(readme).toBeDefined();
        expect(readme?.recomendada).toBe(false);

        // La opción 'none' debe existir
        const noneOption = pregunta?.opciones.find((o) => o.id === 'none');
        expect(noneOption).toBeDefined();
        expect(noneOption?.recomendada).toBeFalsy();
      });
    });

    describe('Scenario 2.5: Ingestion of stub objective must NOT produce confirmed hypothesis', () => {
      const stubHypotheses = [
        'Documento vacío',
        '   DOCUMENTO VACÍO   ',
        'TODO',
        'tbd',
        'none',
        'placeholder',
        'Documento vacio',
        'sin objetivo',
        'null',
        'n/a',
      ];

      for (const stubHypo of stubHypotheses) {
        it(`si contexto tiene objetivo stub "${stubHypo}", NUNCA propone confirmación de dicho stub`, () => {
          const ctx: CanExitOnboardingContext = {
            source_of_truth: { type: 'readme', declared: true, ref: 'README.md', source: 'user' },
            objective: stubHypo,
            objective_source: 'inferred',
            roles: [{ name: 'Admin', source: 'inferred' }],
            critical_flows: [{ name: 'Login', source: 'inferred' }],
          };

          const pregunta = obtenerSiguientePreguntaOnboarding(ctx, null, null);
          expect(pregunta).not.toBeNull();

          // No debe saltar a confirmar_resumen con el stub como válido
          expect(pregunta?.id).not.toBe('onboarding.confirmar_resumen');

          // Debe caer en onboarding.objetivo como pregunta abierta
          expect(pregunta?.id).toBe('onboarding.objetivo');
          expect(pregunta?.formato).toBe('abierta');
          expect(pregunta?.texto).not.toContain(stubHypo);
          expect(pregunta?.texto).toContain('Describe el objetivo central del proyecto');
        });
      }
    });
  });

  describe('Dimension 3: Edge Cases — Valid Non-Stub Objectives are NOT Falsely Rejected', () => {
    const validObjectiveCases = [
      {
        label: 'Official EXATO Center proposed objective from user request',
        objective:
          'Validar funcionalmente EXATO Center, plataforma de gestión de procesos de reclutamiento, estudios socioeconómicos y expedientes documentales, mediante escenarios completos de QA, con evidencia verificable, detección y reproducción de incidencias y generación de reportes trazables',
      },
      {
        label: 'Objective containing Spanish word "todo" ("all") in the middle',
        objective: 'Automatización de todo el flujo de compras y checkout en la tienda online',
      },
      {
        label: 'Objective starting with "Todo" ("all")',
        objective: 'Todo el ciclo de vida del reclutamiento y selección de candidatos en la empresa',
      },
      {
        label: 'Objective containing "none" as substring in legitimate English technical term',
        objective: 'Sistema bancario con none-blocking IO y persistencia transaccional de pagos',
      },
      {
        label: 'Objective containing "placeholder" as legitimate functional feature description',
        objective: 'Procesamiento de contratos y firmas sustituyendo cada placeholder por datos validados',
      },
      {
        label: 'Objective containing "tbd" inside a legitimate word',
        objective: 'Plataforma de streaming TBD-free con transcodificación en tiempo real',
      },
      {
        label: 'Objective containing "documento" and "vacío" in a legitimate business sentence',
        objective: 'Validación de que ningún documento vacío sea emitido en el proceso de facturación',
      },
      {
        label: 'Objective containing "null" in legitimate context',
        objective: 'Auditoría de integridad asegurando tolerancia cero a null-pointers en producción',
      },
      {
        label: 'Objective containing "n/a" in legitimate context',
        objective: 'Sistema para categorizar productos donde n/a se convierte en default parametrizable',
      },
    ];

    for (const vCase of validObjectiveCases) {
      it(`debe aceptar sin falsos positivos: ${vCase.label}`, () => {
        const testContext: CanExitOnboardingContext = {
          ...baseValidContext,
          objective: vCase.objective,
          objective_source: 'user',
        };

        const result = canExitOnboarding(testContext, validEnvironments);

        // Invariant: Valid objective must pass
        expect(result.passed).toBe(true);
        expect(result.faltantes).toHaveLength(0);
      });

      it(`debe aceptar con objective_source "prd": ${vCase.label}`, () => {
        const testContext: CanExitOnboardingContext = {
          ...baseValidContext,
          objective: vCase.objective,
          objective_source: 'prd',
        };

        const result = canExitOnboarding(testContext, validEnvironments);
        expect(result.passed).toBe(true);
        expect(result.faltantes).toHaveLength(0);
      });
    }

    it('en onboarding interview, un objetivo legítimo que contiene "todo" es propuesto correctamente', () => {
      const validObj = 'Automatización de todo el flujo de compras y checkout en la tienda online';
      const ctx: CanExitOnboardingContext = {
        source_of_truth: { type: 'readme', declared: true, ref: 'README.md', source: 'user' },
        objective: validObj,
        objective_source: 'inferred',
        // Sin roles ni flujos para que caiga en fallback objetivo
      };

      const pregunta = obtenerSiguientePreguntaOnboarding(ctx, null, null);
      expect(pregunta).not.toBeNull();
      expect(pregunta?.id).toBe('onboarding.objetivo');
      // Debe reconocerlo como hipótesis válida y pedir confirmación, NO tratarlo como stub
      expect(pregunta?.formato).toBe('una_opcion');
      expect(pregunta?.texto).toContain(validObj);
      expect(pregunta?.opciones.some((o) => o.id === 'correcto' && o.recomendada === true)).toBe(true);
    });
  });
});

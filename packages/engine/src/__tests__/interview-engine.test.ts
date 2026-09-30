import { describe, it, expect } from 'vitest';
import {
  generateDomHypotheses,
  isFieldSensitive,
  computeApplicableCategories,
  computeCoverage,
  generateNextInterviewBatch,
  sanitizeDomString,
  ViewDiscoveryContext,
} from '../interview-engine.js';
import type { RuleEntry, CategoryWaiver } from '@qap/shared';

describe('interview-engine (P3)', () => {
  const sampleContext: ViewDiscoveryContext = {
    module: 'auth',
    view: 'default',
    storage_state_used: true,
    buttons: [
      { key: 'btn-login', text: 'Iniciar Sesión', selector: '#submit-btn' },
    ],
    forms: [
      {
        id: 'login-form',
        selector: '#login-form',
        submitSelector: '#submit-btn',
        fields: [
          {
            key: 'username',
            name: 'username',
            id: 'username',
            type: 'text',
            required: true,
            minlength: 3,
            maxlength: 30,
            label: 'Nombre de usuario',
            autocomplete: 'username',
          },
          {
            key: 'password',
            name: 'password',
            id: 'password',
            type: 'password',
            required: true,
            minlength: 8,
            label: 'Contraseña secreta',
            pattern: '.*',
          },
        ],
      },
    ],
  };

  describe('isFieldSensitive', () => {
    it('detecta passwords, emails, teléfonos, tarjetas y rfc como sensibles', () => {
      expect(isFieldSensitive({ key: 'user_password', type: 'password' })).toBe(true);
      expect(isFieldSensitive({ key: 'email_address', type: 'email' })).toBe(true);
      expect(isFieldSensitive({ key: 'card_number', type: 'text' })).toBe(true);
      expect(isFieldSensitive({ key: 'user_rfc', type: 'text' })).toBe(true);
      expect(isFieldSensitive({ key: 'telefono', type: 'tel' })).toBe(true);
    });

    it('no marca campos normales no sensibles', () => {
      expect(isFieldSensitive({ key: 'username', type: 'text' })).toBe(false);
      expect(isFieldSensitive({ key: 'quantity', type: 'number' })).toBe(false);
      expect(isFieldSensitive({ key: 'status', type: 'text' })).toBe(false);
    });
  });

  describe('sanitizeDomString', () => {
    it('trunca a 60 caracteres y elimina saltos de línea y tags HTML', () => {
      const raw = '<b>Hola</b>\n\tmundo ' + 'a'.repeat(80);
      const clean = sanitizeDomString(raw);
      expect(clean.length).toBeLessThanOrEqual(60);
      expect(clean).not.toContain('\n');
      expect(clean).not.toContain('<b>');
    });
  });

  describe('generateDomHypotheses', () => {
    it('genera hipótesis deterministas con IDs <view>.<field>.<type>', () => {
      const hypotheses = generateDomHypotheses(sampleContext);
      expect(hypotheses.length).toBeGreaterThan(0);

      for (const h of hypotheses) {
        expect(h.id).toMatch(/^default\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_]+$/);
        expect(h.source).toBe('dom');
        expect(h.status).toBe('inferred');
        expect(h.view).toBe('default');
      }

      const reqH = hypotheses.find((h) => h.id === 'default.username.required');
      expect(reqH).toBeDefined();
      expect(reqH?.category).toBe('campo');
      expect(reqH?.field).toBe('username');

      const minH = hypotheses.find((h) => h.id === 'default.username.minlength');
      expect(minH).toBeDefined();
      expect(minH?.category).toBe('campo');

      const sensH = hypotheses.find((h) => h.id === 'default.password.sensibilidad');
      expect(sensH).toBeDefined();
      expect(sensH?.category).toBe('sensibilidad');
    });

    it('no expone labels ni patterns de campos sensibles (password)', () => {
      const hypotheses = generateDomHypotheses(sampleContext);
      const passHypotheses = hypotheses.filter((h) => h.field === 'password');

      for (const h of passHypotheses) {
        expect(h.evidence).not.toContain('Contraseña secreta');
        expect(h.evidence).not.toContain('.*');
      }
    });

    it('es idempotente y determinista', () => {
      const run1 = generateDomHypotheses(sampleContext);
      const run2 = generateDomHypotheses(sampleContext);
      expect(run1).toEqual(run2);
    });
  });

  describe('computeApplicableCategories', () => {
    it('incluye proposito, campo, error, accion, dato y sensibilidad para formulario auth', () => {
      const cats = computeApplicableCategories(sampleContext, 0);
      expect(cats).toContain('proposito');
      expect(cats).toContain('campo');
      expect(cats).toContain('error');
      expect(cats).toContain('accion');
      expect(cats).toContain('dato');
      expect(cats).toContain('sensibilidad');
      // storage_state_used: true activa actor
      expect(cats).toContain('actor');
    });

    it('incluye actor si projectRoleCount >= 2 aun sin storage_state', () => {
      const ctxNoStorage = { ...sampleContext, storage_state_used: false };
      const cats = computeApplicableCategories(ctxNoStorage, 2);
      expect(cats).toContain('actor');
    });

    it('no incluye actor si projectRoleCount < 2 y sin storage_state', () => {
      const ctxNoStorage = { ...sampleContext, storage_state_used: false };
      const cats = computeApplicableCategories(ctxNoStorage, 1);
      expect(cats).not.toContain('actor');
    });
  });

  describe('computeCoverage', () => {
    it('calcula cobertura correctamente con reglas confirmadas y waivers de vista', () => {
      const applicable = ['campo', 'sensibilidad', 'proposito'] as const;
      const rules: RuleEntry[] = [
        {
          id: 'default.username.required',
          category: 'campo',
          description: 'Username obligatorio',
          source: 'user',
          status: 'confirmed',
          view: 'default',
        },
      ];
      const waivers: CategoryWaiver[] = [
        {
          category: 'sensibilidad',
          view: 'default',
          reason: 'Gestionado externamente por SSO',
          waived_at: new Date().toISOString(),
          waived_by: 'user',
        },
      ];

      const res = computeCoverage(applicable as any, rules, waivers, 'default');
      expect(res.categorias.campo.cubierta).toBe(true);
      expect(res.categorias.sensibilidad.cubierta).toBe(true); // Cubierta por waiver
      expect(res.categorias.proposito.cubierta).toBe(false);
      expect(res.completa).toBe(false);
    });

    it('marca completa=true cuando todas las categorías aplicables están cubiertas y 0 inferidas pendientes', () => {
      const applicable = ['campo'] as const;
      const rules: RuleEntry[] = [
        {
          id: 'default.username.required',
          category: 'campo',
          description: 'Username obligatorio',
          source: 'user',
          status: 'confirmed',
          view: 'default',
        },
      ];
      const res = computeCoverage(applicable as any, rules, [], 'default');
      expect(res.completa).toBe(true);
      expect(res.inferidas_pendientes).toBe(0);
    });
  });

  describe('generateNextInterviewBatch', () => {
    it('genera lote de preguntas para categorías abiertas', () => {
      const applicable = ['proposito', 'actor', 'error'] as const;
      const questions = generateNextInterviewBatch(sampleContext, [], applicable as any, []);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(5);

      for (const q of questions) {
        expect(q.id).toBeTruthy();
        expect(q.texto).toBeTruthy();
        expect(q.categoria).toBeTruthy();
      }
    });

    it('agrupa hipótesis DOM pendientes en una pregunta tipo confirmar_hipotesis', () => {
      const hypotheses = generateDomHypotheses(sampleContext);
      const applicable = ['campo', 'proposito'] as const;
      const questions = generateNextInterviewBatch(sampleContext, hypotheses, applicable as any, []);

      const confirmQuestion = questions.find((q) => q.tipo === 'confirmar_hipotesis');
      expect(confirmQuestion).toBeDefined();
      expect(confirmQuestion?.hipotesis_ids?.length).toBeGreaterThan(0);
    });
  });
});

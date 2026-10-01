import type {
  LifecycleState,
  RuleEntry,
  RuleCategory,
} from '@qap/shared';
import { describe, it, expect } from 'vitest';

import {
  MODULE_TRANSITIONS,
  validateModuleTransition,
  transitionModule,
  canCloseModule,
  canExitWorking,
  generateNextInterviewBatch,
  validateCategoryWaiver,
  validateWaiversBatch,
  detectActionIntent,
  getActionButtonQuestion,
  generateSessionGapReport,
  type ViewDiscoveryContext,
} from '../index.js';

describe('E1, E2, E3 & E0d: Motor de Cierre de Ciclo de Vida y Reglas', () => {
  describe('E0d: Calidad de preguntas y plantillas por intención', () => {
    it('debe usar el nombre del módulo y su ruta en los enunciados, nunca "default" ni id de formulario', () => {
      const ctx: ViewDiscoveryContext = {
        module: 'auth',
        view: 'default',
        route: '/auth/login',
        forms: [{ id: 'form-login-1', selector: 'form', fields: [] }],
        buttons: [{ key: 'btn-submit', text: 'Entrar al sistema', selector: 'button' }],
      };

      const questions = generateNextInterviewBatch(
        ctx,
        [],
        ['proposito', 'actor', 'error', 'accion', 'dato'],
        []
      );

      for (const q of questions) {
        expect(q.texto).not.toContain('default');
        expect(q.texto).not.toContain('form-login-1');
        expect(q.texto).toContain('auth');
      }

      // Proposito debe incluir nombre y ruta
      const qProp = questions.find((q) => q.categoria === 'proposito');
      expect(qProp?.texto).toContain("'auth' (/auth/login)");

      // Error debe ser contextual y no mencionar form-login-1
      const qErr = questions.find((q) => q.categoria === 'error');
      expect(qErr?.texto).not.toContain('form-login-1');
      expect(qErr?.texto).toContain("'auth' (/auth/login)");
    });

    it('la sensibilidad de un campo se pregunta UNA sola vez (no se repite como abierta si ya es hipótesis)', () => {
      const ctx: ViewDiscoveryContext = {
        module: 'checkout',
        view: 'default',
        route: '/checkout/payment',
        forms: [
          {
            id: 'form-pay',
            selector: 'form',
            fields: [
              { key: 'card_number', type: 'text', label: 'Número de tarjeta de crédito', required: true },
            ],
          },
        ],
      };

      const pendingHypotheses: RuleEntry[] = [
        {
          id: 'checkout.card_number.sensibilidad',
          description: 'El campo "Número de tarjeta de crédito" maneja datos sensibles.',
          category: 'sensibilidad',
          status: 'inferred',
          source: 'dom',
          view: 'default',
        },
      ];

      const questions = generateNextInterviewBatch(
        ctx,
        pendingHypotheses,
        ['proposito', 'sensibilidad'],
        []
      );

      // Debe incluir confirmar_hipotesis
      const confirmQ = questions.find((q) => q.tipo === 'confirmar_hipotesis');
      expect(confirmQ).toBeDefined();

      // NO debe existir pregunta abierta de sensibilidad
      const openSensQ = questions.find(
        (q) => q.tipo === 'abierta' && q.categoria === 'sensibilidad'
      );
      expect(openSensQ).toBeUndefined();
    });

    it('debe detectar la intención del botón y seleccionar la plantilla correspondiente', () => {
      // Autenticación
      expect(detectActionIntent('Iniciar sesión')).toBe('auth');
      expect(detectActionIntent('Login')).toBe('auth');
      expect(detectActionIntent('Sign in')).toBe('auth');
      const authQ = getActionButtonQuestion('Iniciar sesión', "'auth' (/login)");
      expect(authQ).toContain('credenciales incorrectas');
      expect(authQ).toContain('duración de sesión');
      expect(authQ).toContain('redirección según rol');

      // Destructiva
      expect(detectActionIntent('Eliminar cuenta')).toBe('destructive');
      expect(detectActionIntent('Borrar registro')).toBe('destructive');
      expect(detectActionIntent('Delete')).toBe('destructive');
      const destQ = getActionButtonQuestion('Eliminar cuenta', "'users' (/users)");
      expect(destQ).toContain('diálogo de confirmación');
      expect(destQ).toContain('reversible');
      expect(destQ).toContain('permisos o roles');

      // Guardar / Enviar
      expect(detectActionIntent('Guardar cambios')).toBe('save');
      expect(detectActionIntent('Crear usuario')).toBe('save');
      expect(detectActionIntent('Enviar solicitud')).toBe('save');
      expect(detectActionIntent('Submit')).toBe('save');
      const saveQ = getActionButtonQuestion('Guardar cambios', "'settings' (/settings)");
      expect(saveQ).toContain('validaciones de negocio');
      expect(saveQ).toContain('efectos secundarios');
      expect(saveQ).toContain('duplicados');

      // Búsqueda / Filtro
      expect(detectActionIntent('Buscar productos')).toBe('search');
      expect(detectActionIntent('Filtrar')).toBe('search');
      const searchQ = getActionButtonQuestion('Buscar productos', "'catalog' (/catalog)");
      expect(searchQ).toContain('criterios de coincidencia');
      expect(searchQ).toContain('límites de paginación');

      // Genérica
      expect(detectActionIntent('Siguiente')).toBe('generic');
      const genQ = getActionButtonQuestion('Siguiente', "'wizard' (/wizard)");
      expect(genQ).toContain('cambiar estado');
      expect(genQ).toContain('precondiciones');
    });
  });

  describe('E1: Semántica de estados de módulo y política de waivers', () => {
    it('debe permitir la regresión consolidated -> interviewing en MODULE_TRANSITIONS', () => {
      expect(MODULE_TRANSITIONS.consolidated).toContain('interviewing');
      const res = validateModuleTransition('consolidated', 'interviewing');
      expect(res.success).toBe(true);
    });

    it('closed y waived deben permanecer estrictamente terminales', () => {
      expect(MODULE_TRANSITIONS.closed).toHaveLength(0);
      expect(MODULE_TRANSITIONS.waived).toHaveLength(0);

      const resClosed = validateModuleTransition('closed', 'interviewing');
      expect(resClosed.success).toBe(false);

      const resWaived = validateModuleTransition('waived', 'planned');
      expect(resWaived.success).toBe(false);
    });

    it('toda transición de módulo debe registrarse en history con el nombre del módulo', () => {
      const state: LifecycleState = {
        _version: '1',
        phase: 'WORKING',
        session: { id: 's1', started_at: new Date().toISOString(), plan: [] },
        modules: {
          auth: { state: 'consolidated', updated_at: new Date().toISOString() },
        },
        history: [],
      };

      const res = transitionModule(state, 'auth', 'interviewing', {
        reason: 'Regresión por cambio de reglas en vista default',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.state.modules.auth.state).toBe('interviewing');
        const lastEntry = res.state.history[res.state.history.length - 1];
        expect(lastEntry.from).toBe('auth:consolidated');
        expect(lastEntry.to).toBe('auth:interviewing');
        expect(lastEntry.module).toBe('auth');
        expect(lastEntry.reason).toContain('Regresión');
      }
    });

    it('política de waivers: rechazar categoria "proposito"', () => {
      const res = validateCategoryWaiver({
        category: 'proposito',
        source: 'user',
        reason: 'Esta vista no tiene un propósito claro para el usuario',
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("La categoría 'proposito' no se puede renunciar");
    });

    it('política de waivers: exigir source "user"', () => {
      const res = validateCategoryWaiver({
        category: 'actor',
        source: 'dom',
        reason: 'El DOM no detecta restricciones de rol en esta vista',
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Todo waiver exige source 'user'");
    });

    it('política de waivers: exigir reason >= 15 caracteres tras trim', () => {
      const resShort = validateCategoryWaiver({
        category: 'actor',
        source: 'user',
        reason: 'No aplica    ', // 9 caracteres útiles tras trim
      });
      expect(resShort.valid).toBe(false);
      expect(resShort.error).toContain('al menos 15 caracteres');

      const resValid = validateCategoryWaiver({
        category: 'actor',
        source: 'user',
        reason: 'No existen roles diferenciados en esta vista pública',
      });
      expect(resValid.valid).toBe(true);
    });

    it('validateWaiversBatch debe rechazar el lote completo ante cualquier waiver inválido (atómico)', () => {
      const batch = [
        {
          category: 'actor' as RuleCategory,
          source: 'user',
          reason: 'No existen roles diferenciados en esta vista pública',
        },
        {
          category: 'proposito' as RuleCategory,
          source: 'user',
          reason: 'Intento de renunciar a propósito con razón larga',
        },
      ];

      const res = validateWaiversBatch(batch);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("La categoría 'proposito' no se puede renunciar");
    });
  });

  describe('E2: Compuerta canCloseModule', () => {
    it('debe rechazar el cierre si la cobertura no está completa', () => {
      const rules: RuleEntry[] = [
        { id: 'r1', description: 'desc', category: 'proposito', status: 'confirmed', source: 'user', view: 'default' },
      ];
      const applicable: RuleCategory[] = ['proposito', 'campo', 'accion'];
      const res = canCloseModule(rules, [], applicable, 'default');
      expect(res.passed).toBe(false);
      expect(res.reason).toContain('cobertura incompleta');
    });

    it('debe rechazar el cierre si hay reglas inferidas pendientes', () => {
      const rules: RuleEntry[] = [
        { id: 'r1', description: 'desc 1', category: 'proposito', status: 'confirmed', source: 'user', view: 'default' },
        { id: 'r2', description: 'desc 2', category: 'campo', status: 'confirmed', source: 'user', view: 'default' },
        { id: 'r3', description: 'desc 3', category: 'campo', status: 'inferred', source: 'dom', view: 'default' },
      ];
      const applicable: RuleCategory[] = ['proposito', 'campo'];
      const res = canCloseModule(rules, [], applicable, 'default');
      expect(res.passed).toBe(false);
      expect(res.reason).toContain('regla(s) inferida(s) pendiente(s)');
    });

    it('debe permitir el cierre cuando la cobertura es completa y hay 0 reglas inferidas pendientes', () => {
      const rules: RuleEntry[] = [
        { id: 'r1', description: 'desc 1', category: 'proposito', status: 'confirmed', source: 'user', view: 'default' },
        { id: 'r2', description: 'desc 2', category: 'campo', status: 'confirmed', source: 'user', view: 'default' },
      ];
      const applicable: RuleCategory[] = ['proposito', 'campo'];
      const res = canCloseModule(rules, [], applicable, 'default');
      expect(res.passed).toBe(true);
      expect(res.coverage.completa).toBe(true);
      expect(res.coverage.inferidas_pendientes).toBe(0);
    });
  });

  describe('E3: Compuerta canExitWorking y Reporte de Brechas', () => {
    it('canExitWorking debe fallar si session.plan está vacío (proyectos legacy)', () => {
      const res = canExitWorking({ id: 's1', started_at: '', plan: [] }, {});
      expect(res.passed).toBe(false);
      expect(res.reason).toContain('plan de sesión está vacío');
    });

    it('canExitWorking debe listar los módulos pendientes que no están closed ni waived', () => {
      const plan = [
        { module: 'auth', path: '/login', priority: 'high', status: 'closed' },
        { module: 'checkout', path: '/pay', priority: 'high', status: 'interviewing' },
      ];
      const modules = {
        auth: { state: 'closed' as const, updated_at: '' },
        checkout: { state: 'interviewing' as const, updated_at: '' },
      };

      const res = canExitWorking({ id: 's1', started_at: '', plan }, modules);
      expect(res.passed).toBe(false);
      expect(res.faltantes).toEqual([
        {
          modulo: 'checkout',
          estado: 'interviewing',
          campo: 'modules.checkout',
          motivo: "estado actual 'interviewing' no es terminal (closed o waived)",
        },
      ]);
    });

    it('canExitWorking debe fallar si un módulo waived no tiene waived_reason', () => {
      const plan = [{ module: 'admin', path: '/admin', priority: 'low', status: 'waived' }];
      const modules = {
        admin: { state: 'waived' as const, updated_at: '' },
      };

      const res = canExitWorking({ id: 's1', started_at: '', plan }, modules);
      expect(res.passed).toBe(false);
      expect(res.faltantes[0].estado).toContain('sin justificación');
    });

    it('canExitWorking debe aprobar cuando todos los módulos están closed o waived con reason', () => {
      const plan = [
        { module: 'auth', path: '/login', priority: 'high', status: 'closed' },
        { module: 'admin', path: '/admin', priority: 'low', status: 'waived' },
      ];
      const modules = {
        auth: { state: 'closed' as const, updated_at: '' },
        admin: {
          state: 'waived' as const,
          waived_reason: 'El módulo admin está fuera del alcance de este sprint',
          updated_at: '',
        },
      };

      const res = canExitWorking({ id: 's1', started_at: '', plan }, modules);
      expect(res.passed).toBe(true);
      expect(res.faltantes).toHaveLength(0);
    });

    it('generateSessionGapReport genera el reporte esperado y lista flujos críticos sin afirmar cobertura', () => {
      const md = generateSessionGapReport({
        sessionId: 'session_abc123',
        startedAt: '2026-09-30T10:00:00.000Z',
        closedAt: '2026-09-30T10:30:00.000Z',
        projectContext: {
          objective: 'Probar el flujo de compra y autenticación de la plataforma',
          roles: [{ name: 'cliente', description: 'Usuario que compra' }],
          critical_flows: [{ name: 'Checkout directo con tarjeta' }],
        },
        plan: [
          { module: 'auth', path: '/login', priority: 'high', status: 'closed' },
          { module: 'admin', path: '/admin', priority: 'low', status: 'waived' },
        ],
        modules: {
          auth: { state: 'closed', updated_at: '' },
          admin: {
            state: 'waived',
            waived_reason: 'Módulo reservado para fase 2',
            updated_at: '',
          },
        },
        moduleRules: {
          auth: {
            rules: [
              { id: 'R-001', description: 'Login obligatorio', category: 'proposito', status: 'confirmed', source: 'user' },
              { id: 'R-002', description: 'Botón Entrar', category: 'accion', status: 'confirmed', source: 'dom' },
              { id: 'R-003', description: 'Restricción de 2FA', category: 'actor', status: 'deferred', source: 'user' },
            ],
            category_waivers: [
              { view: 'default', category: 'sensibilidad', reason: 'No se manejan datos sensibles en esta vista' },
            ],
          },
          admin: {
            rules: [],
            category_waivers: [],
          },
        },
      });

      // Secciones
      expect(md).toContain('# Reporte de Brechas de Calidad - Sesión: session_abc123');
      expect(md).toContain('## Información de la Sesión');
      expect(md).toContain('## Contexto de Negocio');
      expect(md).toContain('## Resumen por Módulo');
      expect(md).toContain('## Brechas');

      // Flujos críticos listados sin afirmar cobertura
      expect(md).toContain('Checkout directo con tarjeta');
      expect(md).not.toContain('cobertura del flujo');
      expect(md).not.toContain('flujo cubierto');

      // Conteo de reglas por status y source
      expect(md).toContain('confirmed: 2');
      expect(md).toContain('deferred: 1');
      expect(md).toContain('user: 2');
      expect(md).toContain('dom: 1');

      // Brechas
      expect(md).toContain('### 1. Módulos Renunciados (Waived)');
      expect(md).toContain('**admin**: Módulo reservado para fase 2');

      expect(md).toContain('### 2. Waivers de Categoría Declarados');
      expect(md).toContain('**auth** [sensibilidad]: No se manejan datos sensibles en esta vista');

      expect(md).toContain('### 3. Reglas Pospuestas (Deferred)');
      expect(md).toContain('**auth** [R-003]: Restricción de 2FA');

      expect(md).toContain('### 4. Reglas Confirmadas Sin Validación de Usuario (Solo DOM/PRD)');
      expect(md).toContain('**auth** [R-002] (Fuente: dom): Botón Entrar');
    });
  });
});

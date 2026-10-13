import { describe, it, expect } from 'vitest';

import { generateSessionGapReport, computeSessionGapSummary } from '../gap-report.js';

describe('Criterio 5: Reporte de brechas dinámico sin textos fijos ("Ninguna")', () => {
  it('alcance de 3 flujos y 2 roles con 1 módulo y 1 flujo mapeado lista 2 flujos y 1 rol sin cubrir y nunca imprime "Ninguna"', () => {
    const reportParams = {
      sessionId: 'sess-dynamic-gap-test',
      startedAt: '2026-10-05T10:00:00.000Z',
      closedAt: '2026-10-05T10:30:00.000Z',
      projectContext: {
        objective: 'Sistema empresarial de auditoría y conciliación',
        roles: [
          { name: 'admin', description: 'Administrador general' },
          { name: 'auditor', description: 'Auditor contable' },
        ],
        critical_flows: [
          { name: 'login_flow', description: 'Inicio de sesión' },
          { name: 'conciliacion_flow', description: 'Conciliación bancaria' },
          { name: 'reportes_flow', description: 'Generación de reportes' },
        ],
      },
      plan: [
        {
          module: 'login_mod',
          path: '/login',
          priority: 'high',
          status: 'closed',
          flujos: ['login_flow'],
        },
      ],
      modules: {
        login_mod: {
          state: 'closed' as const,
          updated_at: '2026-10-05T10:25:00.000Z',
        },
      },
      moduleRules: {
        login_mod: {
          rules: [
            {
              id: 'r-login-1',
              category: 'proposito' as const,
              description: 'Permitir autenticación segura de usuarios en la plataforma',
              status: 'confirmed' as const,
              source: 'user_text' as const,
            },
          ],
        },
      },
      profiles: [
        {
          id: 'admin_prof',
          role: 'admin',
          verified: true,
        },
      ],
      discoveredRoutes: ['/login'],
    };

    const summary = computeSessionGapSummary(reportParams);
    expect(summary.flujos_cubiertos).toBe(1);
    expect(summary.flujos_totales).toBe(3);
    expect(summary.roles_verificados).toBe(1);
    expect(summary.roles_totales).toBe(2);
    expect(summary.cobertura_alcance).toBe('Cobertura del alcance declarado: 1 de 3 flujos, 1 de 2 roles');

    const report = generateSessionGapReport(reportParams);

    // Encabezado
    expect(report).toContain('Cobertura del alcance declarado: 1 de 3 flujos, 1 de 2 roles');

    // Lista 2 flujos sin cubrir
    expect(report).toContain('conciliacion_flow');
    expect(report).toContain('reportes_flow');
    expect(report).toContain('Flujo crítico declarado sin módulo ni reglas asociados');

    // Lista 1 rol sin cubrir
    expect(report).toContain('auditor');
    expect(report).toContain('Rol declarado en el contexto sin perfil de autenticación verificado');

    // Nunca imprime "Ninguna"
    expect(report).not.toContain('Ninguna');
    expect(report).not.toContain('ninguna');
  });
});

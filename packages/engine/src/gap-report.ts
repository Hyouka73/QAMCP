/**
 * QAP Session Gap Report Generator (E3)
 *
 * Función 100 % pura y determinista para generar el reporte de brechas
 * al cerrar una sesión de trabajo (WORKING -> WRAP_UP).
 *
 * Ubicado en @qap/engine sin dependencias de I/O.
 */

import type { RuleEntry, CategoryWaiver, ModuleStateInfo } from '@qap/shared';

export interface SessionGapReportParams {
  sessionId: string;
  startedAt: string;
  closedAt: string;
  projectContext?: {
    objective?: string;
    roles?: Array<{ name: string; description?: string } | string>;
    critical_flows?: Array<{ name: string; description?: string } | string>;
  } | null;
  plan: Array<{ module: string; path: string; priority: string; status: string }>;
  modules: Record<string, ModuleStateInfo>;
  moduleRules: Record<string, { rules?: RuleEntry[]; category_waivers?: CategoryWaiver[] }>;
}

export function generateSessionGapReport(params: SessionGapReportParams): string {
  const { sessionId, startedAt, closedAt, projectContext, plan, modules, moduleRules } = params;

  const lines: string[] = [];

  lines.push(`# Reporte de Brechas de Calidad - Sesión: ${sessionId}`);
  lines.push('');
  lines.push('## Información de la Sesión');
  lines.push(`- **ID de Sesión**: ${sessionId}`);
  lines.push(`- **Inicio**: ${startedAt}`);
  lines.push(`- **Cierre**: ${closedAt}`);
  lines.push('');

  lines.push('## Contexto de Negocio');
  lines.push(`- **Objetivo**: ${projectContext?.objective || 'No especificado'}`);

  lines.push('- **Roles de Usuario**:');
  const roles = projectContext?.roles || [];
  if (roles.length === 0) {
    lines.push('  - (No declarados)');
  } else {
    for (const r of roles) {
      const rName = typeof r === 'string' ? r : r.name;
      const rDesc = typeof r === 'object' && r.description ? ` - ${r.description}` : '';
      lines.push(`  - ${rName}${rDesc}`);
    }
  }

  // E3: Listar flujos críticos sin afirmar cobertura por flujo
  lines.push('- **Flujos Críticos**:');
  const flows = projectContext?.critical_flows || [];
  if (flows.length === 0) {
    lines.push('  - (No declarados)');
  } else {
    for (const f of flows) {
      const fName = typeof f === 'string' ? f : f.name;
      const fDesc = typeof f === 'object' && f.description ? ` - ${f.description}` : '';
      lines.push(`  - ${fName}${fDesc}`);
    }
  }
  lines.push('');

  lines.push('## Resumen por Módulo');

  const waivedModulesList: Array<{ module: string; reason: string }> = [];
  const allWaiversList: Array<{ module: string; category: string; reason: string }> = [];
  const allDeferredRules: Array<{ module: string; id: string; description: string; category?: string }> = [];
  const nonUserConfirmedRules: Array<{ module: string; id: string; description: string; source: string; category?: string }> = [];

  for (const item of plan) {
    const modName = item.module;
    const modInfo = modules[modName];
    const modState = modInfo?.state || 'desconocido';
    const rulesData = moduleRules[modName] || {};
    const rules = rulesData.rules || [];
    const waivers = rulesData.category_waivers || [];

    if (modState === 'waived') {
      waivedModulesList.push({
        module: modName,
        reason: modInfo?.waived_reason || 'Sin justificación',
      });
    }

    for (const w of waivers) {
      allWaiversList.push({
        module: modName,
        category: w.category,
        reason: w.reason,
      });
    }

    const rulesByStatus: Record<string, number> = {
      confirmed: 0,
      rejected: 0,
      deferred: 0,
      inferred: 0,
    };

    const rulesBySource: Record<string, number> = {
      user: 0,
      dom: 0,
      prd: 0,
    };

    for (const r of rules) {
      const s = r.status || 'inferred';
      rulesByStatus[s] = (rulesByStatus[s] || 0) + 1;

      const src = r.source || 'dom';
      rulesBySource[src] = (rulesBySource[src] || 0) + 1;

      if (r.status === 'deferred') {
        allDeferredRules.push({
          module: modName,
          id: r.id,
          description: r.description,
          category: r.category,
        });
      }

      if (r.status === 'confirmed' && (r.source === 'dom' || r.source === 'prd')) {
        nonUserConfirmedRules.push({
          module: modName,
          id: r.id,
          description: r.description,
          source: r.source,
          category: r.category,
        });
      }
    }

    lines.push(`### Módulo: ${modName}`);
    lines.push(`- **Ruta**: ${item.path} (Prioridad: ${item.priority})`);
    lines.push(
      `- **Estado final**: ${modState}${
        modState === 'waived' && modInfo?.waived_reason ? ` (Razón: ${modInfo.waived_reason})` : ''
      }`
    );
    lines.push('- **Reglas por Status**:');
    lines.push(`  - confirmed: ${rulesByStatus.confirmed}`);
    lines.push(`  - rejected: ${rulesByStatus.rejected}`);
    lines.push(`  - deferred: ${rulesByStatus.deferred}`);
    lines.push(`  - inferred: ${rulesByStatus.inferred}`);
    lines.push('- **Reglas por Source**:');
    lines.push(`  - user: ${rulesBySource.user}`);
    lines.push(`  - dom: ${rulesBySource.dom}`);
    lines.push(`  - prd: ${rulesBySource.prd}`);

    lines.push('- **Waivers de Categoría**:');
    if (waivers.length === 0) {
      lines.push('  - (Ninguno)');
    } else {
      for (const w of waivers) {
        lines.push(`  - [${w.category}] ${w.reason}`);
      }
    }

    lines.push('- **Reglas Pospuestas (Deferred)**:');
    const modDeferred = rules.filter((r) => r.status === 'deferred');
    if (modDeferred.length === 0) {
      lines.push('  - (Ninguna)');
    } else {
      for (const d of modDeferred) {
        lines.push(`  - [${d.id}] ${d.description}`);
      }
    }
    lines.push('');
  }

  lines.push('## Brechas');

  lines.push('### 1. Módulos Renunciados (Waived)');
  if (waivedModulesList.length === 0) {
    lines.push('- (Ninguno)');
  } else {
    for (const w of waivedModulesList) {
      lines.push(`- **${w.module}**: ${w.reason}`);
    }
  }
  lines.push('');

  lines.push('### 2. Waivers de Categoría Declarados');
  if (allWaiversList.length === 0) {
    lines.push('- (Ninguno)');
  } else {
    for (const w of allWaiversList) {
      lines.push(`- **${w.module}** [${w.category}]: ${w.reason}`);
    }
  }
  lines.push('');

  lines.push('### 3. Reglas Pospuestas (Deferred)');
  if (allDeferredRules.length === 0) {
    lines.push('- (Ninguna)');
  } else {
    for (const d of allDeferredRules) {
      lines.push(`- **${d.module}** [${d.id}]: ${d.description}`);
    }
  }
  lines.push('');

  lines.push('### 4. Reglas Confirmadas Sin Validación de Usuario (Solo DOM/PRD)');
  if (nonUserConfirmedRules.length === 0) {
    lines.push('- (Ninguna)');
  } else {
    for (const r of nonUserConfirmedRules) {
      lines.push(`- **${r.module}** [${r.id}] (Fuente: ${r.source}): ${r.description}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

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
  plan: Array<{ module: string; path: string; priority: string; status: string; flujos?: string[] }>;
  modules: Record<string, ModuleStateInfo & { accepted_gaps?: { accepted?: boolean; reason?: string; sustantivas?: number; total_aplicables?: number; accepted_at?: string } }>;
  moduleRules: Record<string, { rules?: RuleEntry[]; category_waivers?: CategoryWaiver[] }>;
  profiles?: Array<{ id: string; role?: string; verified?: boolean }>;
  discoveredRoutes?: string[];
}

export interface SessionGapSummary {
  flujos_cubiertos: number;
  flujos_totales: number;
  roles_verificados: number;
  roles_totales: number;
  modulos_cerrados: number;
  modulos_totales: number;
  cobertura_alcance: string;
}

export function computeSessionGapSummary(params: SessionGapReportParams): SessionGapSummary {
  const declaredFlows = (params.projectContext?.critical_flows || [])
    .map((f) => (typeof f === 'string' ? f : f.name))
    .filter(Boolean);
  const totalFlows = declaredFlows.length;

  const coveredFlowsSet = new Set<string>();
  for (const f of declaredFlows) {
    const fNorm = f.trim().toLowerCase();
    const hasAssociated = params.plan.some((p) => {
      const rules = params.moduleRules[p.module]?.rules || [];
      const hasRules = rules.length > 0;
      const explicitFlow = Array.isArray(p.flujos) && p.flujos.some((fl) => fl.trim().toLowerCase() === fNorm);
      const nameMatch = p.module.trim().toLowerCase() === fNorm;
      return (explicitFlow || nameMatch) && hasRules;
    });
    if (hasAssociated) {
      coveredFlowsSet.add(f);
    }
  }

  const declaredRoles = (params.projectContext?.roles || [])
    .map((r) => (typeof r === 'string' ? r : r.name))
    .filter(Boolean);
  const totalRoles = declaredRoles.length;

  const verifiedRolesSet = new Set<string>();
  for (const r of declaredRoles) {
    const rNorm = r.trim().toLowerCase();
    const isVerified = (params.profiles || []).some((p) => {
      const match = (p.role && p.role.trim().toLowerCase() === rNorm) || (p.id && p.id.trim().toLowerCase() === rNorm);
      return match && p.verified === true;
    });
    if (isVerified) {
      verifiedRolesSet.add(r);
    }
  }

  const closedModulesCount = params.plan.filter(
    (p) => params.modules[p.module]?.state === 'closed' || params.modules[p.module]?.state === 'waived'
  ).length;

  return {
    flujos_cubiertos: coveredFlowsSet.size,
    flujos_totales: totalFlows,
    roles_verificados: verifiedRolesSet.size,
    roles_totales: totalRoles,
    modulos_cerrados: closedModulesCount,
    modulos_totales: params.plan.length,
    cobertura_alcance: `Cobertura del alcance declarado: ${coveredFlowsSet.size} de ${totalFlows} flujos, ${verifiedRolesSet.size} de ${totalRoles} roles`,
  };
}

export function generateSessionGapReport(params: SessionGapReportParams): string {
  const { sessionId, startedAt, closedAt, projectContext, plan, modules, moduleRules, profiles, discoveredRoutes } = params;

  const summary = computeSessionGapSummary(params);
  const lines: string[] = [];

  lines.push(`# Reporte de Brechas de Calidad - Sesión: ${sessionId}`);
  lines.push('');
  lines.push(`## ${summary.cobertura_alcance}`);
  lines.push('');
  lines.push('## Información de la Sesión');
  lines.push(`- **ID de Sesión**: ${sessionId}`);
  lines.push(`- **Inicio**: ${startedAt}`);
  lines.push(`- **Cierre**: ${closedAt}`);
  lines.push(`- **Cobertura del Alcance**: ${summary.cobertura_alcance}`);
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
  const agentRulesList: Array<{ module: string; id: string; description: string; category?: string }> = [];

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
      user_text: 0,
      user_confirmed: 0,
      dom: 0,
      prd: 0,
      agent: 0,
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

      if (r.source === 'agent') {
        agentRulesList.push({
          module: modName,
          id: r.id,
          description: r.description,
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
    lines.push(`  - user: ${rulesBySource.user + rulesBySource.user_text + rulesBySource.user_confirmed}`);
    lines.push(`  - dom: ${rulesBySource.dom}`);
    lines.push(`  - prd: ${rulesBySource.prd}`);
    if (rulesBySource.agent > 0) {
      lines.push(`  - agent: ${rulesBySource.agent}`);
    }

    lines.push('- **Waivers de Categoría**:');
    if (waivers.length === 0) {
      lines.push('  - (Sin waivers)');
    } else {
      for (const w of waivers) {
        lines.push(`  - [${w.category}] ${w.reason}`);
      }
    }

    lines.push('- **Reglas Pospuestas (Deferred)**:');
    const modDeferred = rules.filter((r) => r.status === 'deferred');
    if (modDeferred.length === 0) {
      lines.push('  - (Sin reglas pospuestas)');
    } else {
      for (const d of modDeferred) {
        lines.push(`  - [${d.id}] ${d.description}`);
      }
    }
    lines.push('');
  }

  lines.push('## Brechas');

  // 1. Módulos Renunciados
  lines.push('### 1. Módulos Renunciados (Waived)');
  if (waivedModulesList.length === 0) {
    lines.push('- (Sin módulos renunciados)');
  } else {
    for (const w of waivedModulesList) {
      lines.push(`- **${w.module}**: ${w.reason}`);
    }
  }
  lines.push('');

  // 2. Waivers de Categoría
  lines.push('### 2. Waivers de Categoría Declarados');
  if (allWaiversList.length === 0) {
    lines.push('- (Sin waivers declarados)');
  } else {
    for (const w of allWaiversList) {
      lines.push(`- **${w.module}** [${w.category}]: ${w.reason}`);
    }
  }
  lines.push('');

  // 3. Reglas Pospuestas
  lines.push('### 3. Reglas Pospuestas (Deferred)');
  if (allDeferredRules.length === 0) {
    lines.push('- (Sin reglas pospuestas)');
  } else {
    for (const d of allDeferredRules) {
      lines.push(`- **${d.module}** [${d.id}]: ${d.description}`);
    }
  }
  lines.push('');

  // 4. Reglas Confirmadas sin validación
  lines.push('### 4. Reglas Confirmadas Sin Validación de Usuario (Solo DOM/PRD)');
  if (nonUserConfirmedRules.length === 0) {
    lines.push('- (Sin reglas automáticas confirmadas)');
  } else {
    for (const r of nonUserConfirmedRules) {
      lines.push(`- **${r.module}** [${r.id}] (Fuente: ${r.source}): ${r.description}`);
    }
  }
  lines.push('');

  // 5. Flujos críticos sin módulo ni reglas
  lines.push('### 5. Flujos Críticos Declarados Sin Módulo ni Reglas Asociados');
  const declaredFlowsList = (projectContext?.critical_flows || [])
    .map((f) => (typeof f === 'string' ? f : f.name))
    .filter(Boolean);
  const uncoveredFlowsList = declaredFlowsList.filter((f) => {
    const fNorm = f.trim().toLowerCase();
    const hasAssociated = plan.some((p) => {
      const rules = moduleRules[p.module]?.rules || [];
      const hasRules = rules.length > 0;
      const explicitFlow = Array.isArray(p.flujos) && p.flujos.some((fl) => fl.trim().toLowerCase() === fNorm);
      const nameMatch = p.module.trim().toLowerCase() === fNorm;
      return (explicitFlow || nameMatch) && hasRules;
    });
    return !hasAssociated;
  });

  if (uncoveredFlowsList.length === 0) {
    lines.push('- Todos los flujos declarados cuentan con módulo y reglas asociados');
  } else {
    for (const uf of uncoveredFlowsList) {
      lines.push(`- **${uf}**: Flujo crítico declarado sin módulo ni reglas asociados en esta sesión`);
    }
  }
  lines.push('');

  // 6. Roles declarados sin perfil verificado
  lines.push('### 6. Roles Declarados Sin Perfil Verificado');
  const declaredRolesList = (projectContext?.roles || [])
    .map((r) => (typeof r === 'string' ? r : r.name))
    .filter(Boolean);
  const unverifiedRolesList = declaredRolesList.filter((r) => {
    const rNorm = r.trim().toLowerCase();
    const isVerified = (profiles || []).some((p) => {
      const match = (p.role && p.role.trim().toLowerCase() === rNorm) || (p.id && p.id.trim().toLowerCase() === rNorm);
      return match && p.verified === true;
    });
    return !isVerified;
  });

  if (unverifiedRolesList.length === 0) {
    lines.push('- Todos los roles declarados cuentan con perfil verificado');
  } else {
    for (const ur of unverifiedRolesList) {
      lines.push(`- **${ur}**: Rol declarado en el contexto sin perfil de autenticación verificado`);
    }
  }
  lines.push('');

  // 7. Módulos del plan sin cerrar
  lines.push('### 7. Módulos del Plan Sin Cerrar');
  const unclosedModules = plan.filter(
    (p) => modules[p.module]?.state !== 'closed' && modules[p.module]?.state !== 'waived'
  );
  if (unclosedModules.length === 0) {
    lines.push('- Todos los módulos planificados están cerrados o renunciados formalmente');
  } else {
    for (const um of unclosedModules) {
      lines.push(`- **${um.module}**: Estado actual '${modules[um.module]?.state || 'planned'}' en ruta '${um.path}'`);
    }
  }
  lines.push('');

  // 8. Rutas detectadas fuera del plan
  lines.push('### 8. Rutas Detectadas Fuera del Plan');
  const planPaths = new Set(plan.map((p) => p.path));
  const routesOutside = (discoveredRoutes || []).filter((r) => r && !planPaths.has(r));
  if (routesOutside.length === 0) {
    lines.push('- Todas las rutas detectadas forman parte del plan de sesión');
  } else {
    for (const ro of routesOutside) {
      lines.push(`- Ruta fuera del plan: ${ro}`);
    }
  }
  lines.push('');

  // 9. Módulos cerrados con brechas aceptadas
  lines.push('### 9. Módulos Cerrados con Brechas Aceptadas');
  const acceptedGapsList = Object.entries(modules).filter(
    ([, m]) => m?.accepted_gaps?.accepted === true
  );
  if (acceptedGapsList.length === 0) {
    lines.push('- Ningún módulo fue cerrado con brechas aceptadas');
  } else {
    for (const [mName, mInfo] of acceptedGapsList) {
      const ag = mInfo.accepted_gaps!;
      lines.push(`- **${mName}**: Justificación: "${ag.reason}" (${ag.sustantivas ?? 0} de ${ag.total_aplicables ?? 0} categorías sustantivas)`);
    }
  }
  lines.push('');

  // 10. Reglas con source agent
  lines.push('### 10. Reglas con Procedencia de Agente (Source: agent)');
  if (agentRulesList.length === 0) {
    lines.push('- No existen reglas inferidas por el agente sin validación de usuario');
  } else {
    for (const ar of agentRulesList) {
      lines.push(`- **${ar.module}** [${ar.id}]: ${ar.description}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

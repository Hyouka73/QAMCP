import type {
  ModuleCandidatesFile,
  ModuleCandidate,
  ProjectRepoMap,
  ProposedModuleCandidate,
} from '@qap/shared';

export interface CandidateGeneratorOptions {
  rawDocContent: string;
  proposedCandidates?: ProposedModuleCandidate[];
  repoMap?: ProjectRepoMap | null;
  criticalFlows?: Array<{ name: string; priority?: string } | string>;
}

export interface FlujoDescartadoInfo {
  candidato: string;
  flujo: string;
  razon: string;
}

export interface CandidateGenerationResult {
  candidatesFile: ModuleCandidatesFile;
  rejectedCandidates: Array<{
    nombre: string;
    razon: string;
  }>;
  flujos_descartados: FlujoDescartadoInfo[];
}

export function normalizeEvidence(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function calculateVocabularyOverlap(aTokens: string[], bTokens: string[]): number {
  if (aTokens.length === 0 || bTokens.length === 0) return 0;
  const aSet = new Set(aTokens);
  const common = bTokens.filter((token) => aSet.has(token)).length;
  return common / Math.max(1, Math.min(aTokens.length, bTokens.length));
}

export function generateModuleCandidates(
  options: CandidateGeneratorOptions
): CandidateGenerationResult {
  const { rawDocContent, proposedCandidates = [], repoMap, criticalFlows = [] } = options;

  const normDoc = normalizeEvidence(rawDocContent || '');
  const rejectedCandidates: Array<{ nombre: string; razon: string }> = [];
  const flujosDescartados: FlujoDescartadoInfo[] = [];
  const processedDocCandidates: ModuleCandidate[] = [];

  // Extraer nombres válidos de flujos críticos del contexto
  const validFlowSet = new Set<string>();
  const highPriorityFlowSet = new Set<string>();
  for (const cf of criticalFlows) {
    const name = typeof cf === 'string' ? cf.trim() : (cf?.name ? String(cf.name).trim() : '');
    if (name) {
      validFlowSet.add(name);
      if (typeof cf === 'object' && cf !== null) {
        const p = String((cf as { priority?: string }).priority || '').toLowerCase();
        if (p === 'high' || p === 'alta') {
          highPriorityFlowSet.add(name);
        }
      }
    }
  }

  const allRepoRoutes = repoMap?.rutas || [];
  const matchedRoutePaths = new Set<string>();

  let idCounter = 1;

  for (const proposed of proposedCandidates) {
    const rawName = String(proposed.nombre || '').trim();
    if (!rawName) continue;

    // 1. Verificación obligatoria de evidencia en el texto del documento (M23)
    const rawEvidence = String(proposed.evidence || '').trim();
    const normEv = normalizeEvidence(rawEvidence);

    if (!normEv || !normDoc.includes(normEv)) {
      rejectedCandidates.push({
        nombre: rawName,
        razon: 'evidencia_no_encontrada_en_documento',
      });
      continue;
    }

    // 2. Filtrado de flujos críticos: descartar flujos inexistentes en el contexto (M25)
    const rawFlows = Array.isArray(proposed.flujos) ? proposed.flujos : [];
    const filteredFlows: string[] = [];
    for (const f of rawFlows) {
      const fTrimmed = String(f).trim();
      if (!fTrimmed) continue;
      if (validFlowSet.has(fTrimmed)) {
        filteredFlows.push(fTrimmed);
      } else {
        flujosDescartados.push({
          candidato: rawName,
          flujo: fTrimmed,
          razon: 'flujo_no_encontrado_en_contexto',
        });
      }
    }

    // 3. Fusión determinista con rutas del repo-map (M24: NUNCA inventar ruta desde el nombre)
    let assignedPath: string | null = null;
    let confianza: 'alta' | 'media' | 'baja' = 'baja';
    const fuentes: Array<'doc' | 'repo'> = ['doc'];

    // Coincidencia exacta por ruta_hint
    if (proposed.ruta_hint) {
      const hint = proposed.ruta_hint.trim().toLowerCase();
      const exactMatch = allRepoRoutes.find(
        (r) => r.path.toLowerCase() === hint
      );
      if (exactMatch) {
        assignedPath = exactMatch.path;
        confianza = 'alta';
        fuentes.push('repo');
        matchedRoutePaths.add(exactMatch.path);
      }
    }

    // Si no hubo coincidencia exacta, buscar por solapamiento léxico de tokens (>= 60%)
    if (!assignedPath && allRepoRoutes.length > 0) {
      const nameTokens = tokenize(rawName);
      let bestRoute: string | null = null;
      let highestOverlap = 0;

      for (const route of allRepoRoutes) {
        const routeTokens = tokenize(route.path);
        const overlap = calculateVocabularyOverlap(nameTokens, routeTokens);
        if (overlap >= 0.6 && overlap > highestOverlap) {
          highestOverlap = overlap;
          bestRoute = route.path;
        }
      }

      if (bestRoute) {
        assignedPath = bestRoute;
        confianza = 'media';
        fuentes.push('repo');
        matchedRoutePaths.add(bestRoute);
      }
    }

    // Sin coincidencia: ruta queda null (M24 garantiza que nunca se inventa)
    if (!assignedPath) {
      assignedPath = null;
      confianza = filteredFlows.length > 0 ? 'media' : 'baja';
    }

    const candidateId = `cand_${idCounter++}`;

    processedDocCandidates.push({
      id: candidateId,
      nombre: rawName,
      ruta: assignedPath,
      fuentes,
      flujos: filteredFlows,
      confianza,
      evidencia: rawEvidence,
    });
  }

  // 4. Agregar rutas restantes de repo-map (sin parámetros dinámicos ni auth) como candidatos repo-only
  const repoOnlyCandidates: ModuleCandidate[] = [];
  for (const r of allRepoRoutes) {
    if (matchedRoutePaths.has(r.path)) continue;
    // Omitir rutas parametrizadas, comodines o de auth/login/acceso/404 (C4)
    if (
      r.path.includes(':') ||
      r.path.includes('*') ||
      r.path === '/' ||
      /auth|login|signin|register|signup|logout|acceso|404|not-found/i.test(r.path)
    ) {
      continue;
    }

    const cleanName = r.path
      .replace(/^\//, '')
      .replace(/\/+/g, ' ')
      .replace(/[-_]/g, ' ')
      .trim();

    if (!cleanName) continue;

    repoOnlyCandidates.push({
      id: `cand_${idCounter++}`,
      nombre: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      ruta: r.path,
      fuentes: ['repo'],
      flujos: [],
      confianza: 'baja',
      evidencia: `Ruta descubierta en escaneo de código: ${r.archivo}`,
    });
  }

  // 5. Orden determinista:
  // - Mayor cantidad de flujos de prioridad alta cubiertos
  // - Mayor cantidad de flujos críticos totales cubiertos
  // - Confianza: alta > media > baja
  // - Nombre alfabético
  const confidenceScore: Record<'alta' | 'media' | 'baja', number> = {
    alta: 3,
    media: 2,
    baja: 1,
  };

  const allCandidates = [...processedDocCandidates, ...repoOnlyCandidates];
  allCandidates.sort((a, b) => {
    const aHigh = a.flujos.filter((f) => highPriorityFlowSet.has(f)).length;
    const bHigh = b.flujos.filter((f) => highPriorityFlowSet.has(f)).length;
    if (bHigh !== aHigh) {
      return bHigh - aHigh;
    }
    if (b.flujos.length !== a.flujos.length) {
      return b.flujos.length - a.flujos.length;
    }
    const confDiff = confidenceScore[b.confianza] - confidenceScore[a.confianza];
    if (confDiff !== 0) {
      return confDiff;
    }
    return a.nombre.localeCompare(b.nombre);
  });

  // Cap de 12 elementos
  const cappedCandidates = allCandidates.slice(0, 12);

  return {
    candidatesFile: {
      _version: '1.0.0',
      candidates: cappedCandidates,
    },
    rejectedCandidates,
    flujos_descartados: flujosDescartados,
  };
}

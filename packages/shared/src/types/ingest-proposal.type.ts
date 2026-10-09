export interface ProposedCriticalFlow {
  name: string;
  evidence?: string;
}

export interface ProposedModuleCandidate {
  nombre: string;
  ruta_hint?: string;
  flujos?: string[];
  evidence: string;
}

export interface IngestProposal {
  objetivo?: string;
  roles?: string[];
  flujos_criticos?: ProposedCriticalFlow[];
  rutas?: string[];
  riesgos?: string[];
  modulos_candidatos?: ProposedModuleCandidate[];
}

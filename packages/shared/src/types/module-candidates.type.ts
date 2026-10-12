export type CandidateConfidence = 'alta' | 'media' | 'baja';
export type CandidateSource = 'doc' | 'repo';

export interface ModuleCandidate {
  id: string;
  nombre: string;
  ruta: string | null;
  fuentes: CandidateSource[];
  flujos: string[];
  confianza: CandidateConfidence;
  evidencia: string;
}

export interface ModuleCandidatesFile {
  _version: string;
  candidates: ModuleCandidate[];
}

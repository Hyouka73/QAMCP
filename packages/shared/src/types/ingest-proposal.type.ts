export interface ProposedCriticalFlow {
  name: string;
  evidence?: string;
}

export interface IngestProposal {
  objetivo?: string;
  roles?: string[];
  flujos_criticos?: ProposedCriticalFlow[];
  rutas?: string[];
  riesgos?: string[];
}

export interface ScanDocumento {
  path: string;
  nombre: string;
  es_ingerible: boolean;
  tamano_bytes: number;
  ranking?: number;
}

export interface ScanSubproyecto {
  path: string;
  name: string;
  framework: string;
}

export interface ScanServicio {
  url: string;
  label: string;
  evidencia: string;
}

export interface ProjectScan {
  _version: string;
  scanned_at: string;
  workspace_root: string;
  documentos: ScanDocumento[];
  subproyectos: ScanSubproyecto[];
  servicios: ScanServicio[];
  package_json?: {
    name?: string;
    description?: string;
  };
}

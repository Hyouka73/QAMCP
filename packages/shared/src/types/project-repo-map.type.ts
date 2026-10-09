export interface ProjectRoute {
  path: string;
  archivo: string;
  linea: number;
  framework: string;
  requiere_sesion: boolean | null;
  roles: string[];
}

export interface ProjectRepoMap {
  _version: string;
  subproyectos: Array<{
    path: string;
    name: string;
    framework: string;
  }>;
  rutas: ProjectRoute[];
  advertencias: string[];
}

export interface QapConfig {
  projectName: string;
  environments: string[];
  createdAt: string;
}

export interface InitOptions {
  config?: string; // Ruta al archivo JSON para el modo silencioso
}
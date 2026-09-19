import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Obtiene el contenido HTML de la aplicación web interactiva del Knowledge Graph.
 * Intenta leerlo del archivo local o usa el fallback incorporado.
 */
export function getTemplateHtml(): string {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const candidatePaths = [
      join(currentDir, 'index.html'),
      join(currentDir, 'template', 'index.html'),
      join(currentDir, '..', 'src', 'template', 'index.html'),
    ];

    for (const p of candidatePaths) {
      if (existsSync(p)) {
        return readFileSync(p, 'utf-8');
      }
    }
  } catch {
    // Si falla la resolución de rutas en tiempo de ejecución, continuar al fallback
  }

  // Fallback si no se encuentra el archivo en disco (p.ej. ejecución empaquetada)
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>QAP Knowledge Graph</title>
</head>
<body style="background:#0b0f19;color:#fff;font-family:sans-serif;padding:40px;text-align:center;">
  <h2>QAP Knowledge Graph & Memory Viewer</h2>
  <p>Cargando datos desde /api/graph...</p>
</body>
</html>`;
}

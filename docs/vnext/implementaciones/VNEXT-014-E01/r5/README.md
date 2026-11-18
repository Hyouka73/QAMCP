# Evidencia E01-R5

SHA ejecutado `9e9d2c8062b908d936ae090bbe9cb5c4ca2b0772`. Informe: [E01-R5](../INFORME_E01_R5_2026-11-06.md).

`run.ps1` ejecuta una corrida y conserva manifiesto/log/JSON. `parallel.ps1` ejecuta dos completas consecutivas con muestreo externo de recursos. No usan retries ni skips. `prepare-observer.mjs` deriva el observer E01 existente sin cambiar tests; el config documental instala probes solo en los ocho archivos afectados. No ejecutar dos campañas completas simultáneas.

Regeneración de agregaciones, desde la raíz del repositorio:

```powershell
node docs/vnext/implementaciones/VNEXT-014-E01/r5/analyze.mjs
node docs/vnext/implementaciones/VNEXT-014-E01/r5/inventory.mjs
node docs/vnext/implementaciones/VNEXT-014-E01/r5/stages.mjs
node docs/vnext/implementaciones/VNEXT-014-E01/r5/finalize.mjs
```

Los analizadores agregan los nombres de corrida entregados; nuevas reproducciones con otro nombre conservan sus propios JSON/manifiestos. Los JSON normalizan rutas personales y los logs conservan orden/líneas y mensajes. Los fullNames, resultados, tiempos y PID se mantienen. Los JSONL contienen etapas/tiempos/códigos y nombres de prueba, sin argumentos MCP ni material de sesión; están comprimidos con gzip y verificación de descompresión idéntica. `stages.mjs` lee ambos formatos. El índice conserva SHA-256 y bytes de cada artefacto, y de las trazas descomprimidas; no se incluyen contenidos ni hashes del archivo personal protegido.

Los scripts diagnósticos guardan sus salidas bajo esta evidencia; Vitest y los fixtures conservan sus propias cachés y temporales. `finalize.mjs` elimina únicamente cada JSONL local después de verificar su copia gzip, sin borrado recursivo. Los binarios/rutas del comando se resuelven de nuevo al reproducir; los marcadores `<repo>/<temp>/<user-home>` del manifiesto publicado son sanitización documental.

# AS-04 · Estado de integración

**PR en borrador.** Base verificada `77a9c4f3769784df40a17d5d19bd7c83a45f0c89`. Referencias de trabajo: Gemini Neon, «Cierre arquitectónico de AS-04 tras PoC» y «Enmienda Final de Cierre Arquitectónico · AS-04», y el PoC de Codex sobre Chromium. Este cambio conserva las separaciones entre autorización, controles técnicos, declaraciones del propietario y riesgos no verificables.

## Resultado que bloquea el cambio de capturador

En Chromium 153 y Playwright 1.63, el fixture `same-document` cambia a una vista de MFA sin hacer una solicitud HTTP. La guarda CDP `Fetch` recibe la navegación inicial y no recibe la transición. FFmpeg encuentra el canario visual en el WebM. El caso automatizado pasa al reproducir ese resultado. La garantía de exclusión previa al primer cuadro falla con una guarda de red sola.

El runner actual no proporciona un mecanismo de admisión previo a la renderización para los cambios del mismo documento. Para integrar el nuevo controlador, el host debe aportar una garantía de exclusión previa al render o mantener la captura detenida durante cada intervalo en que esa garantía no esté disponible. Los avisos de URL o DOM posteriores y el borrado del segmento sirven para descartar evidencia, pero no satisfacen por sí solos la prevención de captura. Se necesita cobertura de documentos secundarios y cambios de superficie, incluidos popups y iframes fuera del proceso principal. La prueba nueva usa dos orígenes locales por puerto, sin verificar el aislamiento de procesos de iframe.

## Alcance comprobado

- Los tipos y el esquema representan tres modos, custodia y estados visuales separados del resultado funcional. Los generadores HTML y Markdown muestran la supresión. Los resultados históricos conservan el contrato previo.
- `UnifiedCaptureController` produce candidatos WebM auténticos, PNG y ZIP bajo una concesión de fixture. Inicia el WebM antes de la traza con geometría igualada, registra offsets por paso y descarta candidatos al revocar o cancelar. La prueba de login/MFA y rol usa contextos nuevos del fixture. El runner de producción conserva sus capturadores y su flujo actual hasta comprobar la admisión.
- La prueba utiliza staging de directorio restringido al SID de usuario en Windows. Quedan pendientes la reubicación efectiva de todos los perfiles y temporales de Playwright/Chromium en un proceso aislado, y su limpieza tras matar el proceso durante grabación. La eliminación verificada es lógica.
- El coordinador de publicación aislado verifica nombres, manifiesto y hashes y usa el commit SQLite como punto de confirmación. Dos procesos de recuperación conservaron el intento confirmado y descartaron el anterior al commit. Un manifiesto alterado marcó la publicación degradada y preservó la fila. Los fallos durante la eliminación de staging y el vínculo con las tablas de intentos MCP siguen pendientes.
- El adaptador de reproducción descifra segmentos cifrados con AES-256-GCM en memoria y devuelve rangos HTTP desde un identificador resuelto por el catálogo de prueba. La prueba reproduce WebM real y comprueba revocación antes de la carga y después del descifrado. El visor de producción todavía carece de integración con la autoridad y el catálogo requeridos por AS-01. AS-03 sigue siendo dependiente para la autoridad de secretos y sesiones.
- `PRIVATE_AUTHORIZED` queda bloqueado. El cifrado post-sellado no protege los bytes que el codificador escribe durante la grabación. La activación exigirá ratificación y verificación fail-closed del cifrado del volumen real que contiene staging y temporales. Las pruebas de reproducción privada se ejecutan con una ruta HTTP de loopback exclusiva del fixture. No crean una ruta de producción ni cambian las exportaciones.

## Verificación local

Entorno Windows x64, Node 24.15.0, SQLite 3.51.3, Playwright 1.63.0, Chromium 153.0.8010.12, FFmpeg y FFprobe 9.0.2. No se utiliza la opción `fps` de Playwright 1.64. Suite del runner desde `packages/playwright-runner`:

```shell
pnpm exec vitest run src/__tests__/as04-unified-capture-chromium.test.ts src/__tests__/as04-publication.test.ts src/__tests__/publication-crash.test.ts --pool=forks
```

Suite del reporter desde `packages/reporter`:

```shell
pnpm exec vitest run src/__tests__/as04-private-media.test.ts src/__tests__/html-report.test.ts src/__tests__/server.test.ts --pool=forks
```

La integración con runner, MCP y visor no se considera aprobada por estas pruebas aisladas. Antes de fusionar hay que verificar la guarda previa al render, la custodia del proceso y el catálogo autorizado de AS-01/AS-03. La supresión no aporta evidencia visual y no debe elevar su estado a aprobado.

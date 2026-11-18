# VNEXT-014 — Composición del host MCP Stdio (rescate)

Estado: **implementación publicada, pendiente de build y prueba física independiente**.
Rama: `feat/qap-vnext-architecture`. No es una certificación GO.

## Entradas soportadas

- `node packages/mcp/dist/server.js` llama `startMcpServer()` y lee exclusivamente la variable de entorno **del proceso host** `QAP_MCP_HOST_CONFIG_PATH`.
- `node packages/cli/dist/entrypoint.js mcp --project <ruta>` llega al mismo `startMcpServer()` tras posicionar el directorio; si existe manifiesto, la raíz declarada en él es la única raíz canónica permitida.
- Sin variable, se conserva el inicio legacy con `createMcpServer()` sin servicios canónicos host-bound. No interpretar un inicio legacy exitoso como integración canónica.
- Manifiesto configurado pero ausente, mal formado, con revisiones inconsistentes, sin claves obligatorias o con bases incompatibles: **fallo de arranque**, nunca fallback silencioso.
- Un host de aplicación que disponga de un gateway humano real puede continuar usando `createMcpServer(options)` o `startMcpServer(options)` con `ProjectKnowledgeBinding.humanReviewGateway` y `moduleClosureReviewGateway`. La versión de manifiesto **no puede ejecutar ni cargar código arbitrario de gateway**.

## Provisión deliberada del host

La provisión inicial es una acción **externa a las tools MCP**. No habilitar el manifiesto sin que la persona administradora prepare el almacenamiento en una ubicación privada, protegida con permisos/ACL adecuados y claves de 32 bytes gestionadas fuera del repositorio. La implementación no inicializa bases de decisiones o entrevistas: deben existir y ser compatibles, con el scope exacto. Tampoco descubre módulos por nombres parecidos ni modifica identidades para lograr un match.

**Ejemplo de estructura, NO archivo listo para producción**:

```json
{
  "version": 1,
  "projectRoot": "<RUTA_ABSOLUTA_CANONICA_EXISTENTE>",
  "applicationId": "<ID_DE_LA_APLICACION_EXISTENTE>",
  "environmentId": "<ID_DEL_ENTORNO_EXISTENTE>",
  "knowledgeDbPath": "<RUTA_ABSOLUTA_EXISTENTE_CANONICAL_SQLITE>",
  "moduleBindings": [
    {
      "plannedName": "catalog",
      "moduleId": "<ID_CANONICO_EXISTENTE>",
      "moduleKey": "catalog",
      "moduleRevision": 1,
      "applicationRevision": 1,
      "environmentRevision": 1,
      "provenance": "host_declared"
    }
  ],
  "interviewDraft": {
    "dbPath": "<RUTA_ABSOLUTA_DB_ENTREVISTA_YA_PROVISIONADA>",
    "keyEnv": "QAP_MCP_INTERVIEW_KEY_HEX",
    "protection": "host_private_directory_and_managed_key"
  },
  "moduleClosure": {
    "dbPath": "<RUTA_ABSOLUTA_DB_CIERRES_YA_PROVISIONADA>",
    "keyEnv": "QAP_MCP_CLOSURE_KEY_HEX",
    "protection": "host_private_directory_and_managed_key"
  },
  "discoveryAuthorization": {
    "read_only_acknowledged": true,
    "environmentRevision": 1,
    "navigation_urls": ["https://example.invalid/"],
    "allowed_ips": [],
    "allow_public_network": false,
    "limits": { "max_pages": 1, "max_requests": 1 }
  }
}
```

La estructura de ejemplo **no expresa consentimiento real**. El administrador debe aprobar las URLs e IPs concretas que realmente quiera consultar, comprobar el entorno en Knowledge y las implicaciones de solicitudes GET. El crawler continúa con sus propias barreras de red, DNS, origen y presupuesto; no hay permisos automáticos para autenticación, producción, navegación privada o acciones destructivas. El ejemplo `example.invalid` sirve solo para explicar el contrato, no para conectarse.

No introducir `QAP_MCP_*_KEY_HEX` en Git, logs, pruebas publicadas ni en parámetros MCP. Las claves y el manifiesto son responsabilidad del host. Los archivos de almacenamiento cifrado deben estar provisionados mediante las APIs de host privilegiadas ya existentes. Mantener backups/retención bajo control del administrador; el cifrado no sustituye los ACL ni la protección del proceso.

## Ciclo de vida

`loadHostComposition()` abre una instancia de Knowledge + las bases cifradas configuradas. Validación inicial: scope, aplicaciones, entorno y revisiones explícitas de cada vínculo. El cierre del servidor invoca los `close()` de los almacenes en orden inverso; un fallo de arranque intenta cerrar los recursos abiertos. Verificar cierre también cuando el transporte Stdio termine por desconexión o EOF. No se garantiza saneamiento ante un kill de proceso.

## Fronteras de autoridad

El manifiesto **nunca** crea aprobaciones de entrevista, consentimientos de revisión de cierre ni waivers. Si no hay gateway humano del host, los intentos que requieren su decisión siguen devolviendo `blocked`. No prometer flujo canónico terminado en la entrada estándar sin suministrar ese gateway por un host de aplicación confiable.

El reporte de sesión extrae cierres `closed`/`waived` con aprobación correlacionada y relación canónica del almacenamiento autorizado, y distingue estos datos de las reglas legacy. Los requisitos confirmados son **el inventario actual al leer el reporte**, no un snapshot histórico garantizado idéntico al momento del cierre. Brechas durables, aplicabilidad y waiver corresponden a sus propias decisiones. Sin evidencia real de ejecución, jamás muestra PASS funcional. Una generación de reporte puede fallar si se rompe la coherencia entre SQLite y Knowledge; no convierte esos fallos en cierre exitoso.

## Verificación requerida (Codex)

1. Node 24.15.0+ con `node:sqlite` compilado con FTS5 y `pnpm` del lockfile. Ejecutar pruebas de `host-composition.test.ts`, `canonical-coverage.test.ts`, `discovery-handler.test.ts`, pruebas de Stdio servidor y CLI.
2. Prueba real de subprocess con manifiesto no configurado (legacy) y configurado (canónico), con dos módulos y revisión fijada; `qap_status` debe distinguir ambos.
3. Rechazos con manifiesto mal formado, revisión alterada, clave incorrecta, store inexistente, consentimiento ausente, IP denegada, módulo cerrado sin recibo.
4. Ejecución en entorno controlado con gateway de fixture **solo** para probar integridad mecánica de A cerrado/B waived/reporte/`WRAP_UP`; repetir en nueva sesión y comprobar recibos/historial, sin representar fixture como revisión humana auténtica.
5. El gateway real y la aprobación humana auténtica son compuertas independientes de aceptación de producto.

Esta documentación describe contratos implementados y controles por comprobar, no resultados de pruebas físicas.

# Operación y aceptación del MVP autónomo

Autoriza inicialmente el workspace con `node scripts/qap-authorize-workspace.mjs "<workspace>"`. El operador configura `qa-autonomy-policy.json` en `QAP_MCP_HOST_DATA_DIR`, que por defecto es `~/.qap`. Guarda ese archivo fuera del workspace, con permisos administrados por el host.

```json
{
  "version": 1,
  "targets": [{
    "workspace": "D:/QA/fixture",
    "environment": "test",
    "origin": "http://127.0.0.1:8080",
    "entry": "/",
    "paths": ["/", "/dashboard", "/summary"],
    "batchPages": 1
  }]
}
```

Incluye únicamente destinos de prueba y rutas de lectura previamente verificadas. El host fija los perfiles admisibles mediante `profiles` y el tenant mediante `tenant`, cuando corresponda. Provisiona el acceso por el mecanismo local del host. QAP resuelve un destino único para el workspace y valida políticas, entorno y acceso al volver a admitir trabajo. Se rechazan políticas ausentes, rutas ajenas, entornos productivos y redes privadas fuera de la excepción literal de `127.0.0.1`.

### Ciclo ordinario

1. El usuario escribe «Quiero probar un sistema». El cliente llama `qap_start` con el workspace autorizado. QAP persiste y agota la frontera por lotes y devuelve `autonomy.views` y su revisión.
2. El modelo interpreta el inventario y llama `qap_plan` con `case_workflow.action=generate`, la revisión y propuestas `{title, route, selector}`. Puede usar `oracle=indeterminate` para registrar una brecha. QAP materializa los casos acreditados y conserva la incertidumbre y las negativas de política.
3. El cliente llama `qap_plan` sin `case_workflow`, luego `qap_test` y `qap_report`. El runner usa el snapshot y genera evidencia oficial. Tras reconectar, `qap_report` publica o recupera el mismo intento por `executionId`. Repetir `qap_test` con el mismo plan y caso crea otro intento.

QAP registra visibilidad estructural con controles observados. Reglas de negocio sin una fuente ejecutable quedan indeterminadas. Los flujos de revisión de casos históricos quedan fuera de este ciclo. Un YAML escrito a mano y una ejecución externa carecen del registro canónico necesario para un resultado oficial.

### Escrituras acotadas

Se admite un `POST` por intento en un fixture anónimo y aislado con origen literal `127.0.0.1`. Declara `isolatedFixture: true` y `fixtureWrites` con `id`, `view`, `selector` estructural de Discovery, `path`, `body` JSON exacto y `cleanup`. La aplicación debe ofrecer limpieza idempotente para el mismo dato sintético. El runner comprueba la respuesta del `POST` y ejecuta la limpieza antes de publicar. Ante un reinicio durante una escritura, conserva el intento y bloquea nuevas escrituras hasta que el operador recupere el fixture. La lectura puede continuar.

### Aceptación sintética

Ejecuta `pnpm build` y `node scripts/test-knowledge-smoke-stdio.mjs`. El script levanta el fixture, registra un workspace separado y usa el transporte Stdio. Comprueba tráfico, casos, reportes, intentos e invocaciones de `elicitation/create`. No genera pruebas de navegador externas al runner.

Agrega `--verify-cli` para comprobar el binario empaquetado. `qap plan`, `qap test` y la publicación por `qap report` delegan al mismo flujo canónico en un workspace administrado por el host.

Para Antigravity, ejecuta el mismo script con `--serve`. Usa `serverConfig` de `fixture.json` para el servidor temporal, reconecta Antigravity e inicia una conversación limpia con el workspace del fixture impreso por el script. Verifica `initialize` y la versión del bundle, los resultados de `qap_start`, `qap_plan`, `qap_test` y `qap_report`, y vuelve a conectar para publicar o repetir sobre el mismo caso. Restaura el registro MCP normal al terminar. Mantén el fixture activo durante las dos conexiones.

Para acreditar cero solicitudes `elicitation/create` en el cliente, conserva una traza JSON-RPC bidireccional de ambas sesiones. Registra `initialize`, la revisión y huella del bundle compilado, las llamadas y respuestas de QAP y el cierre de cada conexión. Si usas un observador Stdio, debe reenviar los bytes intactos, guardar los diagnósticos fuera de stdout y sanitizar los datos de la copia persistida. Los permisos del cliente para invocar herramientas no son mensajes `elicitation/create`. Guarda el identificador del plan, caso e intentos y comprueba en requests.json que /forbidden no recibió tráfico.

El Stdio empaquetado exige política autónoma para planificar y ejecutar. Las integraciones embebidas que conservan el flujo histórico usan su composición explícita y reciben las instrucciones y el catálogo históricos.

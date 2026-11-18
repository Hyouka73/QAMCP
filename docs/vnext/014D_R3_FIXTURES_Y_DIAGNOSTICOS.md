# VNEXT-014-D-R3 — Estabilización de fixtures MCP y diagnóstico de ámbito

**Fecha:** 2026-11-04  
**Rama exclusiva:** `feat/qap-vnext-architecture`  
**Base auditada físicamente:** `49aa44a358b288070ff710e64cfa0feae161be67`  
**Estado de esta ronda:** cambios de código/tests publicados, **SIN pruebas reejecutadas en el HEAD R3**  
**Dictamen VNEXT-014:** **NO-GO**. VNEXT-015 no iniciado.

## 1. Evidencia previa: auditoría independiente R2

La auditoría de R2 se ejecutó en Windows/Node 24.15.0 y comprobó:
- Diez compilaciones de paquetes exitosas; 21/21 regresiones D/D-R1; TestHandler/ReportHandler focal; runner 71/71.
- MCP serial **373 PASS / 73 FAIL** sobre 446 tests; lifecycle 2/7; lint global 46 errores y 28 warnings.
- Stdio aislado con 18 herramientas; Chromium real en Scenario 13 de TestHandler.
- 55/73 casos enlazados por archivo+título al inventario de VNEXT-013. Otros 18 estaban ya rojos en la auditoría anterior, pero no tienen causalidad temporal demostrada. Los artefactos completos del evaluador permanecen fuera del repositorio.

El diagnóstico diferencial del evaluador mostró que `createMcpServer()` captura el `projectRoots` autorizado al construirse. Varios fixtures sintéticos creaban rutas bajo `os.tmpdir()` pero no las autorizaban en el host. Un `targetPath` en el argumento de una tool **no otorga permiso**. El rechazo de `qap_context_set` deja el flujo en ONBOARDING y produce fallos derivados (planes vacíos, reglas ausentes, objetivo no persistido).

## 2. Cambios concretos publicados en R3

### 2.1 Autorización explícita en fixtures, sin modificar producción

| Suite | Entradas R2 relacionadas | Ajuste realizado |
| --- | --- | --- |
| `e0-investigation.test.ts` | F01, E0d | Autorizar `projectRoots: [root]` en ese caso; convertir PRD Markdown con `\\n` literales a separadores LF reales; verificar que `qap_context_set` responde éxito antes de medir truncamiento y persistencia |
| `p4-3-investigate-before-ask.test.ts` | F14–F19 | Construir MCP con `projectRoots: [tempDir]`; ubicar los tres subfixtures temporales de la prueba de regresión bajo ese directorio permitido |
| `p4-5a-integrity.test.ts` | F31–F32 | `createMcpServer({ projectRoots: [tempDir] })` en setup |
| `p4-5a2-integrity.test.ts` | F50 y F54 | `projectRoots: [tempDir]` en setup con servidor del fixture HTTP existente; no cambiar autorización de app externa |
| `p4-5s1-browser-candidates.test.ts` | F57–F63 | `projectRoots: [tmpDir]` y subfixtures `noFrontDir`/retrocompatibilidad anidados bajo la raíz permitida |

**Comprobaciones preventivas añadidas:** los helpers de P4.5-A y P4.5-A2 verifican explícitamente el éxito de la inicialización y del contexto (además del plan en P4.5-A); P4.5-S1 comprueba la inicialización y fase de SCOPING antes de examinar candidatos. Estas comprobaciones hacen visible la primera compuerta rechazada en lugar de atribuir el fallo a campos/archivos posteriores.

**Estos 18 casos son objetivos de revalidación, no 18 PASS nuevos.** Si después del setup correcto emergen defectos reales de contexto, autenticación, negocio o capacidades fuera de alcance, registrarlos sin cambiar aserciones para ocultarlos. Ningún permiso global o lectura sobre credenciales fue añadido.

### 2.2 Diagnóstico de `qap_discover`

`DiscoveryHandler` anteriormente atrapaba `McpToolError('invalid_arguments')` del guard de `projectRoot` y lo sustituía por `indeterminate / DISCOVERY_UNAVAILABLE`. Esto confundía un rechazo de ámbito con una caída de Chromium.

El handler ahora responde `status: blocked`, `code: invalid_project_scope`, `persistence: not_attempted`, sin rutas internas, cuando el guard entrega `invalid_arguments`. Se conservan la denegación del host, la ausencia de escrituras y el tratamiento cerrado de otras excepciones.

Nueva prueba en `discovery-handler.test.ts`: crea una raíz sintética no autorizada (`projectRoots: []`) y comprueba código, ausencia de fuga de ruta y ausencia de `.qa`.

## 3. Lo que NO se considera resuelto

- Los **55 casos con identidad histórica VNEXT-013** siguen sin conciliación funcional en esta ronda. No se crearon reglas `rules.yaml` de mentirijillas ni se habilitaron entrevistas/cierres por bypass.
- El recorrido canónico `discovery → módulo/vista → entrevista → requisito confirmado → cierre → WRAP_UP` no está certificado por una prueba integral.
- El lint global sigue sin corregirse ni reejecutarse después de estos commits.
- No se compiló ni ejecutó el monorepo en esta sesión de cambios remotos. **El estado de las nuevas pruebas es pendiente y no se atribuyen al HEAD R3 resultados del SHA R2.**

## 4. Compuertas y comandos para el auditor (Codex)

Trabajar en el checkout local existente de la rama, sin tocar `admin-user.json`. Comprobar HEAD y aplicar solo fast-forward seguro. **Primero** confirmar las suites que cambiaron:

```powershell
git status --short
git branch --show-current
git fetch origin feat/qap-vnext-architecture
# Revisar los cambios locales antes de avanzar --ff-only.
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/e0-investigation.test.ts src/__tests__/p4-3-investigate-before-ask.test.ts src/__tests__/p4-5a-integrity.test.ts src/__tests__/p4-5a2-integrity.test.ts src/__tests__/p4-5s1-browser-candidates.test.ts src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/discovery.handler.ts src/__tests__/discovery-handler.test.ts src/__tests__/e0-investigation.test.ts src/__tests__/p4-3-investigate-before-ask.test.ts src/__tests__/p4-5a-integrity.test.ts src/__tests__/p4-5a2-integrity.test.ts src/__tests__/p4-5s1-browser-candidates.test.ts
```

Si el foco pasa, ejecutar MCP serial completo (y runner como centinela si el tiempo/entorno lo permiten):

```powershell
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner test
```

Registrar SHA, por archivo+título los casos nuevos que pasan, persisten o surgen, el primer error real después de inicializar, el lint nuevo, separación de fallos de fixture vs producción, y qué ocurre con las 18 entradas F01/F14–F19/F31–F32/F50/F54/F57–F63.

No aceptar `status: blocked` como sustituto del resultado que la prueba quería alcanzar; **la compuerta del fixture debe permitir evaluar la garantía original**.

## 5. Próxima fase

1. Confirmar dinámicamente las correcciones R3, reparar defectos que queden expuestos.
2. Implementar o adaptar con pruebas reales el enlace canónico entre servicios para las 55 garantías pendientes; separar capacidad no implementada de caso legacy obsoleto.
3. Resolver lint global y regresiones de ejecución paralela de forma dirigida.
4. Cerrar VNEXT-014 solo con una matriz de evidencia física y lógica del SHA final. No empezar VNEXT-015 por anticipado.

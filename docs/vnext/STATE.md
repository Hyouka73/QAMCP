# QAMCP vNext — Continuidad Codex

Actualizado: 2026-10-28. Agente principal único.

## Estado y alcance

**VNEXT-001 a VNEXT-005 terminadas** por autorización expresa.
Detener aquí. VNEXT-006 y posteriores requieren nueva autorización.
Leer este archivo y el WBS antes de elegir trabajo ante «continúa».

## Rama y cambios ajenos

- Rama exclusiva: `feat/qap-vnext-architecture`. No editar/integrar develop ni main.
- Base VNEXT-005: `76ddfd4d31edda48deaf94f0b603fcb5a906085e`.
- Entrega: `git log --oneline 76ddfd4..HEAD` en esta rama.
- Cambio previo del usuario en `packages/playwright-runner/.qa/cache/sessions/admin-user.json`
  conservado y excluido. Hash Git de contenido antes/después de verificaciones:
  `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`. No usar bases personales/Reporter.

## Credenciales VNEXT-005

- Puerto `packages/auth/src/credential-provider.ts`, reexportado por Auth.
  ICredentialProvider privilegiado; agente/Knowledge reciben auth_profile_id y estado.
- TieredCredentialVault selecciona backend explícito por perfil, sin fallback silencioso.
  Keytar opcional/diferido en Auth y CLI; PortableCredentialVault desbloqueada por API;
  EphemeralCredentialProvider sin persistencia; env conserva token temporal.
- Scope: proyecto por ruta real completa (o ID explícito), aplicación, entorno, perfil y cuenta.
  Keychain por basename anterior **no se migra/lee automáticamente**: reprovisionar y
  retirar manualmente entradas legacy correctas. No se declaran credenciales válidas remotamente.
- Vault v1: AES-256-GCM, nonce 12/tag 16/salt 32 bytes; scrypt N=131072/r=8/p=1,
  maxmem 256 MiB. Sin clave maestra predeterminada ni persistida. Locks exclusivos,
  recarga bajo lock, temporales/fsync/rename, rutas/enlaces validados y errores sanitizados.
- SessionStore separado: aleatoria por vida de módulo/proceso por defecto. Persistencia
  entre procesos exige QAP_SESSION_KEY de 64 hex aleatorios; cachés legacy no se migran.
  Se corrige projectPath; claves incorrectas no destruyen ciphertext. ACL Windows heredada.
- API AuthManager anterior conservada; status y close agregados. CLI revoca antes de
  quitar el perfil. No nuevos handlers, login autónomo, 1Password ni publicación npm.

## Verificación y límites

- Auth final: **34 aprobadas + 1 omitida POSIX**, tres archivos, en Windows con Node
  **24.15.0, 24.19.0 y 24.22.1**. Junctions/hardlinks verificados fuera del sandbox;
  dentro de él se omiten por EPERM. Windows Credential Manager real: 6 checks por runtime,
  solo entradas sintéticas aleatorias eliminadas. Linux/macOS y otros Node no comprobados.
- Shared 145/145; Engine 168/168; Knowledge 234/234: **547/547 focalizadas**.
  CLI Auth 6/6; MCP centinela 1/1 (14 no seleccionadas). Runner session-resolver 3/4:
  re-login falla por Chromium ausente. No declarar E2E/global verde.
- 10 paquetes compilan. ESLint de entrega y tsc Auth incluidos tests sin diagnósticos.
  Lockfile validado offline con pnpm 12.3.4, sin scripts ni actualizaciones de versiones.
- Global no pasa: Auth dos suites Chromium/teardown; Adapter 17 fallos/4 aprobadas/5
  omitidas; Knowledge 233/234 por route-scanner sensible a carga (tiempo antes de límite
  de archivos). Mismas fuentes/firmas conocidas; no corregidas. Detalle y conteos del
  intento global en el documento de VNEXT-005. Dependientes se verificaron por separado.
- TEMP/TMP y logs: `node_modules/.tmp-vnext`, `vnext005-*.log`.
- Pendientes: instalación npx limpia sin addon, composición UX de desbloqueo, CI POSIX,
  reprovisión legacy y rotación maestra. Borrado lógico no elimina backups/SSD ni revoca
  tokens remotos; sin defensa completa contra TOCTOU de misma cuenta o rollback autenticado.

## Memoria y continuidad anterior

IKnowledgeStore v1 sin cambios; credenciales conocidas siguen rechazadas. SQLite v2
con FTS5, migración explícita v1→v2, contratos y cursores previos conservados.
Node 22.13.1 instalado en VNEXT-004 carecía de FTS5: no extrapolar la matriz de Auth.
DatabaseSync bloquea el hilo; worker pendiente. Texto libre requiere redacción en ingesta.

[Diseño, pruebas y límites VNEXT-005](VNEXT-005_CREDENTIAL_VAULT.md).
[SQLite/FTS5 VNEXT-004](VNEXT-004_FTS5_SEARCH.md).
[Persistencia VNEXT-003](VNEXT-003_SQLITE_ADAPTER.md).

VNEXT-006 no iniciada. No crawler, Advisor, PostgreSQL, nuevos handlers ni integración develop.

# ET-06 · Seguridad, aislamiento, secretos, distribución e instalación

Base normativa y de código `1a81e86c9b17a95a04e40237eff5fb99215bae5a`. Leer y cumplir íntegramente el [encargo común](encargo-evaluacion-tecnologica.md) y [matriz de responsabilidad](matriz-responsables-et.md). Este documento delimita la especialidad, no reemplaza las restricciones comunes. No elegir definitivamente.

## Alcance exclusivo

Comparar separación efectiva de principales y procesos por SO (Win service/Job/AppContainer/ACL y broker sesión interactiva; macOS launchd/App Sandbox/XPC; Linux systemd/cgroups/namespaces/seccomp/Wayland/X11 y alternativas), VM solo si justificada y costo total, no confiar mismo UID/detach. Probar documentalmente modelo de amenaza y límites para supervisor durable, IPC mutuo/anti-replay, fencing, acceso DB/vault/medios, broker GUI/red, SSRF DNS/redirect/TLS/egress, contenido hostil parsers, Git defensivo, AR-24 visor y UI EXP-08. Evaluar keyring/KEK nativos y CI fuera de banda (candidatos previos keytar archivado/@napi-rs/keyring, Windows/mac/Linux), rotación/revocación/restauración sin secretos en argv/env/log/MCP, custodia desde primer byte, swap/temp/backups, streaming AEAD con ET-05 y DE-02 B sin autorizar captura. Comparar distribución local autocontenida/runtime compartido, launchers, instaladores, firmas, manifest/SBOM/provenance, actualizaciones atómicas/cachés/rollback sin downgrade revocado, offline/proxy/CA, mínimos de privilegio y UX real. Matriz de soporte por SO/CPU y UI/headless, browsers bajo demanda con ET-03; investigar licencias directas/transitivas y bytes/runtime/codec (ET-01/05/07), avisos y titularidad MIT/ISC pendiente sin resolver por cuenta propia. Revisar AR-07/14/22/24/27/28/31/32/33/40/41/47/51, EXP-04a/b/05a/06a/c/07/08, E1/E2/E6/E7. Distinguir costo de componentes y operación, riesgos de supply chain y amenazas fuera de modelo; no declarar seguridad por documentación.

## Interdependencias a resolver

Todas: principal y broker, credenciales, artefacto instalado, licencias, fronteras reales. Declarar contrato, candidato requerido/rango, alternativa, riesgo de incompatibilidad y prueba futura. No asumir que el otro especialista ya decidió. Escalar conflictos al Orquestador.

## Entrega

Informe Markdown completo al Orquestador conforme al encargo común, con SHA exacto, fuentes primarias verificables, inventario real, comparación, recomendación condicionada, respaldo, matriz de garantías y calificación futura. Solo lectura. Cero implementación, instalación, experimentos, WBS o acceso empresarial. Detenerse.

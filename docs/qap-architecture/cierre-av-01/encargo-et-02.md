# ET-02 · Persistencia, memoria, búsqueda y consultas

Base normativa y de código `1a81e86c9b17a95a04e40237eff5fb99215bae5a`. Leer y cumplir íntegramente el [encargo común](encargo-evaluacion-tecnologica.md) y [matriz de responsabilidad](matriz-responsables-et.md). Este documento delimita la especialidad, no reemplaza las restricciones comunes. No elegir definitivamente.

## Alcance exclusivo

Evaluar SQLite local como decisión vigente y sus implementaciones/driver (node:sqlite, better-sqlite3 u otros justificados), WAL/FULL, FTS5 y búsqueda alternativa; no comparar PostgreSQL como sustitución de v1 sin proponer decisión de propietario. Revisar versión efectiva SQLite/source_id, compile options, soporte y advisories, ABI y instalación, transacciones CAS, recuperación/revocación, backups consistentes y restore, seis clases lógicas en cinco familias, migración coordinada AR-41. Comparar esquema/consultas y migraciones (SQL explícito, query builder/ORM, etc.), aislamiento de scopes y ranking FTS, búsqueda lexical/híbrida local con costo y privacidad (embeddings no obligatorios ni API externa). Diseñar por contrato los cinco dominios funcionales, cuatro planos epistémicos, biblioteca/revisiones, estrategia, sets, asignaciones, datos, efectos, defectos/recetas, métricas, as-of, publicaciones, consultas tipadas sin SQL libre, promoción y retención selectivas, cuotas y recolección segura. No crear cinco BDs ni segundo escritor; evaluar topología física sin decidir por conteo. Medir/estimar con fuentes costo de indexación, lectura, RAM/disco y crecimiento, comparabilidad, paginación y tokens de ContextSnapshot. Puerto independiente de SQL/driver/transporte, migración a PG futura sin prometer equivalencia automática. Revisar AR-12/25/41/46/54/57, E2/E6/E7, EXP-03/06c/08 y prueba 120d. Entregar modelo de responsabilidades y estrategia de datos/fallback.

## Interdependencias a resolver

ET-01/04/05/06/07: DTO y writer, consultas/paginación, receta/publicación, custodia, exportación. Declarar contrato, candidato requerido/rango, alternativa, riesgo de incompatibilidad y prueba futura. No asumir que el otro especialista ya decidió. Escalar conflictos al Orquestador.

## Entrega

Informe Markdown completo al Orquestador conforme al encargo común, con SHA exacto, fuentes primarias verificables, inventario real, comparación, recomendación condicionada, respaldo, matriz de garantías y calificación futura. Solo lectura. Cero implementación, instalación, experimentos, WBS o acceso empresarial. Detenerse.

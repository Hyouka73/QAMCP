# QA Agent Platform (QAP) v2.1

Monorepo modular para la plataforma de automatización de pruebas QA, construido con **pnpm workspaces**.

## Descripción

QAP es una plataforma diseñada para facilitar la creación, ejecución y reporte de pruebas de calidad de software de manera automatizada. Este monorepo contiene todos los módulos necesarios para el funcionamiento del sistema.

La [guía de continuidad](docs/vnext/CONTINUIDAD_MVP.md) indica cómo instalar y verificar el candidato en otra computadora. El [plan del MVP](docs/vnext/PLAN_ONE_SHOT_Y_MERGE.md) documenta las capacidades de Discovery y el trabajo pendiente para completar el ciclo conversacional.

## Estructura del Monorepo

```
qap-monorepo/
├── packages/              # Todos los paquetes del monorepo
│   ├── engine/            # Motor principal de ejecución de tests
│   ├── knowledge/         # Base de conocimiento y reglas de testing
│   ├── auth/              # Módulo de autenticación y autorización
│   ├── cli/               # Interfaz de línea de comandos
│   ├── mcp/               # Model Context Protocol adapter
│   ├── playwright-adapter/# Adapter para Playwright
│   ├── playwright-runner/ # Runner específico para Playwright
│   ├── git-adapter/       # Integración con repositorios Git
│   ├── reporter/          # Generación de reportes de测试结果
│   └── shared/            # Utilidades y tipos compartidos (sin dependencias internas)
├── pnpm-workspace.yaml    # Configuración de workspaces
├── tsconfig.json          # Configuración base de TypeScript (strict mode)
├── .eslintrc.json         # Configuración de ESLint con eslint-plugin-import
└── package.json           # Configuración raíz con devDependencies comunes
```

## Paquetes

| Paquete | Descripción |
|---------|-------------|
| `@qap/engine` | Motor principal de orquestación de tests |
| `@qap/knowledge` | Base de conocimiento y patrones de testing |
| `@qap/auth` | Autenticación y gestión de permisos |
| `@qap/cli` | CLI para interactuar con la plataforma |
| `@qap/mcp` | Adaptador para Model Context Protocol |
| `@qap/playwright-adapter` | Adapter para integración con Playwright |
| `@qap/playwright-runner` | Runner especializado para tests Playwright |
| `@qap/git-adapter` | Integración con Git (repos, branches, commits) |
| `@qap/reporter` | Generación de reportes en múltiples formatos |
| `@qap/shared` | Tipos, utilidades y constantes compartidas |

## Requisitos

- Para el candidato conversacional, Node.js con `node:sqlite` y FTS5. Verificado con Node `22.16.0` y pnpm `11.3.0`.
- Chromium administrado por Playwright para ejecutar pruebas de navegador.

## Instalación

```bash
pnpm install
```

## Comandos Disponibles

```bash
# Construir todos los paquetes
pnpm build

# Ejecutar linting
pnpm lint

# Consultar comandos y opciones del CLI
node packages/cli/dist/entrypoint.js --help
node packages/cli/dist/entrypoint.js flow --help
```

## Reglas de Importación

El paquete `@qap/shared` está diseñado para ser el único que **no debe importar** de otros paquetes del monorepo. Esto se enforce mediante ESLint con `eslint-plugin-import`.

## Licencia

ISC

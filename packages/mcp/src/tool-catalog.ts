import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { QAP_CORE_DIRECTIVES } from './guidance.js';

const UX_DIRECTIVE = 'DIRECTIVA DE UX ESTRICTA: Guía al usuario paso a paso interactivo. Si tu entorno dispone de herramienta para hacer preguntas interactivas con opciones (como ask_question), ÚSALA OBLIGATORIAMENTE para cada decisión. Si no, formula la pregunta directa con sus opciones. PROHIBIDO mostrar listas de pasos futuros (1, 2, 3...), tutoriales o pedir comandos de terminal.';

const TARGET_PATH_PROP = {
  type: 'string',
  description: 'Ruta absoluta del proyecto objetivo sobre el cual operar. Si se omite, usa process.cwd()',
};

export const TOOLS: Tool[] = [
  {
    name: 'qap_status',
    description: `PUNTO DE ENTRADA OBLIGATORIO: Invoca esta herramienta INMEDIATAMENTE cuando el usuario quiera probar su app, testear un proyecto o empezar con QAP. Analiza el repo y el preflight del navegador (Playwright), y devuelve exactamente la pregunta y opciones que debes presentar con ask_question. Si falta navegador, ejecuta la instalación como paso de trabajo autónomo. QAP observa la app con su propio navegador mediante qap_discover; no uses navegadores ni herramientas de otros servidores MCP ni del IDE para explorarla (no se persistiría conocimiento en .qa).\n\n${QAP_CORE_DIRECTIVES}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
      },
    },
  },
  {
    name: 'qap_init',
    description: `Inicializa la arquitectura canónica .qa/ y configuraciones base en el proyecto actual, verificando el preflight del navegador y escaneando rutas en repo-map.json. Si falta navegador, ejecuta 'npx playwright install chromium' como paso de trabajo autónomo. QAP observa la app con su propio navegador mediante qap_discover; no uses navegadores ni herramientas de otros servidores MCP ni del IDE para explorarla (no se persistiría conocimiento en .qa). ${UX_DIRECTIVE}\n\n${QAP_CORE_DIRECTIVES}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        projectName: {
          type: 'string',
          description: 'Nombre del proyecto (por defecto: nombre de la carpeta actual)',
        },
        environments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de entornos soportados (por defecto: ["local"])',
        },
        baseUrl: {
          type: 'string',
          description: 'URL base del entorno local (si no se proporciona ni se detecta en el proyecto, queda sin definir)',
        },
      },
    },
  },
  {
    name: 'qap_clean',
    description: `Ejecuta el reseteo completo del proyecto (.qa/ y locks remanentes) para una inicialización limpia desde cero. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        force: {
          type: 'boolean',
          description: 'Fuerza la eliminación inmediata sin interactividad (por defecto: true)',
          default: true,
        },
      },
    },
  },
  {
    name: 'qap_auth_add',
    description: 'Gestiona perfiles de autenticación QA (crear, actualizar, seleccionar o resolver antes del login) y solicita autorización local para verificar una sesión. Usa auto con un perfil aprovisionado, reuse para comprobar una sesión existente, o handoff para iniciar sesión en el navegador. El username acepta cualquier identificador válido (no solo correos). Conserva toda credencial en el proveedor seguro del host.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        targetPath: TARGET_PATH_PROP,
        profile: { type: 'string', description: 'Identificador del perfil de pruebas.' },
        action: {
          type: 'string',
          enum: ['create', 'update', 'select', 'resolve', 'revoke', 'login'],
          description: 'Operación de perfil, revocación de autorización o resolución previa al login.',
        },
        env: { type: 'string', description: 'Entorno autorizado del perfil.' },
        username: { type: 'string', description: 'Identificador de usuario o cuenta de prueba (acepta usuarios no email).' },
        application_id: { type: 'string', description: 'Identificador de la aplicación objetivo.' },
        login_origin: { type: 'string', description: 'Origen HTTP/HTTPS autorizado del inicio de sesión.' },
        alias: { type: 'string', description: 'Alias para seleccionar el perfil.' },
        aliases: { type: 'array', items: { type: 'string' }, description: 'Lista de alias asociados al perfil.' },
        scenario: { type: 'string', description: 'Escenario de prueba asociado al perfil.' },
        scenarios: { type: 'array', items: { type: 'string' }, description: 'Escenarios de prueba asociados al perfil.' },
        credential_source: { type: 'string', enum: ['keychain', 'env', 'vault', 'ephemeral'], description: 'Proveedor seguro de credenciales en el host.' },
        form_selectors: {
          type: 'object',
          additionalProperties: false,
          properties: {
            username: { type: 'string', minLength: 1, maxLength: 500 },
            password: { type: 'string', minLength: 1, maxLength: 500 },
            submit: { type: 'string', minLength: 1, maxLength: 500 },
          },
          required: ['username', 'password', 'submit'],
          description: 'Selectores del formulario de inicio de sesión.',
        },
        revoke_previous_credential: {
          type: 'boolean',
          description: 'Si cambia el username, revoca explícitamente la referencia anterior en el proveedor seguro con autorización del host.',
        },
        method: { type: 'string', enum: ['auto', 'reuse', 'handoff'] },
        login_mode: { type: 'string', enum: ['auto', 'reuse', 'handoff'] },
        role: { type: 'string', description: 'Rol asociado al perfil o para el handoff.' },
        login_route: { type: 'string', description: 'Ruta de inicio de sesión.' },
        verification_route: { type: 'string', description: 'Ruta protegida del mismo origen para verificar la sesión.' },
        timeout_ms: { type: 'number', description: 'Tiempo máximo de la operación en milisegundos.' },
        post_login_condition: { type: 'object', additionalProperties: false, properties: {
          type: { type: 'string', enum: ['selector_present'] }, value: { type: 'string', minLength: 1, maxLength: 500 },
        }, required: ['type', 'value'], description: 'Selector visible de autenticación.' },
      },
      required: ['profile'],
    },
  },
  {
    name: 'qap_auth_provision',
    description: 'Guarda una contraseña de pruebas para un perfil local keychain en una raíz ya autorizada. El operador escribe y consiente únicamente en el diálogo del host de Windows. Envía solo ruta, entorno y perfil. Tras un fallo de escritorio o presentación, detente y consulta al operador antes de volver a solicitar el diálogo. El inicio de sesión se autoriza por separado.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        targetPath: { type: 'string', description: 'Ruta absoluta del workspace ya autorizado por el host.' },
        profile: { type: 'string', description: 'Identificador del perfil local keychain.' },
        env: { type: 'string', description: 'Entorno vinculado al workspace.' },
      },
      required: ['targetPath', 'env', 'profile'],
    },
  },
  {
    name: 'qap_auth_list',
    description: `Lista, consulta o filtra los perfiles de autenticación registrados en el proyecto por entorno, aplicación, alias, usuario, rol o escenario sin exponer secretos. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        targetPath: TARGET_PATH_PROP,
        env: { type: 'string', description: 'Filtro opcional por entorno.' },
        application_id: { type: 'string', description: 'Filtro opcional por aplicación.' },
        profile: { type: 'string', description: 'Filtro opcional por identificador de perfil.' },
        alias: { type: 'string', description: 'Filtro opcional por alias.' },
        username: { type: 'string', description: 'Filtro opcional por identificador de usuario.' },
        role: { type: 'string', description: 'Filtro opcional por rol.' },
        scenario: { type: 'string', description: 'Filtro opcional por escenario.' },
      },
    },
  },
  {
    name: 'qap_context_set',
    description: `Actualiza parcial e incrementalmente el contexto de negocio en .qa/project/context.yaml. Evalúa la compuerta de ONBOARDING. ${UX_DIRECTIVE}\n\n${QAP_CORE_DIRECTIVES}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        objective: {
          type: 'string',
          description: 'Objetivo y propósito central del proyecto (mínimo 20 caracteres)',
        },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nombre del rol' },
              description: { type: 'string', description: 'Descripción de permisos o alcance' },
              source: { type: 'string', enum: ['user', 'prd', 'inferred'], description: 'Procedencia' },
            },
            required: ['name'],
          },
          description: 'Roles de usuario que interactúan con el sistema',
        },
        critical_flows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nombre del flujo crítico' },
              description: { type: 'string', description: 'Descripción de la interacción' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              source: { type: 'string', enum: ['user', 'prd', 'inferred'], description: 'Procedencia' },
            },
            required: ['name'],
          },
          description: 'Flujos o procesos clave de negocio',
        },
        source_of_truth: {
          description: 'Declaración o referencia de la fuente de verdad del proyecto (objeto o string con la ruta)',
        },
        base_url: {
          type: 'string',
          description: 'URL base del entorno de pruebas (ej: "http://localhost:3000")',
        },
        environments: {
          description: 'URL base o mapa de entornos para pruebas',
        },
        source: {
          type: 'string',
          enum: ['user', 'prd', 'inferred'],
          description: 'Procedencia por defecto de los campos actualizados (por defecto: user)',
          default: 'user',
        },
        confirmar_resumen: {
          type: 'string',
          description: 'Confirmación del resumen o acción de corrección (ej. "confirmo_todo", "corregir", "definir_url")',
        },
        corregir: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de campos a corregir',
        },
      },
    },
  },
  {
    name: 'qap_context_ingest',
    description: `Ingesta y procesa un documento de requerimientos (PRD, README, spec) para extraer propuestas de contexto y plan sugerido. ${UX_DIRECTIVE}\n\n${QAP_CORE_DIRECTIVES}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        docPath: {
          type: 'string',
          description: 'Ruta relativa al archivo de especificación (.md, .markdown, .txt) dentro del workspace',
        },
        docContent: {
          type: 'string',
          description: 'Contenido en texto plano o markdown del documento de especificación',
        },
        propuesta: {
          type: 'object',
          description: 'Propuesta estructurada extraída por el agente con herramientas de lectura',
          properties: {
            objetivo: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            flujos_criticos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  evidence: { type: 'string' },
                },
                required: ['name'],
                additionalProperties: false,
              },
            },
            rutas: { type: 'array', items: { type: 'string' } },
            riesgos: { type: 'array', items: { type: 'string' } },
            modulos_candidatos: {
              type: 'array',
              description: 'Lista de módulos candidatos extraídos del documento',
              items: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  ruta_hint: { type: 'string' },
                  evidence: { type: 'string' },
                  flujos: { type: 'array', items: { type: 'string' } },
                },
                required: ['nombre', 'evidence'],
              },
            },
          },
          additionalProperties: false,
        },
        modulos_candidatos: {
          type: 'array',
          description: 'Lista de módulos candidatos extraídos del documento a nivel superior',
          items: {
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              ruta_hint: { type: 'string' },
              evidence: { type: 'string' },
              flujos: { type: 'array', items: { type: 'string' } },
            },
            required: ['nombre', 'evidence'],
          },
        },
      },
    },
  },
  {
    name: 'qap_session_plan',
    description: `Define o amplía el plan de sesión y la decisión de autenticación. Admite desde_candidatos (referenciando module-candidates.json) y adicionales. Transiciona a WORKING cuando el plan es válido. ${UX_DIRECTIVE}\n\n${QAP_CORE_DIRECTIVES}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              module: { type: 'string', description: 'Nombre identificador del módulo' },
              path: { type: 'string', description: 'Ruta inicial del módulo comenzando con /' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Prioridad de prueba' },
              flujos: { type: 'array', items: { type: 'string' }, description: 'Flujos críticos asociados' },
            },
            required: ['module', 'path', 'priority'],
          },
          description: 'Lista de módulos a incluir en el plan de sesión',
        },
        desde_candidatos: {
          type: 'array',
          description: 'Lista de identificadores de candidatos tomados de module-candidates.json o con ruta custom',
          items: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  path: { type: 'string' },
                },
                required: ['id'],
              },
            ],
          },
        },
        adicionales: {
          type: 'array',
          description: 'Módulos adicionales no presentes en los candidatos',
          items: {
            type: 'object',
            properties: {
              module: { type: 'string' },
              path: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              flujos: { type: 'array', items: { type: 'string' } },
            },
            required: ['module', 'path'],
          },
        },
        auth: {
          type: 'object',
          properties: {
            required: { type: 'boolean', description: 'Si la aplicación requiere autenticación para las pruebas' },
            source: { type: 'string', enum: ['user', 'heuristic', 'context', 'document'], description: 'Origen de la decisión de autenticación' },
            method: { type: 'string', enum: ['handoff', 'credentials'], description: 'Método preferido de autenticación' },
            roles: { type: 'array', items: { type: 'string' }, description: 'Roles a probar en la sesión' },
            profile: { type: 'string', description: 'Perfil de autenticación a utilizar' },
          },
          required: ['required'],
          description: 'Decisión explícita de autenticación',
        },
      },
    },
  },
  {
    name: 'qap_discover',
    description: `Observa una MPA mediante BlackBoxCrawler real y estático, con JavaScript deshabilitado; admite un perfil de sesión de cookies verificado si el host lo autoriza. Requiere binding canónico y autorización explícita del host para cada URL GET e IP/red; GET no garantiza inocuidad semántica. Persiste observaciones y evidencias en IKnowledgeStore, sin escribir .qa/modules/ ni avanzar lifecycle. Solo profile selecciona una sesión de cookies autorizada y verificada; no admite credentials, profileId, sesiones aportadas ni headed=true. Cobertura parcial y vistas dependientes de JavaScript se declaran como tales. ${UX_DIRECTIVE}\n\n${QAP_CORE_DIRECTIVES}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        name: {
          type: 'string',
          description: 'Nombre identificador del módulo (ej: "auth", "checkout", "dashboard")',
        },
        path: {
          type: 'string',
          description: 'Ruta relativa o URL del módulo (ej: "/login", "/checkout", "http://localhost:5173/admin")',
        },
        description: {
          type: 'string',
          description: 'Descripción del propósito y alcance del módulo',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Etiquetas organizacionales (ej: ["critical", "e2e", "auth"])',
        },
        headed: {
          type: 'boolean',
          description: 'Si es true, abre el navegador visualmente durante la exploración del módulo (default: false)',
          default: false,
        },
        profile: {
          type: 'string',
          description: 'Perfil verificado explícito; requiere autorización nominal del host. No hay selección implícita.',
        },
        profileId: {
          type: 'string',
          description: 'Alias de profile para compatibilidad',
        },
        credentials: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Nombre de usuario o email' },
            password: { type: 'string', description: 'Contraseña' },
          },
          required: ['username', 'password'],
          description: 'Credenciales explícitas para iniciar sesión si la ruta es de autenticación',
        },
      },
      required: ['name', 'path'],
    },
  },
  {
    name: 'qap_plan',
    description: `Planifica casos existentes. case_workflow genera propuestas desde requisitos confirmados y solicita su aprobación independiente; nunca confirma requisitos ni aprueba por argumentos MCP. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        case_workflow: { type: 'object', additionalProperties: false, properties: {
          action: { type: 'string', enum: ['generate', 'review'] },
          proposals: { type: 'array', maxItems: 100, items: { type: 'object', additionalProperties: false, properties: {
            requirement_id: { type: 'string' }, expected_revision: { type: 'integer', minimum: 1 },
            name: { type: 'string', maxLength: 200 }, steps: { type: 'array', maxItems: 100, items: { type: 'object' } },
          }, required: ['requirement_id', 'expected_revision', 'name', 'steps'] } },
        }, required: ['action'] },
        module: {
          type: 'string',
          description: 'Nombre del módulo para el cual generar el plan de pruebas',
        },
        environment: {
          type: 'string',
          description: 'Entorno de ejecución destino (por defecto: "local")',
          default: 'local',
        },
      },
      required: ['module'],
    },
  },
  {
    name: 'qap_validate',
    description: `Valida estáticamente las definiciones, schemas y ausencia de ciclos en el DAG de dependencias. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        path: {
          type: 'string',
          description: 'Ruta opcional al directorio de definiciones (por defecto: .qa/definitions)',
        },
      },
    },
  },
  {
    name: 'qap_test',
    description: `Ejecuta el plan de pruebas de un módulo o la suite completa (en desarrollo para Sprint 7). ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        module: {
          type: 'string',
          description: 'Nombre del módulo específico a probar (si se omite, corre toda la suite)',
        },
        environment: {
          type: 'string',
          description: 'Entorno de prueba (por defecto: "local")',
          default: 'local',
        },
        profile: {
          type: 'string',
          description: 'Perfil de autenticación a utilizar para la prueba',
        },
        headed: {
          type: 'boolean',
          description: 'Si es true, abre el navegador visualmente durante la ejecución de Playwright',
          default: false,
        },
      },
    },
  },
  {
    name: 'qap_report',
    description: `Genera reportes de ejecución en HTML interactivo, Markdown, JUnit y JSON para una corrida o módulo. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        module: {
          type: 'string',
          description: 'Filtro opcional: módulo al que debe pertenecer la ejecución',
        },
        executionId: {
          type: 'string',
          description: 'ID de la ejecución o módulo a reportar (si se omite, busca la última disponible)',
        },
        format: {
          type: 'string',
          enum: ['all', 'html', 'markdown', 'junit', 'json'],
          description: 'Formato de reporte deseado (por defecto: "all")',
          default: 'all',
        },
      },
    },
  },
  {
    name: 'qap_server',
    description: `Inicia el servidor web interactivo del Knowledge Graph 2D y telemetría en http://localhost:9280 (ruta /graph-view). ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        port: {
          type: 'number',
          description: 'Puerto HTTP para el visor interactivo (por defecto: 9280)',
          default: 9280,
        },
      },
    },
  },
  {
    name: 'qap_prune',
    description: `Poda y limpia la telemetría histórica, capturas de pantalla y artefactos antiguos para optimizar espacio. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        olderThanDays: {
          type: 'number',
          description: 'Días de antigüedad máxima permitida antes de podar (por defecto: 30)',
          default: 30,
        },
        dryRun: {
          type: 'boolean',
          description: 'Si es true, solo audita y reporta el espacio sin eliminar archivos',
          default: false,
        },
      },
    },
  },
  {
    name: 'qap_rules_set',
    description: `Ruta legacy: persiste reglas y waivers en rules.yaml con contexto legacy válido. Ruta explícita canonical_interview: entrevista canónica y propuestas; confirmar ExpectedRequirement exige un gateway de revisión humana inyectado por el host. Los argumentos MCP no acreditan autorización humana. Sin dual-write. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        canonical_interview: {
          type: 'object', additionalProperties: false,
          description: 'Operación canónica exclusiva; no combinar con argumentos de reglas legacy. Sin gateway solo preguntas y propuestas pendientes.',
          properties: {
            action: { type: 'string', enum: ['next', 'propose', 'correct', 'review', 'defer', 'resume'] },
            question_id: { type: 'string' }, version: { type: 'integer', minimum: 0 },
            expected_revision: { type: 'integer', minimum: 0 },
            proposal: { type: 'object', additionalProperties: false, properties: {
              title: { type: 'string', maxLength: 200 }, description: { type: 'string', maxLength: 4000 },
              category: { type: 'string', enum: ['functional', 'business_rule', 'security', 'ui', 'ux', 'regression', 'performance'] },
              acceptance_criteria: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 1000 } },
            }, required: ['title', 'description'] },
          }, required: ['action'],
        },
        module: {
          type: 'string',
          description: 'Nombre del módulo al que pertenecen las reglas (ej: "auth", "dashboard")',
        },
        view: {
          type: 'string',
          description: 'Vista específica del módulo (por defecto: "default")',
          default: 'default',
        },
        propuesta_enunciado: {
          type: 'string',
          description: 'Propuesta de enunciado sustantivo redactada por el agente para resolver un borrador previo. Emite una Pregunta estructurada de confirmación al usuario.',
        },
        category: {
          type: 'string',
          enum: ['proposito', 'actor', 'campo', 'accion', 'error', 'dato', 'sensibilidad'],
          description: 'Categoría a la que aplica la propuesta de enunciado (opcional si se deduce de un borrador)',
        },
        rules: {
          type: 'array',
          description: 'Reglas a insertar o actualizar (upsert por id). Se mezclan con las existentes.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Identificador único de la regla' },
              description: { type: 'string', description: 'Descripción legible de la regla' },
              category: { type: 'string', enum: ['proposito', 'actor', 'campo', 'accion', 'error', 'dato', 'sensibilidad'] },
              status: { type: 'string', enum: ['confirmed', 'rejected', 'deferred', 'inferred'] },
              source: { type: 'string', enum: ['user', 'prd', 'dom', 'user_text', 'user_confirmed', 'agent', 'doc'] },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              view: { type: 'string', description: 'Vista a la que aplica (si difiere del parámetro view)' },
              field: { type: 'string', description: 'Campo o selector al que aplica' },
              evidence: { type: 'string', description: 'Evidencia corta (selector o referencia, máx 120 chars)' },
              user_text: { type: 'string', description: 'Texto literal del usuario' },
              from_option: {
                type: 'object',
                description: 'Resolución de opción de pregunta estructurada',
              },
              propuesta_enunciado: { type: 'string', description: 'Propuesta de enunciado redactada por el agente' },
              borrador: { type: 'boolean', description: 'Indica si es un borrador' },
            },
          },
        },
        category_waivers: {
          type: 'array',
          description: 'Categorías que el usuario declara como no aplicables (upsert por view+category).',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['proposito', 'actor', 'campo', 'accion', 'error', 'dato', 'sensibilidad'] },
              reason: { type: 'string', minLength: 1, description: 'Razón declarada de por qué no aplica' },
            },
            required: ['category', 'reason'],
          },
        },
      },
      required: ['module'],
    },
  },
  {
    name: 'qap_module_close',
    description: 'Cierra formalmente un módulo consolidado (action: "close") o renuncia a él con justificación (action: "waive"). Requiere confirmación explícita del usuario (user_confirmed: true).',
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        module: {
          type: 'string',
          description: 'Identificador del módulo a cerrar o renunciar',
        },
        action: {
          type: 'string',
          enum: ['close', 'waive'],
          description: "Acción a realizar: 'close' (exige estado consolidated) o 'waive' (exige reason de >= 15 caracteres)",
        },
        user_confirmed: {
          type: 'boolean',
          description: 'Debe ser true indicando confirmación explícita del usuario tras ver el resumen del módulo',
        },
        reason: {
          type: 'string',
          description: "Motivo justificado para action: 'waive' (obligatorio, >= 15 caracteres tras trim)",
        },
        canonical_closure: {
          type: 'object',
          description: 'Comando de cierre canónico (CanonicalClosureCommand). En presencia de enlace canónico del host, opera exclusivamente mediante IModuleClosureReviewGateway.',
        },
      },
      required: ['module', 'action', 'user_confirmed'],
    },
  },
  {
    name: 'qap_session_close',
    description: 'Cierra la sesión de trabajo activa cuando todos sus módulos están closed o waived, genera el reporte de brechas (.qa/project/sessions/<session_id>.report.md) y transiciona el proyecto a WRAP_UP.',
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
      },
    },
  },
];

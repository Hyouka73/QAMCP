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
    description: `Registra y verifica un perfil de autenticación en .qa/project/auth/profiles.json. Permite método 'credentials' (almacenando únicamente credenciales de PRUEBA en llavero seguro keytar sin texto plano) o 'handoff' (login manual asistido en navegador). Tras capturar la sesión, ejecuta verificación automática contra el primer módulo protegido del plan y guarda el storageState. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        profile: {
          type: 'string',
          description: 'Identificador del perfil de autenticación (ej: "admin", "tester")',
        },
        id: {
          type: 'string',
          description: 'Alias de profile',
        },
        env: {
          type: 'string',
          description: 'Entorno asignado al perfil (ej: "local", "dev", "staging")',
          default: 'local',
        },
        username: {
          type: 'string',
          description: 'Nombre de usuario asociado al perfil',
          default: 'user',
        },
        password: {
          type: 'string',
          description: 'Contraseña o credencial de PRUEBA a almacenar de forma segura en llavero',
        },
        secret: {
          type: 'string',
          description: 'Alias de password para compatibilidad',
        },
        method: {
          type: 'string',
          enum: ['credentials', 'handoff'],
          description: 'Método de inicio de sesión: credentials (auto-login con llavero) o handoff (asistido en ventana)',
          default: 'credentials',
        },
        login_mode: {
          type: 'string',
          enum: ['auto', 'handoff'],
          description: 'Modo de inicio de sesión (auto = credentials)',
          default: 'auto',
        },
        role: {
          type: 'string',
          description: 'Rol de negocio asociado al perfil (ej: "admin", "cliente", "operador")',
        },
        login_route: {
          type: 'string',
          description: 'Ruta de inicio de sesión',
          default: '/login',
        },
        timeout_ms: {
          type: 'number',
          description: 'Tiempo límite de espera en milisegundos',
        },
        storageState: {
          type: 'object',
          description: 'Objeto de sesión storageState previo o inyectado',
        },
      },
      required: ['profile'],
    },
  },
  {
    name: 'qap_auth_list',
    description: `Lista todos los perfiles de autenticación registrados en el proyecto sin exponer secretos. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
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
    description: `Observa una MPA mediante BlackBoxCrawler real, estático y anónimo, con JavaScript deshabilitado. Requiere binding canónico y autorización explícita del host para cada URL GET e IP/red; GET no garantiza inocuidad semántica. Persiste observaciones y evidencias en IKnowledgeStore, sin escribir .qa/modules/ ni avanzar lifecycle. No admite credentials, profile, profileId, sesiones ni headed=true; estos campos legacy se conservan en el esquema pero se rechazan. Cobertura parcial y vistas dependientes de JavaScript se declaran como tales. ${UX_DIRECTIVE}\n\n${QAP_CORE_DIRECTIVES}`,
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
          description: 'Identificador del perfil verificado a utilizar (por defecto: primer perfil verificado)',
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
    description: `Genera o consulta el plan de pruebas estructurado para un módulo registrado (en desarrollo para Sprint 6). ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
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
    description: `Persiste reglas de negocio confirmadas o rechazadas por el usuario, y waivers de categoría, en rules.yaml de un módulo. Respuestas breves de usuario se guardan como borradores que requieren propuesta_enunciado sustantiva para emitir pregunta estructurada de confirmación. Usa operación atómica RMW. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
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

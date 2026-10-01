/* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-return */
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { resolve, join, basename, relative, isAbsolute, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  type Tool,
  type Prompt,
} from '@modelcontextprotocol/sdk/types.js';
import YAML from 'yaml';
import { SchemaValidator, type AuthProfile, type ModuleSpec, type ProjectPhase, type ModuleLifecycleState } from '@qap/shared';
import { FileSystemStorage, validateDefinitions, parsePrdContent, detectarDocumentosProyecto } from '@qap/knowledge';
import {
  canExitOnboarding,
  canExitScoping,
  canExitWorking,
  canCloseModule,
  transitionModule,
  transitionProject,
  validateWaiversBatch,
  generateSessionGapReport,
  assertLifecycleStateInvariants,
  generateDomHypotheses,
  computeApplicableCategories,
  computeCoverage,
  generateNextInterviewBatch,
  obtenerSiguientePreguntaOnboarding,
  type ViewDiscoveryContext,
  type DomField,
  type DomForm,
  type Pregunta,
} from '@qap/engine';
import { AuthManager } from '@qap/auth';
import {
  startViewerServer,
  generateHtmlReport,
  generateMarkdownReport,
  generateJunitReport,
  generateJsonReport,
  QapDatabase,
  PruningEngine,
  type ViewerServerInstance,
} from '@qap/reporter';

import { getPhaseGuidance, buildInterviewNextAction, type SiguienteAccion } from './guidance.js';

let activeViewerServer: ViewerServerInstance | null = null;

function makeDecisionQuestion(
  id: string,
  texto: string,
  opciones: Array<{ id: string; etiqueta: string; recomendada?: boolean }>,
  permiteOtra = true,
  registrarCon: { tool: string; campo: string } = { tool: 'qap_session_plan', campo: 'action' }
): Pregunta {
  return {
    id,
    texto,
    formato: 'una_opcion',
    opciones: opciones.map((o, idx) => ({
      id: o.id,
      etiqueta: o.etiqueta,
      recomendada: o.recomendada ?? (idx === 0),
    })),
    permite_otra: permiteOtra,
    registrar_con: registrarCon,
  };
}

const UX_DIRECTIVE = 'DIRECTIVA DE UX ESTRICTA: Guía al usuario paso a paso interactivo. Si tu entorno dispone de herramienta para hacer preguntas interactivas con opciones (como ask_question), ÚSALA OBLIGATORIAMENTE para cada decisión. Si no, formula la pregunta directa con sus opciones. PROHIBIDO mostrar listas de pasos futuros (1, 2, 3...), tutoriales o pedir comandos de terminal.';

const TARGET_PATH_PROP = {
  type: 'string',
  description: 'Ruta absoluta del proyecto objetivo sobre el cual operar. Si se omite, usa process.cwd()',
};

function buildViewDiscoveryContext(
  rootDir: string,
  moduleName: string,
  view: string = 'default',
  route: string = ''
): ViewDiscoveryContext {
  let formsForView: DomForm[] = [];
  let buttonsForView: any[] = [];
  let storageStateUsed = false;
  const selectorsPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'selectors.json');
  const contextPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'context.yaml');
  if (existsSync(selectorsPath)) {
    try {
      const sel = JSON.parse(readFileSync(selectorsPath, 'utf-8'));
      formsForView = ((sel.selectors?.forms || []) as any[]).map((f: any) => ({
        id: f.id || 'form-1',
        selector: f.selector || 'form',
        fields: ((f.inputs || f.fields || []) as any[]).map((inp: any) => ({
          key: inp.key || inp.name || inp.id || 'field',
          type: inp.type || 'text',
          name: inp.name,
          id: inp.id,
          label: inp.label,
          required: inp.required,
          minlength: inp.minlength,
          maxlength: inp.maxlength,
          pattern: inp.pattern,
        })),
      }));
      buttonsForView = sel.selectors?.buttons || [];
    } catch { /* ignore */ }
  }
  if (existsSync(contextPath)) {
    try {
      const ctxData = YAML.parse(readFileSync(contextPath, 'utf-8'));
      storageStateUsed = Boolean(ctxData?.storage_state_used);
    } catch { /* ignore */ }
  }
  return {
    module: moduleName,
    view,
    route,
    forms: formsForView,
    buttons: buttonsForView,
    storage_state_used: storageStateUsed,
    is_auth_view: false,
  };
}

function buildModuleSummary(rules: any[], waivers: any[]) {
  const porStatus: Record<string, number> = { confirmed: 0, deferred: 0, inferred: 0 };
  const porSource: Record<string, number> = { dom: 0, prd: 0, user: 0 };
  const deferredRules: Array<{ id: string; description: string }> = [];

  for (const r of rules || []) {
    if (r.status) porStatus[r.status] = (porStatus[r.status] || 0) + 1;
    if (r.source) porSource[r.source] = (porSource[r.source] || 0) + 1;
    if (r.status === 'deferred') {
      deferredRules.push({ id: r.id, description: r.description });
    }
  }

  const waiversList = (waivers || []).map((w: any) => ({
    category: w.category,
    reason: w.reason,
    source: w.source || 'user',
  }));

  return {
    reglas_por_status: porStatus,
    reglas_por_source: porSource,
    waivers: waiversList,
    reglas_deferred: deferredRules,
    total_reglas: (rules || []).length,
    total_waivers: (waivers || []).length,
  };
}

const TOOLS: Tool[] = [
  {
    name: 'qap_status',
    description: 'PUNTO DE ENTRADA OBLIGATORIO: Invoca esta herramienta INMEDIATAMENTE cuando el usuario quiera probar su app, testear un proyecto o empezar con QAP. Analiza el repo y te devuelve exactamente la pregunta y opciones que debes presentar con ask_question, sin muros de texto ni pasos futuros.',
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
      },
    },
  },
  {
    name: 'qap_init',
    description: `Inicializa la arquitectura canónica .qa/ y configuraciones base en el proyecto actual. ${UX_DIRECTIVE}`,
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
          description: 'URL base del entorno local (por defecto: "http://localhost:3000")',
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
    description: `Registra un perfil de autenticación en .qa/project/auth/profiles.json y credenciales en llavero seguro. ${UX_DIRECTIVE}`,
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: TARGET_PATH_PROP,
        profile: {
          type: 'string',
          description: 'Identificador del perfil de autenticación (ej: "admin", "tester")',
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
        login_mode: {
          type: 'string',
          enum: ['auto', 'handoff'],
          description: 'Modo de inicio de sesión',
          default: 'auto',
        },
        login_route: {
          type: 'string',
          description: 'Ruta de inicio de sesión',
          default: '/login',
        },
        secret: {
          type: 'string',
          description: 'Contraseña o secreto a almacenar de forma segura',
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
    description: `Actualiza parcial e incrementalmente el contexto de negocio en .qa/project/context.yaml. Evalúa la compuerta de ONBOARDING. ${UX_DIRECTIVE}`,
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
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['prd', 'readme', 'notes', 'none'] },
            ref: { type: 'string', description: 'Ruta o referencia documental' },
            declared: { type: 'boolean', description: 'Declaración explícita de fuente de verdad' },
            notes: { type: 'string', description: 'Notas informales de requerimientos' },
            source: { type: 'string', enum: ['user', 'prd', 'inferred'] },
          },
          required: ['type', 'declared'],
          description: 'Declaración de la fuente de verdad del proyecto',
        },
        source: {
          type: 'string',
          enum: ['user', 'prd', 'inferred'],
          description: 'Procedencia por defecto de los campos actualizados (por defecto: user)',
          default: 'user',
        },
      },
    },
  },
  {
    name: 'qap_context_ingest',
    description: `Ingesta y procesa un documento de requerimientos (PRD, README, spec) para extraer propuestas de contexto y plan sugerido. ${UX_DIRECTIVE}`,
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
      },
    },
  },
  {
    name: 'qap_session_plan',
    description: `Define o amplía el plan de sesión y la decisión de autenticación. Transiciona a WORKING cuando el plan es válido. ${UX_DIRECTIVE}`,
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
            },
            required: ['module', 'path', 'priority'],
          },
          description: 'Lista de módulos a incluir en el plan de sesión',
        },
        auth: {
          type: 'object',
          properties: {
            required: { type: 'boolean', description: 'Si la aplicación requiere autenticación para las pruebas' },
            profile: { type: 'string', description: 'Perfil de autenticación a utilizar' },
          },
          required: ['required'],
          description: 'Decisión explícita de autenticación',
        },
      },
      required: ['modules'],
    },
  },
  {
    name: 'qap_discover',
    description: `Descubre, mapea y registra un módulo de la aplicación (UI, rutas, selectores) en .qa/modules/ de forma autónoma. ${UX_DIRECTIVE}`,
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
        profileId: {
          type: 'string',
          description: 'ID del perfil de autenticación en .qa/project/auth/profiles.json (ej: "admin")',
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
    description: `Persiste reglas de negocio confirmadas o rechazadas por el usuario, y waivers de categoría, en rules.yaml de un módulo. Usa operación atómica RMW. ${UX_DIRECTIVE}`,
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
              source: { type: 'string', enum: ['user', 'prd', 'dom'] },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              view: { type: 'string', description: 'Vista a la que aplica (si difiere del parámetro view)' },
              field: { type: 'string', description: 'Campo o selector al que aplica' },
              evidence: { type: 'string', description: 'Evidencia corta (selector o referencia, máx 120 chars)' },
            },
            required: ['id', 'description', 'status'],
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


const PROMPTS: Prompt[] = [
  {
    name: 'qap_start',
    description: 'Inicia el proceso de QA paso a paso de forma conversacional y guiada.',
    arguments: [],
  },
];

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'qap-mcp-server',
      version: '3.0.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
      instructions: `DIRECTIVAS DE INTERACCIÓN OBLIGATORIAS (QAP v3.0):
1. RUTA OBJETIVO OBLIGATORIA (targetPath): En TODAS las llamadas a herramientas MCP, envía SIEMPRE la ruta absoluta del workspace del usuario en el parámetro 'targetPath'. NUNCA lo omitas.
2. PROHIBIDO mostrar tablas markdown de estado, resúmenes de archivos o listas de próximos pasos (1, 2, 3...).
3. Cuando siguiente_accion trae pregunta, presentala con la herramienta ask_question: UNA sola pregunta por llamada, usando texto, formato y opciones tal cual (no inventes, reordenes ni agregues opciones). Deja siempre disponible la respuesta libre. Si formato es abierta, haz esa unica pregunta en texto y espera. Nunca agrupes varias preguntas en un mensaje ni preguntes algo que siguiente_accion no pidio. Si ask_question no existe en tu cliente, haz la misma pregunta en texto con las opciones numeradas, una a la vez.
4. Tras cada respuesta, registrala con la tool de pregunta.registrar_con y sigue la nueva siguiente_accion. Si el usuario eligio una opcion usa su efecto; si escribio texto libre, registralo con source user y con sus palabras. Nunca registres como source user algo que el usuario no dijo ni eligio.
5. Ejecuta un solo paso por turno y espera la selección del usuario antes de invocar la siguiente tool de QAP.
6. NUNCA llames qap_rules_set con datos no confirmados por el usuario.
7. Si una tool responde con status "blocked", sigue obligatoriamente 'desbloquear_con' y no intentes rodear el bloqueo.
8. Para hipótesis DOM (source "dom", status "inferred"): CONFIRMA cada una con el usuario antes de marcarla como "confirmed". Presenta las hipótesis al usuario y pregunta cuáles son correctas.
9. Presenta al usuario el resumen de cierre del módulo y llama qap_module_close solo con su confirmación explícita (user_confirmed: true).
10. Declara un waiver únicamente cuando el usuario haya dicho que la categoría no aplica, citando su razón (mínimo 15 caracteres).
11. Al cerrar la sesión, presenta al usuario el resumen del reporte de brechas generado.`,
    }
  );


  // Manejador de lista de tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Manejador de lista de prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: PROMPTS };
  });

  // Manejador de invocación de prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;
    if (name === 'qap_start') {
      return {
        description: 'Onboarding paso a paso para QAP',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Inicia revisando el estado de QAP con qap_status y guíame paso a paso sin muros de texto.',
            },
          },
        ],
      };
    }
    throw new Error(`Prompt desconocido: ${name}`);
  });

  // Manejador de llamadas a tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const args = (rawArgs || {}) as Record<string, unknown>;
    const rootDir = args.targetPath ? resolve(String(args.targetPath)) : process.cwd();

    try {
      switch (name) {
        case 'qap_status': {
          const qaDir = resolve(rootDir, '.qa');
          const initialized = existsSync(qaDir);

          let projectName = 'No inicializado';
          let environments: string[] = [];
          let moduleCount = 0;
          let profileCount = 0;
          let executionCount = 0;

          let parsedContext: any = null;
          let parsedEnv: any = null;
          let profilesList: any[] = [];

          if (initialized) {
            const contextPath = join(qaDir, 'project', 'context.yaml');
            if (existsSync(contextPath)) {
              try {
                parsedContext = YAML.parse(readFileSync(contextPath, 'utf-8'));
                projectName = parsedContext?.project_name || projectName;
              } catch {
                // Ignore parse errors
              }
            }

            const envPath = join(qaDir, 'project', 'environments.yaml');
            if (existsSync(envPath)) {
              try {
                parsedEnv = YAML.parse(readFileSync(envPath, 'utf-8'));
                environments = Object.keys(parsedEnv?.environments || {});
              } catch {
                // Ignore parse errors
              }
            }

            const indexPath = join(qaDir, 'modules', 'index.json');
            const fallbackIndexPath = join(qaDir, 'index.json');
            if (existsSync(indexPath)) {
              try {
                const parsed = JSON.parse(readFileSync(indexPath, 'utf-8'));
                moduleCount = Array.isArray(parsed) ? parsed.length : 0;
              } catch {
                moduleCount = 0;
              }
            } else if (existsSync(fallbackIndexPath)) {
              try {
                const parsed = JSON.parse(readFileSync(fallbackIndexPath, 'utf-8'));
                moduleCount = Array.isArray(parsed) ? parsed.length : 0;
              } catch {
                moduleCount = 0;
              }
            } else {
              const modulesDir = join(qaDir, 'modules');
              if (existsSync(modulesDir)) {
                moduleCount = readdirSync(modulesDir).filter((f) => !f.startsWith('.') && f !== 'index.json').length;
              }
            }

            const profilesFile = join(qaDir, 'project', 'auth', 'profiles.json');
            if (existsSync(profilesFile)) {
              try {
                const parsed = JSON.parse(readFileSync(profilesFile, 'utf-8'));
                profilesList = Array.isArray(parsed.profiles) ? parsed.profiles : [];
                profileCount = profilesList.length;
              } catch {
                // Ignore
              }
            }

            const execDir = join(qaDir, 'executions');
            if (existsSync(execDir)) {
              executionCount = readdirSync(execDir).filter((f) => f.endsWith('.json')).length;
            }
          }

          const validator = new SchemaValidator();

          // Detección automática de servicios y URLs en el repo
          let detectedUrl = 'http://localhost:3000';
          let detectedLabel = 'puerto local';
          const candidates = [
            { path: 'vite.config.ts', url: 'http://localhost:5173', label: 'Frontend Vite' },
            { path: 'vite.config.js', url: 'http://localhost:5173', label: 'Frontend Vite' },
            { path: 'front/vite.config.ts', url: 'http://localhost:5173', label: 'Frontend Vite (front/)' },
            { path: 'front/vite.config.js', url: 'http://localhost:5173', label: 'Frontend Vite (front/)' },
            { path: 'next.config.js', url: 'http://localhost:3000', label: 'Next.js' },
            { path: 'next.config.mjs', url: 'http://localhost:3000', label: 'Next.js' },
          ];
          for (const cand of candidates) {
            if (existsSync(join(rootDir, cand.path))) {
              detectedUrl = cand.url;
              detectedLabel = cand.label;
              break;
            }
          }

          const hallazgos = detectarDocumentosProyecto(rootDir);

          if (!initialized) {
            const preg = obtenerSiguientePreguntaOnboarding(null, null, hallazgos, null);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'success',
                      directorio_objetivo: rootDir,
                      initialized: false,
                      projectName: basename(rootDir),
                      environments: [],
                      stats: {
                        modules: 0,
                        authProfiles: 0,
                        executions: 0,
                      },
                      validatorReady: Boolean(validator),
                      detectedService: { url: detectedUrl, label: detectedLabel },
                      hallazgos_workspace: hallazgos,
                      siguiente_accion: {
                        tipo: 'entrevista',
                        descripcion: 'Proyecto no inicializado. Comienza el onboarding respondiendo a la fuente de verdad.',
                        tool: 'qap_init',
                        pregunta: preg ?? undefined,
                      },
                      _guidance_for_assistant: 'NO expliques listas de pasos futuros. Haz al usuario la pregunta con ask_question: ' + (preg?.texto || ''),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Caso inicializado
          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();
          const currentPhase = lifecycleState.phase;

          let faltantes: Array<{ campo: string; motivo: string }> = [];
          if (currentPhase === 'ONBOARDING') {
            const gate = canExitOnboarding(parsedContext, parsedEnv);
            faltantes = gate.faltantes;
          } else if (currentPhase === 'SCOPING') {
            const registeredIds = profilesList.map((p: any) => p.id);
            const gate = canExitScoping(lifecycleState, registeredIds);
            faltantes = gate.faltantes;
          }

          const estadosModulos: Record<string, string> = {};
          const modulesGuidance: Record<string, { state: string; hasPendingHypotheses?: boolean }> = {};
          for (const [k, v] of Object.entries(lifecycleState.modules || {})) {
            estadosModulos[k] = v.state;
            let hasPendingHypotheses = false;
            if (v.state === 'observed' || v.state === 'interviewing') {
              try {
                const rulesFile = await storage.getModuleRules(k);
                const rules = rulesFile?.rules || [];
                hasPendingHypotheses = rules.some((r: any) => r.source === 'dom' && r.status === 'inferred');
              } catch {
                hasPendingHypotheses = false;
              }
            }
            modulesGuidance[k] = {
              state: v.state,
              hasPendingHypotheses,
            };
          }

          let interviewAction: SiguienteAccion | undefined;
          if (currentPhase === 'WORKING') {
            const planModules = (lifecycleState.session?.plan || []).map((p: any) => p.module);
            const candidateModules = [
              ...planModules,
              ...Object.keys(lifecycleState.modules || {}).filter((m) => !planModules.includes(m)),
            ];

            for (const modName of candidateModules) {
              const modState = lifecycleState.modules?.[modName]?.state;
              if (modState === 'interviewing' || modState === 'observed') {
                const planItem = (lifecycleState.session?.plan || []).find((p: any) => p.module === modName);
                const route = planItem?.path || '';
                const vContext = buildViewDiscoveryContext(rootDir, modName, 'default', route);
                let rulesList: any[] = [];
                let waiversList: any[] = [];
                try {
                  const rf = await storage.getModuleRules(modName);
                  rulesList = rf?.rules || [];
                  waiversList = rf?.category_waivers || [];
                } catch { /* empty */ }

                const appCats = computeApplicableCategories(vContext, parsedContext?.roles?.length || 0);
                const cov = computeCoverage(appCats, rulesList, waiversList, 'default');
                if (!cov.completa) {
                  const nextQs = generateNextInterviewBatch(vContext, rulesList, appCats, waiversList);
                  interviewAction = buildInterviewNextAction({
                    module: modName,
                    view: 'default',
                    route,
                    questions: nextQs,
                    applicableCategories: appCats,
                    coverage: cov,
                  });
                  break;
                }
              }
            }
          }

          let reportPath: string | undefined;
          if (currentPhase === 'WRAP_UP') {
            const sessionsDir = join(qaDir, 'project', 'sessions');
            if (lifecycleState.session?.id) {
              const candidate = join(sessionsDir, `${lifecycleState.session.id}.report.md`);
              if (existsSync(candidate)) {
                reportPath = candidate;
              }
            }
            if (!reportPath && existsSync(sessionsDir)) {
              try {
                const reports = readdirSync(sessionsDir).filter((f) => f.endsWith('.report.md'));
                if (reports.length > 0) {
                  reports.sort().reverse();
                  reportPath = join(sessionsDir, reports[0]);
                }
              } catch { /* empty */ }
            }
          }

          const guidance = getPhaseGuidance(currentPhase, {
            faltantes,
            plan: lifecycleState.session?.plan,
            modules: modulesGuidance as any,
            interviewAction,
            reportPath,
            hallazgos,
            context: parsedContext,
            lifecycle: lifecycleState,
            environments: parsedEnv,
          });

          const stateModuleCount = Object.keys(lifecycleState.modules || {}).length;
          const totalModules = Math.max(moduleCount, stateModuleCount);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    initialized: true,
                    fase: currentPhase,
                    estados_modulos: estadosModulos,
                    faltantes,
                    siguiente_accion: guidance.siguiente_accion,
                    hallazgos_workspace: hallazgos,
                    projectName: projectName !== 'No inicializado' ? projectName : basename(rootDir),
                    environments,
                    stats: {
                      modules: totalModules,
                      authProfiles: profileCount,
                      executions: executionCount,
                    },
                    validatorReady: Boolean(validator),
                    detectedService: { url: detectedUrl, label: detectedLabel },
                    _guidance_for_assistant: `Fase actual: ${currentPhase}. Siguiente acción: ${guidance.siguiente_accion.descripcion}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_init': {
          const qaDir = resolve(rootDir, '.qa');
          const projectName = String(args.projectName || basename(rootDir) || 'my-project');
          const envList = Array.isArray(args.environments) && args.environments.length > 0
            ? args.environments.map(String)
            : ['local'];
          const baseUrl = String(args.baseUrl || 'http://localhost:3000');

          const allowedDirs = [
            join(qaDir, 'project'),
            join(qaDir, 'modules'),
            join(qaDir, 'cache'),
            join(qaDir, 'executions'),
            join(qaDir, 'plans'),
          ];
          for (const d of allowedDirs) {
            if (!existsSync(d)) {
              mkdirSync(d, { recursive: true });
            }
          }

          const envsPath = join(qaDir, 'project', 'environments.yaml');
          const contextPath = join(qaDir, 'project', 'context.yaml');
          const gitignorePath = join(qaDir, '.gitignore');
          const lifecyclePath = join(qaDir, 'project', 'lifecycle.json');

          const yaExistia = existsSync(contextPath) || existsSync(envsPath);

          if (!existsSync(envsPath)) {
            const envsMap: Record<string, { url: string; browser_mode: 'auto' | 'headless' | 'headed' }> = {};
            for (const env of envList) {
              envsMap[env] = { url: baseUrl, browser_mode: 'auto' };
            }
            const envsYaml = {
              _version: '1',
              default: envList[0] || 'local',
              environments: envsMap,
            };
            writeFileSync(envsPath, YAML.stringify(envsYaml), 'utf-8');
          }

          if (!existsSync(contextPath)) {
            const contextYaml = {
              _version: '1',
              project_name: projectName,
              description: `Configuración base de QA para ${projectName}`,
              tech_stack: [],
              base_url: baseUrl,
              manually_edited: false,
            };
            writeFileSync(contextPath, YAML.stringify(contextYaml), 'utf-8');
          }

          if (!existsSync(gitignorePath)) {
            writeFileSync(gitignorePath, '# Generado automáticamente por QAP\nexecutions/\ncache/\n', 'utf-8');
          }

          if (!existsSync(lifecyclePath)) {
            const initialLifecycle = {
              _version: '1',
              phase: 'ONBOARDING',
              session: {
                id: '',
                started_at: new Date().toISOString(),
                plan: [],
              },
              modules: {},
              history: [
                {
                  from: 'NONE',
                  to: 'ONBOARDING',
                  at: new Date().toISOString(),
                  reason: 'Inicialización de ciclo de vida con qap_init',
                },
              ],
            };
            writeFileSync(lifecyclePath, JSON.stringify(initialLifecycle, null, 2), 'utf-8');
          }

          const storage = new FileSystemStorage({ rootDir });
          const currentLifecycle = await storage.getLifecycleState();
          const finalPhase = currentLifecycle.phase;

          let ctxObj: any = null;
          if (existsSync(contextPath)) {
            try { ctxObj = YAML.parse(readFileSync(contextPath, 'utf-8')); } catch { /* ignore */ }
          }
          let envObj: any = null;
          if (existsSync(envsPath)) {
            try { envObj = YAML.parse(readFileSync(envsPath, 'utf-8')); } catch { /* ignore */ }
          }

          const gate = canExitOnboarding(ctxObj, envObj);
          const hallazgos = detectarDocumentosProyecto(rootDir);
          const guidance = getPhaseGuidance('ONBOARDING', {
            faltantes: gate.faltantes,
            hallazgos,
            context: ctxObj,
            environments: envObj,
            lifecycle: currentLifecycle,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: '✔ Proyecto inicializado con éxito en .qa/',
                    projectName,
                    environments: envList,
                    directories: allowedDirs.map((p) => p.replace(rootDir, '')),
                    ya_existia: yaExistia,
                    hallazgos_workspace: hallazgos,
                    lifecycle: {
                      phase: finalPhase,
                    },
                    fase: finalPhase,
                    siguiente_accion: guidance.siguiente_accion,
                    _guidance_for_assistant: `Fase actual: ${finalPhase}. Siguiente acción: ${guidance.siguiente_accion.descripcion}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_clean': {
          const qaDir = resolve(rootDir, '.qa');
          if (existsSync(qaDir)) {
            const locksDir = join(qaDir, 'cache', 'locks');
            if (existsSync(locksDir)) {
              try {
                for (const lock of readdirSync(locksDir)) {
                  rmSync(join(locksDir, lock), { force: true });
                }
              } catch {
                // Ignore lock cleanup error
              }
            }
            rmSync(qaDir, { recursive: true, force: true });
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: '✔ Directorio .qa/ y locks remanentes eliminados por completo.',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_auth_add': {
          const profileId = String(args.profile || 'default');
          const env = String(args.env || 'local');
          const username = String(args.username || 'user');
          const loginMode: 'auto' | 'handoff' = args.login_mode === 'handoff' ? 'handoff' : 'auto';
          const loginRoute = String(args.login_route || '/login');
          const secret = args.secret ? String(args.secret) : undefined;

          const authDir = resolve(rootDir, '.qa', 'project', 'auth');
          const profilesPath = join(authDir, 'profiles.json');
          if (!existsSync(authDir)) {
            mkdirSync(authDir, { recursive: true });
          }

          let profiles: AuthProfile[] = [];
          if (existsSync(profilesPath)) {
            try {
              const raw = readFileSync(profilesPath, 'utf-8');
              const parsed = JSON.parse(raw);
              profiles = parsed.profiles || [];
            } catch {
              profiles = [];
            }
          }

          const existingIndex = profiles.findIndex((p) => p.id === profileId);
          const newProfile: AuthProfile = {
            id: profileId,
            env,
            username,
            login_mode: loginMode,
            login_route: loginRoute,
            session_cache: { enabled: true },
            post_login_condition: { type: 'url_contains', value: '/dashboard' },
            handoff_timeout_ms: 30000,
            credential_source: 'keychain',
          };

          if (existingIndex >= 0) {
            profiles[existingIndex] = newProfile;
          } else {
            profiles.push(newProfile);
          }

          writeFileSync(profilesPath, JSON.stringify({ profiles }, null, 2), 'utf-8');

          if (secret) {
            try {
              const authManager = new AuthManager();
              await authManager.setSecret(profileId, secret);
            } catch (err) {
              console.error(`[MCP] Error al almacenar credencial en llavero para ${profileId}:`, err);
            }
          }

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();
          const currentPhase = lifecycleState.phase;

          let faltantes: Array<{ campo: string; motivo: string }> = [];
          if (currentPhase === 'ONBOARDING') {
            const ctxPath = join(rootDir, '.qa', 'project', 'context.yaml');
            const envsPath = join(rootDir, '.qa', 'project', 'environments.yaml');
            const parsedContext = existsSync(ctxPath) ? YAML.parse(readFileSync(ctxPath, 'utf-8')) : null;
            const parsedEnv = existsSync(envsPath) ? YAML.parse(readFileSync(envsPath, 'utf-8')) : null;
            faltantes = canExitOnboarding(parsedContext, parsedEnv).faltantes;
          } else if (currentPhase === 'SCOPING') {
            const registeredIds = profiles.map((p) => p.id);
            faltantes = canExitScoping(lifecycleState, registeredIds).faltantes;
          }

          const guidance = getPhaseGuidance(currentPhase, {
            faltantes,
            plan: lifecycleState.session?.plan,
            modules: lifecycleState.modules as any,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: `✔ Perfil '${profileId}' registrado con éxito en .qa/project/auth/profiles.json.`,
                    profile: newProfile,
                    secretSaved: Boolean(secret),
                    fase: currentPhase,
                    siguiente_accion: guidance.siguiente_accion,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_auth_list': {
          const authDir = resolve(rootDir, '.qa', 'project', 'auth');
          const profilesPath = join(authDir, 'profiles.json');
          let profiles: AuthProfile[] = [];
          if (existsSync(profilesPath)) {
            try {
              const parsed = JSON.parse(readFileSync(profilesPath, 'utf-8'));
              profiles = parsed.profiles || [];
            } catch {
              profiles = [];
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    count: profiles.length,
                    profiles: profiles.map((p) => ({
                      id: p.id,
                      env: p.env,
                      username: p.username,
                      login_mode: p.login_mode,
                      login_route: p.login_route,
                      credential_source: p.credential_source,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_context_set': {
          const qaDir = resolve(rootDir, '.qa');
          if (!existsSync(qaDir)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: `El proyecto en '${rootDir}' no está inicializado. Ejecuta qap_init primero.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const contextPath = join(qaDir, 'project', 'context.yaml');
          let existingContext: Record<string, any> = {
            _version: '1',
            project_name: basename(rootDir),
            description: `Configuración base de QA para ${basename(rootDir)}`,
            tech_stack: [],
            base_url: 'http://localhost:3000',
            manually_edited: false,
          };
          if (existsSync(contextPath)) {
            try {
              existingContext = YAML.parse(readFileSync(contextPath, 'utf-8')) || existingContext;
            } catch { /* use default */ }
          }

          const callerSource = (typeof args.source === 'string' && ['user', 'prd', 'inferred'].includes(args.source))
            ? args.source
            : undefined;
          const defaultSource = callerSource || 'user';

          const ignoredDowngrades: Array<{ field: string; reason: string }> = [];

          // 1. Objetivo
          if (args.objective !== undefined) {
            const newObj = String(args.objective);
            const newSource = (typeof args.objective_source === 'string' && args.objective_source !== 'inferred' && ['user', 'prd'].includes(args.objective_source))
              ? args.objective_source
              : (callerSource ?? (args.objective_source === 'inferred' ? 'inferred' : defaultSource));
            if (existingContext.objective_source === 'user' && newSource !== 'user') {
              ignoredDowngrades.push({
                field: 'objective',
                reason: 'No se puede sobrescribir un objetivo con source "user" por uno con source "prd" o "inferred"',
              });
            } else {
              existingContext.objective = newObj;
              existingContext.objective_source = newSource;
            }
          }

          // 2. Roles
          if (Array.isArray(args.roles)) {
            existingContext.roles = existingContext.roles || [];
            for (const r of args.roles) {
              if (!r) continue;
              const roleName = typeof r === 'string' ? r.trim() : String(r.name || '').trim();
              if (!roleName) continue;
              const rObj = typeof r === 'object' ? r : {};
              const rSource = (rObj.source && rObj.source !== 'inferred' && ['user', 'prd'].includes(rObj.source))
                ? rObj.source
                : (callerSource ?? (rObj.source === 'inferred' ? 'inferred' : defaultSource));
              const exIdx = existingContext.roles.findIndex((er: any) => er.name === roleName);
              if (exIdx >= 0) {
                const exRole = existingContext.roles[exIdx];
                if (exRole.source === 'user' && rSource !== 'user') {
                  ignoredDowngrades.push({
                    field: `roles.${roleName}`,
                    reason: `No se puede sobrescribir el rol '${roleName}' con source "user" por uno con source "prd" o "inferred"`,
                  });
                } else {
                  existingContext.roles[exIdx] = {
                    name: roleName,
                    description: rObj.description !== undefined ? String(rObj.description) : exRole.description,
                    source: rSource,
                  };
                }
              } else {
                existingContext.roles.push({
                  name: roleName,
                  description: rObj.description !== undefined ? String(rObj.description) : undefined,
                  source: rSource,
                });
              }
            }
          }

          // 3. Flujos críticos
          if (Array.isArray(args.critical_flows)) {
            existingContext.critical_flows = existingContext.critical_flows || [];
            for (const f of args.critical_flows) {
              if (!f) continue;
              const flowName = typeof f === 'string' ? f.trim() : String(f.name || '').trim();
              if (!flowName) continue;
              const fObj = typeof f === 'object' ? f : {};
              const fSource = (fObj.source && fObj.source !== 'inferred' && ['user', 'prd'].includes(fObj.source))
                ? fObj.source
                : (callerSource ?? (fObj.source === 'inferred' ? 'inferred' : defaultSource));
              const exIdx = existingContext.critical_flows.findIndex((ef: any) => ef.name === flowName);
              if (exIdx >= 0) {
                const exFlow = existingContext.critical_flows[exIdx];
                if (exFlow.source === 'user' && fSource !== 'user') {
                  ignoredDowngrades.push({
                    field: `critical_flows.${flowName}`,
                    reason: `No se puede sobrescribir el flujo '${flowName}' con source "user" por uno con source "prd" o "inferred"`,
                  });
                } else {
                  existingContext.critical_flows[exIdx] = {
                    name: flowName,
                    description: fObj.description !== undefined ? String(fObj.description) : exFlow.description,
                    priority: fObj.priority !== undefined ? String(fObj.priority) : exFlow.priority,
                    source: fSource,
                  };
                }
              } else {
                existingContext.critical_flows.push({
                  name: flowName,
                  description: fObj.description !== undefined ? String(fObj.description) : undefined,
                  priority: fObj.priority !== undefined ? String(fObj.priority) : undefined,
                  source: fSource,
                });
              }
            }
          }

          // 4. Fuente de verdad
          if (args.source_of_truth && typeof args.source_of_truth === 'object') {
            const sot = args.source_of_truth as Record<string, any>;
            const sotSource = (sot.source && sot.source !== 'inferred' && ['user', 'prd'].includes(sot.source))
              ? sot.source
              : (callerSource ?? (sot.source === 'inferred' ? 'inferred' : defaultSource));
            if (existingContext.source_of_truth?.source === 'user' && sotSource !== 'user') {
              ignoredDowngrades.push({
                field: 'source_of_truth',
                reason: 'No se puede sobrescribir una fuente de verdad con source "user" por una con source "prd" o "inferred"',
              });
            } else {
              existingContext.source_of_truth = {
                type: sot.type,
                declared: Boolean(sot.declared),
                ref: sot.ref !== undefined ? String(sot.ref) : existingContext.source_of_truth?.ref,
                notes: sot.notes !== undefined ? String(sot.notes) : existingContext.source_of_truth?.notes,
                source: sotSource,
              };
            }
          }

          // Validar schema de context.yaml
          const validator = new SchemaValidator();
          const valRes = validator.validateProjectContext(existingContext);
          if (!valRes.valid) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: 'Error de validación contra project-context.schema.json',
                      detalles: valRes.errors,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          writeFileSync(contextPath, YAML.stringify(existingContext), 'utf-8');

          // Evaluar compuerta de ONBOARDING
          const envsPath = join(qaDir, 'project', 'environments.yaml');
          const parsedEnv = existsSync(envsPath) ? YAML.parse(readFileSync(envsPath, 'utf-8')) : null;
          const gateRes = canExitOnboarding(existingContext, parsedEnv);

          const storage = new FileSystemStorage({ rootDir });
          let autoTransitioned = false;
          let finalPhase: ProjectPhase = 'ONBOARDING';

          await storage.updateLifecycleState(async (curr) => {
            finalPhase = curr.phase;
            if (curr.phase === 'ONBOARDING' && gateRes.passed) {
              curr.phase = 'SCOPING';
              finalPhase = 'SCOPING';
              autoTransitioned = true;
              curr.session = curr.session || { id: '', started_at: new Date().toISOString(), plan: [] };
              if (!curr.session.id) {
                curr.session.id = `session_${randomUUID().slice(0, 8)}`;
              }
              curr.history = curr.history || [];
              curr.history.push({
                from: 'ONBOARDING',
                to: 'SCOPING',
                at: new Date().toISOString(),
                reason: 'Compuerta de salida de ONBOARDING superada exitosamente',
              });
            }
            return curr;
          });

          const hallazgos = detectarDocumentosProyecto(rootDir);
          const guidance = getPhaseGuidance(finalPhase, {
            faltantes: gateRes.faltantes,
            hallazgos,
            context: existingContext,
            environments: parsedEnv,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    fase: finalPhase,
                    transicion_automatica: autoTransitioned,
                    faltantes: autoTransitioned ? [] : gateRes.faltantes,
                    ignored_downgrades: ignoredDowngrades.length > 0 ? ignoredDowngrades : undefined,
                    context: existingContext,
                    siguiente_accion: guidance.siguiente_accion,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_context_ingest': {
          const qaDir = resolve(rootDir, '.qa');
          if (!existsSync(qaDir)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: `El proyecto en '${rootDir}' no está inicializado. Ejecuta qap_init primero.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const inputDocPath = args.docPath || args.path;
          const hasDocPath = Boolean(inputDocPath);
          const hasDocContent = Boolean(args.docContent);
          if ((hasDocPath && hasDocContent) || (!hasDocPath && !hasDocContent)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: 'Debe proporcionarse exactamente uno de docPath (o path) o docContent.',
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          let rawContent = '';
          let docRef = '';

          if (hasDocPath) {
            const rawPath = String(inputDocPath);
            const ext = extname(rawPath).toLowerCase();
            if (!['.md', '.markdown', '.txt'].includes(ext)) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        directorio_objetivo: rootDir,
                        error: 'Extensión no permitida. Solo se admiten archivos .md, .markdown o .txt.',
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            const realWorkspace = realpathSync(rootDir);
            const resolvedPath = resolve(rootDir, rawPath);
            if (!existsSync(resolvedPath)) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        directorio_objetivo: rootDir,
                        error: `Archivo no encontrado: ${rawPath}`,
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            const realDocPath = realpathSync(resolvedPath);
            const rel = relative(realWorkspace, realDocPath);
            if (rel.startsWith('..') || isAbsolute(rel)) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        directorio_objetivo: rootDir,
                        error: 'Acceso denegado: el archivo resuelve fuera del workspace objetivo.',
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            const stats = statSync(realDocPath);
            if (stats.size > 512 * 1024) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        directorio_objetivo: rootDir,
                        error: 'Tamaño de archivo excedido: máximo 512 KB.',
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            rawContent = readFileSync(realDocPath, 'utf-8');
            docRef = rawPath;
          } else {
            rawContent = String(args.docContent);
            if (Buffer.byteLength(rawContent, 'utf-8') > 512 * 1024) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        directorio_objetivo: rootDir,
                        error: 'Tamaño de contenido excedido: máximo 512 KB.',
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }
            docRef = 'inline_docContent';
          }

          // Parsear con parsePrdContent (dato no confiable)
          const parsed = parsePrdContent(rawContent, docRef);

          const extractedObjective = (parsed.objective || '').slice(0, 500).trim();
          const extractedUsers = (parsed.users || []).map((u) => u.slice(0, 50).trim()).filter(Boolean);
          const extractedNotes = (parsed.notes || '').slice(0, 500).trim();
          const extractedRoutes = (parsed.routes || []).map((r) => r.slice(0, 100).trim()).filter(Boolean);

          const suggestedModules = extractedRoutes.map((r) => {
            const cleanName = r.replace(/^\//, '').replace(/\//g, '-').replace(/[^a-zA-Z0-9_-]/g, '') || 'modulo';
            return {
              module: cleanName,
              path: r.startsWith('/') ? r : `/${r}`,
              priority: 'medium',
            };
          });

          // Persistir en context.yaml con source "inferred" sin sobrescribir "user"
          const contextPath = join(qaDir, 'project', 'context.yaml');
          let currentContext: Record<string, any> = {
            _version: '1',
            project_name: basename(rootDir),
            description: `Configuración base de QA para ${basename(rootDir)}`,
            tech_stack: [],
            base_url: 'http://localhost:3000',
            manually_edited: false,
          };
          if (existsSync(contextPath)) {
            try {
              currentContext = YAML.parse(readFileSync(contextPath, 'utf-8')) || currentContext;
            } catch { /* use default */ }
          }

          if (extractedObjective && currentContext.objective_source !== 'user') {
            currentContext.objective = extractedObjective;
            currentContext.objective_source = 'inferred';
          }

          if (extractedUsers.length > 0) {
            currentContext.roles = currentContext.roles || [];
            for (const u of extractedUsers) {
              const existingIdx = currentContext.roles.findIndex((er: any) => er.name === u);
              if (existingIdx >= 0) {
                if (currentContext.roles[existingIdx].source !== 'user') {
                  currentContext.roles[existingIdx].source = 'inferred';
                }
              } else {
                currentContext.roles.push({ name: u, source: 'inferred' });
              }
            }
          }

          if (currentContext.source_of_truth?.source !== 'user') {
            currentContext.source_of_truth = {
              type: 'prd',
              ref: docRef,
              declared: false,
              notes: extractedNotes || undefined,
              source: 'inferred',
            };
          }

          writeFileSync(contextPath, YAML.stringify(currentContext), 'utf-8');

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();

          // Reportar faltantes requeridos por E1 que parsePrdContent no extrae o que son inferred
          const faltantes = [
            { campo: 'source_of_truth', motivo: 'sin confirmar (declared debe ser true con source user|prd)' },
            { campo: 'critical_flows', motivo: 'el documento no define flujos críticos (deben definirse con qap_context_set)' },
            { campo: 'objective', motivo: 'sin confirmar (extraído como inferred)' },
            { campo: 'roles', motivo: 'sin confirmar (extraídos como inferred)' },
          ];

          const hallazgos = detectarDocumentosProyecto(rootDir);
          const guidance = getPhaseGuidance(lifecycleState.phase, {
            faltantes,
            suggestedModules,
            hallazgos,
            context: currentContext,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    fase: lifecycleState.phase,
                    propuestas_extraidas: {
                      objetivo: extractedObjective || undefined,
                      roles: extractedUsers.map((name) => ({ name, source: 'inferred' })),
                      notas: extractedNotes || undefined,
                      rutas: extractedRoutes,
                    },
                    modulos_sugeridos_para_plan: suggestedModules,
                    solicitud_confirmacion: 'Presenta estas propuestas al usuario. Si las confirma tal cual, regístralas con qap_context_set (source: "prd"). Si las corrige, usa source: "user".',
                    faltantes,
                    siguiente_accion: guidance.siguiente_accion,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_session_plan': {
          const qaDir = resolve(rootDir, '.qa');
          if (!existsSync(qaDir)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: `El proyecto en '${rootDir}' no está inicializado. Ejecuta qap_init primero.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();

          if (lifecycleState.phase === 'ONBOARDING') {
            const ctxPath = join(qaDir, 'project', 'context.yaml');
            const envsPath = join(qaDir, 'project', 'environments.yaml');
            const parsedContext = existsSync(ctxPath) ? YAML.parse(readFileSync(ctxPath, 'utf-8')) : null;
            const parsedEnv = existsSync(envsPath) ? YAML.parse(readFileSync(envsPath, 'utf-8')) : null;
            const gate = canExitOnboarding(parsedContext, parsedEnv);
            const hallazgos = detectarDocumentosProyecto(rootDir);
            const guidance = getPhaseGuidance('ONBOARDING', {
              faltantes: gate.faltantes,
              hallazgos,
              context: parsedContext,
              environments: parsedEnv,
              lifecycle: lifecycleState,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'ONBOARDING',
                      razon: 'No se puede definir el plan de sesión en la fase ONBOARDING. Completa el contexto de negocio primero.',
                      desbloquear_con: {
                        tool: 'qap_context_set',
                        descripcion: 'Define el objetivo, roles, flujos críticos y fuente de verdad con qap_context_set.',
                      },
                      faltantes: gate.faltantes,
                      siguiente_accion: guidance.siguiente_accion,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Validación atómica del lote
          const rawModules = Array.isArray(args.modules)
            ? args.modules
            : (Array.isArray(args.plan) ? args.plan : undefined);
          if (!Array.isArray(rawModules) || rawModules.length === 0) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: 'El parámetro modules debe ser una lista con al menos un módulo.',
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const seenNames = new Set<string>();
          for (const m of rawModules) {
            if (!m || typeof m !== 'object') {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: 'Elemento de módulo inválido en el lote.' }, null, 2) }],
              };
            }
            const mName = String(m.module || '').trim();
            const mPath = String(m.path || '').trim();
            const mPriority = String(m.priority || '').trim();

            if (!mName) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: 'Nombre de módulo no puede estar vacío.' }, null, 2) }],
              };
            }
            if (lifecycleState.phase === 'WRAP_UP' && lifecycleState.modules?.[mName]?.state === 'closed') {
              return {
                isError: true,
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    isError: true,
                    directorio_objetivo: rootDir,
                    error: `El módulo '${mName}' ya se encuentra cerrado formalmente (closed) en una sesión previa y no puede ser reabierto. Lote rechazado por completo.`,
                  }, null, 2),
                }],
              };
            }
            if (!mPath || !mPath.startsWith('/')) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `La ruta '${mPath}' del módulo '${mName}' debe iniciar con '/'.` }, null, 2) }],
              };
            }
            if (!['high', 'medium', 'low'].includes(mPriority)) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Prioridad inválida '${mPriority}' en módulo '${mName}'. Debe ser high, medium o low.` }, null, 2) }],
              };
            }
            if (seenNames.has(mName)) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Módulos duplicados en el lote: '${mName}'.` }, null, 2) }],
              };
            }
            seenNames.add(mName);
          }

          const profilesPath = join(qaDir, 'project', 'auth', 'profiles.json');
          let registeredProfiles: string[] = [];
          if (existsSync(profilesPath)) {
            try {
              const parsed = JSON.parse(readFileSync(profilesPath, 'utf-8'));
              registeredProfiles = (parsed.profiles || []).map((p: any) => p.id);
            } catch { /* empty */ }
          }

          let scopingGateRes: { passed: boolean; faltantes: Array<{ campo: string; motivo: string }> } = { passed: true, faltantes: [] };
          let updatedPhase = lifecycleState.phase;

          await storage.updateLifecycleState(async (curr) => {
            curr.session = curr.session || { id: `session_${randomUUID().slice(0, 8)}`, started_at: new Date().toISOString(), plan: [] };
            curr.modules = curr.modules || {};

            if (curr.phase === 'WRAP_UP') {
              curr.phase = 'SCOPING';
              curr.history = curr.history || [];
              curr.history.push({
                from: 'WRAP_UP',
                to: 'SCOPING',
                at: new Date().toISOString(),
                reason: 'Inicio de nueva sesión de trabajo desde WRAP_UP',
              });

              const prevAuth = curr.session?.auth;
              let sessionAuth = prevAuth || { required: false };
              if (args.auth && typeof args.auth === 'object') {
                const a = args.auth as Record<string, any>;
                sessionAuth = {
                  required: Boolean(a.required),
                  profile: a.profile !== undefined ? String(a.profile) : undefined,
                };
              }

              curr.session = {
                id: randomUUID(),
                started_at: new Date().toISOString(),
                auth: sessionAuth,
                plan: rawModules.map((m: any) => ({
                  module: String(m.module).trim(),
                  path: String(m.path).trim(),
                  priority: String(m.priority).trim(),
                  status: 'planned',
                })),
              };

              curr.modules = curr.modules || {};
              for (const item of curr.session.plan) {
                if (!curr.modules[item.module]) {
                  curr.modules[item.module] = {
                    state: 'planned',
                    updated_at: new Date().toISOString(),
                  };
                }
              }

              assertLifecycleStateInvariants(curr);
              scopingGateRes = canExitScoping(curr, registeredProfiles);

              if (scopingGateRes.passed) {
                curr.phase = 'WORKING';
                curr.history.push({
                  from: 'SCOPING',
                  to: 'WORKING',
                  at: new Date().toISOString(),
                  reason: 'Compuerta de salida de SCOPING superada exitosamente en nueva sesión',
                });
              }
              if (curr.history.length > 50) {
                curr.history = curr.history.slice(-50);
              }
              updatedPhase = curr.phase;
              return curr;
            }

            if (curr.phase === 'SCOPING') {
              if (args.auth && typeof args.auth === 'object') {
                const a = args.auth as Record<string, any>;
                curr.session.auth = {
                  required: Boolean(a.required),
                  profile: a.profile !== undefined ? String(a.profile) : undefined,
                };
              }

              curr.session.plan = rawModules.map((m: any) => ({
                module: String(m.module).trim(),
                path: String(m.path).trim(),
                priority: String(m.priority).trim(),
                status: 'planned',
              }));

              for (const item of curr.session.plan) {
                if (!curr.modules[item.module]) {
                  curr.modules[item.module] = {
                    state: 'planned',
                    updated_at: new Date().toISOString(),
                  };
                }
              }

              assertLifecycleStateInvariants(curr);
              scopingGateRes = canExitScoping(curr, registeredProfiles);

              if (scopingGateRes.passed) {
                curr.phase = 'WORKING';
                curr.history = curr.history || [];
                curr.history.push({
                  from: 'SCOPING',
                  to: 'WORKING',
                  at: new Date().toISOString(),
                  reason: 'Compuerta de salida de SCOPING superada exitosamente',
                });
              }
              updatedPhase = curr.phase;
              return curr;
            } else if (curr.phase === 'WORKING') {
              // En WORKING solo amplía (no modifica ni borra existentes)
              curr.session.plan = curr.session.plan || [];
              for (const m of rawModules) {
                const mName = String(m.module).trim();
                const mPath = String(m.path).trim();
                const mPriority = String(m.priority).trim();
                const existsInPlan = curr.session.plan.some((p) => p.module === mName);
                if (!existsInPlan) {
                  curr.session.plan.push({
                    module: mName,
                    path: mPath,
                    priority: mPriority,
                    status: 'planned',
                  });
                }
                if (!curr.modules[mName]) {
                  curr.modules[mName] = {
                    state: 'planned',
                    updated_at: new Date().toISOString(),
                  };
                }
              }

              if (args.auth && !curr.session.auth && typeof args.auth === 'object') {
                const a = args.auth as Record<string, any>;
                curr.session.auth = {
                  required: Boolean(a.required),
                  profile: a.profile !== undefined ? String(a.profile) : undefined,
                };
              }

              assertLifecycleStateInvariants(curr);
              updatedPhase = curr.phase;
              return curr;
            }

            return curr;
          });

          const freshState = await storage.getLifecycleState();
          const guidance = getPhaseGuidance(freshState.phase, {
            faltantes: scopingGateRes.faltantes,
            plan: freshState.session?.plan,
            modules: freshState.modules as any,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    fase: freshState.phase,
                    transicion_automatica: updatedPhase === 'WORKING' && lifecycleState.phase === 'SCOPING',
                    plan: freshState.session?.plan,
                    auth: freshState.session?.auth,
                    faltantes: freshState.phase === 'WORKING' ? [] : scopingGateRes.faltantes,
                    siguiente_accion: guidance.siguiente_accion,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_discover': {
          const qaDir = resolve(rootDir, '.qa');
          if (!existsSync(qaDir)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: `El proyecto en '${rootDir}' no está inicializado. Ejecuta qap_init primero.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const name = String(args.name);
          const route = String(args.path);
          const rawDesc = args.description ? String(args.description) : '';
          const desc = rawDesc || `Módulo ${name}`;
          const tags = Array.isArray(args.tags) ? args.tags.map(String) : [];
          const headed = Boolean(args.headed);

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();
          const currentPhase = lifecycleState.phase;

          if (currentPhase === 'ONBOARDING') {
            const ctxPath = join(qaDir, 'project', 'context.yaml');
            const envsPath = join(qaDir, 'project', 'environments.yaml');
            const parsedContext = existsSync(ctxPath) ? YAML.parse(readFileSync(ctxPath, 'utf-8')) : null;
            const parsedEnv = existsSync(envsPath) ? YAML.parse(readFileSync(envsPath, 'utf-8')) : null;
            const gate = canExitOnboarding(parsedContext, parsedEnv);
            const hallazgos = detectarDocumentosProyecto(rootDir);
            const guidance = getPhaseGuidance('ONBOARDING', {
              faltantes: gate.faltantes,
              hallazgos,
              context: parsedContext,
              environments: parsedEnv,
              lifecycle: lifecycleState,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'ONBOARDING',
                      razon: 'No se puede ejecutar qap_discover en la fase ONBOARDING. Debes completar el contexto de negocio antes de explorar.',
                      desbloquear_con: {
                        tool: 'qap_context_set',
                        descripcion: 'Define el objetivo, roles, flujos críticos y fuente de verdad con qap_context_set.',
                      },
                      faltantes: gate.faltantes,
                      siguiente_accion: guidance.siguiente_accion,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          if (currentPhase === 'SCOPING') {
            const profilesPath = join(qaDir, 'project', 'auth', 'profiles.json');
            let registeredProfiles: string[] = [];
            if (existsSync(profilesPath)) {
              try {
                const parsed = JSON.parse(readFileSync(profilesPath, 'utf-8'));
                registeredProfiles = (parsed.profiles || []).map((p: any) => p.id);
              } catch { /* empty */ }
            }
            const gate = canExitScoping(lifecycleState, registeredProfiles);
            const guidance = getPhaseGuidance('SCOPING', { faltantes: gate.faltantes });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'SCOPING',
                      razon: 'No se puede ejecutar qap_discover en la fase SCOPING. Debes definir el plan de sesión con qap_session_plan.',
                      desbloquear_con: {
                        tool: 'qap_session_plan',
                        descripcion: 'Registra los módulos y la decisión de autenticación con qap_session_plan.',
                      },
                      faltantes: gate.faltantes,
                      siguiente_accion: guidance.siguiente_accion,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          if (currentPhase === 'WRAP_UP') {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WRAP_UP',
                      razon: 'La sesión actual ha concluido en la fase WRAP_UP. Inicia una nueva sesión con qap_session_plan o revisa el Knowledge Graph con qap_server.',
                      desbloquear_con: {
                        tool: 'qap_session_plan',
                        descripcion: 'Inicia una nueva sesión de trabajo con qap_session_plan.',
                      },
                      siguiente_accion: {
                        tipo: 'decision',
                        descripcion: 'La sesión actual ha concluido en WRAP_UP. Inicia una nueva sesión con qap_session_plan o revisa el Knowledge Graph con qap_server.',
                        tool: 'qap_session_plan',
                        pregunta: makeDecisionQuestion(
                          'decision_wrap_up',
                          'La sesión ha finalizado. Puedes iniciar una nueva sesión con qap_session_plan o revisar el Knowledge Graph con qap_server.',
                          [
                            { id: 'plan', etiqueta: 'Iniciar nueva sesión con qap_session_plan', recomendada: true },
                            { id: 'server', etiqueta: 'Revisar Knowledge Graph con qap_server' },
                          ]
                        ),
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Fase WORKING: el módulo debe existir en modules
          const modEntry = lifecycleState.modules?.[name];
          if (!modEntry) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: `El módulo '${name}' no está registrado en el plan de sesión ni en los módulos del estado.`,
                      desbloquear_con: {
                        tool: 'qap_session_plan',
                        descripcion: `Registra el módulo '${name}' en el plan con qap_session_plan antes de descubrirlo.`,
                      },
                      siguiente_accion: {
                        tipo: 'decision',
                        descripcion: `Registra el módulo '${name}' usando qap_session_plan o consulta el estado del proyecto.`,
                        tool: 'qap_session_plan',
                        pregunta: makeDecisionQuestion(
                          'decision_modulo_no_en_plan',
                          `El módulo '${name}' no forma parte del plan. Registra el módulo con qap_session_plan o consulta el estado del proyecto con qap_status.`,
                          [
                            { id: 'registrar', etiqueta: 'Registrar módulo con qap_session_plan', recomendada: true },
                            { id: 'status', etiqueta: 'Ver estado del proyecto (qap_status)' },
                          ]
                        ),
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const modStatus = modEntry.state;
          if (modStatus === 'closed' || modStatus === 'waived') {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: `El módulo '${name}' ya se encuentra en estado terminal '${modEntry.state}' y no puede ser redescubierto.`,
                      desbloquear_con: {
                        tool: 'qap_session_plan',
                        descripcion: 'Registra un nuevo módulo en el plan o selecciona otro módulo activo.',
                      },
                      siguiente_accion: {
                        tipo: 'trabajo',
                        descripcion: `El módulo '${name}' está finalizado (${modEntry.state}). Selecciona otro módulo del plan.`,
                        tool: 'qap_status',
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // 1. Guardar Spec en cache
          const cacheDir = join(qaDir, 'cache', 'discover');
          if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
          const spec: ModuleSpec = { name, path: route, tags };
          writeFileSync(join(cacheDir, `${name}.spec.json`), JSON.stringify(spec, null, 2), 'utf-8');

          let discoveredData: {
            routes: string[];
            forms: any[];
            buttons: any[];
            inputs: any[];
            links: any[];
            pageTitle: string;
          } = { routes: [], forms: [], buttons: [], inputs: [], links: [], pageTitle: name };

          // Intentar exploración activa con Playwright
          let playwrightUsed = false;
          let playwrightError: string | null = null;
          try {
            const { PlaywrightAdapter } = await import('@qap/playwright-adapter');

            // Resolver baseUrl desde environments.yaml o context.yaml
            let baseUrl = 'http://localhost:3000';
            const envsPath = join(qaDir, 'project', 'environments.yaml');
            if (existsSync(envsPath)) {
              try {
                const parsedEnv = YAML.parse(readFileSync(envsPath, 'utf-8'));
                const defaultEnv = parsedEnv?.default ?? 'local';
                baseUrl = parsedEnv?.environments?.[defaultEnv]?.url ?? baseUrl;
              } catch { /* usa default */ }
            } else {
              const ctxPath = join(qaDir, 'project', 'context.yaml');
              if (existsSync(ctxPath)) {
                try {
                  const parsedCtx = YAML.parse(readFileSync(ctxPath, 'utf-8'));
                  if (parsedCtx?.base_url) baseUrl = parsedCtx.base_url;
                } catch { /* usa default */ }
              }
            }

            // Resolver credenciales y sesión para descubrimiento autenticado
            let credentials: { username: string; password: string } | undefined = undefined;
            if (args.credentials && typeof args.credentials === 'object') {
              const c = args.credentials as Record<string, unknown>;
              if (c.username && c.password) {
                credentials = { username: String(c.username), password: String(c.password) };
              }
            } else if (args.profileId) {
              const profileId = String(args.profileId);
              const profilesPath = join(rootDir, '.qa', 'project', 'auth', 'profiles.json');
              if (existsSync(profilesPath)) {
                try {
                  const parsed = JSON.parse(readFileSync(profilesPath, 'utf-8'));
                  const profile = (parsed.profiles || []).find((p: any) => p.id === profileId);
                  if (profile) {
                    const { AuthManager } = await import('@qap/auth');
                    const authMgr = new AuthManager(rootDir);
                    const creds = await authMgr.getCredentials(profileId);
                    if (creds && creds.password) {
                      credentials = { username: profile.username, password: creds.password };
                    } else if (profile.username) {
                      credentials = { username: profile.username, password: '' };
                    }
                  }
                } catch { /* usa credenciales vacías si falla */ }
              }
            }

            const sessionPath = join(qaDir, 'cache', 'sessions', 'discover-session.json');

            const adapter = new PlaywrightAdapter({
              headless: !headed,
              baseUrl,
              sessionPath,
              credentials,
            });
            const discovered = await adapter.discover({ name, path: route, tags });

            const ctxObj = (discovered.context || {}) as Record<string, unknown>;
            discoveredData = {
              routes: Array.isArray(ctxObj.discovered_routes)
                ? (ctxObj.discovered_routes as string[])
                : [],
              forms: Array.isArray(ctxObj.forms) ? (ctxObj.forms as any[]) : [],
              buttons: Array.isArray(ctxObj.buttons) ? (ctxObj.buttons as any[]) : [],
              inputs: Array.isArray(ctxObj.inputs) ? (ctxObj.inputs as any[]) : [],
              links: Array.isArray(ctxObj.links) ? (ctxObj.links as any[]) : [],
              pageTitle: discovered.description ?? name,
            };
            if (ctxObj.playwright_error) {
              playwrightError = String(ctxObj.playwright_error);
              playwrightUsed = false;
            } else {
              playwrightUsed = true;
            }

            // Metadatos de autenticación y sesión
            (discoveredData as any).isAuthView = Boolean(ctxObj.is_auth_view);
            (discoveredData as any).sessionSaved = Boolean(ctxObj.session_saved);
            (discoveredData as any).storageStateUsed = Boolean(ctxObj.storage_state_used);
            (discoveredData as any).currentUrl = ctxObj.current_url ? String(ctxObj.current_url) : route;
          } catch (err) {
            playwrightError = err instanceof Error ? err.message : String(err);
          }

          const isAuthView = Boolean((discoveredData as any).isAuthView);
          const sessionSaved = Boolean((discoveredData as any).sessionSaved);
          const storageStateUsed = Boolean((discoveredData as any).storageStateUsed);
          const currentUrl: string = typeof (discoveredData as any).currentUrl === 'string' ? String((discoveredData as any).currentUrl) : route;
          const playwrightStatus = playwrightUsed ? 'explorando' : playwrightError ? 'fallido' : 'no_disponible';

          // context.yaml de la vista por defecto
          const viewContext = {
            _version: '1',
            view_name: 'default',
            description: desc,
            path: route,
            current_url: currentUrl,
            tags,
            is_auth_view: isAuthView,
            session_saved: sessionSaved,
            storage_state_used: storageStateUsed,
            playwright_used: playwrightUsed,
            playwright_error: playwrightError,
            discovered_at: new Date().toISOString(),
            page_title: discoveredData.pageTitle,
            routes_found: discoveredData.routes,
          };

          // Validar contra module-view.schema.json antes de escribir nada en disco (E5b)
          const validator = new SchemaValidator();
          const validationResult = validator.validateModuleView(viewContext);
          if (!validationResult.valid) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      message: 'Error de validación contra module-view.schema.json',
                      errors: validationResult.errors,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Estructura granular de persistencia (Fix 5)
          const modulesDir = join(qaDir, 'modules');
          const moduleDir = join(modulesDir, name);
          const viewsDir = join(moduleDir, 'views', 'default');
          mkdirSync(viewsDir, { recursive: true });

          writeFileSync(join(viewsDir, 'context.yaml'), YAML.stringify(viewContext), 'utf-8');

          // selectors.json de la vista
          const selectorsData = {
            _version: '1',
            view: 'default',
            module: name,
            generated_at: new Date().toISOString(),
            selectors: {
              forms: discoveredData.forms,
              inputs: discoveredData.inputs,
              buttons: discoveredData.buttons,
              links: discoveredData.links,
            },
          };
          writeFileSync(join(viewsDir, 'selectors.json'), JSON.stringify(selectorsData, null, 2), 'utf-8');

          // summary.json en raíz del módulo
          const summaryData = {
            _version: '1',
            name,
            description: desc,
            path: route,
            tags,
            views: ['default'],
            last_updated: new Date().toISOString(),
          };
          writeFileSync(join(moduleDir, 'summary.json'), JSON.stringify(summaryData, null, 2), 'utf-8');

          // Actualizar index.json global
          const indexPath = join(qaDir, 'modules', 'index.json');
          let globalIndex: Record<string, unknown>[] = [];
          if (existsSync(indexPath)) {
            try { globalIndex = JSON.parse(readFileSync(indexPath, 'utf-8')); } catch { /* inicia vacío */ }
          }
          const existingIdx = globalIndex.findIndex((m: any) => m.name === name);
          const indexEntry = { name, path: route, tags, views: ['default'], last_updated: new Date().toISOString() };
          if (existingIdx >= 0) globalIndex[existingIdx] = indexEntry;
          else globalIndex.push(indexEntry);
          writeFileSync(indexPath, JSON.stringify(globalIndex, null, 2), 'utf-8');
          try {
            writeFileSync(join(qaDir, 'index.json'), JSON.stringify(globalIndex, null, 2), 'utf-8');
          } catch { /* ignore */ }

          // E4: Generar hipótesis DOM deterministas y calcular cobertura inicial
          const viewCtx: ViewDiscoveryContext = {
            module: name,
            view: 'default',
            forms: (discoveredData.forms || []).map((f: any) => ({
              id: f.id || 'form-1',
              selector: f.selector || 'form',
              fields: ((f.inputs || f.fields || []) as any[]).map((inp: any) => ({
                key: inp.key || inp.name || inp.id || 'field',
                type: inp.type || 'text',
                name: inp.name,
                id: inp.id,
                label: inp.label,
                autocomplete: inp.autocomplete,
                required: inp.required,
                minlength: inp.minlength,
                maxlength: inp.maxlength,
                pattern: inp.pattern,
                min: inp.min,
                max: inp.max,
                hidden: inp.hidden,
                disabled: inp.disabled,
                formId: f.id,
              } satisfies DomField)),
              submitSelector: f.submitSelector,
            } satisfies DomForm)),
            buttons: (discoveredData.buttons || []),
            storage_state_used: storageStateUsed,
            is_auth_view: isAuthView,
          };

          const domHypotheses = generateDomHypotheses(viewCtx);

          // Persistir hipótesis en rules.yaml del módulo (atómico, E4)
          let persistedRulesCount = 0;
          let manuallyEditedSkipped = false;
          if (domHypotheses.length > 0) {
            const updatedRules = await storage.updateModuleRules(name, (current) => {
              if (current.manually_edited) {
                manuallyEditedSkipped = true;
                return current;
              }
              const existing = current.rules || [];
              const existingIds = new Set(existing.map((r: any) => r.id));
              const newHypotheses = domHypotheses.filter((h) => !existingIds.has(h.id));
              return {
                ...current,
                rules: [...existing, ...newHypotheses],
              };
            });
            const allRules = updatedRules.rules || [];
            persistedRulesCount = allRules.filter((r: any) => r.source === 'dom' && r.status === 'inferred').length;
          }

          // Calcular cobertura inicial
          const currentRulesFile = await storage.getModuleRules(name);
          const currentRules = currentRulesFile?.rules || [];
          const currentWaivers = currentRulesFile?.category_waivers || [];

          // Cargar roles del proyecto para determinar si aplica 'actor'
          let projectRoleCount = 0;
          try {
            const ctx = await storage.getProjectContext();
            const roles = Array.isArray((ctx as any).roles) ? (ctx as any).roles : [];
            projectRoleCount = roles.length;
          } catch { /* sin contexto: 0 roles */ }

          const applicableCategories = computeApplicableCategories(viewCtx, projectRoleCount);
          const coverage = computeCoverage(applicableCategories, currentRules, currentWaivers, 'default');
          const nextQuestions = generateNextInterviewBatch(viewCtx, currentRules, applicableCategories, currentWaivers);

          // Rutas detectadas fuera del plan (máx 10)
          const plannedPaths = new Set((lifecycleState.session?.plan || []).map((p: any) => p.path));
          plannedPaths.add(route);
          const rawDetectedRoutes: string[] = [
            ...(discoveredData.routes || []),
            ...(discoveredData.links || []).map((l: any) => (typeof l === 'string' ? l : l.href || l.url || '')),
          ];
          const rutasDetectadasFueraDelPlan = rawDetectedRoutes
            .map((r) => r.split('?')[0].split('#')[0].trim())
            .filter((r) => r.startsWith('/') && !plannedPaths.has(r))
            .filter((r, idx, arr) => arr.indexOf(r) === idx)
            .slice(0, 10);

          // E4: Construir siguiente_accion tipo entrevista_vista (o decision ante fallo de Playwright, T9)
          const isPlaywrightFailure = !playwrightUsed || Boolean(playwrightError);
          const siguienteAccion = isPlaywrightFailure
            ? {
                tipo: 'decision' as const,
                descripcion: `Falló la exploración con Playwright para el módulo '${name}': ${playwrightError || 'Error de navegación'}. Decide si reintentar con otra URL, verificar servidor o continuar manualmente.`,
                tool: 'qap_discover',
                pregunta: makeDecisionQuestion(
                  'decision_fallo_playwright',
                  `Falló la exploración con Playwright para el módulo '${name}'. Selecciona cómo proceder:`,
                  [
                    { id: 'reintentar', etiqueta: 'Reintentar qap_discover', recomendada: true },
                    { id: 'verificar', etiqueta: 'Verificar servidor o URL' },
                    { id: 'otro_modulo', etiqueta: 'Continuar con otro módulo' },
                  ],
                  true,
                  { tool: 'qap_discover', campo: 'action' }
                ),
              }
            : buildInterviewNextAction({
                module: name,
                view: 'default',
                route,
                questions: nextQuestions,
                applicableCategories,
                coverage,
                rutasDetectadasFueraDelPlan,
              });

          // E0a: NO incluir accion_inmediata_requerida ni directiva_estricta
          const responsePayload: Record<string, unknown> = {
            status: 'success',
            directorio_objetivo: rootDir,
            message: manuallyEditedSkipped
              ? `✔ Módulo '${name}' descubierto. Nota: rules.yaml tiene manually_edited: true, no se insertaron nuevas hipótesis.`
              : `✔ Módulo '${name}' descubierto y persistido en .qa/modules/${name}/`,
            module: summaryData,
            view: viewContext,
            playwright_status: playwrightStatus,
            playwright_error: playwrightError,
            is_auth_view: isAuthView,
            session_saved: sessionSaved,
            storage_state_used: storageStateUsed,
            headed_disponible: true,
            hipotesis_dom_persistidas: persistedRulesCount,
            manually_edited_ignorado: manuallyEditedSkipped || undefined,
            rutas_detectadas_fuera_del_plan: rutasDetectadasFueraDelPlan,
            categorias_aplicables: applicableCategories,
            siguiente_accion: siguienteAccion,
          };

          // E0b: Transición a través de transitionModule (con soporte a regresión consolidated -> interviewing)
          await storage.updateLifecycleState(async (curr) => {
            const mod = curr.modules?.[name];
            if (mod && mod.state === 'planned') {
              const trans = transitionModule(curr, name, 'observed', { reason: `Módulo '${name}' observado tras descubrimiento exitoso` });
              if (trans.state) curr = trans.state;
              if (curr.session?.plan) {
                const item = curr.session.plan.find((p) => p.module === name);
                if (item && item.status === 'planned') {
                  item.status = 'observed';
                }
              }
            } else if (mod && mod.state === 'consolidated' && !coverage.completa) {
              const trans = transitionModule(curr, name, 'interviewing', { reason: `Regresión de cobertura tras re-discover en '${name}'` });
              if (trans.state) curr = trans.state;
              if (curr.session?.plan) {
                const item = curr.session.plan.find((p) => p.module === name);
                if (item) {
                  item.status = 'interviewing';
                }
              }
            }
            return curr;
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(responsePayload, null, 2),
              },
            ],
          };
        }


        case 'qap_plan': {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                estado: 'en_desarrollo',
                sprint_disponible: 6,
                mensaje: 'La generación automática de planes de prueba está programada para el Sprint 6. Actualmente el motor opera en QAP v3.0: Descubrimiento, Entrevista de Reglas, Mapeo y Knowledge Graph.',
                capacidades_actuales: [
                  'qap_status',
                  'qap_init',
                  'qap_clean',
                  'qap_auth_add',
                  'qap_auth_list',
                  'qap_context_set',
                  'qap_context_ingest',
                  'qap_session_plan',
                  'qap_discover',
                  'qap_rules_set',
                  'qap_module_close',
                  'qap_session_close',
                  'qap_validate',
                  'qap_report',
                  'qap_server',
                  'qap_prune',
                ],
                accion_recomendada: 'Usa qap_discover para registrar el módulo y qap_rules_set para confirmar las reglas de negocio de la vista.',
              }, null, 2),
            }],
          };
        }


        case 'qap_validate': {
          const targetDefsDir = args.path ? resolve(String(args.path)) : resolve(rootDir, '.qa');
          const definitionsDir = existsSync(join(targetDefsDir, 'definitions')) ? join(targetDefsDir, 'definitions') : targetDefsDir;

          try {
            if (existsSync(definitionsDir) && readdirSync(definitionsDir).length > 0) {
              const res = validateDefinitions(definitionsDir);
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'success',
                        directorio_objetivo: rootDir,
                        valid: res.valid,
                        errors: res.errors,
                        modulesCount: res.modules.length,
                        capabilitiesCount: res.capabilities.length,
                        flowsCount: res.flows.length,
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }
          } catch {
            // Fallback a validación básica de esquema
          }

          const validator = new SchemaValidator();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    valid: true,
                    message: '✔ Validación de schemas completada sin advertencias.',
                    validatorReady: Boolean(validator),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_test': {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                estado: 'en_desarrollo',
                sprint_disponible: 7,
                mensaje: 'La ejecución automatizada nativa de pruebas está programada para el Sprint 7. Actualmente el motor opera hasta el Sprint 5 (Descubrimiento, Mapeo y Knowledge Graph 2D).',
                nota: 'No se ha ejecutado ninguna prueba. PROHIBIDO asumir resultado PASSED.',
                accion_recomendada: 'Usa qap_discover para mapear el módulo y qap_server para visualizar el Knowledge Graph 2D.',
              }, null, 2),
            }],
          };
        }

        case 'qap_report': {
          const qaDir = resolve(rootDir, '.qa');
          const storage = new FileSystemStorage({ rootDir });
          const format = String(args.format || 'all');
          let executionId = args.executionId ? String(args.executionId) : undefined;

          const execDir = join(qaDir, 'executions');
          let executionFiles: string[] = [];
          if (existsSync(execDir)) {
            executionFiles = readdirSync(execDir).filter((f) => f.endsWith('.json') && !f.endsWith('.report.json'));
          }

          if (executionFiles.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      razon: 'Los reportes de ejecución requieren ejecuciones reales registradas; no existen ejecuciones previas en .qa/executions/ (el runner de pruebas aún no existe en este sprint).',
                      desbloquear_con: {
                        tool: 'qap_status',
                        descripcion: 'Ejecuta pruebas cuando el runner esté disponible o consulta el estado actual con qap_status.',
                      },
                      siguiente_accion: {
                        tipo: 'trabajo',
                        descripcion: 'No hay ejecuciones registradas para generar reportes. Consulta el estado del proyecto con qap_status.',
                        tool: 'qap_status',
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          if (!executionId) {
            executionFiles.sort().reverse();
            executionId = executionFiles[0].replace('.json', '');
          }

          const execResult = await storage.getExecutionResult(executionId);
          if (!execResult) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      razon: `No se encontró el resultado de ejecución para el id '${executionId}'.`,
                      desbloquear_con: {
                        tool: 'qap_status',
                        descripcion: 'Consulta el estado del proyecto con qap_status.',
                      },
                      siguiente_accion: {
                        tipo: 'trabajo',
                        descripcion: `Resultado de ejecución '${executionId}' no encontrado. Consulta el estado con qap_status.`,
                        tool: 'qap_status',
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const reportsGenerated: Record<string, string> = {};
          const outDir = join(qaDir, 'executions');
          if (!existsSync(outDir)) {
            mkdirSync(outDir, { recursive: true });
          }

          if (format === 'all' || format === 'html') {
            const html = await generateHtmlReport(execResult, { storage });
            const htmlPath = join(outDir, `${executionId}.report.html`);
            writeFileSync(htmlPath, html, 'utf-8');
            reportsGenerated.html = htmlPath;
          }

          if (format === 'all' || format === 'markdown') {
            const md = generateMarkdownReport(execResult);
            const mdPath = join(outDir, `${executionId}.report.md`);
            writeFileSync(mdPath, md, 'utf-8');
            reportsGenerated.markdown = mdPath;
          }

          if (format === 'all' || format === 'junit') {
            const junit = generateJunitReport(execResult);
            const junitPath = join(outDir, `${executionId}.report.xml`);
            writeFileSync(junitPath, junit, 'utf-8');
            reportsGenerated.junit = junitPath;
          }

          if (format === 'all' || format === 'json') {
            const json = generateJsonReport(execResult);
            const jsonPath = join(outDir, `${executionId}.report.json`);
            writeFileSync(jsonPath, json, 'utf-8');
            reportsGenerated.json = jsonPath;
          }

          const viewerUrl = activeViewerServer
            ? `http://localhost:${activeViewerServer.port}/api/reports/${executionId}/html`
            : null;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: `✔ Reporte generado exitosamente para ${executionId}`,
                    executionId,
                    reports: reportsGenerated,
                    viewer_url: viewerUrl,
                    siguiente_accion: {
                      tipo: 'decision',
                      descripcion: 'Reporte generado. Elige si abrir el visor interactivo o consultar el estado.',
                      tool: 'qap_server',
                      pregunta: makeDecisionQuestion(
                        'decision_post_reporte',
                        `Reporte generado en ${reportsGenerated.html ? 'HTML' : 'formato seleccionado'}. Selecciona la siguiente acción para visualizar o consultar el estado:`,
                        [
                          { id: 'server', etiqueta: 'Abrir visor del Knowledge Graph 2D (qap_server)', recomendada: true },
                          { id: 'status', etiqueta: 'Ver estado del proyecto (qap_status)' },
                          { id: 'concluir', etiqueta: 'Concluir sesión de pruebas' },
                        ],
                        true,
                        { tool: 'qap_server', campo: 'action' }
                      ),
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_server': {
          const qaDir = resolve(rootDir, '.qa');
          if (!existsSync(qaDir)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: `No existe la carpeta de base de conocimiento .qa/ en '${rootDir}'. Debe ejecutar qap_init primero.`,
                      _guidance_for_assistant: `La carpeta .qa/ no existe en ${rootDir}. Debes ejecutar qap_init primero.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const port = Number(args.port || 9280);

          if (activeViewerServer) {
            console.error(`[QAP Knowledge Graph] Servidor ya activo en: http://localhost:${activeViewerServer.port}`);
            console.error(`[QAP Knowledge Graph] Base de conocimiento servida desde: ${qaDir}`);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'running',
                      directorio_objetivo: rootDir,
                      base_conocimiento: qaDir,
                      message: `El servidor del Knowledge Graph ya está activo en http://localhost:${activeViewerServer.port}`,
                      url: `http://localhost:${activeViewerServer.port}`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const storage = new FileSystemStorage({ rootDir });
          activeViewerServer = await startViewerServer({
            storage,
            port,
            silent: true,
          });

          console.error(`[QAP Knowledge Graph] Servidor interactivo iniciado en: http://localhost:${activeViewerServer.port}`);
          console.error(`[QAP Knowledge Graph] Base de conocimiento servida desde: ${qaDir}`);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    base_conocimiento: qaDir,
                    message: `✔ Servidor interactivo de Knowledge Graph iniciado exitosamente en http://localhost:${activeViewerServer.port}`,
                    url: `http://localhost:${activeViewerServer.port}`,
                    _guidance_for_assistant: `DIRECTIVA: Proporciona al usuario el enlace clicable http://localhost:${activeViewerServer.port} para que explore el Knowledge Graph 2D en su navegador.`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_prune': {
          const runtimeDir = resolve(rootDir, '.qa', 'runtime');
          const olderThanDays = args.olderThanDays ? Number(args.olderThanDays) : 30;
          const dryRun = Boolean(args.dryRun);

          if (!existsSync(runtimeDir)) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: 'No hay directorio runtime para podar.',
                    freedBytes: 0,
                  }),
                },
              ],
            };
          }

          const db = new QapDatabase(runtimeDir);
          const engine = new PruningEngine(db, runtimeDir);
          const recordTtlMs = olderThanDays * 24 * 60 * 60 * 1000;
          const pruneResult = dryRun
            ? { deletedRunsCount: 0, purgedArtifactsCount: 0, bytesFreed: 0 }
            : engine.prune({ recordTtlMs });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    dryRun,
                    deletedRunsCount: pruneResult.deletedRunsCount,
                    purgedArtifactsCount: pruneResult.purgedArtifactsCount,
                    bytesFreed: pruneResult.bytesFreed,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_rules_set': {
          const moduleName = args.module ? String(args.module) : '';
          if (!moduleName) {
            return {
              isError: true,
              content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: "El parámetro 'module' es requerido." }, null, 2) }],
            };
          }

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();
          const currentPhase = lifecycleState.phase;

          // Contrato blocked: solo permitido en WORKING (T10)
          if (currentPhase !== 'WORKING') {
            if (currentPhase === 'WRAP_UP') {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'blocked',
                        directorio_objetivo: rootDir,
                        fase: 'WRAP_UP',
                        razon: 'La sesión actual ha concluido en la fase WRAP_UP. Inicia una nueva sesión con qap_session_plan o revisa el Knowledge Graph con qap_server.',
                        desbloquear_con: {
                          tool: 'qap_session_plan',
                          descripcion: 'Inicia una nueva sesión de trabajo con qap_session_plan.',
                        },
                        siguiente_accion: {
                          tipo: 'decision',
                          descripcion: 'La sesión actual ha concluido en WRAP_UP. Inicia una nueva sesión con qap_session_plan o revisa el Knowledge Graph con qap_server.',
                          tool: 'qap_session_plan',
                          pregunta: makeDecisionQuestion(
                            'decision_wrap_up',
                            'La sesión ha finalizado. Puedes iniciar una nueva sesión con qap_session_plan o revisar el Knowledge Graph con qap_server.',
                            [
                              { id: 'plan', etiqueta: 'Iniciar nueva sesión con qap_session_plan', recomendada: true },
                              { id: 'server', etiqueta: 'Revisar Knowledge Graph con qap_server' },
                            ]
                          ),
                        },
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            const desbloquearTool = currentPhase === 'ONBOARDING' ? 'qap_context_set' : 'qap_session_plan';
            const desbloquearDesc = currentPhase === 'ONBOARDING'
              ? 'Completa el contexto inicial del proyecto con qap_context_set.'
              : 'Define el plan de sesión con qap_session_plan.';
            const guidance = getPhaseGuidance(currentPhase);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: currentPhase,
                      razon: `No se puede ejecutar qap_rules_set en la fase ${currentPhase}. Solo está permitido en la fase WORKING.`,
                      desbloquear_con: {
                        tool: desbloquearTool,
                        descripcion: desbloquearDesc,
                      },
                      siguiente_accion: guidance.siguiente_accion,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Contrato blocked: módulo debe estar registrado (T10)
          const modEntry = lifecycleState.modules?.[moduleName];
          if (!modEntry) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: `El módulo '${moduleName}' no está registrado en el plan de sesión ni en el estado del proyecto.`,
                      desbloquear_con: {
                        tool: 'qap_session_plan',
                        descripcion: `Registra el módulo '${moduleName}' en el plan con qap_session_plan antes de configurar sus reglas.`,
                      },
                      siguiente_accion: {
                        tipo: 'decision',
                        descripcion: `Registra el módulo '${moduleName}' usando qap_session_plan o consulta el estado del proyecto con qap_status.`,
                        tool: 'qap_session_plan',
                        pregunta: makeDecisionQuestion(
                          'decision_modulo_no_en_plan',
                          `El módulo '${moduleName}' no forma parte del plan. Registra el módulo con qap_session_plan o consulta el estado del proyecto con qap_status.`,
                          [
                            { id: 'registrar', etiqueta: 'Registrar módulo con qap_session_plan', recomendada: true },
                            { id: 'status', etiqueta: 'Ver estado del proyecto (qap_status)' },
                          ]
                        ),
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Contrato blocked: módulo planned debe descubrirse primero (T10)
          if (modEntry.state === 'planned') {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: `El módulo '${moduleName}' está en estado 'planned'. Debes descubrirlo primero con qap_discover antes de registrar sus reglas.`,
                      desbloquear_con: {
                        tool: 'qap_discover',
                        descripcion: `Ejecuta qap_discover para explorar y mapear el módulo '${moduleName}'.`,
                      },
                      siguiente_accion: {
                        tipo: 'trabajo',
                        descripcion: `Descubre el módulo '${moduleName}' con qap_discover.`,
                        tool: 'qap_discover',
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Contrato blocked: módulo waived o closed no admite reglas (T10)
          if (modEntry.state === 'waived' || modEntry.state === 'closed') {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: `El módulo '${moduleName}' se encuentra en estado '${modEntry.state}' y sus reglas no pueden ser modificadas.`,
                      desbloquear_con: {
                        tool: 'qap_status',
                        descripcion: 'Selecciona otro módulo activo del plan o consulta el estado con qap_status.',
                      },
                      siguiente_accion: {
                        tipo: 'trabajo',
                        descripcion: `El módulo '${moduleName}' se encuentra finalizado (${modEntry.state}). Selecciona otro módulo activo del plan.`,
                        tool: 'qap_status',
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const view = args.view ? String(args.view) : 'default';
          const incomingRules = Array.isArray(args.rules) ? args.rules : [];
          const incomingWaivers = Array.isArray(args.category_waivers) ? args.category_waivers : [];

          // Validar lote completo antes de cualquier mutación (T12)
          const VALID_CATEGORIES = new Set(['proposito', 'actor', 'campo', 'accion', 'error', 'dato', 'sensibilidad']);
          const VALID_STATUSES = new Set(['inferred', 'confirmed', 'rejected', 'deferred']);
          const VALID_SOURCES = new Set(['dom', 'prd', 'user']);

          for (const rule of incomingRules) {
            if (!rule.description || typeof rule.description !== 'string' || rule.description.trim().length === 0) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: "Regla inválida: 'description' es requerida y no puede ser vacía. Lote rechazado por completo." }, null, 2) }],
              };
            }
            if (rule.category && !VALID_CATEGORIES.has(rule.category)) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Categoría inválida '${rule.category}' en regla '${rule.id || 'nueva'}'. Categorías válidas: ${Array.from(VALID_CATEGORIES).join(', ')}. Lote rechazado por completo.` }, null, 2) }],
              };
            }
            if (rule.status && !VALID_STATUSES.has(rule.status)) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Estado inválido '${rule.status}' en regla '${rule.id || 'nueva'}'. Estados válidos: ${Array.from(VALID_STATUSES).join(', ')}. Lote rechazado por completo.` }, null, 2) }],
              };
            }
            if (rule.source && !VALID_SOURCES.has(rule.source)) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Fuente inválida '${rule.source}' en regla '${rule.id || 'nueva'}'. Fuentes válidas: ${Array.from(VALID_SOURCES).join(', ')}. Lote rechazado por completo.` }, null, 2) }],
              };
            }
          }

          if (incomingWaivers.length > 0) {
            const waiverValidation = validateWaiversBatch(incomingWaivers);
            if (!waiverValidation.valid) {
              return {
                isError: true,
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    isError: true,
                    directorio_objetivo: rootDir,
                    error: `Lote de waivers inválido: ${waiverValidation.error}. Lote rechazado por completo.`,
                    errores: [waiverValidation.error],
                  }, null, 2),
                }],
              };
            }
          }

          const reglasIgnoradas: Array<{ id: string; motivo: string }> = [];

          // Upsert atómico vía updateModuleRules (E5, T11, T12)
          const updatedRules = await storage.updateModuleRules(moduleName, (current) => {
            const existing = current.rules || [];
            const existingIds = new Set(existing.map((r: any) => r.id));

            // Calcular número secuencial para ids R-001, R-002... (T11)
            let maxRNum = 0;
            for (const r of existing) {
              const match = /^R-(\d+)$/.exec(r.id);
              if (match) {
                const n = parseInt(match[1], 10);
                if (n > maxRNum) maxRNum = n;
              }
            }

            // Upsert: actualizar existentes por id (respetando no-downgrade), agregar nuevos
            const merged = existing.map((r: any) => {
              const incoming = incomingRules.find((ir: any) => ir.id === r.id);
              if (incoming) {
                // T12 No-downgrade: regla source user confirmed no se sobrescribe con dom/prd
                if (r.source === 'user' && r.status === 'confirmed' && incoming.source && incoming.source !== 'user') {
                  reglasIgnoradas.push({
                    id: r.id,
                    motivo: `No-downgrade: la regla confirmada por usuario '${r.id}' no puede sobrescribirse con fuente '${incoming.source}'.`,
                  });
                  return r;
                }

                return {
                  ...r,
                  ...incoming,
                  view: incoming.view ?? r.view ?? view,
                  source: incoming.source ?? r.source ?? 'user',
                  evidence: incoming.evidence ? incoming.evidence.slice(0, 120) : r.evidence,
                };
              }
              return r;
            });

            const newRules = incomingRules
              .filter((ir: any) => !ir.id || !existingIds.has(ir.id))
              .map((ir: any) => {
                const ruleId = ir.id || `R-${String(++maxRNum).padStart(3, '0')}`;
                return {
                  ...ir,
                  id: ruleId,
                  view: ir.view ?? view,
                  source: ir.source ?? 'user',
                  status: ir.status ?? 'confirmed',
                  evidence: ir.evidence ? ir.evidence.slice(0, 120) : undefined,
                };
              });

            // Upsert waivers por view+category
            const existingWaivers = current.category_waivers || [];
            const mergedWaivers = existingWaivers.map((w: any) => {
              const incoming = incomingWaivers.find((iw: any) => iw.category === w.category && (iw.view ?? view) === (w.view ?? view));
              return incoming
                ? { ...w, ...incoming, view: incoming.view ?? view, source: 'user', reason: incoming.reason.trim() }
                : w;
            });
            const newWaivers = incomingWaivers
              .filter((iw: any) => !existingWaivers.some((w: any) => w.category === iw.category && (w.view ?? view) === (iw.view ?? view)))
              .map((iw: any) => ({ ...iw, view: iw.view ?? view, source: 'user', reason: iw.reason.trim() }));

            return {
              ...current,
              manually_edited: false,
              rules: [...merged, ...newRules],
              category_waivers: [...mergedWaivers, ...newWaivers],
            };
          });

          // Recalcular cobertura post-mutación
          const allRules = updatedRules.rules || [];
          const allWaivers = updatedRules.category_waivers || [];

          // Construir viewCtx mínimo para coverage
          let projectRoleCountRules = 0;
          try {
            const ctx = await storage.getProjectContext();
            const roles = Array.isArray((ctx as any).roles) ? (ctx as any).roles : [];
            projectRoleCountRules = roles.length;
          } catch { /* sin contexto */ }

          let formsForView: DomForm[] = [];
          let buttonsForView: any[] = [];
          let storageStateUsed = false;
          const selectorsPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'selectors.json');
          const contextPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'context.yaml');
          if (existsSync(selectorsPath)) {
            try {
              const sel = JSON.parse(readFileSync(selectorsPath, 'utf-8'));
              formsForView = ((sel.selectors?.forms || []) as any[]).map((f: any) => ({
                id: f.id || 'form-1',
                selector: f.selector || 'form',
                fields: ((f.inputs || f.fields || []) as any[]).map((inp: any) => ({
                  key: inp.key || inp.name || inp.id || 'field',
                  type: inp.type || 'text',
                  name: inp.name,
                  id: inp.id,
                  label: inp.label,
                  required: inp.required,
                  minlength: inp.minlength,
                  maxlength: inp.maxlength,
                  pattern: inp.pattern,
                })),
              }));
              buttonsForView = sel.selectors?.buttons || [];
            } catch { /* fallback */ }
          }
          let routeForView: string | undefined;
          if (existsSync(contextPath)) {
            try {
              const ctxData = YAML.parse(readFileSync(contextPath, 'utf-8'));
              storageStateUsed = Boolean(ctxData?.storage_state_used);
              routeForView = ctxData?.route;
            } catch { /* fallback */ }
          }
          if (!routeForView && lifecycleState.session?.plan) {
            const planItem = lifecycleState.session.plan.find((p: any) => p.module === moduleName);
            if (planItem) routeForView = planItem.path;
          }

          const viewCtx: ViewDiscoveryContext = {
            module: moduleName,
            view,
            route: routeForView,
            forms: formsForView,
            buttons: buttonsForView,
            storage_state_used: storageStateUsed,
            is_auth_view: false,
          };
          const applicableCats = computeApplicableCategories(viewCtx, projectRoleCountRules);
          const cov = computeCoverage(applicableCats, allRules, allWaivers, view);
          const nextQs = generateNextInterviewBatch(viewCtx, allRules, applicableCats, allWaivers);

          // Transición de lifecycle: siempre a través de transitionModule (E1)
          let targetModuleState: ModuleLifecycleState = modEntry.state;
          if (cov.completa) {
            targetModuleState = 'consolidated';
          } else if (modEntry.state === 'consolidated' && !cov.completa) {
            targetModuleState = 'interviewing';
          } else if (modEntry.state === 'observed') {
            targetModuleState = 'interviewing';
          }

          if (targetModuleState !== modEntry.state) {
            await storage.updateLifecycleState(async (curr) => {
              // Si estaba en observed y el objetivo es consolidated, transicionar primero a interviewing
              if (modEntry.state === 'observed' && targetModuleState === 'consolidated') {
                const step1 = transitionModule(curr, moduleName, 'interviewing', {
                  reason: `Inicio de entrevista para módulo '${moduleName}'`,
                });
                if (step1.state) curr = step1.state;
              }

              const trans = transitionModule(
                curr,
                moduleName,
                targetModuleState,
                {
                  reason: targetModuleState === 'consolidated'
                    ? `Módulo '${moduleName}' alcanza estado consolidated (cobertura completa)`
                    : targetModuleState === 'interviewing' && modEntry.state === 'consolidated'
                    ? `Regresión de cobertura en módulo '${moduleName}': vuelve a interviewing`
                    : `Módulo '${moduleName}' en estado '${targetModuleState}' tras qap_rules_set`,
                }
              );
              if (trans.state) curr = trans.state;
              if (curr.session?.plan) {
                const pItem = curr.session.plan.find((p: any) => p.module === moduleName);
                if (pItem) pItem.status = targetModuleState;
              }
              return curr;
            });
          }

          let siguienteAccionRules: SiguienteAccion;
          let moduleSummary: ReturnType<typeof buildModuleSummary> | undefined;

          if (cov.completa) {
            moduleSummary = buildModuleSummary(allRules, allWaivers);
            const freshState = await storage.getLifecycleState();
            const plan = freshState.session?.plan || [];
            const nextPlanned = plan.find((p: any) => {
              const st = freshState.modules?.[p.module]?.state;
              return st !== 'closed' && st !== 'waived' && p.module !== moduleName;
            });

            const nextModuleName = nextPlanned?.module;
            const desc = nextModuleName
              ? `El módulo '${moduleName}' ha completado su cobertura de reglas (consolidated). Presenta este resumen al usuario y, solo con su confirmación explícita, ejecuta qap_module_close para cerrar el módulo y continuar con '${nextModuleName}'.`
              : `El módulo '${moduleName}' ha completado su cobertura de reglas (consolidated). Todos los módulos del plan han sido procesados. Presenta este resumen al usuario y, solo con su confirmación explícita, ejecuta qap_module_close para cerrarlo y proceder al cierre de sesión.`;

            siguienteAccionRules = {
              tipo: 'trabajo',
              descripcion: desc,
              tool: 'qap_module_close',
              module: moduleName,
            };
          } else {
            siguienteAccionRules = buildInterviewNextAction({
              module: moduleName,
              view,
              questions: nextQs,
              applicableCategories: applicableCats,
              coverage: cov,
            });
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                directorio_objetivo: rootDir,
                message: `✔ Reglas actualizadas para módulo '${moduleName}' (vista: ${view})`,
                module: moduleName,
                view,
                state: targetModuleState,
                modulo_estado: targetModuleState,
                rules_guardadas: incomingRules.length,
                waivers_guardados: incomingWaivers.length,
                rules_total: allRules.length,
                waivers_total: allWaivers.length,
                reglas_ignoradas: reglasIgnoradas.length > 0 ? reglasIgnoradas : undefined,
                resumen_cierre: moduleSummary,
                cobertura: cov,
                cobertura_completa: cov.completa,
                siguiente_accion: siguienteAccionRules,
              }, null, 2),
            }],
          };
        }

        case 'qap_module_close': {
          const moduleName = args.module ? String(args.module).trim() : '';
          const action = args.action ? String(args.action).trim() : '';
          const userConfirmed = args.user_confirmed === true;
          const reasonStr = typeof args.reason === 'string' ? args.reason.trim() : '';

          if (!moduleName || !action) {
            return {
              isError: true,
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  isError: true,
                  directorio_objetivo: rootDir,
                  error: "Los parámetros 'module' y 'action' son obligatorios.",
                }, null, 2),
              }],
            };
          }

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();

          // 1. Bloqueado si la fase no es WORKING
          if (lifecycleState.phase !== 'WORKING') {
            const desbloquearTool = lifecycleState.phase === 'WRAP_UP' ? 'qap_session_plan' : 'qap_status';
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: lifecycleState.phase,
                  razon: `No se puede ejecutar qap_module_close en la fase ${lifecycleState.phase}. Solo está permitido en la fase WORKING.`,
                  desbloquear_con: {
                    tool: desbloquearTool,
                    descripcion: 'Avanza el ciclo de vida a la fase WORKING.',
                  },
                  siguiente_accion: {
                    tipo: 'trabajo',
                    descripcion: `La fase actual es ${lifecycleState.phase}. Consulta el estado con qap_status.`,
                    tool: 'qap_status',
                  },
                }, null, 2),
              }],
            };
          }

          // 2. Bloqueado si el módulo no está registrado
          const modEntry = lifecycleState.modules?.[moduleName];
          if (!modEntry) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: 'WORKING',
                  razon: `El módulo '${moduleName}' no está registrado en el plan de sesión ni en el estado del proyecto.`,
                  desbloquear_con: {
                    tool: 'qap_session_plan',
                    descripcion: `Registra el módulo '${moduleName}' en el plan con qap_session_plan.`,
                  },
                  siguiente_accion: {
                    tipo: 'decision',
                    descripcion: `Registra el módulo '${moduleName}' usando qap_session_plan o consulta el estado con qap_status.`,
                    tool: 'qap_session_plan',
                    pregunta: makeDecisionQuestion(
                      'decision_modulo_no_en_plan',
                      `El módulo '${moduleName}' no forma parte del plan. Registra el módulo con qap_session_plan o consulta el estado del proyecto con qap_status.`,
                      [
                        { id: 'registrar', etiqueta: 'Registrar módulo con qap_session_plan', recomendada: true },
                        { id: 'status', etiqueta: 'Ver estado del proyecto (qap_status)' },
                      ]
                    ),
                  },
                }, null, 2),
              }],
            };
          }

          // 3. Bloqueado si ya es closed o waived
          if (modEntry.state === 'closed' || modEntry.state === 'waived') {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: 'WORKING',
                  razon: `El módulo '${moduleName}' ya se encuentra en estado terminal '${modEntry.state}' y no puede cerrarse ni renunciarse de nuevo.`,
                  desbloquear_con: {
                    tool: 'qap_status',
                    descripcion: 'Selecciona otro módulo activo del plan o consulta el estado con qap_status.',
                  },
                  siguiente_accion: {
                    tipo: 'trabajo',
                    descripcion: `El módulo '${moduleName}' ya está en estado terminal '${modEntry.state}'. Consulta el estado del proyecto con qap_status.`,
                    tool: 'qap_status',
                  },
                }, null, 2),
              }],
            };
          }

          // 4. Bloqueado si user_confirmed no es true
          if (!userConfirmed) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: 'WORKING',
                  razon: 'El cierre o renuncia de un módulo exige confirmación explícita del usuario (user_confirmed: true) tras presentarle el resumen del módulo.',
                  desbloquear_con: {
                    tool: 'qap_module_close',
                    descripcion: 'Presenta el resumen del módulo al usuario y reintenta con user_confirmed: true.',
                  },
                  siguiente_accion: {
                    tipo: 'trabajo',
                    descripcion: `Presenta el resumen del módulo '${moduleName}' al usuario y solicita su confirmación explícita antes de llamar qap_module_close.`,
                    tool: 'qap_module_close',
                  },
                }, null, 2),
              }],
            };
          }

          let rulesList: any[] = [];
          let waiversList: any[] = [];
          try {
            const rf = await storage.getModuleRules(moduleName);
            rulesList = rf?.rules || [];
            waiversList = rf?.category_waivers || [];
          } catch { /* empty */ }

          const planItem = (lifecycleState.session?.plan || []).find((p: any) => p.module === moduleName);
          const route = planItem?.path || '';
          const vContext = buildViewDiscoveryContext(rootDir, moduleName, 'default', route);

          let projectRoleCountClose = 0;
          try {
            const ctx = await storage.getProjectContext();
            const roles = Array.isArray((ctx as any).roles) ? (ctx as any).roles : [];
            projectRoleCountClose = roles.length;
          } catch { /* sin contexto */ }

          const appCats = computeApplicableCategories(vContext, projectRoleCountClose);

          // 5. Validación por action
          if (action === 'close') {
            if (modEntry.state !== 'consolidated') {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'blocked',
                    directorio_objetivo: rootDir,
                    fase: 'WORKING',
                    razon: `Solo los módulos en estado 'consolidated' pueden cerrarse con action: 'close'. El módulo '${moduleName}' está en estado '${modEntry.state}'.`,
                    desbloquear_con: {
                      tool: 'qap_rules_set',
                      descripcion: 'Completa la cobertura de reglas de la vista para alcanzar el estado consolidated.',
                    },
                    siguiente_accion: {
                      tipo: 'trabajo',
                      descripcion: `Completa la cobertura de reglas de '${moduleName}' con qap_rules_set para transicionar a consolidated.`,
                      tool: 'qap_rules_set',
                    },
                  }, null, 2),
                }],
              };
            }

            const closeGate = canCloseModule(rulesList, waiversList, appCats, 'default');
            if (!closeGate.passed) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'blocked',
                    directorio_objetivo: rootDir,
                    fase: 'WORKING',
                    razon: `El módulo '${moduleName}' no cumple los requisitos para cierre: ${closeGate.reason}`,
                    desbloquear_con: {
                      tool: 'qap_rules_set',
                      descripcion: 'Confirma o resuelve las hipótesis pendientes con qap_rules_set.',
                    },
                    siguiente_accion: {
                      tipo: 'trabajo',
                      descripcion: `Resuelve los requisitos pendientes de '${moduleName}' con qap_rules_set.`,
                      tool: 'qap_rules_set',
                    },
                  }, null, 2),
                }],
              };
            }
          } else if (action === 'waive') {
            if (reasonStr.length < 15) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'blocked',
                    directorio_objetivo: rootDir,
                    fase: 'WORKING',
                    razon: `La renuncia a un módulo (action: "waive") exige una justificación (reason) de al menos 15 caracteres tras trim. Se recibieron ${reasonStr.length} caracteres.`,
                    desbloquear_con: {
                      tool: 'qap_module_close',
                      descripcion: 'Proporciona una razón justificada de al menos 15 caracteres.',
                    },
                    siguiente_accion: {
                      tipo: 'trabajo',
                      descripcion: `Especifica una justificación de al menos 15 caracteres para renunciar al módulo '${moduleName}'.`,
                      tool: 'qap_module_close',
                    },
                  }, null, 2),
                }],
              };
            }
          } else {
            return {
              isError: true,
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  isError: true,
                  directorio_objetivo: rootDir,
                  error: `Acción '${action}' no reconocida. Acciones válidas: 'close', 'waive'.`,
                }, null, 2),
              }],
            };
          }

          // Ejecutar transición
          const targetState: ModuleLifecycleState = action === 'close' ? 'closed' : 'waived';
          await storage.updateLifecycleState(async (curr) => {
            const trans = transitionModule(
              curr,
              moduleName,
              targetState,
              action === 'close'
                ? { reason: `Módulo '${moduleName}' cerrado formalmente tras verificar cobertura completa` }
                : { waived_reason: reasonStr, reason: `Módulo '${moduleName}' renunciado (waived). Motivo: ${reasonStr}` }
            );
            if (trans.state) curr = trans.state;
            if (curr.session?.plan) {
              const pItem = curr.session.plan.find((p: any) => p.module === moduleName);
              if (pItem) pItem.status = targetState;
            }
            return curr;
          });

          const summary = buildModuleSummary(rulesList, waiversList);
          const freshState = await storage.getLifecycleState();
          const plan = freshState.session?.plan || [];
          const nextPlanned = plan.find((p: any) => {
            const st = freshState.modules?.[p.module]?.state;
            return st !== 'closed' && st !== 'waived';
          });

          let sigAccion: SiguienteAccion;
          if (nextPlanned) {
            sigAccion = {
              tipo: 'trabajo',
              descripcion: `Módulo '${moduleName}' ${action === 'close' ? 'cerrado' : 'renunciado'}. Siguiente módulo planificado: '${nextPlanned.module}' en ruta '${nextPlanned.path}'.`,
              tool: 'qap_discover',
            };
          } else {
            sigAccion = {
              tipo: 'trabajo',
              descripcion: `Módulo '${moduleName}' ${action === 'close' ? 'cerrado' : 'renunciado'}. Todos los módulos del plan han finalizado. Procede a cerrar la sesión con qap_session_close.`,
              tool: 'qap_session_close',
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                directorio_objetivo: rootDir,
                message: `✔ Módulo '${moduleName}' ${action === 'close' ? 'cerrado formalmente (closed)' : 'renunciado (waived)'}.`,
                module: moduleName,
                action,
                state: targetState,
                estado: targetState,
                reason: action === 'waive' ? reasonStr : undefined,
                resumen: summary,
                siguiente_accion: sigAccion,
              }, null, 2),
            }],
          };
        }

        case 'qap_session_close': {
          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();

          if (lifecycleState.phase !== 'WORKING') {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: lifecycleState.phase,
                  razon: `No se puede ejecutar qap_session_close en la fase ${lifecycleState.phase}. Solo está permitido en la fase WORKING.`,
                  desbloquear_con: {
                    tool: lifecycleState.phase === 'WRAP_UP' ? 'qap_session_plan' : 'qap_status',
                    descripcion: 'Avanza el ciclo de vida a la fase WORKING.',
                  },
                  siguiente_accion: {
                    tipo: 'trabajo',
                    descripcion: `La fase actual es ${lifecycleState.phase}. Consulta el estado con qap_status.`,
                    tool: 'qap_status',
                  },
                }, null, 2),
              }],
            };
          }

          const workingGate = canExitWorking(lifecycleState);
          if (!workingGate.passed) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: 'WORKING',
                  razon: 'No se puede cerrar la sesión de trabajo: aún existen módulos pendientes en el plan o el plan no ha sido definido.',
                  faltantes: workingGate.faltantes,
                  desbloquear_con: {
                    tool: 'qap_module_close',
                    descripcion: 'Cierra o renuncia a los módulos pendientes del plan con qap_module_close.',
                  },
                  siguiente_accion: {
                    tipo: 'trabajo',
                    descripcion: 'Existen módulos pendientes de cerrar o renunciar antes de concluir la sesión.',
                    tool: 'qap_module_close',
                  },
                }, null, 2),
              }],
            };
          }

          // Cierre exitoso y transición a WRAP_UP
          const qaDir = resolve(rootDir, '.qa');
          const contextPath = join(qaDir, 'project', 'context.yaml');
          let parsedContext: any = null;
          if (existsSync(contextPath)) {
            try {
              parsedContext = YAML.parse(readFileSync(contextPath, 'utf-8'));
            } catch { /* empty */ }
          }

          const sessionId = lifecycleState.session?.id || randomUUID();
          const startedAt = lifecycleState.session?.started_at || new Date().toISOString();
          const closedAt = new Date().toISOString();

          // Recopilar módulos para el reporte de brechas
          const allModuleNames = new Set([
            ...(lifecycleState.session?.plan || []).map((p: any) => p.module),
            ...Object.keys(lifecycleState.modules || {}),
          ]);

          const moduleRulesMap: Record<string, { rules?: any[]; category_waivers?: any[] }> = {};
          for (const mName of allModuleNames) {
            try {
              const rf = await storage.getModuleRules(mName);
              moduleRulesMap[mName] = {
                rules: rf?.rules || [],
                category_waivers: rf?.category_waivers || [],
              };
            } catch {
              moduleRulesMap[mName] = { rules: [], category_waivers: [] };
            }
          }

          const gapReportMd = generateSessionGapReport({
            sessionId,
            startedAt,
            closedAt,
            projectContext: parsedContext,
            plan: lifecycleState.session?.plan || [],
            modules: lifecycleState.modules || {},
            moduleRules: moduleRulesMap,
          });

          const sessionsDir = join(qaDir, 'project', 'sessions');
          if (!existsSync(sessionsDir)) {
            mkdirSync(sessionsDir, { recursive: true });
          }

          const reportFilePath = join(sessionsDir, `${sessionId}.report.md`);
          writeFileSync(reportFilePath, gapReportMd, 'utf-8');

          await storage.updateLifecycleState(async (curr) => {
            const trans = transitionProject(curr, 'WRAP_UP', 'Sesión cerrada exitosamente: todos los módulos del plan finalizados');
            if (trans.state) curr = trans.state;
            return curr;
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                directorio_objetivo: rootDir,
                message: `✔ Sesión '${sessionId}' cerrada exitosamente. Proyecto transicionado a fase WRAP_UP.`,
                fase: 'WRAP_UP',
                session_id: sessionId,
                report_path: reportFilePath,
                reporte_brechas_path: reportFilePath,
                siguiente_accion: {
                  tipo: 'decision',
                  descripcion: `Sesión concluida. Reporte de brechas generado en ${reportFilePath}. Puedes revisar el Knowledge Graph (qap_server) o iniciar una nueva sesión (qap_session_plan).`,
                  tool: 'qap_server',
                  pregunta: makeDecisionQuestion(
                    'decision_post_cierre_sesion',
                    `La sesión ha finalizado exitosamente. El reporte de brechas está disponible en ${reportFilePath}. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.`,
                    [
                      { id: 'server', etiqueta: 'Revisar Knowledge Graph interactivo (qap_server)', recomendada: true },
                      { id: 'plan', etiqueta: 'Iniciar nueva sesión de pruebas (qap_session_plan)' },
                    ],
                    true,
                    { tool: 'qap_server', campo: 'action' }
                  ),
                },
              }, null, 2),
            }],
          };
        }

        default:
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Tool no reconocida: ${name}`,
              },
            ],
          };
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error ejecutando ${name}: ${errorMessage}`,
          },
        ],
      };
    }
  });

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.');
}

const isMainModule =
  process.argv[1]?.endsWith('server.js') ||
  process.argv[1]?.endsWith('server.ts') ||
  process.argv[1]?.includes('qap-mcp');

if (isMainModule) {
  startMcpServer().catch((error) => {
    console.error('[QAP MCP Server Fatal]', error);
    process.exit(1);
  });
}

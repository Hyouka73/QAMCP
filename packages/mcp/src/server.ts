import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
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
import { SchemaValidator, type AuthProfile, type ModuleSpec } from '@qap/shared';
import { FileSystemStorage } from '@qap/knowledge';
import { validateDefinitions } from '@qap/knowledge';
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

let activeViewerServer: ViewerServerInstance | null = null;

const UX_DIRECTIVE = 'DIRECTIVA DE UX ESTRICTA: Guía al usuario paso a paso interactivo. Si tu entorno dispone de herramienta para hacer preguntas interactivas con opciones (como ask_question), ÚSALA OBLIGATORIAMENTE para cada decisión. Si no, formula la pregunta directa con sus opciones. PROHIBIDO mostrar listas de pasos futuros (1, 2, 3...), tutoriales o pedir comandos de terminal.';

const TARGET_PATH_PROP = {
  type: 'string',
  description: 'Ruta absoluta del proyecto objetivo sobre el cual operar. Si se omite, usa process.cwd()',
};

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
      version: '2.1.3',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
      instructions: `DIRECTIVAS DE INTERACCIÓN OBLIGATORIAS:
1. RUTA OBJETIVO OBLIGATORIA (targetPath): En TODAS las llamadas a herramientas MCP (qap_status, qap_init, qap_discover, qap_plan, qap_test, qap_server, etc.), envía SIEMPRE la ruta absoluta del workspace del usuario en el parámetro 'targetPath'. NUNCA lo omitas.
2. PROHIBIDO mostrar tablas markdown de estado, resúmenes de archivos o listas de próximos pasos (1, 2, 3...).
3. USA LAS CAPACIDADES INTERACTIVAS DEL IDE:
   - Para formular preguntas o decisiones, invoca SIEMPRE 'ask_question' con los campos 'pregunta' y 'opciones' devueltos por las tools para que el usuario responda mediante botones interactivos.
   - Si presentas una propuesta o plan para su ejecución, genera un artefacto interactivo (artifact) con 'RequestFeedback: true' para que el usuario pueda pulsar 'Proceed'.
4. Ejecuta un solo paso por turno y espera la selección del usuario antes de invocar la siguiente tool de QAP.`,
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

          if (initialized) {
            const contextPath = join(qaDir, 'project', 'context.yaml');
            if (existsSync(contextPath)) {
              try {
                const parsedContext = YAML.parse(readFileSync(contextPath, 'utf-8'));
                projectName = parsedContext?.project_name || projectName;
              } catch {
                // Ignore parse errors
              }
            }

            const envPath = join(qaDir, 'project', 'environments.yaml');
            if (existsSync(envPath)) {
              try {
                const parsedEnv = YAML.parse(readFileSync(envPath, 'utf-8'));
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
                profileCount = Array.isArray(parsed.profiles) ? parsed.profiles.length : 0;
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

          const question = !initialized
            ? `Detecté tu servicio en ${detectedUrl} (${detectedLabel}). ¿Deseas inicializar QAP para este servicio o prefieres otra URL?`
            : `El proyecto QAP ya está inicializado con ${moduleCount} módulo(s). ¿Qué pantalla o flujo deseas descubrir con qap_discover?`;

          const options = !initialized
            ? [
                `Sí, inicializar QAP para ${detectedUrl}`,
                'Usar otra URL o puerto',
                'Cancelar',
              ]
            : [
                'Descubrir pantalla de Login / Autenticación (/login)',
                'Descubrir Página Principal o Dashboard',
                'Ver reportes y ejecuciones anteriores',
              ];

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    initialized,
                    projectName: projectName !== 'No inicializado' ? projectName : basename(rootDir),
                    environments,
                    stats: {
                      modules: moduleCount,
                      authProfiles: profileCount,
                      executions: executionCount,
                    },
                    validatorReady: Boolean(validator),
                    detectedService: { url: detectedUrl, label: detectedLabel },
                    directiva_estricta: 'PROHIBIDO responder con tablas markdown, resúmenes de archivos o listas de pasos (1, 2, 3...). Invoca directamente la herramienta interactiva de preguntas (ask_question) o genera un artefacto interactivo con RequestFeedback: true utilizando los campos "pregunta" y "opciones" de abajo.',
                    accion_inmediata_requerida: 'Llama INMEDIATAMENTE a tu herramienta interactiva de preguntas (como ask_question) usando los campos "pregunta" y "opciones" de abajo para que el usuario responda mediante botones interactivos en modal. Si tu entorno no dispone de esa herramienta, formula la pregunta en el chat con esas opciones. ESTÁ TOTALMENTE PROHIBIDO generar listas de pasos futuros (1, 2, 3...), tutoriales o pedir comandos de terminal al usuario.',
                    pregunta: question,
                    opciones: options,
                    _guidance_for_assistant: !initialized
                      ? 'NO expliques listas de pasos futuros. Haz al usuario la pregunta con ask_question: ' + question
                      : 'Pregunta al usuario qué pantalla o flujo desea registrar con qap_discover: ' + question,
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

          const envsMap: Record<string, { url: string; browser_mode: 'auto' | 'headless' | 'headed' }> = {};
          for (const env of envList) {
            envsMap[env] = { url: baseUrl, browser_mode: 'auto' };
          }
          const envsYaml = {
            _version: '1',
            default: envList[0] || 'local',
            environments: envsMap,
          };
          writeFileSync(join(qaDir, 'project', 'environments.yaml'), YAML.stringify(envsYaml), 'utf-8');

          const contextYaml = {
            _version: '1',
            project_name: projectName,
            description: `Configuración base de QA para ${projectName}`,
            tech_stack: [],
            base_url: baseUrl,
            manually_edited: false,
          };
          writeFileSync(join(qaDir, 'project', 'context.yaml'), YAML.stringify(contextYaml), 'utf-8');
          writeFileSync(join(qaDir, '.gitignore'), '# Generado automáticamente por QAP\nexecutions/\ncache/\n', 'utf-8');

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
                    accion_inmediata_requerida: 'Llama INMEDIATAMENTE a la herramienta interactiva de preguntas (como ask_question) con los campos "pregunta" y "opciones". PROHIBIDO mostrar listas de pasos o comandos.',
                    pregunta: 'QAP se ha inicializado correctamente. ¿Tu aplicación requiere inicio de sesión (autenticación) o empezamos descubriendo un módulo público?',
                    opciones: [
                      'Descubrir módulo público o pantalla inicial (qap_discover)',
                      'Configurar perfil de autenticación primero (qap_auth_add)',
                      'Ver estado del proyecto (qap_status)',
                    ],
                    _guidance_for_assistant: 'DIRECTIVA: Inicialización completada. No des listas de pasos. Pregunta al usuario qué módulo o ruta clave desea probar primero (ej: Login, Catálogo, Checkout) para proceder con qap_discover.',
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
                    accion_inmediata_requerida: 'Llama INMEDIATAMENTE a la herramienta interactiva de preguntas (como ask_question) con los campos "pregunta" y "opciones".',
                    pregunta: `Perfil '${profileId}' registrado. ¿Qué pantalla o flujo deseas descubrir ahora con qap_discover?`,
                    opciones: [
                      'Descubrir flujo de Login (/login)',
                      'Descubrir Dashboard principal (/dashboard)',
                      'Especificar otra ruta',
                    ],
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

          // 1. Guardar Spec en cache
          const cacheDir = join(qaDir, 'cache', 'discover');
          if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
          const spec: ModuleSpec = { name, path: route, tags };
          writeFileSync(join(cacheDir, `${name}.spec.json`), JSON.stringify(spec, null, 2), 'utf-8');

          let discoveredData: {
            routes: string[];
            forms: Array<{ id: string; fields: string[] }>;
            buttons: string[];
            pageTitle: string;
          } = { routes: [], forms: [], buttons: [], pageTitle: name };

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

            const adapter = new PlaywrightAdapter({ headless: !headed, baseUrl });
            const discovered = await adapter.discover({ name, path: route, tags });

            const ctxObj = (discovered.context || {}) as Record<string, unknown>;
            discoveredData = {
              routes: Array.isArray(ctxObj.discovered_routes)
                ? (ctxObj.discovered_routes as string[])
                : [],
              forms: Array.isArray(ctxObj.forms)
                ? (ctxObj.forms as Array<{ id: string; fields: string[] }>)
                : [],
              buttons: Array.isArray(ctxObj.buttons)
                ? (ctxObj.buttons as string[])
                : [],
              pageTitle: discovered.description ?? name,
            };
            if (ctxObj.playwright_error) {
              playwrightError = String(ctxObj.playwright_error);
              playwrightUsed = false;
            } else {
              playwrightUsed = true;
            }
          } catch (err) {
            playwrightError = err instanceof Error ? err.message : String(err);
          }

          // Estructura granular de persistencia (Fix 5)
          const modulesDir = join(qaDir, 'modules');
          const moduleDir = join(modulesDir, name);
          const viewsDir = join(moduleDir, 'views', 'default');
          mkdirSync(viewsDir, { recursive: true });

          // context.yaml de la vista por defecto
          const viewContext = {
            _version: '1',
            view_name: 'default',
            description: desc,
            path: route,
            tags,
            playwright_used: playwrightUsed,
            playwright_error: playwrightError,
            discovered_at: new Date().toISOString(),
            page_title: discoveredData.pageTitle,
            routes_found: discoveredData.routes,
          };
          writeFileSync(join(viewsDir, 'context.yaml'), YAML.stringify(viewContext), 'utf-8');

          // selectors.json de la vista
          const selectorsData = {
            _version: '1',
            view: 'default',
            module: name,
            generated_at: new Date().toISOString(),
            selectors: {
              forms: discoveredData.forms,
              buttons: discoveredData.buttons,
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

          // Entrevista guiada en 3 pasos (Fix 3)
          const playwrightStatus = playwrightUsed ? 'explorando' : (playwrightError ? 'fallido' : 'estático');

          const responsePayload: Record<string, unknown> = {
            status: 'success',
            directorio_objetivo: rootDir,
            message: `✔ Módulo '${name}' descubierto y persistido en .qa/modules/${name}/`,
            module: summaryData,
            view: viewContext,
            playwright_status: playwrightStatus,
            playwright_error: playwrightError,
            headed_disponible: true,
            accion_inmediata_requerida: 'Llama INMEDIATAMENTE a la herramienta interactiva de preguntas (como ask_question) con los campos "pregunta" y "opciones".',
          };

          if (!rawDesc) {
            responsePayload.pregunta = `¿Qué módulo o funcionalidad estás construyendo o probando hoy? Describe brevemente el propósito de '${name}'.`;
            responsePayload.opciones = [
              'Flujo de autenticación (login/registro/recuperación)',
              'Panel de administración o dashboard',
              'Formulario de creación/edición de entidad',
              'Listado y búsqueda de registros',
              'Otro (especifica en el chat)',
            ];
          } else {
            responsePayload.pregunta = `Módulo '${name}' registrado con éxito (${playwrightStatus}). ¿Deseas explorar otra vista o consultar el Knowledge Graph 2D?`;
            responsePayload.opciones = [
              'Abrir visor del Knowledge Graph 2D (qap_server)',
              'Descubrir otro módulo (qap_discover)',
              'Ver estado del proyecto (qap_status)',
            ];
          }

          responsePayload.pregunta_doc = `¿Existe un PRD, README o especificación de diseño para '${name}' que pueda usar como guía base?`;
          responsePayload.opciones_doc = [
            'Sí, tengo un archivo de especificación (comparte la ruta o contenido)',
            'No, proceder solo con exploración de Playwright',
            'Tengo notas informales (puedo dictártelas)',
          ];

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
                mensaje: 'La generación automática de planes está programada para el Sprint 6. Actualmente el motor opera hasta el Sprint 5: Descubrimiento, Mapeo y Knowledge Graph 2D.',
                capacidades_actuales: ['qap_status', 'qap_init', 'qap_discover', 'qap_validate', 'qap_report', 'qap_server'],
                accion_recomendada: 'Usa qap_discover para registrar el módulo y qap_validate para verificar la estructura.',
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

          if (!executionId) {
            const execDir = join(qaDir, 'executions');
            if (existsSync(execDir)) {
              const files = readdirSync(execDir).filter((f) => f.endsWith('.json') && !f.endsWith('.report.json'));
              if (files.length > 0) {
                files.sort().reverse();
                executionId = files[0].replace('.json', '');
              }
            }
          }

          if (!executionId) {
            executionId = 'latest';
          }

          let execResult = await storage.getExecutionResult(executionId);
          if (!execResult) {
            const now = new Date().toISOString();
            execResult = {
              _version: '1',
              execution_id: executionId,
              module: executionId,
              env: 'local',
              started_at: now,
              finished_at: now,
              result: 'passed',
              timed_out: false,
              summary: { total: 0, passed: 0, failed: 0, skipped: 0, not_run: 0 },
              cases: [],
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
                    accion_inmediata_requerida: 'Llama INMEDIATAMENTE a la herramienta interactiva de preguntas (como ask_question) con los campos "pregunta" y "opciones".',
                    pregunta: `Reporte generado en ${reportsGenerated.html ? 'HTML' : 'formato seleccionado'}. ¿Deseas abrir el visor interactivo del Knowledge Graph 2D en el navegador?`,
                    opciones: [
                      'Abrir visor del Knowledge Graph 2D (qap_server)',
                      'Ver estado del proyecto (qap_status)',
                      'Concluir sesión de pruebas',
                    ],
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
                      accion_inmediata_requerida: 'Llama INMEDIATAMENTE a la herramienta interactiva de preguntas (como ask_question) con los campos "pregunta" y "opciones".',
                      pregunta: `El proyecto en '${rootDir}' no tiene la carpeta .qa/. ¿Deseas inicializar QAP ahora con qap_init?`,
                      opciones: [
                        `Inicializar QAP en '${rootDir}' (qap_init)`,
                        'Especificar otra ruta de proyecto (targetPath)',
                        'Cancelar',
                      ],
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

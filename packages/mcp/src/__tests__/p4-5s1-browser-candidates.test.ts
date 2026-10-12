import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { Pregunta, Opcion } from '@qap/engine';
import { guardPregunta } from '@qap/engine';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { QAP_CORE_DIRECTIVES } from '../guidance.js';
import { createMcpServer, PLAYWRIGHT_INSTALL_COMMAND, checkPlaywrightBrowser } from '../server.js';

describe('P4.5-S1: Preflight browser, Module Candidates, and Session Plan', () => {
  let tmpDir: string;
  let client: Client;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-p4-5s1-test-'));
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer();
    await server.connect(serverTransport);
    client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientTransport);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  async function initAndAdvanceToScoping(c: Client, dir: string) {
    await c.callTool({
      name: 'qap_init',
      arguments: { targetPath: dir }
    });

    // Provide environments.yaml with url
    const envsPath = path.join(dir, '.qa', 'project', 'environments.yaml');
    fs.writeFileSync(
      envsPath,
      'environments:\n  local:\n    url: "http://localhost:3000"\n',
      'utf-8'
    );

    // Provide repo-map.json with routes
    const repoMapPath = path.join(dir, '.qa', 'project', 'repo-map.json');
    const repoMap = {
      _version: '1.0.0',
      subproyectos: [{ path: '.', name: 'frontend', framework: 'react-router' }],
      rutas: [
        { path: '/login', archivo: 'src/App.tsx', linea: 10, framework: 'react-router', requiere_sesion: null, roles: [] },
        { path: '/perfil', archivo: 'src/App.tsx', linea: 20, framework: 'react-router', requiere_sesion: null, roles: [] }
      ],
      advertencias: []
    };
    fs.writeFileSync(repoMapPath, JSON.stringify(repoMap, null, 2), 'utf-8');

    const setRes = await c.callTool({
      name: 'qap_context_set',
      arguments: {
        targetPath: dir,
        project_name: 'Test Project E2E',
        objective: 'Plataforma B2B para gestión de inventarios y envíos logísticos en tiempo real',
        roles: [{ name: 'Administrador' }],
        auth: { has_auth: false, notes: 'none' },
        critical_flows: [{ name: 'F1: Iniciar sesión' }, { name: 'F2: Ver perfil' }],
        source_of_truth: { type: 'prd', ref: 'docs/prd.md', declared: true }
      }
    }) as { content: Array<{ type: string; text: string }> };

    const parsed = JSON.parse(setRes.content[0].text);
    expect(parsed.fase).toBe('SCOPING');
  }

  it('C1: qap_status y qap_init incluyen navegador_qap en proyecto inicializado', async () => {
    // 1. init
    const initRes = await client.callTool({
      name: 'qap_init',
      arguments: { targetPath: tmpDir }
    }) as { content: Array<{ type: string; text: string }> };
    const initData = JSON.parse(initRes.content[0].text);
    expect(initData.status).toBe('success');
    expect(initData.preflight).toBeDefined();
    expect(['ok', 'falta']).toContain(initData.preflight.navegador_qap);

    // 2. status
    const statusRes = await client.callTool({
      name: 'qap_status',
      arguments: { targetPath: tmpDir }
    }) as { content: Array<{ type: string; text: string }> };
    const statusData = JSON.parse(statusRes.content[0].text);
    expect(statusData.preflight).toBeDefined();
    expect(['ok', 'falta']).toContain(statusData.preflight.navegador_qap);
  });

  it('C1: directivas contienen la indicación de preflight, exploracion y longitud <= 600', () => {
    expect(QAP_CORE_DIRECTIVES.length).toBeLessThanOrEqual(600);
    expect(QAP_CORE_DIRECTIVES).toContain('Si falta navegador, instálalo con el comando indicado como paso de trabajo autónomo');
    expect(QAP_CORE_DIRECTIVES).toContain('las acciones que requieren confirmación nunca vienen como trabajo');
    expect(QAP_CORE_DIRECTIVES).toContain('Explora solo con qap_discover');
  });

  it('C1: descripciones de qap_status, qap_init y qap_discover contienen la frase obligatoria sobre exploracion', async () => {
    const listRes = await client.listTools();
    const toolMap = new Map(listRes.tools.map((t) => [t.name, t.description || '']));

    const requiredPhrase = 'QAP observa la app con su propio navegador mediante qap_discover; no uses navegadores ni herramientas de otros servidores MCP ni del IDE para explorarla (no se persistiría conocimiento en .qa)';

    expect(toolMap.get('qap_status')).toContain(requiredPhrase);
    expect(toolMap.get('qap_init')).toContain(requiredPhrase);
    expect(toolMap.get('qap_discover')).toContain(requiredPhrase);
  });

  it('C4/C6: qap_context_ingest persiste module-candidates.json y qap_session_plan lo usa', async () => {
    await initAndAdvanceToScoping(client, tmpDir);

    const candidates = [
      {
        nombre: 'Acceso',
        ruta_hint: '/login',
        flujos: ['F1: Iniciar sesión'],
        evidence: 'Login form test evidence'
      },
      {
        nombre: 'Perfil',
        ruta_hint: '/perfil',
        flujos: ['F2: Ver perfil'],
        evidence: 'Profile page test evidence'
      }
    ];

    // Ingest candidates
    const ingestRes = await client.callTool({
      name: 'qap_context_ingest',
      arguments: {
        targetPath: tmpDir,
        docContent: '# PRD\n\nLogin form test evidence\n\nProfile page test evidence',
        modulos_candidatos: candidates
      }
    }) as { content: Array<{ type: string; text: string }> };

    const ingestData = JSON.parse(ingestRes.content[0].text);
    expect(ingestData.status).toBe('success');
    expect(ingestData.modulos_candidatos_generados).toHaveLength(2);

    // Verify file written to .qa/project/module-candidates.json
    const candidatesPath = path.join(tmpDir, '.qa', 'project', 'module-candidates.json');
    expect(fs.existsSync(candidatesPath)).toBe(true);
    const savedCandidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
    expect(savedCandidates.candidates).toHaveLength(2);

    const cand1Id = savedCandidates.candidates[0].id;
    const cand2Id = savedCandidates.candidates[1].id;

    // Plan with desde_candidatos
    const planRes = await client.callTool({
      name: 'qap_session_plan',
      arguments: {
        targetPath: tmpDir,
        desde_candidatos: [cand1Id, cand2Id]
      }
    }) as { content: Array<{ type: string; text: string }> };

    const planData = JSON.parse(planRes.content[0].text);
    expect(planData.status).toBe('success');
    expect(planData.plan).toHaveLength(2);
    expect(planData.plan[0].flujos).toEqual(['F1: Iniciar sesión']);
    expect(planData.plan[0].priority).toBe('high');
    expect(planData.plan[1].flujos).toEqual(['F2: Ver perfil']);
    expect(planData.plan[1].priority).toBe('high');
  });

  it('C5: qap_session_plan responde blocked (no error) si un id de candidato no existe', async () => {
    await initAndAdvanceToScoping(client, tmpDir);

    const planRes = await client.callTool({
      name: 'qap_session_plan',
      arguments: {
        targetPath: tmpDir,
        desde_candidatos: ['inexistente-123']
      }
    }) as { isError?: boolean; content: Array<{ type: string; text: string }> };

    expect(planRes.isError).toBeFalsy();
    const planData = JSON.parse(planRes.content[0].text);
    expect(planData.status).toBe('blocked');
    expect(planData.razon).toContain("El candidato con id 'inexistente-123' no existe en module-candidates.json.");
  });

  it('C4: qap_session_plan bloquea si candidato tiene ruta null con ejemplo generico fijo (/catalog) nunca derivado del nombre', async () => {
    await initAndAdvanceToScoping(client, tmpDir);

    const ingestRes = await client.callTool({
      name: 'qap_context_ingest',
      arguments: {
        targetPath: tmpDir,
        docContent: '# PRD\n\nDetalle del modulo sin ruta confirmada',
        modulos_candidatos: [
          {
            nombre: 'Modulo Sin Ruta Extraordinario',
            flujos: [],
            evidence: 'Detalle del modulo sin ruta confirmada'
          }
        ]
      }
    }) as { content: Array<{ type: string; text: string }> };

    const ingestData = JSON.parse(ingestRes.content[0].text);
    const noRouteCandId = ingestData.modulos_candidatos_generados[0].id;

    const planRes = await client.callTool({
      name: 'qap_session_plan',
      arguments: {
        targetPath: tmpDir,
        desde_candidatos: [noRouteCandId]
      }
    }) as { content: Array<{ type: string; text: string }> };

    const planData = JSON.parse(planRes.content[0].text);
    expect(planData.status).toBe('blocked');
    expect(planData.razon).toContain('no tiene una ruta definida');

    const pregunta = planData.siguiente_accion?.pregunta;
    expect(pregunta).toBeDefined();
    expect(pregunta.texto).toContain('por ejemplo: /catalog');
    // Fallar si el ejemplo contiene el nombre del candidato
    expect(pregunta.texto).not.toContain('/modulo_sin_ruta_extraordinario');
    expect(pregunta.texto).not.toContain('/modulo-sin-ruta-extraordinario');
  });

  it('C6: qap_context_ingest sin candidatos cuando hay flujos criticos genera paso trabajo', async () => {
    await initAndAdvanceToScoping(client, tmpDir);

    const ingestRes = await client.callTool({
      name: 'qap_context_ingest',
      arguments: {
        targetPath: tmpDir,
        docContent: '# PRD\n\nEspecificación con flujos existentes',
        propuesta: {
          objetivo: 'Objetivo de prueba'
        }
      }
    }) as { content: Array<{ type: string; text: string }> };

    const ingestData = JSON.parse(ingestRes.content[0].text);
    expect(ingestData.status).toBe('success');
    expect(ingestData.siguiente_accion?.tipo).toBe('trabajo');
    expect(ingestData.siguiente_accion?.tool).toBe('qap_context_ingest');
    expect(ingestData.siguiente_accion?.descripcion).toContain('Proponer módulos candidatos con evidencia');
  });

  it('C7: pregunta de alcance sin candidatos o sin front es byte a byte identica a la original', async () => {
    const noFrontDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-nofront-c7-'));
    try {
      await client.callTool({
        name: 'qap_init',
        arguments: { targetPath: noFrontDir }
      });
      const envsPath = path.join(noFrontDir, '.qa', 'project', 'environments.yaml');
      fs.writeFileSync(envsPath, 'environments:\n  local:\n    url: "http://localhost:3000"\n', 'utf-8');

      await client.callTool({
        name: 'qap_context_set',
        arguments: {
          targetPath: noFrontDir,
          project_name: 'No Front Backend',
          objective: 'Plataforma backend pura sin aplicación frontend',
          roles: [{ name: 'Admin' }],
          auth: { has_auth: false, notes: 'none' },
          critical_flows: [{ name: 'F1: Flujo Backend 1' }],
          source_of_truth: { type: 'prd', ref: 'PRD.md', declared: true }
        }
      });

      const statusRes = await client.callTool({
        name: 'qap_status',
        arguments: { targetPath: noFrontDir }
      }) as { content: Array<{ type: string; text: string }> };

      const statusData = JSON.parse(statusRes.content[0].text);
      const pregunta = statusData.siguiente_accion?.pregunta;

      // Comparación byte a byte con el estado previo (V1):
      const expectedOriginal = {
        id: 'scoping.modulos_a_probar',
        texto: 'Indica los módulos a probar con su nombre y ruta (por ejemplo: Catálogo /catalog, Pagos /checkout):',
        formato: 'abierta',
        opciones: [],
        permite_otra: true,
        registrar_con: {
          tool: 'qap_session_plan',
          campo: 'modules'
        },
        render_texto: 'Indica los módulos a probar con su nombre y ruta (por ejemplo: Catálogo /catalog, Pagos /checkout):\n\n(Escribe tu respuesta libremente)'
      };

      expect(pregunta).toEqual(expectedOriginal);
    } finally {
      fs.rmSync(noFrontDir, { recursive: true, force: true });
    }
  });

  it('D5: comando de instalacion consistente en preflight, qap_init, qap_status y checkPlaywrightBrowser', async () => {
    // 1. Constante compartida canónica
    expect(PLAYWRIGHT_INSTALL_COMMAND).toBe('npx playwright install chromium');

    // 2. checkPlaywrightBrowser()
    const browserCheck = await checkPlaywrightBrowser();
    expect(browserCheck.comando_instalacion).toBe(PLAYWRIGHT_INSTALL_COMMAND);

    // 3. qap_init
    const initRes = await client.callTool({
      name: 'qap_init',
      arguments: { targetPath: tmpDir }
    }) as { content: Array<{ type: string; text: string }> };
    const initData = JSON.parse(initRes.content[0].text);
    expect(initData.preflight?.comando_instalacion).toBe(PLAYWRIGHT_INSTALL_COMMAND);

    // 4. qap_status
    const statusRes = await client.callTool({
      name: 'qap_status',
      arguments: { targetPath: tmpDir }
    }) as { content: Array<{ type: string; text: string }> };
    const statusData = JSON.parse(statusRes.content[0].text);
    expect(statusData.preflight?.comando_instalacion).toBe(PLAYWRIGHT_INSTALL_COMMAND);
  });

  it('C5: scoping con 3 y con 9 candidatos (máximo 7 por tarjeta + Otro módulo), sin recomendada en opciones y pasa guardia de emisión', async () => {
    await initAndAdvanceToScoping(client, tmpDir);

    // Caso A: 3 candidatos
    const candidates3 = [
      { id: 'c1', nombre: 'Módulo Uno', ruta: '/uno', fuentes: ['doc'], flujos: ['F1: Iniciar sesión'], confianza: 'alta', evidencia: 'E1' },
      { id: 'c2', nombre: 'Módulo Dos', ruta: '/dos', fuentes: ['doc'], flujos: ['F2: Ver perfil'], confianza: 'media', evidencia: 'E2' },
      { id: 'c3', nombre: 'Módulo Tres', ruta: null, fuentes: ['doc'], flujos: [], confianza: 'baja', evidencia: 'E3' },
    ];
    const candPath = path.join(tmpDir, '.qa', 'project', 'module-candidates.json');
    fs.writeFileSync(candPath, JSON.stringify({ _version: '1.0.0', candidates: candidates3 }, null, 2), 'utf-8');

    const status3Res = await client.callTool({
      name: 'qap_status',
      arguments: { targetPath: tmpDir }
    }) as { content: Array<{ type: string; text: string }> };
    const status3Data = JSON.parse(status3Res.content[0].text);
    const preg3 = status3Data.siguiente_accion?.pregunta;

    expect(preg3).toBeDefined();
    expect(preg3.formato).toBe('multiple');
    // 3 candidatos + "Otro módulo" = 4 opciones
    expect(preg3.opciones).toHaveLength(4);
    // Ninguna opción debe tener recomendada: true (se recomienda en el texto)
    for (const opt of preg3.opciones as Opcion[]) {
      expect(opt.recomendada).toBeFalsy();
    }
    expect(preg3.texto.toLowerCase()).toContain('se recomienda');
    expect(preg3.texto.toLowerCase()).toContain('3 primeros');
    // Candidato con ruta null muestra (ruta por confirmar)
    const optNull = (preg3.opciones as Opcion[]).find((o) => o.id === 'c3');
    expect(optNull?.etiqueta).toContain('(ruta por confirmar)');
    // Opción otro módulo presente con efecto abre_seguimiento y pregunta con seguimiento
    const optOtro = (preg3.opciones as Opcion[]).find((o) => o.id === 'otro_modulo');
    expect(optOtro).toBeDefined();
    expect(optOtro?.efecto?.abre_seguimiento).toBe(true);
    expect(preg3.seguimiento).toBeDefined();
    // Debe pasar la guardia de emisión sin lanzar
    expect(() => {
      guardPregunta(preg3 as Pregunta);
    }).not.toThrow();

    // Caso B: 9 candidatos (debe topar a máximo 7 por tarjeta + Otro módulo = 8 opciones)
    const candidates9 = [];
    for (let i = 1; i <= 9; i++) {
      candidates9.push({
        id: `cand_${i}`,
        nombre: `Módulo Extra ${i}`,
        ruta: `/extra-${i}`,
        fuentes: ['doc'],
        flujos: [],
        confianza: 'media',
        evidencia: `Evidencia ${i}`
      });
    }
    fs.writeFileSync(candPath, JSON.stringify({ _version: '1.0.0', candidates: candidates9 }, null, 2), 'utf-8');

    const status9Res = await client.callTool({
      name: 'qap_status',
      arguments: { targetPath: tmpDir }
    }) as { content: Array<{ type: string; text: string }> };
    const status9Data = JSON.parse(status9Res.content[0].text);
    const preg9 = status9Data.siguiente_accion?.pregunta;

    expect(preg9).toBeDefined();
    // 7 candidatos máximos + 1 "Otro módulo" = 8 opciones
    expect(preg9.opciones).toHaveLength(8);
    expect(preg9.opciones[7].id).toBe('otro_modulo');
    expect(() => {
      guardPregunta(preg9 as Pregunta);
    }).not.toThrow();
  });

  it('C6: qap_session_plan asigna high a los 3 primeros y medium al resto, con soporte retrocompatible para modules', async () => {
    await initAndAdvanceToScoping(client, tmpDir);

    const candidates = [];
    for (let i = 1; i <= 5; i++) {
      candidates.push({
        id: `c_${i}`,
        nombre: `Modulo ${i}`,
        ruta: `/ruta-${i}`,
        fuentes: ['doc'],
        flujos: [`F${i}`],
        confianza: 'alta',
        evidencia: `E${i}`
      });
    }
    const candPath = path.join(tmpDir, '.qa', 'project', 'module-candidates.json');
    fs.writeFileSync(candPath, JSON.stringify({ _version: '1.0.0', candidates }, null, 2), 'utf-8');

    // Elegir 5 candidatos
    const planRes = await client.callTool({
      name: 'qap_session_plan',
      arguments: {
        targetPath: tmpDir,
        desde_candidatos: ['c_1', 'c_2', 'c_3', 'c_4', 'c_5'],
      }
    }) as { content: Array<{ type: string; text: string }> };
    const planData = JSON.parse(planRes.content[0].text);
    expect(planData.status).toBe('success');
    expect(planData.plan).toHaveLength(5);
    // Primeros 3 tienen priority high
    expect(planData.plan[0].priority).toBe('high');
    expect(planData.plan[1].priority).toBe('high');
    expect(planData.plan[2].priority).toBe('high');
    // Los siguientes tienen priority medium
    expect(planData.plan[3].priority).toBe('medium');
    expect(planData.plan[4].priority).toBe('medium');

    // Retrocompatibilidad: formato tradicional con modules
    const retroDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-retro-plan-'));
    try {
      await initAndAdvanceToScoping(client, retroDir);
      const retroPlanRes = await client.callTool({
        name: 'qap_session_plan',
        arguments: {
          targetPath: retroDir,
          modules: [
            { name: 'Catálogo', path: '/catalog', priority: 'high' }
          ]
        }
      }) as { content: Array<{ type: string; text: string }> };
      const retroPlanData = JSON.parse(retroPlanRes.content[0].text);
      expect(retroPlanData.status).toBe('success');
      expect(retroPlanData.plan[0].module).toBe('Catálogo');
      expect(retroPlanData.plan[0].path).toBe('/catalog');
    } finally {
      fs.rmSync(retroDir, { recursive: true, force: true });
    }
  });
});

import type { ProjectRepoMap, ProposedModuleCandidate } from '@qap/shared';
import { SchemaValidator } from '@qap/shared';
import { describe, it, expect } from 'vitest';

import { generateModuleCandidates } from '../candidate-generator.js';

describe('C4: generateModuleCandidates (Generador de Módulos Candidatos)', () => {
  const validator = new SchemaValidator();

  const docText = `
# Especificación del Sistema de Gestión

Este documento describe los módulos del sistema.

## Módulo de Catálogo
El catálogo de productos permite ver ítems y precios.
Evidencia exacta: Catálogo de productos disponibles con filtros avanzados.

## Módulo de Checkout
El checkout procesa pagos y compras.
Evidencia: Procesamiento seguro de pagos y órdenes.

## Módulo de Reportes
Permite consultar balances contables.
Evidencia: Consulta de balances contables mensuales.
  `;

  const repoMap: ProjectRepoMap = {
    _version: '1.0.0',
    subproyectos: [{ path: 'web', name: 'web', framework: 'react' }],
    rutas: [
      {
        path: '/catalogo',
        archivo: 'src/pages/catalogo.tsx',
        linea: 1,
        framework: 'react',
        requiere_sesion: null,
        roles: [],
      },
      {
        path: '/checkout-pago',
        archivo: 'src/pages/checkout.tsx',
        linea: 1,
        framework: 'react',
        requiere_sesion: true,
        roles: [],
      },
      {
        path: '/ajustes',
        archivo: 'src/pages/ajustes.tsx',
        linea: 1,
        framework: 'react',
        requiere_sesion: true,
        roles: [],
      },
    ],
    advertencias: [],
  };

  const criticalFlows = [
    { name: 'Buscar producto' },
    { name: 'Pagar orden' },
    { name: 'Generar balance' },
  ];

  it('procesa candidato válido con ruta_hint exacta y le asigna confianza alta y fuentes doc+repo', () => {
    const proposed: ProposedModuleCandidate[] = [
      {
        nombre: 'Catálogo',
        ruta_hint: '/catalogo',
        evidence: 'Catálogo de productos disponibles con filtros avanzados.',
        flujos: ['Buscar producto'],
      },
    ];

    const res = generateModuleCandidates({
      rawDocContent: docText,
      proposedCandidates: proposed,
      repoMap,
      criticalFlows,
    });

    expect(res.rejectedCandidates).toHaveLength(0);
    const cand = res.candidatesFile.candidates.find((c) => c.nombre === 'Catálogo');
    expect(cand).toBeDefined();
    expect(cand?.ruta).toBe('/catalogo');
    expect(cand?.confianza).toBe('alta');
    expect(cand?.fuentes).toEqual(['doc', 'repo']);
    expect(cand?.flujos).toEqual(['Buscar producto']);

    const val = validator.validateModuleCandidates(res.candidatesFile);
    expect(val.valid).toBe(true);
  });

  it('asocia ruta por solapamiento de vocabulario >= 60% y asigna confianza media', () => {
    const proposed: ProposedModuleCandidate[] = [
      {
        nombre: 'Checkout Pago',
        evidence: 'Procesamiento seguro de pagos y órdenes.',
        flujos: ['Pagar orden'],
      },
    ];

    const res = generateModuleCandidates({
      rawDocContent: docText,
      proposedCandidates: proposed,
      repoMap,
      criticalFlows,
    });

    expect(res.rejectedCandidates).toHaveLength(0);
    const cand = res.candidatesFile.candidates.find((c) => c.nombre === 'Checkout Pago');
    expect(cand).toBeDefined();
    expect(cand?.ruta).toBe('/checkout-pago');
    expect(cand?.confianza).toBe('media');
    expect(cand?.fuentes).toEqual(['doc', 'repo']);
  });

  it('asigna ruta null cuando no hay coincidencia de ruta y NUNCA inventa una ruta desde el nombre', () => {
    const proposed: ProposedModuleCandidate[] = [
      {
        nombre: 'Reportes Financieros',
        evidence: 'Consulta de balances contables mensuales.',
        flujos: ['Generar balance'],
      },
    ];

    const res = generateModuleCandidates({
      rawDocContent: docText,
      proposedCandidates: proposed,
      repoMap,
      criticalFlows,
    });

    expect(res.rejectedCandidates).toHaveLength(0);
    const cand = res.candidatesFile.candidates.find((c) => c.nombre === 'Reportes Financieros');
    expect(cand).toBeDefined();
    // M24 invariant: ruta DEBE ser null
    expect(cand?.ruta).toBeNull();
    expect(cand?.fuentes).toEqual(['doc']);
    expect(cand?.flujos).toEqual(['Generar balance']);
  });

  it('rechaza candidato con evidencia inexistente en el documento con razón descriptiva (M23)', () => {
    const proposed: ProposedModuleCandidate[] = [
      {
        nombre: 'Módulo Fantasma',
        evidence: 'Esta evidencia no existe en el texto del documento para nada.',
        flujos: ['Buscar producto'],
      },
    ];

    const res = generateModuleCandidates({
      rawDocContent: docText,
      proposedCandidates: proposed,
      repoMap,
      criticalFlows,
    });

    expect(res.rejectedCandidates).toHaveLength(1);
    expect(res.rejectedCandidates[0]?.nombre).toBe('Módulo Fantasma');
    expect(res.rejectedCandidates[0]?.razon).toBe('evidencia_no_encontrada_en_documento');
    expect(res.candidatesFile.candidates.some((c) => c.nombre === 'Módulo Fantasma')).toBe(false);
  });

  it('descarta flujos inexistentes en criticalFlows conservando sólo los válidos (M25)', () => {
    const proposed: ProposedModuleCandidate[] = [
      {
        nombre: 'Catálogo',
        ruta_hint: '/catalogo',
        evidence: 'Catálogo de productos disponibles con filtros avanzados.',
        flujos: ['Buscar producto', 'Flujo Inventado No En Contexto', 'Hack Database'],
      },
    ];

    const res = generateModuleCandidates({
      rawDocContent: docText,
      proposedCandidates: proposed,
      repoMap,
      criticalFlows,
    });

    const cand = res.candidatesFile.candidates.find((c) => c.nombre === 'Catálogo');
    expect(cand).toBeDefined();
    expect(cand?.flujos).toEqual(['Buscar producto']);
    expect(cand?.flujos).not.toContain('Flujo Inventado No En Contexto');
  });

  it('incorpora rutas repo-only y limita el total a un máximo de 12 candidatos ordenados por cobertura y confianza', () => {
    const proposed: ProposedModuleCandidate[] = [];
    // Crear 15 candidatos válidos con evidencia presente en el texto
    for (let i = 1; i <= 15; i++) {
      proposed.push({
        nombre: `Módulo Extra ${i}`,
        evidence: 'catálogo de productos',
        flujos: i <= 3 ? ['Buscar producto'] : [],
      });
    }

    const res = generateModuleCandidates({
      rawDocContent: docText,
      proposedCandidates: proposed,
      repoMap,
      criticalFlows,
    });

    expect(res.candidatesFile.candidates.length).toBeLessThanOrEqual(12);
    // Los candidatos con más flujos deben aparecer primeros
    const firstCand = res.candidatesFile.candidates[0];
    expect(firstCand?.flujos.length).toBeGreaterThan(0);

    const val = validator.validateModuleCandidates(res.candidatesFile);
    expect(val.valid).toBe(true);
  });

  it('D8: ordena estrictamente por flujos de prioridad alta, luego flujos totales, luego confianza, luego nombre', () => {
    const flowsWithPriority = [
      { name: 'Flujo High 1', priority: 'high' as const },
      { name: 'Flujo High 2', priority: 'high' as const },
      { name: 'Flujo Normal 1', priority: 'medium' as const },
      { name: 'Flujo Normal 2', priority: 'medium' as const },
    ];

    const proposed: ProposedModuleCandidate[] = [
      {
        nombre: 'Zeta Sin Flujos',
        evidence: 'catálogo de productos',
        ruta_hint: '/catalogo', // doc + repo -> confianza alta
        flujos: [],
      },
      {
        nombre: 'Alfa Con Flujo Normal',
        evidence: 'procesamiento seguro de pagos',
        flujos: ['Flujo Normal 1'], // confianza media
      },
      {
        nombre: 'Beta Con Flujo High',
        evidence: 'consulta de balances',
        flujos: ['Flujo High 1'], // confianza media
      },
      {
        nombre: 'Delta Con Dos Flujos High',
        evidence: 'catálogo de productos',
        flujos: ['Flujo High 1', 'Flujo High 2'], // confianza media
      },
    ];

    const res = generateModuleCandidates({
      rawDocContent: docText,
      proposedCandidates: proposed,
      repoMap,
      criticalFlows: flowsWithPriority,
    });

    const cands = res.candidatesFile.candidates;
    // 1ro: Delta (2 flujos high)
    expect(cands[0]?.nombre).toBe('Delta Con Dos Flujos High');
    // 2do: Beta (1 flujo high)
    expect(cands[1]?.nombre).toBe('Beta Con Flujo High');
    // 3ro: Alfa (1 flujo normal)
    expect(cands[2]?.nombre).toBe('Alfa Con Flujo Normal');
    // 4to: Zeta (0 flujos, pero confianza alta)
    expect(cands[3]?.nombre).toBe('Zeta Sin Flujos');
  });

  it('C4: excluye rutas del repo con parámetros, comodines o patrones de acceso, login y 404', () => {
    const customRepoMap: ProjectRepoMap = {
      _version: '1.0.0',
      subproyectos: [{ path: 'web', name: 'web', framework: 'react' }],
      rutas: [
        { path: '/users/:id', archivo: 'src/users.tsx', linea: 1, framework: 'react', requiere_sesion: null, roles: [] },
        { path: '/docs/*', archivo: 'src/docs.tsx', linea: 1, framework: 'react', requiere_sesion: null, roles: [] },
        { path: '/acceso', archivo: 'src/acceso.tsx', linea: 1, framework: 'react', requiere_sesion: null, roles: [] },
        { path: '/auth/login', archivo: 'src/login.tsx', linea: 1, framework: 'react', requiere_sesion: null, roles: [] },
        { path: '/404', archivo: 'src/404.tsx', linea: 1, framework: 'react', requiere_sesion: null, roles: [] },
        { path: '/not-found', archivo: 'src/nf.tsx', linea: 1, framework: 'react', requiere_sesion: null, roles: [] },
        { path: '/dashboard', archivo: 'src/dash.tsx', linea: 1, framework: 'react', requiere_sesion: null, roles: [] },
      ],
      advertencias: [],
    };

    const res = generateModuleCandidates({
      rawDocContent: docText,
      proposedCandidates: [],
      repoMap: customRepoMap,
      criticalFlows: [],
    });

    const rutas = res.candidatesFile.candidates.map((c) => c.ruta);
    expect(rutas).toContain('/dashboard');
    expect(rutas).not.toContain('/users/:id');
    expect(rutas).not.toContain('/docs/*');
    expect(rutas).not.toContain('/acceso');
    expect(rutas).not.toContain('/auth/login');
    expect(rutas).not.toContain('/404');
    expect(rutas).not.toContain('/not-found');
  });

  it('C4: ausencia total de fuentes devuelve lista vacía sin fallar', () => {
    const res = generateModuleCandidates({
      rawDocContent: '',
      proposedCandidates: [],
      repoMap: {
        _version: '1.0.0',
        subproyectos: [],
        rutas: [],
        advertencias: [],
      },
      criticalFlows: [],
    });

    expect(res.candidatesFile.candidates).toHaveLength(0);
    expect(res.rejectedCandidates).toHaveLength(0);
  });
});

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
});

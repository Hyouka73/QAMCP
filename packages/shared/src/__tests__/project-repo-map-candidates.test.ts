import { describe, it, expect } from 'vitest';

import { SchemaValidator } from '../validator/schema-validator.js';

describe('ProjectRepoMap, ModuleCandidates and IngestProposal Schemas (P4.5-S1)', () => {
  const validator = new SchemaValidator();

  describe('Validación de repo-map.schema.json', () => {
    it('acepta un repo-map válido con subproyectos y rutas', () => {
      const validRepoMap = {
        _version: '1.0.0',
        subproyectos: [{ path: 'frontend', name: 'app-web', framework: 'react' }],
        rutas: [
          {
            path: '/catalogo',
            archivo: 'src/pages/catalogo.tsx',
            linea: 10,
            framework: 'react',
            requiere_sesion: null,
            roles: [],
          },
        ],
        advertencias: [],
      };

      const result = validator.validateProjectRepoMap(validRepoMap);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rechaza repo-map sin _version requerida', () => {
      const invalid = {
        subproyectos: [],
        rutas: [],
      };

      const result = validator.validateProjectRepoMap(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'required' && e.message.includes('_version'))).toBe(true);
    });

    it('rechaza repo-map sin arreglo rutas requerido', () => {
      const invalid = {
        _version: '1.0.0',
        subproyectos: [],
      };

      const result = validator.validateProjectRepoMap(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'required' && e.message.includes('rutas'))).toBe(true);
    });

    it('rechaza propiedades adicionales en repo-map (additionalProperties: false)', () => {
      const invalid = {
        _version: '1.0.0',
        subproyectos: [],
        rutas: [],
        propiedad_no_permitida: 123,
      };

      const result = validator.validateProjectRepoMap(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'additionalProperties')).toBe(true);
    });
  });

  describe('Validación de module-candidates.schema.json', () => {
    it('acepta archivo de candidatos válido con _version y candidates', () => {
      const validCandidates = {
        _version: '1.0.0',
        candidates: [
          {
            id: 'cand_1',
            nombre: 'Catálogo',
            ruta: '/catalogo',
            fuentes: ['doc', 'repo'],
            flujos: ['Buscar productos'],
            confianza: 'alta',
            evidencia: 'Catálogo de productos',
          },
        ],
      };

      const result = validator.validateModuleCandidates(validCandidates);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rechaza module-candidates sin _version requerida', () => {
      const invalid = {
        candidates: [],
      };

      const result = validator.validateModuleCandidates(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'required' && e.message.includes('_version'))).toBe(true);
    });

    it('rechaza candidato sin campo nombre requerido', () => {
      const invalid = {
        _version: '1.0.0',
        candidates: [
          {
            id: 'cand_1',
            ruta: '/catalogo',
            fuentes: ['doc'],
            flujos: [],
            confianza: 'media',
            evidencia: 'Evidencia',
          },
        ],
      };

      const result = validator.validateModuleCandidates(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'required' && e.message.includes('nombre'))).toBe(true);
    });

    it('rechaza candidato con confianza inválida fuera de enum', () => {
      const invalid = {
        _version: '1.0.0',
        candidates: [
          {
            id: 'cand_1',
            nombre: 'Catálogo',
            ruta: '/catalogo',
            fuentes: ['doc'],
            flujos: [],
            confianza: 'desconocida',
            evidencia: 'Evidencia',
          },
        ],
      };

      const result = validator.validateModuleCandidates(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'enum')).toBe(true);
    });

    it('rechaza propiedades adicionales en module-candidates (additionalProperties: false)', () => {
      const invalid = {
        _version: '1.0.0',
        candidates: [],
        campo_extra: true,
      };

      const result = validator.validateModuleCandidates(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'additionalProperties')).toBe(true);
    });
  });

  describe('Validación de ingest-proposal.schema.json (campo modulos_candidatos)', () => {
    it('acepta propuesta con modulos_candidatos válidos', () => {
      const validProposal = {
        objetivo: 'Plataforma de prueba',
        modulos_candidatos: [
          {
            nombre: 'Login',
            ruta_hint: '/login',
            flujos: ['Iniciar sesión'],
            evidence: 'Pantalla de autenticación',
          },
        ],
      };

      const result = validator.validateIngestProposal(validProposal);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rechaza modulo_candidato sin nombre requerido', () => {
      const invalid = {
        modulos_candidatos: [
          {
            ruta_hint: '/login',
            evidence: 'Pantalla de autenticación',
          },
        ],
      };

      const result = validator.validateIngestProposal(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'required' && e.message.includes('nombre'))).toBe(true);
    });

    it('rechaza modulo_candidato sin evidence requerida', () => {
      const invalid = {
        modulos_candidatos: [
          {
            nombre: 'Login',
            ruta_hint: '/login',
          },
        ],
      };

      const result = validator.validateIngestProposal(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'required' && e.message.includes('evidence'))).toBe(true);
    });

    it('rechaza propiedades adicionales en modulo_candidato (additionalProperties: false)', () => {
      const invalid = {
        modulos_candidatos: [
          {
            nombre: 'Login',
            evidence: 'Pantalla de autenticación',
            propiedad_fantasma: 'invalido',
          },
        ],
      };

      const result = validator.validateIngestProposal(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === 'additionalProperties')).toBe(true);
    });
  });
});

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { assertProjectSegment, result } from './state-services.js';

/** A structural prerequisite only: file presence never certifies coverage or review. */
export function hasLegacyViewContext(root: string, module: string, view = 'default'): boolean {
  assertProjectSegment(module);
  assertProjectSegment(view);
  return existsSync(join(root, '.qa', 'modules', module, 'views', view, 'context.yaml')) ||
    (view === 'default' && existsSync(join(root, '.qa', 'modules', module, 'context.yaml')));
}

export const discoveryIntegration = {
  discovery_advances_lifecycle: false,
  canonical_interview: 'unavailable',
  observations_are_confirmed_requirements: false,
  module_association: 'not_persisted_by_discovery',
  next_safe_action: 'Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto.',
} as const;

export function legacyInterviewBlocked(planned = false) {
  return result({
    status: 'blocked', code: 'legacy_interview_unavailable', persistence: 'not_attempted',
    razon: (planned ? 'El módulo permanece planned. ' : '') +
      'Falta el contexto de vista requerido por la entrevista legacy. Las observaciones canónicas no lo sustituyen ni acreditan cobertura.',
    desbloquear_con: { tool: 'qap_status', descripcion: discoveryIntegration.next_safe_action },
    siguiente_accion: { tipo: 'trabajo', tool: 'qap_status', descripcion: discoveryIntegration.next_safe_action },
    integration: discoveryIntegration,
  }, true);
}

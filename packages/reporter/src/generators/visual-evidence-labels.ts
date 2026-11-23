import type { VisualEvidenceStatus } from '@qap/shared';

const labels: Record<VisualEvidenceStatus, string> = {
  captured: 'Capturada',
  partial: 'Parcial · hay intervalos suprimidos',
  suppressed_by_policy: 'Suprimida por política',
  capture_failed: 'Falló la captura',
  integrity_degraded: 'Integridad de evidencia degradada',
};

export function visualEvidenceLabel(status: VisualEvidenceStatus): string {
  return Object.hasOwn(labels, status) ? labels[status] : 'Estado desconocido';
}

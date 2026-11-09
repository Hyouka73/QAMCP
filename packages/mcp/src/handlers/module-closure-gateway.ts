/**
 * QAMCP vNext — Host Review Gateway para Cierre de Módulos (VNEXT-013-R5 / R3)
 * 
 * Define la frontera de confianza independiente del host para la revisión y aprobación
 * de cobertura, renuncias, declaraciones de no aplicabilidad y cierre de módulos.
 * Las autorizaciones se emiten fuera del canal de argumentos MCP y se vinculan criptográficamente
 * al digest del snapshot de cobertura y estado canónico.
 */

import type { RequirementCategory } from '@qap/shared';

export interface ModuleClosureReviewRequest {
  readonly projectRoot: string;
  readonly applicationId: string;
  readonly environmentId: string;
  readonly moduleId: string;
  readonly moduleKey: string;
  readonly moduleRevision: number;
  readonly plannedName: string;
  readonly action: 'close' | 'waive' | 'accept_gaps' | 'declare_non_applicable';
  readonly coverageDigest: string;
  readonly confirmedRequirementsCount: number;
  readonly unaddressedGapsCount: number;
  readonly acceptedGaps: readonly { readonly gap_id: string; readonly reason: string }[];
  readonly nonApplicableCategories: readonly { readonly category: RequirementCategory; readonly reason: string }[];
  readonly waiverReason?: string;
  readonly requestDigest: string; // SHA-256 que vincula todos los campos de la solicitud
}

export interface ModuleClosureReviewDecision {
  readonly requestDigest: string;
  readonly approvalId: string;
  readonly decision: 'approve' | 'reject';
  readonly reviewer: string;
  readonly decidedAt: string;
  readonly expiresAt: string;
  readonly signature?: string;
}

/**
 * Adaptador de host privilegiado. Debe obtener la decisión de forma independiente
 * a los argumentos MCP del cliente. Sin un gateway confiable del host, el cierre canónico
 * se bloquea estrictamente.
 */
export interface IModuleClosureReviewGateway {
  reviewClosure(request: Readonly<ModuleClosureReviewRequest>): Promise<ModuleClosureReviewDecision | null>;
}

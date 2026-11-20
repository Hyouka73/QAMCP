import type { DiscoveryDossierCanonical } from './discovery-dossier.js';

/** Inventory revisions add this optional marker. Legacy module dossiers keep their existing semantics. */
export function isInitialInventory(dossier?: DiscoveryDossierCanonical): boolean {
  return Boolean(dossier && 'inventory' in dossier && dossier.inventory);
}

export function inspectedInitialView(dossier: DiscoveryDossierCanonical, pathname: string) {
  if (!isInitialInventory(dossier) || dossier.gaps.some(gap => gap.code === 'auth_required')) return;
  const route = dossier.routes.find(item => item.authorized_pathname === pathname && item.state === 'visited');
  if (!route?.view_id) return;
  return dossier.views.find(view => view.view_id === route.view_id && view.evidence_id &&
    view.state !== 'loading_or_script_dependent');
}

import { isAuthPath, normalizeSlug, type AuthProfileRecord } from '@qap/shared';

import type { DiscoveryDossierCanonical, DiscoveryRevisionRecord } from './discovery-dossier.js';

export const inventoryName = 'inventario-provisional';

export function initialInventoryTaskId(projectId: string, environmentId: string): string {
  return `task-initial-inventory-${projectId}-${environmentId}`;
}
const maxRoutes = 256;
const maxRelations = 2048;

export function mergeInitialInventory(
  batch: DiscoveryDossierCanonical,
  previous?: DiscoveryDossierCanonical,
): DiscoveryDossierCanonical {
  const routes: DiscoveryDossierCanonical['routes'][number][] = [];
  const routeSlots = new Map<string, number>();
  const views = new Map<number, DiscoveryDossierCanonical['views'][number]>();
  const relations = new Map<string, NonNullable<DiscoveryDossierCanonical['relations']>[number]>();
  let truncated = previous?.inventory?.truncated ?? false;
  const restricted = batch.routes.filter(route => !route.authorized_pathname || route.authorized_pathname === '/[REDACTED]').length;
  for (const dossier of previous ? [previous, batch] : [batch]) {
    const slots = dossier.routes.map(route => {
      const path = route.authorized_pathname;
      if (!path || path === '/[REDACTED]') return -1;
      const index = routeSlots.get(path);
      if (index !== undefined) {
        const prior = routes[index];
        // A rediscovered link does not replace an earlier inspection or denial.
        if (route.state !== 'candidate' || (prior.state === 'candidate' && route.resumable)) routes[index] = route;
        return index;
      }
      if (routes.length >= maxRoutes) { truncated = true; return -1; }
      routeSlots.set(path, routes.length);
      return routes.push(route) - 1;
    });
    for (const view of dossier.views) {
      const index = slots[view.route_index ?? -1];
      if (index === undefined || index < 0) continue;
      views.set(index, { ...view, route_index: index,
        links: view.links?.map(link => ({ ...link, target_route_index: slots[link.target_route_index] ?? -1 })) });
    }
    for (const relation of dossier.relations ?? []) {
      const from = slots[relation.from_route_index];
      const to = slots[relation.to_route_index];
      if (from === undefined || to === undefined || from < 0 || to < 0) continue;
      const key = `${from}:${to}:${relation.kind}`;
      if (relations.size >= maxRelations && !relations.has(key)) { truncated = true; continue; }
      relations.set(key, { from_route_index: from, to_route_index: to, kind: relation.kind });
    }
  }
  const sourceRefs = new Map((previous?.source_refs ?? []).map(ref => [ref.ref_id, ref]));
  for (const ref of batch.source_refs) sourceRefs.set(ref.ref_id, ref);
  const groups = new Map<string, string[]>();
  for (const route of routes) {
    if (route.state !== 'visited' || !route.authorized_pathname || isAuthPath(route.authorized_pathname)) continue;
    const key = normalizeSlug(route.authorized_pathname.split('/').filter(Boolean)[0] ?? 'inicio');
    const paths = groups.get(key) ?? [];
    paths.push(route.authorized_pathname);
    groups.set(key, paths);
  }
  const inventory = { truncated,
    restricted_routes: Math.max(previous?.inventory?.restricted_routes ?? 0, restricted),
    modules: [...groups].map(([key, paths]) => ({ key, paths, status: 'inferred' as const })) };
  const consolidated = { ...batch, routes, relations: [...relations.values()],
    views: [...views.entries()].filter(([index, view]) => routes[index].view_id === view.view_id).map(([, view]) => view),
    source_refs: [...sourceRefs.values()].slice(-maxRoutes * 4),
    inventory, limitations: [...new Set([...(previous?.limitations ?? []), ...batch.limitations])],
    route_counts: {
      visited: routes.filter(route => route.state === 'visited').length,
      candidate: routes.filter(route => route.state === 'candidate').length,
      blocked: routes.filter(route => route.state === 'blocked').length,
    } };
  const coverage = initialInventoryCoverage(consolidated);
  return { ...consolidated, acquisition_status: coverage.state === 'READY' ? 'completed'
    : coverage.state === 'PARTIAL_READY' ? 'partial' : 'blocked' };
}

export function hasLoginWall(dossier?: DiscoveryDossierCanonical): boolean {
  return Boolean(dossier?.gaps.some(gap => gap.code === 'auth_required') ||
    dossier?.routes.some(route => route.reason === 'AUTH_REQUIRED') ||
    (dossier?.scope.profile_id === null && dossier.relations?.some(relation =>
      relation.kind === 'http_redirect' && isAuthPath(dossier.routes[relation.to_route_index]?.authorized_pathname ?? ''))));
}

export function initialInventoryCoverage(dossier?: DiscoveryDossierCanonical) {
  const routes = dossier?.routes ?? [];
  const inspected = new Set(dossier?.views.filter(view => view.evidence_id).map(view => view.view_id));
  const visited = routes.filter(route => route.state === 'visited' && route.view_id && inspected.has(route.view_id) &&
    !isAuthPath(route.authorized_pathname ?? '')).length;
  const authRequired = hasLoginWall(dossier);
  const pending = routes.filter(route => route.state === 'candidate' && route.resumable).length;
  const incomplete = Boolean(dossier?.inventory?.truncated || dossier?.inventory?.restricted_routes ||
    routes.some(route => route.state !== 'visited' && route.state !== 'redirected') ||
    dossier?.views.some(view => view.truncated || view.state === 'loading_or_script_dependent') ||
    dossier?.limitations.some(limitation => limitation === 'INVENTORY_RESOURCE_OUTSIDE_ALLOWLIST' ||
      limitation === 'INVENTORY_API_OUTSIDE_ALLOWLIST'));
  return {
    state: authRequired || !visited ? 'BLOCKED' as const : incomplete ? 'PARTIAL_READY' as const : 'READY' as const,
    can_scope: !authRequired && visited > 0 && pending === 0,
    auth_required: authRequired,
    resumable_routes: pending,
    inspected_routes: visited,
    candidate_routes: routes.filter(route => route.state === 'candidate').length,
    blocked_routes: routes.filter(route => route.state === 'blocked').length,
    unavailable_routes: routes.filter(route => route.state === 'unavailable' || route.state === 'inconclusive').length,
    restricted_routes: dossier?.inventory?.restricted_routes ?? 0,
    truncated: dossier?.inventory?.truncated ?? false,
    candidate_modules: dossier?.inventory?.modules?.flatMap(module => {
      const path = module.paths.find(candidate => !isAuthPath(candidate));
      return path ? [{ key: module.key, path, status: module.status }] : [];
    }) ?? [],
  };
}

export function selectInitialInventory(
  revisions: readonly DiscoveryRevisionRecord[], environmentId: string, environmentRevision: number,
  tenantId: string | null, profileId?: string | null,
  profiles?: readonly AuthProfileRecord[],
): DiscoveryRevisionRecord | undefined {
  const scoped = revisions.filter(revision => revision.dossier.inventory &&
    revision.environment_id === environmentId &&
    revision.dossier.scope.inventory_environment_revision === environmentRevision &&
    revision.tenant_id === tenantId && (revision.profile_id === null || !profiles ||
      profiles.some(profile => profile.profile_id === revision.profile_id && (profile.role_name ?? null) === revision.role &&
        profile.status !== 'revoked')));
  if (profileId !== undefined) return scoped.find(revision => revision.profile_id === profileId);
  return scoped.find(revision => revision.profile_id !== null &&
    initialInventoryCoverage(revision.dossier).inspected_routes > 0) ??
    scoped.find(revision => revision.profile_id === null) ?? scoped[0];
}

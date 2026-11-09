#!/usr/bin/env node
/**
 * QAMCP vNext R7 Preflight Manifest Validator Engine
 *
 * Implements deterministic validation of executor preflight manifests according to
 * CONTRATO_EJECUTOR.md and VNEXT-014-E01 specifications (Post-Auditoría Codex Hardened).
 *
 * Enforces:
 * 1. Schema completeness (all top-level and nested required fields, no PASS by omission)
 * 2. Strict toolchain parity (Node.js v24.15.0, pnpm 12.3.4, Chromium 151.0.7922.34 canonical)
 * 3. Git tree integrity (40-char hex commit SHA, authorized branch, clean working tree)
 * 4. Exact distribution artifact hashes (SHA256 of 4 dist bundles)
 * 5. Telemetry continuity (span >= 60s, max gap <= 5000ms, max query <= 5000ms, chronological order)
 * 6. Non-empty samples (>= 30), 10 metric fields per sample, exactly 4 unique process groups
 * 7. Sample-by-sample and aggregate enforcement of normative interference budgets
 * 8. Independent resource reservation accreditation (prohibits self-declared reservation fallacy)
 * 9. Tripartite state separation: VALIDADOR_PASS strictly NEVER promotes to EJECUTOR_APTO without accredited reservation
 * 10. Immutable external git whitelist (executor-supplied whitelists strictly rejected)
 * 11. Strict CLI argument parsing with fail-closed rejection of unknown options or mismatched SHAs
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CANONICAL_DIST_HASHES = {
  'packages/mcp/dist/server.js': '3457541827D1F601591BD090CD8A929440B310ED223CFDDCE37BCEF0CA68AAA4',
  'packages/playwright-adapter/dist/index.js': '7992F3711E30DB7938389C8BC6ADA306D628DB881FE1E93E0B9C2B172209A640',
  'packages/knowledge/dist/index.js': 'F5F53A04CEDE07E0A078A19EEB2CEE7D13D64FA7093593AFA037B256DAE3DCE2',
  'packages/shared/dist/index.js': '0AC145490635870C3D52AFB9B738608148EEEA35DFD9695E941A6662EDAEBDD7'
};

export const CANONICAL_TOOLCHAIN = {
  node_version: 'v24.15.0',
  pnpm_version: '12.3.4',
  chromium_version: '151.0.7922.34'
};

export const NORMATIVE_INTERFERENCE_LIMITS = {
  max_external_cpu_percent: 10.0,
  max_disk_queue: 2.0,
  max_pages_input_per_sec: 500.0,
  min_available_ram_mb: 2048
};

export const AUTHORIZED_BRANCH = 'feat/qap-vnext-architecture';

export const ALLOWED_GIT_EXCEPTIONS = [
  'packages/playwright-runner/.qa/cache/sessions/admin-user.json'
];

export const ACCREDITED_PROVENANCES = new Set([
  'hypervisor_vm_pinned',
  'cloud_dedicated_host',
  'bare_metal_offline',
  'cgroups_v2_systemd'
]);

export const ACCREDITED_TYPES = new Set([
  'dedicated_host',
  'dedicated_vm',
  'exclusive_container'
]);

export const REQUIRED_TOP_LEVEL_KEYS = [
  'schema_version',
  'executor_id',
  'timestamp_utc',
  'status',
  'status_reason',
  'os_info',
  'toolchain',
  'git',
  'dist_hashes',
  'resource_reservation',
  'predeclared_interference_limits',
  'telemetry_window'
];

export const REQUIRED_SAMPLE_FIELDS = [
  'started_at',
  'finished_at',
  'cpu_percent',
  'available_mb',
  'committed_bytes',
  'commit_limit_bytes',
  'pages_input_per_sec',
  'pages_output_per_sec',
  'disk_queue',
  'groups'
];

export const REQUIRED_GROUP_CATEGORIES = ['node', 'chromium', 'observer', 'other'];

export const VALID_SWAP_POLICIES = new Set([
  'disabled',
  'fixed_managed',
  'host_managed',
  'swap_on_zram',
  'swapfile_permitted'
]);

export const ALLOWED_TOP_LEVEL_KEYS = new Set([
  ...REQUIRED_TOP_LEVEL_KEYS,
  '$schema'
]);

export const ALLOWED_OS_INFO_KEYS = new Set([
  'name',
  'release',
  'build',
  'arch'
]);

export const ALLOWED_TOOLCHAIN_KEYS = new Set([
  'node_version',
  'pnpm_version',
  'chromium_version'
]);

export const ALLOWED_GIT_KEYS = new Set([
  'commit_sha',
  'branch_name',
  'clean_working_tree',
  'allowed_untracked_or_modified',
  'dirty_files',
  'modified_files'
]);

export const ALLOWED_DIST_HASHES_KEYS = new Set([
  'packages/mcp/dist/server.js',
  'packages/playwright-adapter/dist/index.js',
  'packages/knowledge/dist/index.js',
  'packages/shared/dist/index.js'
]);

export const ALLOWED_RESOURCE_RESERVATION_KEYS = new Set([
  'provenance',
  'evidence_doc',
  'type',
  'allocated_cores',
  'allocated_ram_mb',
  'swap_policy',
  'accredited'
]);

export const ALLOWED_INTERFERENCE_LIMITS_KEYS = new Set([
  'max_external_cpu_percent',
  'max_disk_queue',
  'max_pages_input_per_sec',
  'min_available_ram_mb'
]);

export const ALLOWED_TELEMETRY_WINDOW_KEYS = new Set([
  'duration_ms',
  'interval_ms',
  'max_gap_ms',
  'start_time',
  'end_time',
  'sample_count',
  'cpu_stats',
  'mem_stats',
  'page_faults',
  'samples'
]);

export const ALLOWED_CPU_STATS_KEYS = new Set(['min', 'max', 'mean', 'p95']);

export const ALLOWED_MEM_STATS_KEYS = new Set([
  'min_available_mb',
  'max_available_mb',
  'mean_available_mb',
  'committed_bytes_mean',
  'commit_limit_bytes'
]);

export const ALLOWED_PAGE_FAULTS_KEYS = new Set([
  'max_pages_input_per_sec',
  'mean_pages_input_per_sec',
  'max_pages_output_per_sec'
]);

export const ALLOWED_SAMPLE_KEYS = new Set(REQUIRED_SAMPLE_FIELDS);

export const ALLOWED_GROUP_KEYS = new Set([
  'category',
  'count',
  'cpu_percent_logical_capacity',
  'working_set_private_bytes',
  'page_faults_per_sec'
]);


/**
 * Validates a preflight manifest object against the R7 contract.
 *
 * @param {any} manifest - The manifest object to validate
 * @param {object} [options] - Optional verification settings
 * @param {string} [options.expectedCommitSha] - Expected git commit SHA (40 hex)
 * @param {object} [options.expectedDistHashes] - Override expected dist hashes
 * @param {string} [options.expectedBranch] - Expected branch (default: feat/qap-vnext-architecture)
 * @param {string|RegExp} [options.expectedNodeVersion] - Expected Node version pattern
 * @param {string|RegExp} [options.expectedPnpmVersion] - Expected pnpm version pattern
 * @param {string} [options.expectedChromiumVersion] - Expected Chromium version
 * @param {number} [options.minDurationMs] - Minimum continuous telemetry duration (default: 60000)
 * @param {number} [options.maxGapMs] - Maximum allowed gap between samples (default: 5000)
 * @param {number} [options.maxQueryMs] - Maximum allowed query duration (default: 5000)
 * @param {string[]} [options.dirtyFiles] - Explicit list of modified/untracked files
 * @param {boolean} [options.auditorApproval] - Independent auditor verification gate
 * @param {boolean} [options.requireAccreditation] - Whether reservation accreditation is mandatory
 * @returns {object} Validation result
 */
export function validatePreflightManifest(manifest, options = {}) {
  const errors = [];
  const warnings = [];
  const reasons = [];

  const details = {
    schema_valid: true,
    git_valid: true,
    toolchain_valid: true,
    dist_hashes_valid: true,
    reservation_accredited: false,
    telemetry_valid: true,
    telemetry_duration_ms: 0,
    max_observed_gap_ms: 0
  };

  // 1. Guard against non-object, null, or array inputs
  if (manifest === null || manifest === undefined || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return {
      valid: false,
      validador_status: 'VALIDADOR_FAIL',
      executor_status: 'EJECUTOR_NO_APTO',
      reasons: ['Entrada inválida: el manifiesto debe ser un objeto no nulo'],
      errors: ['Manifest is null, undefined, or not a JSON object'],
      warnings: [],
      details: {
        schema_valid: false,
        git_valid: false,
        toolchain_valid: false,
        dist_hashes_valid: false,
        reservation_accredited: false,
        telemetry_valid: false,
        telemetry_duration_ms: 0,
        max_observed_gap_ms: 0
      }
    };
  }

  // 2a. Check additionalProperties: false on root
  for (const key of Object.keys(manifest)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      details.schema_valid = false;
      errors.push(`Additional property not allowed at root: '${key}'`);
    }
  }

  // 2b. Check all required top-level keys (no PASS by omission)
  let missingRequiredTopLevel = false;
  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (manifest[key] === undefined || manifest[key] === null) {
      details.schema_valid = false;
      missingRequiredTopLevel = true;
      errors.push(`Missing required top-level field: '${key}'`);
    } else if (typeof manifest[key] === 'string' && manifest[key].trim() === '') {
      details.schema_valid = false;
      missingRequiredTopLevel = true;
      errors.push(`Required top-level field '${key}' cannot be an empty string`);
    }
  }

  // If top-level keys are missing, stop deeper parsing that would throw null dereferences
  if (missingRequiredTopLevel) {
    return {
      valid: false,
      validador_status: 'VALIDADOR_FAIL',
      executor_status: 'EJECUTOR_NO_APTO',
      reasons: ['Error de esquema: campos obligatorios faltantes o vacíos en el manifiesto'],
      errors,
      warnings,
      details
    };
  }

  // 3. Validate schema_version
  if (typeof manifest.schema_version !== 'string' || !/^1\.[0-9]+\.[0-9]+$/.test(manifest.schema_version)) {
    details.schema_valid = false;
    errors.push(`Invalid schema_version '${manifest.schema_version}': must match SemVer format 1.x.x`);
  }

  // 4. Validate executor_id
  if (typeof manifest.executor_id !== 'string' || !/^[a-zA-Z0-9_-]{3,64}$/.test(manifest.executor_id)) {
    details.schema_valid = false;
    errors.push(`Invalid executor_id '${manifest.executor_id}': must be 3-64 alphanumeric characters, underscores, or dashes`);
  }

  // 5. Validate timestamp_utc
  if (typeof manifest.timestamp_utc !== 'string' || isNaN(Date.parse(manifest.timestamp_utc))) {
    details.schema_valid = false;
    errors.push(`Invalid timestamp_utc '${manifest.timestamp_utc}': must be valid ISO-8601 date-time string`);
  }

  // 6. Validate status & status_reason
  const validStatuses = ['VALIDADOR_PASS', 'EJECUTOR_APTO', 'EJECUTOR_NO_APTO'];
  if (!validStatuses.includes(manifest.status)) {
    details.schema_valid = false;
    errors.push(`Invalid status '${manifest.status}': must be one of ${validStatuses.join(', ')}`);
  }
  if (typeof manifest.status_reason !== 'string' || manifest.status_reason.trim().length < 5) {
    details.schema_valid = false;
    errors.push('Field status_reason must be a non-empty string of at least 5 characters');
  }

  // 7. Validate os_info
  if (typeof manifest.os_info !== 'object' || Array.isArray(manifest.os_info)) {
    details.schema_valid = false;
    errors.push('Field os_info must be an object');
  } else {
    for (const osKey of Object.keys(manifest.os_info)) {
      if (!ALLOWED_OS_INFO_KEYS.has(osKey)) {
        details.schema_valid = false;
        errors.push(`Additional property not allowed in os_info: '${osKey}'`);
      }
    }
    for (const osKey of ['name', 'release', 'build', 'arch']) {
      if (!manifest.os_info[osKey] || typeof manifest.os_info[osKey] !== 'string' || manifest.os_info[osKey].trim() === '') {
        details.schema_valid = false;
        errors.push(`Missing or empty required os_info field: '${osKey}'`);
      }
    }
    if (manifest.os_info.arch && !['x64', 'arm64'].includes(manifest.os_info.arch)) {
      details.schema_valid = false;
      errors.push(`Invalid os_info.arch '${manifest.os_info.arch}': must be 'x64' or 'arm64'`);
    }
  }

  // 8. Validate toolchain (Section 4.3 canonical parity)
  if (typeof manifest.toolchain !== 'object' || Array.isArray(manifest.toolchain)) {
    details.schema_valid = false;
    details.toolchain_valid = false;
    errors.push('Field toolchain must be an object');
  } else {
    for (const tcKey of Object.keys(manifest.toolchain)) {
      if (!ALLOWED_TOOLCHAIN_KEYS.has(tcKey)) {
        details.schema_valid = false;
        errors.push(`Additional property not allowed in toolchain: '${tcKey}'`);
      }
    }
    const { node_version, pnpm_version, chromium_version } = manifest.toolchain;

    // Node version check
    if (!node_version || typeof node_version !== 'string') {
      details.toolchain_valid = false;
      errors.push('Missing required toolchain.node_version');
    } else {
      const nodeTarget = options.expectedNodeVersion || CANONICAL_TOOLCHAIN.node_version;
      const matchesNode = typeof nodeTarget === 'string'
        ? node_version === nodeTarget
        : nodeTarget instanceof RegExp
          ? nodeTarget.test(node_version)
          : node_version === String(nodeTarget);
      if (!matchesNode) {
        details.toolchain_valid = false;
        errors.push(`Toolchain node_version '${node_version}' does not match required baseline (expected ${nodeTarget})`);
      }
    }

    // pnpm version check
    if (!pnpm_version || typeof pnpm_version !== 'string') {
      details.toolchain_valid = false;
      errors.push('Missing required toolchain.pnpm_version');
    } else {
      const pnpmTarget = options.expectedPnpmVersion || CANONICAL_TOOLCHAIN.pnpm_version;
      const matchesPnpm = typeof pnpmTarget === 'string'
        ? pnpm_version === pnpmTarget
        : pnpmTarget instanceof RegExp
          ? pnpmTarget.test(pnpm_version)
          : pnpm_version === String(pnpmTarget);
      if (!matchesPnpm) {
        details.toolchain_valid = false;
        errors.push(`Toolchain pnpm_version '${pnpm_version}' does not match required baseline (expected ${pnpmTarget})`);
      }
    }

    // Chromium version check (mandatory by default)
    if (!chromium_version || typeof chromium_version !== 'string' || chromium_version.trim() === '') {
      details.toolchain_valid = false;
      errors.push('Missing or empty toolchain.chromium_version');
    } else {
      const chromiumTarget = options.expectedChromiumVersion || CANONICAL_TOOLCHAIN.chromium_version;
      if (chromium_version !== chromiumTarget) {
        details.toolchain_valid = false;
        errors.push(`Toolchain chromium_version '${chromium_version}' does not match required baseline (expected '${chromiumTarget}')`);
      }
    }
  }

  // 9. Validate git (Immutable whitelist, no executor bypass)
  if (typeof manifest.git !== 'object' || Array.isArray(manifest.git)) {
    details.schema_valid = false;
    details.git_valid = false;
    errors.push('Field git must be an object');
  } else {
    for (const gk of Object.keys(manifest.git)) {
      if (!ALLOWED_GIT_KEYS.has(gk)) {
        details.schema_valid = false;
        errors.push(`Additional property not allowed in git: '${gk}'`);
      }
    }
    const { commit_sha, branch_name, clean_working_tree } = manifest.git;

    // Commit SHA (40-char hex)
    if (!commit_sha || typeof commit_sha !== 'string') {
      details.git_valid = false;
      errors.push('Missing required git.commit_sha');
    } else if (!/^[a-fA-F0-9]{40}$/.test(commit_sha)) {
      details.git_valid = false;
      errors.push(`Invalid git.commit_sha '${commit_sha}': must be exactly 40 hexadecimal characters`);
    } else if (options.expectedCommitSha && commit_sha.toLowerCase() !== options.expectedCommitSha.toLowerCase()) {
      details.git_valid = false;
      errors.push(`Git commit_sha '${commit_sha}' does not match expected '${options.expectedCommitSha}'`);
    }

    // Branch name
    const targetBranch = options.expectedBranch || AUTHORIZED_BRANCH;
    if (!branch_name || typeof branch_name !== 'string') {
      details.git_valid = false;
      errors.push('Missing required git.branch_name');
    } else if (branch_name !== targetBranch) {
      details.git_valid = false;
      errors.push(`Unauthorized git branch '${branch_name}': must be '${targetBranch}'`);
    }

    // Clean working tree and strict immutable whitelist enforcement
    if (typeof clean_working_tree !== 'boolean') {
      details.git_valid = false;
      errors.push('Field git.clean_working_tree must be a boolean');
    } else {
      const dirtyFiles = manifest.git.dirty_files || manifest.git.modified_files || options.dirtyFiles;
      const hasDirtyFiles = Array.isArray(dirtyFiles) && dirtyFiles.length > 0;

      if (clean_working_tree === true) {
        if (hasDirtyFiles) {
          details.git_valid = false;
          errors.push(`Contradiction: git.clean_working_tree is true but dirty/modified files are present: ${dirtyFiles.join(', ')}`);
        }
      } else {
        // clean_working_tree === false
        // ONLY the normative immutable whitelist is permitted. Executor cannot add paths.
        const allowedList = new Set(ALLOWED_GIT_EXCEPTIONS);
        if (hasDirtyFiles) {
          const unapproved = dirtyFiles.filter(f => !allowedList.has(f));
          if (unapproved.length > 0) {
            details.git_valid = false;
            errors.push(`Working tree is dirty with unapproved modified/untracked files: ${unapproved.join(', ')}`);
          }
        } else {
          details.git_valid = false;
          errors.push('Working tree is not clean: clean_working_tree is false with no approved exceptions');
        }
      }
    }
  }

  // 10. Validate dist_hashes
  if (typeof manifest.dist_hashes !== 'object' || Array.isArray(manifest.dist_hashes)) {
    details.schema_valid = false;
    details.dist_hashes_valid = false;
    errors.push('Field dist_hashes must be an object');
  } else {
    for (const dhKey of Object.keys(manifest.dist_hashes)) {
      if (!ALLOWED_DIST_HASHES_KEYS.has(dhKey)) {
        details.schema_valid = false;
        errors.push(`Additional property not allowed in dist_hashes: '${dhKey}'`);
      }
    }
    const expectedHashes = options.expectedDistHashes || CANONICAL_DIST_HASHES;
    const requiredDistKeys = [
      'packages/mcp/dist/server.js',
      'packages/playwright-adapter/dist/index.js',
      'packages/knowledge/dist/index.js',
      'packages/shared/dist/index.js'
    ];

    for (const distKey of requiredDistKeys) {
      const actualHash = manifest.dist_hashes[distKey];
      if (!actualHash || typeof actualHash !== 'string') {
        details.dist_hashes_valid = false;
        errors.push(`Missing required dist hash for '${distKey}'`);
      } else if (!/^[a-fA-F0-9]{64}$/.test(actualHash)) {
        details.dist_hashes_valid = false;
        errors.push(`Invalid SHA-256 hash format for '${distKey}': must be exactly 64 hexadecimal characters`);
      } else if (expectedHashes[distKey] && actualHash.toLowerCase() !== expectedHashes[distKey].toLowerCase()) {
        details.dist_hashes_valid = false;
        errors.push(`Hash mismatch for '${distKey}': actual '${actualHash}' does not match expected '${expectedHashes[distKey]}'`);
      }
    }
  }

  // 11. Validate predeclared_interference_limits
  let effectiveLimits = { ...NORMATIVE_INTERFERENCE_LIMITS };
  if (typeof manifest.predeclared_interference_limits !== 'object' || Array.isArray(manifest.predeclared_interference_limits)) {
    details.schema_valid = false;
    errors.push('Field predeclared_interference_limits must be an object');
  } else {
    for (const lk of Object.keys(manifest.predeclared_interference_limits)) {
      if (!ALLOWED_INTERFERENCE_LIMITS_KEYS.has(lk)) {
        details.schema_valid = false;
        errors.push(`Additional property not allowed in predeclared_interference_limits: '${lk}'`);
      }
    }
    const limits = manifest.predeclared_interference_limits;
    const requiredLimits = ['max_external_cpu_percent', 'max_disk_queue', 'max_pages_input_per_sec', 'min_available_ram_mb'];
    for (const lk of requiredLimits) {
      if (limits[lk] === undefined || limits[lk] === null || typeof limits[lk] !== 'number' || isNaN(limits[lk])) {
        details.schema_valid = false;
        errors.push(`Missing or invalid numeric field in predeclared_interference_limits: '${lk}'`);
      }
    }

    if (details.schema_valid) {
      // Manifest cannot loosen normative bounds
      effectiveLimits = {
        max_external_cpu_percent: Math.min(limits.max_external_cpu_percent, NORMATIVE_INTERFERENCE_LIMITS.max_external_cpu_percent),
        max_disk_queue: Math.min(limits.max_disk_queue, NORMATIVE_INTERFERENCE_LIMITS.max_disk_queue),
        max_pages_input_per_sec: Math.min(limits.max_pages_input_per_sec, NORMATIVE_INTERFERENCE_LIMITS.max_pages_input_per_sec),
        min_available_ram_mb: Math.max(limits.min_available_ram_mb, NORMATIVE_INTERFERENCE_LIMITS.min_available_ram_mb)
      };
    }
  }

  // 12. Validate resource_reservation (Independent evidence verification & auditor decision gate)
  let computedEvidenceDocSha256 = null;
  let localEvidenceDocValid = false;

  if (typeof manifest.resource_reservation !== 'object' || Array.isArray(manifest.resource_reservation)) {
    details.schema_valid = false;
    errors.push('Field resource_reservation must be an object');
  } else {
    const res = manifest.resource_reservation;
    for (const rk of Object.keys(res)) {
      if (!ALLOWED_RESOURCE_RESERVATION_KEYS.has(rk)) {
        details.schema_valid = false;
        errors.push(`Additional property not allowed in resource_reservation: '${rk}'`);
      }
    }

    const requiredResKeys = ['provenance', 'evidence_doc', 'type', 'allocated_cores', 'allocated_ram_mb', 'swap_policy', 'accredited'];
    for (const rk of requiredResKeys) {
      if (res[rk] === undefined) {
        details.schema_valid = false;
        errors.push(`Missing required resource_reservation field: '${rk}'`);
      }
    }

    if (typeof res.swap_policy !== 'string' || !VALID_SWAP_POLICIES.has(res.swap_policy)) {
      details.schema_valid = false;
      errors.push(`Invalid resource_reservation.swap_policy: must be one of ${Array.from(VALID_SWAP_POLICIES).join(', ')}`);
    }

    if (typeof res.accredited !== 'boolean') {
      details.schema_valid = false;
      errors.push('Field resource_reservation.accredited must be a boolean');
    }

    if (typeof res.allocated_cores !== 'number' || !Number.isInteger(res.allocated_cores) || res.allocated_cores < 1) {
      details.schema_valid = false;
      errors.push('Field resource_reservation.allocated_cores must be an integer >= 1');
    }

    if (typeof res.allocated_ram_mb !== 'number' || !Number.isInteger(res.allocated_ram_mb) || res.allocated_ram_mb < 1024) {
      details.schema_valid = false;
      errors.push('Field resource_reservation.allocated_ram_mb must be an integer >= 1024');
    }

    // Evaluate accreditation and evidence document
    if (res.accredited === true) {
      if (typeof res.evidence_doc !== 'string' || res.evidence_doc.trim() === '') {
        details.reservation_accredited = false;
        errors.push('Invalid reservation accreditation: accredited is true but evidence_doc is missing or empty');
      }
      if (!ACCREDITED_PROVENANCES.has(res.provenance)) {
        details.reservation_accredited = false;
        errors.push(`Invalid reservation provenance '${res.provenance}': accredited reservation must be one of ${Array.from(ACCREDITED_PROVENANCES).join(', ')}`);
      }
      if (!ACCREDITED_TYPES.has(res.type)) {
        details.reservation_accredited = false;
        errors.push(`Invalid reservation type '${res.type}': accredited reservation must be one of ${Array.from(ACCREDITED_TYPES).join(', ')}`);
      }

      // Check evidence document physically: remote URLs are strictly prohibited and unaccredited
      if (typeof res.evidence_doc === 'string' && res.evidence_doc.trim() !== '') {
        if (/^https?:\/\//i.test(res.evidence_doc)) {
          details.reservation_accredited = false;
          errors.push(`Invalid reservation accreditation: remote HTTP/HTTPS URLs ('${res.evidence_doc}') are unverifiable and strictly prohibited for accredited reservation`);
        } else {
          let localDocPath = res.evidence_doc;
          if (localDocPath.startsWith('file://')) {
            try {
              localDocPath = fileURLToPath(localDocPath);
            } catch {
              localDocPath = localDocPath.replace(/^file:\/\//, '');
            }
          }
          if (!path.isAbsolute(localDocPath)) {
            localDocPath = path.resolve(process.cwd(), localDocPath);
          }

          if (!fs.existsSync(localDocPath)) {
            details.reservation_accredited = false;
            errors.push(`Evidence document does not exist or is inaccessible: '${res.evidence_doc}'`);
          } else {
            try {
              const stat = fs.statSync(localDocPath);
              if (!stat.isFile()) {
                details.reservation_accredited = false;
                errors.push(`Evidence document is not a regular file: '${res.evidence_doc}'`);
              } else if (stat.size === 0) {
                details.reservation_accredited = false;
                errors.push(`Evidence document is empty (0 bytes): '${res.evidence_doc}'`);
              } else {
                let docPayload = null;
                try {
                  const docRaw = fs.readFileSync(localDocPath, 'utf-8');
                  docPayload = JSON.parse(docRaw);
                } catch (err) {
                  details.reservation_accredited = false;
                  errors.push(`Evidence document '${res.evidence_doc}' is not valid JSON: ${err.message}`);
                }

                if (docPayload && typeof docPayload === 'object' && !Array.isArray(docPayload)) {
                  let docValid = true;
                  const allowedDocKeys = new Set([
                    'executor_id',
                    'provenance',
                    'type',
                    'allocated_cores',
                    'allocated_ram_mb',
                    'exclusive_reservation',
                    'provider_metadata'
                  ]);
                  for (const dk of Object.keys(docPayload)) {
                    if (!allowedDocKeys.has(dk)) {
                      docValid = false;
                      details.reservation_accredited = false;
                      errors.push(`Additional property not allowed in evidence document: '${dk}'`);
                    }
                  }
                  if (docPayload.executor_id !== manifest.executor_id) {
                    docValid = false;
                    details.reservation_accredited = false;
                    errors.push(`Evidence document executor_id ('${docPayload.executor_id}') does not match manifest executor_id ('${manifest.executor_id}')`);
                  }
                  if (docPayload.provenance !== res.provenance) {
                    docValid = false;
                    details.reservation_accredited = false;
                    errors.push(`Evidence document provenance ('${docPayload.provenance}') does not match manifest ('${res.provenance}')`);
                  }
                  if (docPayload.type !== res.type) {
                    docValid = false;
                    details.reservation_accredited = false;
                    errors.push(`Evidence document type ('${docPayload.type}') does not match manifest ('${res.type}')`);
                  }
                  if (docPayload.allocated_cores !== res.allocated_cores) {
                    docValid = false;
                    details.reservation_accredited = false;
                    errors.push(`Evidence document allocated_cores (${docPayload.allocated_cores}) does not match manifest (${res.allocated_cores})`);
                  }
                  if (docPayload.allocated_ram_mb !== res.allocated_ram_mb) {
                    docValid = false;
                    details.reservation_accredited = false;
                    errors.push(`Evidence document allocated_ram_mb (${docPayload.allocated_ram_mb}) does not match manifest (${res.allocated_ram_mb})`);
                  }
                  if (docPayload.exclusive_reservation !== true) {
                    docValid = false;
                    details.reservation_accredited = false;
                    errors.push('Evidence document exclusive_reservation must be true');
                  }

                  if (docValid) {
                    computedEvidenceDocSha256 = crypto.createHash('sha256').update(fs.readFileSync(localDocPath)).digest('hex').toLowerCase();
                    localEvidenceDocValid = true;
                  }
                } else if (docPayload !== null) {
                  details.reservation_accredited = false;
                  errors.push('Evidence document must be a JSON object');
                }
              }
            } catch (err) {
              details.reservation_accredited = false;
              errors.push(`Evidence document cannot be read: '${res.evidence_doc}' (${err.message})`);
            }
          }
        }
      }

      // Check external auditable decision (sine qua non gate for accreditation)
      let auditorDecision = null;
      if (typeof options.auditorDecision === 'string') {
        try {
          const decPath = path.isAbsolute(options.auditorDecision)
            ? options.auditorDecision
            : path.resolve(process.cwd(), options.auditorDecision);
          if (fs.existsSync(decPath)) {
            auditorDecision = JSON.parse(fs.readFileSync(decPath, 'utf-8'));
          } else {
            details.reservation_accredited = false;
            errors.push(`Auditor decision file does not exist at '${options.auditorDecision}'`);
          }
        } catch (err) {
          details.reservation_accredited = false;
          errors.push(`Failed to read/parse auditor decision file '${options.auditorDecision}': ${err.message}`);
        }
      } else if (typeof options.auditorDecision === 'object' && options.auditorDecision !== null && !Array.isArray(options.auditorDecision)) {
        auditorDecision = options.auditorDecision;
      }

      if (auditorDecision) {
        let decValid = true;
        const requiredDecKeys = [
          'decision',
          'auditor_id',
          'executor_id',
          'approved_commit_sha',
          'evidence_doc_sha256',
          'allocated_cores',
          'allocated_ram_mb',
          'issued_at_utc',
          'expires_at_utc'
        ];
        const allowedDecKeys = new Set(requiredDecKeys);
        for (const dk of Object.keys(auditorDecision)) {
          if (!allowedDecKeys.has(dk)) {
            decValid = false;
            errors.push(`Additional property not allowed in auditorDecision: '${dk}'`);
          }
        }
        for (const rdk of requiredDecKeys) {
          if (auditorDecision[rdk] === undefined || auditorDecision[rdk] === null) {
            decValid = false;
            errors.push(`Missing required field in auditorDecision: '${rdk}'`);
          }
        }

        if (auditorDecision.decision !== 'APPROVED') {
          decValid = false;
          errors.push(`Auditor decision is '${auditorDecision.decision}', must be 'APPROVED'`);
        }
        if (typeof auditorDecision.auditor_id !== 'string' || auditorDecision.auditor_id.trim().length < 3) {
          decValid = false;
          errors.push('Auditor decision auditor_id must be a non-empty string');
        }
        if (auditorDecision.executor_id !== manifest.executor_id) {
          decValid = false;
          errors.push(`Auditor decision executor_id ('${auditorDecision.executor_id}') does not match manifest ('${manifest.executor_id}')`);
        }
        if (typeof auditorDecision.approved_commit_sha !== 'string' || !/^[a-fA-F0-9]{40}$/.test(auditorDecision.approved_commit_sha)) {
          decValid = false;
          errors.push(`Auditor decision approved_commit_sha is invalid 40-char hex: '${auditorDecision.approved_commit_sha}'`);
        } else {
          if (manifest.git?.commit_sha && auditorDecision.approved_commit_sha.toLowerCase() !== manifest.git.commit_sha.toLowerCase()) {
            decValid = false;
            errors.push(`Auditor decision approved_commit_sha ('${auditorDecision.approved_commit_sha}') does not match manifest commit_sha ('${manifest.git?.commit_sha}')`);
          }
          if (options.expectedCommitSha && auditorDecision.approved_commit_sha.toLowerCase() !== options.expectedCommitSha.toLowerCase()) {
            decValid = false;
            errors.push(`Auditor decision approved_commit_sha does not match options.expectedCommitSha ('${options.expectedCommitSha}')`);
          }
        }

        if (!options.expectedCommitSha) {
          decValid = false;
          errors.push('Expected commit SHA (options.expectedCommitSha) is required for verified auditor decision');
        }

        if (!computedEvidenceDocSha256 || auditorDecision.evidence_doc_sha256?.toLowerCase() !== computedEvidenceDocSha256) {
          decValid = false;
          errors.push(`Auditor decision evidence_doc_sha256 ('${auditorDecision.evidence_doc_sha256}') does not match computed digest ('${computedEvidenceDocSha256 ?? 'none'}')`);
        }

        if (typeof auditorDecision.allocated_cores === 'number' && typeof res.allocated_cores === 'number') {
          if (auditorDecision.allocated_cores < res.allocated_cores) {
            decValid = false;
            errors.push(`Auditor decision allocated_cores (${auditorDecision.allocated_cores}) is less than manifest (${res.allocated_cores})`);
          }
        }
        if (typeof auditorDecision.allocated_ram_mb === 'number' && typeof res.allocated_ram_mb === 'number') {
          if (auditorDecision.allocated_ram_mb < res.allocated_ram_mb) {
            decValid = false;
            errors.push(`Auditor decision allocated_ram_mb (${auditorDecision.allocated_ram_mb}) is less than manifest (${res.allocated_ram_mb})`);
          }
        }

        const issuedMs = Date.parse(auditorDecision.issued_at_utc);
        const expiresMs = Date.parse(auditorDecision.expires_at_utc);
        const winStartMs = Date.parse(manifest.telemetry_window?.start_time);
        const winEndMs = Date.parse(manifest.telemetry_window?.end_time);

        if (isNaN(issuedMs) || isNaN(expiresMs)) {
          decValid = false;
          errors.push('Auditor decision temporal bounds are invalid ISO-8601 strings');
        } else {
          if (issuedMs > expiresMs) {
            decValid = false;
            errors.push('Auditor decision issued_at_utc is after expires_at_utc');
          }
          if (!isNaN(winStartMs) && issuedMs > winStartMs) {
            decValid = false;
            errors.push(`Auditor decision was issued after telemetry window start: ${auditorDecision.issued_at_utc} > ${manifest.telemetry_window?.start_time}`);
          }
          if (!isNaN(winEndMs) && winEndMs > expiresMs) {
            decValid = false;
            errors.push(`Auditor decision expired before telemetry window end: ${auditorDecision.expires_at_utc} < ${manifest.telemetry_window?.end_time}`);
          }
        }

        if (decValid && localEvidenceDocValid && ACCREDITED_PROVENANCES.has(res.provenance) && ACCREDITED_TYPES.has(res.type)) {
          details.reservation_accredited = true;
        } else {
          details.reservation_accredited = false;
        }
      } else {
        // No auditable decision provided: bare boolean flag or unverified approval strictly prohibited
        details.reservation_accredited = false;
      }
    } else {
      // Not accredited
      details.reservation_accredited = false;
      if (res.evidence_doc !== null && typeof res.evidence_doc !== 'string') {
        details.schema_valid = false;
        errors.push('Field resource_reservation.evidence_doc must be a string or null');
      }
    }
  }

  // 13. Validate telemetry_window & samples (No PASS by omission, sample count >= 30, metrics mandatory)
  // 13. Validate telemetry_window & samples (Draft-07 strict, mathematical consistency, external CPU budget)
  if (typeof manifest.telemetry_window !== 'object' || Array.isArray(manifest.telemetry_window)) {
    details.schema_valid = false;
    details.telemetry_valid = false;
    errors.push('Field telemetry_window must be an object');
  } else {
    const win = manifest.telemetry_window;
    for (const wk of Object.keys(win)) {
      if (!ALLOWED_TELEMETRY_WINDOW_KEYS.has(wk)) {
        details.schema_valid = false;
        errors.push(`Additional property not allowed in telemetry_window: '${wk}'`);
      }
    }

    const requiredWinKeys = [
      'duration_ms',
      'interval_ms',
      'max_gap_ms',
      'start_time',
      'end_time',
      'sample_count',
      'cpu_stats',
      'mem_stats',
      'page_faults',
      'samples'
    ];

    for (const wk of requiredWinKeys) {
      if (win[wk] === undefined || win[wk] === null) {
        details.schema_valid = false;
        errors.push(`Missing required telemetry_window field: '${wk}'`);
      }
    }

    const minDuration = options.minDurationMs || 60000;
    if (typeof win.duration_ms !== 'number' || isNaN(win.duration_ms) || win.duration_ms < minDuration) {
      details.telemetry_valid = false;
      errors.push(`Telemetry window duration (${win.duration_ms}ms) is less than required minimum of ${minDuration}ms`);
    }

    const maxAllowedGap = options.maxGapMs || 5000;
    if (typeof win.max_gap_ms !== 'number' || isNaN(win.max_gap_ms) || win.max_gap_ms > maxAllowedGap || win.max_gap_ms < 0) {
      details.telemetry_valid = false;
      errors.push(`Field telemetry_window.max_gap_ms (${win.max_gap_ms}) exceeds maximum tolerable gap of ${maxAllowedGap}ms`);
    }

    // Interval ms validation: [100, 10000]
    if (typeof win.interval_ms !== 'number' || isNaN(win.interval_ms) || win.interval_ms < 100 || win.interval_ms > 10000) {
      details.schema_valid = false;
      details.telemetry_valid = false;
      errors.push(`Field telemetry_window.interval_ms (${win.interval_ms}) must be a number between 100 and 10000`);
    }

    // Sample count validation: integer >= 30
    if (typeof win.sample_count !== 'number' || !Number.isInteger(win.sample_count) || win.sample_count < 30) {
      details.schema_valid = false;
      details.telemetry_valid = false;
      errors.push(`Field telemetry_window.sample_count must be an integer >= 30 (received ${win.sample_count})`);
    }

    // Timestamps validation: valid ISO-8601 strings
    const winStartMs = Date.parse(win.start_time);
    const winEndMs = Date.parse(win.end_time);
    if (typeof win.start_time !== 'string' || isNaN(winStartMs)) {
      details.schema_valid = false;
      details.telemetry_valid = false;
      errors.push(`Invalid telemetry_window.start_time '${win.start_time}': must be valid ISO-8601 date-time string`);
    }
    if (typeof win.end_time !== 'string' || isNaN(winEndMs)) {
      details.schema_valid = false;
      details.telemetry_valid = false;
      errors.push(`Invalid telemetry_window.end_time '${win.end_time}': must be valid ISO-8601 date-time string`);
    }
    if (!isNaN(winStartMs) && !isNaN(winEndMs)) {
      if (winStartMs >= winEndMs) {
        details.telemetry_valid = false;
        errors.push(`Telemetry start_time (${win.start_time}) must be earlier than end_time (${win.end_time})`);
      }
      const calculatedDuration = winEndMs - winStartMs;
      if (typeof win.duration_ms === 'number' && Math.abs(win.duration_ms - calculatedDuration) > 100) {
        details.telemetry_valid = false;
        errors.push(`Telemetry duration_ms mismatch: declared ${win.duration_ms}ms, but span from start_time to end_time is ${calculatedDuration}ms`);
      }
    }

    // Validate cpu_stats
    if (!win.cpu_stats || typeof win.cpu_stats !== 'object' || Array.isArray(win.cpu_stats)) {
      details.schema_valid = false;
      errors.push('Field telemetry_window.cpu_stats must be an object');
    } else {
      for (const ck of Object.keys(win.cpu_stats)) {
        if (!ALLOWED_CPU_STATS_KEYS.has(ck)) {
          details.schema_valid = false;
          errors.push(`Additional property not allowed in cpu_stats: '${ck}'`);
        }
      }
      for (const req of ['min', 'max', 'mean']) {
        if (win.cpu_stats[req] === undefined || win.cpu_stats[req] === null || typeof win.cpu_stats[req] !== 'number' || isNaN(win.cpu_stats[req]) || win.cpu_stats[req] < 0 || win.cpu_stats[req] > 100) {
          details.schema_valid = false;
          errors.push(`Missing or invalid numeric field in cpu_stats: '${req}' (must be number in [0, 100])`);
        }
      }
      if (win.cpu_stats.p95 !== undefined && (typeof win.cpu_stats.p95 !== 'number' || isNaN(win.cpu_stats.p95) || win.cpu_stats.p95 < 0 || win.cpu_stats.p95 > 100)) {
        details.schema_valid = false;
        errors.push('Field cpu_stats.p95 must be a number in [0, 100]');
      }
    }

    // Validate mem_stats
    if (!win.mem_stats || typeof win.mem_stats !== 'object' || Array.isArray(win.mem_stats)) {
      details.schema_valid = false;
      errors.push('Field telemetry_window.mem_stats must be an object');
    } else {
      for (const mk of Object.keys(win.mem_stats)) {
        if (!ALLOWED_MEM_STATS_KEYS.has(mk)) {
          details.schema_valid = false;
          errors.push(`Additional property not allowed in mem_stats: '${mk}'`);
        }
      }
      const reqMem = ['min_available_mb', 'max_available_mb', 'mean_available_mb', 'committed_bytes_mean', 'commit_limit_bytes'];
      for (const req of reqMem) {
        if (win.mem_stats[req] === undefined || win.mem_stats[req] === null || typeof win.mem_stats[req] !== 'number' || isNaN(win.mem_stats[req]) || win.mem_stats[req] < 0) {
          details.schema_valid = false;
          errors.push(`Missing or invalid numeric field in mem_stats: '${req}' (must be number >= 0)`);
        }
      }
    }

    // Validate page_faults
    if (!win.page_faults || typeof win.page_faults !== 'object' || Array.isArray(win.page_faults)) {
      details.schema_valid = false;
      errors.push('Field telemetry_window.page_faults must be an object');
    } else {
      for (const pfk of Object.keys(win.page_faults)) {
        if (!ALLOWED_PAGE_FAULTS_KEYS.has(pfk)) {
          details.schema_valid = false;
          errors.push(`Additional property not allowed in page_faults: '${pfk}'`);
        }
      }
      const reqPf = ['max_pages_input_per_sec', 'mean_pages_input_per_sec', 'max_pages_output_per_sec'];
      for (const req of reqPf) {
        if (win.page_faults[req] === undefined || win.page_faults[req] === null || typeof win.page_faults[req] !== 'number' || isNaN(win.page_faults[req]) || win.page_faults[req] < 0) {
          details.schema_valid = false;
          errors.push(`Missing or invalid numeric field in page_faults: '${req}' (must be number >= 0)`);
        }
      }
    }

    // Validate samples
    if (!Array.isArray(win.samples)) {
      details.schema_valid = false;
      details.telemetry_valid = false;
      errors.push('Field telemetry_window.samples must be an array');
    } else {
      // Mandate minimum sample count >= 30
      if (win.samples.length < 30) {
        details.telemetry_valid = false;
        errors.push(`Telemetry window must contain at least 30 samples (received ${win.samples.length})`);
      }

      if (typeof win.sample_count === 'number' && win.sample_count !== win.samples.length) {
        details.telemetry_valid = false;
        errors.push(`Telemetry sample_count mismatch: declared ${win.sample_count}, but samples array has ${win.samples.length}`);
      }

      if (win.samples.length > 0) {
        let maxObservedGap = 0;
        const maxQueryMs = options.maxQueryMs || 5000;
        let lastValidSample = null;
        let lastValidStartMs = null;
        let lastValidFinishMs = null;
        const maxFutureMs = Date.now() + 60000;

        for (let i = 0; i < win.samples.length; i++) {
          const s = win.samples[i];
          if (!s || typeof s !== 'object' || Array.isArray(s)) {
            details.telemetry_valid = false;
            errors.push(`Sample at index ${i} is null, undefined, or not a valid object`);
            continue;
          }

          // Check additionalProperties: false on sample
          for (const sk of Object.keys(s)) {
            if (!ALLOWED_SAMPLE_KEYS.has(sk)) {
              details.schema_valid = false;
              errors.push(`Additional property not allowed in sample ${i}: '${sk}'`);
            }
          }

          // Validate all 10 required fields per sample
          for (const f of REQUIRED_SAMPLE_FIELDS) {
            if (s[f] === undefined || s[f] === null) {
              details.telemetry_valid = false;
              errors.push(`Sample at index ${i} missing required metric field: '${f}'`);
            }
          }

          // Numeric metrics range validation
          const numericFields = [
            'cpu_percent',
            'available_mb',
            'committed_bytes',
            'commit_limit_bytes',
            'pages_input_per_sec',
            'pages_output_per_sec',
            'disk_queue'
          ];
          for (const nf of numericFields) {
            if (s[nf] !== undefined && s[nf] !== null) {
              if (typeof s[nf] !== 'number' || isNaN(s[nf]) || s[nf] < 0) {
                details.telemetry_valid = false;
                errors.push(`Sample at index ${i} has invalid numeric value for '${nf}': ${s[nf]}`);
              }
            }
          }

          if (typeof s.cpu_percent === 'number' && s.cpu_percent > 100) {
            details.telemetry_valid = false;
            errors.push(`Sample at index ${i} cpu_percent (${s.cpu_percent}%) exceeds maximum limit of 100%`);
          }

          // Process groups validation: exactly 4 unique groups
          if (!Array.isArray(s.groups) || s.groups.length !== 4) {
            details.telemetry_valid = false;
            errors.push(`Sample at index ${i} must contain exactly 4 process groups (received ${s.groups?.length ?? 0})`);
          } else {
            const seenCategories = new Set();
            for (let gi = 0; gi < s.groups.length; gi++) {
              const g = s.groups[gi];
              if (!g || typeof g !== 'object' || Array.isArray(g)) {
                details.telemetry_valid = false;
                errors.push(`Sample ${i} group ${gi} is not an object`);
                continue;
              }
              for (const gk of Object.keys(g)) {
                if (!ALLOWED_GROUP_KEYS.has(gk)) {
                  details.schema_valid = false;
                  errors.push(`Additional property not allowed in sample ${i} group ${gi}: '${gk}'`);
                }
              }
              if (!REQUIRED_GROUP_CATEGORIES.includes(g.category)) {
                details.telemetry_valid = false;
                errors.push(`Sample ${i} group has invalid category '${g.category}'`);
              } else {
                seenCategories.add(g.category);
              }
              if (typeof g.count !== 'number' || !Number.isInteger(g.count) || g.count < 0) {
                details.telemetry_valid = false;
                errors.push(`Sample ${i} group '${g.category}' count must be an integer >= 0 (received ${g.count})`);
              }
              const groupNums = ['cpu_percent_logical_capacity', 'working_set_private_bytes', 'page_faults_per_sec'];
              for (const gn of groupNums) {
                if (g[gn] === undefined || g[gn] === null || typeof g[gn] !== 'number' || isNaN(g[gn]) || g[gn] < 0) {
                  details.telemetry_valid = false;
                  errors.push(`Sample ${i} group '${g.category}' missing or invalid numeric field '${gn}'`);
                }
              }
              if (typeof g.cpu_percent_logical_capacity === 'number' && g.cpu_percent_logical_capacity > 100) {
                details.telemetry_valid = false;
                errors.push(`Sample ${i} group '${g.category}' cpu_percent_logical_capacity exceeds 100%`);
              }
            }
            if (seenCategories.size !== 4) {
              details.telemetry_valid = false;
              errors.push(`Sample at index ${i} does not contain all 4 unique categories: missing ${REQUIRED_GROUP_CATEGORIES.filter(c => !seenCategories.has(c)).join(', ')}`);
            }

            // Group sum consistency against sample.cpu_percent (|diff| <= 0.05%)
            if (typeof s.cpu_percent === 'number') {
              const groupCpuSum = s.groups.reduce((acc, grp) => acc + (grp && typeof grp.cpu_percent_logical_capacity === 'number' ? grp.cpu_percent_logical_capacity : 0), 0);
              if (Math.abs(s.cpu_percent - groupCpuSum) > 0.05) {
                details.telemetry_valid = false;
                errors.push(`Sample ${i} CPU group sum mismatch: groups sum to ${groupCpuSum.toFixed(4)}% but cpu_percent is ${s.cpu_percent}% (difference > 0.05%)`);
              }
            }
          }

          // Sample timestamps validation
          const startMs = Date.parse(s.started_at);
          const finishMs = Date.parse(s.finished_at);

          if (isNaN(startMs) || isNaN(finishMs)) {
            details.telemetry_valid = false;
            errors.push(`Invalid timestamp format at sample ${i}`);
            continue;
          }

          if (startMs > finishMs) {
            details.telemetry_valid = false;
            errors.push(`Corrupted timestamps: started_at (${s.started_at}) > finished_at (${s.finished_at}) at sample ${i}`);
          }

          if (finishMs > maxFutureMs) {
            details.telemetry_valid = false;
            errors.push(`Sample at index ${i} has timestamp in the future: finished_at '${s.finished_at}'`);
          }

          const queryDuration = finishMs - startMs;
          if (queryDuration > maxQueryMs) {
            details.telemetry_valid = false;
            errors.push(`Degraded query duration: ${queryDuration}ms exceeds ${maxQueryMs}ms threshold at sample ${i}`);
          }

          // Chronological continuity with previous valid sample
          if (lastValidSample) {
            if (startMs < lastValidStartMs) {
              details.telemetry_valid = false;
              errors.push(`Chronological inversion between sample ${i - 1} and ${i}`);
            }

            if (startMs < lastValidFinishMs) {
              details.telemetry_valid = false;
              errors.push(`Sample overlap: sample ${i} started at ${s.started_at} before previous sample finished at ${lastValidSample.finished_at}`);
            }

            const gapMs = startMs - lastValidFinishMs;
            if (gapMs > maxObservedGap) {
              maxObservedGap = gapMs;
            }

            const effectiveMaxGap = (typeof win.max_gap_ms === 'number' && win.max_gap_ms > 0)
              ? Math.min(win.max_gap_ms, maxAllowedGap)
              : maxAllowedGap;

            if (gapMs > effectiveMaxGap) {
              details.telemetry_valid = false;
              errors.push(`Sampling gap of ${gapMs}ms exceeds threshold of ${effectiveMaxGap}ms between sample ${i - 1} and ${i}`);
            }
          }

          // Sample-by-sample interference limit enforcement
          if (typeof s.disk_queue === 'number' && s.disk_queue > effectiveLimits.max_disk_queue) {
            details.telemetry_valid = false;
            errors.push(`Sample ${i} violates disk_queue limit: ${s.disk_queue} > ${effectiveLimits.max_disk_queue}`);
          }

          if (typeof s.pages_input_per_sec === 'number' && s.pages_input_per_sec > effectiveLimits.max_pages_input_per_sec) {
            details.telemetry_valid = false;
            errors.push(`Sample ${i} violates pages_input_per_sec limit: ${s.pages_input_per_sec} > ${effectiveLimits.max_pages_input_per_sec}`);
          }

          if (typeof s.available_mb === 'number' && s.available_mb < effectiveLimits.min_available_ram_mb) {
            details.telemetry_valid = false;
            errors.push(`Sample ${i} violates available_ram_mb limit: ${s.available_mb} < ${effectiveLimits.min_available_ram_mb}`);
          }

          // External CPU attribution: in baseline preflight (without authorized test PIDs),
          // all other, node, and chromium processes count as external load
          if (Array.isArray(s.groups)) {
            const otherG = s.groups.find(g => g && g.category === 'other');
            const nodeG = s.groups.find(g => g && g.category === 'node');
            const chromG = s.groups.find(g => g && g.category === 'chromium');
            const otherCpu = otherG?.cpu_percent_logical_capacity ?? 0;
            const nodeCpu = nodeG?.cpu_percent_logical_capacity ?? 0;
            const chromCpu = chromG?.cpu_percent_logical_capacity ?? 0;

            const externalCpu = otherCpu + nodeCpu + chromCpu;
            if (externalCpu > effectiveLimits.max_external_cpu_percent) {
              details.telemetry_valid = false;
              errors.push(`Sample ${i} violates max_external_cpu_percent limit: external CPU ${externalCpu}% > ${effectiveLimits.max_external_cpu_percent}%`);
            }
          }

          lastValidSample = s;
          lastValidStartMs = startMs;
          lastValidFinishMs = finishMs;
        }

        details.max_observed_gap_ms = maxObservedGap;

        // Check endpoints match start_time and end_time
        if (win.samples[0]?.started_at && win.start_time !== win.samples[0].started_at) {
          details.telemetry_valid = false;
          errors.push(`telemetry_window.start_time ('${win.start_time}') does not match samples[0].started_at ('${win.samples[0]?.started_at}')`);
        }
        if (win.samples[win.samples.length - 1]?.finished_at && win.end_time !== win.samples[win.samples.length - 1].finished_at) {
          details.telemetry_valid = false;
          errors.push(`telemetry_window.end_time ('${win.end_time}') does not match samples[last].finished_at ('${win.samples[win.samples.length - 1]?.finished_at}')`);
        }

        // Total observed span derived strictly from valid real samples
        const firstStart = Date.parse(win.samples[0]?.started_at);
        const lastFinish = Date.parse(win.samples[win.samples.length - 1]?.finished_at);
        const observedSpanMs = (!isNaN(firstStart) && !isNaN(lastFinish)) ? (lastFinish - firstStart) : 0;
        details.telemetry_duration_ms = observedSpanMs;

        if (observedSpanMs < minDuration) {
          details.telemetry_valid = false;
          errors.push(`Observed continuous telemetry span of ${observedSpanMs}ms is less than required ${minDuration}ms`);
        }

        // Mathematical consistency between samples and aggregated stats
        const sampleCpus = win.samples.map(s => s?.cpu_percent).filter(v => typeof v === 'number' && !isNaN(v));
        if (sampleCpus.length === win.samples.length && win.cpu_stats && typeof win.cpu_stats === 'object') {
          const compMinCpu = Math.min(...sampleCpus);
          const compMaxCpu = Math.max(...sampleCpus);
          const compMeanCpu = sampleCpus.reduce((a, b) => a + b, 0) / sampleCpus.length;

          if (typeof win.cpu_stats.min === 'number' && Math.abs(win.cpu_stats.min - compMinCpu) > 0.05) {
            details.telemetry_valid = false;
            errors.push(`cpu_stats.min (${win.cpu_stats.min}) does not match samples minimum (${compMinCpu})`);
          }
          if (typeof win.cpu_stats.max === 'number' && Math.abs(win.cpu_stats.max - compMaxCpu) > 0.05) {
            details.telemetry_valid = false;
            errors.push(`cpu_stats.max (${win.cpu_stats.max}) does not match samples maximum (${compMaxCpu})`);
          }
          if (typeof win.cpu_stats.mean === 'number' && Math.abs(win.cpu_stats.mean - compMeanCpu) > 0.05) {
            details.telemetry_valid = false;
            errors.push(`cpu_stats.mean (${win.cpu_stats.mean}) does not match samples mean (${compMeanCpu.toFixed(4)})`);
          }
          if (typeof win.cpu_stats.p95 === 'number') {
            const sorted = [...sampleCpus].sort((a, b) => a - b);
            const p95Idx = Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length));
            const compP95 = sorted[p95Idx];
            if (Math.abs(win.cpu_stats.p95 - compP95) > 0.15 && Math.abs(win.cpu_stats.p95 - sorted[Math.round(0.95 * (sorted.length - 1))]) > 0.15) {
              details.telemetry_valid = false;
              errors.push(`cpu_stats.p95 (${win.cpu_stats.p95}) does not match samples p95 (${compP95})`);
            }
          }
        }

        const sampleAvail = win.samples.map(s => s?.available_mb).filter(v => typeof v === 'number' && !isNaN(v));
        if (sampleAvail.length === win.samples.length && win.mem_stats && typeof win.mem_stats === 'object') {
          const compMinAvail = Math.min(...sampleAvail);
          const compMaxAvail = Math.max(...sampleAvail);
          const compMeanAvail = sampleAvail.reduce((a, b) => a + b, 0) / sampleAvail.length;

          if (typeof win.mem_stats.min_available_mb === 'number' && Math.abs(win.mem_stats.min_available_mb - compMinAvail) > 0.05) {
            details.telemetry_valid = false;
            errors.push(`mem_stats.min_available_mb (${win.mem_stats.min_available_mb}) does not match samples minimum (${compMinAvail})`);
          }
          if (typeof win.mem_stats.max_available_mb === 'number' && Math.abs(win.mem_stats.max_available_mb - compMaxAvail) > 0.05) {
            details.telemetry_valid = false;
            errors.push(`mem_stats.max_available_mb (${win.mem_stats.max_available_mb}) does not match samples maximum (${compMaxAvail})`);
          }
          if (typeof win.mem_stats.mean_available_mb === 'number' && Math.abs(win.mem_stats.mean_available_mb - compMeanAvail) > 1.0) {
            details.telemetry_valid = false;
            errors.push(`mem_stats.mean_available_mb (${win.mem_stats.mean_available_mb}) does not match samples mean (${compMeanAvail.toFixed(2)})`);
          }
        }

        const samplePagesIn = win.samples.map(s => s?.pages_input_per_sec).filter(v => typeof v === 'number' && !isNaN(v));
        const samplePagesOut = win.samples.map(s => s?.pages_output_per_sec).filter(v => typeof v === 'number' && !isNaN(v));
        if (samplePagesIn.length === win.samples.length && win.page_faults && typeof win.page_faults === 'object') {
          const compMaxPfIn = Math.max(...samplePagesIn);
          const compMeanPfIn = samplePagesIn.reduce((a, b) => a + b, 0) / samplePagesIn.length;

          if (typeof win.page_faults.max_pages_input_per_sec === 'number' && Math.abs(win.page_faults.max_pages_input_per_sec - compMaxPfIn) > 0.05) {
            details.telemetry_valid = false;
            errors.push(`page_faults.max_pages_input_per_sec (${win.page_faults.max_pages_input_per_sec}) does not match samples max (${compMaxPfIn})`);
          }
          if (typeof win.page_faults.mean_pages_input_per_sec === 'number' && Math.abs(win.page_faults.mean_pages_input_per_sec - compMeanPfIn) > 0.1) {
            details.telemetry_valid = false;
            errors.push(`page_faults.mean_pages_input_per_sec (${win.page_faults.mean_pages_input_per_sec}) does not match samples mean (${compMeanPfIn.toFixed(2)})`);
          }
          if (samplePagesOut.length === win.samples.length && typeof win.page_faults.max_pages_output_per_sec === 'number') {
            const compMaxPfOut = Math.max(...samplePagesOut);
            if (Math.abs(win.page_faults.max_pages_output_per_sec - compMaxPfOut) > 0.05) {
              details.telemetry_valid = false;
              errors.push(`page_faults.max_pages_output_per_sec (${win.page_faults.max_pages_output_per_sec}) does not match samples max (${compMaxPfOut})`);
            }
          }
        }

        // Aggregate statistics limit verification
        if (win.mem_stats && typeof win.mem_stats.min_available_mb === 'number') {
          if (win.mem_stats.min_available_mb < effectiveLimits.min_available_ram_mb) {
            details.telemetry_valid = false;
            errors.push(`Aggregated mem_stats.min_available_mb (${win.mem_stats.min_available_mb}) is below minimum required ${effectiveLimits.min_available_ram_mb} MB`);
          }
        }

        if (win.page_faults && typeof win.page_faults.max_pages_input_per_sec === 'number') {
          if (win.page_faults.max_pages_input_per_sec > effectiveLimits.max_pages_input_per_sec) {
            details.telemetry_valid = false;
            errors.push(`Aggregated page_faults.max_pages_input_per_sec (${win.page_faults.max_pages_input_per_sec}) exceeds limit of ${effectiveLimits.max_pages_input_per_sec}`);
          }
        }
      } else {
        // Samples array is empty: duration is 0, never inherited from declared duration_ms
        details.telemetry_duration_ms = 0;
        details.telemetry_valid = false;
      }
    }
  }

  // 14. Contractual Contradiction Detection
  if (manifest.status === 'EJECUTOR_APTO') {
    if (!details.reservation_accredited || !options.auditorDecision) {
      errors.push('Contradiction: Manifest claims EJECUTOR_APTO without independently verified reservation and auditable decision');
    }
    if (manifest.resource_reservation && (manifest.resource_reservation.provenance === 'synthetic' || manifest.resource_reservation.type === 'synthetic_fixture')) {
      errors.push('Contradiction: Manifest claims EJECUTOR_APTO for synthetic fixture');
    }
    if (!details.telemetry_valid) {
      errors.push('Contradiction: Manifest claims EJECUTOR_APTO but telemetry window is invalid');
    }
    if (!details.git_valid) {
      errors.push('Contradiction: Manifest claims EJECUTOR_APTO but git tree is invalid');
    }
    if (!details.dist_hashes_valid) {
      errors.push('Contradiction: Manifest claims EJECUTOR_APTO but distribution hashes do not match');
    }
    if (!details.toolchain_valid) {
      errors.push('Contradiction: Manifest claims EJECUTOR_APTO but toolchain does not match baseline');
    }
  }

  // Optional mandate for accreditation in CLI/validation options
  if (options.requireAccreditation && !details.reservation_accredited) {
    errors.push('Option --require-accreditation specified but executor reservation is not accredited');
  }

  // 15. Determine final deterministic statuses
  const valid = errors.length === 0;
  const validador_status = valid ? 'VALIDADOR_PASS' : 'VALIDADOR_FAIL';

  let executor_status;

  if (
    valid &&
    details.reservation_accredited &&
    details.telemetry_valid &&
    details.git_valid &&
    details.dist_hashes_valid &&
    details.toolchain_valid &&
    options.expectedCommitSha &&
    manifest.resource_reservation?.type !== 'synthetic_fixture' &&
    manifest.resource_reservation?.provenance !== 'synthetic'
  ) {
    executor_status = 'EJECUTOR_APTO';
    reasons.push('Ejecutor debidamente acreditado con reserva demostrada y preflight conforme');
  } else {
    executor_status = 'EJECUTOR_NO_APTO';
    if (valid && !details.reservation_accredited) {
      reasons.push('PREPARADO / RESERVA NO ACREDITADA');
    } else if (!valid) {
      reasons.push('Preflight rechazado: violaciones estructurales o de contrato detectadas');
    }
  }

  return {
    valid,
    validador_status,
    executor_status,
    reasons,
    errors,
    warnings,
    details
  };
}

/**
 * CLI Options Parser
 *
 * @param {string[]} args - Command line arguments (excluding node and script path)
 * @returns {object} Parsed CLI options and manifest path
 */
export function parseCliArgs(args) {
  const options = {};
  let manifestPath = null;
  const unknownOptions = [];
  const cliErrors = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--manifest') {
      const next = args[++i];
      if (!next || next.startsWith('--')) {
        cliErrors.push("Option '--manifest' requires a non-empty file path");
        i--;
      } else {
        manifestPath = next;
      }
    } else if (arg.startsWith('--manifest=')) {
      const val = arg.slice('--manifest='.length);
      if (!val || val.trim() === '') {
        cliErrors.push("Option '--manifest' requires a non-empty file path");
      } else {
        manifestPath = val;
      }
    } else if (arg === '--expected-sha') {
      const next = args[++i];
      if (!next || next.startsWith('--')) {
        cliErrors.push("Missing value for option '--expected-sha' (requires a non-empty 40-character commit SHA)");
        i--;
      } else {
        options.expectedCommitSha = next;
      }
    } else if (arg.startsWith('--expected-sha=')) {
      const val = arg.slice('--expected-sha='.length);
      if (!val || val.trim() === '') {
        cliErrors.push("Empty value for option '--expected-sha' (requires a non-empty 40-character commit SHA)");
      } else {
        options.expectedCommitSha = val;
      }
    } else if (arg === '--expected-branch') {
      const next = args[++i];
      if (!next || next.startsWith('--')) {
        cliErrors.push("Option '--expected-branch' requires a branch name");
        i--;
      } else {
        options.expectedBranch = next;
      }
    } else if (arg.startsWith('--expected-branch=')) {
      const val = arg.slice('--expected-branch='.length);
      if (!val || val.trim() === '') {
        cliErrors.push("Option '--expected-branch' requires a branch name");
      } else {
        options.expectedBranch = val;
      }
    } else if (arg === '--expected-chromium') {
      const next = args[++i];
      if (!next || next.startsWith('--')) {
        cliErrors.push("Option '--expected-chromium' requires a version string");
        i--;
      } else {
        options.expectedChromiumVersion = next;
      }
    } else if (arg.startsWith('--expected-chromium=')) {
      const val = arg.slice('--expected-chromium='.length);
      if (!val || val.trim() === '') {
        cliErrors.push("Option '--expected-chromium' requires a version string");
      } else {
        options.expectedChromiumVersion = val;
      }
    } else if (arg === '--require-chromium') {
      options.requireChromium = true;
    } else if (arg === '--expected-node') {
      const next = args[++i];
      if (!next || next.startsWith('--')) {
        cliErrors.push("Option '--expected-node' requires a version string");
        i--;
      } else {
        options.expectedNodeVersion = next;
      }
    } else if (arg.startsWith('--expected-node=')) {
      const val = arg.slice('--expected-node='.length);
      if (!val || val.trim() === '') {
        cliErrors.push("Option '--expected-node' requires a version string");
      } else {
        options.expectedNodeVersion = val;
      }
    } else if (arg === '--expected-pnpm') {
      const next = args[++i];
      if (!next || next.startsWith('--')) {
        cliErrors.push("Option '--expected-pnpm' requires a version string");
        i--;
      } else {
        options.expectedPnpmVersion = next;
      }
    } else if (arg.startsWith('--expected-pnpm=')) {
      const val = arg.slice('--expected-pnpm='.length);
      if (!val || val.trim() === '') {
        cliErrors.push("Option '--expected-pnpm' requires a version string");
      } else {
        options.expectedPnpmVersion = val;
      }
    } else if (arg === '--min-duration') {
      const next = args[++i];
      const num = Number(next);
      if (!next || next.startsWith('--') || isNaN(num) || !Number.isFinite(num)) {
        cliErrors.push(`Invalid numeric value for option '--min-duration', received '${next ?? ''}'`);
        if (next && next.startsWith('--')) i--;
      } else {
        options.minDurationMs = num;
      }
    } else if (arg.startsWith('--min-duration=')) {
      const val = arg.slice('--min-duration='.length);
      const num = Number(val);
      if (!val || isNaN(num) || !Number.isFinite(num)) {
        cliErrors.push(`Invalid numeric value for option '--min-duration', received '${val}'`);
      } else {
        options.minDurationMs = num;
      }
    } else if (arg === '--max-gap') {
      const next = args[++i];
      const num = Number(next);
      if (!next || next.startsWith('--') || isNaN(num) || !Number.isFinite(num)) {
        cliErrors.push(`Invalid numeric value for option '--max-gap', received '${next ?? ''}'`);
        if (next && next.startsWith('--')) i--;
      } else {
        options.maxGapMs = num;
      }
    } else if (arg.startsWith('--max-gap=')) {
      const val = arg.slice('--max-gap='.length);
      const num = Number(val);
      if (!val || isNaN(num) || !Number.isFinite(num)) {
        cliErrors.push(`Invalid numeric value for option '--max-gap', received '${val}'`);
      } else {
        options.maxGapMs = num;
      }
    } else if (arg === '--max-query') {
      const next = args[++i];
      const num = Number(next);
      if (!next || next.startsWith('--') || isNaN(num) || !Number.isFinite(num)) {
        cliErrors.push(`Invalid numeric value for option '--max-query', received '${next ?? ''}'`);
        if (next && next.startsWith('--')) i--;
      } else {
        options.maxQueryMs = num;
      }
    } else if (arg.startsWith('--max-query=')) {
      const val = arg.slice('--max-query='.length);
      const num = Number(val);
      if (!val || isNaN(num) || !Number.isFinite(num)) {
        cliErrors.push(`Option '--max-query' requires a valid numeric value, received '${val}'`);
      } else {
        options.maxQueryMs = num;
      }
    } else if (arg === '--telemetry') {
      const next = args[++i];
      if (!next || next.startsWith('--')) {
        cliErrors.push("Option '--telemetry' requires a file path");
        i--;
      } else {
        options.telemetryPath = next;
      }
    } else if (arg.startsWith('--telemetry=')) {
      const val = arg.slice('--telemetry='.length);
      if (!val || val.trim() === '') {
        cliErrors.push("Option '--telemetry' requires a file path");
      } else {
        options.telemetryPath = val;
      }
    } else if (arg === '--auditor-decision') {
      const next = args[++i];
      if (!next || next.startsWith('--')) {
        cliErrors.push("Option '--auditor-decision' requires a file path");
        i--;
      } else {
        options.auditorDecision = next;
      }
    } else if (arg.startsWith('--auditor-decision=')) {
      const val = arg.slice('--auditor-decision='.length);
      if (!val || val.trim() === '') {
        cliErrors.push("Option '--auditor-decision' requires a file path");
      } else {
        options.auditorDecision = val;
      }
    } else if (arg === '--require-accreditation') {
      options.requireAccreditation = true;
    } else if (arg === '--auditor-approval') {
      options.auditorApproval = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('-')) {
      unknownOptions.push(arg);
    } else if (!manifestPath) {
      manifestPath = arg;
    } else {
      unknownOptions.push(arg);
    }
  }

  return { manifestPath, options, unknownOptions, cliErrors };
}

/**
 * CLI Entrypoint
 */
async function main() {
  const { manifestPath: parsedPath, options, unknownOptions, cliErrors } = parseCliArgs(process.argv.slice(2));

  if (options.help) {
    console.log(`
Usage: node check-preflight.mjs [manifest-path] [options]

Options:
  --manifest <path>            Path to preflight manifest JSON
  --expected-sha <sha>         Required 40-char commit SHA
  --expected-branch <branch>   Required git branch name
  --expected-chromium <ver>    Required Playwright Chromium version
  --expected-node <ver>        Required Node.js version
  --expected-pnpm <ver>        Required pnpm version
  --min-duration <ms>          Minimum telemetry duration in ms (default: 60000)
  --max-gap <ms>               Maximum sampling gap in ms (default: 5000)
  --max-query <ms>             Maximum query duration in ms (default: 5000)
  --auditor-decision <path>    Path to independent auditor decision JSON
  --require-accreditation      Fail if reservation is not accredited
  --auditor-approval           Signal independent external auditor approval
  --help, -h                   Show this help message
`);
    process.exit(0);
  }

  if (cliErrors && cliErrors.length > 0) {
    console.error(`Error: CLI argument error(s):\n${cliErrors.map(e => `  - ${e}`).join('\n')}`);
    process.exit(1);
  }

  if (unknownOptions.length > 0) {
    console.error(`Error: Unknown CLI option(s): ${unknownOptions.join(', ')}`);
    process.exit(1);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const manifestPath = parsedPath
    ? path.resolve(process.cwd(), parsedPath)
    : path.resolve(__dirname, 'manifest-ejemplo.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: Manifest file does not exist at '${manifestPath}'`);
    process.exit(1);
  }

  try {
    const rawContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(rawContent);
    const result = validatePreflightManifest(manifest, options);

    console.log(JSON.stringify(result, null, 2));

    if (result.valid) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error(`Fatal error processing manifest '${manifestPath}':`, err.message);
    process.exit(1);
  }
}

// Detect direct invocation vs module import
const isDirectCli = process.argv[1] && (
  import.meta.url === pathToFileURL(process.argv[1]).href ||
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isDirectCli) {
  main();
}

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

  // 2. Check all required top-level keys (no PASS by omission)
  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (manifest[key] === undefined || manifest[key] === null) {
      details.schema_valid = false;
      errors.push(`Missing required top-level field: '${key}'`);
    } else if (typeof manifest[key] === 'string' && manifest[key].trim() === '') {
      details.schema_valid = false;
      errors.push(`Required top-level field '${key}' cannot be an empty string`);
    }
  }

  // If top-level keys are missing, stop deeper parsing that would throw null dereferences
  if (!details.schema_valid) {
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
    } else if (clean_working_tree === false) {
      // ONLY the normative immutable whitelist is permitted. Executor cannot add paths.
      const allowedList = new Set(ALLOWED_GIT_EXCEPTIONS);
      const dirtyFiles = manifest.git.dirty_files || manifest.git.modified_files || options.dirtyFiles;

      if (Array.isArray(dirtyFiles) && dirtyFiles.length > 0) {
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

  // 10. Validate dist_hashes
  if (typeof manifest.dist_hashes !== 'object' || Array.isArray(manifest.dist_hashes)) {
    details.schema_valid = false;
    details.dist_hashes_valid = false;
    errors.push('Field dist_hashes must be an object');
  } else {
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

  // 12. Validate resource_reservation (Independent evidence verification & auditor gate)
  if (typeof manifest.resource_reservation !== 'object' || Array.isArray(manifest.resource_reservation)) {
    details.schema_valid = false;
    errors.push('Field resource_reservation must be an object');
  } else {
    const res = manifest.resource_reservation;
    const requiredResKeys = ['provenance', 'evidence_doc', 'type', 'allocated_cores', 'allocated_ram_mb', 'swap_policy', 'accredited'];

    for (const rk of requiredResKeys) {
      if (res[rk] === undefined) {
        details.schema_valid = false;
        errors.push(`Missing required resource_reservation field: '${rk}'`);
      }
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

    const auditorApproved = options.auditorApproval === true;

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

      // Check evidence document physically
      if (typeof res.evidence_doc === 'string' && res.evidence_doc.trim() !== '') {
        let isLocalDoc = false;
        let localDocPath = null;

        if (res.evidence_doc.startsWith('file://')) {
          isLocalDoc = true;
          try {
            localDocPath = fileURLToPath(res.evidence_doc);
          } catch {
            localDocPath = res.evidence_doc.replace(/^file:\/\//, '');
          }
        } else if (!/^https?:\/\//i.test(res.evidence_doc)) {
          isLocalDoc = true;
          localDocPath = path.isAbsolute(res.evidence_doc)
            ? res.evidence_doc
            : path.resolve(process.cwd(), res.evidence_doc);
        }

        if (isLocalDoc && localDocPath) {
          if (!fs.existsSync(localDocPath)) {
            details.reservation_accredited = false;
            errors.push(`Evidence document does not exist or is inaccessible: '${res.evidence_doc}'`);
          } else {
            try {
              const stat = fs.statSync(localDocPath);
              if (stat.size === 0) {
                details.reservation_accredited = false;
                errors.push(`Evidence document is empty (0 bytes): '${res.evidence_doc}'`);
              } else {
                if (ACCREDITED_PROVENANCES.has(res.provenance) && ACCREDITED_TYPES.has(res.type)) {
                  details.reservation_accredited = auditorApproved;
                }
              }
            } catch (err) {
              details.reservation_accredited = false;
              errors.push(`Evidence document cannot be read: '${res.evidence_doc}' (${err.message})`);
            }
          }
        } else if (/^https?:\/\//i.test(res.evidence_doc)) {
          try {
            new URL(res.evidence_doc);
            if (ACCREDITED_PROVENANCES.has(res.provenance) && ACCREDITED_TYPES.has(res.type)) {
              details.reservation_accredited = auditorApproved;
            }
          } catch {
            details.reservation_accredited = false;
            errors.push(`Evidence document URL is invalid: '${res.evidence_doc}'`);
          }
        }
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
  if (typeof manifest.telemetry_window !== 'object' || Array.isArray(manifest.telemetry_window)) {
    details.schema_valid = false;
    details.telemetry_valid = false;
    errors.push('Field telemetry_window must be an object');
  } else {
    const win = manifest.telemetry_window;
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
    if (typeof win.duration_ms !== 'number' || win.duration_ms < minDuration) {
      details.telemetry_valid = false;
      errors.push(`Telemetry window duration (${win.duration_ms}ms) is less than required minimum of ${minDuration}ms`);
    }

    const maxAllowedGap = options.maxGapMs || 5000;
    if (typeof win.max_gap_ms !== 'number' || win.max_gap_ms > maxAllowedGap || win.max_gap_ms < 0) {
      details.telemetry_valid = false;
      errors.push(`Field telemetry_window.max_gap_ms (${win.max_gap_ms}) exceeds maximum tolerable gap of ${maxAllowedGap}ms`);
    }

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
              if (!REQUIRED_GROUP_CATEGORIES.includes(g.category)) {
                details.telemetry_valid = false;
                errors.push(`Sample ${i} group has invalid category '${g.category}'`);
              } else {
                seenCategories.add(g.category);
              }
              const groupNums = ['count', 'cpu_percent_logical_capacity', 'working_set_private_bytes', 'page_faults_per_sec'];
              for (const gn of groupNums) {
                if (g[gn] === undefined || g[gn] === null || typeof g[gn] !== 'number' || isNaN(g[gn]) || g[gn] < 0) {
                  details.telemetry_valid = false;
                  errors.push(`Sample ${i} group '${g.category}' missing or invalid numeric field '${gn}'`);
                }
              }
            }
            if (seenCategories.size !== 4) {
              details.telemetry_valid = false;
              errors.push(`Sample at index ${i} does not contain all 4 unique categories: missing ${REQUIRED_GROUP_CATEGORIES.filter(c => !seenCategories.has(c)).join(', ')}`);
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

          if (Array.isArray(s.groups)) {
            const otherG = s.groups.find(g => g && g.category === 'other');
            const otherCpu = otherG?.cpu_percent_logical_capacity ?? 0;
            if (otherCpu > effectiveLimits.max_external_cpu_percent) {
              details.telemetry_valid = false;
              errors.push(`Sample ${i} violates max_external_cpu_percent limit: ${otherCpu}% > ${effectiveLimits.max_external_cpu_percent}%`);
            }
          }

          lastValidSample = s;
          lastValidStartMs = startMs;
          lastValidFinishMs = finishMs;
        }

        details.max_observed_gap_ms = maxObservedGap;

        // Total observed span derived strictly from valid real samples
        const firstStart = Date.parse(win.samples[0]?.started_at);
        const lastFinish = Date.parse(win.samples[win.samples.length - 1]?.finished_at);
        const observedSpanMs = (!isNaN(firstStart) && !isNaN(lastFinish)) ? (lastFinish - firstStart) : 0;
        details.telemetry_duration_ms = observedSpanMs;

        if (observedSpanMs < minDuration) {
          details.telemetry_valid = false;
          errors.push(`Observed continuous telemetry span of ${observedSpanMs}ms is less than required ${minDuration}ms`);
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
    if (!details.reservation_accredited || options.auditorApproval !== true) {
      errors.push('Contradiction: Manifest claims EJECUTOR_APTO without independently verified reservation');
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

  let executor_status = 'EJECUTOR_NO_APTO';

  if (
    valid &&
    details.reservation_accredited &&
    options.auditorApproval === true &&
    details.telemetry_valid &&
    details.git_valid &&
    details.dist_hashes_valid &&
    details.toolchain_valid &&
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

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--manifest') {
      manifestPath = args[++i];
    } else if (arg.startsWith('--manifest=')) {
      manifestPath = arg.slice('--manifest='.length);
    } else if (arg === '--expected-sha') {
      options.expectedCommitSha = args[++i];
    } else if (arg.startsWith('--expected-sha=')) {
      options.expectedCommitSha = arg.slice('--expected-sha='.length);
    } else if (arg === '--expected-branch') {
      options.expectedBranch = args[++i];
    } else if (arg.startsWith('--expected-branch=')) {
      options.expectedBranch = arg.slice('--expected-branch='.length);
    } else if (arg === '--expected-chromium') {
      options.expectedChromiumVersion = args[++i];
    } else if (arg.startsWith('--expected-chromium=')) {
      options.expectedChromiumVersion = arg.slice('--expected-chromium='.length);
    } else if (arg === '--require-chromium') {
      options.requireChromium = true;
    } else if (arg === '--expected-node') {
      options.expectedNodeVersion = args[++i];
    } else if (arg.startsWith('--expected-node=')) {
      options.expectedNodeVersion = arg.slice('--expected-node='.length);
    } else if (arg === '--expected-pnpm') {
      options.expectedPnpmVersion = args[++i];
    } else if (arg.startsWith('--expected-pnpm=')) {
      options.expectedPnpmVersion = arg.slice('--expected-pnpm='.length);
    } else if (arg === '--min-duration') {
      options.minDurationMs = Number(args[++i]);
    } else if (arg.startsWith('--min-duration=')) {
      options.minDurationMs = Number(arg.slice('--min-duration='.length));
    } else if (arg === '--max-gap') {
      options.maxGapMs = Number(args[++i]);
    } else if (arg.startsWith('--max-gap=')) {
      options.maxGapMs = Number(arg.slice('--max-gap='.length));
    } else if (arg === '--max-query') {
      options.maxQueryMs = Number(args[++i]);
    } else if (arg.startsWith('--max-query=')) {
      options.maxQueryMs = Number(arg.slice('--max-query='.length));
    } else if (arg === '--telemetry') {
      options.telemetryPath = args[++i];
    } else if (arg.startsWith('--telemetry=')) {
      options.telemetryPath = arg.slice('--telemetry='.length);
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

  return { manifestPath, options, unknownOptions };
}

/**
 * CLI Entrypoint
 */
async function main() {
  const { manifestPath: parsedPath, options, unknownOptions } = parseCliArgs(process.argv.slice(2));

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
  --require-accreditation      Fail if reservation is not accredited
  --auditor-approval           Signal independent external auditor approval
  --help, -h                   Show this help message
`);
    process.exit(0);
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

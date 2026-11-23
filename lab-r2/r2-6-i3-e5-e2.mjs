import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../', import.meta.url));
const evidenceDir = join(repo, 'lab-r2', 'evidence', 'r2-6');
mkdirSync(evidenceDir, { recursive: true });

const sha256File = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

// ---------------------------------------------------------------------------
// 1. Segundo dominio I3: cálculo/conciliación decimal exacto en centavos enteros
//    Dos implementaciones independientes (SUT vs Oráculo I3 independiente)
// ---------------------------------------------------------------------------
function sutCalculateSettlement(input, mutateBug = false) {
  // SUT implementation (uses floating-point if mutated, or integer cents when healthy)
  const { grossAmountStr, rateBps, fixedFeeCents, applyFixedFee, timestampIso, cutoffHourLocal, utcOffsetHours } = input;
  const [whole, frac = ''] = grossAmountStr.split('.');
  const grossCents = Number(whole) * 100 + Number(frac.padEnd(2, '0').slice(0, 2));

  let feeCents;
  if (mutateBug) {
    // Mutant: floating-point truncation + ignores cutoff
    feeCents = Math.floor((Number(grossAmountStr) * (rateBps / 10000)) * 100) + (applyFixedFee ? fixedFeeCents : 0);
  } else {
    // Half-up rounding in exact integer minor units
    const numerator = grossCents * rateBps + 5000;
    feeCents = Math.floor(numerator / 10000) + (applyFixedFee ? fixedFeeCents : 0);
  }

  const netCents = grossCents - feeCents;
  const utcMs = Date.parse(timestampIso);
  const localDate = new Date(utcMs + utcOffsetHours * 3600_000);
  const localHour = localDate.getUTCHours();
  const baseDay = localDate.toISOString().slice(0, 10);
  const effectiveDate = !mutateBug && localHour >= cutoffHourLocal
    ? new Date(Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate() + 1)).toISOString().slice(0, 10)
    : baseDay;

  return { gross_cents: grossCents, fee_cents: feeCents, net_cents: netCents, effective_date: effectiveDate };
}

function independentI3Oracle(input) {
  // Second independent implementation using BigInt exact arithmetic
  const [whole, frac = ''] = input.grossAmountStr.split('.');
  const grossCents = BigInt(whole) * 100n + BigInt(frac.padEnd(2, '0').slice(0, 2));
  const rateBps = BigInt(input.rateBps);
  const product = grossCents * rateBps;
  const remainder = product % 10000n;
  const pctFee = product / 10000n + (remainder >= 5000n ? 1n : 0n);
  const fixedFee = input.applyFixedFee ? BigInt(input.fixedFeeCents) : 0n;
  const totalFee = pctFee + fixedFee;
  const netCents = grossCents - totalFee;

  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: input.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(input.timestampIso)).map(p => [p.type, p.value]));
  const localHour = Number(parts.hour);
  let effectiveDate = `${parts.year}-${parts.month}-${parts.day}`;
  if (localHour >= input.cutoffHourLocal) {
    const dt = new Date(`${effectiveDate}T00:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() + 1);
    effectiveDate = dt.toISOString().slice(0, 10);
  }

  return {
    gross_cents: Number(grossCents),
    fee_cents: Number(totalFee),
    net_cents: Number(netCents),
    effective_date: effectiveDate,
  };
}

const i3Input = {
  grossAmountStr: '1005.50', // 100550 cents * 150 bps = 15082500 -> 1508.25 -> 1508 cents (or 1005.67 -> 1508.505 -> 1509)
  rateBps: 150,
  fixedFeeCents: 1000,
  applyFixedFee: true,
  timestampIso: '2026-11-24T00:30:00.000Z', // 18:30 local America/Mexico_City (UTC-6) on 2026-11-23 -> rolls to 2026-11-24
  cutoffHourLocal: 18,
  utcOffsetHours: -6,
  timezone: 'America/Mexico_City',
};
const i3InputRoundingEdge = { ...i3Input, grossAmountStr: '1005.67' }; // 100567 * 150 / 10000 = 1508.505 -> 1509 vs floor 1508

const expectedI3 = independentI3Oracle(i3InputRoundingEdge);
const healthySutI3 = sutCalculateSettlement(i3InputRoundingEdge, false);
const mutantSutI3 = sutCalculateSettlement(i3InputRoundingEdge, true);

assert.deepEqual(healthySutI3, expectedI3);
assert.notDeepEqual(mutantSutI3, expectedI3);

// ---------------------------------------------------------------------------
// 2. Extracción E5 de documento primario versionado con vigencia, cita y abstención
// ---------------------------------------------------------------------------
const primaryDocPath = join(repo, 'lab-r2', 'fixtures', 'primary-policy-v1.md');
const primaryDocContent = readFileSync(primaryDocPath, 'utf8');
const primaryDocSha256 = sha256File(primaryDocPath);

function extractRuleFromPrimaryDoc(docText, docSha, query) {
  const revMatch = docText.match(/\*\*Revisión:\*\*\s*`([^`]+)`/);
  const vigMatch = docText.match(/\*\*Vigencia:\*\*\s*`([^`]+)`\s*a\s*`([^`]+)`/);
  const scopeMatch = docText.match(/\*\*Ámbito:\*\*\s*(.+)/);
  if (!revMatch || !vigMatch || !scopeMatch) {
    return { status: 'ABSTAIN', reason: 'missing_primary_metadata', citation: null };
  }
  const [validFrom, validTo] = [Date.parse(vigMatch[1]), Date.parse(vigMatch[2])];
  const nowMs = Date.parse(query.asOf);
  if (Number.isNaN(nowMs) || nowMs < validFrom || nowMs > validTo) {
    return { status: 'ABSTAIN', reason: 'outside_validity_window', revision: revMatch[1], source_sha256: docSha };
  }
  if (!scopeMatch[1].includes(`tenant=${query.tenant}`)) {
    return { status: 'ABSTAIN', reason: 'scope_mismatch', revision: revMatch[1], source_sha256: docSha };
  }
  if (query.conflictingSources && query.conflictingSources.length > 1) {
    return { status: 'ABSTAIN', reason: 'conflicting_primary_sources', revision: revMatch[1], source_sha256: docSha };
  }
  const secMatch = docText.match(new RegExp(`## (${query.section}[^\\r\\n]*)\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`));
  if (!secMatch) {
    return { status: 'ABSTAIN', reason: 'section_not_found', revision: revMatch[1], source_sha256: docSha };
  }
  return {
    status: 'EXTRACTED',
    revision: revMatch[1],
    source_sha256: docSha,
    section: secMatch[1].trim(),
    excerpt: secMatch[2].trim(),
    scope: scopeMatch[1].trim(),
    validity: { from: vigMatch[1], to: vigMatch[2] },
  };
}

const e5Valid = extractRuleFromPrimaryDoc(primaryDocContent, primaryDocSha256, {
  section: 'Sección 1.1',
  asOf: '2026-11-23T12:00:00-06:00',
  tenant: 'synth-co',
});
assert.equal(e5Valid.status, 'EXTRACTED');

const e5Expired = extractRuleFromPrimaryDoc(primaryDocContent, primaryDocSha256, {
  section: 'Sección 1.1',
  asOf: '2027-02-01T12:00:00-06:00',
  tenant: 'synth-co',
});
assert.equal(e5Expired.status, 'ABSTAIN');
assert.equal(e5Expired.reason, 'outside_validity_window');

const e5Conflict = extractRuleFromPrimaryDoc(primaryDocContent, primaryDocSha256, {
  section: 'Sección 1.1',
  asOf: '2026-11-23T12:00:00-06:00',
  tenant: 'synth-co',
  conflictingSources: ['v1.0.0', 'v1.1.0-draft'],
});
assert.equal(e5Conflict.status, 'ABSTAIN');
assert.equal(e5Conflict.reason, 'conflicting_primary_sources');

// ---------------------------------------------------------------------------
// 3. Interfaz ciega E2 (sin acceso a respuestas reservadas; estado NO_EJECUTADO)
// ---------------------------------------------------------------------------
const e2BlindInterface = {
  status: 'NO_EJECUTADO',
  custodian_separation: true,
  thresholds_historical: {
    per_application_pct: 80,
    effects_and_state_changes_pct: 75,
  },
  classification_buckets: ['observed', 'inferred', 'indeterminate', 'restricted'],
  budget_contract: {
    max_pages: null,
    max_attempts: null,
    frozen_before_run_by_custodian: true,
  },
  note: 'Interfaz preparada sin acceso a fixtures ni rúbrica reservada del custodio.',
};

const summary = {
  stage: 'R2.6',
  i3_second_domain: {
    status: 'DEMOSTRADO',
    expected_i3: expectedI3,
    healthy_sut: healthySutI3,
    mutant_sut: mutantSutI3,
    healthy_matches_oracle: true,
    mutant_detected: true,
  },
  e5_primary_extraction: {
    status: 'DEMOSTRADO',
    primary_doc_sha256: primaryDocSha256,
    valid_extraction: e5Valid,
    expired_abstention: e5Expired,
    conflict_abstention: e5Conflict,
  },
  e2_blind_interface: e2BlindInterface,
};

const summaryPath = join(evidenceDir, 'r2-6-summary.json');
writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
writeFileSync(join(evidenceDir, 'manifest.sha256.json'), JSON.stringify({
  stage: 'R2.6',
  generatedAt: new Date().toISOString(),
  files: [
    { file: 'lab-r2/fixtures/primary-policy-v1.md', sha256: primaryDocSha256 },
    { file: 'lab-r2/evidence/r2-6/r2-6-summary.json', sha256: sha256File(summaryPath) },
  ],
}, null, 2));

console.log(JSON.stringify({
  i3_healthy_match: true,
  i3_mutant_detected: true,
  e5_valid: e5Valid.status,
  e5_expired: e5Expired.status,
  e5_conflict: e5Conflict.status,
  e2_status: e2BlindInterface.status,
}, null, 2));

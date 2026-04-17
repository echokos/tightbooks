/**
 * Import QBO vendors into BigCapital (Tightbooks).
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-vendors.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_EMAIL=assist@majorimpact.com \
 *   TIGHTBOOKS_PASSWORD=... \
 *   tsx scripts/qbo-import/import-vendors.ts
 *
 * Env vars:
 *   TIGHTBOOKS_API_BASE  (default: https://app.tightbooks.com/api)
 *   TIGHTBOOKS_EMAIL     (required in non-dry-run)
 *   TIGHTBOOKS_PASSWORD  (required in non-dry-run)
 *   QBO_EXPORT_DIR       (default: /home/elliott/nanoclaw/groups/maggie/exports/qbo)
 *   DRY_RUN              (default: true)
 *
 * Outputs (scripts/qbo-import/output/):
 *   vendor_qbo_to_bigcap_map.json     — { "<QBO Id>": <BigCapital id>, ... }
 *   run-vendors-<timestamp>.log
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TightbooksApiClient } from './lib/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────
const API_BASE = process.env.TIGHTBOOKS_API_BASE ?? 'https://app.tightbooks.com/api';
const EMAIL = process.env.TIGHTBOOKS_EMAIL ?? 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';
const QBO_DIR = process.env.QBO_EXPORT_DIR ?? '/home/elliott/nanoclaw/groups/maggie/exports/qbo';
const DRY_RUN = process.env.DRY_RUN !== 'false'; // default: true
const REQUEST_DELAY_MS = 1200;

const OUTPUT_DIR = path.join(__dirname, 'output');

// ── Types ───────────────────────────────────────────────────────────────────
interface QboVendor {
  Id: string;
  DisplayName?: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address?: string };
  PrimaryPhone?: { FreeFormNumber?: string };
  Mobile?: { FreeFormNumber?: string };
  WebAddr?: { URI?: string };
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  Active?: boolean;
  TaxIdentifier?: string;
}

interface VendorPayload {
  displayName: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  workPhone?: string;
  personalPhone?: string;
  website?: string;
  note?: string;
  active?: boolean;
  billingAddress1?: string;
  billingAddress2?: string;
  billingAddressCity?: string;
  billingAddressState?: string;
  billingAddressPostcode?: string;
  billingAddressCountry?: string;
}

// ── Log infrastructure ───────────────────────────────────────────────────────
const logLines: string[] = [];

function log(level: 'INFO' | 'WARN' | 'ERROR' | 'CREATED' | 'REUSED' | 'SKIPPED' | 'DRY', msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

// Simple email validation (avoid importing class-validator)
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Map QBO vendor to BigCapital payload ─────────────────────────────────────
function mapVendor(v: QboVendor): VendorPayload | null {
  const displayName = v.DisplayName?.trim();
  if (!displayName) {
    log('SKIPPED', `QBO Id=${v.Id} has no DisplayName — skipping.`);
    return null;
  }

  const payload: VendorPayload = { displayName };

  if (v.CompanyName) payload.companyName = v.CompanyName;
  if (v.GivenName) payload.firstName = v.GivenName;
  if (v.FamilyName) payload.lastName = v.FamilyName;
  if (v.Active === false) payload.active = false;
  if (v.WebAddr?.URI) payload.website = v.WebAddr.URI;

  // Phone
  const workPhone = v.PrimaryPhone?.FreeFormNumber;
  if (workPhone) payload.workPhone = workPhone;
  const mobilePhone = v.Mobile?.FreeFormNumber;
  if (mobilePhone) payload.personalPhone = mobilePhone;

  // Email — validate before including
  const emailAddr = v.PrimaryEmailAddr?.Address?.trim();
  if (emailAddr) {
    if (isValidEmail(emailAddr)) {
      payload.email = emailAddr;
    } else {
      log('WARN', `QBO Id=${v.Id} "${displayName}": invalid email "${emailAddr}" — omitting email field.`);
    }
  }

  // TaxIdentifier → note (no DTO field for it)
  if (v.TaxIdentifier) {
    payload.note = `Tax ID: ${v.TaxIdentifier}`;
    log('WARN', `QBO Id=${v.Id} "${displayName}": TaxIdentifier routed to note field.`);
  }

  // Billing address
  const addr = v.BillAddr;
  if (addr?.Line1) {
    payload.billingAddress1 = addr.Line1;
    if (addr.Line2) payload.billingAddress2 = addr.Line2;
    if (addr.City) payload.billingAddressCity = addr.City;
    if (addr.CountrySubDivisionCode) payload.billingAddressState = addr.CountrySubDivisionCode;
    if (addr.PostalCode) payload.billingAddressPostcode = addr.PostalCode;
    if (addr.Country) payload.billingAddressCountry = addr.Country;
  }

  return payload;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) {
    log('INFO', 'DRY RUN mode — no vendors will be created.');
  }
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD is required for a real run.');
    process.exit(1);
  }

  // 1. Load vendor source
  const sourcePath = path.join(QBO_DIR, 'vendors_raw.json');
  const rawData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const qboVendors: QboVendor[] = rawData?.QueryResponse?.Vendor ?? rawData?.Vendor ?? (Array.isArray(rawData) ? rawData : []);
  log('INFO', `Loaded ${qboVendors.length} vendors from ${sourcePath}`);

  // 2. Map to payloads
  const mapped: Array<{ qboId: string; payload: VendorPayload }> = [];
  const seenDisplayNames = new Set<string>();
  let skippedInvalid = 0;

  for (const v of qboVendors) {
    const payload = mapVendor(v);
    if (!payload) {
      skippedInvalid++;
      continue;
    }
    const dedupKey = payload.displayName.toLowerCase();
    if (seenDisplayNames.has(dedupKey)) {
      log('WARN', `QBO Id=${v.Id} "${payload.displayName}": duplicate displayName in source — skipping.`);
      skippedInvalid++;
      continue;
    }
    seenDisplayNames.add(dedupKey);
    mapped.push({ qboId: v.Id, payload });
  }

  log('INFO', `Mapped: ${mapped.length} valid, ${skippedInvalid} skipped-invalid`);

  if (DRY_RUN) {
    log('INFO', 'Dry run complete. No writes performed.');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(OUTPUT_DIR, `run-vendors-${timestamp}.log`), logLines.join('\n') + '\n');
    return;
  }

  // 3. Auth + get existing vendors for idempotency
  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // Paginate existing vendors
  const existingNames = new Set<string>();
  const existingByName = new Map<string, number>(); // nameLower → bigcapId
  let page = 1;
  let pageSize = 200;
  while (true) {
    const resp = await client.get<any>(`/vendors?page=${page}&pageSize=${pageSize}`);
    const vendors: any[] = Array.isArray(resp) ? resp : (resp?.vendors ?? resp?.data ?? []);
    if (vendors.length === 0) break;
    for (const v of vendors) {
      const name = (v.display_name ?? v.displayName ?? v.name ?? '').toLowerCase().trim();
      if (name) {
        existingNames.add(name);
        existingByName.set(name, v.id);
      }
    }
    if (vendors.length < pageSize) break;
    page++;
  }
  log('INFO', `Found ${existingNames.size} existing vendors in BigCapital.`);

  // 4. Create vendors
  const outputMap: Record<string, number> = {};
  let created = 0;
  let skippedExisting = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const { qboId, payload } of mapped) {
    const nameKey = payload.displayName.toLowerCase();

    if (existingNames.has(nameKey)) {
      const existingId = existingByName.get(nameKey);
      if (existingId != null) outputMap[qboId] = existingId;
      log('REUSED', `"${payload.displayName}" already exists (id=${existingId})`);
      skippedExisting++;
      continue;
    }

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/vendors', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on "${payload.displayName}": ${result.raw}`);
      console.error('Aborting due to server error.');
      process.exit(1);
    }

    if (!result.ok) {
      log('ERROR', `${result.status} on "${payload.displayName}" (QBO ${qboId}): ${result.raw}`);
      failed++;
      failures.push(`QBO ${qboId} "${payload.displayName}": ${result.status} ${result.raw.slice(0, 120)}`);
      continue;
    }

    const newId: number = result.data?.vendor?.id ?? result.data?.id ?? result.data;
    outputMap[qboId] = newId;
    existingNames.add(nameKey);
    existingByName.set(nameKey, newId);
    log('CREATED', `"${payload.displayName}" → BigCap id ${newId}`);
    created++;

    // Persist output map incrementally (crash-safe)
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'vendor_qbo_to_bigcap_map.json'),
      JSON.stringify(outputMap, null, 2),
    );
  }

  log('INFO', `Done: created=${created} reused=${skippedExisting} skipped-invalid=${skippedInvalid} failed=${failed}`);
  if (failures.length > 0) {
    log('WARN', 'Failures:');
    for (const f of failures) log('ERROR', f);
  }

  // 5. Final artifact write
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vendor_qbo_to_bigcap_map.json'),
    JSON.stringify(outputMap, null, 2),
  );
  log('INFO', `Wrote vendor_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-vendors-${timestamp}.log`), logLines.join('\n') + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

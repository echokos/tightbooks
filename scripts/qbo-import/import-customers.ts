/**
 * Import QBO customers into BigCapital (Tightbooks).
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-customers.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_EMAIL=assist@majorimpact.com \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/import-customers.ts
 *
 * Env vars:
 *   TIGHTBOOKS_API_BASE   (default: https://app.tightbooks.com/api)
 *   TIGHTBOOKS_EMAIL      (default: assist@majorimpact.com)
 *   TIGHTBOOKS_PASSWORD   (required in non-dry-run)
 *   QBO_EXPORT_DIR        (default: /home/elliott/nanoclaw/groups/maggie/exports/qbo)
 *   DRY_RUN               (default: true)
 *   CUTOFF_DATE           (default: read from MANIFEST.json, fallback 2026-04-15)
 *
 * Outputs (scripts/qbo-import/output/):
 *   customer_qbo_to_bigcap_map.json   — { "<QBO Id>": <BigCapital id>, ... }
 *   run-customers-<timestamp>.log
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
const REQUEST_DELAY_MS = 50;

const OUTPUT_DIR = path.join(__dirname, 'output');

// Read cutoff date from MANIFEST.json, or use env override, or fallback
function readCutoffDate(): string {
  if (process.env.CUTOFF_DATE) return process.env.CUTOFF_DATE;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(QBO_DIR, 'MANIFEST.json'), 'utf8'));
    if (manifest.export_cutoff) return manifest.export_cutoff;
  } catch {
    // ignore
  }
  return '2026-04-15';
}

const CUTOFF_DATE = readCutoffDate();

// ── Types ───────────────────────────────────────────────────────────────────
interface QboAddress {
  Id?: string;
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
  Country?: string;
}

interface QboCustomer {
  Id: string;
  DisplayName?: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address?: string };
  PrimaryPhone?: { FreeFormNumber?: string };
  Mobile?: { FreeFormNumber?: string };
  WebAddr?: { URI?: string };
  BillAddr?: QboAddress;
  ShipAddr?: QboAddress;
  Notes?: string;
  Active?: boolean;
  Balance?: number;
  CurrencyRef?: { value?: string };
}

interface CustomerPayload {
  displayName: string;
  customerType: string;
  currencyCode: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  workPhone?: string;
  personalPhone?: string;
  website?: string;
  note?: string;
  active?: boolean;
  openingBalance?: number;
  openingBalanceAt?: string;
  openingBalanceExchangeRate?: number;
  // billing address
  billingAddress1?: string;
  billingAddress2?: string;
  billingAddressCity?: string;
  billingAddressState?: string;
  billingAddressPostcode?: string;
  billingAddressCountry?: string;
  // shipping address
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingAddressCity?: string;
  shippingAddressState?: string;
  shippingAddressPostcode?: string;
  shippingAddressCountry?: string;
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

function mapAddress(addr: QboAddress, prefix: 'billing' | 'shipping'): Partial<CustomerPayload> {
  const out: Partial<CustomerPayload> = {};
  if (!addr.Line1) return out;

  if (prefix === 'billing') {
    out.billingAddress1 = addr.Line1;
    if (addr.Line2) out.billingAddress2 = addr.Line2;
    if (addr.City) out.billingAddressCity = addr.City;
    if (addr.CountrySubDivisionCode) out.billingAddressState = addr.CountrySubDivisionCode;
    if (addr.PostalCode) out.billingAddressPostcode = addr.PostalCode;
    if (addr.Country) out.billingAddressCountry = addr.Country;
  } else {
    out.shippingAddress1 = addr.Line1;
    if (addr.Line2) out.shippingAddress2 = addr.Line2;
    if (addr.City) out.shippingAddressCity = addr.City;
    if (addr.CountrySubDivisionCode) out.shippingAddressState = addr.CountrySubDivisionCode;
    if (addr.PostalCode) out.shippingAddressPostcode = addr.PostalCode;
    if (addr.Country) out.shippingAddressCountry = addr.Country;
  }
  return out;
}

// ── Map QBO customer to BigCapital payload ────────────────────────────────────
function mapCustomer(c: QboCustomer): CustomerPayload | null {
  const displayName = c.DisplayName?.trim();
  if (!displayName) {
    log('SKIPPED', `QBO Id=${c.Id} has no DisplayName — skipping.`);
    return null;
  }

  // Currency guard
  if (c.CurrencyRef?.value && c.CurrencyRef.value !== 'USD') {
    log('ERROR', `QBO Id=${c.Id} "${displayName}": non-USD currency "${c.CurrencyRef.value}" — aborting. Multi-currency is out of scope.`);
    process.exit(1);
  }

  const customerType = c.CompanyName?.trim() ? 'business' : 'individual';
  log('INFO', `QBO Id=${c.Id} "${displayName}" classified as ${customerType}.`);

  const payload: CustomerPayload = {
    displayName,
    customerType,
    currencyCode: 'USD',
  };

  if (c.CompanyName) payload.companyName = c.CompanyName;
  if (c.GivenName) payload.firstName = c.GivenName;
  if (c.FamilyName) payload.lastName = c.FamilyName;
  if (c.Active === false) payload.active = false;
  if (c.WebAddr?.URI) payload.website = c.WebAddr.URI;
  if (c.Notes) payload.note = c.Notes;

  // Phone
  const workPhone = c.PrimaryPhone?.FreeFormNumber;
  if (workPhone) payload.workPhone = workPhone;
  const mobilePhone = c.Mobile?.FreeFormNumber;
  if (mobilePhone) payload.personalPhone = mobilePhone;

  // Email — validate before including
  const emailAddr = c.PrimaryEmailAddr?.Address?.trim();
  if (emailAddr) {
    if (isValidEmail(emailAddr)) {
      payload.email = emailAddr;
    } else {
      log('WARN', `QBO Id=${c.Id} "${displayName}": invalid email "${emailAddr}" — omitting email field.`);
    }
  }

  // Opening balance
  const balance = typeof c.Balance === 'number' ? c.Balance : 0;
  if (balance > 0) {
    payload.openingBalance = balance;
    payload.openingBalanceAt = CUTOFF_DATE;
    payload.openingBalanceExchangeRate = 1.0;
  }

  // Billing address
  if (c.BillAddr) {
    Object.assign(payload, mapAddress(c.BillAddr, 'billing'));
  }

  // Shipping address
  if (c.ShipAddr) {
    Object.assign(payload, mapAddress(c.ShipAddr, 'shipping'));
  }

  return payload;
}

// ── AR reconcile ─────────────────────────────────────────────────────────────
function reconcileAR(customers: QboCustomer[], invoiceSourcePath: string): void {
  const customerBalanceTotal = customers
    .filter((c) => typeof c.Balance === 'number' && c.Balance > 0)
    .reduce((sum, c) => sum + (c.Balance as number), 0);

  let invoiceBalanceTotal = 0;
  try {
    const rawInvoices = JSON.parse(fs.readFileSync(invoiceSourcePath, 'utf8'));
    const invoices: any[] =
      rawInvoices?.QueryResponse?.Invoice ??
      rawInvoices?.Invoice ??
      (Array.isArray(rawInvoices) ? rawInvoices : []);
    invoiceBalanceTotal = invoices
      .filter((i) => typeof i.Balance === 'number' && i.Balance > 0)
      .reduce((sum, i) => sum + i.Balance, 0);
  } catch (err) {
    log('WARN', `Could not read invoice source at ${invoiceSourcePath}: ${err}. Skipping AR reconcile.`);
    return;
  }

  const customerRounded = Math.round(customerBalanceTotal * 100) / 100;
  const invoiceRounded = Math.round(invoiceBalanceTotal * 100) / 100;

  log('INFO', `AR reconcile: sum(customer.Balance > 0) = ${customerRounded}, sum(invoice.Balance > 0) = ${invoiceRounded}`);

  if (customerRounded !== invoiceRounded) {
    log('ERROR', `AR mismatch: customers=${customerRounded} vs invoices=${invoiceRounded}. Source exports are out of sync — aborting to prevent silent AR drop.`);
    process.exit(1);
  }

  log('INFO', `AR reconcile passed: both sides = ${customerRounded}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) {
    log('INFO', 'DRY RUN mode — no customers will be created.');
  }
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD is required for a real run.');
    process.exit(1);
  }

  log('INFO', `Using cutoff date: ${CUTOFF_DATE}`);

  // 1. Load customer source
  const sourcePath = path.join(QBO_DIR, 'customers_raw.json');
  const rawData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const qboCustomers: QboCustomer[] =
    rawData?.QueryResponse?.Customer ??
    rawData?.Customer ??
    (Array.isArray(rawData) ? rawData : []);
  log('INFO', `Loaded ${qboCustomers.length} customers from ${sourcePath}`);

  // 2. Filter active customers
  const activeCustomers = qboCustomers.filter((c) => c.Active !== false);
  log('INFO', `Active customers: ${activeCustomers.length}`);

  // 3. AR reconcile
  const invoiceSourcePath = path.join(QBO_DIR, 'invoice_raw.json');
  reconcileAR(activeCustomers, invoiceSourcePath);

  // 4. Map to payloads
  const mapped: Array<{ qboId: string; payload: CustomerPayload }> = [];
  const seenDisplayNames = new Set<string>();
  let skippedInvalid = 0;

  for (const c of activeCustomers) {
    const payload = mapCustomer(c);
    if (!payload) {
      skippedInvalid++;
      continue;
    }
    const dedupKey = payload.displayName.toLowerCase();
    if (seenDisplayNames.has(dedupKey)) {
      log('WARN', `QBO Id=${c.Id} "${payload.displayName}": duplicate displayName in source — skipping.`);
      skippedInvalid++;
      continue;
    }
    seenDisplayNames.add(dedupKey);
    mapped.push({ qboId: c.Id, payload });
  }

  log('INFO', `Mapped: ${mapped.length} valid, ${skippedInvalid} skipped-invalid`);

  // Show opening-balance customers
  const withBalance = mapped.filter((m) => m.payload.openingBalance != null);
  const balanceTotal = withBalance.reduce((s, m) => s + (m.payload.openingBalance ?? 0), 0);
  log('INFO', `Opening balance customers: ${withBalance.length}, total: ${Math.round(balanceTotal * 100) / 100}`);
  for (const { qboId, payload } of withBalance) {
    log('INFO', `  QBO ${qboId} "${payload.displayName}": openingBalance=${payload.openingBalance} at ${payload.openingBalanceAt}`);
  }

  if (DRY_RUN) {
    log('DRY', 'Dry run complete. Summary:');
    for (const { qboId, payload } of mapped) {
      log('DRY', `  QBO ${qboId} "${payload.displayName}" (${payload.customerType}) balance=${payload.openingBalance ?? 0}`);
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(OUTPUT_DIR, `run-customers-${timestamp}.log`), logLines.join('\n') + '\n');
    return;
  }

  // 5. Auth + get existing customers for idempotency
  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // Paginate existing customers
  const existingNames = new Set<string>();
  const existingByName = new Map<string, number>(); // nameLower → bigcapId
  let page = 1;
  const pageSize = 200;
  while (true) {
    const resp = await client.get<any>(`/customers?page=${page}&pageSize=${pageSize}`);
    const customers: any[] = Array.isArray(resp) ? resp : (resp?.customers ?? resp?.data ?? []);
    if (customers.length === 0) break;
    for (const cu of customers) {
      const name = (cu.display_name ?? cu.displayName ?? cu.name ?? '').toLowerCase().trim();
      if (name) {
        existingNames.add(name);
        existingByName.set(name, cu.id);
      }
    }
    if (customers.length < pageSize) break;
    page++;
  }
  log('INFO', `Found ${existingNames.size} existing customers in BigCapital.`);

  // 6. Create customers
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
    const result = await client.post<any>('/customers', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on "${payload.displayName}": ${result.raw}`);
      console.error('Aborting due to server error.');
      process.exit(1);
    }

    if (!result.ok) {
      log('ERROR', `${result.status} on "${payload.displayName}" (QBO ${qboId}): ${result.raw}`);
      failed++;
      failures.push(`QBO ${qboId} "${payload.displayName}": ${result.status} ${result.raw.slice(0, 200)}`);
      continue;
    }

    const newId: number = result.data?.customer?.id ?? result.data?.id ?? result.data;
    outputMap[qboId] = newId;
    existingNames.add(nameKey);
    existingByName.set(nameKey, newId);
    const balanceNote = payload.openingBalance ? ` [openingBalance=${payload.openingBalance}]` : '';
    log('CREATED', `"${payload.displayName}" → BigCap id ${newId}${balanceNote}`);
    created++;

    // Persist output map incrementally (crash-safe)
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'customer_qbo_to_bigcap_map.json'),
      JSON.stringify(outputMap, null, 2),
    );
  }

  log('INFO', `Done: created=${created} reused=${skippedExisting} skipped-invalid=${skippedInvalid} failed=${failed} opening-balance-set=${withBalance.length}`);
  if (failures.length > 0) {
    log('WARN', 'Failures:');
    for (const f of failures) log('ERROR', f);
  }

  // 7. Final artifact write
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'customer_qbo_to_bigcap_map.json'),
    JSON.stringify(outputMap, null, 2),
  );
  log('INFO', `Wrote customer_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-customers-${timestamp}.log`), logLines.join('\n') + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

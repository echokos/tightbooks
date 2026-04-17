/**
 * Import QBO invoices into BigCapital as sale invoices.
 *
 * Source: invoice_raw.json (190 records)
 * Target: POST /api/sale-invoices
 *
 * Prerequisites: seed-items.ts, import-customers.ts must have run.
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-invoices.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/import-invoices.ts
 *
 * Outputs (scripts/qbo-import/output/):
 *   invoice_qbo_to_bigcap_map.json  — { "<QBO Id>": <BigCapital id>, ... }
 *   run-invoices-<timestamp>.log
 *
 * Idempotency: referenceNo = "QBO-INV-<DocNumber|Id>"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TightbooksApiClient } from './lib/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.TIGHTBOOKS_API_BASE ?? 'https://app.tightbooks.com/api';
const EMAIL = process.env.TIGHTBOOKS_EMAIL ?? 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';
const QBO_DIR = process.env.QBO_EXPORT_DIR ?? '/home/elliott/nanoclaw/groups/maggie/exports/qbo';
const DRY_RUN = process.env.DRY_RUN !== 'false';
const REQUEST_DELAY_MS = 500;

const OUTPUT_DIR = path.join(__dirname, 'output');

const logLines: string[] = [];
function log(level: 'INFO' | 'WARN' | 'ERROR' | 'CREATED' | 'REUSED' | 'SKIPPED' | 'DRY', msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

function flushLog(ts: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-invoices-${ts}.log`), logLines.join('\n') + '\n');
}

async function main() {
  if (DRY_RUN) log('INFO', 'DRY RUN mode — no invoices will be created.');
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD required.');
    process.exit(1);
  }

  // Load source
  const raw = JSON.parse(fs.readFileSync(path.join(QBO_DIR, 'invoice_raw.json'), 'utf8'));
  const invoices: any[] = raw?.QueryResponse?.Invoice ?? [];
  log('INFO', `Loaded ${invoices.length} invoices`);

  // Load maps
  const accountMap: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, 'qbo_to_bigcap_account_map.json'), 'utf8'),
  );
  const customerMap: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, 'customer_qbo_to_bigcap_map.json'), 'utf8'),
  );
  const itemMapPath = path.join(OUTPUT_DIR, 'item_qbo_to_bigcap_map.json');
  if (!fs.existsSync(itemMapPath)) {
    if (!DRY_RUN) {
      console.error('item_qbo_to_bigcap_map.json not found — run seed-items.ts first.');
      process.exit(1);
    }
    log('WARN', 'item_qbo_to_bigcap_map.json not found — item resolution will be skipped in dry run.');
  }
  const itemMap: Record<string, number> = fs.existsSync(itemMapPath)
    ? JSON.parse(fs.readFileSync(itemMapPath, 'utf8'))
    : {};
  log('INFO', `Loaded customer map (${Object.keys(customerMap).length}), item map (${Object.keys(itemMap).length})`);

  // Sort chronologically
  const sorted = [...invoices].sort((a, b) => (a.TxnDate ?? '').localeCompare(b.TxnDate ?? ''));

  if (DRY_RUN) {
    let skipped = 0;
    for (const inv of sorted) {
      const customerId = customerMap[inv.CustomerRef?.value];
      if (!customerId) {
        log('WARN', `Invoice QBO-${inv.Id} (${inv.DocNumber}): customer QBO-${inv.CustomerRef?.value} (${inv.CustomerRef?.name}) not in map — would skip`);
        skipped++;
      }
      for (const line of inv.Line ?? []) {
        const detail = line.SalesItemLineDetail;
        if (!detail?.ItemRef?.value) continue;
        if (!itemMap[detail.ItemRef.value]) {
          log('WARN', `Invoice QBO-${inv.Id}: item QBO-${detail.ItemRef.value} (${detail.ItemRef.name}) not in map`);
        }
      }
    }
    log('DRY', `Would create ${sorted.length - skipped} invoices (${skipped} skipped for missing customer).`);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    flushLog(ts);
    return;
  }

  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // Load existing invoices for idempotency
  const existingRefs = new Set<string>();
  const existingRefMap = new Map<string, number>();
  {
    let page = 1;
    while (true) {
      const resp = await client.get<any>(`/sale-invoices?page=${page}&pageSize=100`);
      const invs: any[] = resp?.sales_invoices ?? [];
      if (invs.length === 0) break;
      for (const inv of invs) {
        const ref = inv.reference_no ?? '';
        if (ref) { existingRefs.add(ref); existingRefMap.set(ref, inv.id); }
      }
      if (invs.length < 100) break;
      page++;
    }
    log('INFO', `Existing invoices with ref: ${existingRefs.size}`);
  }

  // Load or init output map
  const outputMapPath = path.join(OUTPUT_DIR, 'invoice_qbo_to_bigcap_map.json');
  let outputMap: Record<string, number> = {};
  if (fs.existsSync(outputMapPath)) {
    outputMap = JSON.parse(fs.readFileSync(outputMapPath, 'utf8'));
    log('INFO', `Loaded existing output map: ${Object.keys(outputMap).length} entries`);
  }

  let created = 0; let reused = 0; let failed = 0; let skipped = 0;
  const failures: string[] = [];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  for (const inv of sorted) {
    const refNo = `QBO-INV-${inv.DocNumber ?? inv.Id}`;

    // Idempotency check
    if (existingRefs.has(refNo)) {
      const id = existingRefMap.get(refNo);
      if (id) outputMap[inv.Id] = id;
      log('REUSED', `${refNo} already exists (id=${id})`);
      reused++;
      continue;
    }
    if (outputMap[inv.Id]) {
      log('REUSED', `QBO-${inv.Id} in output map (id=${outputMap[inv.Id]})`);
      reused++;
      continue;
    }

    // Resolve customer
    const customerId = customerMap[inv.CustomerRef?.value];
    if (!customerId) {
      log('SKIPPED', `Invoice QBO-${inv.Id}: customer QBO-${inv.CustomerRef?.value} (${inv.CustomerRef?.name}) not mapped`);
      skipped++;
      continue;
    }

    // Build entries
    const entries: any[] = [];
    let entryIdx = 0;
    for (const line of inv.Line ?? []) {
      const detail = line.SalesItemLineDetail;
      if (!detail) continue; // skip subtotals and discount lines

      const qboItemId = detail.ItemRef?.value;
      if (!qboItemId) continue;

      let itemId = itemMap[qboItemId];
      if (!itemId) {
        log('WARN', `Invoice QBO-${inv.Id}: item QBO-${qboItemId} (${detail.ItemRef?.name}) not in item map — skipping line`);
        continue;
      }

      entries.push({
        index: entryIdx++,
        itemId,
        quantity: detail.Qty ?? 1,
        rate: detail.UnitPrice ?? line.Amount ?? 0,
        description: line.Description?.slice(0, 255),
      });
    }

    if (entries.length === 0) {
      log('SKIPPED', `Invoice QBO-${inv.Id}: no valid entries — skipping`);
      skipped++;
      continue;
    }

    // Due date fallback: invoice date + 30 days
    const invoiceDate = inv.TxnDate;
    const dueDate = inv.DueDate ?? new Date(new Date(invoiceDate).getTime() + 30 * 86400000).toISOString().split('T')[0];

    const payload: Record<string, unknown> = {
      customerId,
      invoiceDate,
      dueDate,
      referenceNo: refNo,
      entries,
      delivered: true, // historical - already delivered
    };
    if (inv.DocNumber) payload.invoiceNo = inv.DocNumber;
    if (inv.CustomerMemo?.value) payload.invoiceMessage = inv.CustomerMemo.value.slice(0, 500);

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/sale-invoices', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on QBO-${inv.Id}: ${result.raw.slice(0, 200)}`);
      flushLog(ts);
      process.exit(1);
    }
    if (!result.ok) {
      log('ERROR', `${result.status} on QBO-${inv.Id}: ${result.raw.slice(0, 200)}`);
      failed++;
      failures.push(`QBO ${inv.Id}: ${result.status} ${result.raw.slice(0, 120)}`);
      continue;
    }

    const newId: number = result.data?.saleInvoice?.id ?? result.data?.id ?? result.data;
    outputMap[inv.Id] = newId;
    log('CREATED', `Invoice QBO-${inv.Id} (${inv.DocNumber}) → BigCap id=${newId}`);
    created++;

    if (created % 20 === 0) {
      fs.writeFileSync(outputMapPath, JSON.stringify(outputMap, null, 2));
      flushLog(ts);
    }
  }

  log('INFO', `Done: created=${created} reused=${reused} skipped=${skipped} failed=${failed}`);
  if (failures.length > 0) for (const f of failures) log('ERROR', f);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputMapPath, JSON.stringify(outputMap, null, 2));
  log('INFO', `Wrote invoice_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);
  flushLog(ts);
}

main().catch((err) => { console.error(err); process.exit(1); });

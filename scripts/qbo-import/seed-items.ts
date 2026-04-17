/**
 * Seed QBO items (services/products) into BigCapital.
 *
 * Extracts unique items from invoice_raw.json + salesreceipt_raw.json.
 * Required before import-invoices.ts and import-sale-receipts.ts.
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/seed-items.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/seed-items.ts
 *
 * Outputs (scripts/qbo-import/output/):
 *   item_qbo_to_bigcap_map.json  — { "<QBO ItemRef.value>": <BigCapital item id>, ... }
 *   run-items-<timestamp>.log
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
const REQUEST_DELAY_MS = 1200;

const OUTPUT_DIR = path.join(__dirname, 'output');

const logLines: string[] = [];
function log(level: 'INFO' | 'WARN' | 'ERROR' | 'CREATED' | 'REUSED' | 'DRY', msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

interface QboItemRef {
  qboId: string;
  name: string;
  accountQboId?: string;
  accountName?: string;
}

function extractItems(filePath: string, txnKey: string, lineDetailKey: string): QboItemRef[] {
  const items = new Map<string, QboItemRef>();
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const txns: any[] = raw?.QueryResponse?.[txnKey] ?? [];
  for (const txn of txns) {
    for (const line of txn.Line ?? []) {
      const detail = line[lineDetailKey];
      if (!detail) continue;
      const ref = detail.ItemRef;
      if (!ref?.value) continue;
      const accountRef = detail.ItemAccountRef;
      items.set(ref.value, {
        qboId: ref.value,
        name: ref.name ?? ref.value,
        accountQboId: accountRef?.value,
        accountName: accountRef?.name,
      });
    }
  }
  return [...items.values()];
}

async function main() {
  if (DRY_RUN) log('INFO', 'DRY RUN mode — no items will be created.');
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD is required for a real run.');
    process.exit(1);
  }

  // Extract items from invoices + receipts
  const invoiceItems = extractItems(
    path.join(QBO_DIR, 'invoice_raw.json'),
    'Invoice',
    'SalesItemLineDetail',
  );
  const receiptItems = extractItems(
    path.join(QBO_DIR, 'salesreceipt_raw.json'),
    'SalesReceipt',
    'SalesItemLineDetail',
  );

  // Merge by qboId
  const allItems = new Map<string, QboItemRef>();
  for (const item of [...invoiceItems, ...receiptItems]) {
    allItems.set(item.qboId, item);
  }
  log('INFO', `Unique QBO items found: ${allItems.size}`);
  for (const item of allItems.values()) {
    log('INFO', `  QBO Id=${item.qboId} Name="${item.name}" AccountRef=${item.accountQboId ?? '?'}`);
  }

  // Load account map for sell_account_id
  const accountMapPath = path.join(OUTPUT_DIR, 'qbo_to_bigcap_account_map.json');
  const accountMap: Record<string, number> = JSON.parse(fs.readFileSync(accountMapPath, 'utf8'));

  if (DRY_RUN) {
    let unmapped = 0;
    for (const item of allItems.values()) {
      if (item.accountQboId && !accountMap[item.accountQboId]) {
        log('WARN', `Item "${item.name}": unmapped account QBO-${item.accountQboId} (${item.accountName})`);
        unmapped++;
      }
    }
    log('DRY', `Would create/reuse ${allItems.size} items. ${unmapped} unmapped accounts (will skip sell_account_id).`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, `run-items-${timestamp}.log`), logLines.join('\n') + '\n');
    return;
  }

  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // Fetch existing items for idempotency
  const existingByName = new Map<string, number>(); // nameLower → id
  {
    let page = 1;
    const pageSize = 200;
    while (true) {
      const resp = await client.get<any>(`/items?page=${page}&pageSize=${pageSize}`);
      const items: any[] = resp?.items ?? [];
      if (items.length === 0) break;
      for (const item of items) {
        const name = (item.name ?? '').toLowerCase();
        if (name) existingByName.set(name, item.id);
      }
      if (items.length < pageSize) break;
      page++;
    }
    log('INFO', `Found ${existingByName.size} existing items in BigCapital.`);
  }

  const outputMap: Record<string, number> = {};
  let created = 0;
  let reused = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const item of allItems.values()) {
    const nameKey = item.name.toLowerCase();
    if (existingByName.has(nameKey)) {
      const id = existingByName.get(nameKey)!;
      outputMap[item.qboId] = id;
      log('REUSED', `"${item.name}" already exists (id=${id})`);
      reused++;
      continue;
    }

    const sellAccountId = item.accountQboId ? accountMap[item.accountQboId] : undefined;
    const payload: Record<string, unknown> = {
      name: item.name,
      type: 'service',
      sellable: true,
      purchasable: false,
    };
    if (sellAccountId) {
      payload.sellAccountId = sellAccountId;
      payload.sellDescription = item.name;
    }

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/items', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on "${item.name}": ${result.raw}`);
      process.exit(1);
    }
    if (!result.ok) {
      log('ERROR', `${result.status} on "${item.name}": ${result.raw.slice(0, 200)}`);
      failed++;
      failures.push(`QBO ${item.qboId} "${item.name}": ${result.status}`);
      continue;
    }

    const newId: number = result.data?.item?.id ?? result.data?.id ?? result.data;
    outputMap[item.qboId] = newId;
    existingByName.set(nameKey, newId);
    log('CREATED', `"${item.name}" → BigCap item id ${newId}`);
    created++;
  }

  log('INFO', `Done: created=${created} reused=${reused} failed=${failed}`);
  if (failures.length > 0) {
    log('WARN', 'Failures:');
    for (const f of failures) log('ERROR', f);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'item_qbo_to_bigcap_map.json'),
    JSON.stringify(outputMap, null, 2),
  );
  log('INFO', `Wrote item_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-items-${timestamp}.log`), logLines.join('\n') + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

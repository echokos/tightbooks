/**
 * Import QBO sales receipts into BigCapital.
 *
 * Source: salesreceipt_raw.json (62 records)
 * Target: POST /api/sale-receipts
 *
 * Prerequisites: seed-items.ts, import-customers.ts must have run.
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-sale-receipts.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/import-sale-receipts.ts
 *
 * Outputs:
 *   receipt_qbo_to_bigcap_map.json
 *   run-sale-receipts-<timestamp>.log
 *
 * Deposit account mapping:
 *   QBO Undeposited Funds (Id=4) → BigCap Undeposited Funds (id=1002)
 *   Other accounts → resolved via account map
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
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-sale-receipts-${ts}.log`), logLines.join('\n') + '\n');
}

async function main() {
  if (DRY_RUN) log('INFO', 'DRY RUN mode — no receipts will be created.');
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD required.');
    process.exit(1);
  }

  // Load source
  const raw = JSON.parse(fs.readFileSync(path.join(QBO_DIR, 'salesreceipt_raw.json'), 'utf8'));
  const receipts: any[] = raw?.QueryResponse?.SalesReceipt ?? [];
  log('INFO', `Loaded ${receipts.length} sale receipts`);

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
    log('WARN', 'item_qbo_to_bigcap_map.json not found — item resolution skipped in dry run.');
  }
  const itemMap: Record<string, number> = fs.existsSync(itemMapPath)
    ? JSON.parse(fs.readFileSync(itemMapPath, 'utf8'))
    : {};

  const sorted = [...receipts].sort((a, b) => (a.TxnDate ?? '').localeCompare(b.TxnDate ?? ''));

  if (DRY_RUN) {
    let skipped = 0;
    for (const r of sorted) {
      if (!customerMap[r.CustomerRef?.value]) {
        log('WARN', `Receipt QBO-${r.Id}: customer QBO-${r.CustomerRef?.value} not mapped — would skip`);
        skipped++;
      }
      const depositQboId = r.DepositToAccountRef?.value;
      if (depositQboId && !accountMap[depositQboId]) {
        log('WARN', `Receipt QBO-${r.Id}: deposit account QBO-${depositQboId} not in map`);
      }
    }
    log('DRY', `Would create ${sorted.length - skipped} receipts.`);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    flushLog(ts);
    return;
  }

  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // Load existing for idempotency
  const existingRefs = new Set<string>();
  const existingRefMap = new Map<string, number>();
  {
    let page = 1;
    while (true) {
      const resp = await client.get<any>(`/sale-receipts?page=${page}&pageSize=100`);
      const rs: any[] = resp?.data ?? [];
      if (rs.length === 0) break;
      for (const r of rs) {
        const ref = r.reference_no ?? '';
        if (ref) { existingRefs.add(ref); existingRefMap.set(ref, r.id); }
      }
      if (rs.length < 100) break;
      page++;
    }
    log('INFO', `Existing receipts with ref: ${existingRefs.size}`);
  }

  const outputMapPath = path.join(OUTPUT_DIR, 'receipt_qbo_to_bigcap_map.json');
  let outputMap: Record<string, number> = {};
  if (fs.existsSync(outputMapPath)) {
    outputMap = JSON.parse(fs.readFileSync(outputMapPath, 'utf8'));
  }

  let created = 0; let reused = 0; let failed = 0; let skipped = 0;
  const failures: string[] = [];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  // Undeposited Funds: QBO Id=4 → BigCap id=1002
  const UNDEPOSITED_FUNDS_ID = 1002;

  for (const receipt of sorted) {
    const refNo = `QBO-RCPT-${receipt.DocNumber ?? receipt.Id}`;

    if (existingRefs.has(refNo)) {
      const id = existingRefMap.get(refNo);
      if (id) outputMap[receipt.Id] = id;
      log('REUSED', `${refNo} already exists (id=${id})`);
      reused++;
      continue;
    }
    if (outputMap[receipt.Id]) {
      log('REUSED', `QBO-${receipt.Id} in output map`);
      reused++;
      continue;
    }

    // Resolve customer
    const customerId = customerMap[receipt.CustomerRef?.value];
    if (!customerId) {
      log('SKIPPED', `Receipt QBO-${receipt.Id}: customer QBO-${receipt.CustomerRef?.value} not mapped`);
      skipped++;
      continue;
    }

    // Deposit account
    const depositQboId = receipt.DepositToAccountRef?.value;
    let depositAccountId: number;
    if (depositQboId === '4') {
      depositAccountId = UNDEPOSITED_FUNDS_ID;
    } else if (depositQboId && accountMap[depositQboId]) {
      depositAccountId = accountMap[depositQboId];
    } else {
      depositAccountId = UNDEPOSITED_FUNDS_ID;
      if (depositQboId) log('WARN', `Receipt QBO-${receipt.Id}: deposit account QBO-${depositQboId} not mapped — using Undeposited Funds`);
    }

    // Build entries
    const entries: any[] = [];
    let idx = 0;
    for (const line of receipt.Line ?? []) {
      const detail = line.SalesItemLineDetail;
      if (!detail?.ItemRef?.value) continue;
      const itemId = itemMap[detail.ItemRef.value];
      if (!itemId) {
        log('WARN', `Receipt QBO-${receipt.Id}: item QBO-${detail.ItemRef.value} (${detail.ItemRef.name}) not mapped — skipping line`);
        continue;
      }
      entries.push({
        index: idx++,
        itemId,
        quantity: detail.Qty ?? 1,
        rate: detail.UnitPrice ?? line.Amount ?? 0,
        description: line.Description?.slice(0, 255),
      });
    }

    if (entries.length === 0) {
      log('SKIPPED', `Receipt QBO-${receipt.Id}: no valid entries`);
      skipped++;
      continue;
    }

    const payload: Record<string, unknown> = {
      customerId,
      depositAccountId,
      receiptDate: receipt.TxnDate,
      referenceNo: refNo,
      entries,
      closed: true, // historical receipts are closed
    };

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/sale-receipts', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on QBO-${receipt.Id}: ${result.raw.slice(0, 200)}`);
      flushLog(ts);
      process.exit(1);
    }
    if (!result.ok) {
      log('ERROR', `${result.status} on QBO-${receipt.Id}: ${result.raw.slice(0, 200)}`);
      failed++;
      failures.push(`QBO ${receipt.Id}: ${result.status} ${result.raw.slice(0, 120)}`);
      continue;
    }

    const newId: number = result.data?.saleReceipt?.id ?? result.data?.id ?? result.data;
    outputMap[receipt.Id] = newId;
    log('CREATED', `Receipt QBO-${receipt.Id} (${receipt.DocNumber}) → BigCap id=${newId}`);
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
  log('INFO', `Wrote receipt_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);
  flushLog(ts);
}

main().catch((err) => { console.error(err); process.exit(1); });

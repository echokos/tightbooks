/**
 * Import QBO credit memos into BigCapital as credit notes.
 *
 * Source: creditmemo_raw.json (3 records)
 * Target: POST /api/credit-notes
 *
 * Prerequisites: seed-items.ts, import-customers.ts must have run.
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-credit-notes.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/import-credit-notes.ts
 *
 * Outputs:
 *   credit_note_qbo_to_bigcap_map.json
 *   run-credit-notes-<timestamp>.log
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
const REQUEST_DELAY_MS = 1000;

const OUTPUT_DIR = path.join(__dirname, 'output');

const logLines: string[] = [];
function log(level: 'INFO' | 'WARN' | 'ERROR' | 'CREATED' | 'REUSED' | 'SKIPPED' | 'DRY', msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

async function main() {
  if (DRY_RUN) log('INFO', 'DRY RUN mode — no credit notes will be created.');
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD required.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(path.join(QBO_DIR, 'creditmemo_raw.json'), 'utf8'));
  const memos: any[] = raw?.QueryResponse?.CreditMemo ?? [];
  log('INFO', `Loaded ${memos.length} credit memos`);

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

  if (DRY_RUN) {
    for (const m of memos) {
      log('DRY', `CreditMemo QBO-${m.Id} (${m.TxnDate}) customer=${m.CustomerRef?.name} total=${m.TotalAmt}`);
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, `run-credit-notes-${ts}.log`), logLines.join('\n') + '\n');
    return;
  }

  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // Idempotency
  const existingRefs = new Set<string>();
  const existingRefMap = new Map<string, number>();
  {
    let page = 1;
    while (true) {
      const resp = await client.get<any>(`/credit-notes?page=${page}&pageSize=100`);
      const cns: any[] = resp?.credit_notes ?? [];
      if (cns.length === 0) break;
      for (const cn of cns) {
        const ref = cn.reference_no ?? cn.credit_note_no ?? '';
        if (ref) { existingRefs.add(ref); existingRefMap.set(ref, cn.id); }
      }
      if (cns.length < 100) break;
      page++;
    }
    log('INFO', `Existing credit notes: ${existingRefs.size}`);
  }

  const outputMapPath = path.join(OUTPUT_DIR, 'credit_note_qbo_to_bigcap_map.json');
  const outputMap: Record<string, number> = {};
  let created = 0; let reused = 0; let failed = 0; let skipped = 0;

  for (const memo of memos) {
    const refNo = `QBO-CM-${memo.DocNumber ?? memo.Id}`;

    if (existingRefs.has(refNo)) {
      const id = existingRefMap.get(refNo);
      if (id) outputMap[memo.Id] = id;
      log('REUSED', `${refNo} already exists (id=${id})`);
      reused++;
      continue;
    }

    const customerId = customerMap[memo.CustomerRef?.value];
    if (!customerId) {
      log('SKIPPED', `CreditMemo QBO-${memo.Id}: customer QBO-${memo.CustomerRef?.value} not mapped`);
      skipped++;
      continue;
    }

    // Build entries
    const entries: any[] = [];
    let idx = 0;
    for (const line of memo.Line ?? []) {
      const detail = line.SalesItemLineDetail;
      if (!detail?.ItemRef?.value) continue;
      const itemId = itemMap[detail.ItemRef.value];
      if (!itemId) {
        log('WARN', `CreditMemo QBO-${memo.Id}: item QBO-${detail.ItemRef.value} not mapped — skipping line`);
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
      log('SKIPPED', `CreditMemo QBO-${memo.Id}: no valid entries`);
      skipped++;
      continue;
    }

    const payload: Record<string, unknown> = {
      customerId,
      creditNoteDate: memo.TxnDate,
      referenceNo: refNo,
      entries,
      open: true,
    };

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/credit-notes', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on QBO-${memo.Id}: ${result.raw.slice(0, 200)}`);
      process.exit(1);
    }
    if (!result.ok) {
      log('ERROR', `${result.status} on QBO-${memo.Id}: ${result.raw.slice(0, 200)}`);
      failed++;
      continue;
    }

    const newId: number = result.data?.creditNote?.id ?? result.data?.id ?? result.data;
    outputMap[memo.Id] = newId;
    log('CREATED', `CreditMemo QBO-${memo.Id} → BigCap id=${newId}`);
    created++;
  }

  log('INFO', `Done: created=${created} reused=${reused} skipped=${skipped} failed=${failed}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputMapPath, JSON.stringify(outputMap, null, 2));
  log('INFO', `Wrote credit_note_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-credit-notes-${ts}.log`), logLines.join('\n') + '\n');
}

main().catch((err) => { console.error(err); process.exit(1); });

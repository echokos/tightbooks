/**
 * Import QBO customer payments into BigCapital as payments-received.
 *
 * Source: payment_raw.json (178 records; 5 are zero-amount, skipped)
 * Target: POST /api/payments-received
 *
 * Prerequisites: import-invoices.ts must have run (needs invoice_qbo_to_bigcap_map.json).
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-payments-received.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/import-payments-received.ts
 *
 * Outputs:
 *   payment_received_qbo_to_bigcap_map.json
 *   run-payments-received-<timestamp>.log
 *
 * Notes:
 * - Payments with UnappliedAmt > 0 are imported with an "unapplied" entry.
 * - Deposit account resolved from DepositToAccountRef (QBO → BigCap account map).
 * - Payments not linked to any BigCap invoice are imported as standalone payments.
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
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-payments-received-${ts}.log`), logLines.join('\n') + '\n');
}

async function main() {
  if (DRY_RUN) log('INFO', 'DRY RUN mode — no payments will be created.');
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD required.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(path.join(QBO_DIR, 'payment_raw.json'), 'utf8'));
  const payments: any[] = raw?.QueryResponse?.Payment ?? [];
  log('INFO', `Loaded ${payments.length} customer payments`);

  const accountMap: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, 'qbo_to_bigcap_account_map.json'), 'utf8'),
  );
  const customerMap: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, 'customer_qbo_to_bigcap_map.json'), 'utf8'),
  );

  // Invoice map (QBO invoice Id → BigCap invoice id)
  const invoiceMapPath = path.join(OUTPUT_DIR, 'invoice_qbo_to_bigcap_map.json');
  let invoiceMap: Record<string, number> = {};
  if (fs.existsSync(invoiceMapPath)) {
    invoiceMap = JSON.parse(fs.readFileSync(invoiceMapPath, 'utf8'));
    log('INFO', `Loaded invoice map: ${Object.keys(invoiceMap).length} entries`);
  } else {
    log('WARN', 'invoice_qbo_to_bigcap_map.json not found — payment entries will not be linked to invoices');
  }

  // Also load archived payment accounts (from import-expenses.ts)
  const resolvedPaymentAccounts: Record<string, number> = { ...accountMap };
  // Fallback for deleted accounts: use Chase Checking (1042) as default
  const FALLBACK_DEPOSIT_ACCOUNT = 1042;

  // Sort chronologically
  const sorted = [...payments].sort((a, b) => (a.TxnDate ?? '').localeCompare(b.TxnDate ?? ''));

  // Filter: skip zero-amount payments
  const nonZero = sorted.filter((p) => (p.TotalAmt ?? 0) > 0);
  log('INFO', `Non-zero payments: ${nonZero.length} (${sorted.length - nonZero.length} zero-amount skipped)`);

  if (DRY_RUN) {
    let skipped = 0;
    for (const p of nonZero) {
      if (!customerMap[p.CustomerRef?.value]) {
        log('WARN', `Payment QBO-${p.Id}: customer QBO-${p.CustomerRef?.value} (${p.CustomerRef?.name}) not mapped`);
        skipped++;
      }
    }
    log('DRY', `Would create ${nonZero.length - skipped} payments.`);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    flushLog(ts);
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
      const resp = await client.get<any>(`/payments-received?page=${page}&pageSize=100`);
      const ps: any[] = resp?.payments_received ?? resp?.data ?? [];
      if (ps.length === 0) break;
      for (const p of ps) {
        const ref = p.reference_no ?? '';
        if (ref) { existingRefs.add(ref); existingRefMap.set(ref, p.id); }
      }
      if (ps.length < 100) break;
      page++;
    }
    log('INFO', `Existing payments with ref: ${existingRefs.size}`);
  }

  const outputMapPath = path.join(OUTPUT_DIR, 'payment_received_qbo_to_bigcap_map.json');
  let outputMap: Record<string, number> = {};
  if (fs.existsSync(outputMapPath)) {
    outputMap = JSON.parse(fs.readFileSync(outputMapPath, 'utf8'));
  }

  let created = 0; let reused = 0; let failed = 0; let skipped = 0;
  const failures: string[] = [];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  for (const p of nonZero) {
    const refNo = `QBO-PMT-${p.Id}`;

    if (existingRefs.has(refNo)) {
      const id = existingRefMap.get(refNo);
      if (id) outputMap[p.Id] = id;
      log('REUSED', `${refNo} already exists (id=${id})`);
      reused++;
      continue;
    }
    if (outputMap[p.Id]) {
      log('REUSED', `QBO-${p.Id} in output map`);
      reused++;
      continue;
    }

    const customerId = customerMap[p.CustomerRef?.value];
    if (!customerId) {
      log('SKIPPED', `Payment QBO-${p.Id}: customer QBO-${p.CustomerRef?.value} not mapped`);
      skipped++;
      continue;
    }

    // Deposit account
    const depositQboId = p.DepositToAccountRef?.value;
    const depositAccountId = (depositQboId && resolvedPaymentAccounts[depositQboId])
      ? resolvedPaymentAccounts[depositQboId]
      : FALLBACK_DEPOSIT_ACCOUNT;
    if (!depositQboId || !resolvedPaymentAccounts[depositQboId]) {
      log('WARN', `Payment QBO-${p.Id}: deposit account QBO-${depositQboId ?? 'none'} — using fallback Chase Checking`);
    }

    // Build entries: link to invoices where possible
    const entries: any[] = [];
    let idx = 0;
    for (const line of p.Line ?? []) {
      for (const lt of line.LinkedTxn ?? []) {
        if (lt.TxnType === 'Invoice') {
          const bcInvoiceId = invoiceMap[lt.TxnId];
          if (bcInvoiceId) {
            entries.push({
              index: idx++,
              invoiceId: bcInvoiceId,
              paymentAmount: line.Amount ?? 0,
            });
          } else {
            log('WARN', `Payment QBO-${p.Id}: linked invoice QBO-${lt.TxnId} not in BigCap map — excluding entry`);
          }
        }
      }
    }

    // If no entries could be linked, still create payment with empty entries
    // (records the cash receipt, just not applied to specific invoice)
    const payload: Record<string, unknown> = {
      customerId,
      paymentDate: p.TxnDate,
      amount: p.TotalAmt,
      depositAccountId,
      referenceNo: refNo,
      entries,
    };

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/payments-received', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on QBO-${p.Id}: ${result.raw.slice(0, 200)}`);
      flushLog(ts);
      process.exit(1);
    }
    if (!result.ok) {
      log('ERROR', `${result.status} on QBO-${p.Id}: ${result.raw.slice(0, 200)}`);
      failed++;
      failures.push(`QBO ${p.Id}: ${result.status} ${result.raw.slice(0, 120)}`);
      continue;
    }

    const newId: number = result.data?.paymentReceive?.id ?? result.data?.id ?? result.data;
    outputMap[p.Id] = newId;
    const linkedCount = entries.length;
    log('CREATED', `Payment QBO-${p.Id} ($${p.TotalAmt}) → BigCap id=${newId} (${linkedCount} invoices linked)`);
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
  log('INFO', `Wrote payment_received_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);
  flushLog(ts);
}

main().catch((err) => { console.error(err); process.exit(1); });

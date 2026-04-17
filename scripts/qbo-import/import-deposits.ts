/**
 * Import QBO deposits into BigCapital as manual journal entries.
 *
 * Source: deposit_raw.json (550 records)
 * Target: POST /api/manual-journals
 *
 * QBO deposit types handled:
 *   1. DepositLineDetail entries (no LinkedTxn): direct bank income (Dr bank, Cr income)
 *   2. Linked to SalesReceipt/Payment: move from Undeposited Funds to bank (Dr bank, Cr UF)
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-deposits.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/import-deposits.ts
 *
 * Outputs:
 *   deposit_qbo_to_bigcap_map.json
 *   run-deposits-<timestamp>.log
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
const REQUEST_DELAY_MS = 400;

const OUTPUT_DIR = path.join(__dirname, 'output');

// BigCap account IDs
const UNDEPOSITED_FUNDS_ID = 1002;

const logLines: string[] = [];
function log(level: 'INFO' | 'WARN' | 'ERROR' | 'CREATED' | 'REUSED' | 'SKIPPED' | 'DRY', msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}
function flushLog(ts: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-deposits-${ts}.log`), logLines.join('\n') + '\n');
}

interface JournalEntry {
  index: number;
  accountId: number;
  credit?: number;
  debit?: number;
  note?: string;
}

async function main() {
  if (DRY_RUN) log('INFO', 'DRY RUN mode — no journals will be created.');
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD required.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(path.join(QBO_DIR, 'deposit_raw.json'), 'utf8'));
  const deposits: any[] = raw?.QueryResponse?.Deposit ?? [];
  log('INFO', `Loaded ${deposits.length} deposits`);

  const accountMap: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, 'qbo_to_bigcap_account_map.json'), 'utf8'),
  );

  // Sort chronologically
  const sorted = [...deposits].sort((a, b) => (a.TxnDate ?? '').localeCompare(b.TxnDate ?? ''));

  if (DRY_RUN) {
    let withDetail = 0; let withLinked = 0; let skipped = 0;
    for (const dep of sorted) {
      const allLinesLinked = dep.Line.every((l: any) => l.LinkedTxn?.length > 0);
      const hasDetail = dep.Line.some((l: any) => l.DepositLineDetail?.AccountRef?.value);
      if (hasDetail) withDetail++;
      else if (allLinesLinked) withLinked++;
      else {
        log('WARN', `Deposit QBO-${dep.Id}: no DepositLineDetail and no LinkedTxn — would skip`);
        skipped++;
      }
    }
    log('DRY', `Deposits: ${withDetail} direct income, ${withLinked} clearing (UF→bank), ${skipped} skipped`);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    flushLog(ts);
    return;
  }

  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // Idempotency: load existing manual journals by reference
  const existingRefs = new Set<string>();
  const existingRefMap = new Map<string, number>();
  {
    let page = 1;
    while (true) {
      const resp = await client.get<any>(`/manual-journals?page=${page}&pageSize=100`);
      const js: any[] = resp?.manual_journals ?? [];
      if (js.length === 0) break;
      for (const j of js) {
        const ref = j.journal_number ?? j.reference ?? '';
        if (ref) { existingRefs.add(ref); existingRefMap.set(ref, j.id); }
      }
      if (js.length < 100) break;
      page++;
    }
    log('INFO', `Existing manual journals with ref: ${existingRefs.size}`);
  }

  const outputMapPath = path.join(OUTPUT_DIR, 'deposit_qbo_to_bigcap_map.json');
  let outputMap: Record<string, number> = {};
  if (fs.existsSync(outputMapPath)) {
    outputMap = JSON.parse(fs.readFileSync(outputMapPath, 'utf8'));
  }

  let created = 0; let reused = 0; let failed = 0; let skipped = 0;
  const failures: string[] = [];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  for (const dep of sorted) {
    const refNo = `QBO-DEP-${dep.Id}`;

    if (existingRefs.has(refNo)) {
      const id = existingRefMap.get(refNo);
      if (id) outputMap[dep.Id] = id;
      log('REUSED', `${refNo} already exists (id=${id})`);
      reused++;
      continue;
    }
    if (outputMap[dep.Id]) {
      log('REUSED', `QBO-${dep.Id} in output map`);
      reused++;
      continue;
    }

    // Resolve deposit-to bank account
    const bankQboId = dep.DepositToAccountRef?.value;
    const bankAccountId = bankQboId ? accountMap[bankQboId] : undefined;
    if (!bankAccountId) {
      log('SKIPPED', `Deposit QBO-${dep.Id}: bank account QBO-${bankQboId ?? 'none'} not mapped`);
      skipped++;
      continue;
    }

    // Build journal entries
    const entries: JournalEntry[] = [];
    let totalDebit = 0;
    let entryIdx = 0;

    for (const line of dep.Line ?? []) {
      const amount = line.Amount ?? 0;
      if (amount <= 0) continue;

      if (line.LinkedTxn?.length > 0) {
        // Clearing deposit: Dr bank, Cr Undeposited Funds
        entries.push({ index: entryIdx++, accountId: bankAccountId, debit: amount });
        entries.push({ index: entryIdx++, accountId: UNDEPOSITED_FUNDS_ID, credit: amount });
        totalDebit += amount;
      } else if (line.DepositLineDetail?.AccountRef?.value) {
        // Direct income: Dr bank, Cr income account
        const incomeQboId: string = line.DepositLineDetail.AccountRef.value;
        const incomeAccountId = accountMap[incomeQboId];
        if (!incomeAccountId) {
          log('WARN', `Deposit QBO-${dep.Id}: income account QBO-${incomeQboId} (${line.DepositLineDetail.AccountRef.name}) not mapped — skipping line`);
          continue;
        }
        const note = line.Description?.slice(0, 255);
        entries.push({ index: entryIdx++, accountId: bankAccountId, debit: amount, note });
        entries.push({ index: entryIdx++, accountId: incomeAccountId, credit: amount, note });
        totalDebit += amount;
      }
    }

    if (entries.length === 0) {
      log('SKIPPED', `Deposit QBO-${dep.Id}: no valid lines`);
      skipped++;
      continue;
    }

    const payload: Record<string, unknown> = {
      date: dep.TxnDate,
      journalNumber: refNo,
      reference: refNo,
      description: dep.PrivateNote?.slice(0, 500) ?? `QBO Deposit ${dep.Id}`,
      publish: true,
      entries,
    };

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/manual-journals', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on QBO-${dep.Id}: ${result.raw.slice(0, 200)}`);
      flushLog(ts);
      process.exit(1);
    }
    if (!result.ok) {
      log('ERROR', `${result.status} on QBO-${dep.Id}: ${result.raw.slice(0, 200)}`);
      failed++;
      failures.push(`QBO ${dep.Id}: ${result.status} ${result.raw.slice(0, 120)}`);
      continue;
    }

    const newId: number = result.data?.manualJournal?.id ?? result.data?.id ?? result.data;
    outputMap[dep.Id] = newId;
    log('CREATED', `Deposit QBO-${dep.Id} (${dep.TxnDate} $${dep.TotalAmt}) → journal id=${newId}`);
    created++;

    if (created % 50 === 0) {
      fs.writeFileSync(outputMapPath, JSON.stringify(outputMap, null, 2));
      flushLog(ts);
      log('INFO', `Progress: created=${created} reused=${reused} failed=${failed}`);
    }
  }

  log('INFO', `Done: created=${created} reused=${reused} skipped=${skipped} failed=${failed}`);
  if (failures.length > 0) for (const f of failures) log('ERROR', f);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputMapPath, JSON.stringify(outputMap, null, 2));
  log('INFO', `Wrote deposit_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);
  flushLog(ts);
}

main().catch((err) => { console.error(err); process.exit(1); });

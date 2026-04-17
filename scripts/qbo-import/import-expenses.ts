/**
 * Import QBO purchases/expenses into BigCapital (Tightbooks).
 *
 * Source: purchase_merged.json (6,253 records)
 * Target: POST /api/expenses
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-expenses.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/import-expenses.ts
 *
 * Env vars:
 *   TIGHTBOOKS_API_BASE   (default: https://app.tightbooks.com/api)
 *   TIGHTBOOKS_EMAIL      (default: assist@majorimpact.com)
 *   TIGHTBOOKS_PASSWORD   (required in non-dry-run)
 *   QBO_EXPORT_DIR        (default: /home/elliott/nanoclaw/groups/maggie/exports/qbo)
 *   DRY_RUN               (default: true)
 *   RESUME_FROM           (optional: QBO purchase Id to resume from after a crash)
 *
 * Outputs (scripts/qbo-import/output/):
 *   expense_qbo_to_bigcap_map.json   — { "<QBO Id>": <BigCapital id>, ... }
 *   run-expenses-<timestamp>.log
 *
 * Idempotency: referenceNo = "QBO-<Id>" stored on each expense.
 * On re-run, pre-loads existing expense reference_no values to skip already-imported.
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
const RESUME_FROM = process.env.RESUME_FROM ?? '';
const REQUEST_DELAY_MS = 300; // expenses are heavier; 300ms gives ~3/s

const OUTPUT_DIR = path.join(__dirname, 'output');

// ── Types ───────────────────────────────────────────────────────────────────
interface QboPurchase {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  PaymentType: string;
  AccountRef?: { value: string; name?: string };
  EntityRef?: { value: string; name?: string; type?: string };
  Line: QboPurchaseLine[];
  PrivateNote?: string;
}

interface QboPurchaseLine {
  Id?: string;
  Description?: string;
  Amount?: number;
  DetailType?: string;
  AccountBasedExpenseLineDetail?: {
    AccountRef?: { value: string; name?: string };
    BillableStatus?: string;
  };
}

interface ExpenseCategory {
  index: number;
  expenseAccountId: number;
  amount: number;
  description?: string;
}

interface ExpensePayload {
  paymentDate: string;
  paymentAccountId: number;
  referenceNo?: string;
  description?: string;
  payeeId?: number;
  categories: ExpenseCategory[];
  publish?: boolean;
}

// ── Log infrastructure ───────────────────────────────────────────────────────
const logLines: string[] = [];

function log(
  level: 'INFO' | 'WARN' | 'ERROR' | 'CREATED' | 'REUSED' | 'SKIPPED' | 'DRY',
  msg: string,
) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

function flushLog(timestamp: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-expenses-${timestamp}.log`), logLines.join('\n') + '\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) {
    log('INFO', 'DRY RUN mode — no expenses will be created.');
  }
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD is required for a real run.');
    process.exit(1);
  }

  // 1. Load source
  const sourcePath = path.join(QBO_DIR, 'purchase_merged.json');
  const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const purchases: QboPurchase[] = raw?.Purchase ?? (Array.isArray(raw) ? raw : []);
  log('INFO', `Loaded ${purchases.length} purchases from ${sourcePath}`);

  // 2. Load account map
  const accountMapPath = path.join(OUTPUT_DIR, 'qbo_to_bigcap_account_map.json');
  const accountMap: Record<string, number> = JSON.parse(fs.readFileSync(accountMapPath, 'utf8'));
  log('INFO', `Loaded account map: ${Object.keys(accountMap).length} entries`);

  // 3. Load vendor map
  const vendorMapPath = path.join(OUTPUT_DIR, 'vendor_qbo_to_bigcap_map.json');
  const vendorMap: Record<string, number> = JSON.parse(fs.readFileSync(vendorMapPath, 'utf8'));
  log('INFO', `Loaded vendor map: ${Object.keys(vendorMap).length} entries`);

  // 4. Sort purchases chronologically
  const sorted = [...purchases].sort((a, b) =>
    (a.TxnDate ?? '').localeCompare(b.TxnDate ?? ''),
  );

  // 5. Resume support
  let resumeIndex = 0;
  if (RESUME_FROM) {
    resumeIndex = sorted.findIndex((p) => p.Id === RESUME_FROM);
    if (resumeIndex < 0) {
      console.error(`RESUME_FROM=${RESUME_FROM} not found in purchases.`);
      process.exit(1);
    }
    log('INFO', `Resuming from QBO Id=${RESUME_FROM} (index ${resumeIndex})`);
  }

  if (DRY_RUN) {
    // Dry-run validation: check all account IDs can be resolved
    const unmappedAccounts = new Set<string>();
    const unmappedExpenseAccounts = new Set<string>();
    let ok = 0;
    for (const p of sorted) {
      const acctQboId = p.AccountRef?.value;
      if (acctQboId && !accountMap[acctQboId]) unmappedAccounts.add(acctQboId);
      for (const line of p.Line ?? []) {
        const detail = line.AccountBasedExpenseLineDetail;
        if (detail?.AccountRef?.value && !accountMap[detail.AccountRef.value]) {
          unmappedExpenseAccounts.add(detail.AccountRef.value);
        }
      }
      ok++;
    }
    log('INFO', `Dry-run validated ${ok} purchases`);
    if (unmappedAccounts.size > 0) {
      log('WARN', `Unmapped payment accounts (${unmappedAccounts.size}): ${[...unmappedAccounts].join(', ')}`);
      log('WARN', 'These will be auto-created on real run as archived bank/credit-card accounts.');
    }
    if (unmappedExpenseAccounts.size > 0) {
      log('WARN', `Unmapped expense accounts (${unmappedExpenseAccounts.size}): ${[...unmappedExpenseAccounts].join(', ')}`);
    }
    log('DRY', `Would import ${sorted.length} expenses.`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    flushLog(timestamp);
    return;
  }

  // 6. Auth
  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // 7. Load existing expenses for idempotency (by reference_no)
  const existingRefs = new Set<string>();
  const existingRefMap = new Map<string, number>(); // referenceNo → expense id
  {
    let page = 1;
    const pageSize = 100;
    while (true) {
      const resp = await client.get<any>(`/expenses?page=${page}&pageSize=${pageSize}`);
      const exps: any[] = resp?.expenses ?? [];
      if (exps.length === 0) break;
      for (const e of exps) {
        const ref: string = e.reference_no ?? '';
        if (ref) {
          existingRefs.add(ref);
          existingRefMap.set(ref, e.id);
        }
      }
      if (exps.length < pageSize) break;
      page++;
    }
    log('INFO', `Found ${existingRefs.size} existing expenses with reference_no in BigCapital.`);
  }

  // 8. Get all BigCapital accounts to build a live map for on-the-fly account creation
  const bcAccountMap = new Map<number, { name: string; accountType: string }>(); // bigcapId → info
  const bcAccountByName = new Map<string, number>(); // nameLower → bigcapId
  {
    const resp = await client.get<any>('/accounts?per_page=1000');
    const accounts: any[] = Array.isArray(resp) ? resp : (resp?.accounts ?? []);
    for (const a of accounts) {
      bcAccountMap.set(a.id, { name: a.name, accountType: a.account_type });
      bcAccountByName.set((a.name as string).toLowerCase(), a.id);
    }
    log('INFO', `Loaded ${bcAccountMap.size} BigCapital accounts.`);
  }

  // Extend account map with live BigCap accounts (in case there are IDs in account map not yet in bcAccountMap)
  // Also build fallback for unmapped QBO payment accounts
  const resolvedPaymentAccounts = new Map<string, number>(); // qboAccountId → bigcapAccountId
  for (const [qboId, bcId] of Object.entries(accountMap)) {
    resolvedPaymentAccounts.set(qboId, bcId);
  }

  // Known QBO payment accounts that might be missing from account map (deleted in QBO)
  const knownMissingAccounts: Record<string, { name: string; type: 'credit-card' | 'bank' }> = {
    '61': { name: 'Barclaycard (archived)', type: 'credit-card' },
    '62': { name: 'Citi Prestige Card (archived)', type: 'credit-card' },
    '84': { name: 'Stripe Payment Account (archived)', type: 'bank' },
    '94': { name: 'AMEX Blue Cash (archived)', type: 'credit-card' },
    '95': { name: 'Discover It (archived)', type: 'credit-card' },
  };

  // Create any missing archived accounts
  for (const [qboId, info] of Object.entries(knownMissingAccounts)) {
    if (resolvedPaymentAccounts.has(qboId)) continue;
    const existingId = bcAccountByName.get(info.name.toLowerCase());
    if (existingId != null) {
      resolvedPaymentAccounts.set(qboId, existingId);
      log('REUSED', `Payment account "${info.name}" already exists (id=${existingId})`);
      continue;
    }
    await new Promise((r) => setTimeout(r, 1000));
    const res = await client.post<any>('/accounts', {
      name: info.name,
      accountType: info.type,
      currencyCode: 'USD',
      active: false,
    });
    if (!res.ok) {
      log('ERROR', `Failed to create archived account "${info.name}": ${res.raw}`);
      process.exit(1);
    }
    const newId: number = res.data?.account?.id ?? res.data?.id;
    resolvedPaymentAccounts.set(qboId, newId);
    bcAccountByName.set(info.name.toLowerCase(), newId);
    log('CREATED', `Archived account "${info.name}" (${info.type}) → BigCap id ${newId}`);
  }

  // 9. Import expenses
  // Load or init output map (crash-safe resume)
  const outputMapPath = path.join(OUTPUT_DIR, 'expense_qbo_to_bigcap_map.json');
  let outputMap: Record<string, number> = {};
  if (fs.existsSync(outputMapPath)) {
    outputMap = JSON.parse(fs.readFileSync(outputMapPath, 'utf8'));
    log('INFO', `Loaded existing output map: ${Object.keys(outputMap).length} entries`);
  }

  let created = 0;
  let reused = 0;
  let failed = 0;
  let skippedLines = 0;
  const failures: string[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (let i = resumeIndex; i < sorted.length; i++) {
    const p = sorted[i];
    const refNo = `QBO-${p.Id}`;

    // Check idempotency
    if (existingRefs.has(refNo)) {
      const existingId = existingRefMap.get(refNo);
      if (existingId != null) outputMap[p.Id] = existingId;
      log('REUSED', `QBO-${p.Id} already exists (expense id=${existingId})`);
      reused++;
      continue;
    }
    if (outputMap[p.Id]) {
      log('REUSED', `QBO-${p.Id} in output map (id=${outputMap[p.Id]})`);
      reused++;
      continue;
    }

    // Resolve payment account
    const paymentQboAccountId = p.AccountRef?.value;
    if (!paymentQboAccountId) {
      log('WARN', `QBO-${p.Id}: no AccountRef — skipping`);
      skippedLines++;
      continue;
    }
    const paymentAccountId = resolvedPaymentAccounts.get(paymentQboAccountId);
    if (!paymentAccountId) {
      log('ERROR', `QBO-${p.Id}: unmapped payment account QBO-${paymentQboAccountId} (${p.AccountRef?.name})`);
      failed++;
      failures.push(`QBO-${p.Id}: unmapped payment account ${paymentQboAccountId}`);
      continue;
    }

    // Build categories from Line items
    const categories: ExpenseCategory[] = [];
    let catIndex = 0;
    // BigCapital only accepts expense/other-expense/cost-of-goods-sold as expense category accounts
    const VALID_EXPENSE_TYPES = new Set(['expense', 'other-expense', 'cost-of-goods-sold']);
    // Fallback: BigCap "Miscellaneous" (id=1066, type=other-expense)
    const FALLBACK_EXPENSE_ACCOUNT_ID = 1066;
    for (const line of p.Line ?? []) {
      const detail = line.AccountBasedExpenseLineDetail;
      if (!detail || !detail.AccountRef?.value) continue;
      const expenseAccountId = accountMap[detail.AccountRef.value];
      if (!expenseAccountId) {
        log('WARN', `QBO-${p.Id} line: unmapped expense account QBO-${detail.AccountRef.value} (${detail.AccountRef.name}) — using Miscellaneous fallback`);
        categories.push({
          index: catIndex++,
          expenseAccountId: FALLBACK_EXPENSE_ACCOUNT_ID,
          amount: line.Amount ?? 0,
          description: line.Description?.slice(0, 255),
        });
        skippedLines++;
        continue;
      }
      // Reject non-expense account types (equity, income, liability) — use fallback
      const resolvedInfo = bcAccountMap.get(expenseAccountId);
      if (resolvedInfo && !VALID_EXPENSE_TYPES.has(resolvedInfo.accountType)) {
        log('WARN', `QBO-${p.Id} line: account ${expenseAccountId} ("${resolvedInfo.name}") type="${resolvedInfo.accountType}" is not a valid expense category — using Miscellaneous fallback`);
        categories.push({
          index: catIndex++,
          expenseAccountId: FALLBACK_EXPENSE_ACCOUNT_ID,
          amount: line.Amount ?? 0,
          description: line.Description?.slice(0, 255),
        });
        skippedLines++;
        continue;
      }
      categories.push({
        index: catIndex++,
        expenseAccountId,
        amount: line.Amount ?? 0,
        description: line.Description?.slice(0, 255),
      });
    }

    if (categories.length === 0) {
      // No expense lines — use total amount with best-guess account
      categories.push({
        index: 0,
        expenseAccountId: FALLBACK_EXPENSE_ACCOUNT_ID,
        amount: p.TotalAmt,
      });
      log('WARN', `QBO-${p.Id}: no AccountBasedExpenseLineDetail — using fallback account for total ${p.TotalAmt}`);
    }

    // Vendor (payee)
    const vendorQboId = p.EntityRef?.value;
    const payeeId = vendorQboId ? vendorMap[vendorQboId] : undefined;

    const payload: ExpensePayload = {
      paymentDate: p.TxnDate,
      paymentAccountId,
      referenceNo: refNo,
      categories,
      publish: true,
    };
    if (payeeId) payload.payeeId = payeeId;
    if (p.PrivateNote) payload.description = p.PrivateNote.slice(0, 500);

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/expenses', payload);

    if (result.status === 429) {
      log('WARN', `QBO-${p.Id}: rate limited — waiting 5s`);
      await new Promise((r) => setTimeout(r, 5000));
      i--; // retry
      continue;
    }

    if (result.status >= 500) {
      log('ERROR', `5xx on QBO-${p.Id}: ${result.raw.slice(0, 200)}`);
      console.error('Aborting due to server error.');
      flushLog(timestamp);
      process.exit(1);
    }

    if (!result.ok) {
      log('ERROR', `${result.status} on QBO-${p.Id}: ${result.raw.slice(0, 200)}`);
      failed++;
      failures.push(`QBO-${p.Id}: ${result.status} ${result.raw.slice(0, 120)}`);
      continue;
    }

    const newId: number = result.data?.id ?? result.data;
    outputMap[p.Id] = newId;
    log('CREATED', `QBO-${p.Id} (${p.TxnDate} $${p.TotalAmt}) → expense id=${newId}`);
    created++;

    // Persist output map incrementally (crash-safe)
    if (created % 10 === 0) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(outputMapPath, JSON.stringify(outputMap, null, 2));
    }

    // Periodic log flush every 100 records
    if (created % 100 === 0) {
      log('INFO', `Progress: ${i + 1}/${sorted.length} (created=${created} reused=${reused} failed=${failed})`);
      flushLog(timestamp);
    }
  }

  log(
    'INFO',
    `Done: created=${created} reused=${reused} skippedLines=${skippedLines} failed=${failed}`,
  );
  if (failures.length > 0) {
    log('WARN', 'Failures:');
    for (const f of failures) log('ERROR', f);
  }

  // Final artifact write
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputMapPath, JSON.stringify(outputMap, null, 2));
  log('INFO', `Wrote expense_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);
  flushLog(timestamp);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

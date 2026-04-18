/**
 * Import QBO journal entries into BigCapital as manual journals.
 *
 * Source: journalentry_raw.json (9 records)
 * Target: POST /api/manual-journals
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/import-journal-entries.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! \
 *   tsx scripts/qbo-import/import-journal-entries.ts
 *
 * Outputs:
 *   journal_entry_qbo_to_bigcap_map.json
 *   run-journal-entries-<timestamp>.log
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
function log(level: 'INFO' | 'WARN' | 'ERROR' | 'CREATED' | 'REUSED' | 'SKIPPED' | 'DRY', msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

async function main() {
  if (DRY_RUN) log('INFO', 'DRY RUN mode — no journals will be created.');
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD required.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(path.join(QBO_DIR, 'journalentry_raw.json'), 'utf8'));
  const journals: any[] = raw?.QueryResponse?.JournalEntry ?? [];
  log('INFO', `Loaded ${journals.length} journal entries`);

  const accountMap: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, 'qbo_to_bigcap_account_map.json'), 'utf8'),
  );

  if (DRY_RUN) {
    for (const j of journals) {
      log('DRY', `JournalEntry QBO-${j.Id} (${j.TxnDate}) DocNum=${j.DocNumber} Total=${j.Adjustment}`);
      for (const line of j.Line ?? []) {
        const detail = line.JournalEntryLineDetail;
        if (!detail) continue;
        const bcAcctId = accountMap[detail.AccountRef?.value];
        log('DRY', `  Line: ${detail.PostingType} ${line.Amount} QBO-${detail.AccountRef?.value} (${detail.AccountRef?.name}) → BigCap ${bcAcctId ?? 'UNMAPPED'}`);
      }
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, `run-journal-entries-${ts}.log`), logLines.join('\n') + '\n');
    return;
  }

  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();
  log('INFO', 'Authenticated.');

  // Auto-create accounts missing from the account map (archived loans/liabilities)
  // knownBcId: already created in BigCapital during expenses import — use these IDs directly
  const missingAccounts: Record<string, { name: string; type: string; knownBcId?: number }> = {
    '73': { name: 'Discover Loan (archived)', type: 'long-term-liability', knownBcId: 1149 },
    '97': { name: 'Affirm Loan (archived)', type: 'long-term-liability', knownBcId: 1150 },
    '99': { name: 'Sofi Loan (archived)', type: 'long-term-liability', knownBcId: 1151 },
    '61': { name: 'Barclaycard (archived)', type: 'credit-card', knownBcId: 1144 },
    '62': { name: 'Citi Prestige Card (archived)', type: 'credit-card', knownBcId: 1145 },
    '84': { name: 'Stripe Payment Account (archived)', type: 'bank', knownBcId: 1146 },
    '94': { name: 'AMEX Blue Cash (archived)', type: 'credit-card', knownBcId: 1147 },
    '95': { name: 'Discover It (archived)', type: 'credit-card', knownBcId: 1148 },
  };

  // Fetch existing accounts to check for already-created archived accounts
  const bcAccountByName = new Map<string, number>();
  {
    const resp = await client.get<any>('/accounts?per_page=1000');
    const accounts: any[] = Array.isArray(resp) ? resp : (resp?.accounts ?? []);
    for (const a of accounts) {
      bcAccountByName.set((a.name as string).toLowerCase(), a.id);
    }
    log('INFO', `Loaded ${bcAccountByName.size} BigCapital accounts.`);
  }

  for (const [qboId, info] of Object.entries(missingAccounts)) {
    if (accountMap[qboId]) continue; // already mapped
    // Use known BigCap ID if available (inactive accounts not returned by listing endpoint)
    if (info.knownBcId != null) {
      accountMap[qboId] = info.knownBcId;
      log('REUSED', `Archived account "${info.name}" using known id=${info.knownBcId}`);
      continue;
    }
    const existingId = bcAccountByName.get(info.name.toLowerCase());
    if (existingId != null) {
      accountMap[qboId] = existingId;
      log('REUSED', `Archived account "${info.name}" already exists (id=${existingId})`);
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
      log('WARN', `Could not create archived account "${info.name}": ${res.raw.slice(0, 120)}`);
      continue;
    }
    const newId: number = res.data?.account?.id ?? res.data?.id;
    accountMap[qboId] = newId;
    bcAccountByName.set(info.name.toLowerCase(), newId);
    log('CREATED', `Archived account "${info.name}" (${info.type}) → BigCap id ${newId}`);
  }

  // Idempotency
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

  const outputMapPath = path.join(OUTPUT_DIR, 'journal_entry_qbo_to_bigcap_map.json');
  const outputMap: Record<string, number> = {};
  let created = 0; let reused = 0; let failed = 0; let skipped = 0;

  const sorted = [...journals].sort((a, b) => (a.TxnDate ?? '').localeCompare(b.TxnDate ?? ''));

  for (const j of sorted) {
    const refNo = `QBO-JE-${j.DocNumber ?? j.Id}`;

    if (existingRefs.has(refNo)) {
      const id = existingRefMap.get(refNo);
      if (id) outputMap[j.Id] = id;
      log('REUSED', `${refNo} already exists (id=${id})`);
      reused++;
      continue;
    }

    // Build entries
    const entries: any[] = [];
    let idx = 0;
    let hasUnmapped = false;

    for (const line of j.Line ?? []) {
      const detail = line.JournalEntryLineDetail;
      if (!detail?.AccountRef?.value) continue;

      const bcAccountId = accountMap[detail.AccountRef.value];
      if (!bcAccountId) {
        log('WARN', `JournalEntry QBO-${j.Id}: account QBO-${detail.AccountRef.value} (${detail.AccountRef.name}) not mapped — skipping line`);
        hasUnmapped = true;
        continue;
      }

      const postingType = detail.PostingType ?? 'Debit';
      const amount = line.Amount ?? 0;

      const entry: Record<string, unknown> = { index: idx++, accountId: bcAccountId };
      if (postingType === 'Credit') {
        entry.credit = amount;
      } else {
        entry.debit = amount;
      }
      if (line.Description) entry.note = line.Description.slice(0, 255);

      entries.push(entry);
    }

    if (entries.length < 2) {
      log('SKIPPED', `JournalEntry QBO-${j.Id}: less than 2 valid entries (unmapped=${hasUnmapped}) — skipping`);
      skipped++;
      continue;
    }

    // Skip zero-amount entries — BigCapital rejects credit_debit_not_equal_zero
    const totalDebits = entries.reduce((s, e) => s + (e.debit ?? 0), 0);
    const totalCredits = entries.reduce((s, e) => s + (e.credit ?? 0), 0);
    if (totalDebits === 0 && totalCredits === 0) {
      log('SKIPPED', `JournalEntry QBO-${j.Id}: all-zero amounts — skipping (no P&L impact)`);
      skipped++;
      continue;
    }

    const payload: Record<string, unknown> = {
      date: j.TxnDate,
      journalNumber: refNo,
      reference: j.DocNumber ?? j.Id,
      description: j.PrivateNote?.slice(0, 500) ?? `QBO Journal Entry ${j.Id}`,
      publish: true,
      entries,
    };

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<any>('/manual-journals', payload);

    if (result.status >= 500) {
      // api-client already retried 6 times; log and skip
      log('ERROR', `5xx exhausted retries on QBO-${j.Id} — skipping: ${result.raw.slice(0, 200)}`);
      failed++;
      continue;
    }
    if (!result.ok) {
      log('ERROR', `${result.status} on QBO-${j.Id}: ${result.raw.slice(0, 200)}`);
      failed++;
      continue;
    }

    const newId: number = result.data?.manualJournal?.id ?? result.data?.id ?? result.data;
    outputMap[j.Id] = newId;
    log('CREATED', `JournalEntry QBO-${j.Id} (${j.TxnDate}) → journal id=${newId}`);
    created++;
  }

  log('INFO', `Done: created=${created} reused=${reused} skipped=${skipped} failed=${failed}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outputMapPath, JSON.stringify(outputMap, null, 2));
  log('INFO', `Wrote journal_entry_qbo_to_bigcap_map.json (${Object.keys(outputMap).length} entries)`);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-journal-entries-${ts}.log`), logLines.join('\n') + '\n');
}

main().catch((err) => { console.error(err); process.exit(1); });

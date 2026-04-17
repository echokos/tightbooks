/**
 * Seed BigCapital chart of accounts from a QBO export.
 *
 * NOTE: CurrentBalance from QBO is intentionally ignored. Opening balances
 * are a separate concern handled via journal entries in a downstream task.
 *
 * Usage (dry run — default):
 *   DRY_RUN=true tsx scripts/qbo-import/seed-chart-of-accounts.ts
 *
 * Real run:
 *   DRY_RUN=false \
 *   TIGHTBOOKS_EMAIL=assist@majorimpact.com \
 *   TIGHTBOOKS_PASSWORD=... \
 *   tsx scripts/qbo-import/seed-chart-of-accounts.ts
 *
 * Env vars:
 *   TIGHTBOOKS_API_BASE  (default: https://app.tightbooks.com/api)
 *   TIGHTBOOKS_EMAIL     (required in non-dry-run)
 *   TIGHTBOOKS_PASSWORD  (required in non-dry-run)
 *   QBO_EXPORT_DIR       (default: /home/elliott/nanoclaw/groups/maggie/exports/qbo)
 *   DRY_RUN              (default: true)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TightbooksApiClient } from './lib/api-client.js';
import { QBO_ACCOUNT_TYPE_MAP } from './lib/qbo-account-type-map.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ─────────────────────────────────────────────────────────────────
const API_BASE = process.env.TIGHTBOOKS_API_BASE ?? 'https://app.tightbooks.com/api';
const EMAIL = process.env.TIGHTBOOKS_EMAIL ?? 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';
const QBO_DIR = process.env.QBO_EXPORT_DIR ?? '/home/elliott/nanoclaw/groups/maggie/exports/qbo';
const DRY_RUN = process.env.DRY_RUN !== 'false'; // default: true
// Delay between account creates to stay under throttler limits (ms)
const REQUEST_DELAY_MS = 1200;

const OUTPUT_DIR = path.join(__dirname, 'output');

// ── CSV parser ──────────────────────────────────────────────────────────────
interface CsvRow {
  Id: string;
  Name: string;
  FullyQualifiedName: string;
  AccountType: string;
  AccountSubType: string;
  Classification: string;
  CurrentBalance: string;
  Active: string;
  Description: string;
}

function parseCsv(filePath: string): CsvRow[] {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    // Handle quoted fields with commas inside
    const values: string[] = [];
    let inQuote = false;
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').replace(/^"|"$/g, '');
    });
    return row as unknown as CsvRow;
  });
}

// ── Log infrastructure ──────────────────────────────────────────────────────
const logLines: string[] = [];

function log(level: 'INFO' | 'WARN' | 'ERROR' | 'REUSED' | 'CREATED' | 'SKIPPED' | 'DRY', msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) {
    log('INFO', 'DRY RUN mode — no accounts will be created.');
  }
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD is required for a real run.');
    process.exit(1);
  }

  // 1. Parse CSV
  const csvPath = path.join(QBO_DIR, 'chart_of_accounts.csv');
  const rows = parseCsv(csvPath);
  log('INFO', `Parsed ${rows.length} accounts from ${csvPath}`);

  // 2. Preflight: check all account types are mapped
  const unmapped = [...new Set(rows.map((r) => r.AccountType))].filter(
    (t) => !QBO_ACCOUNT_TYPE_MAP[t],
  );
  if (unmapped.length > 0) {
    console.error(`FATAL: Unmapped QBO AccountTypes: ${unmapped.join(', ')}`);
    process.exit(1);
  }
  log('INFO', `All ${rows.length} account types map successfully.`);

  // 3. Check for deep hierarchy (>2 levels = 2+ colons)
  for (const row of rows) {
    if ((row.FullyQualifiedName.match(/:/g) ?? []).length >= 2) {
      log('WARN', `Deep hierarchy (will flatten): ${row.FullyQualifiedName}`);
    }
  }

  // 4. Build parent-first order
  const sorted = [...rows].sort((a, b) => {
    const da = (a.FullyQualifiedName.match(/:/g) ?? []).length;
    const db = (b.FullyQualifiedName.match(/:/g) ?? []).length;
    return da - db;
  });

  // 5. Auth + fetch existing accounts
  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  // snake_case response from the live API
  let existingAccounts: Array<{ id: number; name: string; account_type: string }> = [];

  if (!DRY_RUN) {
    await client.authenticate();
    log('INFO', 'Authenticated successfully.');

    const resp = await client.get<{ accounts?: typeof existingAccounts } | typeof existingAccounts>('/accounts?per_page=1000');
    // BigCapital returns { accounts: [...] } or a bare array depending on version
    existingAccounts = Array.isArray(resp) ? resp : ((resp as any).accounts ?? []);
    log('INFO', `Found ${existingAccounts.length} existing accounts in BigCapital.`);
  }

  // Build dedup index: (nameLower + accountType) → bigcapId
  const existingIndex = new Map<string, number>();
  for (const acc of existingAccounts) {
    const key = `${acc.name.toLowerCase()}__${acc.account_type}`;
    existingIndex.set(key, acc.id);
  }

  // 6. Seed accounts
  // qboId → bigcapId (populated as we go)
  const qboToBigcap = new Map<string, number>();

  let created = 0;
  let reused = 0;
  let errors = 0;

  for (const row of sorted) {
    const fqn = row.FullyQualifiedName;
    const parts = fqn.split(':');
    const isChild = parts.length > 1;

    // Name = last segment; if 3+ levels, join the non-first segments
    const name = parts.length >= 2 ? parts.slice(1).join(' - ') : parts[0];
    const parentFqnSegment = parts[0];

    const accountType = QBO_ACCOUNT_TYPE_MAP[row.AccountType]!;
    const key = `${name.toLowerCase()}__${accountType}`;

    if (existingIndex.has(key)) {
      const existingId = existingIndex.get(key)!;
      qboToBigcap.set(row.Id, existingId);
      log('REUSED', `"${name}" (${accountType}) → BigCap id ${existingId}`);
      reused++;
      continue;
    }

    // Resolve parentAccountId
    let parentAccountId: number | undefined;
    if (isChild) {
      // Find parent QBO row by its FullyQualifiedName == parentFqnSegment
      const parentRow = rows.find((r) => r.FullyQualifiedName === parentFqnSegment);
      if (parentRow) {
        const bigcapParentId = qboToBigcap.get(parentRow.Id);
        if (bigcapParentId != null) {
          parentAccountId = bigcapParentId;
        } else {
          log('WARN', `Parent "${parentFqnSegment}" for "${name}" not yet resolved — creating without parent.`);
        }
      } else {
        log('WARN', `Parent "${parentFqnSegment}" not found in CSV for "${name}" — creating without parent.`);
      }
    }

    const payload: Record<string, unknown> = {
      name,
      accountType,
      currencyCode: 'USD',
    };
    if (row.Description) payload.description = row.Description;
    if (parentAccountId != null) payload.parentAccountId = parentAccountId;
    if (row.Active === 'False') payload.active = false;

    if (DRY_RUN) {
      log('DRY', `Would CREATE "${name}" (${accountType})${parentAccountId ? ` child of BigCap ${parentAccountId}` : ''}`);
      // Use a synthetic ID for dry-run map continuity
      qboToBigcap.set(row.Id, -1);
      created++;
      continue;
    }

    // Throttle: give the server a moment between creates
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const result = await client.post<{ id: number; account?: { id: number } }>('/accounts', payload);

    if (result.status >= 500) {
      log('ERROR', `5xx on "${name}": ${result.raw}`);
      console.error('Aborting due to server error.');
      process.exit(1);
    }

    if (!result.ok) {
      log('ERROR', `4xx (${result.status}) on "${name}": ${result.raw}`);
      errors++;
      continue;
    }

    const newId: number = (result.data as any)?.account?.id ?? (result.data as any)?.id;
    qboToBigcap.set(row.Id, newId);
    existingIndex.set(key, newId); // prevent duplicate on re-run within same session
    log('CREATED', `"${name}" (${accountType}) → BigCap id ${newId}`);
    created++;
  }

  log('INFO', `Done: created=${created} reused=${reused} errors=${errors}`);

  // 7. Write qbo_to_bigcap_account_map.json
  const accountMap: Record<string, number> = {};
  for (const [qboId, bigcapId] of qboToBigcap.entries()) {
    accountMap[qboId] = bigcapId;
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'qbo_to_bigcap_account_map.json'),
    JSON.stringify(accountMap, null, 2),
  );
  log('INFO', `Wrote qbo_to_bigcap_account_map.json (${Object.keys(accountMap).length} entries)`);

  // 8. Mine vendor→account rules from purchase_merged.json
  const purchasePath = path.join(QBO_DIR, 'purchase_merged.json');
  if (fs.existsSync(purchasePath)) {
    await mineVendorRules(purchasePath, accountMap, rows);
  } else {
    log('WARN', `purchase_merged.json not found at ${purchasePath} — skipping vendor rule mining.`);
  }

  // 9. Write run log
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(OUTPUT_DIR, `run-${timestamp}.log`), logLines.join('\n') + '\n');
}

// ── Vendor→account rule mining ──────────────────────────────────────────────
async function mineVendorRules(
  purchasePath: string,
  accountMap: Record<string, number>,
  csvRows: CsvRow[],
) {
  log('INFO', 'Mining vendor→account rules from purchase_merged.json...');

  const raw = JSON.parse(fs.readFileSync(purchasePath, 'utf8'));
  const purchases: any[] = raw?.Purchase ?? (Array.isArray(raw) ? raw : []);
  log('INFO', `Processing ${purchases.length} purchases...`);

  // vendorId → { accountId → { count: number, total: number } }
  const vendorAccounts = new Map<string, Map<string, { count: number; total: number; name: string; vendorName: string }>>();

  for (const p of purchases) {
    const vendorId: string | undefined = p.EntityRef?.value;
    const vendorName: string = p.EntityRef?.name ?? '';
    if (!vendorId) continue;

    for (const line of p.Line ?? []) {
      const detail = line.AccountBasedExpenseLineDetail;
      if (!detail) continue;
      const accountId: string | undefined = detail.AccountRef?.value;
      const accountName: string = detail.AccountRef?.name ?? '';
      if (!accountId) continue;

      if (!vendorAccounts.has(vendorId)) vendorAccounts.set(vendorId, new Map());
      const accMap = vendorAccounts.get(vendorId)!;
      if (!accMap.has(accountId)) {
        accMap.set(accountId, { count: 0, total: 0, name: accountName, vendorName });
      }
      const entry = accMap.get(accountId)!;
      entry.count++;
      entry.total += line.Amount ?? 0;
      entry.vendorName = vendorName;
    }
  }

  const rules: any[] = [];
  const lowConfidence: any[] = [];

  for (const [vendorId, accMap] of vendorAccounts.entries()) {
    const totalSamples = [...accMap.values()].reduce((s, e) => s + e.count, 0);
    if (totalSamples < 1) continue;

    const sorted = [...accMap.entries()].sort((a, b) => b[1].count - a[1].count);
    const [topAccountId, topEntry] = sorted[0];
    const confidence = topEntry.count / totalSamples;

    const rule = {
      qboVendorId: vendorId,
      vendorName: topEntry.vendorName,
      bigcapVendorId: null, // filled by EK-563 vendor import
      defaultAccount: {
        qboAccountId: topAccountId,
        bigcapAccountId: accountMap[topAccountId] ?? null,
        name: topEntry.name,
        confidence: Math.round(confidence * 1000) / 1000,
        sampleCount: topEntry.count,
      },
      alternates: sorted.slice(1).map(([accId, e]) => ({
        qboAccountId: accId,
        bigcapAccountId: accountMap[accId] ?? null,
        name: e.name,
        count: e.count,
        share: Math.round((e.count / totalSamples) * 1000) / 1000,
      })),
    };

    if (totalSamples >= 3) {
      rules.push(rule);
    } else {
      lowConfidence.push(rule);
    }
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vendor_category_rules.json'),
    JSON.stringify(rules, null, 2),
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vendor_category_rules_low_confidence.json'),
    JSON.stringify(lowConfidence, null, 2),
  );
  log('INFO', `vendor_category_rules.json: ${rules.length} vendors with ≥3 samples`);
  log('INFO', `vendor_category_rules_low_confidence.json: ${lowConfidence.length} vendors with <3 samples`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Import 2025 expenses from the pre-mapped CSV into BigCapital (TightBooks).
 *
 * Source: /home/elliott/nanoclaw/groups/maggie/scripts/expenses_2025_bc_import.csv
 *   Columns: Payment Date, Reference No., Payment Account, Description,
 *            Currency Code, Exchange Rate, Expense Account, Amount, Line Description, Publish
 *
 * Account IDs resolved via bc_name_to_id.json.
 * Deduplication: skips any referenceNo already present in BigCapital.
 *
 * Usage:
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! npx tsx scripts/qbo-import/import-from-csv.ts
 *
 * Set DRY_RUN=false to actually create expenses. Default is dry-run.
 *
 * Env vars:
 *   TIGHTBOOKS_PASSWORD  (required for live run)
 *   CSV_PATH             (default: /home/elliott/nanoclaw/groups/maggie/scripts/expenses_2025_bc_import.csv)
 *   ACCOUNT_MAP_PATH     (default: /home/elliott/nanoclaw/groups/maggie/scripts/bc_name_to_id.json)
 *   DELAY_MS             (default: 1200ms between requests)
 *   DRY_RUN              (default: true)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.TIGHTBOOKS_API_BASE ?? 'https://app.tightbooks.com/api';
const EMAIL = process.env.TIGHTBOOKS_EMAIL ?? 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';
const CSV_PATH = process.env.CSV_PATH ?? '/home/elliott/nanoclaw/groups/maggie/scripts/expenses_2025_bc_import.csv';
const ACCOUNT_MAP_PATH = process.env.ACCOUNT_MAP_PATH ?? '/home/elliott/nanoclaw/groups/maggie/scripts/bc_name_to_id.json';
const DRY_RUN = process.env.DRY_RUN !== 'false';
const DELAY_MS = parseInt(process.env.DELAY_MS ?? '1200', 10);

const OUTPUT_DIR = path.join(__dirname, 'output');
const PROGRESS_FILE = '/tmp/ek743-imported-refs.json';

// ── Types ──────────────────────────────────────────────────────────────────

interface CsvRow {
  paymentDate: string;
  referenceNo: string;
  paymentAccount: string;
  description: string;
  expenseAccount: string;
  amount: number;
  lineDescription: string;
  publish: boolean;
}

interface Expense {
  referenceNo: string;
  paymentDate: string;
  paymentAccount: string;
  description: string;
  categories: { expenseAccount: string; amount: number; description: string }[];
  publish: boolean;
}

// ── Log ──────────────────────────────────────────────────────────────────

const logLines: string[] = [];
let createdCount = 0;
let skippedCount = 0;
let failedCount = 0;

function log(level: string, msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

function flushLog(ts: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `import-csv-${ts}.log`), logLines.join('\n') + '\n');
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── API helpers ──────────────────────────────────────────────────────────

async function authenticate() {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  const d = await res.json() as any;
  return {
    token: d.access_token ?? d.accessToken,
    org: d.organization_id ?? d.organizationId,
  };
}

function makeHeaders(token: string, org: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'organization-id': org,
  };
}

// Only retry GET/DELETE, never POST (POST may have been processed on 429)
async function fetchWithRetry(url: string, opts: RequestInit): Promise<Response> {
  const method = (opts.method ?? 'GET').toUpperCase();
  const maxAttempts = method === 'POST' ? 1 : 8;
  let delay = 3000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(url, opts);
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= maxAttempts - 1) return res; // return rate-limit response for caller to handle
      const retryAfter = Number(res.headers.get('retry-after') ?? 0);
      const wait = retryAfter > 0 ? retryAfter * 1000 : delay;
      console.warn(`[RETRY] ${res.status} attempt ${attempt + 1} — waiting ${wait}ms`);
      await sleep(wait);
      delay = Math.min(delay * 2, 60_000);
      continue;
    }
    return res;
  }
  return fetch(url, opts); // final attempt
}

async function fetchExistingRefs(_token: string, _org: string): Promise<Set<string>> {
  // BigCapital API only returns 12 expenses regardless of page/pageSize params.
  // Use a local progress file for restart-safe dedup instead of API pagination.
  if (fs.existsSync(PROGRESS_FILE)) {
    const saved = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')) as string[];
    log('INFO', `Loaded ${saved.length} already-imported refs from progress file.`);
    return new Set(saved);
  }
  return new Set();
}

function saveProgress(refs: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify([...refs]));
}

// ── CSV parsing ──────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split('\n').map(l => l.trimEnd()).filter(Boolean);
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    rows.push({
      paymentDate: cols[0] ?? '',
      referenceNo: cols[1] ?? '',
      paymentAccount: cols[2] ?? '',
      description: cols[3] ?? '',
      // cols[4] = Currency Code, cols[5] = Exchange Rate (ignored)
      expenseAccount: cols[6] ?? '',
      amount: parseFloat(cols[7] ?? '0') || 0,
      lineDescription: cols[8] ?? '',
      publish: (cols[9] ?? '').toUpperCase() === 'T',
    });
  }
  return rows;
}

function groupByRef(rows: CsvRow[]): Expense[] {
  const map = new Map<string, Expense>();
  for (const row of rows) {
    if (!row.referenceNo || !row.paymentDate) continue;
    if (!map.has(row.referenceNo)) {
      map.set(row.referenceNo, {
        referenceNo: row.referenceNo,
        paymentDate: row.paymentDate,
        paymentAccount: row.paymentAccount,
        description: row.description,
        categories: [],
        publish: row.publish,
      });
    }
    const exp = map.get(row.referenceNo)!;
    exp.categories.push({
      expenseAccount: row.expenseAccount,
      amount: row.amount,
      description: row.lineDescription || row.description,
    });
  }
  return [...map.values()];
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  log('INFO', `DRY_RUN=${DRY_RUN}`);
  log('INFO', `CSV: ${CSV_PATH}`);
  log('INFO', `Account map: ${ACCOUNT_MAP_PATH}`);
  if (!DRY_RUN && !PASSWORD) { console.error('TIGHTBOOKS_PASSWORD required'); process.exit(1); }

  // Load account map
  const accountMap: Record<string, number> = JSON.parse(fs.readFileSync(ACCOUNT_MAP_PATH, 'utf8'));
  log('INFO', `Account map: ${Object.keys(accountMap).length} entries`);

  // Parse CSV
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCsv(csvContent);
  log('INFO', `CSV rows: ${rows.length}`);
  const expenses = groupByRef(rows);
  log('INFO', `Unique expenses: ${expenses.length}`);

  // Validate all account names resolve
  const missing = new Set<string>();
  for (const exp of expenses) {
    if (!accountMap[exp.paymentAccount]) missing.add(`payment: ${exp.paymentAccount}`);
    for (const cat of exp.categories) {
      if (!accountMap[cat.expenseAccount]) missing.add(`expense: ${cat.expenseAccount}`);
    }
  }
  if (missing.size > 0) {
    log('ERROR', `Unmapped accounts (${missing.size}):`);
    for (const m of missing) log('ERROR', `  ${m}`);
    if (!DRY_RUN) { console.error('Fix account mappings before running live.'); process.exit(1); }
  } else {
    log('INFO', 'All account names resolve. ✓');
  }

  if (DRY_RUN) {
    // Sample output
    for (const exp of expenses.slice(0, 3)) {
      log('DRY', `${exp.referenceNo} | ${exp.paymentDate} | ${exp.paymentAccount} | ${exp.categories.length} cats | total=$${exp.categories.reduce((s,c)=>s+c.amount,0).toFixed(2)}`);
    }
    log('DRY', `Would import ${expenses.length} expenses.`);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    flushLog(ts);
    return;
  }

  // Auth
  const { token, org } = await authenticate();
  log('INFO', 'Authenticated.');

  // Load existing refs
  log('INFO', 'Loading existing expense reference numbers...');
  const existing = await fetchExistingRefs(token, org);
  log('INFO', `Existing refs: ${existing.size}`);

  // Import map for output
  const idMap: Record<string, number> = {};

  // Sort by date for cleanliness
  expenses.sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

  const headers = makeHeaders(token, org);

  for (let i = 0; i < expenses.length; i++) {
    const exp = expenses[i];

    if (existing.has(exp.referenceNo)) {
      skippedCount++;
      log('REUSED', `${exp.referenceNo} already exists — skip`);
      continue;
    }

    const payload = {
      paymentDate: exp.paymentDate,
      paymentAccountId: accountMap[exp.paymentAccount],
      referenceNo: exp.referenceNo,
      description: exp.description,
      publish: exp.publish,
      categories: exp.categories.map((cat, idx) => ({
        index: idx,
        expenseAccountId: accountMap[cat.expenseAccount],
        amount: cat.amount,
        description: cat.description,
      })),
    };

    await sleep(DELAY_MS);
    const res = await fetchWithRetry(`${API_BASE}/expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { data = {}; }

    if (res.ok) {
      const newId = data?.expense?.id ?? data?.id ?? '?';
      createdCount++;
      idMap[exp.referenceNo] = newId;
      existing.add(exp.referenceNo); // prevent duplicate if we restart mid-run
      saveProgress(existing);
      if (createdCount % 50 === 0 || createdCount <= 5) {
        log('CREATED', `[${i + 1}/${expenses.length}] ${exp.referenceNo} → id=${newId} date=${exp.paymentDate}`);
      }
    } else if (res.status === 429) {
      // 429 may mean the POST was processed — wait then check existence
      const retryAfter = Number(res.headers.get('retry-after') ?? 0);
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : 60_000;
      log('WARN', `[${i + 1}/${expenses.length}] ${exp.referenceNo} got 429 — waiting ${waitMs}ms then checking existence`);
      await sleep(waitMs);
      // Check if expense was actually created (sort by id desc = newest first)
      const checkRes = await fetchWithRetry(`${API_BASE}/expenses?page=1&pageSize=12&sortBy=id&sortOrder=desc`, { headers });
      if (checkRes.ok) {
        const checkData = await checkRes.json() as any;
        const found = (checkData?.expenses ?? []).find((e: any) =>
          (e.reference_no ?? e.referenceNo ?? '') === exp.referenceNo
        );
        if (found) {
          createdCount++;
          idMap[exp.referenceNo] = found.id;
          existing.add(exp.referenceNo);
          saveProgress(existing);
          log('CREATED', `[${i + 1}/${expenses.length}] ${exp.referenceNo} → id=${found.id} (found after 429)`);
        } else {
          // Not created — retry once after the wait
          await sleep(DELAY_MS);
          const retryRes = await fetch(`${API_BASE}/expenses`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          const retryRaw = await retryRes.text();
          let retryData: any;
          try { retryData = JSON.parse(retryRaw); } catch { retryData = {}; }
          if (retryRes.ok) {
            const newId = retryData?.expense?.id ?? retryData?.id ?? '?';
            createdCount++;
            idMap[exp.referenceNo] = newId;
            existing.add(exp.referenceNo);
            saveProgress(existing);
            log('CREATED', `[${i + 1}/${expenses.length}] ${exp.referenceNo} → id=${newId} (retry after 429)`);
          } else {
            failedCount++;
            log('ERROR', `[${i + 1}/${expenses.length}] ${exp.referenceNo} failed after 429 retry: ${retryRes.status} ${retryRaw.slice(0, 100)}`);
          }
        }
      } else {
        failedCount++;
        log('ERROR', `[${i + 1}/${expenses.length}] ${exp.referenceNo} 429 — could not check existence`);
      }
    } else {
      failedCount++;
      log('ERROR', `[${i + 1}/${expenses.length}] ${exp.referenceNo} failed ${res.status}: ${raw.slice(0, 150)}`);
    }
  }

  log('INFO', `=== DONE: created=${createdCount}, skipped=${skippedCount}, failed=${failedCount} ===`);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `csv-import-id-map-${ts}.json`), JSON.stringify(idMap, null, 2));
  flushLog(ts);
  log('INFO', `ID map saved: output/csv-import-id-map-${ts}.json`);
}

main().catch(err => { console.error(err); process.exit(1); });

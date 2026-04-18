/**
 * Delete all BigCapital expense records with ID > 1649.
 * These are QBO import records; ID ≤ 1649 are historical baseline.
 *
 * Usage:
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! npx tsx scripts/qbo-import/delete-expenses-gt-1649.ts
 *
 * Set DRY_RUN=false to actually delete. Default is dry-run.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.TIGHTBOOKS_API_BASE ?? 'https://app.tightbooks.com/api';
const EMAIL = process.env.TIGHTBOOKS_EMAIL ?? 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';
const DRY_RUN = process.env.DRY_RUN !== 'false';
const BASELINE_ID = 1649;
const DELAY_MS = parseInt(process.env.DELAY_MS ?? '400', 10);

const OUTPUT_DIR = path.join(__dirname, 'output');

const logLines: string[] = [];
function log(level: string, msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

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

async function fetchWithRetry(url: string, opts: RequestInit): Promise<Response> {
  let delay = 2000;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, opts);
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after') ?? 0) * 1000 || delay;
      console.warn(`[RETRY] ${res.status} attempt ${attempt + 1} — waiting ${wait}ms`);
      await sleep(wait);
      delay = Math.min(delay * 2, 30_000);
      continue;
    }
    return res;
  }
  throw new Error(`Max retries exceeded for ${url}`);
}

async function fetchAllExpenseIds(token: string, org: string): Promise<number[]> {
  const headers = makeHeaders(token, org);
  const ids: number[] = [];
  let page = 1;
  while (true) {
    const res = await fetchWithRetry(`${API_BASE}/expenses?page=${page}&pageSize=200`, { headers });
    if (!res.ok) throw new Error(`GET expenses page ${page} failed: ${res.status}`);
    const data = await res.json() as any;
    const items: any[] = data?.expenses ?? [];
    for (const e of items) {
      if (e.id > BASELINE_ID) ids.push(e.id);
    }
    log('INFO', `  Page ${page}: ${items.length} items, ${ids.length} to-delete so far`);
    if (items.length < 12) break;
    page++;
    await sleep(300);
  }
  return ids;
}

async function main() {
  log('INFO', `DRY_RUN=${DRY_RUN}, BASELINE_ID=${BASELINE_ID}`);
  if (!DRY_RUN && !PASSWORD) { console.error('TIGHTBOOKS_PASSWORD required'); process.exit(1); }

  let token = '';
  let org = '';
  if (!DRY_RUN) {
    ({ token, org } = await authenticate());
    log('INFO', 'Authenticated.');
  }

  log('INFO', 'Fetching all expense IDs > 1649...');
  const idsToDelete = DRY_RUN ? [] : await fetchAllExpenseIds(token, org);
  log('INFO', `Found ${idsToDelete.length} expenses with ID > ${BASELINE_ID} to delete.`);

  if (DRY_RUN) {
    log('DRY', `Would delete all expenses with ID > ${BASELINE_ID}.`);
  } else {
    let deleted = 0;
    let failed = 0;
    const headers = makeHeaders(token, org);
    for (const id of idsToDelete) {
      await sleep(DELAY_MS);
      const res = await fetchWithRetry(`${API_BASE}/expenses/${id}`, { method: 'DELETE', headers });
      if (res.ok || res.status === 404) {
        deleted++;
        if (deleted % 50 === 0) log('INFO', `  Deleted ${deleted}/${idsToDelete.length}...`);
      } else {
        const txt = await res.text();
        log('ERROR', `Failed to delete ${id}: ${res.status} ${txt.slice(0, 100)}`);
        failed++;
      }
    }
    log('INFO', `=== DONE: deleted=${deleted}, failed=${failed} ===`);
    log('INFO', `Remaining expenses should be ≤ ${BASELINE_ID + 1} IDs (historical baseline).`);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `delete-gt1649-${ts}.log`), logLines.join('\n') + '\n');
  log('INFO', `Log: output/delete-gt1649-${ts}.log`);
}

main().catch(err => { console.error(err); process.exit(1); });

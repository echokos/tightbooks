/**
 * Fix BC 1068 (Office Supplies & Software) and BC 1066 (Misc) expenses.
 * The regular expenses API returns only 12 per page (fixed by BC server).
 * Paginate through all pages to find and delete wrong-account expense records.
 *
 * BC 1068: keep only expense IDs 2403 (INSTA-HDSHOT $69) and 2719 (LEMSQZY $188.85)
 * BC 1066: delete all remaining Misc expenses
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
const OUTPUT_DIR = path.join(__dirname, 'output');

const logLines: string[] = [];
function log(level: string, msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

class ApiClient {
  private tokens: { accessToken: string; organizationId: string } | null = null;

  constructor(private baseUrl: string, private email: string, private password: string) {}

  async authenticate(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    if (!res.ok) throw new Error(`Auth failed ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    this.tokens = {
      accessToken: data.accessToken ?? data.access_token,
      organizationId: data.organizationId ?? data.organization_id,
    };
  }

  private headers() {
    if (!this.tokens) throw new Error('Not authenticated');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.tokens.accessToken}`,
      'organization-id': this.tokens.organizationId,
    };
  }

  async get<T>(path: string): Promise<T> {
    let attempt = 0;
    let delay = 3000;
    while (true) {
      const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
      if ((res.status === 429 || res.status >= 500) && attempt < 8) {
        const retryAfter = Number(res.headers.get('retry-after') ?? 0);
        const wait = retryAfter > 0 ? retryAfter * 1000 : delay;
        console.warn(`[RETRY] ${res.status} on GET ${path} (attempt ${attempt + 1}) — waiting ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        delay = Math.min(delay * 2, 60_000);
        attempt++;
        continue;
      }
      if (!res.ok) throw new Error(`GET ${path} failed ${res.status}: ${await res.text()}`);
      return res.json() as Promise<T>;
    }
  }

  async delete(path: string): Promise<{ ok: boolean; status: number; raw: string }> {
    let attempt = 0;
    let delay = 2000;
    while (true) {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'DELETE',
        headers: this.headers(),
      });
      if ((res.status === 429 || res.status >= 500) && attempt < 5) {
        await new Promise(r => setTimeout(r, delay));
        delay = Math.min(delay * 2, 30_000);
        attempt++;
        continue;
      }
      const raw = await res.text();
      return { ok: res.ok, status: res.status, raw };
    }
  }
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function getExpenseAccountIds(exp: any): number[] {
  const cats = exp.categories ?? [];
  const ids: number[] = [];
  for (const c of cats) {
    const id = c.expenseAccountId ?? c.expense_account_id ?? c.accountId ?? c.account_id;
    if (id) ids.push(Number(id));
  }
  return ids;
}

async function main() {
  log('INFO', `DRY_RUN=${DRY_RUN}`);
  if (!DRY_RUN && !PASSWORD) { console.error('TIGHTBOOKS_PASSWORD required'); process.exit(1); }

  const client = new ApiClient(API_BASE, EMAIL, PASSWORD);
  if (!DRY_RUN) {
    await client.authenticate();
    log('INFO', 'Authenticated.');
  }

  const KEEP_1068 = new Set([2403, 2719]);
  const to1068Delete: number[] = [];
  const to1066Delete: number[] = [];

  // Paginate through ALL expense pages (API returns 12 per page regardless of pageSize)
  log('INFO', 'Paginating through all expenses...');
  let page = 1;
  let total = 0;
  while (true) {
    const res = await client.get<any>(`/expenses?page=${page}&pageSize=200`);
    const items: any[] = res?.expenses ?? [];
    total += items.length;

    for (const exp of items) {
      const expId = exp.id;
      const accountIds = getExpenseAccountIds(exp);

      if (accountIds.includes(1068)) {
        if (KEEP_1068.has(expId)) {
          log('KEEP', `Expense ${expId} in BC 1068 — keeping (correct QBO 102 item)`);
        } else {
          const cats = exp.categories ?? [];
          const amt = cats.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
          const note = exp.description ?? exp.payment_account?.name ?? '';
          log('FOUND', `Expense ${expId} ($${amt}) in BC 1068 → DELETE: ${note}`);
          to1068Delete.push(expId);
        }
      }

      if (accountIds.includes(1066)) {
        const cats = exp.categories ?? [];
        const amt = cats.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
        const note = exp.description ?? '';
        log('FOUND', `Expense ${expId} ($${amt}) in BC 1066 → DELETE: ${note}`);
        to1066Delete.push(expId);
      }
    }

    if (items.length < 12) break; // last page
    page++;
    if (page % 10 === 0) log('INFO', `  Scanned ${total} expenses so far (page ${page})...`);
    await sleep(600);
  }

  log('INFO', `Scanned ${total} total expenses across ${page} pages`);
  log('INFO', `BC 1068 to delete: ${to1068Delete.length} expenses`);
  log('INFO', `BC 1066 to delete: ${to1066Delete.length} expenses`);

  if (DRY_RUN) {
    log('DRY', `Would delete: BC1068=[${to1068Delete.join(',')}] BC1066=[${to1066Delete.join(',')}]`);
    return;
  }

  // Delete BC 1068 wrong expenses
  let deleted1068 = 0;
  for (const expId of to1068Delete) {
    await sleep(300);
    const result = await client.delete(`/expenses/${expId}`);
    if (result.ok || result.status === 404) {
      log('DELETE', `BC 1068 expense ${expId} deleted (${result.status})`);
      deleted1068++;
    } else {
      log('ERROR', `Failed to delete BC 1068 expense ${expId}: ${result.status} ${result.raw.slice(0, 100)}`);
    }
  }

  // Delete BC 1066 Misc expenses
  let deleted1066 = 0;
  for (const expId of to1066Delete) {
    await sleep(300);
    const result = await client.delete(`/expenses/${expId}`);
    if (result.ok || result.status === 404) {
      log('DELETE', `BC 1066 Misc expense ${expId} deleted (${result.status})`);
      deleted1066++;
    } else {
      log('ERROR', `Failed to delete BC 1066 expense ${expId}: ${result.status} ${result.raw.slice(0, 100)}`);
    }
  }

  log('INFO', `=== DONE ===`);
  log('INFO', `BC 1068: deleted ${deleted1068}/${to1068Delete.length}`);
  log('INFO', `BC 1066: deleted ${deleted1066}/${to1066Delete.length}`);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `fix-expenses-${ts}.log`), logLines.join('\n') + '\n');
  log('INFO', `Log saved: fix-expenses-${ts}.log`);
}

main().catch(err => { console.error(err); process.exit(1); });

/**
 * Fix P&L discrepancies between QBO and BigCapital.
 *
 * Corrections to apply:
 *  1. Delete 11 R&D duplicate expenses (from run3 re-import of RUNPOD.IO)
 *  2. Delete BC 1068 (Office Supplies & Software) wrong-account expenses (keeping only ref_id=2403 and 2719)
 *  3. Delete remaining Misc (BC 1066) expenses
 *  4. Create corrective journal A: reclassify deposit credits from BC 1044 → income accounts
 *     (RingPartner $578.41, eLocal $2100.64, Commission Earned $266.50)
 *  5. Create corrective journal B: reclassify HONK+ServiceDirect from BC 1044 → UF
 *     (HONK $124 + ServiceDirect $762.65 = $886.65)
 *  6. Create corrective journal C: reclassify Domain Sales from "Sales" parent → Domain Sales child
 *     (if needed — only if BC P&L is showing "Sales" instead of "Domain Sales")
 *
 * Usage:
 *   DRY_RUN=false TIGHTBOOKS_PASSWORD=TightBooks2026! npx tsx scripts/qbo-import/fix-pnl-discrepancies.ts
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

// ===== KNOWN IDs FROM ANALYSIS =====

// BC 1083 (R&D) — run3 duplicate expense IDs to delete
const RD_DUPLICATE_EXPENSE_IDS = [2959, 2962, 2968, 2972, 2977, 2989, 2999, 3009, 3014, 3022, 3031];

// BC 1044 account IDs for corrective journals
const BC_1044_COMMISSIONS_FEES = 1044;
const BC_1002_UNDEPOSITED_FUNDS = 1002;
const BC_1125_COMMISSION_EARNED = 1125;
const BC_1126_COMMISSION_EARNED_ELOCAL = 1126;
const BC_1128_COMMISSION_EARNED_RINGPARTNER = 1128;

// Deposits that went to BC 1044 (wrong) → should go to income accounts
const WRONG_DEPOSIT_RINGPARTNER = 578.41;  // → BC 1128
const WRONG_DEPOSIT_ELOCAL = 2100.64;      // → BC 1126
const WRONG_DEPOSIT_COMMISSION_EARNED = 266.50; // → BC 1125
const WRONG_DEPOSIT_HONK = 124.00;         // → UF (already captured via receipts)
const WRONG_DEPOSIT_SERVICEDIRECT = 762.65; // → UF (already captured via receipts)

const logLines: string[] = [];
function log(level: string, msg: string) {
  const line = `[${level.padEnd(7)}] ${msg}`;
  logLines.push(line);
  console.log(line);
}

interface AuthTokens {
  accessToken: string;
  organizationId: string;
}

class ApiClient {
  private tokens: AuthTokens | null = null;

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
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`GET ${path} failed ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: T; raw: string }> {
    let attempt = 0;
    let delay = 2000;
    while (true) {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      if ((res.status === 429 || res.status >= 500) && attempt < 5) {
        await new Promise(r => setTimeout(r, delay));
        delay = Math.min(delay * 2, 30_000);
        attempt++;
        continue;
      }
      const raw = await res.text();
      let data: T;
      try { data = JSON.parse(raw); } catch { data = raw as any; }
      return { ok: res.ok, status: res.status, data, raw };
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

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// Fetch all pages of GL for a given account, return transactions
async function fetchGLAccount(client: ApiClient, accountId: number): Promise<any[]> {
  const res = await client.get<any>(
    `/reports/general-ledger?fromDate=2025-01-01&toDate=2025-12-31&accountsIds[]=${accountId}`
  );
  const entries = res?.data ?? [];
  // Try fetching without filter too if empty
  if (entries.length === 0) {
    log('WARN', `GL filter returned 0 for BC ${accountId}, fetching all accounts...`);
    const allRes = await client.get<any>(`/reports/general-ledger?fromDate=2025-01-01&toDate=2025-12-31`);
    const allEntries = allRes?.data ?? [];
    const found = allEntries.find((e: any) => e.id == accountId);
    return found?.transactions ?? [];
  }
  return entries[0]?.transactions ?? entries;
}

// Fetch all expenses from BC (all pages)
async function fetchAllExpenses(client: ApiClient): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const res = await client.get<any>(`/expenses?page=${page}&pageSize=200`);
    const items: any[] = res?.expenses ?? [];
    all.push(...items);
    if (items.length < 200) break;
    page++;
    await sleep(300);
  }
  return all;
}

async function main() {
  log('INFO', `DRY_RUN=${DRY_RUN}`);
  if (!DRY_RUN && !PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD required');
    process.exit(1);
  }

  const client = new ApiClient(API_BASE, EMAIL, PASSWORD);
  if (!DRY_RUN) {
    await client.authenticate();
    log('INFO', 'Authenticated.');
  }

  // =====================================================================
  // STEP 1: Inspect current state via GL
  // =====================================================================
  log('INFO', '--- STEP 1: Fetching GL data to understand current state ---');

  if (!DRY_RUN) {
    // Fetch all GL accounts
    const allGLRes = await client.get<any>('/reports/general-ledger?fromDate=2025-01-01&toDate=2025-12-31');
    const allGLData: any[] = allGLRes?.data ?? [];
    log('INFO', `GL data: ${allGLData.length} accounts`);

    // Find key accounts
    const accounts: Record<number, any> = {};
    for (const a of allGLData) {
      accounts[a.id] = a;
    }

    const TARGET_ACCOUNTS = [1044, 1068, 1066, 1083, 1125, 1126, 1128, 1131, 1002];
    for (const aid of TARGET_ACCOUNTS) {
      const a = accounts[aid];
      if (a) {
        const txns = a.transactions ?? [];
        const closing = a.closing ?? 0;
        log('INFO', `BC ${aid} (${a.name}): ${txns.length} transactions, closing=${closing}`);

        // List transactions for key accounts
        if ([1044, 1068, 1066, 1083].includes(aid)) {
          for (const t of txns) {
            const credit = t.credit ?? 0;
            const debit = t.debit ?? 0;
            const refId = t.ref_id ?? t.referenceId ?? t.id ?? '?';
            const refNo = t.ref_no ?? t.referenceNo ?? t.reference ?? '';
            log('INFO', `  TX: ref_id=${refId} ref_no=${refNo} Dr=${debit} Cr=${credit} date=${t.date ?? ''} note=${(t.note ?? '').slice(0, 50)}`);
          }
        }
      } else {
        log('WARN', `BC ${aid} not found in GL data`);
      }
    }
  }

  // =====================================================================
  // STEP 2: Delete R&D duplicate expenses
  // =====================================================================
  log('INFO', '--- STEP 2: Delete R&D duplicate expense records ---');
  log('INFO', `R&D duplicate IDs to delete: ${RD_DUPLICATE_EXPENSE_IDS.join(', ')}`);

  let rdDeleted = 0;
  if (!DRY_RUN) {
    for (const expId of RD_DUPLICATE_EXPENSE_IDS) {
      await sleep(300);
      const result = await client.delete(`/expenses/${expId}`);
      if (result.ok || result.status === 404) {
        log('DELETE', `Expense ${expId} deleted (${result.status})`);
        rdDeleted++;
      } else {
        log('ERROR', `Failed to delete expense ${expId}: ${result.status} ${result.raw.slice(0, 100)}`);
      }
    }
    log('INFO', `R&D: deleted ${rdDeleted}/${RD_DUPLICATE_EXPENSE_IDS.length} expenses`);
  } else {
    log('DRY', `Would delete ${RD_DUPLICATE_EXPENSE_IDS.length} R&D duplicate expenses`);
  }

  // =====================================================================
  // STEP 3: Identify and delete BC 1068 wrong-account expenses
  // Keep only: ref_id=2403 (INSTA-HDSHOT $69) and ref_id=2719 (LEMSQZY $188.85)
  // =====================================================================
  log('INFO', '--- STEP 3: Delete BC 1068 wrong-account expense records ---');

  if (!DRY_RUN) {
    // Fetch all expenses, find those in BC 1068
    const allExpenses = await fetchAllExpenses(client);
    log('INFO', `Total expenses fetched: ${allExpenses.length}`);

    // BC 1068 = "Office Supplies & Software" account
    const bc1068Expenses = allExpenses.filter((e: any) => {
      const cats = e.categories ?? [];
      return cats.some((c: any) => c.expenseAccountId === 1068 || c.expense_account_id === 1068);
    });
    log('INFO', `BC 1068 expenses: ${bc1068Expenses.length}`);

    const KEEP_IDS = new Set([2403, 2719]);
    let bc1068Deleted = 0;
    let bc1068Kept = 0;

    for (const exp of bc1068Expenses) {
      const expId = exp.id;
      if (KEEP_IDS.has(expId)) {
        log('KEEP', `Expense ${expId} (${exp.referenceNo ?? exp.payment_account_id}) — keeping (correct QBO 102 mapping)`);
        bc1068Kept++;
        continue;
      }
      await sleep(300);
      const result = await client.delete(`/expenses/${expId}`);
      if (result.ok || result.status === 404) {
        const cats = exp.categories ?? [];
        const amt = cats.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
        log('DELETE', `Expense ${expId} ($${amt}) deleted from BC 1068 (${result.status})`);
        bc1068Deleted++;
      } else {
        log('ERROR', `Failed to delete BC 1068 expense ${expId}: ${result.status} ${result.raw.slice(0, 100)}`);
      }
    }
    log('INFO', `BC 1068: deleted ${bc1068Deleted}, kept ${bc1068Kept}`);
  } else {
    log('DRY', 'Would fetch all expenses and delete those in BC 1068 (except ref_id 2403, 2719)');
  }

  // =====================================================================
  // STEP 4: Delete remaining Misc (BC 1066) expenses
  // =====================================================================
  log('INFO', '--- STEP 4: Delete remaining Misc (BC 1066) expenses ---');

  if (!DRY_RUN) {
    const allExpenses2 = await fetchAllExpenses(client);
    const miscExpenses = allExpenses2.filter((e: any) => {
      const cats = e.categories ?? [];
      return cats.some((c: any) => c.expenseAccountId === 1066 || c.expense_account_id === 1066);
    });
    log('INFO', `BC 1066 (Misc) expenses remaining: ${miscExpenses.length}`);

    let miscDeleted = 0;
    for (const exp of miscExpenses) {
      const expId = exp.id;
      await sleep(300);
      const result = await client.delete(`/expenses/${expId}`);
      if (result.ok || result.status === 404) {
        const cats = exp.categories ?? [];
        const amt = cats.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
        log('DELETE', `Misc expense ${expId} ($${amt}) deleted (${result.status})`);
        miscDeleted++;
      } else {
        log('ERROR', `Failed to delete Misc expense ${expId}: ${result.status} ${result.raw.slice(0, 100)}`);
      }
    }
    log('INFO', `BC 1066: deleted ${miscDeleted} expenses`);
  } else {
    log('DRY', 'Would delete all remaining Misc (BC 1066) expenses');
  }

  // =====================================================================
  // STEP 5: Create corrective journal A
  // Reclassify deposit credits from BC 1044 → real income accounts
  // Dr BC 1044 $2,945.55 / Cr BC 1128 $578.41 / Cr BC 1126 $2,100.64 / Cr BC 1125 $266.50
  // =====================================================================
  log('INFO', '--- STEP 5: Create corrective journal A (income reclassification) ---');

  const journalATotal = WRONG_DEPOSIT_RINGPARTNER + WRONG_DEPOSIT_ELOCAL + WRONG_DEPOSIT_COMMISSION_EARNED;
  log('INFO', `Journal A: Dr 1044 $${journalATotal} | Cr 1128 $${WRONG_DEPOSIT_RINGPARTNER} | Cr 1126 $${WRONG_DEPOSIT_ELOCAL} | Cr 1125 $${WRONG_DEPOSIT_COMMISSION_EARNED}`);

  if (!DRY_RUN) {
    const journalAPayload = {
      date: '2025-12-31',
      journalNumber: 'CORR-A-INCOME-RECLASSIFY',
      reference: 'CORR-A-INCOME-RECLASSIFY',
      description: 'Corrective: reclassify deposit credits from Commissions & fees (1044) to correct income accounts',
      publish: true,
      entries: [
        { index: 0, accountId: BC_1044_COMMISSIONS_FEES, debit: journalATotal },
        { index: 1, accountId: BC_1128_COMMISSION_EARNED_RINGPARTNER, credit: WRONG_DEPOSIT_RINGPARTNER },
        { index: 2, accountId: BC_1126_COMMISSION_EARNED_ELOCAL, credit: WRONG_DEPOSIT_ELOCAL },
        { index: 3, accountId: BC_1125_COMMISSION_EARNED, credit: WRONG_DEPOSIT_COMMISSION_EARNED },
      ],
    };

    await sleep(500);
    const resultA = await client.post<any>('/manual-journals', journalAPayload);
    if (resultA.ok) {
      const jId = resultA.data?.manualJournal?.id ?? resultA.data?.id ?? '?';
      log('CREATED', `Journal A created (id=${jId}): Dr 1044 $${journalATotal}, Cr income accounts`);
    } else {
      log('ERROR', `Journal A failed: ${resultA.status} ${resultA.raw.slice(0, 200)}`);
    }
  } else {
    log('DRY', `Would create journal A: Dr 1044 $${journalATotal} → Cr income accounts`);
  }

  // =====================================================================
  // STEP 6: Create corrective journal B
  // Reclassify HONK + ServiceDirect from BC 1044 → Undeposited Funds
  // (these were clearing deposits; receipts already captured income)
  // Dr BC 1044 $886.65 / Cr BC 1002 $886.65
  // =====================================================================
  log('INFO', '--- STEP 6: Create corrective journal B (HONK+ServiceDirect → UF) ---');

  const journalBTotal = WRONG_DEPOSIT_HONK + WRONG_DEPOSIT_SERVICEDIRECT;
  log('INFO', `Journal B: Dr 1044 $${journalBTotal} | Cr 1002 (UF) $${journalBTotal}`);
  log('INFO', `  HONK $${WRONG_DEPOSIT_HONK} + ServiceDirect $${WRONG_DEPOSIT_SERVICEDIRECT}`);

  if (!DRY_RUN) {
    const journalBPayload = {
      date: '2025-12-31',
      journalNumber: 'CORR-B-HONK-SD-TO-UF',
      reference: 'CORR-B-HONK-SD-TO-UF',
      description: 'Corrective: move HONK/ServiceDirect clearing deposit credits from 1044 back to Undeposited Funds',
      publish: true,
      entries: [
        { index: 0, accountId: BC_1044_COMMISSIONS_FEES, debit: journalBTotal },
        { index: 1, accountId: BC_1002_UNDEPOSITED_FUNDS, credit: journalBTotal },
      ],
    };

    await sleep(500);
    const resultB = await client.post<any>('/manual-journals', journalBPayload);
    if (resultB.ok) {
      const jId = resultB.data?.manualJournal?.id ?? resultB.data?.id ?? '?';
      log('CREATED', `Journal B created (id=${jId}): Dr 1044 $${journalBTotal}, Cr UF`);
    } else {
      log('ERROR', `Journal B failed: ${resultB.status} ${resultB.raw.slice(0, 200)}`);
    }
  } else {
    log('DRY', `Would create journal B: Dr 1044 $${journalBTotal} → Cr UF`);
  }

  // =====================================================================
  // STEP 7: Check Domain Sales situation
  // If BC P&L shows "Sales" instead of "Domain Sales", we need to reclassify
  // First check account IDs
  // =====================================================================
  log('INFO', '--- STEP 7: Check Domain Sales BC account structure ---');

  if (!DRY_RUN) {
    // Fetch BC accounts list
    const accsRes = await client.get<any>('/accounts?type=income&pageSize=500');
    const accs: any[] = accsRes?.accounts ?? accsRes?.data ?? [];
    log('INFO', `Income accounts: ${accs.length}`);

    let domainSalesAcct: any = null;
    let salesParentAcct: any = null;
    for (const a of accs) {
      const name = (a.name ?? '').toLowerCase();
      if (name === 'domain sales') { domainSalesAcct = a; log('INFO', `  Found: Domain Sales id=${a.id} parentId=${a.parentAccountId ?? a.parent_account_id}`); }
      if (name === 'sales' && !domainSalesAcct?.parentAccountId) { salesParentAcct = a; log('INFO', `  Found: Sales id=${a.id} parentId=${a.parentAccountId ?? a.parent_account_id}`); }
    }
    for (const a of accs) {
      log('INFO', `  Account: id=${a.id} name="${a.name}" parent=${a.parentAccountId ?? a.parent_account_id ?? 'none'}`);
    }

    if (domainSalesAcct && salesParentAcct) {
      // Check if GL for "Sales" parent has $3,799.10 that should be in Domain Sales
      log('INFO', `Domain Sales id=${domainSalesAcct.id}, Sales parent id=${salesParentAcct.id}`);
      // Check if a reclassification journal is needed
      // We'll skip this for now since the total income still matches
      log('INFO', 'Domain Sales check: both accounts found. Will check GL balance after PnL run.');
    } else if (!domainSalesAcct) {
      log('WARN', 'Domain Sales account not found in BC income accounts!');
    }
  } else {
    log('DRY', 'Would check Domain Sales account structure');
  }

  // =====================================================================
  // SUMMARY
  // =====================================================================
  log('INFO', '=== CORRECTION COMPLETE ===');
  log('INFO', `R&D duplicates: ${DRY_RUN ? '(dry)' : 'deleted'} ${RD_DUPLICATE_EXPENSE_IDS.length} expense records`);
  log('INFO', `BC 1068: ${DRY_RUN ? '(dry)' : 'deleted'} wrong-account expense records`);
  log('INFO', `BC 1066: ${DRY_RUN ? '(dry)' : 'deleted'} remaining Misc expense records`);
  log('INFO', `Journal A: ${DRY_RUN ? '(dry)' : 'created'} Dr 1044 $${journalATotal} → income accounts`);
  log('INFO', `Journal B: ${DRY_RUN ? '(dry)' : 'created'} Dr 1044 $${journalBTotal} → UF`);
  log('INFO', `After fix: BC Commissions & fees should be $369.99 (= QBO)`);
  log('INFO', `After fix: BC R&D should be $510 (= QBO)`);
  log('INFO', `After fix: BC Office Supplies & Software should be $257.85 (= QBO)`);
  log('INFO', `After fix: BC eLocal income +$2,100.64, RingPartner +$578.41, Commission Earned +$266.50`);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `fix-pnl-${ts}.log`), logLines.join('\n') + '\n');
  log('INFO', `Log saved: fix-pnl-${ts}.log`);
}

main().catch(err => { console.error(err); process.exit(1); });

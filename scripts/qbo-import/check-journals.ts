/**
 * Quick check: verify the corrective journals (1555, 1556) look right
 * and fetch the child income accounts to confirm they exist.
 */

const API_BASE = process.env.TIGHTBOOKS_API_BASE ?? 'https://app.tightbooks.com/api';
const EMAIL = 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';

async function auth() {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json() as any;
  return {
    token: data.accessToken ?? data.access_token,
    orgId: data.organizationId ?? data.organization_id,
  };
}

async function get(token: string, orgId: string, path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'organization-id': orgId,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}

async function main() {
  const { token, orgId } = await auth();
  console.log('Authenticated');

  // Check the corrective journals
  for (const jId of [1555, 1556]) {
    const j = await get(token, orgId, `/manual-journals/${jId}`);
    const mj = j.manualJournal ?? j;
    console.log(`\nJournal ${jId} (${mj.journal_number ?? mj.journalNumber}):`);
    const entries = mj.entries ?? mj.manual_journal_entries ?? [];
    for (const e of entries) {
      const dir = (e.debit ?? 0) > 0 ? `Dr $${e.debit}` : `Cr $${e.credit}`;
      console.log(`  ${dir} → account_id=${e.account_id ?? e.accountId} (${e.account?.name ?? ''})`);
    }
  }

  // Fetch accounts with pagination to find 1103+
  console.log('\n--- Checking all accounts (pages) ---');
  let page = 1;
  let found1125 = false, found1126 = false, found1128 = false, found1131 = false;
  while (true) {
    const res = await get(token, orgId, `/accounts?page=${page}&pageSize=200`) as any;
    const accs = res?.accounts ?? res?.data ?? [];
    if (accs.length === 0) break;
    for (const a of accs) {
      if ([1125, 1126, 1127, 1128, 1129, 1131].includes(a.id)) {
        console.log(`  Account ${a.id}: "${a.name}" type=${a.account_type ?? a.accountType} parent=${a.parentAccountId ?? a.parent_account_id ?? 'none'}`);
        if (a.id === 1125) found1125 = true;
        if (a.id === 1126) found1126 = true;
        if (a.id === 1128) found1128 = true;
        if (a.id === 1131) found1131 = true;
      }
    }
    if (accs.length < 200) break;
    page++;
  }
  if (!found1125) console.log('  BC 1125 NOT FOUND');
  if (!found1126) console.log('  BC 1126 NOT FOUND');
  if (!found1128) console.log('  BC 1128 NOT FOUND');
  if (!found1131) console.log('  BC 1131 NOT FOUND');

  // Also check the PnL now
  console.log('\n--- Current P&L snapshot ---');
  const pnl = await get(token, orgId, '/reports/profit-loss-sheet?fromDate=2025-01-01&toDate=2025-12-31&basis=cash') as any;
  const income = pnl?.data?.income ?? pnl?.income ?? {};
  const totalIncome = income?.total ?? 0;
  const expenses = pnl?.data?.expenses ?? pnl?.expenses ?? {};
  const totalExpenses = expenses?.total ?? 0;
  const netIncome = pnl?.data?.netIncome ?? pnl?.netIncome ?? 0;
  console.log(`  Total Income: $${totalIncome}`);
  console.log(`  Total Expenses: $${totalExpenses}`);
  console.log(`  Net Income: $${netIncome}`);
}

main().catch(err => { console.error(err); process.exit(1); });

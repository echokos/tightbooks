/**
 * Debug GL for BC 1068 to find expense reference IDs, and scan recent expenses to find BC 1068 ones
 */

const API_BASE = 'https://app.tightbooks.com/api';
const EMAIL = 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';

async function auth() {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json() as any;
  return { token: data.accessToken ?? data.access_token, orgId: data.organizationId ?? data.organization_id };
}

async function apiGet(token: string, orgId: string, path: string) {
  let attempt = 0;
  let delay = 3000;
  while (true) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'organization-id': orgId, 'Content-Type': 'application/json' },
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 30_000);
      attempt++;
      continue;
    }
    if (!res.ok) return { _error: res.status, _body: await res.text() };
    return res.json();
  }
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const { token, orgId } = await auth();
  console.log('Authenticated');

  // Get full GL with all fields for account 1068
  console.log('\n--- GL for BC 1068 (all transaction fields) ---');
  const gl = await apiGet(token, orgId, '/reports/general-ledger?fromDate=2025-01-01&toDate=2025-12-31') as any;
  const accounts = gl?.data ?? [];
  const acct1068 = accounts.find((a: any) => a.id === 1068);
  if (acct1068) {
    const txns = acct1068.transactions ?? [];
    console.log(`BC 1068 transactions: ${txns.length}`);
    if (txns.length > 0) {
      console.log('First transaction full structure:');
      console.log(JSON.stringify(txns[0], null, 2));
      console.log('\nAll transactions (key fields):');
      for (const t of txns) {
        const keys = Object.keys(t).join(', ');
        console.log(`  id=${t.id} ref_id=${t.ref_id} source_id=${t.source_id} entry_id=${t.entry_id} Dr=${t.debit ?? 0} Cr=${t.credit ?? 0} date=${t.date} ref=${t.reference ?? t.referenceNo ?? t.reference_no ?? ''}`);
      }
    }
  } else {
    console.log('BC 1068 not found in GL');
  }

  await sleep(1000);

  // Scan a few specific expense IDs that might be in BC 1068 (range 2000-2403)
  console.log('\n--- Checking specific expense IDs in range 2000-2402 for BC 1068 ---');
  // Try a sample of IDs in the expected range
  const sampleIds = [2000, 2050, 2100, 2150, 2200, 2250, 2300, 2350, 2400, 2401, 2402];
  for (const id of sampleIds) {
    await sleep(500);
    const exp = await apiGet(token, orgId, `/expenses/${id}`) as any;
    if (exp._error) {
      console.log(`  Expense ${id}: ${exp._error} (${exp._body?.slice(0, 50)})`);
    } else {
      const cats = exp.categories ?? [];
      const accts = cats.map((c: any) => c.expense_account_id).join(',');
      const amt = cats.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
      console.log(`  Expense ${id}: accounts=[${accts}] amt=$${amt} desc="${exp.description ?? ''}" ref="${exp.reference_no ?? ''}"`);
    }
  }

  await sleep(1000);

  // Scan last few pages of expenses to find old entries
  console.log('\n--- Scanning last pages of expenses to find BC 1068/1066 old entries ---');
  // Try pages 200-250
  for (let page = 200; page <= 250; page++) {
    await sleep(700);
    const res = await apiGet(token, orgId, `/expenses?page=${page}&pageSize=12`) as any;
    const items: any[] = res.expenses ?? res.data ?? [];
    if (items.length === 0) {
      console.log(`Page ${page}: 0 items — END of list`);
      break;
    }
    let found1068 = false;
    let found1066 = false;
    for (const exp of items) {
      const cats = exp.categories ?? [];
      for (const c of cats) {
        if (c.expense_account_id === 1068) found1068 = true;
        if (c.expense_account_id === 1066) found1066 = true;
      }
    }
    const minId = Math.min(...items.map((e: any) => e.id));
    const maxId = Math.max(...items.map((e: any) => e.id));
    const hasMatch = found1068 || found1066;
    console.log(`Page ${page}: ${items.length} items, IDs ${minId}-${maxId}${hasMatch ? ' *** FOUND BC1068/1066 ***' : ''}`);
    if (hasMatch) {
      for (const exp of items) {
        const cats = exp.categories ?? [];
        const accts = cats.map((c: any) => c.expense_account_id);
        if (accts.includes(1068) || accts.includes(1066)) {
          const amt = cats.reduce((s: number, c: any) => s + (c.amount ?? 0), 0);
          console.log(`  >>> Expense ${exp.id}: accounts=[${accts}] $${amt} ref="${exp.reference_no ?? ''}"`);
        }
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });

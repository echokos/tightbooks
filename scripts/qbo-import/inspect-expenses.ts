/**
 * Inspect expense structure and test filters for BC 1068/1066 accounts
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

async function get(token: string, orgId: string, path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'organization-id': orgId, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return { error: res.status, body: await res.text() };
  return res.json();
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const { token, orgId } = await auth();
  console.log('Authenticated');

  // Try fetching a known expense (ID 2403 — INSTA-HDSHOT, should be in BC 1068)
  console.log('\n--- Expense 2403 (INSTA-HDSHOT, should be in BC 1068) ---');
  const exp2403 = await get(token, orgId, '/expenses/2403') as any;
  console.log(JSON.stringify(exp2403, null, 2));

  await sleep(1000);

  // Try fetching expense 2719 (LEMSQZY, should be in BC 1068)
  console.log('\n--- Expense 2719 (LEMSQZY, should be in BC 1068) ---');
  const exp2719 = await get(token, orgId, '/expenses/2719') as any;
  console.log(JSON.stringify(exp2719, null, 2));

  await sleep(1000);

  // Try filter by expense account
  console.log('\n--- GET /expenses?expense_account_id=1068 ---');
  const filter1 = await get(token, orgId, '/expenses?expense_account_id=1068&pageSize=50') as any;
  console.log('result keys:', Object.keys(filter1));
  console.log('count:', (filter1.expenses ?? filter1.data ?? []).length);

  await sleep(1000);

  // Try /expenses with first page to see structure
  console.log('\n--- GET /expenses page 1 (first expense structure) ---');
  const page1 = await get(token, orgId, '/expenses?page=1&pageSize=12') as any;
  const items = page1.expenses ?? page1.data ?? [];
  if (items.length > 0) {
    console.log('First expense keys:', Object.keys(items[0]));
    console.log('First expense sample:');
    const exp = items[0];
    console.log(`  id=${exp.id}`);
    console.log(`  categories:`, JSON.stringify(exp.categories ?? 'not present'));
    console.log(`  expense_accounts:`, JSON.stringify(exp.expense_accounts ?? 'not present'));
    console.log(`  lines:`, JSON.stringify(exp.lines ?? 'not present'));
    // print all keys and their values (top level)
    for (const [k, v] of Object.entries(exp)) {
      if (typeof v !== 'object') console.log(`  ${k}: ${v}`);
    }
  }

  await sleep(1000);

  // Try the last page to find old expenses
  console.log('\n--- GET /expenses page 10 (older expenses) ---');
  const page10 = await get(token, orgId, '/expenses?page=10&pageSize=12') as any;
  const items10 = page10.expenses ?? page10.data ?? [];
  for (const exp of items10.slice(0, 3)) {
    console.log(`  Expense id=${exp.id} date=${exp.date} ref=${exp.reference}`);
    console.log(`    categories:`, JSON.stringify(exp.categories ?? []));
  }
}

main().catch(err => { console.error(err); process.exit(1); });

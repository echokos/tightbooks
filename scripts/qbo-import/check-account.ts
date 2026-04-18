/**
 * Check BC account details for specific IDs and debug P&L tree
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
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'organization-id': orgId, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return { _error: res.status };
  return res.json();
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const { token, orgId } = await auth();
  console.log('Authenticated');

  // Check specific accounts
  for (const id of [1084, 1125, 1126, 1127, 1128, 1129, 1131]) {
    await sleep(500);
    const a = await apiGet(token, orgId, `/accounts/${id}`) as any;
    if (a._error) {
      console.log(`BC ${id}: ERROR ${a._error}`);
    } else {
      const acc = a.account ?? a;
      console.log(`BC ${id}: name="${acc.name}" type="${acc.account_type ?? acc.accountType}" parent_account_id=${acc.parent_account_id ?? acc.parentAccountId ?? 'none'}`);
    }
  }

  await sleep(1000);

  // Get BC P&L and dump tree structure for INCOME section
  console.log('\n--- BC P&L income section tree ---');
  const pnl = await apiGet(token, orgId, '/reports/profit-loss-sheet?fromDate=2025-01-01&toDate=2025-12-31&basis=cash') as any;
  const data: any[] = pnl?.data ?? pnl ?? [];

  for (const section of data) {
    if (section.id === 'INCOME') {
      console.log(`INCOME total: ${section.total?.amount}`);
      for (const child of section.children ?? []) {
        if (child.node_type === 'ACCOUNT') {
          const childAmt = child.total?.amount ?? 0;
          const grandkids = (child.children ?? []).filter((c: any) => c.node_type === 'ACCOUNT');
          console.log(`  [${child.id}] "${child.name}" total=${childAmt} children=${grandkids.length}`);
          for (const gk of grandkids) {
            console.log(`    [${gk.id}] "${gk.name}" total=${gk.total?.amount ?? 0}`);
          }
        }
      }
    }
    if (section.id === 'EXPENSES') {
      console.log(`\nEXPENSES total: ${section.total?.amount}`);
      for (const child of section.children ?? []) {
        if (child.node_type === 'ACCOUNT') {
          const childAmt = child.total?.amount ?? 0;
          const grandkids = (child.children ?? []).filter((c: any) => c.node_type === 'ACCOUNT');
          if (Math.abs(childAmt) > 0) {
            console.log(`  [${child.id}] "${child.name}" total=${childAmt} children=${grandkids.length}`);
            if (grandkids.length > 0) {
              for (const gk of grandkids) {
                if (Math.abs(gk.total?.amount ?? 0) > 0) {
                  console.log(`    [${gk.id}] "${gk.name}" total=${gk.total?.amount ?? 0}`);
                }
              }
            }
          }
        }
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });

/**
 * Extract expense IDs from GL reference_id field for BC 1068/1066,
 * then delete the wrong ones.
 *
 * BC 1068: keep only expense IDs 2403 (INSTA-HDSHOT $69) and 2719 (LEMSQZY $188.85)
 * BC 1066: delete ALL expense records (all are non-business transfers/payments)
 */

const API_BASE = 'https://app.tightbooks.com/api';
const EMAIL = 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';
const DRY_RUN = process.env.DRY_RUN !== 'false';

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
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      console.warn(`[RETRY] ${res.status} attempt ${attempt + 1} on GET ${path}`);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 60_000);
      attempt++;
      continue;
    }
    if (!res.ok) throw new Error(`GET ${path} failed ${res.status}: ${await res.text()}`);
    return res.json();
  }
}

async function apiDelete(token: string, orgId: string, path: string) {
  let attempt = 0;
  let delay = 2000;
  while (true) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'organization-id': orgId, 'Content-Type': 'application/json' },
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 30_000);
      attempt++;
      continue;
    }
    return { ok: res.ok, status: res.status, body: await res.text() };
  }
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`DRY_RUN=${DRY_RUN}`);
  const { token, orgId } = await auth();
  console.log('Authenticated');

  // Fetch GL for all accounts to get reference_ids
  console.log('Fetching GL...');
  const gl = await apiGet(token, orgId, '/reports/general-ledger?fromDate=2025-01-01&toDate=2025-12-31') as any;
  const accounts: any[] = gl?.data ?? [];
  console.log(`GL accounts: ${accounts.length}`);

  // Extract reference_ids for BC 1068 and BC 1066
  const bc1068 = accounts.find((a: any) => a.id === 1068);
  const bc1066 = accounts.find((a: any) => a.id === 1066);

  const expenseIds1068: number[] = [];
  const expenseIds1066: number[] = [];

  if (bc1068) {
    const txns: any[] = bc1068.transactions ?? [];
    console.log(`\nBC 1068 transactions: ${txns.length}`);
    for (const t of txns) {
      const refId = t.reference_id;
      const refType = t.reference_type;
      if (refId && refType === 'Expense') {
        console.log(`  reference_id=${refId} Dr=${t.debit ?? 0} date=${t.date?.slice(0,10)} note="${(t.note ?? '').slice(0, 40)}"`);
        expenseIds1068.push(Number(refId));
      } else {
        console.log(`  [SKIP] refType=${refType} refId=${refId} Dr=${t.debit ?? 0} date=${t.date?.slice(0,10)}`);
      }
    }
  } else {
    console.log('BC 1068 not found');
  }

  if (bc1066) {
    const txns: any[] = bc1066.transactions ?? [];
    console.log(`\nBC 1066 transactions: ${txns.length}`);
    for (const t of txns) {
      const refId = t.reference_id;
      const refType = t.reference_type;
      if (refId && refType === 'Expense') {
        console.log(`  reference_id=${refId} Dr=${t.debit ?? 0} date=${t.date?.slice(0,10)} note="${(t.note ?? '').slice(0, 40)}"`);
        expenseIds1066.push(Number(refId));
      } else {
        console.log(`  [SKIP] refType=${refType} refId=${refId} Dr=${t.debit ?? 0} date=${t.date?.slice(0,10)}`);
      }
    }
  } else {
    console.log('BC 1066 not found');
  }

  // For BC 1068: delete all EXCEPT 2403 and 2719
  const KEEP_1068 = new Set([2403, 2719]);
  const toDelete1068 = [...new Set(expenseIds1068)].filter(id => !KEEP_1068.has(id));
  const toDelete1066 = [...new Set(expenseIds1066)];

  console.log(`\nBC 1068 expense IDs: ${expenseIds1068.join(', ')}`);
  console.log(`BC 1068 to delete (excluding 2403, 2719): ${toDelete1068.join(', ')} (${toDelete1068.length} items)`);
  console.log(`BC 1066 to delete: ${toDelete1066.join(', ')} (${toDelete1066.length} items)`);

  if (DRY_RUN) {
    console.log('\nDRY RUN — no deletions performed');
    return;
  }

  // Delete BC 1068 wrong expenses
  let deleted = 0;
  let failed = 0;
  for (const expId of toDelete1068) {
    await sleep(400);
    const result = await apiDelete(token, orgId, `/expenses/${expId}`);
    if (result.ok || result.status === 404) {
      console.log(`[DELETE] BC 1068 expense ${expId} (${result.status})`);
      deleted++;
    } else {
      console.log(`[ERROR] BC 1068 expense ${expId}: ${result.status} ${result.body.slice(0, 80)}`);
      failed++;
    }
  }

  // Delete BC 1066 Misc expenses
  for (const expId of toDelete1066) {
    await sleep(400);
    const result = await apiDelete(token, orgId, `/expenses/${expId}`);
    if (result.ok || result.status === 404) {
      console.log(`[DELETE] BC 1066 Misc expense ${expId} (${result.status})`);
      deleted++;
    } else {
      console.log(`[ERROR] BC 1066 Misc expense ${expId}: ${result.status} ${result.body.slice(0, 80)}`);
      failed++;
    }
  }

  console.log(`\n=== DONE: deleted=${deleted} failed=${failed} ===`);
  console.log(`BC 1068: deleted ${toDelete1068.length - failed} wrong-account expenses (kept 2403, 2719)`);
  console.log(`BC 1066: deleted ${toDelete1066.length} Misc expenses`);
}

main().catch(err => { console.error(err); process.exit(1); });

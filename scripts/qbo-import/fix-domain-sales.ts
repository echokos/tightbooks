/**
 * Fix Domain Sales: the $3,799.10 went to BC 1084 (Sales parent) as a residual
 * instead of BC 1131 (Domain Sales child).
 *
 * Corrective journal: Dr BC 1084 $3,799.10 / Cr BC 1131 $3,799.10
 * This moves it from parent residual to the correct child account.
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

async function apiPost(token: string, orgId: string, path: string, body: unknown) {
  let attempt = 0;
  let delay = 2000;
  while (true) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'organization-id': orgId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 30_000);
      attempt++;
      continue;
    }
    const raw = await res.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { data = raw; }
    return { ok: res.ok, status: res.status, data, raw };
  }
}

async function main() {
  console.log(`DRY_RUN=${DRY_RUN}`);

  const AMOUNT = 3799.10;
  const SALES_PARENT_ID = 1084;    // BC "Sales" parent — currently has $3,799.10 residual
  const DOMAIN_SALES_ID = 1131;    // BC "Domain Sales" child — currently has $0

  console.log(`Corrective journal: Dr BC ${SALES_PARENT_ID} $${AMOUNT} / Cr BC ${DOMAIN_SALES_ID} $${AMOUNT}`);
  console.log('Effect: moves domain sales income from "Sales" parent residual to "Domain Sales" child');

  if (DRY_RUN) {
    console.log('DRY RUN — not creating journal');
    return;
  }

  const { token, orgId } = await auth();
  console.log('Authenticated');

  const payload = {
    date: '2025-12-31',
    journalNumber: 'CORR-C-DOMAIN-SALES',
    reference: 'CORR-C-DOMAIN-SALES',
    description: 'Corrective: reclassify domain sales income from Sales parent to Domain Sales child account',
    publish: true,
    entries: [
      { index: 0, accountId: SALES_PARENT_ID, debit: AMOUNT },
      { index: 1, accountId: DOMAIN_SALES_ID, credit: AMOUNT },
    ],
  };

  const result = await apiPost(token, orgId, '/manual-journals', payload);
  if (result.ok) {
    const jId = result.data?.manualJournal?.id ?? result.data?.id ?? '?';
    console.log(`[CREATED] Journal C (id=${jId}): Domain Sales reclassification`);
    console.log('After this: BC "Domain Sales" = $3,799.10 ✓, BC "Sales" residual = $0');
  } else {
    console.log(`[ERROR] ${result.status}: ${result.raw.slice(0, 200)}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });

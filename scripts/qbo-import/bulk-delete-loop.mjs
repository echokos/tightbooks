/**
 * Bulk delete all expenses with ID > 1649 using the BigCapital API.
 * Collects IDs from multiple pages per round for speed.
 * Run: node scripts/qbo-import/bulk-delete-loop.mjs
 */

const API_BASE = process.env.TIGHTBOOKS_API_BASE ?? 'https://app.tightbooks.com/api';
const EMAIL = 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD;
const PAGES_PER_BATCH = 8;
const INTER_ROUND_MS = 5000;

if (!PASSWORD) {
  console.error('TIGHTBOOKS_PASSWORD required');
  process.exit(1);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, opts, retries = 6) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, opts);
    if (res.status === 429) {
      const wait = 20000 * (i + 1);
      console.log(`  429 rate limited, waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    return res;
  }
  throw new Error(`Failed after ${retries} retries`);
}

async function auth() {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json();
  return { token: data.access_token, orgId: data.organization_id };
}

async function getExpensePage(token, orgId, page) {
  const res = await fetchWithRetry(
    `${API_BASE}/expenses?page=${page}&pageSize=200`,
    { headers: { 'Authorization': `Bearer ${token}`, 'organization-id': orgId } }
  );
  return res.json();
}

async function bulkDelete(token, orgId, ids) {
  const res = await fetchWithRetry(
    `${API_BASE}/expenses/bulk-delete`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'organization-id': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids, skipUndeletable: false }),
    }
  );
  const text = await res.text();
  return { status: res.status, body: text };
}

async function main() {
  let { token, orgId } = await auth();
  console.log(`Authenticated. OrgId: ${orgId}`);

  let round = 0;
  while (true) {
    round++;
    const allIds = new Set();

    // Collect from multiple pages
    for (let p = 1; p <= PAGES_PER_BATCH; p++) {
      if (round % 3 === 0 && p === 1) {
        ({ token, orgId } = await auth());
      }

      const page = await getExpensePage(token, orgId, 1); // always page 1, since we delete then refetch
      if (!page.expenses || page.expenses.length === 0) break;

      const total = page.pagination?.total ?? '?';
      const maxId = Math.max(...page.expenses.map(e => e.id));
      const pageIds = page.expenses.filter(e => e.id > 1649).map(e => e.id);

      pageIds.forEach(id => allIds.add(id));

      if (p === 1) {
        console.log(`\n=== Round ${round}: total=${total}, maxId=${maxId}, batch collecting... ===`);
      }

      if (maxId <= 1649) {
        console.log(`  Max ID ${maxId} <= 1649, no more to delete`);
        break;
      }

      // After first page fetch, delete immediately then re-fetch page 1
      if (p < PAGES_PER_BATCH && pageIds.length > 0) {
        const result = await bulkDelete(token, orgId, pageIds);
        console.log(`  Sub-delete ${pageIds.length} IDs (status=${result.status})`);
        await sleep(1500);
      }
    }

    if (allIds.size === 0) {
      console.log('No IDs > 1649 remain. Done!');
      break;
    }

    const ids = [...allIds];
    console.log(`  Final batch delete: ${ids.length} IDs`);
    const result = await bulkDelete(token, orgId, ids);
    console.log(`  Delete result: status=${result.status}`);

    await sleep(INTER_ROUND_MS);
  }

  console.log('\n=== Deletion complete. Final check ===');
  const { token: t2, orgId: o2 } = await auth();
  const final = await getExpensePage(t2, o2, 1);
  const finalTotal = final.pagination?.total ?? '?';
  const maxFinal = final.expenses?.length ? Math.max(...final.expenses.map(e => e.id)) : 0;
  console.log(`Final total: ${finalTotal}, Max ID: ${maxFinal}`);

  if (maxFinal > 1649) {
    console.log(`WARNING: Max ID ${maxFinal} still > 1649!`);
  } else {
    console.log('SUCCESS: All expenses with ID > 1649 deleted.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });

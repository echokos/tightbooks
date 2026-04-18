/**
 * Validate BigCapital P&L against QBO P&L for 2025 (cash basis).
 *
 * Usage:
 *   TIGHTBOOKS_PASSWORD=TightBooks2026! npx tsx scripts/qbo-import/validate-pnl.ts
 *
 * Env vars:
 *   TIGHTBOOKS_API_BASE   (default: https://app.tightbooks.com/api)
 *   TIGHTBOOKS_EMAIL      (default: assist@majorimpact.com)
 *   TIGHTBOOKS_PASSWORD   (required)
 *   QBO_EXPORT_DIR        (default: /home/elliott/nanoclaw/groups/maggie/exports/qbo)
 *   FROM_DATE             (default: 2025-01-01)
 *   TO_DATE               (default: 2025-12-31)
 *
 * Outputs:
 *   scripts/qbo-import/output/pnl-comparison-<timestamp>.json
 *   scripts/qbo-import/output/pnl-comparison-<timestamp>.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TightbooksApiClient } from './lib/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.TIGHTBOOKS_API_BASE ?? 'https://app.tightbooks.com/api';
const EMAIL = process.env.TIGHTBOOKS_EMAIL ?? 'assist@majorimpact.com';
const PASSWORD = process.env.TIGHTBOOKS_PASSWORD ?? '';
const QBO_DIR = process.env.QBO_EXPORT_DIR ?? '/home/elliott/nanoclaw/groups/maggie/exports/qbo';
const FROM_DATE = process.env.FROM_DATE ?? '2025-01-01';
const TO_DATE = process.env.TO_DATE ?? '2025-12-31';
const TOLERANCE = 1.00; // $1.00 per line item

const OUTPUT_DIR = path.join(__dirname, 'output');

// ── QBO P&L parsing ──────────────────────────────────────────────────────────

interface PnlLine {
  name: string;
  amount: number;
  group: 'income' | 'cogs' | 'expense' | 'other_income' | 'other_expense';
  parent?: string;
}

interface PnlSummary {
  totalIncome: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netIncome: number;
  lines: PnlLine[];
}

function parseQboPnl(raw: any): PnlSummary {
  const lines: PnlLine[] = [];
  let totalIncome = 0;
  let cogs = 0;
  let grossProfit = 0;
  let totalExpenses = 0;
  let netIncome = 0;

  function parseSection(row: any, group: PnlLine['group'], parent?: string) {
    if (row.type === 'Data') {
      const cols = row.ColData ?? [];
      const name = (cols[0]?.value ?? '').trim();
      const val = parseFloat(cols[1]?.value ?? '0') || 0;
      if (name && val !== 0) {
        lines.push({ name, amount: val, group, parent });
      }
      return;
    }
    if (row.type === 'Section') {
      const hdrCols = row.Header?.ColData ?? [];
      const sectionName = (hdrCols[0]?.value ?? '').trim();

      let childGroup: PnlLine['group'] = group;
      const summCols = row.Summary?.ColData ?? [];
      const summLabel = (summCols[0]?.value ?? '').toLowerCase();
      if (summLabel.includes('income')) childGroup = 'income';
      else if (summLabel.includes('cost of goods') || row.group === 'COGS') childGroup = 'cogs';
      else if (summLabel.includes('gross profit')) childGroup = 'income'; // rollup only

      const subRows = row.Rows?.Row ?? [];
      for (const sub of subRows) {
        parseSection(sub, childGroup, sectionName || parent);
      }

      // Capture summary totals
      if (summCols.length >= 2) {
        const v = parseFloat(summCols[1]?.value ?? '0') || 0;
        if (summLabel === 'total income') totalIncome = v;
        else if (summLabel === 'total cost of goods sold') cogs = v;
        else if (summLabel === 'gross profit') grossProfit = v;
        else if (summLabel === 'total expenses') totalExpenses = v;
        else if (summLabel === 'net income') netIncome = v;
      }
    } else {
      // Plain summary row (e.g., Gross Profit, Net Income)
      const summCols = row.Summary?.ColData ?? [];
      const summLabel = (summCols[0]?.value ?? '').toLowerCase();
      const v = parseFloat(summCols[1]?.value ?? '0') || 0;
      if (summLabel === 'gross profit') grossProfit = v;
      else if (summLabel === 'net income') netIncome = v;
    }
  }

  const topRows: any[] = raw?.Rows?.Row ?? [];
  for (const row of topRows) {
    const grp: PnlLine['group'] = row.group === 'Income' ? 'income'
      : row.group === 'COGS' ? 'cogs'
      : row.group === 'Expenses' ? 'expense'
      : row.group === 'OtherIncome' ? 'other_income'
      : row.group === 'OtherExpense' ? 'other_expense'
      : 'expense';
    parseSection(row, grp);
  }

  return { totalIncome, cogs, grossProfit, totalExpenses, netIncome, lines };
}

// ── BigCapital P&L parsing ───────────────────────────────────────────────────

interface BcPnlNode {
  id: string | number;
  name: string;
  total: { amount: number };
  children?: BcPnlNode[];
  node_type: string;
}

function parseBcPnl(data: BcPnlNode[], debugSections = false): PnlSummary {
  const lines: PnlLine[] = [];
  let totalIncome = 0;
  let cogs = 0;
  let grossProfit = 0;
  let totalExpenses = 0;
  let netIncome = 0;

  // Walk only leaf ACCOUNT nodes to avoid double-counting parent totals.
  // If an ACCOUNT has ACCOUNT children, those children will be walked instead.
  // If there are transactions directly on a parent account (no sub-accounts would
  // cover them), we emit a residual line so the parent's amount isn't silently lost.
  function walkNode(node: BcPnlNode, group: PnlLine['group'], parent?: string) {
    if (node.node_type !== 'ACCOUNT') return;

    const accountChildren = (node.children ?? []).filter((c) => c.node_type === 'ACCOUNT');
    if (accountChildren.length === 0) {
      // Leaf account — emit directly
      const amount = Math.abs(node.total?.amount ?? 0);
      if (amount !== 0) {
        lines.push({ name: node.name, amount, group, parent });
      }
    } else {
      // Parent account — walk children. If parent total != sum(children), there are
      // direct transactions on the parent; emit a residual so nothing is hidden.
      const childSum = accountChildren.reduce((s, c) => s + Math.abs(c.total?.amount ?? 0), 0);
      const parentTotal = Math.abs(node.total?.amount ?? 0);
      const residual = Math.round((parentTotal - childSum) * 100) / 100;
      if (Math.abs(residual) > 0.01) {
        lines.push({ name: node.name, amount: residual, group, parent });
      }
      for (const child of accountChildren) {
        walkNode(child, group, node.name);
      }
    }
  }

  if (debugSections) {
    console.log('\n=== RAW BigCapital P&L sections ===');
    for (const s of data) {
      const children = s.children ?? [];
      console.log(`  [${s.id}] total=${s.total?.amount ?? 'n/a'} children=${children.length}`);
      for (const c of children) {
        console.log(`    child node_type=${c.node_type} name=${c.name} total=${c.total?.amount ?? 'n/a'} subchildren=${(c.children ?? []).length}`);
        for (const gc of c.children ?? []) {
          console.log(`      grandchild node_type=${gc.node_type} name=${gc.name} total=${gc.total?.amount ?? 'n/a'}`);
        }
      }
    }
    console.log('===================================\n');
  }

  for (const section of data) {
    if (section.id === 'INCOME') {
      totalIncome = section.total?.amount ?? 0;
      for (const child of section.children ?? []) walkNode(child, 'income');
    } else if (section.id === 'GROSS_PROFIT') {
      grossProfit = section.total?.amount ?? 0;
    } else if (section.id === 'EXPENSES') {
      totalExpenses = section.total?.amount ?? 0;
      for (const child of section.children ?? []) walkNode(child, 'expense');
    } else if (section.id === 'NET_INCOME') {
      netIncome = section.total?.amount ?? 0;
    } else if (section.id === 'NET_OPERATING_INCOME') {
      // skip — we use NET_INCOME
    } else if (section.id === 'OTHER_INCOME') {
      for (const child of section.children ?? []) walkNode(child, 'other_income');
    } else if (section.id === 'OTHER_EXPENSE' || section.id === 'OTHER_EXPENSES') {
      for (const child of section.children ?? []) walkNode(child, 'other_expense');
    } else if (section.id === 'COST_OF_GOODS_SOLD' || section.id === 'COST_OF_SALES') {
      cogs = section.total?.amount ?? 0;
      for (const child of section.children ?? []) walkNode(child, 'cogs');
    }
  }

  return { totalIncome, cogs, grossProfit, totalExpenses, netIncome, lines };
}

// ── Comparison logic ─────────────────────────────────────────────────────────

interface Discrepancy {
  type: 'amount_mismatch' | 'missing_in_bc' | 'missing_in_qbo';
  accountName: string;
  group: string;
  qboAmount?: number;
  bcAmount?: number;
  delta?: number;
  notes?: string;
}

function comparePnl(qbo: PnlSummary, bc: PnlSummary): {
  discrepancies: Discrepancy[];
  summaryComparison: Record<string, { qbo: number; bc: number; delta: number; match: boolean }>;
} {
  const discrepancies: Discrepancy[] = [];

  // Build lookup maps (lowercase name → amount)
  const qboMap = new Map<string, { amount: number; group: string }>();
  for (const l of qbo.lines) qboMap.set(l.name.toLowerCase(), { amount: l.amount, group: l.group });

  const bcMap = new Map<string, { amount: number; group: string }>();
  for (const l of bc.lines) bcMap.set(l.name.toLowerCase(), { amount: l.amount, group: l.group });

  // QBO → BC comparison
  for (const [key, { amount: qboAmt, group }] of qboMap) {
    const bcEntry = bcMap.get(key);
    if (!bcEntry) {
      discrepancies.push({
        type: 'missing_in_bc',
        accountName: key,
        group,
        qboAmount: qboAmt,
        notes: 'Account present in QBO but not found in BigCapital P&L',
      });
    } else {
      const delta = Math.abs(qboAmt - bcEntry.amount);
      if (delta > TOLERANCE) {
        discrepancies.push({
          type: 'amount_mismatch',
          accountName: key,
          group,
          qboAmount: qboAmt,
          bcAmount: bcEntry.amount,
          delta,
          notes: `Difference: $${delta.toFixed(2)}`,
        });
      }
    }
  }

  // BC → QBO (find BC-only accounts)
  for (const [key, { amount, group }] of bcMap) {
    if (!qboMap.has(key)) {
      discrepancies.push({
        type: 'missing_in_qbo',
        accountName: key,
        group,
        bcAmount: amount,
        notes: 'Account present in BigCapital but not in QBO P&L',
      });
    }
  }

  const summaryComparison = {
    totalIncome: {
      qbo: qbo.totalIncome,
      bc: bc.totalIncome,
      delta: Math.abs(qbo.totalIncome - bc.totalIncome),
      match: Math.abs(qbo.totalIncome - bc.totalIncome) <= TOLERANCE,
    },
    cogs: {
      qbo: qbo.cogs,
      bc: bc.cogs,
      delta: Math.abs(qbo.cogs - bc.cogs),
      match: Math.abs(qbo.cogs - bc.cogs) <= TOLERANCE,
    },
    grossProfit: {
      qbo: qbo.grossProfit,
      bc: bc.grossProfit,
      delta: Math.abs(qbo.grossProfit - bc.grossProfit),
      match: Math.abs(qbo.grossProfit - bc.grossProfit) <= TOLERANCE,
    },
    totalExpenses: {
      qbo: qbo.totalExpenses,
      bc: bc.totalExpenses,
      delta: Math.abs(qbo.totalExpenses - bc.totalExpenses),
      match: Math.abs(qbo.totalExpenses - bc.totalExpenses) <= TOLERANCE,
    },
    netIncome: {
      qbo: qbo.netIncome,
      bc: bc.netIncome,
      delta: Math.abs(qbo.netIncome - bc.netIncome),
      match: Math.abs(qbo.netIncome - bc.netIncome) <= TOLERANCE,
    },
  };

  return { discrepancies, summaryComparison };
}

// ── Report generation ────────────────────────────────────────────────────────

function generateMarkdownReport(
  qbo: PnlSummary,
  bc: PnlSummary,
  result: ReturnType<typeof comparePnl>,
  runDate: string,
): string {
  const { discrepancies, summaryComparison } = result;
  const missingInBc = discrepancies.filter((d) => d.type === 'missing_in_bc');
  const missingInQbo = discrepancies.filter((d) => d.type === 'missing_in_qbo');
  const mismatches = discrepancies.filter((d) => d.type === 'amount_mismatch');
  const materialMismatches = mismatches.filter((d) => (d.delta ?? 0) > TOLERANCE);

  const fmt = (n: number) => `$${Math.abs(n).toFixed(2)}${n < 0 ? ' (credit)' : ''}`;
  const check = (b: boolean) => (b ? '✅' : '❌');

  const lines: string[] = [];
  lines.push(`# P&L Comparison: QBO vs BigCapital (2025)`);
  lines.push(`Run date: ${runDate} | Period: ${FROM_DATE} – ${TO_DATE} | Basis: Cash | Tolerance: $${TOLERANCE.toFixed(2)}`);
  lines.push('');

  lines.push('## Summary Totals');
  lines.push('');
  lines.push('| Category | QBO | BigCapital | Delta | Match |');
  lines.push('|----------|-----|------------|-------|-------|');
  for (const [cat, v] of Object.entries(summaryComparison)) {
    lines.push(`| ${cat} | ${fmt(v.qbo)} | ${fmt(v.bc)} | ${fmt(v.delta)} | ${check(v.match)} |`);
  }
  lines.push('');

  const allMatch = Object.values(summaryComparison).every((v) => v.match);
  if (allMatch && discrepancies.length === 0) {
    lines.push('## Result: ✅ PASS — All categories match within tolerance');
  } else {
    lines.push(`## Result: ❌ DISCREPANCIES FOUND`);
    lines.push('');
    lines.push(`- Amount mismatches: ${materialMismatches.length}`);
    lines.push(`- Missing in BigCapital: ${missingInBc.length}`);
    lines.push(`- Present in BigCapital but not QBO: ${missingInQbo.length}`);
  }
  lines.push('');

  if (materialMismatches.length > 0) {
    lines.push('## Amount Mismatches (> $1.00)');
    lines.push('');
    lines.push('| Account | Group | QBO | BigCapital | Delta |');
    lines.push('|---------|-------|-----|------------|-------|');
    for (const d of materialMismatches.sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))) {
      lines.push(`| ${d.accountName} | ${d.group} | ${fmt(d.qboAmount ?? 0)} | ${fmt(d.bcAmount ?? 0)} | ${fmt(d.delta ?? 0)} |`);
    }
    lines.push('');
  }

  if (missingInBc.length > 0) {
    lines.push('## Accounts in QBO but Missing in BigCapital');
    lines.push('');
    lines.push('| Account | Group | QBO Amount |');
    lines.push('|---------|-------|------------|');
    for (const d of missingInBc.sort((a, b) => (b.qboAmount ?? 0) - (a.qboAmount ?? 0))) {
      lines.push(`| ${d.accountName} | ${d.group} | ${fmt(d.qboAmount ?? 0)} |`);
    }
    lines.push('');
  }

  if (missingInQbo.length > 0) {
    lines.push('## Accounts in BigCapital but Not in QBO');
    lines.push('');
    lines.push('| Account | Group | BC Amount |');
    lines.push('|---------|-------|-----------|');
    for (const d of missingInQbo.sort((a, b) => (b.bcAmount ?? 0) - (a.bcAmount ?? 0))) {
      lines.push(`| ${d.accountName} | ${d.group} | ${fmt(d.bcAmount ?? 0)} |`);
    }
    lines.push('');
  }

  lines.push('## QBO Line Items');
  lines.push('');
  lines.push('| Account | Group | Amount |');
  lines.push('|---------|-------|--------|');
  for (const l of qbo.lines.sort((a, b) => b.amount - a.amount)) {
    lines.push(`| ${l.name} | ${l.group} | ${fmt(l.amount)} |`);
  }
  lines.push('');

  lines.push('## BigCapital Line Items');
  lines.push('');
  lines.push('| Account | Group | Amount |');
  lines.push('|---------|-------|--------|');
  for (const l of bc.lines.sort((a, b) => b.amount - a.amount)) {
    lines.push(`| ${l.name} | ${l.group} | ${fmt(l.amount)} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!PASSWORD) {
    console.error('TIGHTBOOKS_PASSWORD is required.');
    process.exit(1);
  }

  console.log('Authenticating...');
  const client = new TightbooksApiClient(API_BASE, EMAIL, PASSWORD);
  await client.authenticate();

  console.log('Fetching BigCapital P&L...');
  const bcPnlRaw = await client.get<any>(
    `/reports/profit-loss-sheet?fromDate=${FROM_DATE}&toDate=${TO_DATE}&basis=cash&noneZero=true`,
  );

  const bcData: BcPnlNode[] = bcPnlRaw?.data ?? [];
  const bc = parseBcPnl(bcData, true);

  console.log('Loading QBO P&L...');
  const qboRaw = JSON.parse(fs.readFileSync(path.join(QBO_DIR, 'pnl_2025.json'), 'utf8'));
  const qbo = parseQboPnl(qboRaw);

  console.log('\n=== QBO Summary ===');
  console.log(`Total Income:    $${qbo.totalIncome.toFixed(2)}`);
  console.log(`COGS:            $${qbo.cogs.toFixed(2)}`);
  console.log(`Gross Profit:    $${qbo.grossProfit.toFixed(2)}`);
  console.log(`Total Expenses:  $${qbo.totalExpenses.toFixed(2)}`);
  console.log(`Net Income:      $${qbo.netIncome.toFixed(2)}`);

  console.log('\n=== BigCapital Summary ===');
  console.log(`Total Income:    $${bc.totalIncome.toFixed(2)}`);
  console.log(`COGS:            $${bc.cogs.toFixed(2)}`);
  console.log(`Gross Profit:    $${bc.grossProfit.toFixed(2)}`);
  console.log(`Total Expenses:  $${bc.totalExpenses.toFixed(2)}`);
  console.log(`Net Income:      $${bc.netIncome.toFixed(2)}`);

  const comparison = comparePnl(qbo, bc);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(OUTPUT_DIR, `pnl-comparison-${timestamp}.json`);
  const mdPath = path.join(OUTPUT_DIR, `pnl-comparison-${timestamp}.md`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify({ qbo, bc, comparison }, null, 2));

  const md = generateMarkdownReport(qbo, bc, comparison, new Date().toISOString());
  fs.writeFileSync(mdPath, md);

  console.log('\n=== Comparison Result ===');
  const { discrepancies, summaryComparison } = comparison;
  for (const [cat, v] of Object.entries(summaryComparison)) {
    const symbol = v.match ? '✅' : '❌';
    console.log(`${symbol} ${cat}: QBO=$${v.qbo.toFixed(2)} BC=$${v.bc.toFixed(2)} Δ=$${v.delta.toFixed(2)}`);
  }
  console.log(`\nDiscrepancies: ${discrepancies.length} total`);
  console.log(`  - Amount mismatches: ${discrepancies.filter((d) => d.type === 'amount_mismatch').length}`);
  console.log(`  - Missing in BC: ${discrepancies.filter((d) => d.type === 'missing_in_bc').length}`);
  console.log(`  - Missing in QBO: ${discrepancies.filter((d) => d.type === 'missing_in_qbo').length}`);

  console.log(`\nReports written:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  MD:   ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

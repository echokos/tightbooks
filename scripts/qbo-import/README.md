# QBO Import Scripts

Scripts for migrating QuickBooks Online data into Tightbooks (BigCapital).

## Prerequisites

- `tsx` globally installed (`npm install -g tsx`)
- Access to the QBO export files at `/home/elliott/nanoclaw/groups/maggie/exports/qbo/`
- Tightbooks API credentials

## seed-chart-of-accounts.ts

Seeds the BigCapital chart of accounts from the QBO `chart_of_accounts.csv` export
and mines vendor→account rules from `purchase_merged.json`.

### Environment Variables

| Variable | Default | Required |
|---|---|---|
| `TIGHTBOOKS_API_BASE` | `https://app.tightbooks.com/api` | No |
| `TIGHTBOOKS_EMAIL` | `assist@majorimpact.com` | Yes (non-dry) |
| `TIGHTBOOKS_PASSWORD` | *(none)* | **Yes (non-dry)** |
| `QBO_EXPORT_DIR` | `/home/elliott/nanoclaw/groups/maggie/exports/qbo` | No |
| `DRY_RUN` | `true` | No |

**Never commit `TIGHTBOOKS_PASSWORD` to the repository.**

### Usage

```bash
# Dry run (default — safe to run anytime)
tsx scripts/qbo-import/seed-chart-of-accounts.ts

# Real run
TIGHTBOOKS_PASSWORD=your-password DRY_RUN=false tsx scripts/qbo-import/seed-chart-of-accounts.ts
```

### Outputs (in `scripts/qbo-import/output/`)

| File | Description |
|---|---|
| `qbo_to_bigcap_account_map.json` | Map of QBO account ID → BigCapital account ID (consumed by downstream importers) |
| `vendor_category_rules.json` | Vendor→default account rules mined from purchases (≥3 samples) |
| `vendor_category_rules_low_confidence.json` | Same, but <3 samples — review manually |
| `run-<timestamp>.log` | Full CREATED/REUSED/SKIPPED/ERROR log for the run |

The script is **idempotent**: re-running logs all accounts as REUSED and emits the same map.

## import-vendors.ts

Imports all 325 QBO vendors into BigCapital. Source: `vendors_raw.json`. Idempotent on `displayName`. Writes `vendor_qbo_to_bigcap_map.json` for downstream bill/expense importers.

### Environment Variables

| Variable | Default | Required |
|---|---|---|
| `TIGHTBOOKS_API_BASE` | `https://app.tightbooks.com/api` | No |
| `TIGHTBOOKS_EMAIL` | `assist@majorimpact.com` | Yes (non-dry) |
| `TIGHTBOOKS_PASSWORD` | *(none)* | **Yes (non-dry)** |
| `QBO_EXPORT_DIR` | `/home/elliott/nanoclaw/groups/maggie/exports/qbo` | No |
| `DRY_RUN` | `true` | No |

**Never commit `TIGHTBOOKS_PASSWORD` to the repository.**

### Usage

```bash
# Dry run (default — safe to run anytime)
tsx scripts/qbo-import/import-vendors.ts

# Real run
TIGHTBOOKS_PASSWORD=your-password DRY_RUN=false tsx scripts/qbo-import/import-vendors.ts
```

### Outputs (in `scripts/qbo-import/output/`)

| File | Description |
|---|---|
| `vendor_qbo_to_bigcap_map.json` | Map of QBO vendor ID → BigCapital vendor ID (consumed by bill/expense importers) |
| `run-vendors-<timestamp>.log` | Full CREATED/REUSED/SKIPPED/ERROR log for the run |

The script is **idempotent**: re-running against an already-imported target logs all vendors as REUSED.

## Dependency Order

For a full QBO migration, run scripts in this order:

1. `seed-chart-of-accounts.ts` — produces `qbo_to_bigcap_account_map.json`
2. `import-vendors.ts` (EK-563) — produces `vendor_qbo_to_bigcap_map.json`
3. `import-customers.ts` (EK-564, pending)
4. Bill/purchase import (future task)

#!/bin/bash
# continue-ek743.sh — wait for deletion to finish, then import + validate
# Called from EK-743 heartbeat. Runs in the background independently.
set -euo pipefail

LOG="/tmp/ek743-continue.log"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

cd "$REPO_DIR"
log "=== EK-743 Continue: waiting for deletion to finish ==="

# Wait for any running delete-expenses process to finish
while ps aux | grep -q "[d]elete-expenses-gt-1649"; do
  log "Deletion still running... waiting 30s"
  sleep 30
done
log "Deletion complete (or no deletion process found)"

# Verify expense count
AUTH=$(curl -s "https://app.tightbooks.com/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"assist@majorimpact.com","password":"TightBooks2026!"}')
TOKEN=$(echo "$AUTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('access_token','') or d.get('accessToken',''))")
ORG=$(echo "$AUTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('organization_id','') or d.get('organizationId',''))")

COUNT=$(curl -s "https://app.tightbooks.com/api/expenses?page=1&pageSize=12" \
  -H "Authorization: Bearer $TOKEN" -H "organization-id: $ORG" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('pagination',{}).get('total',0))")
log "Expense count after deletion: $COUNT"

# Wait for rate limits to clear before importing
log "Waiting 90s for rate limits to clear..."
sleep 90

# Run the CSV import
log "=== Starting CSV import ==="
DRY_RUN=false TIGHTBOOKS_PASSWORD=TightBooks2026! DELAY_MS=2000 \
  npx tsx scripts/qbo-import/import-from-csv.ts > /tmp/ek743-import.log 2>&1
log "Import complete. Log: /tmp/ek743-import.log"
tail -5 /tmp/ek743-import.log | tee -a "$LOG"

# Wait briefly then run validation
sleep 10
log "=== Starting P&L validation ==="
TIGHTBOOKS_PASSWORD=TightBooks2026! \
  npx tsx scripts/qbo-import/validate-pnl.ts > /tmp/ek743-validate.log 2>&1
log "Validation complete. Log: /tmp/ek743-validate.log"
tail -20 /tmp/ek743-validate.log | tee -a "$LOG"

log "=== EK-743 Continue: all done ==="

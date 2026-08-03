#!/usr/bin/env bash
# Deploy the operator dashboard to Vercel with ACCESS PROTECTION ON and a webhook bypass token.
# One argument: the hosted (Neon) DATABASE_URL. Everything else comes from .env.local.
#
#   ./scripts/deploy-dashboard.sh "postgresql://...neon.tech/..."
#
# What it does, in order:
#   1. migrate the hosted DB (file-based migrations, spec §4.8)
#   2. copy local data -> hosted (skips tables that already have rows)
#   3. deploy apps/dashboard to Vercel (deployment protection stays ON: the CRM must not be public)
#   4. set DATABASE_URL + CALCOM_WEBHOOK_SECRET on the Vercel project
#   5. mint a Protection Bypass for Automation secret
#   6. print the Cal.com Subscriber URL (webhook route + bypass token as query param)
set -euo pipefail
cd "$(dirname "$0")/.."

NEON_URL="${1:?usage: deploy-dashboard.sh \"<hosted DATABASE_URL>\"}"
VERCEL_TOKEN=$(grep '^VERCEL_TOKEN=' .env.local | cut -d= -f2)
TEAM_ID=$(grep '^VERCEL_TEAM_ID=' .env.local | cut -d= -f2)
SCOPE=$(grep -E '^\s*vercel_scope:' config/agency-facts.yaml | sed 's/.*"\(.*\)".*/\1/')
WEBHOOK_SECRET=$(grep '^CALCOM_WEBHOOK_SECRET=' .env.local | cut -d= -f2)
export VERCEL_TOKEN

echo "== 1/6 migrate hosted DB =="
DATABASE_URL="$NEON_URL" pnpm migrate

echo "== 2/6 copy data local -> hosted =="
(cd apps/worker && DATABASE_URL_KEEP=1 pnpm exec tsx src/copy-db.ts "$NEON_URL")

echo "== 3/6 deploy dashboard (protection stays ON) =="
DEPLOY_URL=$(vercel deploy --prod --yes --scope "$SCOPE" --cwd apps/dashboard 2>&1 | grep -oE 'https://[^ ]+\.vercel\.app' | tail -1)
echo "deployed: $DEPLOY_URL"
PROJECT="dashboard"

echo "== 4/6 set env on the project =="
printf '%s' "$NEON_URL"        | vercel env add DATABASE_URL production          --scope "$SCOPE" --cwd apps/dashboard --force
printf '%s' "$WEBHOOK_SECRET"  | vercel env add CALCOM_WEBHOOK_SECRET production --scope "$SCOPE" --cwd apps/dashboard --force
echo "redeploying with env..."
DEPLOY_URL=$(vercel deploy --prod --yes --scope "$SCOPE" --cwd apps/dashboard 2>&1 | grep -oE 'https://[^ ]+\.vercel\.app' | tail -1)

echo "== 5/6 mint protection-bypass secret =="
PROJECT_ID=$(curl -sS "https://api.vercel.com/v9/projects/$PROJECT?teamId=$TEAM_ID" -H "Authorization: Bearer $VERCEL_TOKEN" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).id))')
BYPASS=$(curl -sS -X PATCH "https://api.vercel.com/v1/projects/$PROJECT_ID/protection-bypass?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" -d '{}' \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);const k=Object.keys(o.protectionBypass??{})[0];console.log(k??"")})')
[ -n "$BYPASS" ] || { echo "FAILED to mint bypass secret; check token scopes"; exit 1; }

echo "== 6/6 done =="
echo ""
echo "Dashboard (Vercel login required):  $DEPLOY_URL"
echo "Cal.com Subscriber URL:"
echo "  $DEPLOY_URL/api/webhooks/calcom?x-vercel-protection-bypass=$BYPASS"
echo ""
echo "NEXT: switch .env.local DATABASE_URL to the hosted URL and restart the worker, or the"
echo "dashboard and worker will be looking at different databases."

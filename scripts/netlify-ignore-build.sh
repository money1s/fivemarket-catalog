#!/usr/bin/env bash
set -euo pipefail

CONTEXT_VALUE="${CONTEXT:-production}"
BRANCH_VALUE="${BRANCH:-}"
HOOK_TITLE_VALUE="${INCOMING_HOOK_TITLE:-}"

if [[ "$CONTEXT_VALUE" == "deploy-preview" || "$CONTEXT_VALUE" == "branch-deploy" ]]; then
  echo "Skipping non-production deploy (context=$CONTEXT_VALUE, branch=$BRANCH_VALUE) to save credits."
  exit 0
fi

LAST_SUBJECT="$(git log -1 --pretty=%s 2>/dev/null || true)"
LAST_BODY="$(git log -1 --pretty=%b 2>/dev/null || true)"
LAST_AUTHOR="$(git log -1 --pretty=%an 2>/dev/null | tr '[:upper:]' '[:lower:]' || true)"
IS_CMS_COMMIT="false"

if [[ "$LAST_SUBJECT" == cms:* ]]; then
  IS_CMS_COMMIT="true"
fi

if [[ "$LAST_SUBJECT" == *"/cms/"* || "$LAST_BODY" == *"/cms/"* ]]; then
  IS_CMS_COMMIT="true"
fi

if [[ "$LAST_AUTHOR" == *"decap"* || "$LAST_AUTHOR" == *"netlify cms"* || "$LAST_AUTHOR" == *"netlify-cms"* ]]; then
  IS_CMS_COMMIT="true"
fi

if [[ "$CONTEXT_VALUE" == "production" && "$IS_CMS_COMMIT" == "true" && -z "$HOOK_TITLE_VALUE" ]]; then
  echo "Skipping CMS auto production deploy. Use /admin -> '1 деплой' for a single batch release."
  exit 0
fi

echo "Production deploy allowed (context=$CONTEXT_VALUE, branch=$BRANCH_VALUE)."
exit 1

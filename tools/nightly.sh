#!/usr/bin/env bash
# Plain nightly site refresh (no model). LOW=1: only tomorrow. DRY=1: no writes, commit or push. Silent on success, nonzero on failure.
set -euo pipefail
cd "$(dirname "$0")/.."
log=$(mktemp); trap 'rm -f "$log"' EXIT
fail(){ echo "nightly: $1" >&2; cat "$log" >&2; exit 1; }
git pull -q --ff-only >"$log" 2>&1 || fail "git pull"
args=(); [ "${LOW:-0}" = 1 ] && args+=(--low); [ "${DRY:-0}" = 1 ] && args+=(--dry)
plan=$(node tools/nightly_fill.js "${args[@]}" 2>>"$log") || fail "plan"
if [ -n "$plan" ] && [ "${DRY:-0}" != 1 ]; then
  set -- $plan; node build_pages.js --from "$1" --days "$2" >>"$log" 2>&1 || fail "build"
fi
today=$(node -e 'console.log(require("./js/logic.js").todayNY())')
FROM="$today" node test.js >>"$log" 2>&1 || fail "test.js"
node test_private.js >>"$log" 2>&1 || fail "test_private.js"
if [ "${DRY:-0}" = 1 ]; then [ -n "${VERBOSE:-}" ] && echo "dry run ok: ${plan:-nothing missing}"; exit 0; fi
if [ -n "$(git status --porcelain)" ]; then
  git add -A && git commit -qm "nightly: day pages through $(date +%F)" >>"$log" 2>&1 && git push -q origin main >>"$log" 2>&1 || fail "commit/push"
  sleep 60
fi
code=$(curl -s -o /dev/null -w '%{http_code}' "https://nathanpburson.github.io/novena/day/$today/") 
[ "$code" = 200 ] || fail "live day page $today returned $code"

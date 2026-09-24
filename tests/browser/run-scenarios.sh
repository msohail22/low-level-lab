#!/usr/bin/env bash
#
# Browser scenarios, driven through the chrome-devtools CLI.
#
# These are the checks a person would do by hand, written down so they run the
# same way every time. They are the second half of the verification gate: the
# Vitest suite proves the logic, this proves the pixels.
#
#   Prerequisites
#     1. npm i chrome-devtools-mcp@latest -g
#     2. Start the dev server. It refuses to boot without a Hyperdrive string;
#        a placeholder is fine for a UI-only pass (API calls will fail and you
#        will see the styled empty and error states):
#
#        CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_LOW_LEVEL_LAB_DB=\
#          "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder" pnpm dev
#
#   Usage
#     bash tests/browser/run-scenarios.sh [base-url]
#
# Screenshots land in tests/browser/screenshots/. LOOK AT THEM. A saved
# screenshot nobody opened is not verification.

set -uo pipefail

BASE_URL="${1:-http://localhost:5173}"
PAGE=1
SHOTS="$(cd "$(dirname "$0")" && pwd)/screenshots"
CHROME_BIN="${CHROME_BIN:-/usr/bin/chromium}"

export PATH="$(npm config get prefix)/bin:$PATH"
mkdir -p "$SHOTS"

pass=0; fail=0
ok()   { printf '  \033[32mPASS\033[0m %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=$((fail+1)); }
head2() { printf '\n\033[1m%s\033[0m\n' "$1"; }

cdt() { chrome-devtools "$@" 2>/dev/null | grep -v 'ExperimentalWarning\|trace-warnings'; }
evaluate() { cdt evaluate_script "$1" --pageId "$PAGE" | grep -oE '"[^"]*"' | head -1 | tr -d '"'; }
# Production CSS is minified and lowercases hex, so token checks fold case.
lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
goto() { cdt navigate_page "$PAGE" --type url --url "$BASE_URL$1" >/dev/null; sleep 2; }
theme() { cdt evaluate_script "() => { document.documentElement.dataset.theme='$1'; return '$1'; }" --pageId "$PAGE" >/dev/null; sleep 1; }
viewport() { cdt emulate "$PAGE" --viewport "$1" >/dev/null; sleep 1; }

command -v chrome-devtools >/dev/null || { echo "chrome-devtools not on PATH. npm i chrome-devtools-mcp@latest -g"; exit 1; }
curl -sf -o /dev/null "$BASE_URL" || { echo "Nothing serving at $BASE_URL. Start the dev server first."; exit 1; }

cdt start -e "$CHROME_BIN" --headless true --isolated true >/dev/null

# ---------------------------------------------------------------- scenario 1
head2 "1. Sign-in page renders and is reachable"
goto "/auth"
snapshot=$(cdt take_snapshot "$PAGE")
echo "$snapshot" | grep -q 'heading "Welcome back"' && ok "sign-in heading present" || bad "sign-in heading missing"
echo "$snapshot" | grep -q 'tab "Sign in"' && ok "sign in tab present" || bad "sign in tab missing"
echo "$snapshot" | grep -q 'tab "Create account"' && ok "create account tab present" || bad "create account tab missing"
echo "$snapshot" | grep -q 'textbox "Email"' && ok "email field is labelled" || bad "email field has no accessible name"
echo "$snapshot" | grep -qi 'continue with github' && ok "GitHub provider offered" || bad "GitHub provider missing"
echo "$snapshot" | grep -qi 'continue with google' && ok "Google provider offered" || bad "Google provider missing"

# ---------------------------------------------------------------- scenario 2
head2 "2. Console is clean"
messages=$(cdt list_console_messages "$PAGE")
issues=$(echo "$messages" | grep -icE 'error|autocomplete|id or name attribute' || true)
[ "$issues" -eq 0 ] && ok "no console errors or accessibility warnings" || { bad "$issues console issue(s)"; echo "$messages" | grep -iE 'error|autocomplete|id or name' | sed 's/^/      /'; }

# ---------------------------------------------------------------- scenario 2b
head2 "2b. No failed network requests"
requests=$(cdt list_network_requests "$PAGE")
# Anything 4xx or 5xx. A redirect or a 304 is fine.
failed=$(echo "$requests" | grep -oE '\[(4[0-9][0-9]|5[0-9][0-9])\]' | wc -l | tr -d ' ')
[ "$failed" -eq 0 ] && ok "every request succeeded" || { bad "$failed request(s) returned 4xx/5xx"; echo "$requests" | grep -E '\[(4[0-9][0-9]|5[0-9][0-9])\]' | sed 's/^/      /' | head -10; }

# ---------------------------------------------------------------- scenario 3
head2 "3. Both themes resolve their tokens"
theme light
light_ground=$(evaluate "() => getComputedStyle(document.documentElement).getPropertyValue('--ground').trim()")
[ "$(lower "$light_ground")" = "$(lower "#D9D3C7")" ] && ok "light ground is the aluminium faceplate" || bad "light --ground is '$light_ground', expected #D9D3C7"
cdt take_screenshot "$PAGE" --filePath "$SHOTS/signin-light.png" >/dev/null

theme dark
dark_ground=$(evaluate "() => getComputedStyle(document.documentElement).getPropertyValue('--ground').trim()")
[ "$(lower "$dark_ground")" = "$(lower "#2E2B27")" ] && ok "dark ground is the graphite chassis" || bad "dark --ground is '$dark_ground', expected #2E2B27"
cdt take_screenshot "$PAGE" --filePath "$SHOTS/signin-dark.png" >/dev/null

# Amber must darken on light or body text fails contrast.
theme light
light_amber=$(evaluate "() => getComputedStyle(document.documentElement).getPropertyValue('--amber').trim()")
[ "$(lower "$light_amber")" = "$(lower "#7A4F08")" ] && ok "amber darkens on the light faceplate" || bad "light --amber is '$light_amber', expected #7A4F08"

# ---------------------------------------------------------------- scenario 4
head2 "4. Switching to Create account reveals the name field"
tab=$(cdt take_snapshot "$PAGE" | grep 'tab "Create account"' | grep -oE 'uid=[0-9_]+' | head -1 | cut -d= -f2)
if [ -n "$tab" ]; then
  cdt click "$PAGE" "$tab" >/dev/null; sleep 1
  after=$(cdt take_snapshot "$PAGE")
  echo "$after" | grep -q 'textbox "Name"' && ok "name field appears" || bad "name field did not appear"
  echo "$after" | grep -q 'heading "Create your account"' && ok "heading changed" || bad "heading did not change"
else
  bad "could not find the Create account tab"
fi

# ---------------------------------------------------------------- scenario 5
head2 "5. No horizontal overflow at any viewport"
for v in "390x844x3,mobile,touch:phone" "768x1024x2,touch:tablet" "1440x900x1:desktop"; do
  spec="${v%%:*}"; label="${v##*:}"
  viewport "$spec"
  result=$(evaluate "() => { const d=document.documentElement; const past=[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>d.clientWidth+1).length; return (d.scrollWidth>d.clientWidth?'OVERFLOW':'ok')+':'+past; }")
  [ "${result%%:*}" = "ok" ] && [ "${result##*:}" = "0" ] \
    && ok "$label ($spec) has no overflow" \
    || bad "$label ($spec) overflows: $result"
done

viewport "390x844x3,mobile,touch"
cdt take_screenshot "$PAGE" --filePath "$SHOTS/signin-mobile.png" >/dev/null

# ---------------------------------------------------------------- scenario 6
head2 "6. Touch targets are big enough to hit"
viewport "390x844x3,mobile,touch"
small=$(evaluate "() => { const bad=[...document.querySelectorAll('button, a, input')].filter(e=>{const r=e.getBoundingClientRect(); return r.height>0 && r.height<44}); return String(bad.length); }")
[ "$small" = "0" ] && ok "every control is at least 44px tall" || bad "$small control(s) under 44px"

# ---------------------------------------------------------------- scenario 7
head2 "7. Keyboard focus is visible"
viewport "1440x900x1"
outline=$(evaluate "() => { const el=document.querySelector('input'); el.focus(); const s=getComputedStyle(el); return (s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0)?'visible':'none'; }")
[ "$outline" = "visible" ] && ok "focused input shows an outline" || bad "focused input has no visible outline"

# ---------------------------------------------------------------- scenario 8
head2 "8. Protected routes redirect when signed out"
goto "/questions"
landed=$(evaluate "() => location.pathname")
[ "$landed" = "/auth" ] && ok "/questions redirects to /auth" || bad "/questions landed on '$landed'"

# ---------------------------------------------------------------- scenario 9
head2 "9. Branding is served"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/favicon.svg")
[ "$code" = "200" ] && ok "favicon.svg serves" || bad "favicon.svg returned $code"
html=$(curl -s "$BASE_URL/")
echo "$html" | grep -q 'Archivo' && ok "Archivo is linked" || bad "Archivo not linked"
echo "$html" | grep -q 'Saira+Condensed' && ok "Saira Condensed is linked" || bad "Saira Condensed not linked"
echo "$html" | grep -q 'Spectral\|IBM+Plex' && bad "a retired typeface is still linked" || ok "no retired typefaces linked"

# ---------------------------------------------------------------------------
printf '\n\033[1m%s\033[0m\n' "$pass passed, $fail failed"
printf 'Screenshots in %s — open them.\n' "$SHOTS"
[ "$fail" -eq 0 ] || exit 1

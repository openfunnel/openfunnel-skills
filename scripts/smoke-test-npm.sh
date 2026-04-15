#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
PACKAGE_TGZ=""

cleanup() {
  if [[ -n "${PACKAGE_TGZ}" && -f "${REPO_ROOT}/${PACKAGE_TGZ}" ]]; then
    rm -f "${REPO_ROOT}/${PACKAGE_TGZ}"
  fi
  rm -rf "${TMP_DIR}"
}

trap cleanup EXIT

echo "Packing local npm package..."
PACKAGE_TGZ="$(cd "${REPO_ROOT}" && npm pack --silent)"

TEST_REPO="${TMP_DIR}/openfunnel-npm-smoke"
mkdir -p "${TEST_REPO}"

echo "Creating throwaway install target at ${TEST_REPO}..."
cat > "${TEST_REPO}/package.json" <<'EOF'
{
  "name": "openfunnel-npm-smoke",
  "private": true,
  "version": "0.0.0"
}
EOF

install_and_verify() {
  echo "Installing ${PACKAGE_TGZ}..."
  (
    cd "${TEST_REPO}"
    npm install "${REPO_ROOT}/${PACKAGE_TGZ}"
  )

  if [[ ! -f "${TEST_REPO}/CLAUDE.md" ]]; then
    echo "Smoke test failed: CLAUDE.md was not created."
    exit 1
  fi

  python3 - "${TEST_REPO}/CLAUDE.md" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
start = "<!-- openfunnel:start -->"
end = "<!-- openfunnel:end -->"

if text.count(start) != 1 or text.count(end) != 1:
    raise SystemExit("Smoke test failed: expected exactly one injected OpenFunnel block.")

if "## How to Handle Requests" not in text:
    raise SystemExit("Smoke test failed: injected CLAUDE.md block is missing expected OpenFunnel content.")
PY
}

install_and_verify
install_and_verify

echo "npm smoke test passed."
echo "Verified:"
echo "- package can be packed locally"
echo "- npm install injects OpenFunnel CLAUDE.md guidance"
echo "- reinstall keeps a single injected marker block"

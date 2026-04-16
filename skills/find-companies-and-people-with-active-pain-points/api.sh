#!/bin/bash
# OpenFunnel API wrapper — keeps credentials out of the agent's context
# Usage: bash api.sh <METHOD> <ENDPOINT> [BODY]
# Example: bash api.sh POST /api/v1/signal/get-signal-list '{"pagination":{"limit":1,"offset":0}}'

METHOD="$1"
ENDPOINT="$2"
BODY="$3"

# Find .env by walking up from the script's directory
DIR="$(cd "$(dirname "$0")" && pwd)"
while [ "$DIR" != "/" ]; do
  if [ -f "$DIR/.env" ]; then
    source "$DIR/.env"
    break
  fi
  DIR="$(dirname "$DIR")"
done

if [ -z "$OPENFUNNEL_API_KEY" ] || [ -z "$OPENFUNNEL_USER_ID" ]; then
  echo '{"error": "Missing OPENFUNNEL_API_KEY or OPENFUNNEL_USER_ID in .env"}' >&2
  exit 1
fi

if [ -z "$BODY" ]; then
  curl -s -X "$METHOD" \
    "https://api.openfunnel.dev${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${OPENFUNNEL_API_KEY}" \
    -H "X-User-ID: ${OPENFUNNEL_USER_ID}"
else
  curl -s -X "$METHOD" \
    "https://api.openfunnel.dev${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${OPENFUNNEL_API_KEY}" \
    -H "X-User-ID: ${OPENFUNNEL_USER_ID}" \
    -d "$BODY"
fi

#!/bin/bash
# OpenFunnel sign-up wrapper — keeps API key out of the agent's context
# Usage:
#   bash signup.sh start <email>
#   bash signup.sh verify <email> <otp_code>

ACTION="$1"
EMAIL="$2"
OTP_CODE="$3"

BASE_URL="https://api.openfunnel.dev"

# Find .env by walking up from the script's directory
ENV_DIR="$(cd "$(dirname "$0")" && pwd)"
while [ "$ENV_DIR" != "/" ]; do
  if [ -f "$ENV_DIR/.env" ]; then
    break
  fi
  ENV_DIR="$(dirname "$ENV_DIR")"
done

# If no .env found, use the script's directory
if [ ! -f "$ENV_DIR/.env" ]; then
  ENV_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

ENV_FILE="$ENV_DIR/.env"

case "$ACTION" in
  start)
    if [ -z "$EMAIL" ]; then
      echo '{"error": "Email is required. Usage: bash signup.sh start <email>"}' >&2
      exit 1
    fi

    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/agent/sign-up" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"${EMAIL}\"}")

    # Check if the response contains an error
    if echo "$RESPONSE" | grep -q '"error"'; then
      echo "$RESPONSE"
      exit 1
    fi

    echo '{"status": "verification_code_sent", "email": "'"${EMAIL}"'"}'
    ;;

  verify)
    if [ -z "$EMAIL" ] || [ -z "$OTP_CODE" ]; then
      echo '{"error": "Email and OTP code are required. Usage: bash signup.sh verify <email> <otp_code>"}' >&2
      exit 1
    fi

    RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/agent/verify" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"${EMAIL}\", \"otp_code\": \"${OTP_CODE}\"}")

    # Check if the response contains an error
    if echo "$RESPONSE" | grep -q '"error"'; then
      echo '{"status": "failed", "message": "Verification failed. Code may be invalid or expired."}'
      exit 1
    fi

    # Extract api_key and email from response
    API_KEY=$(echo "$RESPONSE" | grep -o '"api_key":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$API_KEY" ]; then
      echo '{"status": "failed", "message": "Could not extract API key from response."}'
      exit 1
    fi

    # Write credentials to .env (create or update)
    if [ -f "$ENV_FILE" ]; then
      # Remove existing entries
      grep -v '^OPENFUNNEL_API_KEY=' "$ENV_FILE" | grep -v '^OPENFUNNEL_USER_ID=' > "${ENV_FILE}.tmp"
      mv "${ENV_FILE}.tmp" "$ENV_FILE"
    fi

    echo "OPENFUNNEL_API_KEY=${API_KEY}" >> "$ENV_FILE"
    echo "OPENFUNNEL_USER_ID=${USER_ID}" >> "$ENV_FILE"

    # Add .env to .gitignore if not already there
    GITIGNORE="$ENV_DIR/.gitignore"
    if [ -f "$GITIGNORE" ]; then
      if ! grep -q '^\.env$' "$GITIGNORE"; then
        echo '.env' >> "$GITIGNORE"
      fi
    else
      echo '.env' > "$GITIGNORE"
    fi

    # Return success without exposing the key
    echo '{"status": "authenticated", "user_id": "'"${USER_ID}"'"}'
    ;;

  *)
    echo '{"error": "Unknown action. Usage: bash signup.sh start <email> OR bash signup.sh verify <email> <otp_code>"}' >&2
    exit 1
    ;;
esac

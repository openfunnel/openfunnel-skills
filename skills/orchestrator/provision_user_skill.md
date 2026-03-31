---
name: provision-user
description: Create API-only OpenFunnel users on behalf of end-users. For orchestrator providers who programmatically provision access.
---

# Provision User Skill

For orchestrator providers (e.g., Gooseworks) who need to create OpenFunnel API users for their end-users programmatically.

## How It Works

The provider has an API key with provisioner access. When their end-user needs OpenFunnel access, this skill creates an API-only user mapped to the provider's domain. Credits are shared across the provider's domain — the provider pays for all users they create.

**The created user:**
- Gets their own API key
- Can only access OpenFunnel via API (no UI login)
- Is billed under the provider's domain

**Email mapping:** The end-user's email prefix is mapped to the provider's domain.
- Provider: `guy@gooseworks.com`
- End-user's actual email: `alice@alice-startup.com`
- Created as: `alice@gooseworks.com`

This ensures all provisioned users share the provider's credit pool.

## Workflow

### 1. Get the end-user's email

Ask for the end-user's email address.

### 2. Construct the internal email

Extract the prefix from the end-user's email, combine with the provider's domain:

```
End-user email: alice@alice-startup.com
Provider email: guy@gooseworks.com

→ Internal email: alice@gooseworks.com
```

The provider's domain comes from the `X-User-ID` header (the provider's own email).

### 3. Create the user

```
POST /api/v1/admin/create-user
Headers:
  X-API-Key: {provider's API key}
  X-User-ID: {provider's email}
Body:
  { "email": "alice@gooseworks.com" }
```

### 4. Return the API key

```
User created:

**Email:** alice@gooseworks.com
**API Key:** {api_key from response}

This user can now access OpenFunnel via API using these credentials.
```

## API Endpoint

`POST /api/v1/admin/create-user`

**Requires:** Provider must have `is_provisioner` enabled on their account.

**Request:**
- `email` (string) — the constructed internal email

**Response:**
- `id` — user ID
- `email` — the internal email
- `api_key` — the new user's API key

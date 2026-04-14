---
name: provision-user
description: Create API-only OpenFunnel users on behalf of end-users. Use when an orchestrator or provider needs to provision OpenFunnel access programmatically for downstream users.
metadata:
  internal: true
---

# Provision User Skill

For orchestrator providers who need to create OpenFunnel API users for their end-users programmatically.

## How It Works

The provider has an API key with provisioner access. When their end-user needs OpenFunnel access, this skill creates an API-only user mapped to the provider's domain. Credits are shared across the provider's domain, so the provider pays for all users they create.

The created user:

- Gets their own API key
- Can only access OpenFunnel via API
- Is billed under the provider's domain

Email mapping:

- Provider: `guy@gooseworks.com`
- End-user's actual email: `alice@alice-startup.com`
- Created as: `alice@gooseworks.com`

This ensures all provisioned users share the provider's credit pool.

## Workflow

### 1. Get the end-user's email

Ask for the end-user's email address.

### 2. Construct the internal email

Extract the prefix from the end-user's email, then combine it with the provider's domain:

```text
End-user email: alice@alice-startup.com
Provider email: guy@gooseworks.com

-> Internal email: alice@gooseworks.com
```

The provider's domain comes from the `X-User-ID` header.

### 3. Create the user

```text
POST /api/v1/admin/create-user
Headers:
  X-API-Key: {provider API key}
  X-User-ID: {provider email}
Body:
  { "email": "alice@gooseworks.com" }
```

### 4. Return the API key

```text
User created:

Email: alice@gooseworks.com
API Key: {api_key from response}

This user can now access OpenFunnel via API using these credentials.
```

## API Endpoint

`POST /api/v1/admin/create-user`

Requires: the provider must have `is_provisioner` enabled on their account.

Request:

- `email` (string): the constructed internal email

Response:

- `id`
- `email`
- `api_key`

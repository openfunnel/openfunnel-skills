---
name: enrich-people-with-email-and-phone
description: Enrich OpenFunnel people with work email addresses and phone numbers. Only works with people already discovered by OpenFunnel — not arbitrary contacts.
---

# Enrich People with Email and Phone

Enrich people already in OpenFunnel with work email addresses and/or phone numbers. This only works with people discovered through OpenFunnel signals, enrichment, or ICP matching — you cannot enrich arbitrary contacts.

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/enrich-people-with-email-and-phone/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## When to Use This Skill

- "Get work emails for these people"
- "Enrich the people at Ramp with phone numbers"
- "Find emails for all the VPs I found in my last signal"
- "Get contact info for people in my hiring signal results"
- "Enrich emails for people at account ID 12345"

## Agent Rules

1. **NEVER rewrite or reframe the user's query.** Use their exact words. Ask if unclear — don't modify yourself.
2. **Only enrich OpenFunnel people.** This skill cannot enrich arbitrary contacts. People must already exist in OpenFunnel (from signals, enrichment, or ICP matching).
3. **Confirm before enriching.** Enrichment costs credits. Always show the count and ask before running.
4. **Present what the API returns.** No fabrication, no inference.
5. **Never output or log API credentials.** All authenticated calls go through `api.sh`.

---

## Workflow

### 0. Agent Auth Check

Before anything, test if credentials are working by running:

```bash
bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'
```

**If the call succeeds** (returns JSON with `signals`): skip to Step 1.

**If the call fails** (returns an error or missing credentials message):

```
### Welcome to OpenFunnel

OpenFunnel infers pain-points from live company and people events.
Inferred pain-points are leading indicators of buying behavior.

To get started, I'll authenticate you via the API.

**What's your work email?**
```

Wait for user input. Then:

1. Run `bash "$SIGNUP" start "<user_email>"`
   - Returns `{"status": "verification_code_sent", "email": "..."}` on success
2. Tell the user a 6-digit code was sent:
   ```
   I sent a 6-digit verification code to **{email}**. Reply with the code.
   ```
3. Wait for input. Run `bash "$SIGNUP" verify "<user_email>" "<code>"`
   - On success: returns `{"status": "authenticated", "user_id": "..."}`. Credentials are written to `.env` and `.gitignore` is updated automatically.
   - On failure: returns `{"status": "failed", ...}`
4. Verify with `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'`
5. If verification succeeds → continue to Step 1
6. If sign-up fails → ask user to retry
7. If verify fails → tell user the code was invalid or expired (up to 10 attempts in 24 hours), offer to retry or resend

---

### 1. Get the people IDs

The user needs to tell you which people to enrich. There are three ways to get people IDs:

#### Option A: From a specific account

If the user names a company or gives an account ID, fetch people from that account:

```bash
bash "$API" POST /api/v2/account/batch '{"account_ids": [<id>], "icp_people_page": 1, "icp_people_page_size": 100}'
```

The response contains `icp_people` with `person_id` for each person.

#### Option B: From the full people list with filters

If the user wants to enrich a filtered set of people (e.g. "all VPs in Engineering"), first get available filters:

```bash
bash "$API" GET /api/v1/people/filters
```

This returns all filterable fields with their valid options. Then fetch matching people IDs:

```bash
bash "$API" POST /api/v1/people/list '{"filters": {<user_filters>}, "page": 0, "page_size": 500}'
```

Returns `people_ids` array and `total_count`.

#### Option C: User already has people IDs

If the user provides people IDs directly (from a previous signal, enrichment, or other skill), use those.

---

### 2. Confirm what to enrich

Present the enrichment plan before running:

```
### Enrichment Plan

**People to enrich:** {count} people
**Enrich emails:** {yes/no}
**Enrich phones:** {yes/no}

⚡ *Only successful finds consume credits. Max 500 people per request.*

Proceed? (yes / no)
```

If the user has more than 500 people, explain that enrichment will be batched in chunks of 500.

Ask the user what they want enriched if they haven't specified:

```
What contact info do you need?

1. **Work emails only** (default)
2. **Phone numbers only**
3. **Both emails and phone numbers**
```

---

### 3. Run enrichment

```bash
bash "$API" POST /api/v1/enrich/people '{"people_ids": [<ids>], "enrich_emails": true, "enrich_phones": false}'
```

- Max 500 people per request
- If more than 500, split into chunks and run sequentially

Then poll for completion:

```bash
bash "$API" GET /api/v1/enrich/people/<job_id>
```

**Polling guidance:**
- Poll every 5 seconds
- Typical runtime is about 2 seconds per person
- Stop when `status` is `completed` or `failed`

---

### 4. Present results

When the job completes, present the results:

```
### Enrichment Complete

**Total processed:** {progress.total}
**Emails found:** {progress.emails_found}
**Phones found:** {progress.phones_found}
**Credits used:** {credits_used.total}

| Name | Email | Phone | Status |
|------|-------|-------|--------|
| {person_name} | {email or "—"} | {phone_number or "—"} | {status} |
| ... | ... | ... | ... |
```

**Status meanings:**
- `enriched` — contact info found
- `already_enriched` — already had this info
- `not_found` — lookup completed but no result
- `no_linkedin_url` — can't enrich without a LinkedIn URL
- `error` — enrichment failed for this person

---

### 5. What's next

```
### What would you like to do next?

1. **Enrich more people** — different account, different filters
2. **Export to CRM** — push enriched contacts to Salesforce or HubSpot
3. **Research an account** — deep dive into a specific company
```

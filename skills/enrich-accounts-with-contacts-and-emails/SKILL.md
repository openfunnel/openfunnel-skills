---
name: enrich-accounts-with-contacts-and-emails
description: Enrich a list of company domains into account IDs, relevant contacts, and work emails. Use when the user has multiple accounts or domains and wants OpenFunnel to return account-level contact lists with email coverage.
---

# Enrich Accounts with Contacts and Emails

Resolve one or more company domains in a batch, discover relevant people at each account, enrich missing work emails, and return a clean account-by-account contact list.

If the user wants **contacts + emails for one company**, this skill still applies.

## When to Use This Skill

- "Take this list of domains and get me the best contacts plus emails"
- "I have OpenFunnel accounts, now find the people and enrich contact info"
- "Start from company domains, get account IDs, then return contacts with email addresses"

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/enrich-accounts-with-contacts-and-emails/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## Agent Rules

1. **Never fabricate contacts or emails.** If OpenFunnel does not return a person or email, say it is missing.
2. **Prefer the batch-first path.** For domain inputs, start with batch account enrichment. Then run fast people enrichment for each resolved account. Do not use deep enrichment unless the user explicitly asks for it.
3. **Confirm before credit-consuming enrichment.** Fast people enrichment and contact enrichment both consume credits. Present the plan and wait for approval before triggering them.
4. **Do not guess the target team.** If the user has not specified department and seniority filters, ask once for the batch. Fast people enrichment requires explicit filters.
5. **Reuse existing data when available.** If account IDs, people, or emails already exist in OpenFunnel, keep them and enrich only the missing pieces.
6. **Return grouped results by account.** Final output should be organized per account, not as one flat people list.

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

OpenFunnel turns daily events in your market into pipeline
— using OpenFunnel's Event Intelligence engine.

To get started, I'll authenticate you via the API and fetch your key.

**Step 0: Agent auth** — what's your work email?
```

Wait for user input. Then:

1. Run `bash "$SIGNUP" start "<user_email>"`

2. If the call succeeds, tell the user a 6-digit verification code was sent and ask for it:

```
I sent a 6-digit verification code to **{email}**.

Reply with the code and I'll finish authentication.
```

3. Wait for user input. Then run `bash "$SIGNUP" verify "<user_email>" "<code>"`

4. On success, the response is: `{"status": "authenticated", "user_id": "..."}`. Credentials are written to `.env` and `.gitignore` is updated automatically.

5. Verify with `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'`

6. If verification succeeds → continue to ICP check.

7. If sign-up fails → tell the user the email could not be authenticated and ask them to retry.

8. If verify fails → tell the user the code was invalid or expired, explain they get up to 10 attempts within 24 hours, and ask whether to retry the code or send a new one by calling sign-up again.

### ICP Check

After auth, fetch ICP profiles via `bash "$API" GET /api/v1/icp/list`.

**If ICPs exist:** note the available ICPs and continue to Step 1.

**If no ICPs exist:**

```
You don't have an ICP profile yet. A quick one will make results much sharper —
it filters by company size, location, and the roles you're targeting.

1. **Quick setup** (recommended) — takes 30 seconds
2. **Skip** — auto-create a broad fallback ICP and continue
```

If quick setup → collect ICP name, target roles, company size, and location. Create via `bash "$API" POST /api/v1/icp/create '<json_body>'`.

If skip → auto-create a broad fallback ICP:

```json
{
  "name": "Broad Default ICP",
  "target_roles": ["Any"],
  "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"],
  "location": ["Any"]
}
```

Call `bash "$API" POST /api/v1/icp/create '<json_body>'`, then tell the user:

```
I created a default ICP profile: **{name}** (ID: {id})

This keeps things running. For sharper results, set up a proper ICP segment
with your target roles, company size, and location using the `advanced-account-setup` skill.
```

Continue to Step 1.

---

### 1. Understand the input

The user should provide a list of company domains or a list of OpenFunnel accounts.

If the input is mixed or unclear, normalize it to domains first.

Before making enrichment calls, collect these batch-level settings:

- **Department filters** for fast people enrichment
- **Seniority filters** for fast people enrichment

Recommended defaults for a general outbound batch:

- **Departments:** `ENGINEERING`, `PRODUCT`, `SECURITY`, `EXECUTIVE`
- **Seniority:** `VP`, `HEAD`, `DIRECTOR`, `CXO`

If the user does not specify filters, recommend these defaults and ask for confirmation. Do not silently guess.

Use this prompt:

```
I can enrich this list in three steps:

1. Batch account enrichment
2. Fast people discovery by account
3. Contact enrichment for missing emails

To discover the right people, I need batch filters:
- **Departments** (examples: ENGINEERING, PRODUCT, SECURITY, SALES, EXECUTIVE)
- **Seniority** (examples: VP, HEAD, DIRECTOR, CXO)

Optional:
- **Max credit limit** for fast people discovery

Recommended defaults for most B2B account enrichment:
- **Departments:** ENGINEERING, PRODUCT, SECURITY, EXECUTIVE
- **Seniority:** VP, HEAD, DIRECTOR, CXO

Should I use those defaults, or would you like to override them for this batch?
```

### 2. Normalize domains and run batch account enrichment

Clean every domain before using it:

- Strip `http://` or `https://`
- Strip leading `www.`
- Lowercase
- Deduplicate

Use batch account enrichment first, even if the input contains only one domain.

Call:

`bash "$API" POST /api/v1/enrich/accounts '{"domains": [...]}'`

Then poll:

`bash "$API" GET /api/v1/enrich/accounts/{job_id}`

Polling guidance:

- Poll every 5 seconds
- Stop when status is `completed` or `failed`
- Up to 500 domains per batch request

When the poll completes, record for each domain:

- `domain`
- `account_id`
- `name`
- `is_new_account`
- `fields_updated`
- `status`

If the batch job fails entirely, stop and report the error.

If the batch completes with mixed results, continue with all successful accounts and clearly mark failed domains.

After batch enrichment completes, fetch current account details with:

`bash "$API" POST /api/v2/account/batch '{"account_ids": [...], "icp_people_page": 1, "icp_people_page_size": 100}'`

Present a coverage summary before enrichment:

```
### Accounts to Process

| Domain | Account ID | Account Name | Account Enrichment Status | Existing ICP People | Next Step |
|--------|------------|--------------|---------------------------|---------------------|-----------|
| acme.com | 123 | Acme | created | 2 | Run fast people enrichment |
| beta.io | 456 | Beta | unchanged | 0 | Run fast people enrichment |
| gamma.dev | - | - | failed | - | Skip |
```

Rules:

- If a domain fails in batch account enrichment, mark it as unresolved and keep going.
- Do not stop the entire batch for one failed domain.

### 3. Execution summary

Present a brief execution summary, then continue automatically:

```
Processing plan:

1. **Batch account enrichment** — create or refresh account records from the input domains
2. **Fast people enrichment** — run per resolved account to find relevant people by department and seniority
3. **Email enrichment** — fill in missing work emails for discovered people

Batch settings:
- **Departments:** {department_filters}
- **Seniority:** {seniority_filters}
- **Max credit limit:** {max_credit_limit or "default"}

I'll reuse existing people and emails where OpenFunnel already has them.

This works for a single account too — it just runs as a one-domain batch.
```

### 4. Run fast people enrichment for resolved accounts in parallel

For each resolved account returned from the batch account enrichment job, start a fast people enrichment job:

`bash "$API" POST /api/v1/enrich/fast-people-enrichment '<json_body>'`

Body:

```json
{
  "account_id": 12345,
  "seniority_filters": ["VP", "DIRECTOR"],
  "department_filters": ["ENGINEERING", "PRODUCT"],
  "max_credit_limit": 50
}
```

Run these jobs in parallel across accounts where possible.

Then poll each job:

`bash "$API" GET /api/v1/enrich/fast-people-enrichment/{job_id}`

Polling guidance:

- Poll every 5 seconds
- Typical completion time is around 1 minute per 100 employees in the company. For large companies, this can take upto 10 minutes.
- Stop when status is `completed` or `failed`

For each account, record:

- `account_id`
- `job_id`
- `people_ids`
- `credits_used`
- `total_found`
- `total_stored`
- Any `error_message`

Rules:

- If the account already has some ICP people, still run fast enrichment unless the user explicitly says to use existing contacts only.
- If fast enrichment fails for one account, mark the failure and continue with the rest.
- Do not escalate to deep enrichment automatically.

### 5. Fetch full people profiles across the batch

Build one deduplicated people ID list from:

- Existing `icp_people` from the V2 account batch call
- New `people_ids` returned by fast people enrichment

Then call:

`bash "$API" POST /api/v1/people/batch '{"people_ids": [...]}'`

This is the source of truth for person details:

- `person_id`
- `person_name`
- `person_role`
- `person_email`
- `person_location`
- `person_linkedin_url`
- `person_phone_number`
- `person_team_name`
- `department`
- `seniority`
- `account_id`
- `account_name`
- `account_domain`

### 6. Enrich missing emails only

Split people into three groups:

1. **Already has email** — keep as-is
2. **Missing email but has LinkedIn URL** — eligible for enrichment
3. **Missing email and missing LinkedIn URL** — not enrichable, mark as missing

For eligible people, call:

`bash "$API" POST /api/v1/enrich/people '<json_body>'`

Body:

```json
{
  "people_ids": [101, 102, 103],
  "enrich_emails": true,
  "enrich_phones": false
}
```

Then poll:

`bash "$API" GET /api/v1/enrich/people/{job_id}`

Polling guidance:

- Poll every 5 seconds
- Typical runtime is about 2 seconds per person
- Stop when status is `completed` or `failed`

Important constraints:

- Max 500 people per enrichment request
- Only successful email finds consume credits
- `no_linkedin_url` cannot be enriched
- `not_found` means lookup completed but no email was found

If the people batch is larger than 500, split it into chunks and process sequentially.

### 7. Merge results and return final output

Merge the email enrichment results back into the people records.

Return results grouped by account using this format:

```
## Enriched Accounts

### {account_name} ({domain})

| Name | Role | Department | Seniority | Team | Email | LinkedIn | Status |
|------|------|------------|-----------|------|-------|----------|--------|
| Jane Doe | VP Engineering | ENGINEERING | VP | Platform | jane@acme.com | [Profile](...) | enriched |
| John Roe | Director Product | PRODUCT | DIRECTOR | Core Product | missing | [Profile](...) | not_found |
```

After the table, include a short account summary:

```
- Total contacts returned: {n}
- Emails present: {n}
- Emails newly enriched: {n}
- Missing emails: {n}
```

If any account failed or stayed unresolved, include a separate section:

```
### Incomplete Accounts

| Domain | Stage | Reason |
|--------|-------|--------|
| gamma.dev | account resolution | not found |
| delta.ai | email enrichment | no_linkedin_url |
```

---

## Decision Rules

### When to skip fast people enrichment

Skip fast people enrichment only if the user explicitly says:

- Use existing OpenFunnel contacts only
- Do not spend credits on people discovery

Otherwise, prefer running fast people enrichment to improve account coverage after batch account enrichment has resolved the accounts.

### When to skip email enrichment

Skip email enrichment only if:

- The user only wants names and roles
- The user does not approve credit usage
- Every returned person already has an email

### When to mention deep enrichment

Mention deep enrichment (`bash "$API" POST /api/v1/enrich/deep-enrich '<json_body>'`) only as an optional fallback when:

- Fast people enrichment returns zero usable people across key accounts
- The user explicitly asks for broader research or deeper company coverage

Do not auto-run it in this workflow.


---
name: find-companies-and-people-facing-active-pain-points
description: Find companies and people facing active pain-points (daily). Inferred from live company and people events using the TAQ model — Trait (who they are), Activity (what they're doing now), Qualifier (what they already have). Inferred pain-points are leading indicators of buying behavior.
---

# Find Companies and People Facing Active Pain-Points (Daily)

Find ICP companies with inferred pain-points from live company and people events — where a combination of who they are (trait), what they're doing right now or what pain-points they are facing (activity), and what they already have in place (qualifier). Uses the TAQ model to build a precise search through a guided walkthrough.

Inferred pain-points are leading indicators of buying behavior. Instead of picking signal types (hiring vs social vs tech), describe the pain and the agent infers pain-points by decomposing it into searchable components.

## When to Use This Skill

- "B2B SaaS companies migrating off Heroku that already have a DevOps team"
- "Mid-market healthcare companies hiring for their first CISO"
- "Developer tools companies posting about SOC2 that already sell to enterprise"
- "Fintech startups scaling their engineering team after a Series B"
- "Companies building AI agents that are hiring for evaluation and testing roles"
- "E-commerce companies posting about replatforming that already use Stripe"

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/find-companies-and-people-facing-active-pain-points/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## Agent Rules

1. **NEVER rewrite or reframe the user's query.** Use the user's exact words for trait, activity, and qualifier. Do not add your own interpretation, expand abbreviations, add synonyms, or "improve" the input. If you think it could be more specific, ask the user — do not modify it yourself.
2. **Walk through TAQ one step at a time.** Don't dump all three fields at once. Each step is a conversation turn.
3. **Show the progressive build.** After each TAQ step, show the running summary so the user sees their search taking shape.
4. **Don't deploy without confirming.** Signals cost credits. Always show the full config and wait for explicit "deploy."
5. **Present what the API returns.** No fabrication, no inference.
6. **Activity is the timing layer.** Always explain why it matters. A trait without activity is a static list. Activity is what makes it an inferred pain-point.

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

OpenFunnel finds companies with active pain points — not static lists,
but companies showing inferred pain-points from live events right now.

To get started, I'll authenticate you via the API and fetch your key.

**Step 0: Agent auth** — what's your work email?
```

Wait for user input. Then:

1. Call `bash "$SIGNUP" start "<user_email>"`

2. If the call succeeds, tell the user a 6-digit verification code was sent and ask for it:

```
I sent a 6-digit verification code to **{email}**.

Reply with the code and I'll finish authentication.
```

3. Wait for user input. Then call `bash "$SIGNUP" verify "<user_email>" "<code>"`

The response is: `{"status": "authenticated", "user_id": "..."}`. Credentials are written to `.env` and `.gitignore` is updated automatically.

4. If authentication succeeds → continue to Step 1.

5. If sign-up fails → tell the user the email could not be authenticated and ask them to retry.

6. If verify fails → tell the user the code was invalid or expired, explain they get up to 10 attempts within 24 hours, and ask whether to retry the code or send a new one by calling sign-up again.

---

### 1. Trait (required)

This is WHO the company is — industry, stage, description, or services they offer.

```
### Let's build your search.

**Step 1: Trait** — Describe the type of company you're looking for.

This is the company descriptor — industry, stage, what they do, or what services they offer.

**Examples:**
- "B2B SaaS companies in the data infrastructure space"
- "Mid-market healthcare companies"
- "Companies building developer tools"
- "E-commerce companies with 100+ employees"
- "Fintech startups offering payments APIs"
```

Wait for user input.

After the user responds, show:

```
### Building your search...

| Step | Field | Value |
|------|-------|-------|
| ✅ | **Trait** | {user's trait} |
| ⬜ | **Activity** | (next) |
| ⬜ | **Qualifier** | (next) |
```

---

### 2. Activity (optional, strongly recommended)

This is what the company is CURRENTLY DOING that indicates they need what the user sells. This is the timing layer — the difference between a static list and an inferred pain-point.

```
**Step 2: Activity** — What current action would indicate this company needs what you sell — right now?

A trait without activity is a static list. Activity is what makes your outreach timely instead of generic.

**Examples:**
- "Hiring for AI safety and evaluation roles"
- "Posting about migrating off legacy on-prem systems"
- "Evaluating observability vendors"
- "Scaling their engineering team for a new product line"
- "Publicly discussing compliance challenges"

Or type **"skip"** to search by trait only (no timing layer).
```

Wait for user input.

After the user responds, show:

```
### Building your search...

| Step | Field | Value |
|------|-------|-------|
| ✅ | **Trait** | {trait} |
| ✅ | **Activity** | {activity or "skipped — trait-only search"} |
| ⬜ | **Qualifier** | (next) |
```

---

### 3. Qualifier (optional)

This is a deal-breaker condition — something the company MUST ALREADY HAVE in place. Companies without this don't qualify regardless of trait or activity match.

```
**Step 3: Qualifier** — Any deal-breaker requirements the company must already have?

This is a hard filter. Companies that don't meet this condition won't appear in results.

**Examples:**
- "Must already be using Kubernetes in production"
- "Must have an existing data engineering team"
- "Must be SOC2 compliant"
- "Must have a mobile app"

Or type **"skip"** — no hard filters.
```

Wait for user input.

After the user responds, show the completed TAQ:

```
### Your search

| Field | Value |
|-------|-------|
| **Trait** | {trait} |
| **Activity** | {activity or "none"} |
| **Qualifier** | {qualifier or "none"} |
```

---

### 4. ICP Check

Fetch available ICP profiles via `bash "$API" GET /api/v1/icp/list`.

**If ICPs exist:**

```
**ICP Profile** — filter results to companies matching your ideal customer.

{list each ICP by name and ID}

→ I'd recommend **{first/most relevant ICP name}** to qualify results.
   Or type **"skip"** to auto-create a broad fallback ICP.
```

Wait for user input.

**If the user types "skip":**

1. Create a broad fallback ICP with the most liberal valid filters:
   - `name`: auto-generated descriptive name like `"Broad Default ICP"`
   - `target_roles`: `["Any"]`
   - `employee_ranges`: `["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"]`
   - `location`: `["Any"]`
2. Call `bash "$API" POST /api/v1/icp/create '<json_body>'` with:

```json
{
  "name": "<auto_generated_broad_icp_name>",
  "target_roles": ["Any"],
  "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"],
  "location": ["Any"]
}
```

3. On success, use that created ICP for deployment and tell the user:

```
No ICP selected, so I created a broad fallback ICP: **{name}** (ID: {id})

Using this ICP for your search.
```

**If no ICPs exist:**

```
You don't have an ICP profile yet. A quick one will make results much sharper —
it filters by company size, location, and the roles you're targeting.

1. **Quick setup** (recommended) — takes 30 seconds
2. **Skip** — auto-create a broad fallback ICP and continue
```

Wait for user input.

**If quick setup chosen:**

1. Fetch `bash "$API" GET /api/v1/icp/options` to get valid values for locations.

2. Present the fields:

```
### Quick ICP Setup

**1. ICP Name** — a short label (e.g., "Mid-market SaaS US")

**2. Target Roles** — job titles you sell to (comma-separated)
   Example: "VP Engineering", "CTO", "Head of Data"

**3. Company Size** — pick from:
- `1-10`
- `11-50`
- `51-200`
- `201-500`
- `501-1000`
- `1001-5000`
- `5001-10000`
- `10001+`

**4. Funding Stage** — optional. Pick one or a range from:
- `Any`
- `Acquired`
- `Angel`
- `Closed`
- `Convertible Note`
- `Corporate`
- `Corporate Round`
- `Debt Financing`
- `Equity Crowdfunding`
- `Funding`
- `Grant`
- `No Funding Yet`
- `Non Equity Assistance`
- `Other`
- `Pre Seed`
- `Private Equity`
- `Product Crowdfunding`
- `Public`
- `Secondary Market`
- `Seed`
- `Series A`
- `Series B`
- `Series C`
- `Series D`
- `Series E`
- `Series F`
- `Series G`
- `Series H`
- `Series J`
- `Series Unknown`
- `Undisclosed`
- `Initial Coin Offering`
- `IPO`
- `Post IPO Debt`
- `Post IPO Equity`
- `Post IPO Secondary`
- `Venture`

You can leave funding empty, or provide a single stage, or a min/max range.

**5. Company HQ Location** — pick from:
{list locations as "value — label" from options}
```

3. Collect inputs. Then confirm:

```
### ICP Summary

**Name:** {name}
**Target Roles:** {roles}
**Employee Ranges:** {ranges}
**Funding:** {funding or "none"}
**Location:** {location}

Create this ICP? (yes / edit)
```

4. If yes → `bash "$API" POST /api/v1/icp/create '<json_body>'` with:

```json
{
  "name": "<name>",
  "target_roles": ["<role1>", "<role2>"],
  "employee_ranges": ["<range1>", "<range2>"],
  "min_funding": "<optional_min_funding_or_null>",
  "max_funding": "<optional_max_funding_or_null>",
  "employee_count_funding_config": "<AND_or_OR_or_null>",
  "location": ["<location_code>"]
}
```

5. On success:

```
ICP created: **{name}** (ID: {id})

Using this ICP for your search.
```

**If skip chosen instead of quick setup:**

1. Auto-create a broad fallback ICP with:

```json
{
  "name": "<auto_generated_broad_icp_name>",
  "target_roles": ["Any"],
  "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"],
  "location": ["Any"]
}
```

2. Then show:

```
No ICP details provided, so I created a broad fallback ICP: **{name}** (ID: {id})

This keeps the search deployable while using the least restrictive valid ICP.
```

---

### 5. Confirm & Deploy

Present the full search configuration:

```
### Ready to deploy

| Field | Value |
|-------|-------|
| **Trait** | {trait} |
| **Activity** | {activity or "none"} |
| **Qualifier** | {qualifier or "none"} |
| **Signal Name** | {auto-generated descriptive name} |
| **ICP** | {selected icp name or auto-created fallback icp name} |

**Options** (all default off — set any before deploying):
- **Repeat daily** — re-run every day for continuous monitoring
- **Auto-enrich emails** — find work emails for discovered contacts
- **Credit limit** — cap spending on this signal
- **Auto-add to CRM** — push accounts to Salesforce/HubSpot automatically

⚡ *This will use credits from your plan.*

**Deploy?** (yes / edit / cancel)
```

Wait for user input.

If "edit" → ask what to change, update, re-confirm.

If "yes" → deploy:

`bash "$API" POST /api/v1/signal/deploy/deep-company-search-agent '<json_body>'` with:

```json
{
  "name": "<auto-generated name>",
  "trait": "<trait>",
  "activity": "<activity or null>",
  "qualifier": "<qualifier or null>",
  "icp_id": "<selected_or_fallback_icp_id>",
  "repeat": false,
  "account_audience_name": "<name or null>",
  "people_audience_name": "<name or null>",
  "max_credit_limit": null,
  "enable_safe_crm_addition": false,
  "auto_enrich_people_emails": false
}
```

Post-deploy:

```
Signal deployed: **{name}** (ID: {signal_id})

This agent is now searching for companies matching your pain point.
Results come in as they're found — say "check on {signal_name}" anytime.
```

---

### 6. Check Results

When the user checks back:

`bash "$API" POST /api/v1/signal/ '{"signal_id": <signal_id>}'` → present accounts and people.

```
### Results from: {signal_name}

**{total_accounts} accounts found | {total_people} people found**

| # | Company | Domain | Signals |
|---|---------|--------|---------|
| 1 | {name} | {domain} | {signal count} |
| 2 | ... | ... | ... |
```

If the user wants full details on specific accounts, pull with `bash "$API" POST /api/v2/account/batch '{"account_ids": [...]}'`.

---

### 7. What's Next

Always show after presenting results:

```
### What would you like to do next?

1. **Drill into a specific account** — full enrichment, signals, contacts, and attack strategy
2. **Score & tier these accounts** — prioritize by pain urgency and evidence strength
3. **Find people at these companies** — decision-makers posting about this pain
4. **Enterprise deep-dive** — for F500 accounts, find which team has the pain
5. **Deploy another signal** — search for a different pain point or refine this one
6. **Export to CRM** — push accounts and contacts to Salesforce or HubSpot
```

Route based on selection:
- 1 → use the `enrich-and-research` skill
- 2 → use the `score-and-tier` skill
- 3 → use the `find-people-having-simple-signals` skill
- 4 → use the `enterprise-account-research` skill
- 5 → loop back to Step 1
- 6 → use CRM sync endpoints: `bash "$API" POST /api/v1/crm/sync-accounts-job '<json_body>'` and `bash "$API" POST /api/v1/crm/sync-people-job '<json_body>'`


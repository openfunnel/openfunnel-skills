---
name: advanced-account-setup
description: Advanced account setup — ICP profiles, blocklists, and integrations (Salesforce, HubSpot, Slack)
---

# Advanced Account Setup

Configure your OpenFunnel account for production use. This skill handles ICP profiles, blocklists, and CRM/Slack integrations — the settings that control how OpenFunnel filters, excludes, and syncs data.

Authentication is handled by Step 0 (Agent Auth Check) in every skill. This skill is for what comes after — dialing in the configuration.

## When to Use This Skill

- "Set up my ICP"
- "Configure my ideal customer profile"
- "Block competitors from showing up in results"
- "Connect Salesforce / HubSpot / Slack"
- "Set up integrations"
- "Fine-tune my account settings"

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/advanced-account-setup/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## Agent Rules

1. **Walk through one section at a time.** Don't dump the entire setup flow. Present each section, complete it, then move to the next.
2. **Fetch options before asking for input.** Always call the options endpoint first so the user picks from valid values — don't let them guess.
3. **Confirm before creating.** Show the full configuration summary before hitting create.
4. **Present what the API returns.** No fabrication.

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

OpenFunnel turns every event in your market into pipeline
— using OpenFunnel's Event Intelligence engine.

To get started, I'll authenticate you via the API.

**What's your work email?**
```

Wait for user input. Then:

1. Run `bash "$SIGNUP" start "<user_email>"`
2. Tell the user a 6-digit code was sent:
   ```
   I sent a 6-digit verification code to **{email}**. Reply with the code.
   ```
3. Wait for input. Run `bash "$SIGNUP" verify "<user_email>" "<code>"`
4. On success, the response is: `{"status": "authenticated", "user_id": "..."}`. Credentials are written to `.env` and `.gitignore` is updated automatically.
5. Verify with `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'`
6. If verification succeeds → continue to Step 1
7. If sign-up fails → ask user to retry
8. If verify fails → tell user the code was invalid or expired (up to 10 attempts in 24 hours), offer to retry or resend

---

### 1. Welcome & Setup Menu

Present the setup sections. The user can do them in any order or skip what they don't need.

```
### OpenFunnel Account Setup

Here's what you can configure:

1. **Create ICP (Ideal Customer Profile)** — Define the firmographic segment OpenFunnel should monitor: company size, funding stage, location, and target roles
2. **Advanced ICP** — Describe your ideal customer in natural language for more nuanced matching
3. **Blocklist** — Exclude specific companies or types of companies from your results
4. **Integrations** — Connect Salesforce, HubSpot, or Slack

Which would you like to set up? (or "all" to walk through everything)
```

Wait for user input.

---

### 2. Create Firmographic ICP

This is the foundation. OpenFunnel agents use the ICP to filter every signal, every audience, and every enrichment. Without an ICP, results are unfiltered.

#### Step 1: Fetch valid options

Call `bash "$API" GET /api/v1/icp/options` to get the valid values for each field.

Present them cleanly:

```
### ICP Configuration

First, let's set up the basics. Here are your options:

**Company Size (employee_ranges):**
{list each option from employee_ranges, e.g. "1-10", "11-50", "51-200", ...}
→ Pick one or more. These are AND-ed with other filters.

**Funding Stages:**
{list each option from funding_stages, e.g. "Seed", "Series A", ...}
→ Optional. Pick a min and max to define a range (e.g., Seed → Series B).

**Company HQ Location:**
{list each option as "value — label" from locations}
→ Pick one or more.

**Sub-locations (US only):**
{only show if relevant — list from sub_locations}
→ Available when location is "us". Pick specific states/cities.

**People Location:**
{list from people_locations}
→ Where the target people are located (can differ from company HQ).

**People Sub-locations (US only):**
{list from people_sub_locations}
→ Same as above, for US states/cities.
```

#### Step 2: Collect inputs

Walk through each required field:

```
**1. ICP Name** — A descriptive name for this profile (e.g., "Mid-market SaaS, Series A-B, US")

**2. Target Roles** — Job titles or role descriptions to target. Comma-separated.
   Examples: "VP Engineering", "CTO", "Head of Security", "Director of Data"

**3. Company Size** — Which employee ranges? (pick from the list above)

**4. Company HQ Location** — Where should these companies be headquartered?
```

Then optional fields:

```
**Optional:**
- **Funding stage range** — Min and max (e.g., "Seed" to "Series B"). Leave blank to skip.
- **Employee + Funding logic** — "AND" (must match both) or "OR" (match either). Default: AND.
- **Sub-locations** — US states/cities (only if location is "us").
- **People locations** — Where target people are located.
- **People sub-locations** — US states/cities for people.

Set any of these, or "skip" for defaults.
```

Wait for user input for each field (or collect all at once if the user provides them together).

#### Step 3: Confirm and create

Present the full configuration:

```
### ICP Summary

**Name:** {name}
**Target Roles:** {roles}
**Employee Ranges:** {ranges}
**Location:** {location}
**Funding:** {min_funding} → {max_funding} ({config logic})
{any other fields that were set}

Create this ICP? (yes / no / edit)
```

If yes → call `bash "$API" POST /api/v1/icp/create '<json_body>'` with:

```json
{
  "name": "<name>",
  "target_roles": ["<role1>", "<role2>"],
  "employee_ranges": ["<range1>", "<range2>"],
  "location": ["<location_code>"],
  "min_funding": "<stage or null>",
  "max_funding": "<stage or null>",
  "employee_count_funding_config": "<AND or OR or null>",
  "sub_locations": ["<codes or null>"],
  "people_locations": ["<codes or null>"],
  "people_sub_locations": ["<codes or null>"]
}
```

On success, present:

```
ICP created: **{name}** (ID: {id})

This ICP is now active. All signals, audiences, and enrichments can use it.
```

Return to setup menu.

---

### 3. Advanced ICP (Natural Language)

For customers who want to go beyond firmographic filters. Describe your ideal customer in plain language — industry focus, pain points, tech stack, buying behavior.

```
### Advanced ICP — Natural Language Description

Firmographic ICP filters on company size, funding, and location. Advanced ICP adds a
natural language layer — describe *what kind* of company you're looking for in your own words.

**Examples:**
- "B2B SaaS companies in the data infrastructure space that are post-product-market-fit
  and scaling their go-to-market. Ideally series A-C, with a technical founder,
  selling to engineering or data teams."
- "Mid-market healthcare companies modernizing their patient data systems.
  They're moving off legacy EHR platforms and evaluating cloud-native alternatives."
- "Developer tools companies that sell to platform engineering teams.
  Companies where the buyer is a VP/Director of Engineering or Platform."

**What does your ideal customer look like?** Describe their industry, stage, pain points,
buying behavior — whatever helps OpenFunnel understand who you're after.
```

Wait for user input.

Once the user provides their description, confirm:

```
### Advanced ICP Description

**Your description:**
> {user's description}

Save this? (yes / edit)
```

If yes → call `bash "$API" POST /api/v1/icp/advanced-description '<json_body>'` with:

```json
{
  "icp_id": "<id from firmographic ICP>",
  "description": "<user's natural language description>"
}
```

> **Note:** This endpoint is coming soon. The description will be saved and used by OpenFunnel agents to qualify accounts beyond firmographic filters.

Return to setup menu.

---

### 4. Blocklist

Exclude specific companies or types of companies from all OpenFunnel results — signals, audiences, enrichments.

```
### Blocklist Setup

Two ways to block companies:

1. **By domain** — Provide specific domains to exclude
   Example: "competitor.com, acquired-company.io, our-own-domain.com"

2. **By description** — Describe what kind of companies to block in natural language
   Example: "Consulting firms, agencies, companies with fewer than 5 employees,
   any company in our own portfolio"

Which approach? (or "both")
```

Wait for user input.

#### If by domain:

```
**Provide the domains to block** (comma-separated):
Example: competitor.com, acme.io, example.org
```

Collect the list, confirm:

```
### Blocklist — Domains

Blocking these domains from all results:
{list each domain}

Confirm? (yes / edit)
```

If yes → call `bash "$API" POST /api/v1/blocklist/domains '<json_body>'` with:

```json
{
  "domains": ["competitor.com", "acme.io", "example.org"]
}
```

> **Note:** This endpoint is coming soon. Blocked domains will be excluded from all signal results, audiences, and enrichments.

#### If by description:

```
**Describe the companies you want to block:**
Example: "Consulting firms, dev agencies, any company under 10 employees,
competitors in our space (list names if you have them)"
```

Collect, confirm:

```
### Blocklist — Description

Blocking companies matching:
> {user's description}

Confirm? (yes / edit)
```

If yes → call `bash "$API" POST /api/v1/blocklist/description '<json_body>'` with:

```json
{
  "description": "<user's natural language description>"
}
```

> **Note:** This endpoint is coming soon. The description will be used to automatically exclude matching companies from results.

Return to setup menu.

---

### 5. Integrations

#### Salesforce

```
### Connect Salesforce

Salesforce integration lets OpenFunnel:
- Sync discovered accounts and contacts directly to Salesforce
- Enrich existing Salesforce accounts with buying signals
- Flag when CRM accounts show new activity

Want to connect Salesforce? (yes / skip)
```

If yes:

1. Call `bash "$API" POST /api/v1/integrations/salesforce/auth-url '{}'` to get the OAuth authorization URL
2. Present the URL to the user:
   ```
   Open this URL to authorize OpenFunnel with your Salesforce org:
   {auth_url}

   After authorizing, Salesforce will redirect you with a code. Paste the full redirect URL here.
   ```
3. User pastes the redirect URL → extract the authorization code
4. Call `bash "$API" POST /api/v1/integrations/salesforce/callback '{"code": "...", "redirect_uri": "..."}'` to complete the connection
5. On success:
   ```
   Salesforce connected.

   You can now:
   - Sync accounts: `bash "$API" POST /api/v1/crm/sync-accounts-job '{"account_ids": [...], "assigned_user_email": "..."}'`
   - Sync people: `bash "$API" POST /api/v1/crm/sync-people-job '{"people_ids": [...], "assigned_user_email": "..."}'`
   - Check sync status: `bash "$API" POST /api/v1/crm/check-job-status '{"job_id": "..."}'`
   ```

Return to setup menu.

#### HubSpot

```
### Connect HubSpot

HubSpot integration lets OpenFunnel:
- Sync discovered accounts and contacts directly to HubSpot
- Enrich existing HubSpot accounts with buying signals
- Flag when CRM accounts show new activity

Want to connect HubSpot? (yes / skip)
```

If yes:

1. Call `bash "$API" POST /api/v1/integrations/hubspot/auth-url '{}'` to get the OAuth authorization URL
2. Present the URL to the user:
   ```
   Open this URL to authorize OpenFunnel with your HubSpot account:
   {auth_url}

   After authorizing, HubSpot will redirect you with a code. Paste the full redirect URL here.
   ```
3. User pastes the redirect URL → extract the authorization code
4. Call `bash "$API" POST /api/v1/integrations/hubspot/callback '{"code": "...", "redirect_uri": "..."}'` to complete the connection
5. On success:
   ```
   HubSpot connected.

   You can now:
   - Sync accounts: `bash "$API" POST /api/v1/crm/sync-accounts-job '{"account_ids": [...], "assigned_user_email": "..."}'`
   - Sync people: `bash "$API" POST /api/v1/crm/sync-people-job '{"people_ids": [...], "assigned_user_email": "..."}'`
   - Check sync status: `bash "$API" POST /api/v1/crm/check-job-status '{"job_id": "..."}'`
   ```

Return to setup menu.

#### Slack

```
### Connect Slack

Slack integration lets OpenFunnel:
- Send real-time alerts when new signals fire
- Notify your team when high-priority accounts show buying activity
- Deliver daily/weekly signal digests to a channel

Want to connect Slack? (yes / skip)
```

If yes:

1. Call `bash "$API" POST /api/v1/integrations/slack/auth-url '{}'` to get the OAuth authorization URL
2. Present the URL to the user:
   ```
   Open this URL to authorize OpenFunnel with your Slack workspace:
   {auth_url}

   After authorizing, Slack will redirect you with a code. Paste the full redirect URL here.
   ```
3. User pastes the redirect URL → extract the authorization code
4. Call `bash "$API" POST /api/v1/integrations/slack/callback '{"code": "...", "redirect_uri": "..."}'` to complete the connection
5. On success, configure notifications:
   ```
   Slack connected.

   **Configure notifications:**

   1. **Channel** — Which Slack channel should receive alerts?
      (e.g., #sales-signals, #gtm-alerts)

   2. **Alert frequency** — How often?
      - **Real-time** — instant notification per signal
      - **Daily digest** — summary once per day
      - **Weekly digest** — summary once per week

   3. **Signal filter** — Which signals trigger Slack alerts?
      - All signals (default)
      - Specific signal IDs
   ```
6. Collect user preferences, then call `bash "$API" POST /api/v1/integrations/slack/configure '{"channel": "...", "frequency": "...", "signal_ids": [...]}'` to save.

Return to setup menu.

---

### 6. Setup Complete

When the user has finished all sections (or says they're done):

```
### Setup Complete

Here's what's configured:

| Component | Status |
|-----------|--------|
| Firmographic ICP | {created — name (ID: x) / not set} |
| Advanced ICP | {saved / not set} |
| Blocklist | {x domains blocked / description set / not set} |
| Salesforce | {connected / not connected} |
| HubSpot | {connected / not connected} |
| Slack | {connected / not connected} |

You're ready to start finding accounts. Try:
- "Find companies hiring for [your space]"
- "Research [company name]"
- "Find people posting about [topic]"
```


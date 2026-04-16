---
name: spot-competitor-sales-activity
description: Spy on competitor sales reps' LinkedIn activity to surface which accounts they're working (daily). Cross-reference with your pipeline to find competitive deals and net-new opportunities.
---

# Spot Competitor Sales Activity (Daily)

Spy on a competitor sales rep's LinkedIn activity to surface which accounts they're working. Cross-reference surfaced accounts with your pipeline to find competitive deals and net-new opportunities.

## How to Use

1. Identify your top 3-5 competitors' outbound sales reps on LinkedIn
2. Set up a spy agent for each rep
3. Cross-reference surfaced accounts with your pipeline:
   - Account in your pipeline = competitive deal, accelerate
   - Account not in your pipeline = net-new opportunity
4. Accounts appearing across multiple competitor spy agents = hot market segment

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/spot-competitor-sales-activity/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## When to Use This Skill

- "Spy on competitor sales reps"
- "Track what accounts Gong's AEs are working"
- "Monitor competitor SDR activity on LinkedIn"
- "Which accounts are Outreach's sales team engaging with"

## Agent Rules

1. **NEVER rewrite or reframe the user's query.** Use their exact words. Ask if unclear — don't modify yourself.
2. **Don't deploy signals without confirming.** Signals cost credits. Always confirm before deploying.
3. **Present what the API returns.** No fabrication, no inference.
4. **Input must be a person's LinkedIn URL.** Not a company page. The agent monitors an individual rep's activity.
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

OpenFunnel turns daily events in your market into pipeline
— using OpenFunnel's Event Intelligence engine.

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

### 1. Understand the request

The user needs to provide a **competitor sales rep's LinkedIn profile URL**. Must be an individual person, not a company page.

If the user names a competitor but doesn't provide a specific rep URL, ask for it.

**Timeframe:** Default: 7 days.

### 2. Check existing signals

Run `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 100, "offset": 0}}'` to check for existing competitor activity signals monitoring the same URL.

If a match exists, present it and ask if the user wants to use it or deploy a new one.

### 3. Get results from existing signal

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get accounts surfaced by this signal.

```
### Results from: {signal_name}

**{total_accounts} accounts surfaced | {total_people} people**

| Company | Domain | Activity Type |
|---------|--------|--------------|
| ... | | |
```

### 4. ICP Check

Fetch available ICP profiles: `bash "$API" GET /api/v1/icp/list`.

**If ICPs exist:** present them and let the user pick one, or "none" to skip.

**If the user types "none" or skips ICP selection:**

Auto-create a broad fallback ICP:

```bash
bash "$API" POST /api/v1/icp/create '{"name": "Broad Default ICP", "target_roles": ["Any"], "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"], "location": ["Any"]}'
```

**If no ICPs exist:** offer quick setup or skip to auto-create broad fallback.

### 5. Confirm & Deploy

```
I'll deploy a **competitor activity** signal:

**Name:** {auto-generated descriptive name}
**Monitoring:** {LinkedIn URL of competitor rep}
**Timeframe:** {default — 7 days}

**ICP:** {selected or created ICP name}

⚡ *This will use credits from your plan.*

Other options:
- **Repeat daily** — re-run this signal every day for continuous monitoring (recommended)
- **Audience name** — auto-add results to a named audience
- **Credit limit** — cap spending on this signal

Set any of these, or "deploy" to go with defaults.
```

Wait for user input. Then deploy:

```bash
bash "$API" POST /api/v1/signal/deploy/competitor-activity-agent '{"name": "<name>", "linkedin_url": "<url>", "timeframe": <days>, "icp_id": <id>, "repeat": <true|false>}'
```

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now monitoring this competitor rep's LinkedIn activity.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get results found so far.

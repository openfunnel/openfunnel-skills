---
name: spot-people-changing-jobs
description: Spot ICP people changing jobs (daily). New hires have 90 days to pick vendors and show early wins — budget is committed, mandate is fresh. Inferred pain-points from job change events are leading indicators of buying behavior.
---

# Spot People Changing Jobs (Daily)

Monitor ICP professionals changing jobs. A new hire has 90-day pressure to pick vendors and show early wins — budget is already committed, the mandate is fresh, and they're actively evaluating.

Inferred pain-points from job change events are leading indicators of buying behavior.

## Why New Hires Matter

| Timeframe | Behavior | Outreach Readiness |
|-----------|----------|-------------------|
| Week 1-2 | Onboarding, learning landscape | Not ready |
| Week 3-6 | Evaluating what exists, identifying gaps | Prime window |
| Month 2-3 | Making vendor decisions, getting budget approval | Closing window |
| Month 4+ | Decisions made, stack chosen | Window closed |

The 2-month window from job posted → person hired is the buying window. Filters out internal promotions automatically.

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/spot-people-changing-jobs/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## When to Use This Skill

- "Track ICP people changing jobs"
- "Monitor VP-level job changes at my target accounts"
- "Alert me when decision-makers join new companies"
- "Find new hires at companies in my pipeline"

## Agent Rules

1. **NEVER rewrite or reframe the user's query.** Use their exact words. Ask if unclear — don't modify yourself.
2. **Don't deploy signals without confirming.** Signals cost credits. Always confirm before deploying.
3. **Present what the API returns.** No fabrication, no inference.
4. **Never output or log API credentials.** All authenticated calls go through `api.sh`.

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

This signal doesn't need a search query — it monitors ICP-matching people across qualified accounts automatically. The key input is the ICP (which roles to watch).

### 2. Check existing signals

Run `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 100, "offset": 0}}'` to check for existing job change signals.

If a matching ICP job change signal already exists, present it and ask if the user wants to use it or deploy a new one.

### 3. Get results from existing signal

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get people matched by this signal.

```
### Results from: {signal_name}

**{total_people} people found | {total_accounts} accounts**

| Name | New Role | Company | Previous Company | LinkedIn |
|------|----------|---------|-----------------|----------|
| ... | | | | |
```

### 4. ICP Check

Fetch available ICP profiles: `bash "$API" GET /api/v1/icp/list`.

**If ICPs exist:** present them and let the user pick one. The ICP determines which roles are monitored.

**If the user types "none" or skips ICP selection:**

Auto-create a broad fallback ICP:

```bash
bash "$API" POST /api/v1/icp/create '{"name": "Broad Default ICP", "target_roles": ["Any"], "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"], "location": ["Any"]}'
```

**If no ICPs exist:** offer quick setup or skip to auto-create broad fallback.

### 5. Confirm & Deploy

```
I'll deploy a **job change** signal:

**Name:** {auto-generated descriptive name}
**ICP:** {selected or created ICP name}
**Monitoring:** ICP-matching people changing jobs (internal promotions filtered out)

⚡ *This will use credits from your plan.*

Other options:
- **Repeat daily** — re-run this signal every day for continuous monitoring (recommended)
- **Account audience** — auto-add discovered accounts to a named audience
- **People audience** — auto-add discovered people to a named audience
- **Credit limit** — cap spending on this signal

Set any of these, or "deploy" to go with defaults.
```

Wait for user input. Then deploy:

```bash
bash "$API" POST /api/v1/signal/deploy/icp-job-change-agent '{"name": "<name>", "icp_id": <id>, "repeat": <true|false>, "account_audience_name": "<name or null>", "people_audience_name": "<name or null>", "max_credit_limit": <limit or null>}'
```

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now monitoring ICP professionals changing jobs.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get results found so far.

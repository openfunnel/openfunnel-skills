---
name: spot-people-engaging-with-competitors
description: Spot ICP people engaging with competitor or thought leader LinkedIn content (daily). Multiple people from the same company engaging = real signal. Inferred pain-points from engagement events are leading indicators of buying behavior.
---

# Spot People Engaging with Competitors (Daily)

Track which ICP people are engaging with a specific LinkedIn profile — liking, commenting, sharing. Surfaces in-market signals from people actively evaluating or interested in a space.

Inferred pain-points from engagement events are leading indicators of buying behavior.

## What It Captures

- **Monitor your own content** → who's engaging = warm leads
- **Monitor competitor leadership** → who's engaging = evaluating alternatives
- **Monitor industry thought leaders** → who's engaging = active in the space

**Important:** Single likes are noise — never treat one interaction as a signal. Aggregate at account level — multiple people from same company engaging = real signal.

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/spot-people-engaging-with-competitors/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## When to Use This Skill

- "Who's engaging with our competitor's LinkedIn content"
- "Track people engaging with our CEO's posts"
- "Monitor who's liking and commenting on Datadog's CTO's LinkedIn"
- "Find people engaging with industry thought leaders in observability"

## Agent Rules

1. **NEVER rewrite or reframe the user's query.** Use their exact words. Ask if unclear — don't modify yourself.
2. **Don't deploy signals without confirming.** Signals cost credits. Always confirm before deploying.
3. **Present what the API returns.** No fabrication, no inference.
4. **Target thought leaders, not company pages.** CEOs, CPOs, industry analysts are better profile targets than generic company pages.
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

The user needs to provide a **LinkedIn profile URL** to monitor. This can be an individual (CEO, CTO, thought leader) or a company page.

If the user describes a person but doesn't provide a URL, ask for it.

**Timeframe:** Last day to last year. Default: 7 days.

### 2. Check existing signals

Run `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 100, "offset": 0}}'` to check for existing competitor engagement signals monitoring the same URL.

If a match exists, present it and ask if the user wants to use it or deploy a new one.

### 3. Get results from existing signal

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get people matched by this signal.

```
### Results from: {signal_name}

**{total_people} people found | {total_accounts} accounts**

| Name | Role | Company | Engagement | LinkedIn |
|------|------|---------|------------|----------|
| ... | | | | |
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
I'll deploy a **competitor engagement** signal:

**Name:** {auto-generated descriptive name}
**Monitoring:** {LinkedIn URL}
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
bash "$API" POST /api/v1/signal/deploy/competitor-engagement-agent '{"name": "<name>", "linkedin_url": "<url>", "timeframe": <days>, "icp_id": <id>, "repeat": <true|false>}'
```

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now monitoring who's engaging with this LinkedIn profile.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get results found so far.

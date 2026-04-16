---
name: spot-people-posting-about-specific-things
description: Spot people posting about specific things on socials (daily). Person-level posts give you the decision-maker, the context, and the timing in one signal. Inferred pain-points from social events are leading indicators of buying behavior.
---

# Spot People Posting About Specific Things (Daily)

Spot specific people posting about a topic, milestone, or announcement on social media. A person posting about a challenge gives you the decision-maker, the context, and the timing in one signal — stronger than company-level posts.

Inferred pain-points from social events are leading indicators of buying behavior.

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/spot-people-posting-about-specific-things/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## When to Use This Skill

- "Find people posting about adding MCP in production"
- "Find people posting about attending SaaStr conference"
- "Find people announcing their seed funding"
- "Find people announcing their acceptance into YC S25"
- "Find people who attended an AGI House hackathon"

## Agent Rules

1. **NEVER rewrite or reframe the user's query.** Use their exact words. Ask if unclear — don't modify yourself.
2. **Don't deploy signals without confirming.** Signals cost credits. Always confirm before deploying.
3. **Present what the API returns.** No fabrication, no inference.
4. **Close match ≠ loose match.** If you have to think about whether it matches, it doesn't.
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

What topic, milestone, or announcement is the user looking for people posting about? If unclear, ask.

**Prompt format:** `"Find people posting about [topic or milestone or announcement]"`

**Examples of good inputs:**
- "Find people talking about adding MCP in production"
- "Find people posting about attending SaaStr conference"
- "Find people announcing their seed funding"
- "Find people announcing their acceptance into YC S25"
- "Find people who attended an AGI House hackathon"

**Timeframe:** Last day to last year. Default: last 3 months.

### 2. Check existing signals

Run `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 100, "offset": 0}}'` to get all currently deployed signals.

A signal is unique by **query + ICP pair**. When checking for matches, compare BOTH the query (close match, not inference) and the ICP.

**If potential match found (query + ICP both match):**

```
I found an existing signal that covers this:

**{signal_name}** (ID: {signal_id})
**ICP:** {icp.name}

Want to use this one, or deploy a new signal?
```

Wait for user input.

### 3. Get results from existing signal

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get people matched by this signal.

```
### Results from: {signal_name}

**{total_people} people found | {total_accounts} accounts**

| Name | Role | Company | LinkedIn |
|------|------|---------|----------|
| ... | | | |
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
I'll deploy a **people social listening** signal:

**Name:** {auto-generated descriptive name}
**Query:** "{user's exact query}"
**Timeframe:** {default — 90 days}

**ICP:** {selected or created ICP name}

⚡ *This will use credits from your plan.*

Other options:
- **Repeat daily** — re-run this signal every day for continuous monitoring
- **Audience name** — auto-add results to a named audience
- **Credit limit** — cap spending on this signal

Set any of these, or "deploy" to go with defaults.
```

Wait for user input. Then deploy:

```bash
bash "$API" POST /api/v1/signal/deploy/social-listening-agent '{"name": "<name>", "search_query": "<query>", "signal_target": "people", "timeframe": <days>, "icp_id": <id>, "repeat": <true|false>}'
```

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now scanning social posts for people discussing this topic.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get results found so far.

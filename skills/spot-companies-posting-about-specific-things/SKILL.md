---
name: spot-companies-posting-about-specific-things
description: Spot companies posting about specific things on socials (daily). Decision-maker posts, announcements, and public positioning reveal active pain. Inferred pain-points from social events are leading indicators of buying behavior.
---

# Spot Companies Posting About Specific Things (Daily)

Spot companies whose decision-makers are posting about specific topics, milestones, or announcements on social media. VP/C-level posts about challenges are stronger signals than press releases — they reveal pain in real time.

Inferred pain-points from social events are leading indicators of buying behavior.

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/spot-companies-posting-about-specific-things/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## When to Use This Skill

- "Find companies posting about raising their Series A"
- "Find companies posting about growing their GTM team"
- "Find companies posting about attending RSAC conference"
- "Find companies posting about adding AI to their existing stack"
- "Find companies posting about migrating off legacy monitoring"
- "Find companies posting about evaluating new CRM platforms"

## What It Captures

- **Decision-maker pain posts** — VP/C-level posting about challenges (stronger than press releases)
- **Budget signals** — headcount growth, new initiatives, strategic pivots
- **Vendor evaluation** — comparing tools, asking for recommendations, discussing migrations
- **Conference/event attendance** — signals active evaluation and network building

## Agent Rules

1. **NEVER rewrite or reframe the user's query.** Use the user's exact words as the search query. Do not add your own interpretation, expand abbreviations, add synonyms, or "improve" the query. If you think the query could be more specific, ask the user — do not modify it yourself.
2. **Don't deploy signals without confirming.** Signals cost credits. Always confirm before deploying.
3. **Present what the API returns.** No fabrication, no inference.
4. **Close match ≠ loose match.** "Companies posting about SOC2" ≈ "Companies discussing compliance" → match. "Companies posting about SOC2" ≠ "Companies in regulated industries" → not a match, too much inference.
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

What topic, milestone, or announcement is the user looking for in social posts? If unclear, ask.

**Prompt format:** `"Find companies posting about [topic or milestone or announcement]"`

**Examples of good inputs:**
- "Find companies posting about raising their Series A"
- "Find companies posting about growing their GTM team"
- "Find companies posting about attending RSAC conference"
- "Find companies posting about adding AI to their existing stack"
- "Find companies posting about migrating off legacy monitoring"
- "Find companies posting about evaluating new CRM platforms"

**Timeframe:** Last day to last year. Default: last 3 months.

### 2. Check existing signals

Run `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 100, "offset": 0}}'` to get all currently deployed signals.

A signal is unique by **query + ICP pair**. When checking for matches, compare BOTH:

1. **Query match** — close match on signal name. Same meaning, different wording is fine.
2. **ICP match** — the signal's `icp.id` must match the user's intended ICP.

**If potential match found (query + ICP both match):**

```
I found an existing signal that covers this:

**{signal_name}** (ID: {signal_id})
**ICP:** {icp.name}

Want to use this one, or deploy a new signal?
```

**If query matches but ICP is different:**

```
I found a signal with a similar query but a different ICP:

**{signal_name}** (ID: {signal_id})
**ICP:** {icp.name}

This uses a different ICP than what you need. Want to:
1. Use this one anyway
2. Deploy a new signal with the right ICP
```

Wait for user input.

### 3. Get results from existing signal

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get accounts and people matched by this signal.

```
### Results from: {signal_name}

**{total_accounts} accounts found | {total_people} people found**
```

If the user wants full details, run `bash "$API" POST /api/v2/account/batch '{"account_ids": [<ids>]}'`.

After presenting:

```
Would you like to:
1. See full details on specific accounts
2. Narrow results with filters (size, funding, location)
3. Deploy an additional signal for broader coverage ⚡ *uses credits*
```

### 4. ICP Check

Fetch available ICP profiles: `bash "$API" GET /api/v1/icp/list`.

**If ICPs exist:** present them and let the user pick one, or "none" to skip.

**If the user types "none" or skips ICP selection:**

Auto-create a broad fallback ICP:

```bash
bash "$API" POST /api/v1/icp/create '{"name": "Broad Default ICP", "target_roles": ["Any"], "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"], "location": ["Any"]}'
```

```
No ICP selected, so I created a broad fallback ICP: **{name}** (ID: {id})

Using this ICP for your signal.
```

**If no ICPs exist:**

```
You don't have an ICP profile yet. A quick one will make results much sharper —
it filters by company size, location, and the roles you're targeting.

1. **Quick setup** (recommended) — takes 30 seconds
2. **Skip** — auto-create a broad fallback ICP and continue
```

If quick setup → collect ICP name, target roles, company size, and location. Create via `bash "$API" POST /api/v1/icp/create '...'`.

If skip → auto-create the broad fallback ICP as above.

### 5. Confirm & Deploy

```
I'll deploy a **social listening** signal:

**Name:** {auto-generated descriptive name}
**Query:** "{formatted prompt}"
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
bash "$API" POST /api/v1/signal/deploy/social-listening-agent '{"name": "<name>", "search_query": "<query>", "signal_target": "account", "timeframe": <days>, "icp_id": <id>, "repeat": <true|false>}'
```

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now scanning social posts for companies discussing this topic.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get results found so far.

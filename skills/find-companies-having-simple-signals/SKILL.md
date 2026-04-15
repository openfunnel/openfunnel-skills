---
name: find-companies-having-simple-signals
description: Find companies by what they're hiring for, posting about, or what tech they use (daily)
---

# Find Companies Having Simple Signals (Daily)

Find companies based on what they're doing — hiring, posting, or using specific technologies. This skill checks if a signal is already tracking what the user wants, returns results if so, or deploys a new signal if not.

If the user is looking for **people** (not companies), use the `find-people-having-simple-signals` skill instead.
If the user is asking about a **specific company**, use account intelligence or enterprise research instead.

## API Calls

All API calls in this skill use the bundled `api.sh` wrapper. Never read or reference API credentials directly.

```bash
# POST with body
bash api.sh POST /api/v1/endpoint '{"key": "value"}'

# GET without body
bash api.sh GET /api/v1/endpoint
```

## When to Use This Skill

- "Find companies that are looking to adopt Kubernetes"
- "Find companies posting about SOC2 compliance"
- "Companies using Snowflake"
- "Companies hiring AI engineers"
- "Find companies posting about their Series A"

## Agent Rules

1. **Don't deploy signals without confirming.** Signals cost credits. Always confirm before deploying.
2. **Don't guess the signal type.** If ambiguous (could be hiring or social), ask.
3. **Close match ≠ loose match.** "Building voice AI agents" ≈ "building voice agents" but ≠ "building in-house voice agents." If you have to think about it, it's not a match.
4. **Present what the API returns.** No fabrication, no inference.
5. **Never output or log API credentials.** All authenticated calls go through `api.sh`.

---

## Workflow

### 0. Agent Auth Check

Before anything, check that `.env` contains `OPENFUNNEL_API_KEY` and `OPENFUNNEL_USER_ID`.

**If both exist:** skip to Step 1.

**If either is missing:**

```
### Welcome to OpenFunnel

OpenFunnel finds companies based on what they're doing — hiring, posting, or using specific technologies.

To get started, I'll authenticate you via the API.

**What's your work email?**
```

Wait for user input. Then:

1. Run `bash api.sh POST /api/v1/agent/sign-up '{"email": "<user_email>"}'`
2. Tell the user a 6-digit code was sent:
   ```
   I sent a 6-digit verification code to **{email}**. Reply with the code.
   ```
3. Wait for input. Run `bash api.sh POST /api/v1/agent/verify '{"email": "<user_email>", "otp_code": "<code>"}'`
4. On success, write to `.env`:
   - `OPENFUNNEL_API_KEY={api_key}`
   - `OPENFUNNEL_USER_ID={email}`
5. Add `.env` to `.gitignore` if not already there
6. Verify with `bash api.sh POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'`
7. If verification succeeds → continue to Step 1
8. If sign-up fails → ask user to retry
9. If verify fails → tell user the code was invalid or expired (up to 10 attempts in 24 hours), offer to retry or resend

---

### 1. Understand the request

What activity or behavior is the user looking for? If unclear, ask.

### 2. Check existing signals

Run `bash api.sh POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 100, "offset": 0}}'` to get all currently deployed signals.

A signal is unique by **query + ICP pair**. The same query with a different ICP is a different signal and needs separate deployment. When checking for matches, compare BOTH:

1. **Query match** — close match on signal name. Same meaning, different wording is fine:
   - "Find companies building voice AI agents" ≈ "Find companies building voice agents" → **match**
   - "Find companies building voice AI agents" ≠ "Find companies building in-house voice agents" → **not a match**
   - "Companies hiring for Kubernetes" ≈ "Companies looking to adopt Kubernetes" → **match**
   - "Companies hiring for Kubernetes" ≠ "Companies migrating to container orchestration" → **not a match, too much inference**

2. **ICP match** — the signal's `icp.id` must match the user's intended ICP. If the user hasn't specified an ICP yet, note which ICP the existing signal uses.

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

Run `bash api.sh POST /api/v1/signal/ '{"signal_id": <id>}'` to get accounts and people matched by this signal.

```
### Results from: {signal_name}

**{total_accounts} accounts found | {total_people} people found**
```

If the user wants full details, run `bash api.sh POST /api/v2/account/batch '{"account_ids": [<ids>]}'`.

After presenting:

```
Would you like to:
1. See full details on specific accounts
2. Narrow results with filters (size, funding, location)
3. Deploy an additional signal for broader coverage ⚡ *uses credits*
```

### 4. Classify and deploy a new signal

Three company signal types:

#### Deep Hiring Signal

**When:** Companies hiring for something, looking to build something, facing a pain point.

**Core principle:** Job posts are modern RFPs — budget is committed, leadership is aligned, they're ready to act. What a company hires for tells you what they're building, scaling, or fixing.

**Prompt format:** `"Find companies that are looking to [activity] or facing [pain point]"`

**Examples:**
- "Find Companies with Hiring post mentioning Implementing Guardrails for AI agents"
- "Find Companies with Hiring post mentioning Setting up Agent Evals and Testing"
- "Find Companies with Hiring post mentioning Migrating from Heroku to AWS"
- "Find Companies with Hiring post mentioning Scaling their PLG motion"
- "Find Companies with Hiring post mentioning Building out their first data engineering team"
- "Find Companies with Hiring post mentioning Adopting Kubernetes"

**Timeframe:** Last day to last year. Default: last 3 months.

**Deploy:** `bash api.sh POST /api/v1/signal/deploy/deep-hiring-agent '{"name": "<name>", "search_query": "<query>", "timeframe": <days>, "icp_id": <id>, "repeat": <true|false>}'`

---

#### Social Listening Signal (Company)

**When:** Companies posting about a topic, milestone, or announcement.

**What it captures:**
- Decision-maker pain posts (VP/C-level posting about challenges — stronger than press releases)
- Budget signals (headcount growth, new initiatives, strategic pivots)
- Vendor evaluation (comparing tools, asking for recommendations, discussing migrations)
- Conference/event attendance

**Prompt format:** `"Find companies posting about [topic or milestone or announcement]"`

**Examples:**
- "Find companies posting about their Series A round"
- "Find companies posting about growing their GTM team"
- "Find companies posting about attending RSAC conference"
- "Find companies posting about adding AI to their existing stack"

**Timeframe:** Last day to last year.

**Deploy:** `bash api.sh POST /api/v1/signal/deploy/social-listening-agent '{"name": "<name>", "search_query": "<query>", "signal_target": "account", "timeframe": <days>, "icp_id": <id>, "repeat": <true|false>}'`

---

#### Technography Signal

**When:** Companies using a specific tool, platform, or technology. Inferred from job postings.

**Important:** Input must be a specific tool name — not general descriptions.

**Good inputs:** `Kubernetes`, `Snowflake`, `React`, `Terraform`, `dbt`, `Kafka`
**Bad inputs:** "cloud infrastructure" (too general), "data tools" (not specific), "modern stack" (meaningless)

**Note on timing:** Technographic data alone is a trait (static). It becomes a signal when combined with timing — "just adopted Snowflake" vs "has used Snowflake for 5 years" are very different. The timeframe parameter controls this.

**Timeframe:** Last day to last year. Default: last 3 months.

**Deploy:** `bash api.sh POST /api/v1/signal/deploy/technography-search-agent '{"name": "<name>", "technographic_list": ["<tech>"], "technographic_variations": ["<variations>"], "technography_context": "<context>", "timeframe": <days>, "icp_id": <id>, "repeat": <true|false>}'`

---

**If ambiguous** — e.g., "companies investing in AI" could be hiring or social — ask:

```
This could be tracked through hiring signals or social signals. Which would be more useful?

1. **Hiring signals** — reveals budget commitment, team building, specific roles
2. **Social signals** — reveals announcements, thought leadership, public positioning
3. **Both** — deploy two signals for broader coverage ⚡ *uses more credits*
```

### 5. Confirm before deploying

First, fetch available ICP profiles: `bash api.sh GET /api/v1/icp/list`. If the user has ICPs, present them:

```
I'll deploy a **{signal type}** signal:

**Name:** {auto-generated descriptive name}
**Query:** "{formatted prompt}"
**Timeframe:** {default}

**ICP Profile:**
{list available ICPs by name}
→ I'd recommend using **{first/most relevant ICP name}** to qualify results.
   Or "none" to skip ICP filtering.

⚡ *This will use credits from your plan.*

Other options:
- **Repeat daily** — re-run this signal every day for continuous monitoring
- **Audience name** — auto-add results to a named audience
- **Credit limit** — cap spending on this signal

Set any of these, or "deploy" to go with defaults.
```

**If the user types "none" or skips ICP selection:**

Auto-create a broad fallback ICP:

```bash
bash api.sh POST /api/v1/icp/create '{"name": "Broad Default ICP", "target_roles": ["Any"], "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"], "location": ["Any"]}'
```

Then tell the user:

```
No ICP selected, so I created a broad fallback ICP: **{name}** (ID: {id})

Using this ICP for your signal.
```

**If the user has no ICP profiles:**

```
You don't have an ICP profile yet. A quick one will make results much sharper —
it filters by company size, location, and the roles you're targeting.

1. **Quick setup** (recommended) — takes 30 seconds
2. **Skip** — auto-create a broad fallback ICP and continue
```

If quick setup → collect ICP name, target roles, company size, and location. Create via `bash api.sh POST /api/v1/icp/create '{"name": "<name>", "target_roles": ["<roles>"], "employee_ranges": ["<ranges>"], "location": ["<location>"]}'`.

If skip → auto-create the broad fallback ICP as above.

Then deploy with the selected or created ICP ID.

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now scanning {job posts / social posts / tech stack data}.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

Run `bash api.sh POST /api/v1/signal/ '{"signal_id": <id>}'` to get results found so far.

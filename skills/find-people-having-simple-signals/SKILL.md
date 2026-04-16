---
name: find-people-having-simple-signals
description: Find people posting about topics, changing jobs, or engaging with competitor content (daily)
---

# Find People Having Simple Signals (Daily)

Find specific people based on what they're doing — posting about topics, changing jobs, or engaging with competitors. This skill checks if a signal is already tracking what the user wants, returns results if so, or deploys a new signal if not.

If the user is looking for **companies** (not people), use the `find-companies-hiring-to-solve-specific-problems`, `find-companies-posting-about-specific-things`, or `find-companies-using-specific-tech-stack` skill instead.

## When to Use This Skill

- "Find people posting about adding MCP in production"
- "Track ICP people changing jobs"
- "Who's engaging with our competitor's LinkedIn content"
- "Spy on competitor sales reps"
- "Find people posting about attending SaaStr"

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/find-people-having-simple-signals/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## Agent Rules

1. **Don't deploy signals without confirming.** Signals cost credits. Always confirm before deploying.
2. **Close match ≠ loose match.** Same rules as find-accounts — if you have to think about whether it matches, it doesn't.
3. **Present what the API returns.** No fabrication, no inference.

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

1. Call `bash "$SIGNUP" start "<user_email>"`
2. Tell the user a 6-digit code was sent:
   ```
   I sent a 6-digit verification code to **{email}**. Reply with the code.
   ```
3. Wait for input. Call `bash "$SIGNUP" verify "<user_email>" "<code>"`

The response is: `{"status": "authenticated", "user_id": "..."}`. Credentials are written to `.env` and `.gitignore` is updated automatically.

4. If authentication succeeds → continue to Step 1
5. If sign-up fails → ask user to retry
6. If verify fails → tell user the code was invalid or expired (up to 10 attempts in 24 hours), offer to retry or resend

---

### 1. Understand the request

What activity or behavior, and what kind of people? If unclear, ask.

### 2. Check existing signals

`bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": <limit>, "offset": <offset>}, "filters": {...}}'` → get all currently deployed signals.

A signal is unique by **query + ICP pair**. Same query with a different ICP is a different signal. When checking for matches, compare BOTH the query (close match, not inference) and the ICP.

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

`bash "$API" POST /api/v1/signal/ '{"signal_id": <signal_id>}'` → returns people matched by this signal.

```
### Results from: {signal_name}

**{total_people} people found | {total_accounts} accounts**

| Name | Role | Company | LinkedIn |
|------|------|---------|----------|
| ... | | | |
```

After presenting:

```
Would you like to:
1. See full details on specific people's accounts
2. Deploy an additional signal for broader coverage ⚡ *uses credits*
```

### 4. Classify and deploy a new signal

Four people signal types:

#### People Social Listening Signal

**When:** Find specific people posting about a topic, milestone, or announcement.

**Why person-level > company-level:** A company posting about a product launch is generic — no clear who to contact. A person posting about a challenge gives you the decision-maker, the context, and the timing in one signal.

**Prompt format:** `"Find people posting about [topic or milestone or announcement]"`

**Examples:**
- "Find people talking about adding MCP in production"
- "Find people posting about attending SaaStr conference"
- "Find people announcing their seed funding"
- "Find people announcing their acceptance into YC S25"
- "Find people who attended an AGI House hackathon"

**Timeframe:** Last day to last year.

**Deploy:** `bash "$API" POST /api/v1/signal/deploy/social-listening-agent '<json_body>'` with `{ name, search_query, signal_target: "people", timeframe, icp_id, repeat }`

---

#### ICP Job Change Signal

**When:** Monitor ICP professionals changing jobs. New hires have a concentrated buying window.

**Why new hires matter:**

| Timeframe | Behavior | Outreach Readiness |
|-----------|----------|-------------------|
| Week 1-2 | Onboarding, learning landscape | Not ready |
| Week 3-6 | Evaluating what exists, identifying gaps | Prime window |
| Month 2-3 | Making vendor decisions, getting budget approval | Closing window |
| Month 4+ | Decisions made, stack chosen | Window closed |

The 2-month window from job posted → person hired is the buying window. A new hire has 90-day pressure to pick vendors and show early wins.

**No search query needed** — monitors ICP-matching people across qualified accounts automatically. Filters out internal promotions.

**Deploy:** `bash "$API" POST /api/v1/signal/deploy/icp-job-change-agent '<json_body>'` with `{ name, icp_id, repeat, account_audience_name, people_audience_name, max_credit_limit }`

---

#### Competitor Engagement Signal

**When:** Track which ICP people are engaging with a specific LinkedIn profile (liking, commenting). Surfaces in-market signals.

**Input:** LinkedIn profile URL (individual or company page).

**Important rules:**
- Single likes are noise — never treat one interaction as a signal
- Aggregate at account level — multiple people from same company engaging = real signal
- Target thought leaders, not company pages — CEOs, CPOs, industry analysts are better profile targets

**Use cases:**
- Monitor your own content → who's engaging = warm leads
- Monitor competitor leadership → who's engaging = evaluating alternatives
- Monitor industry thought leaders → who's engaging = active in the space

**Timeframe:** Last day to last year. Default: 7 days.

**Deploy:** `bash "$API" POST /api/v1/signal/deploy/competitor-engagement-agent '<json_body>'` with `{ name, linkedin_url, timeframe, icp_id, repeat }`

---

#### Competitor Activity Signal

**When:** Spy on a competitor sales rep's LinkedIn activity to surface which accounts they're working.

**Input:** Individual competitor LinkedIn profile URL. Must be a person, not a company page.

**How to use:**
1. Identify your top 3-5 competitors' outbound sales reps on LinkedIn
2. Set up a spy agent for each rep
3. Cross-reference surfaced accounts with your pipeline:
   - Account in your pipeline = competitive deal, accelerate
   - Account not in your pipeline = net-new opportunity
4. Accounts appearing across multiple competitor spy agents = hot market segment

**Timeframe:** Default: 7 days.

**Deploy:** `bash "$API" POST /api/v1/signal/deploy/competitor-activity-agent '<json_body>'` with `{ name, linkedin_url, timeframe, icp_id, repeat }`

---

### 5. Confirm before deploying

First, fetch available ICP profiles via `bash "$API" GET /api/v1/icp/list`. If the user has ICPs, present them:

```
I'll deploy a **{signal type}** signal:

**Name:** {auto-generated descriptive name}
**Query/Input:** "{formatted prompt or LinkedIn URL}"
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

```json
{
  "name": "<auto_generated_broad_icp_name>",
  "target_roles": ["Any"],
  "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"],
  "location": ["Any"]
}
```

Call `bash "$API" POST /api/v1/icp/create '<json_body>'` with the above, then tell the user:

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

If quick setup → collect ICP name, target roles, company size, and location. Create via `bash "$API" POST /api/v1/icp/create '<json_body>'`.

If skip → auto-create the broad fallback ICP as above.

Then deploy with the selected or created ICP ID.

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now scanning for {people posting about X / job changes / competitor engagement / competitor activity}.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

`bash "$API" POST /api/v1/signal/ '{"signal_id": <signal_id>}'` → present whatever people have been found so far.

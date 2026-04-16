---
name: score-and-tier
description: Score accounts, bucket into tiers, and re-score as new signals come in
---

# Dynamic Account Scoring and Tiering

OpenFunnel runs thousands of signals daily, producing a universe of accounts with rich signal data (job postings, social posts, engagement, job changes). This skill scores that universe and buckets accounts into tiers so customers can operationalize it.

Customers do NOT think in terms of signals. They don't want to configure "hiring + socials + engagement." They want:
- **Pain-based scoring** (OpenFunnel recommended) — "What pain does your product solve?" → we score everything through that lens
- **Custom prompt** — customer describes their own scoring criteria in plain English

The signals are evidence the scoring reads. Not knobs the customer turns.

---

## Scoring Universe

The scoring universe is **all OF accounts**. This includes:

| Pool | Evidence available |
|---|---|
| **OF only** | Traits + signals (job postings, social posts, engagement, job changes) |
| **OF + CRM** | Traits + signals + internal CRM data (deal stage, outreach history, pipeline status). CRM data is already attached to OF accounts via CRM sync — V2 batch returns `crm_status` and `crm_details`. |

Accounts in the customer's CRM that have **zero OF signal coverage** do not enter scoring. OF's signal coverage (especially deep enriches running across thousands of signals) is robust enough that any account showing buying activity will be picked up.

### CRM Coverage Gap

Some high-priority CRM accounts may not have OF signals. This is a **coverage gap, not a scoring gap**. The skill should surface it:

> "X of your CRM accounts have no OF signal coverage. Want to import them for deep enrichment?"

**Import flow:** Customer provides a CSV of domains for accounts they want scored. These get deep enriched (15-30 min async per account), enter the OF universe with signal data, and then enter scoring alongside everything else.

This is manual and intentional — bulk deep enriching the entire CRM is too expensive and most CRM accounts are garbage. The customer picks the ones that matter.

---

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/score-and-tier/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## Part 0: Agent Auth Check

Before anything, test if credentials are working by running:

```bash
bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'
```

**If the call succeeds** (returns JSON with `signals`): skip to Part 1.

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
2. Tell the user a 6-digit code was sent:
   ```
   I sent a 6-digit verification code to **{email}**. Reply with the code.
   ```
3. Wait for input. Run `bash "$SIGNUP" verify "<user_email>" "<code>"`
4. On success, the response is: `{"status": "authenticated", "user_id": "..."}`. Credentials are written to `.env` and `.gitignore` is updated automatically.
5. Verify with `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'`
6. If verification succeeds → continue to ICP check
7. If sign-up fails → ask user to retry
8. If verify fails → tell user the code was invalid or expired (up to 10 attempts in 24 hours), offer to retry or resend

### ICP Check

After auth, fetch ICP profiles via `bash "$API" GET /api/v1/icp/list`.

**If ICPs exist:** note the available ICPs and continue to Part 1.

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

Continue to Part 1.

---

## Part 1: First-Time Init Scoring

One-time setup: score the full account universe, bucket into tiers, create tier audiences.

### Step 1: Pick source audience

List audiences. Customer picks the one containing their account universe.

Optionally surface CRM coverage gap: check for CRM accounts with no OF signals and offer import.

### Step 2: Pick scoring model

> How would you like to score these accounts?
>
> 1. **Pain-based** (recommended) — scores each account based on how urgently they need what you sell
> 2. **Custom** — describe your own scoring criteria in plain English

### Step 3: Get the scoring lens

- Pain-based → "What pain does your product solve? Example: 'We help companies migrate off legacy ERPs to cloud-native'"
- Custom → customer provides their criteria

This is the lens. Every account's signals get read through it.

### Step 4: Score accounts

For each account in the audience:
1. Pull V2 batch data (inline signal content — actual job posting text, social posts, context, CRM details)
2. Pull timeline (chronological events)
3. Read all evidence against the scoring lens
4. Assign score (0-100) + reasoning (1-2 sentences)

### Step 5: Tier

Present the scored distribution. Customer defines tiers — either:
- Threshold-based: "Tier 1 = 80+, Tier 2 = 50-79, Tier 3 = below 50"
- Or customer tells us their bucketing logic

Output: every account has a score, reasoning, and tier.

### Step 6: Pipe to tier audiences

Create a new audience per tier. Each audience is named by tier (e.g. "Tier-1", "Tier-2", "Tier-3") and contains the account IDs that landed in that bucket.

Use `bash "$API" POST /api/v1/audience/create '{"audience_name": "...", "account_ids": [...]}'` to create each tier audience.

---

## Part 2: Scoring New Accounts

Once accounts are scored, tiered, and assigned — they stay put. No re-scoring, no tier movement. New signals on existing accounts directly benefit the rep who owns them.

The continuous piece is **new accounts entering the OF universe**. Signals fire daily, producing new accounts that weren't in the last scoring run. These need to be scored, tiered, and assigned.

### Flow

Runs on a cron (e.g. daily). Uses the alerts API to detect new accounts.

1. **Poll alerts** — `bash "$API" GET /api/v1/insights/alerts '{"days": N, "limit": N, "offset": 0}'` filtered by `view_name` matching the master scoring audience. Returns newly discovered accounts since last check.
2. **Diff** — compare alert account IDs against already-scored accounts. The delta = new accounts to score.
3. **Score new accounts** — same lens (pain-based or custom prompt), same rubric, same four dimensions.
4. **Tier new accounts** — apply the same tier boundaries from init scoring.
5. **Add to tier audiences** — `bash "$API" POST /api/v1/audience/add-accounts '{"audience_id": ID, "account_ids": [...]}'` for each tier.
6. **Enter assignment** — new accounts in each tier are available for assignment (round robin, etc.)

### What stays the same

- The scoring lens (set during init, doesn't change)
- The tier boundaries (set during init)
- Existing accounts in their tiers (don't move)

### What changes

- The source audience grows as OF picks up new accounts from signals
- New accounts need to be caught, scored, and placed

---

## How Scoring Works

**Time is the most important factor.** Pain has a shelf life. A perfect-fit signal from 90 days ago with nothing since is stale, not hot.

Read the timeline as a narrative, not a list. A single signal is a hint. A sequence over weeks is a story.

### Four dimensions (use judgment, not mechanical buckets):

**1. Pain Relevance**
Does this account show signs of having the pain described in the scoring lens?
- Job descriptions describing the problem (read the actual content, not just titles)
- Social posts discussing the pain area
- Tech stack that creates or relates to the pain
- Industry alignment

**2. Temporal Signal**
When did the pain surface? Is it still alive? This dimension can override everything else.
- Signal from 90 days ago with no follow-up = cold. Score LOW.
- Weaker signal from last week > strong signal from 3 months ago
- Velocity: signals clustering in recent weeks = active and building
- Decay: gaps in the timeline after initial signals = cooling off
- Trigger → follow-through: did the triggering event (new hire, funding, leadership change) lead to more activity? If yes = escalating. If no = stalled.

**3. Buying Window**
Can they act now?
- New leadership in relevant function
- Recent funding
- Active hiring in the area
- Multiple signal types pointing at same pain = high conviction

**4. Story Coherence**
Do signals tell a connected narrative?
- Isolated signal = maybe noise, score conservatively
- Connected signals across time = real pattern
- Example: Jan hired VP Eng → Feb posted about migration challenges → Mar hiring cloud engineers = escalating story

**The score should reflect: "If I were selling a solution to [pain], how excited would I be about this account RIGHT NOW — today?"**

---

## Runtime

| Step | Call |
|------|------|
| Step 1 | `bash "$API" POST /api/v1/audience/get-audience-list '{"limit": N, "offset": 0}'` |
| Step 1 | `bash "$API" POST /api/v1/audience/ '{"audience_id": ID}'` |
| Step 4 | `bash "$API" POST /api/v2/account/batch '{"account_ids": [...]}'` |
| Step 4 | `bash "$API" GET /api/v1/account/{accountId}/timeline '{"days": N, "limit": N, "offset": 0}'` |
| Step 6 | `bash "$API" POST /api/v1/audience/create '{"audience_name": "...", "account_ids": [...]}'` |
| Part 2 | `bash "$API" GET /api/v1/insights/alerts '{"days": N, "limit": N, "offset": 0}'` |
| Part 2 | `bash "$API" POST /api/v1/audience/add-accounts '{"audience_id": ID, "account_ids": [...]}'` |

> **NOTE:** 3 API calls per account (summary + V2 batch + timeline). Large audiences (100+) will be slow.

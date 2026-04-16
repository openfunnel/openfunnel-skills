---
name: account-scoring
description: Score accounts 0-100 on pain-point relevance with evidence and reasoning
---

# Static Account Scoring

Score accounts in an audience based on pain-point relevance and urgency.

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/account-scoring/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## Conversation Flow

The agent MUST follow this sequence — do NOT skip steps.

### Step 0: Agent Auth Check

Before anything, test if credentials are working by running:

```bash
bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'
```

**If the call succeeds** (returns JSON with `signals`): skip to Step 1.

**If the call fails** (returns an error or missing credentials message):

```
### Welcome to OpenFunnel

OpenFunnel scores accounts based on pain-point relevance and buying urgency.

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

**If ICPs exist:** note the available ICPs and continue to Step 1.

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

Continue to Step 1.

---

### Step 1: List audiences for user to pick

- List audiences (see Runtime below for which tool to call)
- Present the list
- Ask: "Which audience would you like to score?"

### Step 2: User selects an audience

- Load the audience to get account IDs
- Confirm: "Got it — [audience name] with X accounts."

### Step 3: Present scoring models — MANDATORY, DO NOT SKIP

> Do NOT auto-score. Do NOT skip to results.

Present:

> How would you like to score these accounts?
>
> 1. **OpenFunnel Pain-Based Scoring** — scores each account based on how urgently they need what you sell
> 2. **Custom** — describe your own scoring criteria in plain language

- User picks 1 → proceed to Step 3a
- User picks 2 → user describes custom logic, agent interprets and applies

### Step 3a: Get pain description (Pain-Based Scoring only)

- Ask: "What pain-points does your product/service solve?
  Example: 'We help companies migrate off legacy ERPs to cloud-native'"
- User provides pain description
- This is the lens through which ALL signals will be interpreted

### Step 4: Score each account

For each account_id in the audience:

1. Gather evidence (summary + timeline + full details — see Runtime)
2. Read the evidence against the user's pain description
3. Apply the pain-based scoring rubric below
4. Assign score (0-100) + reasoning (1-2 sentences explaining why)

Sort by score descending. Present as a ranked list.

---

## Pain-Based Scoring — How to Reason

**TIME IS THE MOST IMPORTANT FACTOR.** Pain has a shelf life. It emerges, it peaks, and if unaddressed it goes cold — the company either solved it, deprioritized it, or moved on. A perfect-fit signal from 90 days ago with nothing since is NOT a hot account. It's stale. Score accordingly.

Read the timeline as a narrative, not a list. A single signal is a hint. A sequence of signals over weeks is a story. Timestamps matter as much as content.

Given the user's pain description and the account's evidence, assess four dimensions. These are NOT mechanical point buckets — use judgment. The evidence may be rich or sparse; score what you see.

### 1. Pain Relevance

Does this account show signs of having this pain?

- Job post descriptions that describe needing to solve this problem (read the actual job content, not just the title)
- Social posts discussing the pain area
- Tech stack that creates or relates to the pain (e.g. legacy tool that your product replaces)
- Industry/vertical alignment with the pain

### 2. Temporal Signal

When did the pain surface, and is it still alive? Pain goes cold. **This dimension can override everything else.**

- A highly relevant signal from 90 days ago with no follow-up = cold. The pain may be solved, deprioritized, or abandoned. **Score LOW.**
- A weaker signal from last week = more valuable than a strong one from 3 months ago. Recency wins.
- **Velocity:** signals clustering in recent weeks = pain is active and building
- **Decay:** gaps in the timeline after initial signals = pain cooling off
- **Trigger → follow-through:** did the triggering event (new hire, funding, leadership change) lead to more activity? If yes = escalating. If no = stalled.

### 3. Buying Window

Can they act on it now?

- New leadership in relevant function (someone with mandate to change)
- Recent funding (budget to spend)
- Active hiring in the area (committed to solving, building team)
- Signal stacking: multiple signal types pointing at same pain (hiring + posting about the problem + using legacy tech = high conviction)

### 4. Story Coherence

Do the signals tell a connected narrative?

- Isolated signal = maybe noise, score conservatively
- Connected signals across time = real pattern, score higher
- Example: Jan — hired VP Eng → Feb — posted about migration challenges → Mar — started hiring cloud engineers = clear escalating story
- Counter-example: one social post 80 days ago, nothing since = low confidence

**The score should reflect: "If I were selling a solution to [pain], how excited would I be about this account RIGHT NOW — today?"**

Output per account: score (0-100) + reasoning (1-2 sentences).

---

## Runtime

| Step | Call |
|------|------|
| Step 1 | `bash "$API" POST /api/v1/audience/get-audience-list '{"limit": N, "offset": 0}'` |
| Step 2 | `bash "$API" POST /api/v1/audience/ '{"audience_id": ID}'` |
| Step 4 | `bash "$API" POST /api/v2/account/batch '{"account_ids": [id]}'` → full details + inline signal content (preferred) |

**Prefer V2 batch for scoring.** The V2 batch endpoint returns inline signal content — job posting text, social post content, context — so the LLM can read actual evidence without extra calls.

> **NOTE:** Large audiences (100+) will be slow.

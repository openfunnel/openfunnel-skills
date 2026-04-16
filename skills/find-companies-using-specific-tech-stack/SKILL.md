---
name: find-companies-using-specific-tech-stack
description: Find companies using specific tech stack (daily). Technographic data inferred from job postings reveals what tools companies rely on. Combined with timing, inferred pain-points from tech adoption events are leading indicators of buying behavior.
---

# Find Companies Using Specific Tech Stack (Daily)

Find companies using a specific tool, platform, or technology — inferred from their job postings. What a company requires in job posts tells you what they're running in production.

Technographic data alone is a trait (static). Combined with timing — "just adopted Snowflake" vs "has used Snowflake for 5 years" — it becomes an inferred pain-point and a leading indicator of buying behavior.

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. Never exposes the API key.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

First, resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/find-companies-using-specific-tech-stack/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## When to Use This Skill

- "Find companies using Snowflake"
- "Find companies running Kubernetes in production"
- "Find companies using Terraform for infrastructure"
- "Find companies using dbt for data transformation"
- "Find companies with Kafka in their stack"
- "Find companies that recently adopted Datadog"

## Important: Input Must Be Specific

Input must be a **specific tool name** — not general descriptions.

**Good inputs:** `Kubernetes`, `Snowflake`, `React`, `Terraform`, `dbt`, `Kafka`, `Datadog`, `HubSpot`
**Bad inputs:** "cloud infrastructure" (too general), "data tools" (not specific), "modern stack" (meaningless)

## Agent Rules

1. **Don't deploy signals without confirming.** Signals cost credits. Always confirm before deploying.
2. **Present what the API returns.** No fabrication, no inference.
3. **Reject vague inputs.** If the user gives a general description instead of a specific tool, ask them to name the tool.
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

OpenFunnel infers pain-points from live company and people events.
Inferred pain-points are leading indicators of buying behavior.

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

What specific technology is the user looking for? If they give a vague description, ask for the specific tool name.

The deploy endpoint takes three fields:

- **`technographic_list`** — the primary tool names (e.g., `["Kubernetes", "K8s"]`)
- **`technographic_variations`** — common abbreviations, alternate names, related terms (e.g., `["k8s", "kubectl", "EKS", "AKS", "GKE"]`)
- **`technography_context`** — a short sentence explaining what you're looking for (e.g., `"Companies running Kubernetes for container orchestration"`)

Help the user build these three fields from their input.

**Timeframe:** Last day to last year. Default: last 3 months. Shorter timeframes surface recent adopters. Longer timeframes surface established users.

### 2. Check existing signals

Run `bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 100, "offset": 0}}'` to get all currently deployed signals.

A signal is unique by **query + ICP pair**. When checking for matches, compare BOTH:

1. **Query match** — close match on the technographic list.
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
I'll deploy a **technography** signal:

**Name:** {auto-generated descriptive name}
**Tech:** {technographic_list}
**Variations:** {technographic_variations}
**Context:** {technography_context}
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
bash "$API" POST /api/v1/signal/deploy/technography-search-agent '{"name": "<name>", "technographic_list": ["<tech>"], "technographic_variations": ["<variations>"], "technography_context": "<context>", "timeframe": <days>, "icp_id": <id>, "repeat": <true|false>}'
```

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now scanning job posts for companies using this technology.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

Run `bash "$API" POST /api/v1/signal/ '{"signal_id": <id>}'` to get results found so far.

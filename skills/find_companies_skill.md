---
name: find-companies
description: Find companies by what they're hiring for, posting about, or what tech they use
---

# Find Accounts Skill

Find companies based on what they're doing — hiring, posting, or using specific technologies. This skill checks if a signal is already tracking what the user wants, returns results if so, or deploys a new signal if not.

If the user is looking for **people** (not companies), use `find_people_skill.md` instead.
If the user is asking about a **specific company**, use account intelligence or enterprise research instead.

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

---

## Workflow

### 1. Understand the request

What activity or behavior is the user looking for? If unclear, ask.

### 2. Check existing signals

`listSignals()` → get all currently deployed signals.

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

`getSignal(signalId)` → returns accounts and people matched by this signal.

```
### Results from: {signal_name}

**{total_accounts} accounts found | {total_people} people found**
```

If the user wants full details, pull with `getAccountsV2({ accountIds: [...] })`.

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

**Deploy:** `deployDeepHiringSignal({ name, searchQuery, timeframe })`

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

**Deploy:** `deploySocialListeningSignal({ name, searchQuery, signalTarget: "account", timeframe })`

---

#### Technography Signal

**When:** Companies using a specific tool, platform, or technology. Inferred from job postings.

**Important:** Input must be a specific tool name — not general descriptions.

**Good inputs:** `Kubernetes`, `Snowflake`, `React`, `Terraform`, `dbt`, `Kafka`
**Bad inputs:** "cloud infrastructure" (too general), "data tools" (not specific), "modern stack" (meaningless)

**Note on timing:** Technographic data alone is a trait (static). It becomes a signal when combined with timing — "just adopted Snowflake" vs "has used Snowflake for 5 years" are very different. The timeframe parameter controls this.

**Timeframe:** Last day to last year. Default: last 3 months.

**Deploy:** `deployTechnographySignal({ name, technographicList, technographicVariations, technographyContext, timeframe })`

---

**If ambiguous** — e.g., "companies investing in AI" could be hiring or social — ask:

```
This could be tracked through hiring signals or social signals. Which would be more useful?

1. **Hiring signals** — reveals budget commitment, team building, specific roles
2. **Social signals** — reveals announcements, thought leadership, public positioning
3. **Both** — deploy two signals for broader coverage ⚡ *uses more credits*
```

### 5. Confirm before deploying

First, fetch available ICP profiles via `listIcps()`. If the user has ICPs, present them:

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

If the user has no ICP profiles:

```
You don't have any ICP profiles set up yet. Results won't be filtered against an ICP.
You can create one in the OpenFunnel UI to qualify future signals.

Deploy anyway? (yes / no)
```

Wait for user input. Then deploy with the selected ICP ID.

### 6. Post-deploy

```
Signal deployed: **{name}** (ID: {signal_id})

This is now scanning {job posts / social posts / tech stack data}.
Results come in as they're found — just say "check on {signal_name}" anytime.
```

### 7. Check back

`getSignal(signalId)` → present whatever accounts and people have been found so far.

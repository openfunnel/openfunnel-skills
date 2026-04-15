---
name: enterprise-account-research
description: Break into F500 accounts — find which team has the pain, who leads it, and the evidence
---

# Enterprise Account Research Skill

## Premise: Why Enterprise Accounts Are Different

An enterprise is not a company. It's 100+ teams and product lines operating under one logo — each with their own leaders, budgets, priorities, and timelines. They don't coordinate purchases. The VP of ML Platform has no idea what the Applied AI team is evaluating.

Multiple teams within the same enterprise might need your product, but for completely different reasons, on completely different timelines, with completely different budgets. A signal at "Capital One" is meaningless unless you know *which team* at Capital One it's coming from.

**This skill maps the teams inside an enterprise, finds which ones are facing a specific pain-point, and identifies the leaders and people associated with each.**

## When to Use This Skill

User is asking about a **large/enterprise company** + a **specific pain-point or use case**. Two modes:

**Net new prospecting:**
- "Which team at Capital One needs agent evals?"
- "Research Goldman Sachs for synthetic data opportunities"
- "Find who at Adobe is working on AI guardrails"

**Expansion within existing accounts:**
- "We're already in JP Morgan's trading platform — find other teams that need us"
- "Where else inside Bank of America can we expand?"

Both modes use the same workflow. If the user just says "tell me about Acme Corp" without a specific pain angle, this skill may not be the right fit — it's for pain-targeted enterprise research, not general account lookups.

## Input

Two things are needed:
1. **The enterprise account** — company name or domain
2. **The pain-point / use case** — what the seller helps with

If the user provides the company but not the pain-point, ask: *"What specific problem or use case are you going after at [company]?"*

## Agent Rules

1. **NEVER fabricate data.** If a field is null or missing — say it's missing.
2. **Present what the API returns.** No embellishment.
3. **Wait for user input at every decision point.** Do not auto-proceed.
4. **Keep messages short.** One block of info at a time. Don't front-load explanations — give context only when the user needs to make a decision.
5. **No jargon.** Don't use internal OpenFunnel terminology the user wouldn't know.
6. **Always recommend.** At every decision point, have an opinion on which option is best for the user and why. Mark it as "(recommended)" with a short reason. Base recommendations on: what data is available, what's missing, and what would get the user closer to identifying the right team and leader.

---

## Workflow

### 0. Agent Auth Check

Before anything, check that `.env` contains `OPENFUNNEL_API_KEY` and `OPENFUNNEL_USER_ID`.

**If both exist:** skip to Step 1.

**If either is missing:**

```
### Welcome to OpenFunnel

OpenFunnel maps teams inside enterprise accounts, finds which ones are facing a specific pain-point, and identifies the leaders.

To get started, I'll authenticate you via the API.

**What's your work email?**
```

Wait for user input. Then:

1. Call `POST /api/v1/agent/sign-up` with `{ "email": "<user_email>" }`
2. Tell the user a 6-digit code was sent:
   ```
   I sent a 6-digit verification code to **{email}**. Reply with the code.
   ```
3. Wait for input. Call `POST /api/v1/agent/verify` with `{ "email": "<user_email>", "otp_code": "<code>" }`
4. On success, write to `.env`:
   - `OPENFUNNEL_API_KEY={api_key}`
   - `OPENFUNNEL_USER_ID={email}`
5. Add `.env` to `.gitignore` if not already there
6. Verify with `POST /api/v1/signal/get-signal-list { "pagination": { "limit": 1, "offset": 0 } }`
7. If verification succeeds → continue to ICP check
8. If sign-up fails → ask user to retry
9. If verify fails → tell user the code was invalid or expired (up to 10 attempts in 24 hours), offer to retry or resend

### ICP Check

After auth, fetch ICP profiles via `GET /api/v1/icp/list`.

**If ICPs exist:** note the available ICPs and continue to Step 1.

**If no ICPs exist:**

```
You don't have an ICP profile yet. A quick one will make results much sharper —
it filters by company size, location, and the roles you're targeting.

1. **Quick setup** (recommended) — takes 30 seconds
2. **Skip** — auto-create a broad fallback ICP and continue
```

If quick setup → collect ICP name, target roles, company size, and location. Create via `POST /api/v1/icp/create`.

If skip → auto-create a broad fallback ICP:

```json
{
  "name": "Broad Default ICP",
  "target_roles": ["Any"],
  "employee_ranges": ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"],
  "location": ["Any"]
}
```

Call `POST /api/v1/icp/create`, then tell the user:

```
I created a default ICP profile: **{name}** (ID: {id})

This keeps things running. For sharper results, set up a proper ICP segment
with your target roles, company size, and location using the `advanced-account-setup` skill.
```

Continue to Step 1.

---

### 1. Resolve the company

User provides a name or domain → `POST /api/v1/account/search-by-name-or-domain { query }`.

| Result | Action |
|--------|--------|
| Single match | Proceed with the account ID |
| Multiple matches | Present options — ask user to pick |
| No matches | Ask for exact domain, offer deep enrichment |

### 2. Company card

`POST /api/v2/account/batch { account_ids: [id] }` → present a short summary:

```
## {company_name}

{traits.description — 1-2 sentences max}

| | |
|---|---|
| Employees | {employee_count} |
| HQ | {location} |
| Industry | {industry} |
| Signals | {signal_count} detected |
```

That's it for now. Don't dump everything.

### 3. Team coverage check

Count how many hiring signals have `extracted_team_name` populated. This determines the next step.

**If teams are found (≥ 1 unique team):**

```
We found {X} teams at {company_name} with signals related to your space:

{list team names}

Would you like to:
1. See the team breakdown — who's on each team, what signals they have
2. Run deep enrichment — find more teams and people (takes 15-30 min, uses credits)
3. Jump to the full research brief
```

Recommendation logic: If teams exist, recommend seeing the breakdown first. If team count is low (1-2) for a very large enterprise, mention that deep enrichment could uncover more teams.

**If no teams found but signals exist:**

```
{company_name} has {X} hiring signals but the data doesn't have team mapping yet.
This means we can see the job posts but can't tell which team they belong to.

Deep enrichment will fix this — it re-processes existing signals to extract team names
and finds new people mapped to specific teams. Takes 15-30 min, uses credits.

Would you like to:
1. Run deep enrichment (recommended) ⚡ *uses credits from your plan*
2. View the signals anyway without team grouping
```

**If no signals at all:**

```
{company_name} doesn't have signal coverage yet.

Deep enrichment will scan for hiring posts, social activity, and team-mapped contacts.
Takes 15-30 min.

Would you like to:
1. Run deep enrichment (recommended) ⚡ *uses credits from your plan*
2. Exit
```

Wait for user input.

### 4. Deep enrichment (if chosen)

**IMPORTANT: Chat experience rule.** Present the entire configuration block below as a single message. Do NOT make API calls (like fetching ICP lists) in the middle of presenting options. All options and explanations must be rendered in one clean block. API calls only happen AFTER the user responds.

**Configuration — present as one block:**

```
Deep enrichment works best when it knows what to look for:

1. **Goal** — What does your company do? What pain-point do you solve?
   (e.g., "We help companies build and deploy AI voice agents")
   Default: general enrichment with no product-specific focus

2. **Target roles** — Specific roles to find (e.g., "VP Engineering", "Head of AI")
   Default: all ICP-relevant roles

3. **ICP Profile** — If you have a saved ICP profile name/ID
   Default: your first ICP profile

Set any of these, or "none" for defaults.
```

Wait for user input. For each one they want to set, collect the value. If the user provides an ICP name instead of an ID, look it up via `GET /api/v1/icp/list` to resolve the ID.

Then call `POST /api/v1/enrich/deep-enrich` with:
- `domain` — from step 1 (already known, do NOT ask for it)
- `goal` — user's input or default
- `target_icp_roles` — user's input or default
- `icp_id` — user's input or default
- `timeframe` — 90
- `max_jobs_to_check` — 200

**Monitoring — present after triggering:**

```
Deep enrichment running for {domain}. Typically 15-30 minutes.

1. **I'll monitor and notify you** when it's done (recommended)
2. **Check back later** — just ask me anytime
```

**If user picks monitoring:**

Poll in the background:
- Re-fetch `POST /api/v2/account/batch { account_ids: [id] }` every 3 minutes
- Compare people count to pre-enrichment count
- After 2 consecutive polls where count stabilized and differs from initial → done
- Timeout after 45 minutes

When done, notify:

```
Deep enrichment complete for {domain}.
- Before: {initial} signal-mapped people
- After: {final} signal-mapped people

Want to see the updated team view?
```

If timed out with changes:
```
Deep enrichment for {domain} is still processing after 45 minutes but data has started coming in.
- Before: {initial} signal-mapped people
- After: {final} signal-mapped people (may still increase)

Want to see what's available so far?
```

If timed out with no changes:
```
Deep enrichment for {domain} has been running for 45 minutes with no new data yet.
It may still be processing — check back later.
```

**If user picks check back later:**

```
Got it. Deep enrichment is processing for {domain}. Just ask me to check on {company_name} anytime.
```

**After enrichment (or when user checks back):**

Re-fetch `POST /api/v2/account/batch { account_ids: [id] }`, go back to step 3 to re-assess team coverage with updated data. Present before/after comparison.

### 5. Team-first view

This is the core output. Every signal lives under a team. Every person is either confirmed or estimated.

**Grouping logic:**

1. Group hiring signals by `extracted_team_name` — each unique name is a team
2. Signals with no team name (`None`, `No team extracted`) each become their own bucket: "Unknown Team 1", "Unknown Team 2", etc. — we can't assume two unassigned signals are from the same team
3. Social and engagement signals: attach to a named team if `extracted_team_name` matches, otherwise their own unknown bucket

**People classification:**

For each person in a signal's `people[]` array:
- **Perfect team match** — `person_team_name` confirms the team (exact or close match to `extracted_team_name`)
- **Estimated match** — `person_team_name` is null or doesn't match; they're associated with the signal but not confirmed on the team. Could be on a different team entirely.

Present the team map as a summary first:

```
### Teams at {company_name}

| Team | Signals | People (perfect team match) | People (estimated match) |
|------|---------|----------------|--------------------|
| Service Engineering | 35 | 1 | 10 |
| Conversational Design | 11 | 0 | 0 |
| Generative AI | 8 | 2 | 0 |
| ... | | | |
| Unknown Team 1 | 1 | 0 | 0 |
| Unknown Team 2 | 1 | 0 | 0 |
| ... | | | |
| **People without any team** | — | — | {icp_people_count} |

Which team would you like to drill into?

→ I'd recommend starting with **{team with most matched people or most signals}** —
  they have the strongest data.
```

### 6. Team drill-down

For the selected team, present:

**Team name + people:**

```
#### {team_name}

**People:**
| Name | Role | Status | LinkedIn | Email |
|------|------|--------|----------|-------|
| Josh Nash | Director, TPM, Chief of Staff | ✓ Perfect team match | {url} | {email} |
| Rajiv Jivan | Director of Engineering | ~ Estimated match | {url} | — |
| ... | | | | |
```

**Signals under this team:**

```
**{job_title}** — posted {date}
> {context}
> Source: {source_url}

**{next signal}** — posted {date}
> ...
```

For unknown teams, present the same way but with the signal as the identifier:

```
#### Unknown Team 1

**Signal:** Senior Machine Learning Engineer — posted 2026-03-26
> {context}
> Source: {source_url}

**People:** none
```

**Then ask with a recommendation:**

If people data is strong for this team:
```
Would you like to:
1. See another team
2. Generate the full research brief (recommended)
3. Run deep enrichment for more coverage (uses credits)
```

If people data is thin (few or no contacts for this team):
```
Would you like to:
1. Run deep enrichment (recommended — we have signals but not enough people to identify the right leader) ⚡ *uses credits from your plan*
2. See another team
3. Generate the research brief with what we have
```

### 7. Research brief

When requested, synthesize per team:

```
## {company_name} — {pain_point} Research

### {team_name_1}

**People:**
| Name | Role | Status | LinkedIn | Email |
|------|------|--------|----------|-------|
| {name} | {role} | ✓ Perfect team match / ~ Estimated match | {url} | {email} |

**Signals:**
- {signal type}: {one-line summary} — {date} — {source_url}

**Buying window:** {new leader / hiring surge / active evaluation — only if data supports it}

### {team_name_2}
...

### Unknown Teams
{Each unknown team bucket with its signal and any people}

### ICP Contacts (not connected to any signal or team)
{List icp_people separately.
"These contacts match your ICP criteria at {company_name} but aren't connected
to a specific team or signal."}

### Gaps
{What's missing — teams with no people, signals with no team extraction, etc.}
```

Every claim cites a specific signal. If data is missing, say it's missing.

---

## How the data works

For the agent's understanding — don't explain this to the user unless they ask.

**V2 batch response structure:**

`hiring` signals have `extracted_team_name` — this is the primary team mapping field. Each signal also has `people[]` with `person_team_name` (sometimes more specific sub-teams).

`socials` signals have `poster_person` (the exec who posted) and sometimes `extracted_team_name`. Team extraction is weaker on social signals.

`linkedin_engagement` signals show people at the account engaging with competitor/vendor content.

`icp_people` are contacts matching ICP role criteria but NOT connected to any signal or team. They exist because enterprises are large — many people match ICP filters but have no signal context. For a 30,000-person company, these lack the specificity needed for targeted outreach. Always present signal-mapped people first. List `icp_people` separately and note they aren't connected to a specific team.

**When team names are missing:**

`extracted_team_name` can be null on older enrichments. Deep enrichment re-processes existing signals to extract teams AND discovers new signals/people with team mapping. Existing `icp_people` won't be retroactively mapped to teams, but new people from signals will be.

**Deep enrichment always helps** — even with good team coverage, it can find more teams, more people, and fresher signals.

---
name: enrich-and-research
description: Look up a company, enrich it with people and signals, and get an attack strategy
---

# Enrich & Research Account Skill

End-to-end workflow for researching a specific company: resolve it, check data coverage, enrich if needed, and produce an actionable attack strategy.

## CRITICAL: Agent Behavior Rules

This skill handles mission-critical GTM data. Bad data = bad outreach = burned relationships. The agent executing this skill MUST follow these rules strictly:

1. **NEVER fabricate or hallucinate data.** If a field is null, empty, or missing — say it's missing. Do not guess, infer, or fill in the blanks. No "probably", no "likely", no "this suggests".
2. **NEVER add unsolicited recommendations or ideas.** Do not suggest next steps, tools, strategies, or creative interpretations unless the user explicitly asks. You are an executor, not an advisor.
3. **Present exactly what the API returns.** No embellishment, no paraphrasing that changes meaning, no rounding numbers, no adding context that wasn't in the response.
4. **If data is missing, say it's missing.** Do not work around gaps or compensate with inference. Flag the gap clearly and let the user decide what to do.
5. **Wait for user input at every decision point.** Do not auto-proceed, do not assume what the user wants. Present the options, then stop.
6. **The user will tell you what to do.** Your job is to execute the workflow and present data cleanly. If the user wants analysis, ideas, or recommendations — they will ask.

**The only exception** is Step 5 (Attack Strategy), which is an explicitly requested synthesis. Even there, every claim must cite a specific data point from the API response.

7. **Keep everything in the chat.** Do NOT use UI pop-ups, modal dialogs, or interactive question widgets (e.g. AskUserQuestion). All options, prompts, and confirmations must be presented as plain text in the conversation. The user will reply naturally.

## Workflow

### 0. Agent Auth Check

Before anything, check that `.env` contains `OPENFUNNEL_API_KEY` and `OPENFUNNEL_USER_ID`.

**If both exist:** skip to Step 1.

**If either is missing:**

```
### Welcome to OpenFunnel

OpenFunnel enriches and researches accounts — signals, contacts, and attack strategies for any company.

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
| Single match | Proceed to step 2 with the account ID |
| Multiple matches (`needs_clarification`) | Present options — ask user to pick |
| No matches | Ask user for exact domain, then offer deep enrich (see step 3a) |

### 2. Present the Company Card

`POST /api/v2/account/batch { account_ids: [id] }` → full details with inline signal content + ICP people.

Present a clean summary so the user can see what we know at a glance:

```
## {company_name}

**Domain:** {domain}
**Industry:** {industry} | **Employees:** {employee_count} | **Stage:** {funding_stage}
**HQ:** {location}
**What they do:** {traits.description}

---

### What We Know

| Data           | Coverage                          |
|----------------|-----------------------------------|
| Signals        | {signal_count} detected           |
| Contacts       | {icp_people_count} ICP people     |
| Hiring signals | {hiring_count} postings tracked   |
| Social signals | {social_count} posts tracked      |
| Engagement     | {engagement_count} interactions   |
| Job changes    | {job_change_count} detected       |
| CRM status     | {crm_status}                      |
```

This gives the user a feel for the account before they decide what to do next.

### 3. Explore — What would you like to do?

After the company card, present the user with clear options. Don't just dump data — let them navigate.

#### Option menu

Present this as a conversational prompt:

```
### What would you like to do?

1. **View signals in detail** — See the full hiring posts, social activity, and engagement signals we've detected
2. **View key contacts** — See the {people_count} ICP people we've identified and their roles
3. **Run deep enrichment** — Discover more contacts, fresher signals, and deeper coverage
   ⚡ *Powered by OpenFunnel Deep Enrichment — consumes credits from your plan*
4. **Generate attack strategy** — Get a full account attack plan based on current data
5. **I'm good for now** — Exit
```

The agent MUST present these options and wait for user input. Do NOT auto-proceed to the attack strategy.

#### If user picks 1 — Signal Detail View

For each signal type that has data, present it clearly:

**Hiring signals:**
```
#### Hiring: {signal_name}
- **Role:** {job_title}
- **Posted:** {job_posted_at} | **Detected:** {detected_by_openfunnel_at}
- **Team:** {extracted_team_name}
- **Why it matters:** {context}
- **Source:** {source_url}
```

**Social signals:**
```
#### Social: {signal_name}
- **Platform:** {platform} | **Posted:** {posted_at}
- **Content:** {post_content} (truncated if long)
- **Why it matters:** {context}
```

**Engagement / Job changes:** Similar format — date, person, context.

After showing signals, return to the option menu.

#### If user picks 2 — Key Contacts View

```
#### Key Contacts at {company_name}

| # | Name | Role | Location | LinkedIn | CRM Status |
|---|------|------|----------|----------|------------|
| 1 | {name} | {role} | {location} | [Profile]({linkedin_url}) | {crm_status} |
| ... | ... | ... | ... | ... | ... |
```

If any contacts have direct signals attached (posts, job changes, engagement), call those out:
```
> **{person_name}** also has direct signals — {brief description of signal activity}
```

After showing contacts, return to the option menu.

#### If user picks 3 — Deep Enrichment

This is the enrichment decision tree. Present the recommendation based on current state:

**3a. Account not found in DB:**

The company wasn't resolved in Step 1. Ask the user for the exact domain (e.g., "What's their domain?"), then call `POST /api/v1/enrich/deep-enrich { domain }` (clean the domain first — strip protocol and www prefix).

> This company isn't in OpenFunnel yet. Deep enrichment will add it — discovering the company profile, buying signals, and key contacts.
>
> **What Deep Enrichment does:**
> - Scans job postings, social activity, and engagement signals
> - Identifies ICP-relevant contacts with roles and context
> - Typically completes in 15-30 minutes
>
> ⚡ **Credit cost:** This consumes credits from your plan.
>
> **Want to proceed?** (yes / no)

**3b. Account exists, no people:**
> We have **{company_name}** in the database with {signal_count} signals, but no contacts have been enriched yet. Deep enrichment will find the most receptive people at this account.
>
> **What you'll get:**
> - ICP-relevant contacts with titles, LinkedIn profiles, and context
> - Refreshed signal data
>
> ⚡ **Credit cost:** This consumes credits from your plan.
>
> **Want to proceed?** (yes / no)

**3c. Account exists, has people:**
> **{company_name}** already has {people_count} contacts and {signal_count} signals. Deep enrichment can improve this — more contacts, fresher signals, better coverage.
>
> **What you'll get:**
> - Additional contacts beyond the current {people_count}
> - Updated signal detection (catches anything new since last enrichment)
>
> ⚡ **Credit cost:** This consumes credits from your plan.
>
> **Want to proceed?** (yes / no)

If yes → before triggering, present the enrichment configuration. The domain is already known from Step 1 — do NOT ask for it.

**IMPORTANT: Chat experience rule.** Present the entire configuration block below as a single message. Do NOT make API calls (like fetching ICP lists) in the middle of presenting options — it breaks the conversation flow. All options and explanations must be rendered in one clean block. API calls only happen AFTER the user responds.

> **Enrichment configuration for {domain}:**
>
> Deep enrichment works best when it knows what to look for. Here are three options you can configure:
>
> 1. **Goal** — Describe what your company does and what pain-point it solves for potential customers. This focuses the enrichment on finding people who are experiencing problems your product addresses.
>    - Example: "We provide an observability platform that helps engineering teams debug production incidents faster. We solve the pain of slow MTTR and alert fatigue."
>    - Default: general enrichment with no product-specific focus
>
> 2. **ICP Profile** — Which ICP profile to qualify contacts against. If you know the name or ID of one of your saved ICP profiles, provide it here.
>    - Default: your first ICP profile
>
> 3. **Target Roles** — Specific roles to prioritize finding (e.g., "VP Engineering", "CTO", "Head of Security"). Comma-separated.
>    - Default: all ICP-relevant roles
>
> **Which of these would you like to set?** (or "none" to use defaults for all)

Wait for user input. For each one they want to set, collect the value. If the user provides an ICP name instead of an ID, look it up via `GET /api/v1/icp/list` to resolve the ID. Then call `POST /api/v1/enrich/deep-enrich` with:
- `domain` — from Step 1 (already known, do NOT ask for it)
- `goal` — user's input or omit
- `icp_id` — user's input or omit
- `target_icp_roles` — user's input or omit
- `timeframe` — 90 (default)
- `max_jobs_to_check` — 200 (default)

Anything the user didn't set uses the default.

Then present the monitoring choice:

> Deep enrichment is running for **{domain}**. This typically takes 15-30 minutes.
>
> **How would you like to track progress?**
>
> 1. **OpenFunnel Poller** (recommended) — I'll monitor in the background and notify you right here when enrichment is complete. You can keep working in the meantime.
> 2. **Check back manually** — No monitoring. Re-run this skill whenever you'd like to see updated results.

**If user picks OpenFunnel Poller:**

Poll `POST /api/v2/account/batch { account_ids: [id] }` every 3 minutes in the background:
- `id` — from the resolved account
- Record the `peopleCount` before enrichment was triggered as `initialPeopleCount`
- Each poll, check the current people count in the response
- After 2 consecutive unchanged polls where people count differs from `initialPeopleCount` → enrichment is done
- Times out after 45 minutes

When polling completes, notify the user:

**If done (data changed and stabilized):**
> Deep enrichment complete for **{domain}**.
> - **Before:** {initialPeopleCount} contacts
> - **After:** {finalPeopleCount} contacts
>
> Want to view the updated data?

**If timed out with changes:**
> Deep enrichment for **{domain}** is still processing after 45 minutes but data has started coming in.
> - **Before:** {initialPeopleCount} contacts
> - **After:** {finalPeopleCount} contacts (may still increase)
>
> Want to view what's available so far?

**If timed out with no changes:**
> Deep enrichment for **{domain}** has been running for 45 minutes with no new data yet. It may still be processing — check back later by re-running this skill.

**If user picks Check back manually:**

> Got it. Deep enrichment is processing for **{domain}**. Re-run this skill anytime to see updated results.

Return to option menu.

If no (user declines enrichment) → return to option menu.

#### If user picks 4 — Attack Strategy

Proceed to step 5.

### 4. Post-enrichment refresh

After enrichment completes (or user returns manually):
- Re-fetch `POST /api/v2/account/batch { account_ids: [id] }` for updated data
- Re-present the company card with updated numbers
- Return to the option menu

### 5. Account attack strategy

Synthesize all available data into an actionable attack strategy using the prompt template below.

---

## Account Attack Strategy Prompt

Use this prompt template with the V2 account data to generate the strategy:

```
You are a GTM strategist. Given the following account data, produce an Account Attack Strategy.

## Account Data
{insert full V2 account JSON here}

## Instructions

Produce the following sections:

### 1. Company Snapshot
- Name, domain, industry, employee count, funding stage
- One-line description of what they do

### 2. Pain Points & Buying Signals
- List each detected signal (hiring, social, engagement, job changes) with dates
- Interpret what each signal means for buying intent
- Identify the top 1-3 pain points these signals reveal

### 3. Key People to Target
For each person, include:
- Name, title, department
- Why they matter (decision-maker / champion / influencer / end-user)
- Any direct signals attached to them (posts, job changes, engagement)

Prioritize by: decision-making power × signal recency × role relevance

### 4. Timing & Urgency
- What is the buying window? (e.g., actively hiring for X = building a team = budget allocated)
- How fresh are the signals? Flag anything older than 30 days as potentially stale.
- Recommend: act now / monitor / wait for trigger

### 5. Recommended Outreach Sequence
- Who to contact first, second, third
- What to reference in each outreach (specific signal + pain point)
- Suggested channel (email / LinkedIn / warm intro)

Keep the strategy concise and actionable. Every recommendation must tie back to a specific signal or data point.
```

## API Reference

**Base URL:** `https://api.openfunnel.dev`

**Required headers (all requests):**

| Header | Value |
|--------|-------|
| `X-API-Key` | Your OpenFunnel API key (from `.env` → `OPENFUNNEL_API_KEY`) |
| `X-User-ID` | Your OpenFunnel user ID (from `.env` → `OPENFUNNEL_USER_ID`) |
| `Content-Type` | `application/json` |

**Endpoints used by this skill:**

### Agent Sign Up
- **Method:** `POST`
- **Path:** `/api/v1/agent/sign-up`
- **Body:** `{ "email": "<user_email>" }`
- **Response:** `{ email, message }`

### Agent Verify
- **Method:** `POST`
- **Path:** `/api/v1/agent/verify`
- **Body:** `{ "email": "<user_email>", "otp_code": "<6_digit_code>" }`
- **Response:** `{ email, api_key, is_new_user }`

### 1. Search by name or domain

- **Method:** `POST`
- **Path:** `/api/v1/account/search-by-name-or-domain`
- **Body:** `{ "query": "<company name or domain>", "limit": <number> }`
- **Response:** Array of account matches. If multiple results, the response includes `needs_clarification: true`.

### 2. Get accounts (batch)

- **Method:** `POST`
- **Path:** `/api/v2/account/batch`
- **Body:** `{ "account_ids": ["<id>"], "account_domains": [], "icp_people_page": 1, "icp_people_page_size": 25 }`
- **Response:** Full account details including traits, signals (hiring, social, engagement, job changes), ICP people with roles and LinkedIn profiles, and enrichment state.

### 3. List ICP profiles

- **Method:** `GET`
- **Path:** `/api/v1/icp/list`
- **Body:** None
- **Response:** Array of ICP profiles with `id` and `name`.

### 4. Trigger deep enrichment

- **Method:** `POST`
- **Path:** `/api/v1/enrich/deep-enrich`
- **Body:** `{ "domain": "<domain>", "goal": "<optional goal string>", "icp_id": "<optional ICP ID>", "target_icp_roles": ["<optional roles>"], "timeframe": "<optional>", "max_jobs_to_check": <optional number> }`
- **Response:** Confirmation that enrichment has been queued. The domain should be cleaned before sending (strip protocol and www prefix).

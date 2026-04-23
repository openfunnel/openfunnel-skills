---
name: find-lookalike-companies
description: Given a natural-language description of the kind of company you want (a trait), find up to 100 lookalike companies — optionally narrowed by employee count, funding stage, or HQ country. Use for TAM mapping, ICP expansion, and building cold seed lists. The opposite of check-pain-and-fit (which takes known domains and filters them); this takes a description and produces domains.
---

# Find Lookalike Companies

Turn a natural-language description of the kind of company you want ("Healthcare companies building with voice AI", "Mid-market B2B SaaS doing customer support automation") into a concrete list of matching companies with domain, LinkedIn, HQ, and size.

This is a **synchronous trait search**, not a signal/pain-point search. It answers *"what companies fit this description?"* without any timing or buying-signal lens.

## When to Use This Skill

- **TAM mapping:** "All B2B SaaS companies building voice AI in healthcare"
- **ICP expansion:** "Find me 50 companies that look like my best customer (description)"
- **Cold seed list:** "Give me 100 series-B developer-tools companies in the US"
- **Competitive landscape:** "Companies offering customer support software for B2C"
- **Expanding a TAQ signal's reach:** start from a trait, then layer activity later

**Not the right skill for:** filtering known domains (use `check-pain-and-fit`), discovering companies with an *active buying signal* (use `spot-companies-*` or `find-icp-companies-with-active-pain-points-and-the-people-involved`), or researching one specific company (use `enrich-and-research`).

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. The verification code is collected via stdin directly from the user — the agent never sees, handles, or logs the code.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally.

Resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/find-lookalike-companies/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## Agent Rules

1. **NEVER rewrite or reframe the user's query.** Use their exact wording in the `query` parameter. If the query is too vague (e.g., "good companies"), ask for a sharper description — do not invent details.
2. **Present what the API returns.** No fabrication, no inference, no "probably based in X" if the response doesn't say so.
3. **Flag query-length issues early.** The API enforces 1–200 characters on `query`. If the user's input exceeds 200 chars, ask them to tighten it before making the call.
4. **Never invent filters.** If the user didn't specify employee range / funding stage / location, pass none — don't assume.
5. **Never output or log API credentials.** All authenticated calls go through `api.sh`.

---

## Workflow

### 0. Agent Auth Check

Test credentials:

```bash
bash "$API" POST /api/v1/signal/get-signal-list '{"pagination": {"limit": 1, "offset": 0}}'
```

**If the call succeeds** (returns JSON with `signals`): skip to Step 1.

**If it fails:**

```
### Welcome to OpenFunnel

OpenFunnel turns daily events in your market into pipeline
— using OpenFunnel's Event Intelligence engine.

To get started, I'll authenticate you via the API.

**What's your work email?**
```

Wait for input. Then:

1. `bash "$SIGNUP" start "<user_email>"` — returns `{"status": "verification_code_sent", ...}`
2. Tell the user:
   ```
   I sent a 6-digit verification code to **{email}**. The next command will ask you to enter it directly.
   ```
3. `bash "$SIGNUP" verify "<user_email>"` — script prompts for code via stdin. On success: `{"status": "authenticated", ...}`. Credentials written to `.env`; `.gitignore` updated.
4. Re-run the auth check. If pass, continue to Step 1. If fail, ask to retry (up to 10 attempts in 24h).

---

### 1. Collect the inputs

**Required:**
- **Query** — a natural-language description, 1–200 chars. User's exact wording goes in.
   - Good: "Mid-market B2B SaaS companies building voice AI for healthcare", "Series-B developer tools companies selling to engineering teams"
   - Too vague: "good companies", "fintech", "AI"

**Optional — only if user specifies:**
- **Limit** — default 10, max 100. Ask if the user wants a specific count; otherwise suggest 25 as a reasonable default.
- **Employee range** — `min_employees` / `max_employees` (integers, ≥ 0)
- **Funding stages** — one or more of: `Pre-Seed, Seed, Series A, Series B, Series C, Series D, Series E, Series F, Series G, Series H, Acquired, Private, Public`
- **Locations** — HQ country as lowercase ISO codes (e.g. `us`, `gb`, `ca`, `de`, `in`, `sg`, `au`). Supported codes are listed in the docs; if the user names a country, map to the code.

If the query exceeds 200 chars, ask them to tighten it.

Before running, echo what you're about to send:

```
I'll search for lookalike companies matching:

**Query:** "{query}"
**Limit:** {limit}
{if any filters}
**Filters:**
- Employees: {min_employees or "any"} to {max_employees or "any"}
- Funding stages: {funding_stages or "any"}
- Locations: {locations or "any"}
{endif}

Runs synchronously, ~2-5s. Proceed? (yes / no)
```

Wait for confirmation.

---

### 2. Run the search

Build the URL with query parameters. Every optional parameter is either repeated for arrays or omitted entirely.

```bash
# Examples:
bash "$API" GET "/api/v1/account/search-lookalikes?query=<urlencoded>&limit=25"
bash "$API" GET "/api/v1/account/search-lookalikes?query=<urlencoded>&limit=50&min_employees=50&max_employees=500&funding_stages=Series%20A&funding_stages=Series%20B&locations=us&locations=gb"
```

**URL-encode the `query` value** (spaces → `%20`, `&` → `%26`, etc.). For repeat-param arrays like `funding_stages=Series%20A&funding_stages=Series%20B`, build them manually — don't try to comma-join.

The easiest reliable way from bash is to use `python3 -c "import urllib.parse;print(urllib.parse.urlencode([('query',...), ('limit',25), ('funding_stages','Series A'), ('funding_stages','Series B')]))"` to construct the query string, then append it to the URL.

---

### 3. Render the results

Response shape:

```json
{
  "query": "echoed back",
  "results": [
    {
      "name": "...",
      "domain": "...",
      "linkedin_url": "...",
      "headquarters": "...",
      "company_size": "..."
    }
  ],
  "total": 25
}
```

**Render a clean table.** Make `domain` and `linkedin_url` clickable markdown links.

```
## Lookalikes for: "{query}"

**{total} companies** · Filters applied: {human summary of filters or "none"}

| # | Name | Domain | HQ | Size | LinkedIn |
|---|------|--------|----|----|----------|
| 1 | {name} | [{domain}]({domain as https link}) | {headquarters} | {company_size} | [Profile]({linkedin_url}) |
| ... | ... | ... | ... | ... | ... |
```

If `total == 0`, don't render an empty table — say the search returned nothing and suggest:
- Loosen filters (remove funding stage or country)
- Broaden the query (e.g., drop a qualifier: "voice AI healthcare" → "voice AI")
- Increase the limit if it was set low

If `total == limit`, note: *"Hit the limit — there may be more matches. Re-run with a higher `limit` (max 100) if you want to see more."*

---

### 4. Next steps

After the results, suggest:

```
Want to:
1. **Enrich these accounts with contacts and emails** — pipe the domains into `enrich-accounts-with-contacts-and-emails` to get the right people + work emails
2. **Re-run with tighter filters** — narrow by employee count, funding stage, or location
3. **Re-run with a different query** — try a variant phrasing
4. **Done**
```

Option 1 is the natural follow-up: the trait search gives you the *who*, enrichment gives you the *how to reach them*.

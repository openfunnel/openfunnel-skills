---
name: check-pain-and-fit
description: Given a company domain (or a small list), check whether it has an active pain-point (inferred from job posts) and/or is the right fit (inferred from people data). Supports three modes — activity + qualifier, activity only, or qualifier only — so the user can ask "do they have the pain?", "are they the right shape?", or both at once.
---

# Check Pain & Fit

Given a company domain, does it have the **active pain-point** your product solves, and is it the **right shape of company** to adopt your tool?

This skill answers either or both questions in one pass by streaming results from OpenFunnel's `/discover/stream` endpoint.

## The two checks

- **Activity check** — is there live evidence they have this pain-point? Inferred from their current job posts.
- **Qualifier check** — are they the right fit? Inferred from their people (department mix, seniority, titles, headcount).

## The three modes

At least one of `activity` or `qualifier` must be provided. Both is the strictest filter.

| Mode | Payload | When to use |
|------|---------|-------------|
| **Both** | `activity` + `qualifier` | "Are they hiring SDRs AND already have 2+ AEs?" — pain + fit gate |
| **Activity only** | `activity` only | "Are they hiring SDRs?" — pure pain-point check |
| **Qualifier only** | `qualifier` only | "Do they have 2+ SDRs?" — pure fit check against their current team |

Pipeline stages fire conditionally: if `activity` is omitted, stage 1 is skipped and the stream goes domains → qualifier → summary. If `qualifier` is omitted, stage 2 is skipped and the stream goes domains → activity → summary.

## When to Use This Skill

**Single domain (default path):**
- "Is Labelbox hiring SDRs and do they already have a sales team?" → both
- "Does Ramp have a growth team?" → qualifier only
- "Is Vercel hiring for AI guardrails?" → activity only

**Bulk list (only if user hands over multiple domains):**
- "I have these 10 domains — which are hiring data engineers and have a VP Data?"
- "Of these target accounts, filter to ones with a DevOps team"

**Not the right skill for:** discovering new companies (use `spot-companies-hiring-to-solve-specific-problems` or `find-icp-companies-with-active-pain-points-and-the-people-involved`), deep-researching one company (use `enrich-and-research`), or scoring on a 0-100 scale (use `account-scoring`).

## API Calls

This skill bundles two scripts in the same directory as this SKILL.md file. **Never read or reference API credentials directly.**

- `signup.sh` — handles authentication. Writes credentials to `.env` internally. The verification code is collected via stdin directly from the user — the agent never sees, handles, or logs the code.
- `api.sh` — handles all authenticated API calls. Reads credentials from `.env` internally. Uses `curl -N` so SSE streams emit events live.

Resolve the script paths relative to this file's location:

```bash
SKILL_DIR="$(dirname "$(find ~/.agents/skills -name SKILL.md -path "*/check-pain-and-fit/*" 2>/dev/null | head -1)")"
API="$SKILL_DIR/api.sh"
SIGNUP="$SKILL_DIR/signup.sh"
```

Then use `$SIGNUP` for auth and `$API` for all other calls.

## Agent Rules

1. **NEVER rewrite or reframe the user's activity or qualifier prompts.** Use the user's exact wording in `activity.goal` and `qualifier.question`. If the prompt is too vague (e.g., "is a good fit"), ask them to be specific — do not fill in details yourself.
2. **Present what the API returns.** `qualified: true` means qualified. `qualified: false` means not qualified. Do not soften, editorialize, or add "probably" / "likely".
3. **Flag unresolved domains.** If the API can't resolve a domain, say so — don't silently drop it.
4. **Evidence over inference.** Every pass/fail verdict must cite the API's own reasoning — `relevant_jobs` for activity, `matched_people` + `reasoning` for qualifier.
5. **Don't invent the missing input.** If the user only gives a qualifier, run qualifier-only. If they only give an activity, run activity-only. Do not fabricate the other side to "complete" the payload.
6. **Never output or log API credentials.** All authenticated calls go through `api.sh`.

---

## Workflow

### 0. Agent Auth Check

Test if credentials are working:

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

1. `bash "$SIGNUP" start "<user_email>"` — returns `{"status": "verification_code_sent", ...}` on success
2. Tell the user:
   ```
   I sent a 6-digit verification code to **{email}**. The next command will ask you to enter it directly.
   ```
3. `bash "$SIGNUP" verify "<user_email>"` — the script prompts the user for the code via stdin. On success returns `{"status": "authenticated", ...}`. Credentials land in `.env` and `.gitignore` is updated.
4. Re-run the auth check. If it passes, continue to Step 1. If verify failed, tell the user the code was invalid or expired (up to 10 attempts in 24 hours) and offer to retry or resend.

---

### 1. Collect the inputs

**Required:** domain(s).
**Optional but at least one required:** activity, qualifier.

1. **Domain(s)** — default is **one domain**. Ask:
   ```
   Which domain should I check? (Or paste a short list if you want to check several at once.)
   ```
   - Accept any format (bare domain, URL, with/without `www`) — strip to bare domain before sending.
   - Upper bound: ~50 per call. If they paste more, ask them to split.
2. **Activity** — what pain-point to look for in job posts. User's exact wording goes into `activity.goal`.
   - Good: "hiring enterprise account executives", "migrating from Heroku to AWS", "building their first data engineering team"
   - Too vague: "hiring", "growing", "scaling"
3. **Qualifier** — the fit check, phrased as a question about their people. User's exact wording goes into `qualifier.question`.
   - Good: "Has at least 10 sales reps", "Has a VP of Data or Head of Data", "Has more than 5 ML engineers"
   - Too vague: "Is a good fit", "Is mature enough"

If the user gives only one of the two, **run that mode** — do not prompt for the other unless they ask. If they give neither, ask: *"Do you want to check for a pain-point (activity), a team/fit signal (qualifier), or both?"*

If any given prompt is too vague, ask them to sharpen it. Do not invent one.

Before running, echo back what you're about to send:

```
I'll check **{domain}** (or {N} domains) using:
{if activity}- **Pain-point (activity):** {goal}{endif}
{if qualifier}- **Fit (qualifier):** {question}{endif}

Typical runtime: ~15-30s qualifier-only · ~30-60s activity-only · ~60-90s both (per domain).

Proceed? (yes / no)
```

Wait for confirmation.

---

### 2. Run the stream

Build the request body. **Omit** any key the user didn't provide — do not send empty strings or nulls.

```json
{
  "domains": ["<domain1>", "<domain2>", ...],
  "activity": {"goal": "<user's exact activity wording>"},
  "qualifier": {"question": "<user's exact qualifier wording>"}
}
```

Call:

```bash
bash "$API" POST /api/v1/discover/stream '<json_body>'
```

Output is **Server-Sent Events** (SSE). Each event is an `event: <name>` line followed by a `data: <json>` line, separated by blank lines. Lines starting with `:` are keepalive pings — ignore them.

**Events (each is conditional on its inputs):**

| Event | Always fires? | Fields |
|-------|---------------|--------|
| `domains_resolved` | Yes | `count`, `unresolved[]`, `companies[]` (preferred_name, primary_domain, linkedin_slug) |
| `activity_results` | Only if `activity` was sent | `total`, `passed`, `results[]` each with `qualified`, `jobs_searched`, `jobs_relevant`, `relevant_jobs[]` (title + reason) |
| `qualifier_results` | Only if `qualifier` was sent AND at least 1 company passed activity (or activity was omitted) | `pre_filter` (departments, seniorities, reasoning), `results[]` each with `qualified`, `reasoning`, `summary`, `people_found`, `matched_people[]` |
| `summary` | Yes | Fully-hydrated `companies[]` for those that passed every stage that ran; `pipeline` string describing the pipeline; `final_count` |
| `done` | Yes | `pipeline` + `total_elapsed_s` |

**Pipeline strings you'll see in `done`:**
- Both: `"N domains → M activity → K qualified"`
- Activity-only: `"N domains → M activity"`
- Qualifier-only: `"N domains → K qualified"`
- Activity ran, nothing passed: `"N trait → 0 activity — no companies passed"` (qualifier auto-skipped)

---

### 3. Render each event as it arrives

Don't wait for the whole stream — present events live so the user sees progress.

**Rendering mode depends on domain count:**
- **1 domain** → skip the tables. Use the detailed single-company format directly.
- **2+ domains** → use tables for `activity_results` / `qualifier_results`, then per-company detail cards only for companies that pass every stage.

**For each event, only render the section if the event fired.** A qualifier-only run has no "Step 2 — Activity" section; don't invent one.

#### On `domains_resolved`

```
#### Step 1 — Domains resolved

Resolved **{count}** domains in {elapsed_s}s.
{if unresolved.length > 0}
⚠️ Could not resolve: {unresolved joined}
{endif}
```

#### On `activity_results`

```
#### Step 2 — Pain-point check (from job posts)

**{passed} / {total}** passed in {elapsed_s}s.
```

- **1 domain:** render prose — `{preferred_name}: {PASS|FAIL} — {jobs_relevant}/{jobs_searched} relevant jobs`, then 2-3 relevant jobs with titles + reasons.
- **2+ domains:** table with columns `Company | Verdict | Jobs searched | Jobs relevant`. For passed companies, list 2-3 relevant jobs under the table.

If `jobs_searched == 0` for a company, flag it: *"No candidate job posts found — this is likely a data coverage issue (company may not have open roles indexed), not a prompt-wording issue."*

#### On `qualifier_results`

```
#### Step 3 — Fit check (from people)

**{passed} / {total}** passed in {elapsed_s}s.

**Pre-filter applied:** {pre_filter.departments joined} · {pre_filter.seniorities joined}
_Reasoning:_ {pre_filter.reasoning}
```

- **1 domain:** prose — `{preferred_name}: {PASS|FAIL} — {people_found} people searched`, then the API's `summary` and `reasoning`, then 3-5 matched people (name, title, seniority, LinkedIn).
- **2+ domains:** table with columns `Company | Verdict | People found | Summary`. For passed companies, list 3-5 matched people under the table.

#### On `summary`

```
#### Final: {final_count} qualified

Pipeline: {pipeline} · {total_elapsed_s}s
```

For each company in `summary.companies[]`:

```
---

### {preferred_name} — PASS ✓

- **Domain:** {primary_domain}
- **Stage:** {stage} · **Employees:** {employee_count_min}{if total_funding} · **Funding:** ${total_funding / 1_000_000}M{endif}

{if relevant_jobs}
**Pain-point evidence ({jobs_relevant}/{jobs_searched} relevant jobs):**
- {relevant_jobs[0].title} — {relevant_jobs[0].reason}
- {relevant_jobs[1].title} — {relevant_jobs[1].reason}
{if relevant_jobs.length > 2}- (+ {remaining} more){endif}
{endif}

{if qualifier_summary}
**Fit evidence:** {qualifier_summary}
_Reasoning:_ {qualifier_reasoning}

**Key people to target ({people_found} total matched):**
| Name | Title | Seniority |
|------|-------|-----------|
| {matched_people[0..4]} |
{endif}
```

Only render the sections whose data is present. A qualifier-only run has no pain-point evidence section; an activity-only run has no fit evidence section.

#### On `done`

Say the run is finished and how long it took.

**If `final_count == 0`**, diagnose the stage that filtered everything out:
- Pipeline ended at activity with 0 passed → *"All domains failed the pain-point check. Try loosening the activity prompt, or swap the domains — some companies may not have relevant job posts indexed."*
- Pipeline ended at qualifier with 0 passed → *"All domains failed the fit check. The activity step passed, so these companies likely have the pain but not the team shape you're looking for."*

---

### 4. Next steps

After the final set, ask:

```
Want to:
1. **Enrich emails/phones** for the matched people → `enrich-people-with-email-and-phone`
2. **Deep-research one of these accounts** → `enrich-and-research`
3. **Score them 0-100** → `account-scoring`
4. **Re-run with a different activity or qualifier** — stay here
5. **Done**
```

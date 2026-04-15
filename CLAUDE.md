# OpenFunnel

Infer pain-points from live company and people events across your Ideal Customer Profile. Inferred pain-points are leading indicators of buying behavior.

---

## How You Operate

These are opinions and perspectives learned from working with hundreds of GTM teams. They're not rules — they're patterns that keep showing up. Let them inform how you present data, make recommendations, and guide conversations.

- Pain-points are temporal. Searching for pain is searching for timing.
- In enterprise, the team is what matters — not the company. A 30,000-person org has 100+ teams with separate budgets, leaders, and timelines.
- Job posts are modern RFPs — budget is committed, leadership is aligned, they're ready to act.
- A signal without timing is just a trait. Timing is what makes you relevant instead of salesy.
- Always have a recommendation and a reason. Don't just list options.
- Relevance over personalization. Know their pain before you craft the message.
- Evidence over inference. Every claim needs a source.

---

## Distribution

OpenFunnel is distributed as both a skills package and an npm package.

- Prefer `npx skills add openfunnel/openfunnel` for cross-agent skill installs
- `npm install openfunnel` is also supported for npm-based distribution
- Treat `skills/` as the source of truth
- Do not rely on `node_modules/openfunnel` being present

---

## First Run

Before making any API call, check that `.env` contains `OPENFUNNEL_API_KEY` and `OPENFUNNEL_USER_ID`.

If either is missing:
1. Welcome the user to OpenFunnel
2. Ask for their API key and User ID
3. Write both to `.env` in the project root
4. Add `.env` to `.gitignore` if not already there
5. Verify credentials work by calling `POST /signal/get-signal-list`
6. Show available skills — these are what you can do with OpenFunnel

If credentials are present, on first interaction show the available skills so the user knows what's possible. Then route their request.

---

## Routing

Every request falls into one of these patterns. Route accordingly.

```
User Request
  │
  ├─ SPECIFIC COMPANY ("Research Ramp", "What's happening at Vercel right now?")
  │   → Use the `enrich-and-research` skill and follow its workflow
  │
  ├─ PAIN-POINTS ("B2B SaaS companies migrating off Heroku that already have a DevOps team", "Mid-market healthcare companies hiring for their first CISO")
  │   → Use the `find-icp-companies-with-active-pain-points-and-the-people-involved` skill and follow its workflow
  │
  ├─ HIRING SIGNALS ("Companies hiring to implement AI guardrails", "Find companies hiring to migrate from Heroku to AWS")
  │   → Use the `find-companies-hiring-to-solve-specific-problems` skill and follow its workflow
  │
  ├─ SOCIAL SIGNALS ("Companies posting about their Series A", "Find companies posting about attending RSAC")
  │   → Use the `find-companies-posting-about-specific-things` skill and follow its workflow
  │
  ├─ TECH STACK ("Companies using Snowflake", "Find companies running Kubernetes")
  │   → Use the `find-companies-using-specific-tech-stack` skill and follow its workflow
  │
  ├─ FIND PEOPLE ("Find people posting about adding MCP in production", "Who's engaging with our competitor's LinkedIn content")
  │   → Use the `find-people-having-simple-signals` skill and follow its workflow
  │
  ├─ BULK CONTACT ENRICHMENT ("Take this list of domains and get me the best contacts plus emails")
  │   → Use the `enrich-accounts-with-contacts-and-emails` skill and follow its workflow
  │
  ├─ SCORING ("Score these accounts", "Tier my pipeline")
  │   → Use the `account-scoring` or `score-and-tier` skill
  │
  ├─ ENTERPRISE + PAIN ("Which team at Capital One needs agent evals?", "Find who at Adobe is working on AI guardrails")
  │   → Use the `enterprise-account-research` skill
  │
  └─ ADVANCED SETUP ("Set up my ICP", "Connect Salesforce", "Block competitors")
      → Use the `advanced-account-setup` skill and follow its workflow
```

---

## Key Concepts

**Traits** = searchable. Natural language → vector similarity → instant results.

**Activities** = NOT searchable. Detected by live search agents and stored as **signals**. Each signal tracks a specific buying activity and its matched accounts are collected in an **audience** (1:1 mapping).

**Always check existing data first.** Before any search:
1. `POST /signal/get-signal-list` — what signals are active?
2. `POST /audience/get-audience-list` — what audiences exist?
3. `GET /insights/feed` — what fired recently?

Existing data is instant and free. Only search or deploy agents when no signal covers the request.

**Be transparent about gaps.** Return what you can and flag what's missing — which specific discovery agent to deploy, with the exact prompt.

---

## Go Deeper

Read these files only when routed to them by the workflow above.

### Skills
- `find-icp-companies-with-active-pain-points-and-the-people-involved` — Find ICP companies with inferred pain-points from live company and people events, and the people involved
- `find-companies-hiring-to-solve-specific-problems` — Find companies hiring to solve specific problems (daily)
- `find-companies-posting-about-specific-things` — Find companies posting about specific things on socials (daily)
- `find-companies-using-specific-tech-stack` — Find companies using specific tech stack (daily)
- `find-people-having-simple-signals` — Find people posting about topics, changing jobs, or engaging with competitor content
- `enrich-accounts-with-contacts-and-emails` — Turn a list of domains or accounts into relevant contacts with work email coverage
- `enrich-and-research` — Look up a company, enrich it with people and signals, and get an attack strategy
- `enterprise-account-research` — Break into F500 accounts and find which team has the pain, who leads it, and the evidence
- `account-scoring` — Score accounts 0-100 on pain-point relevance with evidence and reasoning
- `score-and-tier` — Score accounts, bucket into tiers, and re-score as new signals come in
- `advanced-account-setup` — Advanced account setup for ICPs, blocklists, and integrations


# OpenFunnel

OpenFunnel is a search for active pain-points and buying windows in your Ideal Customer Profile. It specializes in three things: **ICP + Pain-Points**, **ICP + Buying Windows**, and **ICP + Signals** — starting from a static ICP definition (firmographic + trait fit) and layering dynamic, time-sensitive intelligence on top.

---

## How to Think About Any Request

Every request falls into one of these patterns. Route accordingly.

```
User Request
  │
  ├─ SPECIFIC COMPANY ("Tell me about Acme Corp")
  │   → search-by-name-or-domain → /account/{id}/summary → /account/batch
  │   → Full workflow: skills/account_intelligence.md
  │
  ├─ TRAIT QUERY ("Find AI-native ERP companies", "Series B fintech")
  │   → POST /account/search-by-traits (instant, similarity scored)
  │   → Or POST /account/start-search-job for deeper async results
  │   → Optionally narrow with audience_ids / signal_ids
  │
  ├─ ACTIVITY QUERY ("Companies hiring for Kubernetes", "posting about SOC2")
  │   → Activities are NOT directly searchable
  │   → Check existing signals first (POST /signal/get-signal-list)
  │   → Signal exists? → get its audience for matched accounts + people
  │   → No signal? → Recommend deploying a live search agent
  │
  ├─ TRAIT + ACTIVITY ("Series B SaaS companies hiring for data engineers")
  │   → Multi-step:
  │     1. search-by-traits for the trait part
  │     2. Find the signal tracking the activity (signals map 1:1 to audiences)
  │     3. get-account-list with include_audience_ids to intersect
  │   → If no signal for the activity → partial answer + recommend agent
  │
  └─ PEOPLE ("Find decision-makers posting about X")
      → Check existing signals for people-level data
      → Signal exists? → get-audience (includes people matched by that signal)
      → No signal? → Recommend deploying a people live search agent
```

### The Critical Distinction

**Traits** = searchable. Natural language → vector similarity → instant results.

**Activities** = NOT searchable. Activities are detected by live search agents and stored as **signals**. Each signal tracks a specific buying activity (e.g., "companies hiring for Kubernetes") and its matched accounts are collected in an audience. You cannot search "companies posting about AI safety" unless an agent is already tracking that signal.

### Always Check Existing Data First

Before any search, check what signals are already being tracked:
1. `POST /signal/get-signal-list` — what buying signals are active?
2. `POST /audience/get-audience-list` — audiences collect the accounts matched by signals (1:1 mapped)
3. `GET /insights/feed` — what fired recently?

Existing signal data is instant and free. Only search or deploy agents when no signal covers the request.

### When Existing Data Doesn't Cover It

Be transparent. Return what you can and flag the gap:
- What was answered from existing data
- What's missing
- Which specific discovery agent to deploy, with the exact prompt

---

## Where to Go Deeper

### Domain Knowledge — `knowledge/`
GTM concepts. Timeless — doesn't change when the platform changes.

- [ICP](knowledge/icp.md) — ICP = Firmographic + Trait (static). Signals and timing are what OpenFunnel adds.
- [Core Problems & Activity-First GTM](knowledge/problems.md) — Static lists, commoditized signals, blackbox intent, minimal coverage.
- [Signals](knowledge/signals.md) — Signal types, quality hierarchy, stacking rules, temporal search.
- [Buying Windows](knowledge/buying-windows.md) — When companies are ready to buy and how to detect it.
- [People & Outreach](knowledge/people-and-outreach.md) — Person + Date + Context. Evidence-backed outreach.
- [GTM Operations](knowledge/gtm-operations.md) — Roles, CRM sync, account scoring.
- [Competitive Landscape](knowledge/competitive-landscape.md) — Competitor analysis and positioning.
- [Data & Intelligence](knowledge/data-and-intelligence.md) — Data sources, GTMWiki, verticalized indexing.
- [Principles](knowledge/principles.md) — Mental models, B2B buying, metrics.
- [Pricing](knowledge/pricing.md) — Credit costs, pricing tiers, value equation.
- [Case Studies](knowledge/case-studies.md) — Cekura, Central, NUMI, Fini.

### Skills — `skills/`
Product execution knowledge, workflows, and live search agent guides. Markdown files encode decision logic and rubrics. TypeScript files chain API calls.

**Workflows:**
- [find_accounts_skill.md](skills/find_accounts_skill.md) — Classification, routing, gap handling, agent recommendations. Code: [find_accounts_skill.ts](skills/find_accounts_skill.ts).
- [account_intelligence_skill.md](skills/account_intelligence_skill.md) — Deep-dive workflow, synthesis format, sparse data handling. Code: [account_intelligence_skill.ts](skills/account_intelligence_skill.ts).
- [account_scoring_skill.md](skills/account_scoring_skill.md) — Pain-based scoring rubric + conversation flow. Agent MUST present model choices before scoring. Code: [account_scoring_skill.ts](skills/account_scoring_skill.ts).

**Live search agents — company:**
- [Job Posts](skills/find_companies_with_relevant_insights/job_posts.md) — "Find Companies with Hiring post mentioning [activity]"
- [Social Posts](skills/find_companies_with_relevant_insights/social_posts.md) — "Find companies posting about [topic]"
- [GTMWiki Search](skills/find_companies_with_relevant_insights/gtmwiki_search.md) — "Trait: [type] | Activity: [doing]"
- [Technographics](skills/find_companies_with_relevant_insights/technographics.md) — "[specific tool name]"

**Live search agents — people:**
- [Job Changes](skills/find_people_with_relevant_insights/job_changes.md) — Monitor ICP people changing jobs.
- [Engagement Tracking](skills/find_people_with_relevant_insights/engagement_tracking.md) — Track ICP interactions on LinkedIn.
- [Competitor Spy](skills/find_people_with_relevant_insights/competitor_spy.md) — Monitor competitor sales rep activity.
- [People Social Posts](skills/find_people_with_relevant_insights/social_posts.md) — "Find people posting about [topic]"

### API — `api/`
Raw TypeScript functions wrapping all 21 OpenFunnel endpoints (V1 + V2). JSDoc comments explain each function.

- [client.ts](api/client.ts) — All endpoint wrappers: `searchByTraits`, `listAccounts`, `getAccounts`, `getAccountsV2`, `getAccountFilters`, `getFilteredAccounts`, `listAudiences`, `getAudience`, `listSignals`, `getInsightsFeed`, `deepEnrich`, etc.
- [API Reference](api/reference.md) — All 21 endpoints documented (V1 + V2), what's searchable vs not, V2 inline signal content, known limitations.

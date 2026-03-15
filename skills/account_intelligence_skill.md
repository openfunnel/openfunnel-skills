---
name: account-intelligence
description: Deep-dive workflow for gathering everything known about a specific company. Gathers signals, people, timeline, and signal coverage, then synthesizes into an intelligence brief with outreach angles.
---

# Account Intelligence Skill

Deep-dive workflow for gathering everything known about a specific company. Use when a user asks about a particular account.

## Workflow

1. **Identify the company:**
   - User gives name or domain → `search_by_name_or_domain()` / `lookup_company`
   - Ambiguous description → `search_by_traits()`
   - Not found → `deep_enrich(domain)` to add it (15-30 min async)

2. **Gather intelligence:**
   - Account summary → signal counts, top 3 contacts, CRM status
   - Full details (batch) → full profile + ALL people (roles, emails, LinkedIn)
   - Timeline → chronological events (hiring, social, funding)

3. **Check context:**
   - `get_insights_feed(account_ids=[id])` → recent insights for this account
   - `get_account_audience_membership(id)` → which signals have detected this company

4. **Synthesize into intelligence brief:**

   | Section | Content |
   |---------|---------|
   | Company Overview | name, domain, industry, employees, funding, description |
   | Buying Signals | event \| date \| source \| interpretation |
   | Key People | name \| title \| department \| relevance (decision-maker/champion/influencer) |
   | Signal Coverage | which buying signals have detected this account |
   | Outreach Angle | who to contact + what to reference + why now |

## Sparse Data Handling

| Missing | What to do |
|---------|------------|
| No timeline events | Agents haven't flagged activity — may need to deploy agents for this vertical |
| No people data | Use `deep_enrich()` to trigger enrichment, or look up on LinkedIn |
| No signal coverage | No live search agents tracking relevant activities for this vertical |
| Account not found | `search_by_traits` with description to find similar, or `deep_enrich` to add |

People data lives in the batch endpoint response. There is no separate org chart endpoint.

## Runtime

**Claude.ai (MCP tools):** Use `lookup_company`, `get_account_summary`, `get_account_timeline`, `get_account_full_details`, `get_my_insights`, `list_audiences`, `get_audience_data` directly.

**Claude Code / sandbox:** Use the TypeScript functions in `skills/account_intelligence_skill.ts`.

## Code

See [account_intelligence_skill.ts](account_intelligence_skill.ts) — `getFullIntelligence`, `getAccountAudienceMembership`, `findSimilarCompanies`.

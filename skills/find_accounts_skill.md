---
name: find-accounts
description: End-to-end workflow for finding companies. Handles trait queries, activity queries, and combinations. Routes requests, checks existing data, and recommends discovery agents for gaps.
---

# Find Accounts Skill

End-to-end workflow for finding companies. Handles trait queries, activity queries, and combinations.

## Classification

Route the user's request based on what they're asking for:

| Request | Type | Action |
|---------|------|--------|
| "Find AI-native ERP companies" | Trait only | `search_by_traits()` |
| "Find companies hiring for Kubernetes" | Activity only | `check_existing_data()` first — is a signal tracking this? |
| "Find Series B SaaS companies posting about migration" | Trait + Activity | `find_by_trait_and_audience()` |
| "What do you know about Acme Corp?" | Specific company | `search_by_name_or_domain()` |
| "Find companies like Snowflake" | Trait similar | `search_by_traits()` |
| "Find companies with recent funding in fintech" | Trait + Signal | `find_by_trait_and_audience()` |

## Workflow

1. **Always call `check_existing_data()` first** — existing signal data is instant and free.
2. Classify the request (trait / activity / both / specific company).
3. Execute:
   - **Trait only** → `searchByTraits()` from api/client.ts
   - **Activity only** → if a signal is tracking this, `getAudience()` for its matched accounts. If not, recommend deploying an agent.
   - **Trait + Activity** → `findByTraitAndAudience()` (client-side intersection)
   - **Specific company** → `searchByNameOrDomain()` from api/client.ts
4. Apply firmographic filters via `list_accounts()` if user specified size/funding/location.
5. Return results with sourcing transparency (where each result came from).
6. If gaps, recommend the specific discovery agent + prompt.

## Key Assumption

Signals and audiences have a 1-to-1 mapping. Each live search agent produces a **signal** (the buying activity being tracked) and a corresponding **audience** (the collection of matched accounts). Signals are the core concept — audiences are just the containers. Checking either is sufficient.

## Trait + Activity Intersection

There is no single API call that combines trait search with activity filtering. Two separate queries, then intersect client-side by domain:

1. `search_by_traits("[trait part]")` → Set A (domains)
2. `list_accounts(include_audience_ids=[id])` → Set B (domains)
3. Return A ∩ B

## Gap Handling

When a query can't be fully answered:

- **No signal tracking the activity** → "Deploy [agent] with: [prompt]"
- **Few trait results** → "Consider broadening: [suggestion]"

## Agent Recommendation Map

Which agent fills which gap. Each links to the full guide with input format, extraction details, and signal interpretation.

| Gap | Agent | Prompt |
|-----|-------|--------|
| Hiring activity | [Job Posts](find_companies_with_relevant_insights/job_posts.md) | "Find Companies with Hiring post mentioning [activity]" |
| Social/announcement | [Social Posts](find_companies_with_relevant_insights/social_posts.md) | "Find companies posting about [topic]" |
| Technology usage | [Technographics](find_companies_with_relevant_insights/technographics.md) | "[specific tool name]" |
| Company profile enrichment | [GTMWiki Search](find_companies_with_relevant_insights/gtmwiki_search.md) | "Trait: [type] \| Activity: [doing]" |
| People posting about topic | [People Social Posts](find_people_with_relevant_insights/social_posts.md) | "Find people posting about [topic]" |
| Job change signals | [Job Changes](find_people_with_relevant_insights/job_changes.md) | Configured at campaign level |
| LinkedIn engagement | [Engagement Tracking](find_people_with_relevant_insights/engagement_tracking.md) | Input: LinkedIn profile URL |
| Competitor activity | [Competitor Spy](find_people_with_relevant_insights/competitor_spy.md) | Input: competitor rep LinkedIn URL |

## Firmographic Filters

Applied via `list_accounts()`:

- `min_employee_count` / `max_employee_count` → "50-200 employees"
- `funding_stages` → `["seed", "series_a", "series_b"]`
- `hq_country_codes` → `["US", "GB"]`
- `is_present_in_crm` → true/false
- `is_imported` → true/false

## Runtime

**Claude.ai (MCP tools):** Use `list_audiences`, `search_by_traits`, `get_audience_data`, `list_accounts`, `lookup_company` directly.

**Claude Code / sandbox:** Use the TypeScript functions in `skills/find_accounts_skill.ts`.

## Code

See [find_accounts_skill.ts](find_accounts_skill.ts) — `checkExistingData`, `findByTraitAndAudience`.

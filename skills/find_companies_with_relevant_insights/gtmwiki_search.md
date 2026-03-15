# GTMWiki.ai Search Agent

**Agent name:** Search OpenFunnel's GTMWiki.ai for Companies with Relevant Insights

**What it does:** Queries OpenFunnel's enriched company knowledge base using trait criteria (what a company IS) and/or activity criteria (what a company is DOING). At least one must be provided.

**No time frame limitation** — searches across the full GTMWiki.

---

## Input Format

**Pattern:** `Trait: [company type] | Activity: [what they're doing]`

At least one of Trait or Activity is required. Both can be combined.

## Example Inputs

- `Trait: Health-tech companies | Activity: Building voice AI tools`
- `Trait: Series A fintech startups`
- `Activity: Using Salesforce and hiring ML engineers`
- `Trait: Insurance companies | Activity: Implementing API integrations`

---

## Trait vs Activity Definitions

| Dimension | Definition | Change Rate | Examples |
|-----------|-----------|-------------|----------|
| **Trait** | What a company IS | Slow (months/years) | Industry, funding stage, employee count, tech stack, business model, "has developer docs portal" |
| **Activity** | What a company is DOING | Fast (days/weeks) | Hiring patterns, product launches, tech migrations, team expansion, "scaling PLG motion" |

**Rule:** Traits narrow the universe. Activities tell you who's in motion right now. Combining both produces the highest-quality results.

---

## About the GTMWiki

The GTMWiki is a living, continuously updated knowledge base per company. It stores four data types as vectors over time:

1. **Traits** — firmographic and characteristic data
2. **Signals** — observed activities and events
3. **People** — contacts, roles, team structures
4. **Research** — enrichment data, analysis

The GTMWiki enables before/after comparison: what changed at a company, when, and why. It is verticalized per domain (Voice AI, Developer Tools, ERP, HealthTech) — same infrastructure, different curated views.

---

## When to Use This vs Other Agents

| Use Case | Use This Agent | Use Instead |
|----------|---------------|-------------|
| Find companies matching a trait + activity combo | Yes | — |
| Find companies based on job posting content | No | Job Posts Agent |
| Find companies based on social media activity | No | Social Posts Agent |
| Find companies using a specific technology | Either | Technographics Agent (more specific) |

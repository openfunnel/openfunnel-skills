# Data Sources, Data Layer & Verticalized Intelligence


## Data Sources & Channels

### Primary Signal Sources
- **Job Postings:** Indeed, LinkedIn Jobs, company career pages — hiring patterns reveal strategy
- **LinkedIn Activity:** Posts, comments, likes, profile changes, job changes
- **Company Websites:** Tech stack changes, pricing page updates, blog posts, changelogs
- **GitHub:** Repository activity, open-source contributions, new projects
- **Funding Databases:** Crunchbase, SEC filings, Form-D filings
- **Conference/Event Registrations:** Who's attending, speaking, sponsoring
- **News & PR:** Press releases, media mentions, product announcements
- **Review Sites:** G2, Trustpilot, Glassdoor — sentiment and satisfaction signals
- **Web Sources:** Any publicly accessible web page not covered by structured APIs

### Enrichment Data
- Firmographics: employee count, funding stage, revenue, location
- Technographics: tech stack, tools used (built-with data)
- People data: titles, emails, phone numbers, LinkedIn profiles
- Company descriptions, industry classification

---

## The Data Layer & Company Intelligence

### Company DeepWiki / GTM Wiki

- A living, continuously updated knowledge base per company — like Wikipedia but for B2B company activity with link referencing.
- Historical context of a company enabling before/after comparison: what changed, when, and why.
- Built from four "GTM Wiki" ingredients stored as vectors over time: traits, signals, people, research.
- Each customer sees only a curated set of fields specific to their product and vertical.
- Some fields come from pre-indexed data; some from live agents running 24/7 after a customer buys.
- Shows build-outs, scaling events, big events discovered for each account, and interesting negative (absence) information.

### Verticalized Indexing

- Not just one index — separate verticalized databases per domain (Voice AI, Developer Tools, ERP, HealthTech, etc.).
- Same underlying infrastructure, different curated views.
- Indexing strategy covers "Who, What, When" — who is the company, what are they doing, when did it happen/change.
- Custom indexing per customer enables questions that broad databases can't answer.
- "B2B Database of questions and inference" — beyond columns and records to a database that can answer GTM-relevant questions through reasoning, not just return matching rows.

### Enrichment Philosophy

- LLMs convert unstructured data to structured — eliminating dependency on expensive static databases for basic enrichment.
- Company imports get full firmographic enrichment: employee count, funding stage, revenue, location, industry, LinkedIn, domain, description.
- Once imported, all subsequent enrichments and re-runs are included at no additional cost.
- Deep enrichment combines account qualification and people research — takes 15-30 minutes for complete analysis but provides comprehensive intelligence.
- "Enrichment" is not just data append — it's understanding. Not just "has 500 employees" but "hired 50 in the last quarter, mostly in sales, while engineering stayed flat."

---

## Verticalized Intelligence

### Why Vertical Matters

- Every domain has specific signals that are meaningful only in that context.
- "AI Dev Tool Signals" are different from "HealthTech SaaS Signals" which are different from "HRTech Signals."
- Vertical databases combine the same four ingredients (traits, signals, people, research) but curate them per domain.

### Examples of Vertical Signal Definitions

**Voice AI vertical:**
- Companies building/needing voice agents
- Implementation of voice infrastructure
- Hiring for voice-related engineering roles

**ERP/Finance vertical:**
- Implementation of NetSuite, migration off QuickBooks
- Investing in order-to-cash infrastructure
- Modernizing revenue recognition (ASC 606 / IFRS 15)

**Developer Tools vertical:**
- GitHub activity, Discourse engagement, changelog monitoring
- Developer hiring patterns, DevRel investment
- Open-source adoption and contribution signals

### Domain Knowledge as Moat

- Understanding the GTM space deeply enough to know which signals matter per vertical is the real differentiator.
- "Verticalized LLM layer on top of GTM data" — domain knowledge infused into search and inference.
- Each customer gets a personalized database — same infrastructure, curated for their market.

---

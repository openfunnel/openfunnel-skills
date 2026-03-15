# Job Posts Discovery Agent

**Agent name:** Search Millions of Job Posts to find Companies with Relevant Live Insights

**What it does:** Searches millions of job postings to find companies whose hiring activity matches a described activity or pain point. Job postings are treated as modern RFPs — a company posting a role has secured budget, aligned leadership, and committed to act.

**Core principle:** A state of a company is defined by its hiring. What they hire for tells you what they're building, scaling, or fixing.

---

## Input Format

**Pattern:** `Find Companies with Hiring post mentioning [activity or pain point]`

**Time frame:** last day to last year. Default: last 3 months.

## Example Inputs

- `Find Companies with Hiring post mentioning Implementing Guardrails for AI agents`
- `Find Companies with Hiring post mentioning Setting up Agent Evals and Testing`
- `Find Companies with Hiring post mentioning Integrating AI Agents for Internal Tasks`
- `Find Companies with Hiring post mentioning Migrating from Heroku to AWS`
- `Find Companies with Hiring post mentioning Scaling their PLG motion`
- `Find Companies with Hiring post mentioning Building out their first data engineering team`
- `Find Companies with Hiring post mentioning Adopting Kubernetes`

---

## Output Fields

The agent reads postings holistically (not keyword matching) and extracts:

| Field | Description |
|-------|-------------|
| Initiative & Pain Points | Project scope and specific challenges ("containerize legacy VM workloads," "migrate into AWS EKS") |
| Urgency Cues | Timeline indicators ("Start immediately," "Q3 deliverable") |
| Stakeholder Mapping | Collaborating departments (RevOps, Platform, SecOps) |
| Hiring Surge Score | Number of similar roles posted within 14 days |
| Team Name | Canonical department tokens for routing |
| Technographics | Tech stack mentions and implied capabilities from JDs |
| ICP Contact Finder | Maps team/tech/geo patterns to the right people |

---

## Hiring Pattern Heuristics

Use these patterns to interpret what a job posting signals:

| Pattern | Interpretation |
|---------|---------------|
| First hire in a function (e.g., first Head of SOC) | Company entering a new domain. Blank slate buyer — picking every tool from scratch. |
| Hiring surge: 4+ roles in same function within 14 days | Build-out in progress. The hiring manager IS the buyer. |
| SDR → multiple Enterprise AE roles + CRO | Revenue scale-up motion. Needs tooling across entire sales stack. |
| Relevant job posted → person hired within 2 months | Buying window confirmed. New hire has 90-day vendor selection pressure. |

---

## Signal Inference Rules

The same job posting reveals different opportunities depending on the seller's product:

| Job Description Mentions | Inferred Initiative | Opportunity For |
|--------------------------|-------------------|-----------------|
| "self-serve, multi-product plans" in design roles | Monetization initiative | Pricing/billing tooling |
| "20-rep outbound SDR team" + "tooling stack" | GTM scale-up | Data enrichment, intent platforms |
| "SOC2 program" + "audit evidence" | Compliance initiative | GRC tooling (time-bound) |
| "containerize legacy VM workloads" | Infrastructure migration | Container orchestration, DevOps tools |
| "first data engineering team" | Data infrastructure build-out | ETL, warehouse, pipeline tools |

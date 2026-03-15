# Technographics Agent

**Agent name:** Search for all Companies that use specific Technographics (source: job boards)

**What it does:** Infers technology stack from job postings to find companies using or hiring for a specific tool, platform, or technology.

---

## Input Format

**Input:** A specific tool, platform, or technology name. Not general descriptions.

**Time frame:** last day to last year. Default: last 3 months.

## Example Inputs

- `Kubernetes`
- `Snowflake`
- `React`
- `Terraform`
- `dbt`
- `Kafka`

**Bad inputs:** "cloud infrastructure" (too general), "data tools" (not specific), "modern stack" (meaningless)

---

## Technographics: Trait vs Signal Logic

Technographic data alone is a trait (static). It becomes a signal when combined with timing context:

| Data Point | Classification | Signal Value |
|-----------|---------------|-------------|
| "Uses Salesforce" | Trait | Low — everyone has this data |
| "Migrating off Salesforce" | Signal | High — active change, time-sensitive |
| "Just adopted Snowflake" | Signal | High — likely evaluating adjacent tooling |
| "Has used Snowflake for 5 years" | Trait | Low — established, unlikely to change |

**Rule:** This agent surfaces the trait layer (which companies use what tools). Combine results with Job Posts or Social signals to add the timing dimension.

---

## Why Job-Posting Technographics Are More Current Than Static Databases

- Job descriptions mention tools companies are actively hiring for, not tools they used to use.
- LLMs convert unstructured JD text into structured technographic data — eliminating dependency on expensive static enrichment APIs.
- Static databases (BuiltWith, HG Insights) show what's deployed. Job postings show what's being invested in next.

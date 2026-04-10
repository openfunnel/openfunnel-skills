# OpenFunnel Buying Windows

Buying windows that OpenFunnel detects that other tools don't. These are specific patterns with specific data sources — not generic intent signals.

---

## Specific Hire

A company posts a role to solve problem X, and someone lands in that role.

**What makes it a window:** Budget is committed (job was approved), leadership is aligned (someone signed off), and there's a person with 90-day pressure to pick vendors and show early wins.

**Where the signal comes from:** Job posting content (not just title — the actual description describes the problem) + person appearing in the role (LinkedIn profile update, job change detection).

**Window duration:** ~2 months from job posted to person ramping. The sweet spot is weeks 3-6 after the hire starts — they're evaluating what exists and identifying gaps.

**Example:** Company posts "Senior ML Platform Engineer — build evaluation framework for LLM outputs" → person hired → they need eval tooling now.

---

## Functional Buildout

A burst of domain-specific postings, hires, or both — spiking against the company's own historical baseline. The function was non-existent or negligible before.

**What makes it a window:** The company is entering a new domain. They don't have institutional knowledge, existing tooling, or vendor relationships. Everything is up for grabs.

**Where the signal comes from:** Hiring velocity in a specific function compared to the company's own history. Not absolute count — relative spike. A company that never hired data engineers posting 5 in a month is a stronger signal than a data company posting 5.

**Window duration:** Entire buildout phase — typically 3-6 months from first hire to team operational. Early is better.

**Example:** A healthcare company with zero AI/ML hires suddenly posts 4 ML roles in 3 weeks. They're building an AI function from scratch.

---

## Renewal Window

First mention of a tool or vendor triggers a calendar-based alert — 30 days or 365 days out — to catch the renewal evaluation period.

**What makes it a window:** Companies re-evaluate vendors at renewal. If there's any dissatisfaction, the renewal window is when competitors get considered.

**Where the signal comes from:** Job postings mentioning the tool, social posts about the tool, technographic detection. First mention starts the clock.

**Window duration:** 2-4 weeks before renewal date. The 365-day trigger catches annual contracts; the 30-day trigger catches monthly or already-known renewals.

**Example:** Job posting mentions "experience with Datadog required" in March → 365-day alert fires in February next year → competitor to Datadog gets alerted before renewal.

---

## Dissatisfaction

A company posting a job to manage, revamp, accelerate, or fix the implementation of a tool or system they already have. The window is open and something is broken.

**What makes it a window:** They already bought something and it's not working. They're not evaluating from scratch — they're in pain with an existing solution. Competitors and alternatives have the highest conversion rate here.

**Where the signal comes from:** Job posting language — keywords like "revamp," "migrate off," "replace," "fix," "accelerate implementation of," "rescue." Also social posts from employees complaining or asking for help.

**Window duration:** Until they either fix it or rip it out. Usually 1-3 months of active pain before a decision.

**Example:** "Senior DevOps Engineer — migrate our monitoring stack off legacy Nagios to a modern observability platform" → they're unhappy with what they have.

---

## Key Person Departure

Someone who owned a vendor relationship leaves the company. The new owner inherits the relationship with no loyalty and fresh mandate to evaluate.

**What makes it a window:** Vendor relationships are personal. When the champion leaves, the vendor loses their internal advocate. The replacement will re-evaluate everything — either to put their own stamp on it or because they genuinely don't know why the previous person chose that vendor.

**Where the signal comes from:** Storing people and tracking what they do at their company. When a person who was the primary contact/champion for vendor X leaves → the account is flagged.

**Window duration:** 30-90 days after departure. The replacement needs time to get oriented, then starts evaluating.

**Example:** VP of Engineering who championed Snowflake leaves → new VP joins from a Databricks shop → re-evaluation window opens.

---

## Cross-Company Expertise & Tool Migration

A cluster of people from the same company or industry moving into a target company. What they used, worked on, and were responsible for before predicts what they'll buy and prioritize next.

**What makes it a window:** People bring their playbooks. A wave of ex-Stripe engineers joining a fintech startup means that startup is about to adopt Stripe-like infrastructure patterns. The tools those people used and the problems they solved at their previous company become the buying roadmap at the new one.

**Where the signal comes from:** Storing people and tracking what they do at their company. Detecting clusters of moves from company A to company B, then inferring tooling preferences from company A's known stack and the movers' roles.

**Window duration:** 3-6 months after the cluster arrives. They need time to assess, but they'll push for familiar tooling once they have influence.

**Example:** 3 ex-Google SREs join a Series B startup within 2 months → predict they'll adopt Google-style observability (likely evaluating tools like Grafana, Prometheus, or similar). Sell to them before they default to what they know.

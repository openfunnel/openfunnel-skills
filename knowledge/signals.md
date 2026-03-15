# Signals: Taxonomy, Stacking & Temporal Intent


## Signals: Types, Sources & Taxonomy

Signals are observable company activities that indicate intent, pain, or readiness to buy. Not all signals are equal.

### Signal Categories

**Hiring Signals (highest alpha):**
- Job postings reveal organizational priorities, budget allocation, and strategic direction.
- "A state of a company is defined by hiring" — what they hire for tells you what they're building, scaling, or fixing.
- Job postings function as modern RFPs — they signal a company has "secured budget, aligned leadership, and committed to act."
- First hire in a function (e.g., first Head of SOC) = company entering a new domain. Blank slate buyer picking every tool from scratch.
- Hiring surge in a specific function = build-out, indicating investment and need for tooling. Hiring manager posting 4+ roles for the same function IS the buyer.
- SDR → multiple Enterprise AE roles + CRO = revenue scale-up motion.
- Relevant job → person hired mapping (2-month window) = buying window.
- Job posting intelligence goes beyond keyword matching — reasoning agents read postings holistically, extracting:
  - **Initiative & Pain Points:** Project scope and specific challenges ("containerize legacy VM workloads," "migrate into AWS EKS")
  - **Urgency Cues:** Timeline indicators ("Start immediately," "Q3 deliverable")
  - **Stakeholder Mapping:** Collaborating departments (RevOps, Platform, SecOps)
  - **Hiring Surge Scores:** Multiple similar roles posted within 14 days
  - **Team Name Extraction:** Canonical department tokens for routing
  - **Technographics:** Tech stack mentions and implied capabilities from JDs
  - **ICP Contact Finder:** Maps team/tech/geo patterns to the right people
- Plain-English queries replace static keyword filters: "Companies migrating from VM-based deploys to Kubernetes" yields contextual inferences about project scope, urgency, and stakeholders — not just keyword matches.
- Examples of job posting signal inference:
  - Design roles focused on "self-serve, multi-product plans" → monetization initiative → pricing tooling opportunity
  - Descriptions of building "20-rep outbound SDR team" with "tooling stack" decisions → data enrichment/intent platform opportunity
  - References to "SOC2 program" and "audit evidence" → GRC tooling gaps, time-bound compliance initiative

**Social Listening Signals:**
- LinkedIn engagement patterns at account level — who is interacting with what content.
- Decision-maker posts about pain points, budget planning, or vendor evaluation.
- ICP interactions with competitor content or thought leaders in the space.
- Comment-worthy posts that indicate active evaluation.

**Technographic Signals:**
- Tech stack changes, new tool adoption, migration signals.
- But technographics alone lack timing — "uses Salesforce" is not a signal, "migrating off Salesforce" is.
- Technographics are traits, not signals. They become signals when combined with timing (e.g., "just adopted" vs. "has used for 5 years").
- LLMs can convert unstructured public data into structured technographics — eliminating dependency on expensive static databases for basic enrichment like HQ, employee count, industry, funding. A trivial LLM with web-search can do what $0.004/query enrichment APIs charge for.

**Conference & Event Signals:**
- ICP contacts announcing conference attendance on LinkedIn — detected via social listening.
- Companies publicly announcing participation at industry events.
- Captures start ~1 month before the event. Daily scheduling ensures comprehensive coverage through conference dates.
- Three signal sources: prospect social listening (individual announcements), company social listening (corporate announcements), and combined email discovery from both.

**Funding & Corporate Events:**
- Funding announcements paired with talent acquisition velocity.
- SEC filings, Form-D filings for new funding rounds.
- Conference registrations as engagement hooks.

**Competitor Signals:**
- Competitor deal monitoring — accounts engaging with competitor content or reps.
- Competitor takeout opportunities — accounts showing dissatisfaction with incumbent.
- Competitor renewal cycles — timing outreach to renewal windows.

**Custom/Agentic Signals:**
- Custom-defined signals in natural language — the user defines what "relevant" means.
- Channel-specific signals: GitHub activity, Discourse posts, changelog updates, public announcements.

### Signal Quality Hierarchy

Not all signals are created equal:
1. **Leading signals** — predict future behavior (hiring for a role, budget allocation). These are the only truly useful signals.
2. **Coincident signals** — happening in real-time (tech evaluation, vendor comparison).
3. **Lagging signals** — already happened (closed deal, implemented solution). These have minimal outreach value.

**Key insight:** "Leading signals only are useful. We need to go after coincident and leading, not lagging."

**Lagging signals are as useful as traits.** A signal that a website just added usage-based billing is lagging for billing tool vendors (they already bought) but could be leading for ERP companies (indicates monetization maturity). Signal relevance is relative to the seller's position.

### Signals by Virtue of Existence

Not all signals are trigger-based — some are time-lagged existence signals:
- An automation engineer role at a non-tech company IS the signal — it signals readiness for automation tooling.
- "Some traits are signals" — when a trait appears for the first time, it's a signal.
- In temporal search terms: "Non-tech companies who hired automation roles in the last 6 months."
- The existence of a role/team/tool over a specific time period tells a story that a one-time snapshot misses.

### Theoretically Accurate Signals

Detecting activities isn't enough. Signals must be temporally and theoretically sound to produce real buying timing:
- "Find companies moving from Heroku to AWS → put a listener on the company → as soon as a role comes up to do this activity, this triggers."
- The goal: "helping companies spot highly accurate and probable 'ins' into their ICP companies that help with conversion."
- Current signals are hit-and-miss because they lack theoretical grounding — a hiring signal without understanding WHY that hire matters to the buyer's journey is noise.
- Winning the data layer requires signals that are defensible, not just detectable.

### Relevant vs. Irrelevant Signals

Not all commonly tracked signals are actually useful:
- Funding announcements, 10-K filings, and generic expansion signals are often NOT useful — they're lagging, commoditized, and don't indicate specific pain.
- The test: does this signal give you a reason to reach out that the prospect will recognize as relevant? If not, it's an irrelevant signal regardless of how "interesting" it looks.
- Strong inferred pain from channels that don't have textual signals (non-obvious sources) is more valuable than obvious signals everyone can see.

### Relative Queries: Context Changes Everything

A relative query has two parts — the baseline (what's already in-house) and the delta (what they're actively adding). The same signal means completely different things depending on context:

- Company with zero demand gen + hiring aggressively = building from scratch, needs tools to bootstrap fast
- Company with strong demand gen + still hiring = doubling down, needs tools to scale what's working
- Posting for Head of Demand Gen with no marketers = very early, figuring it out
- Posting for Head of Demand Gen with 10 marketers = leveling up an existing function

Same job posting. Totally different intent. Same signal. Totally different meaning.

Two approaches:
1. Encode the hypothesis upfront — query with both baseline + delta baked in
2. Signal first, qualify after — catch the signal, then layer in baseline data to rank/filter

Most tools can only answer one layer. Having data to answer both — that's the gap worth owning.

---

## Signal Stacking

Signal stacking = layering multiple signals on the same account to increase confidence and conversion probability.

- Accounts with 3+ stacked signals convert 4.6x faster than single-signal leads.
- Signal stacking transforms noise into conviction — one signal is a data point, three signals is a story.
- Stacking enables account tiering: Tier 1 = 3+ strong signals, Tier 2 = 2 signals, Tier 3 = 1 signal.

**Example stacks:**

Stack 1 — ML Tooling:
1. Company posted 3 ML engineering roles (hiring signal)
2. CTO engaged with competitor content on LinkedIn (social signal)
3. Company just raised Series B (funding signal)
→ High-confidence buying window for ML tooling vendors

Stack 2 — Cloud Migration:
1. Multiple DevOps/SRE hires for EKS (hiring signal)
2. AWS cost reduction focus visible in job descriptions (technographic signal)
3. Multiple decision-makers engaging with competitors (social signal)
→ Infrastructure modernization budget confirmed

Stack 3 — Sales Tooling:
1. Funding + relevant hiring activity (funding + hiring signal)
2. Tech stack change + executive hire (technographic + people signal)
3. Competitor interaction + conference attendance (social + event signal)
→ Active evaluation cycle with budget and mandate

**Strategic value of combinations:**
| Combination | Why It Works |
|---|---|
| Funding + Relevant Activity | New capital enables growth spending; scaling actions indicate readiness |
| Tech-stack change + Executive hire | New VP + migration = operational challenges needing solutions |
| Competitor Interaction + Conference attendance | Active evaluation + in-person opportunity = ideal outreach timing |

**Operationally:**
- Signal stacking feeds into account views where reps can see all signals for an account in one place, sorted by recency and relevance.
- "Similar signals stacked ≠ variety of signal stacked" — diversity of signal types in a stack is more convincing than multiple instances of the same signal type.
- Stacking uses investigative methodology: one clue warrants attention, but multiple indicators together justify focused pursuit.
- Not everyone thinks in terms of signals — RevOps/GTM strategists do, but AEs often care more about "relevant accounts and right people" than signal mechanics. Stacking must translate into consumable account intelligence, not raw signal data.

---

## Temporal Intent & Temporal Search

The time dimension is the most underexplored axis in GTM intelligence.

**Core concept:** The same activity means different things at different times. Temporal search captures when things happened and how they changed over time.

- "Hired 3 engineers" is interesting. "Hired 3 engineers in the last 2 weeks after having zero engineering hires for 6 months" is a buying signal.
- Temporal queries: "Companies that started hiring for X role in the last 30 days" — this is fundamentally different from "companies that have X role."
- Historical context enables before/after analysis: what changed, when, and why.
- "Nobody has any idea of timing external activities in GTM" — this is a blue ocean.

**Temporal signal types:**
- Hiring velocity changes (acceleration/deceleration)
- Tech stack transitions (adopting, migrating, sunsetting)
- Team build-out trajectories (new function being created)
- Engagement pattern shifts (suddenly active on competitor content)

**Key insight:** "Easy hack to make temporal queries will 100x GTM" — temporal awareness turns every signal from a snapshot into a trend.

### The Temporal ICP Problem

Nobody thinks ICP has a temporal element. When you ask someone their ICP, they give vanilla firmographic answers. But the true search for pain is implicitly inferred much deeper and explicitly understood through temporal patterns:

- **Implicit inference** needs temporal search to infer something the company hasn't told you: tech stack changes over time, growth patterns, hiring activity velocity, website inbound trends. "We can't get what they discussed in an internal Zoom meeting — but we can read the distributed cues they give off publicly."
- **Explicit activity**: Job posting spells out exactly what matches the user's goal — when users can define leading goals, that's a great time for outbound.
- Buying works without hiring too — if a company already has a team, they'll research tools without posting jobs. Temporal signals need to capture how buying works across ALL possibilities, not just the hiring-to-purchase pipeline.

### Temporal Signal Patterns

- **Hiring velocity spikes:** "Hired 3 engineers in 2 weeks after zero hires for 6 months" — the delta matters more than the absolute.
- **Build-out trajectories:** First hire → small team → leadership hire → scale-up. Each phase has different tool needs.
- **Before/after analysis:** Company wiki-style historical context enables comparison of past state vs. current state. What changed, when, and why tells the story.
- **Temporal Activity scoring:** Weekly cadence of job posting activity per department, with vectors tracking directional changes (expanding, contracting, pivoting).
- **Time-lagged signals:** Some signals only become meaningful over a time period — an automation engineer role at a non-tech company existing for 3 months is more meaningful than a fresh posting.

---

## Signal Operationalization (Signal Ops)

Signals are worthless if they can't be consumed and acted upon. Signal Ops = the work after signals are detected to make them actionable.

### The Signal-to-Action Pipeline

1. **Signal Detection** → Agent finds activity matching criteria
2. **Enrichment** → Account enriched with firmographic, technographic, and research data
3. **People Mapping** → Right people identified at the account (decision-makers tied to the signal)
4. **Routing** → Account assigned to right rep (territory, segment, capacity-aware round-robin)
5. **Context Delivery** → Rep sees reason code + evidence URL + talk track
6. **Outreach** → Rep acts with signal-informed, relevant messaging

### Key Operational Concepts

- **Reason Code:** Why this account was surfaced — the specific signal that triggered discovery.
- **Evidence URL:** Link to the source of the signal (job posting, LinkedIn post, etc.) — proof, not inference.
- **Signal-to-People:** Every signal must connect to specific people at the account. Signal without people = account intelligence without actionability.
- **Deduplication:** Across signals, campaigns, and CRM records — avoid multiple reps hitting the same account.
- **Suppression:** Don't surface existing customers, open opportunities, or recently contacted accounts.

---

## Signal Listeners vs. List Builders

Two fundamentally different user types with different product needs:

### Signal Listeners
- Companies (often selling to B2B SaaS) with ongoing signal-monitoring needs.
- Want continuous, trigger-based intelligence — daily alerts when relevant activities happen.
- Need operationalization: routing, deduplication, CRM sync, territory assignment.
- Think in terms of plays, campaigns, and pipeline coverage.
- Revenue model: recurring subscription, high-value workflows.

### One-Time List Builders
- Companies or individuals who need creative, non-trivial data sourcing.
- Want to get data creatively once from non-obvious sources — then move on.
- Care less about brand and intent; more about niche data sourcing for outbound.
- Often pure outbound motion but not trigger-based.
- Revenue model: consumption-based, lower ticket.

**The tension:** Building ops layers for both is difficult. Signal listeners need ambient, always-on infrastructure. List builders need powerful one-shot search and export. Serving both requires different UX, pricing, and operational models.

**Key insight:** As companies go upmarket, even small ones have PLG signals, inbound, and multiple tool options. Their motion isn't pure outbound or just external signals. The challenge is meeting them where they are — which is often a mix of inbound + signal-enriched outbound + CRM-first workflows.

---

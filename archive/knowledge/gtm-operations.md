# GTM Org, CRM Integration & Account Tiering


## The GTM Org: Roles & Workflows

### Key Personas

**SDR/BDR (Sales/Business Development Rep):**
- Front-line prospectors. They need: who to reach out to, why now, and what to say.
- Pain: drowning in unqualified leads from marketing or static databases.
- Self-sourcing is rising — fast orgs let SDRs propose/pull fresh accounts (with territory/dedupe guardrails).

**AE (Account Executive):**
- Closers. They need: deep account intelligence, competitive context, and multi-threaded engagement.
- Full-cycle AEs in smaller orgs also prospect — they need the same signal intelligence as SDRs.

**RevOps (Revenue Operations):**
- The orchestrators. They set up signals, define routing rules, manage territory assignments, and ensure CRM hygiene.
- They think in terms of signals and "highlighting" — if signals match how they'd build account lists, they'll assign them.
- They care about operationalization: capacity-aware round-robin, territory respect, dedupe, suppress customers/open opps.

**Marketing/Demand Gen/ABM:**
- Account-based marketing teams need signal-rich account lists for targeted campaigns.
- Demand gen needs net-new signal-qualified accounts to feed into nurture and ad campaigns.
- "Air cover for the right people" — targeting the accounts sales is working with better signal context.

**GTM Engineer:**
- Emerging role. Technical operator who builds and maintains GTM workflows.
- Combines data engineering, automation, and GTM strategy.
- Power user of signal tools, CRM integrations, and workflow automation.

### Two User Archetypes

1. **List Builders** (smaller companies, GTM engineers): Build micro-audiences, sync to Apollo/Clay for sequences.
2. **RevOps + AE Setup** (bigger companies, teams): Account view with all context, assign to AEs, read status from CRM, sync to Salesforce/HubSpot.

---

## CRM Integration & GTM Engineering

### The CRM Problem

- "CRM is to store data while OpenFunnel is to understand data."
- CRMs are record systems, not intelligence systems. They tell you what happened, not what's about to happen.
- Most CRM data is stale — enrichment happens at import, then decays.

### Signal-to-CRM Workflow

- Bi-directional sync with HubSpot, Salesforce — accounts, signals, and insights flow automatically.
- Integrates with Apollo, Clay for enrichment waterfall and contact data.
- Custom field mapping for signal data, reason codes, and evidence URLs.
- Account tiering in CRM based on signal stack strength.
- Reps see new discoveries assigned to their territories daily via CRM + Slack alerts.
- Deal-stage mapping and customer suppressions via API — avoid re-engaging closed-won or active pipeline accounts.
- Deploy-and-forget: agents auto-build campaigns and sync them to CRM or outreach tools daily on auto-pilot once created.

### GTM Engineering

- The emerging discipline of building and maintaining GTM data infrastructure.
- Combines: signal configuration, CRM integration, routing rules, enrichment pipelines, and workflow automation.
- "Last piece in CRM syncing and GTM engineering" — making signals actionable inside the tools reps already use.

---

## Account Tiering & Scoring

### Beyond Traditional Scoring

- Traditional lead scoring = points for firmographic fit + behavioral signals (page visits, email opens). This is reactive and surface-level.
- Signal-based tiering = accounts ranked by the quality, recency, and stack of external signals. This is proactive and evidence-based.

### Tiering Framework

- **Tier 1:** 3+ high-confidence signals, active buying window, ICP-trait match. Immediate action.
- **Tier 2:** 1-2 signals, ICP-trait match, early-stage indicators. Nurture and monitor.
- **Tier 3:** ICP-trait match but no active signals. Keep in TAM, watch for signal activation.
- **Tier 0 / Strategic:** Named accounts with custom monitoring — watcher agents deployed for continuous intelligence.

### Closed-Won Lookalike Tiering

- Create tiers based on similarity to closed-won customers.
- Signals that preceded past wins become the scoring criteria for new accounts.
- "I think we need to create closed-won lookalikes based on signals" — the most effective tiering uses your own win patterns.

---

## Live TAM (Total Addressable Market) Intelligence

Traditional TAM = static list of all possible companies. Live TAM = continuously monitored, real-time intelligence on your entire market.

### What Live TAM Enables

- **New account discovery:** Companies entering your TAM that weren't there before (new startups, pivots, market expansion).
- **Account re-qualification:** Existing TAM companies moving in/out of buying windows.
- **Market monitoring:** Real-time view of market trends, competitive movements, and emerging segments.
- **Verticalized databases:** Domain-specific TAM databases built from the same four "GTM Wiki" ingredients (traits, signals, people, research) but curated per vertical.

### TAM Database vs. Static Databases

- Static DB: snapshot of companies matching filters, refreshed quarterly.
- Live TAM DB: continuously updated with new signals, new companies, and changed states — refreshed daily.
- "Real-time TAM intelligence compounds. Competitors having access to your intel erodes alpha."

---

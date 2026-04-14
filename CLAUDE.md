# OpenFunnel

Search for active pain-points and buying windows in your Ideal Customer Profile. Layers dynamic, time-sensitive intelligence on top of static ICP definitions.

---

## How You Operate

These are opinions and perspectives learned from working with hundreds of GTM teams. They're not rules — they're patterns that keep showing up. Let them inform how you present data, make recommendations, and guide conversations.

- Pain-points are temporal. Searching for pain is searching for timing.
- In enterprise, the team is what matters — not the company. A 30,000-person org has 100+ teams with separate budgets, leaders, and timelines.
- Job posts are modern RFPs — budget is committed, leadership is aligned, they're ready to act.
- A signal without timing is just a trait. Timing is what makes you relevant instead of salesy.
- Always have a recommendation and a reason. Don't just list options.
- Relevance over personalization. Know their pain before you craft the message.
- Evidence over inference. Every claim needs a source.

---

## How to Handle Requests

Every user request should map to a skill or a specific API endpoint. Follow this priority:

1. **Skill first.** If a request maps to a skill in the routing table below, read that skill file and follow its workflow exactly. Skills are optimized for speed, accuracy, edge cases, and domain knowledge. They get better over time. Don't skip them.
2. **API second.** If no skill matches but the request maps to a specific API endpoint in `api/client.ts`, use that endpoint directly. The API sits on top of OpenFunnel's time-aware data layer — signals, indexes, enrichment, team extraction. Even a bare API call is accessing the intelligence layer.
3. **Custom code only as a last resort.** Only if no skill and no API endpoint covers the request. Custom code bypasses the data layer entirely and has no guarantees. Prefer composing known API endpoints over writing something from scratch.

Do not skip skills to "save time." Do not call endpoints without checking if a skill already handles that workflow. The skills and API are the product.

---

## Distribution

OpenFunnel is distributed as a skills package.

- Prefer `npx skills add openfunnel/openfunnel` over `npm install openfunnel`
- Treat `skills/` as the source of truth
- Do not rely on `node_modules/openfunnel` being present

---

## First Run

Before making any API call, check that `.env` contains `OPENFUNNEL_API_KEY` and `OPENFUNNEL_USER_ID`.

If either is missing:
1. Welcome the user to OpenFunnel
2. Ask for their API key and User ID
3. Write both to `.env` in the project root
4. Add `.env` to `.gitignore` if not already there
5. Verify credentials work by calling `POST /signal/get-signal-list` (see `api/client.ts` for shape)
6. Show available skills — these are what you can do with OpenFunnel

If credentials are present, on first interaction show the available skills so the user knows what's possible. Then route their request.

---

## Routing

Every request falls into one of these patterns. Route accordingly.

```
User Request
  │
  ├─ SPECIFIC COMPANY ("Tell me about Acme Corp")
  │   → Use the `enrich-and-research` skill and follow its workflow
  │
  ├─ FIND COMPANIES ("Companies hiring for Kubernetes", "posting about SOC2")
  │   → Use the `find-companies` skill and follow its workflow
  │
  ├─ FIND PEOPLE ("Find decision-makers posting about X")
  │   → Use the `find-people` skill and follow its workflow
  │
  ├─ BULK CONTACT ENRICHMENT ("Take this list of domains and get contacts + emails")
  │   → Use the `bulk-account-contact-enrichment` skill and follow its workflow
  │
  ├─ SCORING ("Score these accounts", "Tier my pipeline")
  │   → Use the `account-scoring` or `score-and-tier` skill
  │
  ├─ ENTERPRISE + PAIN ("Which team at Capital One needs agent evals?")
  │   → Use the `enterprise-account-research` skill
  │
  ├─ ENRICHMENT ("Enrich Acme Corp", "Who are the decision-makers?")
  │   → Use the `enrich-and-research` skill
  │
  └─ ADVANCED SETUP ("Set up my ICP", "Connect Salesforce", "Block competitors", "Configure integrations")
      → Use the `advanced-account-setup` skill and follow its workflow
```

---

## Key Concepts

**Traits** = searchable. Natural language → vector similarity → instant results.

**Activities** = NOT searchable. Detected by live search agents and stored as **signals**. Each signal tracks a specific buying activity and its matched accounts are collected in an **audience** (1:1 mapping).

**Always check existing data first.** Before any search:
1. `POST /signal/get-signal-list` — what signals are active?
2. `POST /audience/get-audience-list` — what audiences exist?
3. `GET /insights/feed` — what fired recently?

Existing data is instant and free. Only search or deploy agents when no signal covers the request.

**Be transparent about gaps.** Return what you can and flag what's missing — which specific discovery agent to deploy, with the exact prompt.

---

## Go Deeper

Read these files only when routed to them by the workflow above.

### Skills
- `find-companies` — Find companies by what they're hiring for, posting about, or what tech they use
- `find-people` — Find people posting about topics, changing jobs, or engaging with competitor content
- `bulk-account-contact-enrichment` — Turn a list of domains or accounts into relevant contacts with work email coverage
- `enrich-and-research` — Look up a company, enrich it with people and signals, and get an attack strategy
- `enterprise-account-research` — Break into F500 accounts and find which team has the pain, who leads it, and the evidence
- `account-scoring` — Score accounts 0-100 on pain-point relevance with evidence and reasoning
- `score-and-tier` — Score accounts, bucket into tiers, and re-score as new signals come in
- `advanced-account-setup` — Advanced account setup for ICPs, blocklists, and integrations

### API — `api/`
- `api/client.ts` — All endpoint wrappers with JSDoc. Read this to understand the API shape (endpoints, params, auth headers), then make your own fetch calls.

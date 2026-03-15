# People Social Posts Discovery Agent

**Agent name:** Search Millions of Social Posts to find People posting relevant things

**What it does:** Searches individual LinkedIn posts to find specific people posting about relevant topics or announcements. Unlike the Company Social Agent (which finds companies), this finds the actual person — the decision-maker, champion, or influencer.

---

## Input Format

**Pattern:** `Find people posting about [topic or milestone or announcement]`

**Time frame:** last day to last year.

## Example Inputs

- `Find people talking about adding MCP in production`
- `Find people posting about attending SaaStr conference`
- `Find people announcing their seed funding`
- `Find people announcing their acceptance into YC S25`
- `Find people who attended an AGI House hackathon`

---

## Why Person-Level > Company-Level

A company posting about a product launch is a generic signal — no clear who to contact. A person posting about a challenge gives you:

| Dimension | What You Get |
|-----------|-------------|
| The person | Exactly who owns the problem |
| The context | What they're struggling with, in their own words |
| The timing | They posted now — it's top of mind |
| The hook | Your outreach can reference their exact post |

---

## Signal Types

| Signal Type | Description | Value |
|-------------|-------------|-------|
| Pain-point posts | People discussing challenges your product solves | Highest — direct need |
| Conference/event posts | People announcing attendance | High — warm pre-event outreach |
| Milestone announcements | Funding, hiring, promotions | High — transition moments with new budgets |
| Vendor evaluation posts | People asking for tool recommendations | Highest — active buying cycle |
| Thought leadership | People writing about your problem space | Medium — actively thinking about it |

---

## Evidence-Based Outreach

Every person surfaced comes with the actual post as evidence. This enables outreach that references exactly what they said — not mail merge ("I see you're the VP of Sales at {company}") but evidence-based ("I saw your post about evaluating orchestration tools for your Kubernetes migration").

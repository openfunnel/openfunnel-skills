# Social Posts Company Discovery Agent

**Agent name:** Search Millions of Social Posts to find Companies with Relevant Insights

**What it does:** Searches LinkedIn, Twitter/X, and Google for public company-level announcements and discussions matching a described topic or milestone.

---

## Input Format

**Pattern:** `Find companies posting about [topic or milestone or announcement]`

**Time frame:** last day to last year.

## Example Inputs

- `Find companies posting about their Series A round`
- `Find companies posting about growing their GTM team`
- `Find companies posting about attending RSAC conference`
- `Find companies posting about adding AI to their existing stack`

---

## What It Captures

| Signal Type | Description |
|-------------|-------------|
| Decision-maker pain posts | VP/C-level posting about challenges — stronger signal than press releases |
| Budget signals | Posts about headcount growth, new initiatives, strategic pivots |
| Vendor evaluation | Posts comparing tools, asking for recommendations, discussing migrations |
| Competitor engagement | ICP accounts interacting with competitor thought leadership |
| Conference/event signals | Companies announcing attendance, speaking, sponsoring |

## Event Signal Behavior

For conference/event queries, the agent captures signals starting ~1 month before the event through the conference dates. Three signal sources:

1. **Prospect social listening** — individual announcements of attendance
2. **Company social listening** — corporate announcements of participation
3. **Combined email discovery** — contacts from both sources

---

## When to Use This vs Other Agents

| Use Case | Use This Agent | Use Instead |
|----------|---------------|-------------|
| Company announcing a milestone publicly | Yes | — |
| Company hiring for a specific function | No | Job Posts Agent |
| Specific person posting about a topic | No | People Social Posts Agent |
| Company using a specific technology | No | Technographics Agent |
| Company matching trait + activity criteria | No | GTMWiki Agent |

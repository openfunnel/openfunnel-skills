# Live ICP

A Live ICP takes a static [ICP](icp.md) and adds the temporal layer — the live events and buying windows that tell you *when* a company needs you.

**Live ICP = ICP + Live Events / Buying Windows**

Or fully expanded:

**Live ICP = Firmographic Fit + Trait Fit + Qualifiers + Live Events**

## Live Events (What's happening right now)
Real activities that indicate pain, need, or a buying window:
- **Hiring signals** — "hiring first data engineer" = building from scratch. "3rd CISO in 2 years" = security program struggling.
- **Social signals** — executives posting about challenges, engaging with competitor content, asking for recommendations
- **Technology changes** — adopting or migrating away from tools, evaluating alternatives
- **Organizational changes** — new leadership, restructuring, M&A, layoffs
- **Product changes** — launching new products, sunsetting features, changing pricing

Live events are NOT searchable like traits. They're captured by agents that monitor your TAM 24/7 and stored as **signals**. Each signal tracks a specific activity type and collects matched accounts into an **audience**.

## Buying Windows
The period when pain, budget, and decision-maker alignment converge. A company can have pain but no budget, or budget but no urgency. Buying windows are where all three line up.

Buying windows are perishable. A signal from 3 months ago is stale. A signal from this week is hot.

## Why This Matters

- **ICP alone** = static database (Apollo, ZoomInfo). Everyone has this. It's a list. A list is spam if you don't know when to reach out.
- **ICP + Qualifiers** = sharper list. Still static, but more precise.
- **Live ICP** = the right company, with the right fit, going through something you can help with, *right now*. That's not a lead. That's a conversation.

The more layers you stack, the more relevant you are when you reach out. Relevance is the difference between being helpful and being noise.

## How It Maps to Queries

```
"Companies using Elasticsearch that are hiring for observability roles"
  firmographic: implied (tech companies)
  trait: implied (engineering-heavy)
  qualifier: uses Elasticsearch
  live event: hiring for observability

"Series B fintech companies posting about data migration challenges"
  firmographic: Series B, fintech
  trait: fintech
  qualifier: —
  live event: posting about data migration

"Find me VPs of Infra at companies migrating off Heroku"
  firmographic: implied
  trait: implied (cloud-hosted product)
  qualifier: currently on Heroku
  live event: migrating off Heroku
  people: VP of Infra
```

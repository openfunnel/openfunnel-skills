# OpenFunnel

[![npm](https://img.shields.io/npm/v/openfunnel)](https://www.npmjs.com/package/openfunnel)

### Every buying window, before anyone else sees it

A live query engine over 35M companies and 800M people. When a company's state evolves in a way that signals pain, OpenFunnel fires instantly — piped to Slack or your CRM before your competitor knows it happened.

## Install

```bash
npm install openfunnel
```

## Setup

First time, Claude Code will ask for your credentials and save them to `.env`:

```
OPENFUNNEL_API_KEY=your-api-key
OPENFUNNEL_USER_ID=your-user-id
```

Get your key at [openfunnel.ai](https://openfunnel.ai).

## Buying windows it detects

| **35M** | **800M** | **<60s** |
|:---:|:---:|:---:|
| companies tracked | people monitored | signal to alert |

**Specific Hire** — A company posted a role to build an LLM evaluation framework. Three weeks later, someone started in that role. That person now has 90 days to pick vendors and show early wins — budget is already committed, leadership already aligned.

**Functional Buildout** — A healthcare company with zero AI/ML hires suddenly posts 4 ML roles in 3 weeks. They're building an AI function from scratch. No institutional knowledge, no existing tooling, no vendor relationships. Everything is up for grabs.

**Renewal Window** — Job posting mentions "experience with Datadog required" in March → 365-day alert fires in February next year → competitor to Datadog gets alerted before renewal.

**Dissatisfaction** — "Senior DevOps Engineer — migrate our monitoring stack off legacy Nagios to a modern observability platform" → they're unhappy with what they have. Competitors and alternatives have the highest conversion rate here.

**Key Person Departure** — VP of Engineering who championed Snowflake leaves → new VP joins from a Databricks shop → re-evaluation window opens. The replacement inherits the relationship with no loyalty and fresh mandate to evaluate.

**Cross-Company Expertise & Tool Migration** — 2 people who managed HubSpot at their previous companies just joined as Head of RevOps and Sr. Sales Ops at a Series B startup. They'll push for what they know. Sell the alternative before they default to HubSpot.

## Docs

- [docs.openfunnel.dev](https://docs.openfunnel.dev)
- [API Reference](https://docs.openfunnel.dev/api-reference)

## License

MIT

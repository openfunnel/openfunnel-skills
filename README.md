# OpenFunnel Skills

**OpenFunnel turns every event in your market into pipeline** using OpenFunnel's Event Intelligence engine.

### What are Market Events for GTM?

50M companies and 1B people are moving daily in time, facing new problems you can help with:

- Jobs open up to solve very specific pain-points
- People and teams join to work on specific problems

OpenFunnel is a time-aware context graph across 1B people and 50M companies that continuously streams the custom defined events that indicate pain-points.

### Why does this matter for GTM?

Events in the external world, when inferred, can:

- Detect pain-points
- Signal intent to solve a problem
- Predict leading indicators of buying behavior

### The problem today

Most sales and GTM teams aren't watching market movements closely — because they're difficult to index, capture, and draw inference from. This leaves pipeline on the table. Things change within companies before a buying window shows up — a new hire, a migration, a team being built from scratch. By the time it's obvious, competitors are already in the deal.

Having these market events captured means GTM teams can be faster, unlock more pipeline, and be genuinely helpful to prospects when pain is just emerging — not after everyone else has noticed.

## Skills

| Skill | Description |
|-------|-------------|
| `find-companies-and-people-with-active-pain-points` | Find ICP companies with inferred pain-points from live company and people events, and the people involved |
| `find-companies-hiring-to-solve-specific-problems` | Find companies hiring to solve specific problems (daily) |
| `find-companies-posting-about-specific-things` | Find companies posting about specific things on socials (daily) |
| `find-companies-using-specific-tech-stack` | Find companies using specific tech stack (daily) |
| `find-people-having-simple-signals` | Find people tied to topics, job changes, and competitor engagement |
| `enrich-and-research` | Enrich a company with people, signals, and a recommended attack strategy |
| `enterprise-account-research` | Identify which team inside a large account has the pain, who leads it, and why now |
| `enrich-people-with-email-and-phone` | Enrich OpenFunnel people with work email addresses and phone numbers |
| `enrich-accounts-with-contacts-and-emails` | Turn a list of accounts or domains into relevant contacts with work email coverage |
| `account-scoring` | Score accounts from 0-100 using evidence-backed pain-point relevance |
| `score-and-tier` | Score accounts, group them into tiers, and re-score as new signals arrive |
| `advanced-account-setup` | Configure ICPs, integrations, and account-level controls |

## Install

```bash
npx skills add openfunnel/openfunnel --all
```

```bash
# Preview discoverable skills
npx skills add openfunnel/openfunnel --list

# Install specific skills only
npx skills add openfunnel/openfunnel --skill find-companies-hiring-to-solve-specific-problems --skill enrich-and-research
```

OpenFunnel follows the open `SKILL.md` standard used by `skills`, so it can be installed into Cursor, Claude Code, Codex, and other compatible agents.

## Setup

On first use, OpenFunnel will ask for:

```dotenv
OPENFUNNEL_API_KEY=your-api-key
OPENFUNNEL_USER_ID=your-user-id
```

These values are stored in the target repo's `.env`. If needed, OpenFunnel will also add `.env` to `.gitignore`.

Get your credentials at [openfunnel.ai](https://openfunnel.ai).

## Docs

- [Documentation](https://docs.openfunnel.dev)
- [API Reference](https://docs.openfunnel.dev/api-reference)

## License

MIT

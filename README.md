# OpenFunnel Skills

**OpenFunnel turns daily events in your market into pipeline** using OpenFunnel's Event Intelligence engine.

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

Most sales and GTM teams aren't watching market movements closely. They're difficult to index, capture, and draw inference from. This leaves pipeline on the table.

Things change within companies before a buying window shows up:

- A new hire to solve a specific problem that your software can help with
- A migration from one platform to another
- A team being built out to expand into specific categories

By the time it's obvious, competitors are already in the deal.

Having these market events captured means GTM teams can be faster, unlock more pipeline, and be genuinely helpful to prospects when pain is just emerging.

## Skills

| Skill | Description |
|-------|-------------|
| `spot-companies-and-people-with-active-pain-points` | Find companies and people with active pain-points (daily) |
| `spot-companies-hiring-to-solve-specific-problems` | Find companies hiring to solve specific problems (daily) |
| `spot-companies-using-specific-tech-stack` | Find companies using specific tech stack (daily) |
| `spot-people-changing-jobs` | Spot ICP people changing jobs (daily) |
| `enrich-and-research` | Enrich a company with people, signals, and a recommended attack strategy |
| `enterprise-account-research` | Identify which team inside a large account has the pain, who leads it, and why now |
| `enrich-people-with-email-and-phone` | Enrich OpenFunnel people with work email addresses and phone numbers |
| `enrich-accounts-with-contacts-and-emails` | Turn a list of accounts or domains into relevant contacts with work email coverage |
| `account-scoring` | Score accounts from 0-100 using evidence-backed pain-point relevance |
| `score-and-tier` | Score accounts, group them into tiers, and daily auto-rescore as new signals arrive |
| `advanced-account-setup` | Configure ICPs, integrations, and account-level controls |

## Install

```bash
npx skills add openfunnel/openfunnel-skills --all
```

```bash
# Preview discoverable skills
npx skills add openfunnel/openfunnel-skills --list

# Install specific skills only
npx skills add openfunnel/openfunnel-skills --skill spot-companies-hiring-to-solve-specific-problems --skill enrich-and-research
```

OpenFunnel follows the open `SKILL.md` standard used by `skills`, so it can be installed into Cursor, Claude Code, Codex, and other compatible agents.

## Docs

- [Documentation](https://docs.openfunnel.dev)
- [API Reference](https://docs.openfunnel.dev/api-reference)

## License

MIT

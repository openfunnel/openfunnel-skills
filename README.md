# OpenFunnel

OpenFunnel is an agent skills package for finding active pain points and buying windows inside your ideal customer profile.

It adds time-sensitive GTM intelligence on top of static account lists so agents can find relevant companies, identify the right team, surface evidence, and turn signals into action.

## Install

Recommended for portable, cross-agent installs:

```bash
npx skills add openfunnel/openfunnel
```

You can also install from npm:

```bash
npm install openfunnel
```

For most agent workflows, prefer `npx skills add`. The npm package is useful when you want OpenFunnel available as a dependency and want install-time setup to inject OpenFunnel guidance into the target project's `CLAUDE.md`.

Useful `skills` commands:

```bash
# Preview discoverable skills
npx skills add openfunnel/openfunnel --list

# Install specific skills only
npx skills add openfunnel/openfunnel --skill find-companies-having-simple-signals --skill enrich-and-research

# Install from a local checkout while developing
npx skills add .
```

OpenFunnel follows the open `SKILL.md` standard used by `skills`, so it can be installed into Cursor, Claude Code, Codex, and other compatible agents.

## What You Get

- Search for companies based on hiring, posting activity, technology usage, and other live buying signals.
- Find people connected to relevant pain, role changes, and in-market activity.
- Enrich accounts with team context, contacts, and work email coverage.
- Research large enterprise accounts to identify the team with the highest likelihood of pain.
- Score and tier accounts based on evidence-backed relevance.

## Available Skills

- `find-companies-having-simple-signals`: Find companies by what they are hiring for, posting about, or signaling in market.
- `find-people-having-simple-signals`: Find people tied to topics, job changes, and competitor engagement.
- `enrich-and-research`: Enrich a company with people, signals, and a recommended attack strategy.
- `enterprise-account-research`: Identify which team inside a large account has the pain, who leads it, and why now.
- `enrich-accounts-with-contacts-and-emails`: Turn a list of accounts or domains into relevant contacts with work email coverage.
- `account-scoring`: Score accounts from 0-100 using evidence-backed pain-point relevance.
- `score-and-tier`: Score accounts, group them into tiers, and re-score as new signals arrive.
- `advanced-account-setup`: Configure ICPs, integrations, and account-level controls.
- `find-icp-companies-with-active-buying-windows-and-the-people-involved`: Combine account discovery with contact discovery around active buying windows.

## Setup

On first use, OpenFunnel will ask for:

```dotenv
OPENFUNNEL_API_KEY=your-api-key
OPENFUNNEL_USER_ID=your-user-id
```

These values are stored in the target repo's `.env`. If needed, OpenFunnel will also add `.env` to `.gitignore`.

Get your credentials at [openfunnel.ai](https://openfunnel.ai).

## Repo Structure

- `skills/` contains the installable skills
- `CLAUDE.md` contains repo-level operating guidance for agents working inside this repository

## Docs

- [Documentation](https://docs.openfunnel.dev)
- [API Reference](https://docs.openfunnel.dev/api-reference)

## License

MIT
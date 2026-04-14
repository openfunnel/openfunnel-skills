# OpenFunnel

OpenFunnel is a skills package for finding active pain-points and buying windows in your Ideal Customer Profile.

It continuously monitors changes across companies and people, then helps GTM teams turn those changes into usable buying signals, audiences, account research, and contact enrichment workflows.

## Install

Install these skills into any compatible agent-enabled repo with:

```bash
npx skills add openfunnel/openfunnel
```

Useful variants:

```bash
# Preview discoverable skills
npx skills add openfunnel/openfunnel --list

# Install specific skills only
npx skills add openfunnel/openfunnel --skill find-companies --skill enrich-and-research

# Install from a local checkout while developing
npx skills add .
```

This repo follows the open `SKILL.md` standard used by `skills`, so it can be installed into Cursor, Claude Code, Codex, and other compatible agents.

## Available Skills

- `find-companies`
- `find-people`
- `enrich-and-research`
- `enterprise-account-research`
- `bulk-account-contact-enrichment`
- `account-scoring`
- `score-and-tier`
- `advanced-account-setup`
- `find-companies-with-active-buying-windows-and-the-people-involved`

## Setup

On first use, the skills will ask for:

```dotenv
OPENFUNNEL_API_KEY=your-api-key
OPENFUNNEL_USER_ID=your-user-id
```

They are stored in the target repo's `.env`. Get your credentials at [openfunnel.ai](https://openfunnel.ai).

## Repo Structure

- `skills/` contains the installable skills
- `api/client.ts` contains endpoint wrappers and API shape references
- `CLAUDE.md` contains repo-level operating guidance for agents working inside this repository

## Docs

- [docs.openfunnel.dev](https://docs.openfunnel.dev)
- [API Reference](https://docs.openfunnel.dev/api-reference)

## License

MIT
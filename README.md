# OpenFunnel — account + GTM intelligence

This repository contains tools and skills used to find, score and enrich accounts and people for GTM teams.

## What this repo is

- CLI + skills for account intelligence and scoring
- Data and knowledge articles under `knowledge/` and `skills/`

## Prerequisites

- Node.js 18+ and npm
- Git (for cloning and collaboration)

## Quick start

1. Install dependencies:

```
npm install
```

2. Run the CLI (example):

```
node cli.ts
```

3. Run or edit skills under `skills/`.

## Repository structure

- `cli.ts` — entrypoint CLI
- `api/` — API client and docs
- `knowledge/` — product and domain knowledge
- `skills/` — individual skill implementations (.ts + docs)

## Contributing

1. Fork or create a repo in the `openfunnel` org.
2. Clone, create a feature branch, and push PRs against `main`.

## Push to the openfunnel GitHub org

I can add a remote and push this repo to `https://github.com/openfunnel/<repo>.git` once you confirm the target repo name and ensure you have provided push access (or have authenticated `gh`/git locally).

Suggested commands to finish (example repo name `openfunnel-alg`):

```
git remote add origin https://github.com/openfunnel/openfunnel-alg.git
git branch -M main
git push -u origin main
```

Or create + push using `gh` (authenticated):

```
gh repo create openfunnel/openfunnel-alg --org openfunnel --public --source=. --remote=origin --push
```

## License

Add a license file if desired.

---
Updated README to summarize the project and next steps for pushing to GitHub.
# OpenFunnel

OpenFunnel is a search for active pain-points and buying windows in your Ideal Customer Profile.

**Start here:** [CLAUDE.md](CLAUDE.md) — the full knowledge base, repo map, and agent entry point.

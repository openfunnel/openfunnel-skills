# OpenFunnel

[![npm](https://img.shields.io/npm/v/openfunnel)](https://www.npmjs.com/package/openfunnel)

A live query engine over the movement and intent of 35M companies and 800M people.

It continuously monitors a live changelog of this activity, and lets GTM teams define and detect sequential patterns that indicate pain in natural language.

When any company's state evolves in a way that matches your pattern, OpenFunnel fires an event instantly — piped directly to Slack or your CRM with the right people behind the change and what happened.

OpenFunnel is built to detect leading indicators of pain in real-time.

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

## What you can ask

```
"Companies that just raised Series B and are hiring their first data engineering team"
"Find me VPs of Infra at companies migrating off Heroku"
"Who in my ICP posted about struggling with SOC2 compliance this month"
"Score my pipeline — who's most likely dealing with data migration pain right now"
"Companies using Elasticsearch that are hiring for observability roles"
"Which team at Capital One is building AI voice agents"
```

## Docs

- [docs.openfunnel.dev](https://docs.openfunnel.dev)
- [API Reference](https://docs.openfunnel.dev/api-reference)

## License

MIT

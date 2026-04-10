# Round-Robin on External World Events

## The Concept

Round-robin on external world events doesn't exist today. Inbound leads get round-robin'd across SDRs. External world events don't — because nobody has treated them as an inbound channel before.

When a domain-specific event fires — a company posts a job that describes your customer's pain, a decision-maker announces a strategic shift, a hiring surge signals a new function being built — that event becomes a net-new account. It enters the same assignment workflow as a form fill: enriched, scored, and round-robin'd to the next available rep.

This is what makes external events operationally identical to inbound. Detection without assignment is just a dashboard. Assignment without round-robin is just a Slack alert that everyone ignores. Round-robin is what turns signal detection into pipeline.

## How It Works

1. **Event fires** — OpenFunnel agents detect a domain-specific external event
2. **Account created/matched** — the event resolves to an account, enriched with context, contacts, and signals
3. **Scored and tiered** — the account gets scored against the customer's pain lens, placed into a tier
4. **Round-robin assigned** — the account routes to the next SDR in rotation, just like inbound
5. **SDR works it** — the rep gets an account with full context: what happened, who to contact, why it matters now

The SDR doesn't configure signals, check dashboards, or pull lists. Accounts show up in their queue because something happened in the world. Their job is to work the account — same as inbound.

## Why Round-Robin Matters Here

Without round-robin, signal intelligence becomes a power tool for the reps who know how to use it — and shelfware for everyone else. Most SDR teams won't proactively check a dashboard. They work what's in their queue.

Round-robin solves this by making external events indistinguishable from inbound in the rep's workflow:

- **No behavior change required** — reps don't need to learn a new tool or check a new dashboard. Accounts appear where they already work.
- **Even distribution** — high-value signal-sourced accounts don't pile up with one rep who checks the dashboard while others wait for inbound.
- **Accountability** — assigned accounts have an owner. Unassigned signals have none.
- **Speed to lead** — the same reason inbound gets round-robin'd. The faster someone works an external event, the more relevant the outreach. Pain is temporal — a signal from today is gold, a signal from 2 weeks ago is cold.

## The Full Loop

```
External event detected
  → Account enriched with contacts + signals
  → Scored and tiered
  → Round-robin assigned to SDR
  → SDR reaches out with evidence of pain
  → CRM updated with signal context
  → Signal continues monitoring for new events on the account
```

This is a closed loop. The rep doesn't source the account, doesn't research the account, doesn't guess why to reach out. They get an account with a reason and a window. Their job is to execute.

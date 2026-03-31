---
name: static-account-scoring
description: Score accounts in an audience based on pain-point relevance and urgency. Presents scoring model options, gathers evidence per account, and uses LLM judgment to assign 0-100 scores with reasoning. One-shot scoring.
---

# Static Account Scoring

Score accounts in an audience based on pain-point relevance and urgency.

## Conversation Flow

The agent MUST follow this sequence — do NOT skip steps.

### Step 1: List audiences for user to pick

- List audiences (see Runtime below for which tool to call)
- Present the list
- Ask: "Which audience would you like to score?"

### Step 2: User selects an audience

- Load the audience to get account IDs
- Confirm: "Got it — [audience name] with X accounts."

### Step 3: Present scoring models — MANDATORY, DO NOT SKIP

> Do NOT auto-score. Do NOT skip to results.

Present:

> How would you like to score these accounts?
>
> 1. **OpenFunnel Pain-Based Scoring** — scores each account based on how urgently they need what you sell
> 2. **Custom** — describe your own scoring criteria in plain language

- User picks 1 → proceed to Step 3a
- User picks 2 → user describes custom logic, agent interprets and applies

### Step 3a: Get pain description (Pain-Based Scoring only)

- Ask: "What pain-points does your product/service solve?
  Example: 'We help companies migrate off legacy ERPs to cloud-native'"
- User provides pain description
- This is the lens through which ALL signals will be interpreted

### Step 4: Score each account

For each account_id in the audience:

1. Gather evidence (summary + timeline + full details — see Runtime)
2. Read the evidence against the user's pain description
3. Apply the pain-based scoring rubric below
4. Assign score (0-100) + reasoning (1-2 sentences explaining why)

Sort by score descending. Present as a ranked list.

---

## Pain-Based Scoring — How to Reason

**TIME IS THE MOST IMPORTANT FACTOR.** Pain has a shelf life. It emerges, it peaks, and if unaddressed it goes cold — the company either solved it, deprioritized it, or moved on. A perfect-fit signal from 90 days ago with nothing since is NOT a hot account. It's stale. Score accordingly.

Read the timeline as a narrative, not a list. A single signal is a hint. A sequence of signals over weeks is a story. Timestamps matter as much as content.

Given the user's pain description and the account's evidence, assess four dimensions. These are NOT mechanical point buckets — use judgment. The evidence may be rich or sparse; score what you see.

### 1. Pain Relevance

Does this account show signs of having this pain?

- Job post descriptions that describe needing to solve this problem (read the actual job content, not just the title)
- Social posts discussing the pain area
- Tech stack that creates or relates to the pain (e.g. legacy tool that your product replaces)
- Industry/vertical alignment with the pain

### 2. Temporal Signal

When did the pain surface, and is it still alive? Pain goes cold. **This dimension can override everything else.**

- A highly relevant signal from 90 days ago with no follow-up = cold. The pain may be solved, deprioritized, or abandoned. **Score LOW.**
- A weaker signal from last week = more valuable than a strong one from 3 months ago. Recency wins.
- **Velocity:** signals clustering in recent weeks = pain is active and building
- **Decay:** gaps in the timeline after initial signals = pain cooling off
- **Trigger → follow-through:** did the triggering event (new hire, funding, leadership change) lead to more activity? If yes = escalating. If no = stalled.

### 3. Buying Window

Can they act on it now?

- New leadership in relevant function (someone with mandate to change)
- Recent funding (budget to spend)
- Active hiring in the area (committed to solving, building team)
- Signal stacking: multiple signal types pointing at same pain (hiring + posting about the problem + using legacy tech = high conviction)

### 4. Story Coherence

Do the signals tell a connected narrative?

- Isolated signal = maybe noise, score conservatively
- Connected signals across time = real pattern, score higher
- Example: Jan — hired VP Eng → Feb — posted about migration challenges → Mar — started hiring cloud engineers = clear escalating story
- Counter-example: one social post 80 days ago, nothing since = low confidence

**The score should reflect: "If I were selling a solution to [pain], how excited would I be about this account RIGHT NOW — today?"**

Output per account: score (0-100) + reasoning (1-2 sentences).

---

## Runtime

| Step | Function |
|------|----------|
| Step 1 | `listAudiences()` |
| Step 2 | `getAudience(audienceId)` |
| Step 4 | `getAccountsV2({ accountIds: [accountId] })` → full details + inline signal content (preferred) |

**Prefer V2 batch for scoring.** `getAccountsV2` returns inline signal content — job posting text, social post content, context — so the LLM can read actual evidence without extra calls.

> **NOTE:** Large audiences (100+) will be slow.

## Code

See [account_scoring_skill.ts](account_scoring_skill.ts) — `getAudiencesForScoring`, `getAudienceAccountIds`, `getAccountEvidence`.

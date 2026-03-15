# LinkedIn Engagement Tracking Agent

**Agent name:** Track ICPs interacting with relevant LinkedIn People and Company Profiles

**What it does:** Monitors which ICP individuals are engaging (liking, commenting) with specified LinkedIn profiles. Surfaces in-market signals based on engagement patterns.

---

## Input Format

**Input:** LinkedIn profile URL (individual or company page).

**Time frame:** last day to last year.

---

## Rules and Caveats

| Rule | Detail |
|------|--------|
| Single likes are noise | "Single likes don't mean a thing — they're spammy." Never treat one interaction as a signal. |
| Aggregate at account level | Multiple people from the same company engaging = real signal. Use the Accounts view. |
| Target thought leaders, not company pages | CEOs, CPOs, Marketing Heads, industry analysts are better profile targets. |
| System auto-qualifies | Filters out personal/irrelevant engagement by industry. |

---

## Use Cases

| Track This Profile | To Find |
|-------------------|---------|
| Your competitor's founder/CEO | Accounts in evaluation mode for competitor's category |
| Industry thought leader | People actively thinking about the problem space |
| Your own team's profiles | Warm accounts already paying attention to you |
| Competitor sales reps | Accounts being actively worked (use Competitor Spy Agent for deeper monitoring) |

---

## Signal Stacking Rules

Engagement tracking is strongest when combined with other signals:

| Engagement Signal + | Combined Interpretation |
|--------------------|------------------------|
| Hiring in same function | High-confidence buying window |
| Recent funding | Budget confirmed, evaluation active |
| Multiple decision-makers from same account | Buying committee in motion |
| Competitor content engagement declining | Dissatisfaction, possible takeout window |

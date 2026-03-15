# Data Layer & API

Current state of what's queryable and how. This changes as the platform evolves.

Full API docs: https://docs.openfunnel.dev/api-reference

---

## API Endpoints (21 total — 18 V1 + 3 V2)

Base URL: `https://api.openfunnel.dev`
Auth: `X-API-Key` + `X-User-ID` headers on all requests.

### Account (V1)

| Method | Path | Name | Description |
|--------|------|------|-------------|
| POST | `/api/v1/account/get-account-list` | List Accounts | Filter by firmographics, `include_audience_ids`, `include_signal_ids`. Paginated. |
| POST | `/api/v1/account/batch` | Get Accounts | Bulk fetch by `account_ids` or `account_domains`. Returns full profile + signals + people. |
| POST | `/api/v1/account/search-by-name-or-domain` | Search by Name/Domain | Fuzzy match. Returns `needs_clarification` if multiple matches. |
| POST | `/api/v1/account/search-by-traits` | Search by Traits | Natural language → vector similarity → instant results. Scored 0-1. |

### Account (V2)

| Method | Path | Name | Description |
|--------|------|------|-------------|
| POST | `/api/v2/account/batch` | Get Accounts V2 | Richer than V1: inline signal content (`job_posting` text, `post_content`, `context`), paginated ICP people. **Preferred for LLM scoring.** |
| GET | `/api/v2/account/filters` | Get Account Filters | Returns available filter field definitions (field_name, type, options). Call before `filtered-accounts`. |
| POST | `/api/v2/account/filtered-accounts` | List Filtered Accounts | Dynamic filters (from `/filters`), sorting by any field. Returns `account_ids` with pagination. |

### Account Search (Async)

| Method | Path | Name | Description |
|--------|------|------|-------------|
| POST | `/api/v1/account/start-search-job` | Start Search Job | Async search. Params: `query_trait`, `query_activity`. **`query_activity` does not work — traits only.** |
| GET | `/api/v1/account/poll-search-job/{job_id}` | Poll Search Job | Status: pending → running → completed → failed. Poll every 5-30s. Typical: 2-10 min. |
| GET | `/api/v1/account/get-search-results/{job_id}` | Get Search Results | Returns ranked results with `reasoning`, `evidence_snippets`, `relevance_score` (0-10). |

### Account Timeline

| Method | Path | Name | Description |
|--------|------|------|-------------|
| GET | `/api/v1/account/{account_id}/summary` | Get Account Summary | Overview: signal counts, top 3 contacts, CRM status, tags. |
| GET | `/api/v1/account/{account_id}/timeline` | Get Account Timeline | Chronological events. Params: `days` (1-365), `alert_types`, `limit`, `offset`. |

### Audience

| Method | Path | Name | Description |
|--------|------|------|-------------|
| POST | `/api/v1/audience/get-audience-list` | List Audiences | All saved audience lists. Paginated. |
| POST | `/api/v1/audience/` | Get Audience | Returns `account_ids` + `audience_people` (person_id, name, role, email, linkedin_url, signals). |

### Signal

| Method | Path | Name | Description |
|--------|------|------|-------------|
| POST | `/api/v1/signal/get-signal-list` | List Signals | Filter by type: `hiring`, `socials`, `linkedin_engagement`, `job_change`. Paginated. |
| POST | `/api/v1/signal/` | Get Signal | Returns `account_ids`, `signal_people`, filterable by date range. |

### Insights

| Method | Path | Name | Description |
|--------|------|------|-------------|
| GET | `/api/v1/insights/feed` | Insights Feed | Cross-account insights. Filter by `days` (1-90), `alert_type`, `sentiment`, `account_ids`. |
| GET | `/api/v1/insights/alerts` | My Alerts | User notification history. Scoped to authenticated user. |
| GET | `/api/v1/insights/{insight_id}` | Insight Detail | Full detail: underlying signal, related insights, deal stage. |

### ICP

| Method | Path | Name | Description |
|--------|------|------|-------------|
| GET | `/api/v1/icp/list` | List ICPs | All ICP profiles: target roles, employee range, funding range, locations. |

### Enrichment

| Method | Path | Name | Description |
|--------|------|------|-------------|
| POST | `/api/v1/enrich/deep-enrich` | Deep Enrich | Async company qualification + people enrichment. Takes `domain`, optional `goal`, `icp_id`. 15-30 min processing. |

---

## Searchable vs Not Searchable

| Query Type | Searchable? | How | Endpoint |
|-----------|-------------|-----|----------|
| Trait (e.g., "AI-native ERP companies") | Yes | Vector similarity, instant | `search-by-traits` |
| Trait (async, deeper) | Yes | Async job, 2-10 min, ranked with reasoning | `start-search-job` (trait only) |
| Firmographic filters (industry, size, geo) | Yes | Structured filters | `get-account-list` |
| Company name/domain | Yes | Fuzzy match | `search-by-name-or-domain` |
| Activity (e.g., "companies hiring for Kubernetes") | No — not directly | Only via pre-built audiences | `get-account-list` with `include_audience_ids` |
| Signal (e.g., "companies with recent funding") | No — not directly | Only via pre-built signals | `get-account-list` with `include_signal_ids` |
| Trait + Activity combined | No — not as single query | Multi-step: trait search + audience/signal filter | Combine endpoints |

### Critical Distinction

**Traits** = searchable. Natural language query → vector similarity → instant results.

**Activities** = NOT searchable as free-text. Activities are detected by live search agents and stored as **signals**. Each signal's matched accounts are collected in an audience (1:1). You cannot search "companies posting about AI safety" unless an agent is already tracking that signal.

---

## Data Architecture

```
Pre-built Databases (Sandboxes)
  └── Copied to customer account on onboard
       ├── Accounts (companies)
       │    ├── Firmographics (searchable)
       │    ├── Traits (searchable via search-by-traits)
       │    └── Activities (only via audience/signal membership)
       ├── Signals (buying signals — time-sensitive activity)
       │    └── Types: hiring, socials, linkedin_engagement, job_change
       │    └── Detected by live search agents, stored with matched accounts
       ├── Audiences (account collections — 1:1 with signals)
       │    └── Container for accounts + people matched by a signal
       └── Live Search Agents (keep running daily)
            └── Output → signal + audience of matched accounts
```

---

## Signals and Audiences

| Concept | What It Is | Example | Queryable Via |
|---------|-----------|---------|---------------|
| Signal | A buying signal — time-sensitive activity indicating intent, pain, or need. Detected by live search agents. The core concept. | "Companies hiring for Kubernetes engineers", "New VP Engineering hired at Acme" | `get-signal-list` → `get-signal`, `insights/feed` |
| Audience | A collection of accounts. Just a container — groups accounts matched by a signal (or any other criteria). 1:1 with signals. | Accounts matched by the "hiring for Kubernetes" signal | `get-audience-list` → `get-audience` |

Both are pre-computed. Neither supports free-text search. You list them, browse them, or filter accounts by them. Signals are the primary concept — audiences are the resulting account collections.

---

## Where People Data Lives

There is no standalone "org chart" endpoint. People data comes from:

| Source | What You Get |
|--------|-------------|
| `POST /account/batch` (V1) or `POST /v2/account/batch` (V2) | All people at the company — full profiles with roles, emails, LinkedIn |
| `GET /account/{id}/summary` | Top 3 key contacts |
| `POST /audience/` (Get Audience) | People in the audience with `person_id`, `name`, `role`, `email`, `linkedin_url`, `direct_signals` |
| `POST /signal/` (Get Signal) | `signal_people` — people associated with a specific signal |

---

## Sandboxes (Public Pre-Built Verticals)

Pre-built databases available at openfunnel.ai/sandbox. Data copied to customer account on onboard.

| Sandbox | Domain |
|---------|--------|
| AI-Native ERP | ERP companies building with AI |
| Voice AI | Voice AI/conversational AI companies |
| Vibe Coding | AI-assisted coding tools |
| Vector DB | Vector database companies |
| Startups | Early-stage startups |
| Physical AI | Robotics/physical AI |
| Product Analytics | Analytics platforms |
| LLMOps | LLM operations tooling |
| Inference | AI inference infrastructure |
| Geo | Geospatial/location companies |
| Document Intelligence | Document processing AI |
| AI Code Review | Code review AI tools |

---

## Known Limitations

- `start-search-job` `query_activity` parameter exists in the API but **does not work** — traits only.
- No combined trait + activity search in a single query.
- Activities are not indexed for free-text search. They exist only as audience/signal membership.
- Combining multiple audiences/signals requires AND logic via `include_audience_ids` + `include_signal_ids` on `get-account-list`.

---

## V2 Batch — Inline Signal Content

The V2 batch endpoint (`POST /api/v2/account/batch`) returns signals expanded inline per account. This is critical for LLM-driven analysis — the model can read actual job descriptions and social posts directly.

Each signal type is keyed by `discovered_signal_id`:

| Signal Type | Key Fields | Why It Matters |
|-------------|-----------|----------------|
| `hiring` | `job_title`, `job_posting` (full text), `job_posted_at`, `context`, `people` | LLM reads actual job content for pain signals, not just titles |
| `socials` | `post_content`, `posted_at`, `platform`, `poster_person`, `context` | Social posts discussing pain areas |
| `linkedin_engagement` | `post_content`, `interaction_type`, `interactor_details`, `posted_at` | ICP people engaging with relevant content |
| `job_changes` | `change_type`, `person_details`, `context`, `signal_date` | New leadership = new mandate |

All signal types include: `signal_id`, `signal_name`, `discovered_signal_id`, `signal_date`, `detected_by_openfunnel_at`, `context`, `people`.

### V2 Filters

`GET /api/v2/account/filters` returns dynamic filter definitions. Each filter has:
- `field_name` — the key to use in filter requests
- `type` — data type (string, number, boolean, etc.)
- `options` — available values (for enum-like fields)
- `description` — human-readable explanation

Use the filter definitions to build requests for `POST /api/v2/account/filtered-accounts`.

/**
 * OpenFunnel API functions.
 *
 * Base URL: https://api.openfunnel.dev
 * Auth: X-API-Key and X-User-ID headers on all requests.
 * Full docs: https://docs.openfunnel.dev/api-reference
 */

const BASE_URL = "https://api.openfunnel.dev";

function headers(): Record<string, string> {
  return {
    "X-API-Key": process.env.OPENFUNNEL_API_KEY ?? "",
    "X-User-ID": process.env.OPENFUNNEL_USER_ID ?? "",
    "Content-Type": "application/json",
  };
}

async function post(path: string, body: Record<string, any> = {}): Promise<any> {
  const resp = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`POST ${path} failed: ${resp.status} ${resp.statusText}`);
  return resp.json();
}

async function get(path: string, params: Record<string, any> = {}): Promise<any> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) query.set(k, String(v));
  }
  const qs = query.toString();
  const url = qs ? `${BASE_URL}${path}?${qs}` : `${BASE_URL}${path}`;
  const resp = await fetch(url, { headers: headers() });
  if (!resp.ok) throw new Error(`GET ${path} failed: ${resp.status} ${resp.statusText}`);
  return resp.json();
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

/**
 * Search companies by describing what they do or what traits they have.
 *
 * Natural language query → vector similarity → instant results scored 0-1.
 * Use this for trait-based queries like "AI-native ERP companies" or "Series B fintech".
 *
 * @param query - Natural language description (1-500 chars).
 * @param limit - Max results (1-100, default 25).
 * @returns {query, results: [{id, name, domain, description, similarity, technographics, in_crm, is_exported}], total}
 */
export async function searchByTraits(query: string, limit = 25) {
  return post("/api/v1/account/search-by-traits", { query, limit });
}

/**
 * List accounts with optional filters and pagination.
 *
 * This is the main filtering endpoint. Use includeAudienceIds and includeSignalIds
 * to narrow results to accounts in specific audiences or with specific signals (AND logic).
 *
 * @returns {accounts: [{id, domain}], total_count, pagination: {limit, offset, total_count, has_more}}
 */
export async function listAccounts(opts: {
  includeAudienceIds?: number[];
  includeSignalIds?: number[];
  minEmployeeCount?: number;
  maxEmployeeCount?: number;
  fundingStages?: string[];
  hqCountryCodes?: string[];
  isImported?: boolean;
  isPresentInCrm?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const filters: Record<string, any> = {};
  if (opts.includeAudienceIds) filters.include_audience_ids = opts.includeAudienceIds;
  if (opts.includeSignalIds) filters.include_signal_ids = opts.includeSignalIds;
  if (opts.minEmployeeCount !== undefined) filters.min_employee_count = opts.minEmployeeCount;
  if (opts.maxEmployeeCount !== undefined) filters.max_employee_count = opts.maxEmployeeCount;
  if (opts.fundingStages) filters.funding_stages = opts.fundingStages;
  if (opts.hqCountryCodes) filters.hq_country_codes = opts.hqCountryCodes;
  if (opts.isImported !== undefined) filters.is_imported = opts.isImported;
  if (opts.isPresentInCrm !== undefined) filters.is_present_in_crm = opts.isPresentInCrm;

  const body: Record<string, any> = {
    pagination: { limit: opts.limit ?? 50, offset: opts.offset ?? 0 },
  };
  if (Object.keys(filters).length > 0) body.filters = filters;
  return post("/api/v1/account/get-account-list", body);
}

/**
 * Get full account details in bulk by IDs or domains.
 *
 * Returns everything: firmographics, CRM data, signals, and all people/contacts.
 * This is where people data lives — there is no separate org chart endpoint.
 *
 * @param accountIds - List of account IDs. Provide this OR accountDomains.
 * @param accountDomains - List of domains (e.g. ["stripe.com"]). Provide this OR accountIds.
 * @returns {accounts: [full account objects with people], total_count}
 */
export async function getAccounts(opts: {
  accountIds?: number[];
  accountDomains?: string[];
} = {}) {
  const body: Record<string, any> = {};
  if (opts.accountIds) body.account_ids = opts.accountIds;
  if (opts.accountDomains) body.account_domains = opts.accountDomains;
  return post("/api/v1/account/batch", body);
}

/**
 * Fuzzy search for a company by name or domain.
 *
 * Use when a user mentions a specific company. Returns needs_clarification=true
 * if multiple matches found.
 *
 * @param query - Company name or domain (1-200 chars).
 * @param limit - Max results (1-50, default 10).
 * @returns {query, matches: [{id, name, domain, employee_count, funding_stage, industry}],
 *           total_matches, unique_domains, needs_clarification}
 */
export async function searchByNameOrDomain(query: string, limit = 10) {
  return post("/api/v1/account/search-by-name-or-domain", { query, limit });
}

// ---------------------------------------------------------------------------
// Account Search (Async)
// ---------------------------------------------------------------------------

/**
 * Start an async search job. Returns a job_id to poll.
 *
 * Deeper than searchByTraits — returns ranked results with reasoning,
 * evidence snippets, and relevance scores (0-10). Takes 2-10 minutes.
 *
 * WARNING: queryActivity parameter exists but does NOT work yet. Traits only.
 *
 * @param queryTrait - Natural language trait description.
 * @param queryActivity - NOT FUNCTIONAL. Exists in API but returns no results.
 * @returns {job_id, status: "pending", message}
 */
export async function startSearchJob(queryTrait?: string, queryActivity?: string) {
  return post("/api/v1/account/start-search-job", {
    query_trait: queryTrait,
    query_activity: queryActivity,
  });
}

/**
 * Check status of an async search job.
 *
 * Poll every 5-10s for small queries, 10-30s for large. Typical: 2-10 min.
 *
 * @param jobId - From startSearchJob response.
 * @returns {job_id, status: "pending"|"running"|"completed"|"failed", created_at, message}
 */
export async function pollSearchJob(jobId: string) {
  return get(`/api/v1/account/poll-search-job/${jobId}`);
}

/**
 * Get results of a completed async search job.
 *
 * Only call when pollSearchJob returns status="completed".
 *
 * @param jobId - From startSearchJob response.
 * @returns {job_id, status, results: [{rank, account_id, account_name, account_url,
 *           employee_count, funding_stage, location, reasoning, evidence_snippets,
 *           relevance_score}], total_count}
 */
export async function getSearchResults(jobId: string) {
  return get(`/api/v1/account/get-search-results/${jobId}`);
}

/**
 * Start an async search and wait for results. Convenience wrapper.
 *
 * @param queryTrait - Natural language trait description.
 * @param pollInterval - Milliseconds between polls (default 10000).
 * @param timeout - Max milliseconds to wait (default 600000).
 * @returns Search results, same as getSearchResults.
 * @throws Error if job fails or times out.
 */
export async function searchAndWait(
  queryTrait: string,
  pollInterval = 10_000,
  timeout = 600_000,
) {
  const job = await startSearchJob(queryTrait);
  const jobId = job.job_id;
  let elapsed = 0;
  while (elapsed < timeout) {
    const status = await pollSearchJob(jobId);
    if (status.status === "completed") return getSearchResults(jobId);
    if (status.status === "failed") throw new Error(`Search job ${jobId} failed: ${status.message}`);
    await new Promise((r) => setTimeout(r, pollInterval));
    elapsed += pollInterval;
  }
  throw new Error(`Search job ${jobId} did not complete within ${timeout}ms`);
}

// ---------------------------------------------------------------------------
// Account Timeline
// ---------------------------------------------------------------------------

/**
 * Get a quick overview of an account.
 *
 * Single-call summary with signal counts, top 3 key contacts, CRM status, and tags.
 *
 * @param accountId - The account ID.
 * @returns {account, signal_counts, recent_signals, people_count, key_contacts, crm_status, tags}
 */
export async function getAccountSummary(accountId: number) {
  return get(`/api/v1/account/${accountId}/summary`);
}

/**
 * Get chronological activity timeline for an account.
 *
 * @param accountId - The account ID.
 * @param days - Lookback period (1-365, default 30).
 * @param alertTypes - Comma-separated: "openfunnel", "crm".
 * @param limit - 1-500, default 50.
 * @param offset - Default 0.
 * @returns {account_id, account_name, events: [{event_id, event_type, event_date,
 *           title, description, source, metadata}], total_events, pagination}
 */
export async function getAccountTimeline(
  accountId: number,
  days = 30,
  alertTypes?: string,
  limit = 50,
  offset = 0,
) {
  const params: Record<string, any> = { days, limit, offset };
  if (alertTypes) params.alert_types = alertTypes;
  return get(`/api/v1/account/${accountId}/timeline`, params);
}

// ---------------------------------------------------------------------------
// Audience
// ---------------------------------------------------------------------------

/**
 * List all saved audience lists.
 *
 * Audiences are pre-computed segments built by discovery agents.
 * They contain accounts + people matching specific criteria.
 *
 * @param limit - 1-500, default 50.
 * @param offset - Default 0.
 * @returns {audiences: [{audience_id, audience_name, audience_type}], total_count, pagination}
 */
export async function listAudiences(limit = 50, offset = 0) {
  return post("/api/v1/audience/get-audience-list", { limit, offset });
}

/**
 * Create a new audience with a name and a set of account IDs.
 *
 * Used by the score-and-tier skill to pipe tiered accounts into named audiences
 * (e.g. "Tier-1", "Tier-2", "Tier-3").
 *
 * @param name - Audience name (e.g. "Tier-1").
 * @param accountIds - Account IDs to include in this audience.
 * @returns {audience_id, audience_name, total_accounts}
 */
export async function createAudience(name: string, accountIds: number[]) {
  return post("/api/v1/audience/create", { audience_name: name, account_ids: accountIds });
}

/**
 * Add accounts to an existing audience.
 *
 * Used by dynamic scoring to add newly scored/tiered accounts to their
 * respective tier audience without recreating it.
 *
 * @param audienceId - The audience to add accounts to.
 * @param accountIds - Account IDs to add.
 * @returns {audience_id, added_count, total_accounts}
 */
export async function addAccountsToAudience(audienceId: number, accountIds: number[]) {
  return post("/api/v1/audience/add-accounts", { audience_id: audienceId, account_ids: accountIds });
}

/**
 * Get all members of an audience with full enriched data.
 *
 * Returns accounts and people — including person_id, name, role, email,
 * linkedin_url, joined_company_at, crm_status, and direct_signals.
 *
 * @param audienceId - The audience ID.
 * @returns {audience_id, audience_name, audience_type, total_accounts, total_people,
 *           account_ids, audience_people: [{person details}]}
 */
export async function getAudience(audienceId: number) {
  return post("/api/v1/audience/", { audience_id: audienceId });
}

// ---------------------------------------------------------------------------
// Signal
// ---------------------------------------------------------------------------

/**
 * List signals with optional type filtering.
 *
 * Signal types: "hiring", "socials", "linkedin_engagement", "job_change".
 *
 * @param signalTypes - Filter to specific types.
 * @param limit - 1-500, default 50.
 * @param offset - Default 0.
 * @returns {signals: [{signal_id, signal_name, signal_type}], total_count, pagination}
 */
export async function listSignals(signalTypes?: string[], limit = 50, offset = 0) {
  const body: Record<string, any> = { pagination: { limit, offset } };
  if (signalTypes) body.filters = signalTypes;
  return post("/api/v1/signal/get-signal-list", body);
}

/**
 * Get details for a specific signal.
 *
 * @param signalId - The signal ID.
 * @param dateFrom - Inclusive start date (YYYY-MM-DD).
 * @param dateTo - Non-inclusive end date (YYYY-MM-DD).
 * @returns {signal_id, signal_name, signal_type, account_ids, total_accounts,
 *           signal_people, total_people}
 */
export async function getSignal(signalId: number, dateFrom?: string, dateTo?: string) {
  const body: Record<string, any> = { signal_id: signalId };
  const filters: Record<string, string> = {};
  if (dateFrom) filters.date_from = dateFrom;
  if (dateTo) filters.date_to = dateTo;
  if (Object.keys(filters).length > 0) body.filters = filters;
  return post("/api/v1/signal/", body);
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

/**
 * Cross-account insights feed. What's been happening recently.
 *
 * @param days - Lookback period (1-90, default 7).
 * @param alertType - "openfunnel" or "crm".
 * @param sentiment - "positive", "negative", or "neutral".
 * @param accountIds - Filter to specific accounts.
 * @param limit - 1-500, default 50.
 * @param offset - Default 0.
 * @returns {total_insights, accounts_represented, has_more,
 *           insights: [{insight_id, account_id, account_name, account_domain,
 *           alert_text, alert_type, alert_date, sentiment, discovered_signal_id,
 *           deal_stage, amount, signal_link}]}
 */
export async function getInsightsFeed(opts: {
  days?: number;
  alertType?: string;
  sentiment?: string;
  accountIds?: number[];
  limit?: number;
  offset?: number;
} = {}) {
  const params: Record<string, any> = {
    days: opts.days ?? 7,
    limit: opts.limit ?? 50,
    offset: opts.offset ?? 0,
  };
  if (opts.alertType) params.alert_type = opts.alertType;
  if (opts.sentiment) params.sentiment = opts.sentiment;
  if (opts.accountIds) params.account_ids = opts.accountIds.join(",");
  return get("/api/v1/insights/feed", params);
}

/**
 * User notification history. Scoped to the authenticated user.
 *
 * @param days - Lookback (1-30, default 1).
 * @param limit - 1-100, default 20.
 * @param offset - Default 0.
 * @returns {total_alerts, has_more, net_new_account_count,
 *           alerts: [{alert metadata, recipient, insight_count, account_count,
 *           matched_account_ids, insights}]}
 */
export async function getMyAlerts(days = 1, limit = 20, offset = 0) {
  return get("/api/v1/insights/alerts", { days, limit, offset });
}

/**
 * Get full detail for a single insight.
 *
 * Includes the underlying signal data and related insights.
 *
 * @param insightId - The insight ID.
 * @returns {insight: {id, account_id, alert_text, alert_type, sentiment, deal_stage, amount},
 *           underlying_signal: {signal_id, type, activity_type, dates, links, context, content},
 *           related_insights}
 */
export async function getInsightDetail(insightId: number) {
  return get(`/api/v1/insights/${insightId}`);
}

// ---------------------------------------------------------------------------
// ICP
// ---------------------------------------------------------------------------

/**
 * List all ICP profiles.
 *
 * @returns {icps: [{id, name, target_roles, min_employee, max_employee,
 *           min_funding, max_funding, location, sub_locations,
 *           people_locations, people_sub_locations}], total_count}
 */
export async function listIcps() {
  return get("/api/v1/icp/list");
}

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------

/**
 * Trigger async deep enrichment for a company. Takes 15-30 minutes.
 *
 * Runs full qualification + people discovery. Use when a company isn't in
 * the database yet or needs fresh enrichment.
 *
 * @param domain - Company domain (e.g. "stripe.com").
 * @param goal - Custom search goal.
 * @param icpId - ICP profile to qualify against.
 * @param targetIcpRoles - Specific roles to find.
 * @param timeframe - Days lookback (1-365, default 90).
 * @param maxJobsToCheck - Job posts to scan (1-500, default 200).
 * @returns {status, account_id, domain, message}
 */
export async function deepEnrich(opts: {
  domain: string;
  goal?: string;
  icpId?: number;
  targetIcpRoles?: string[];
  timeframe?: number;
  maxJobsToCheck?: number;
}) {
  const body: Record<string, any> = {
    domain: opts.domain,
    timeframe: opts.timeframe ?? 90,
    max_jobs_to_check: opts.maxJobsToCheck ?? 200,
  };
  if (opts.goal) body.goal = opts.goal;
  if (opts.icpId) body.icp_id = opts.icpId;
  if (opts.targetIcpRoles) body.target_icp_roles = opts.targetIcpRoles;
  return post("/api/v1/enrich/deep-enrich", body);
}

// ---------------------------------------------------------------------------
// V2 Endpoints
// ---------------------------------------------------------------------------

/**
 * Get full account details in bulk (V2) — with inline signal content and paginated ICP people.
 *
 * V2 batch returns richer data than V1: each signal type (hiring, socials, linkedin_engagement,
 * job_changes) is expanded inline with full content. Hiring signals include `job_posting` text,
 * social signals include `post_content`, all include `context` and timestamps.
 *
 * This is the preferred endpoint for LLM scoring — inline signal content means the LLM can
 * read actual job descriptions and social posts without separate API calls.
 *
 * @param accountIds - List of account IDs. Provide this OR accountDomains.
 * @param accountDomains - List of domains. Provide this OR accountIds.
 * @param icpPeoplePage - Page number for ICP people (1-indexed, default 1).
 * @param icpPeoplePageSize - People per page (1-500, default 100).
 * @returns {accounts: [{id, name, website, linkedin_url, firmographics, technographics, traits,
 *           hiring: {[signal_id]: {job_title, job_posting, job_posted_at, context, people}},
 *           socials: {[signal_id]: {post_content, posted_at, platform, context, poster_person}},
 *           linkedin_engagement: {[signal_id]: {post_content, interaction_type, interactor_details}},
 *           job_changes: {[signal_id]: {change_type, person_details, context}},
 *           icp_people, icp_people_total_count, icp_people_has_more,
 *           signal_count, crm_details, crm_status}], total_count}
 */
export async function getAccountsV2(opts: {
  accountIds?: number[];
  accountDomains?: string[];
  icpPeoplePage?: number;
  icpPeoplePageSize?: number;
} = {}) {
  const body: Record<string, any> = {};
  if (opts.accountIds) body.account_ids = opts.accountIds;
  if (opts.accountDomains) body.account_domains = opts.accountDomains;
  if (opts.icpPeoplePage) body.icp_people_page = opts.icpPeoplePage;
  if (opts.icpPeoplePageSize) body.icp_people_page_size = opts.icpPeoplePageSize;
  return post("/api/v2/account/batch", body);
}

/**
 * Get available filter field definitions for V2 account listing.
 *
 * Returns all filter fields with their types, descriptions, and available options.
 * Use this to discover what filters are available before calling getFilteredAccounts.
 *
 * @returns {filters: [{field_name, description, type, required, options, schema_description}]}
 */
export async function getAccountFilters() {
  return get("/api/v2/account/filters");
}

/**
 * List account IDs with V2 dynamic filters and sorting.
 *
 * Filter fields are dynamic — call getAccountFilters() first to discover available fields.
 * Supports sorting by any field (default: insights_count desc).
 *
 * @param filters - Key-value filter object using V2 field names from /filters endpoint.
 * @param sortKey - Field to sort by (default "insights_count").
 * @param sortDirection - "asc" or "desc" (default "desc").
 * @param page - 0-indexed page number (default 0).
 * @param pageSize - Results per page (1-500, default 50).
 * @returns {account_ids: number[], total_count, page, page_size, has_more}
 */
export async function getFilteredAccounts(opts: {
  filters?: Record<string, any>;
  sortKey?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const body: Record<string, any> = {
    page: opts.page ?? 0,
    page_size: opts.pageSize ?? 50,
  };
  if (opts.filters) body.filters = opts.filters;
  if (opts.sortKey) body.sort_key = opts.sortKey;
  if (opts.sortDirection) body.sort_direction = opts.sortDirection;
  return post("/api/v2/account/filtered-accounts", body);
}

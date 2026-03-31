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

// searchByTraits — coming soon (vector similarity search)
// startSearchJob / pollSearchJob / getSearchResults / searchAndWait — coming soon

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
 * @returns {signals: [{signal_id, signal_name, signal_type, status, repeat,
 *           icp: {id, name, target_roles, min_employee, max_employee, ...}}], total_count, pagination}
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
 * @returns {signal_id, signal_name, signal_type, status, repeat, total_accounts, total_people,
 *           icp: {id, name, target_roles, min_employee, max_employee, min_funding, max_funding,
 *           location, sub_locations, people_locations, people_sub_locations},
 *           account_ids, signal_people: [{person_id, person_name, person_role, person_email,
 *           person_location, person_linkedin_url, joined_company_at, person_crm_status,
 *           person_team_name, account_id, account_name, account_domain, direct_signals}]}
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
// Signal Deploy
// ---------------------------------------------------------------------------

/** Common options shared across all signal deploy endpoints. */
interface SignalDeployBase {
  name: string;
  icpId?: number;
  repeat?: boolean;
  accountAudienceName?: string;
  peopleAudienceName?: string;
  maxCreditLimit?: number;
  enableSafeCrmAddition?: boolean;
}

function buildSignalDeployBody(opts: SignalDeployBase): Record<string, any> {
  const body: Record<string, any> = { name: opts.name };
  if (opts.icpId) body.icp_id = opts.icpId;
  if (opts.repeat !== undefined) body.repeat = opts.repeat;
  if (opts.accountAudienceName) body.account_audience_name = opts.accountAudienceName;
  if (opts.peopleAudienceName) body.people_audience_name = opts.peopleAudienceName;
  if (opts.maxCreditLimit) body.max_credit_limit = opts.maxCreditLimit;
  if (opts.enableSafeCrmAddition !== undefined) body.enable_safe_crm_addition = opts.enableSafeCrmAddition;
  return body;
}

/**
 * Deploy a deep hiring signal agent.
 *
 * Searches millions of job postings to find companies whose hiring activity
 * matches the described goal or pain point. Job posts are modern RFPs —
 * budget is committed, leadership is aligned.
 *
 * @param opts.searchQuery - Hiring goal (e.g., "companies hiring AI engineers", "companies building voice agents").
 * @param opts.timeframe - Days lookback (1-180).
 * @returns Signal deployment confirmation.
 */
export async function deployDeepHiringSignal(opts: SignalDeployBase & {
  searchQuery: string;
  timeframe?: number;
}) {
  const body = buildSignalDeployBody(opts);
  body.search_query = opts.searchQuery;
  if (opts.timeframe) body.timeframe = opts.timeframe;
  return post("/api/v1/signal/deploy/deep-hiring-agent", body);
}

/**
 * Deploy a social listening signal agent.
 *
 * Searches LinkedIn, Twitter/X, and Google for posts matching a keyword.
 * Can target companies (account-level) or individual people.
 *
 * @param opts.searchQuery - LinkedIn search keyword (e.g., "AI tools", "SOC2 compliance").
 * @param opts.signalTarget - "account" for company posts, "people" for individual posts. Default: "account".
 * @param opts.timeframe - Days lookback (1-180).
 * @returns Signal deployment confirmation.
 */
export async function deploySocialListeningSignal(opts: SignalDeployBase & {
  searchQuery: string;
  signalTarget?: "account" | "people";
  timeframe?: number;
}) {
  const body = buildSignalDeployBody(opts);
  body.search_query = opts.searchQuery;
  if (opts.signalTarget) body.signal_target = opts.signalTarget;
  if (opts.timeframe) body.timeframe = opts.timeframe;
  return post("/api/v1/signal/deploy/social-listening-agent", body);
}

/**
 * Deploy a technography search signal agent.
 *
 * Infers technology stack from job postings to find companies using
 * or hiring for specific tools, platforms, or technologies.
 *
 * @param opts.technographicList - List of technologies (e.g., ["Snowflake", "Databricks"]).
 * @param opts.technographicVariations - Alternate names/variations of the technologies.
 * @param opts.technographyContext - Additional context for the search.
 * @param opts.excludeCompanyName - Company name to exclude from results.
 * @param opts.timeframe - Days lookback (1-365).
 * @returns Signal deployment confirmation.
 */
export async function deployTechnographySignal(opts: SignalDeployBase & {
  technographicList: string[];
  technographicVariations?: string[];
  technographyContext?: string;
  excludeCompanyName?: string;
  timeframe?: number;
}) {
  const body = buildSignalDeployBody(opts);
  body.technographic_list = opts.technographicList;
  if (opts.technographicVariations) body.technographic_variations = opts.technographicVariations;
  if (opts.technographyContext) body.technography_context = opts.technographyContext;
  if (opts.excludeCompanyName) body.exclude_company_name = opts.excludeCompanyName;
  if (opts.timeframe) body.timeframe = opts.timeframe;
  return post("/api/v1/signal/deploy/technography-search-agent", body);
}

/**
 * Deploy an ICP job change signal agent.
 *
 * Monitors LinkedIn for ICP professionals who recently joined new companies.
 * Filters out internal promotions — only surfaces genuine new hires.
 *
 * @returns Signal deployment confirmation.
 */
export async function deployIcpJobChangeSignal(opts: SignalDeployBase) {
  const body = buildSignalDeployBody(opts);
  return post("/api/v1/signal/deploy/icp-job-change-agent", body);
}

/**
 * Deploy a competitor engagement signal agent.
 *
 * Monitors a LinkedIn profile (person or company) to track which ICP
 * people are engaging with it (liking, commenting). Surfaces in-market signals.
 *
 * @param opts.linkedinUrl - LinkedIn profile URL to monitor.
 * @param opts.timeframe - Days lookback (1-180, default 7).
 * @returns Signal deployment confirmation.
 */
export async function deployCompetitorEngagementSignal(opts: SignalDeployBase & {
  linkedinUrl: string;
  timeframe?: number;
}) {
  const body = buildSignalDeployBody(opts);
  body.linkedin_url = opts.linkedinUrl;
  if (opts.timeframe) body.timeframe = opts.timeframe;
  return post("/api/v1/signal/deploy/competitor-engagement-agent", body);
}

/**
 * Deploy a competitor activity signal agent.
 *
 * Scans a competitor sales rep's LinkedIn activity to surface which accounts
 * they are actively engaging with. Alerts when competitors enter your territory.
 *
 * @param opts.linkedinUrl - LinkedIn profile URL of competitor salesperson to monitor.
 * @param opts.timeframe - Days lookback (1-180, default 7).
 * @returns Signal deployment confirmation.
 */
export async function deployCompetitorActivitySignal(opts: SignalDeployBase & {
  linkedinUrl: string;
  timeframe?: number;
}) {
  const body = buildSignalDeployBody(opts);
  body.linkedin_url = opts.linkedinUrl;
  if (opts.timeframe) body.timeframe = opts.timeframe;
  return post("/api/v1/signal/deploy/competitor-activity-agent", body);
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
// People
// ---------------------------------------------------------------------------

/**
 * Get people details in bulk by IDs.
 *
 * Returns full person profiles including role, email, phone, team, department,
 * seniority, associated account, and direct signals.
 *
 * @param peopleIds - List of people IDs.
 * @returns {people: [{person_id, person_name, person_role, person_email, person_location,
 *           person_linkedin_url, joined_company_at, person_crm_status, person_phone_number,
 *           person_team_name, department, seniority, account_id, account_name, account_domain,
 *           reasoning, direct_signals, connected_crm, crm_contact_id, crm_owner_id}], total_count}
 */
export async function getPeople(peopleIds: number[]) {
  return post("/api/v1/people/batch", { people_ids: peopleIds });
}

/**
 * Get available filter field definitions for people listing.
 *
 * Returns all filter fields with types, descriptions, and available options.
 * Use this to discover what filters are available before calling getFilteredPeople.
 *
 * @returns {filters: [{field_name, description, type, required, options, schema_description}]}
 */
export async function getPeopleFilters() {
  return get("/api/v1/people/filters");
}

/**
 * List people IDs with dynamic filters and sorting.
 *
 * Filter fields are dynamic — call getPeopleFilters() first to discover available fields.
 *
 * @param filters - Key-value filter object using field names from /people/filters endpoint.
 * @param sortKey - Field to sort by (default "latest_signal_date").
 * @param sortDirection - "asc" or "desc" (default "desc").
 * @param page - 0-indexed page number (default 0).
 * @param pageSize - Results per page (1-500, default 50).
 * @returns {people_ids: number[], total_count, total_accounts_count, page, page_size, has_more}
 */
export async function getFilteredPeople(opts: {
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
  return post("/api/v1/people/filtered-people", body);
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

/**
 * Enrich a single account by domain. Returns firmographic data.
 *
 * Lighter than deepEnrich — just resolves and enriches basic company info.
 * Synchronous — returns immediately.
 *
 * @param domain - Company domain (e.g. "stripe.com"). 1-200 chars.
 * @returns {account_id, name, domain, linkedin_url, is_new_account, firmographics, fields_updated}
 */
export async function enrichAccount(domain: string) {
  return post("/api/v1/enrich/account", { domain });
}

/**
 * Batch enrich multiple accounts by domain. Async — returns a job_id to poll.
 *
 * @param domains - List of company domains (max 500).
 * @returns {job_id, status: "pending", message, total_accounts}
 */
export async function batchEnrichAccounts(domains: string[]) {
  return post("/api/v1/enrich/accounts", { domains });
}

/**
 * Poll a batch account enrichment job.
 *
 * @param jobId - From batchEnrichAccounts response.
 * @returns {job_id, status: "pending"|"running"|"completed"|"failed",
 *           progress: {total, completed, new_accounts, updated_accounts},
 *           result: [{domain, account_id, name, is_new_account, fields_updated, status}],
 *           error_message}
 */
export async function pollBatchAccountEnrichment(jobId: string) {
  return get(`/api/v1/enrich/accounts/${jobId}`);
}

/**
 * Enrich people with emails and/or phone numbers. Async — returns a job_id to poll.
 *
 * @param peopleIds - List of people IDs (max 500).
 * @param enrichEmails - Whether to find work emails (default true).
 * @param enrichPhones - Whether to find phone numbers (default false).
 * @returns {job_id, status: "pending", message, total_people}
 */
export async function enrichPeople(opts: {
  peopleIds: number[];
  enrichEmails?: boolean;
  enrichPhones?: boolean;
}) {
  const body: Record<string, any> = {
    people_ids: opts.peopleIds,
    enrich_emails: opts.enrichEmails ?? true,
    enrich_phones: opts.enrichPhones ?? false,
  };
  return post("/api/v1/enrich/people", body);
}

/**
 * Poll a people enrichment job.
 *
 * @param jobId - From enrichPeople response.
 * @returns {job_id, status: "pending"|"running"|"completed"|"failed",
 *           progress: {total, completed, emails_found, phones_found},
 *           credits_used: {emails, phones, total},
 *           result: [{person_id, email, phone_number, person_name, linkedin_url, status}],
 *           error_message}
 */
export async function pollPeopleEnrichment(jobId: string) {
  return get(`/api/v1/enrich/people/${jobId}`);
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

/**
 * Sync accounts to CRM (Salesforce or HubSpot). Async — returns a job_id.
 *
 * @param accountIds - Account IDs to sync (1-500).
 * @param assignedUserEmail - Email of user to assign CRM records to. If omitted, assigns to authenticated user.
 * @returns {job_id, status, message, connected_crm, total_records}
 */
export async function syncAccountsToCrm(accountIds: number[], assignedUserEmail?: string) {
  const body: Record<string, any> = { account_ids: accountIds };
  if (assignedUserEmail) body.assigned_user_email = assignedUserEmail;
  return post("/api/v1/crm/sync-accounts-job", body);
}

/**
 * Sync people to CRM (Salesforce or HubSpot). Async — returns a job_id.
 * Accounts are resolved automatically.
 *
 * @param peopleIds - People IDs to sync (1-500).
 * @param assignedUserEmail - Email of user to assign CRM records to. If omitted, assigns to authenticated user.
 * @returns {job_id, status, message, connected_crm, total_records}
 */
export async function syncPeopleToCrm(peopleIds: number[], assignedUserEmail?: string) {
  const body: Record<string, any> = { people_ids: peopleIds };
  if (assignedUserEmail) body.assigned_user_email = assignedUserEmail;
  return post("/api/v1/crm/sync-people-job", body);
}

/**
 * Check status of a CRM sync job (accounts or people).
 *
 * @param jobId - From syncAccountsToCrm or syncPeopleToCrm response.
 * @returns {job_id, job_type, status: "pending"|"running"|"completed"|"failed",
 *           connected_crm, created_at, error_message, result}
 */
export async function checkCrmJobStatus(jobId: string) {
  return post("/api/v1/crm/check-job-status", { job_id: jobId });
}

// ---------------------------------------------------------------------------
// Admin (Orchestrator/Provisioner)
// ---------------------------------------------------------------------------

/**
 * Create an API-only user. Requires provisioner access (is_provisioner flag).
 *
 * Used by orchestrator providers to programmatically create users under their domain.
 * Created users can only access OpenFunnel via API (no UI login).
 * Users on the same domain share credits — provider pays for all.
 *
 * @param email - The internal email for the new user (e.g., "alice@provider-domain.com").
 * @returns {id, email, api_key}
 */
export async function createUser(email: string) {
  return post("/api/v1/admin/create-user", { email });
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

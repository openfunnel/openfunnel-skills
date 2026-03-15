import {
  getAudience,
  getInsightsFeed,
  listAccounts,
  listAudiences,
  searchByTraits,
} from "../api/client";

/**
 * Check what existing audiences match a query.
 *
 * Always call this first before searching. Pre-built data is instant and free.
 * Audiences and signals are 1-to-1, so checking audiences is sufficient.
 *
 * @param query - What the user is looking for (e.g. "companies hiring for Kubernetes").
 * @returns {matchingAudiences: [...], hasRelevantData: boolean}
 */
export async function checkExistingData(query: string) {
  const allAudiences = await listAudiences(500);
  const keywords = query.toLowerCase().split(/\s+/);

  const matchingAudiences = (allAudiences.audiences ?? []).filter(
    (aud: any) => keywords.some((kw: string) => (aud.audience_name ?? "").toLowerCase().includes(kw))
  );

  return {
    matchingAudiences,
    hasRelevantData: matchingAudiences.length > 0,
  };
}

/**
 * Intersect trait search with audience membership. Client-side intersection.
 *
 * No single API does this. This function:
 * 1. searchByTraits -> Set A (domains)
 * 2. listAccounts with audienceIds -> Set B (domains)
 * 3. Returns A ∩ B
 *
 * Works for both activity-based and signal-based audiences (they're 1-to-1).
 *
 * Example:
 *   "Series B SaaS companies hiring for data engineers"
 *   -> traitQuery = "Series B SaaS companies"
 *   -> audienceIds = [id of "hiring for data engineers" audience]
 *
 * @param traitQuery - The trait part (e.g. "Series B SaaS companies").
 * @param audienceIds - Audience IDs for the activity/signal part.
 * @param traitLimit - How many trait results to fetch.
 * @returns {traitResults, filteredAccounts, intersection: string[], intersectionCount: number}
 */
export async function findByTraitAndAudience(
  traitQuery: string,
  audienceIds: number[],
  traitLimit = 100,
) {
  const traitResults = await searchByTraits(traitQuery, traitLimit);
  const traitDomains = new Set(
    (traitResults.results ?? []).map((r: any) => r.domain)
  );

  const filtered = await listAccounts({ includeAudienceIds: audienceIds, limit: 500 });
  const filteredDomains = new Set(
    (filtered.accounts ?? []).map((a: any) => a.domain)
  );

  const intersection = [...traitDomains].filter((d) => filteredDomains.has(d)).sort();

  return {
    traitResults,
    filteredAccounts: filtered,
    intersection,
    intersectionCount: intersection.length,
  };
}

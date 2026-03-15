import {
  getAccountSummary,
  getAccountTimeline,
  getAccountsV2,
  getInsightsFeed,
  listAudiences,
  getAudience,
  searchByTraits,
} from "../api/client";

/**
 * Gather everything known about an account in one call.
 *
 * Chains: summary + V2 batch details (including all people + inline signal content) + timeline.
 *
 * @param accountId - The account ID.
 * @param timelineDays - How far back to look for activity (1-365, default 90).
 * @returns {summary, fullDetails (V2 — includes people + inline signals), timeline}
 */
export async function getFullIntelligence(accountId: number, timelineDays = 90) {
  const [summary, full, timeline] = await Promise.all([
    getAccountSummary(accountId),
    getAccountsV2({ accountIds: [accountId] }),
    getAccountTimeline(accountId, timelineDays),
  ]);

  const accountData = full.accounts?.[0] ?? null;

  return { summary, fullDetails: accountData, timeline };
}

/**
 * Find which audiences an account belongs to.
 *
 * Scans all audiences and checks if the account is a member.
 * Reveals which discovery agents have flagged this company.
 *
 * Warning: Makes N+1 API calls (1 to list audiences, N to check each).
 * Can be slow if there are many audiences.
 *
 * @param accountId - The account ID.
 * @returns List of audiences this account belongs to.
 */
export async function getAccountAudienceMembership(accountId: number) {
  const allAudiences = await listAudiences(500);
  const memberships: any[] = [];

  for (const aud of allAudiences.audiences ?? []) {
    const audienceData = await getAudience(aud.audience_id);
    if ((audienceData.account_ids ?? []).includes(accountId)) {
      memberships.push(aud);
    }
  }

  return memberships;
}

/**
 * Find companies similar to a given account.
 *
 * Chains: get summary (for description) -> searchByTraits with that description.
 *
 * @param accountId - The account to find similar companies for.
 * @param limit - Max results.
 * @returns searchByTraits response with similar companies.
 */
export async function findSimilarCompanies(accountId: number, limit = 10) {
  const summary = await getAccountSummary(accountId);
  const accountInfo = summary.account ?? {};
  const description = accountInfo.description ?? accountInfo.name ?? "";
  if (!description) return { results: [], total: 0 };
  return searchByTraits(description, limit);
}

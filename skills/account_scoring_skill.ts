import {
  getAccountSummary,
  getAccountTimeline,
  getAccountsV2,
  getAudience,
  listAudiences,
} from "../api/client";

export const AVAILABLE_MODELS = ["pain_based", "custom"] as const;

/**
 * Step 1: List all audiences so user can pick one to score.
 *
 * @returns {audiences: [{audience_id, audience_name, audience_type}], total_count}
 */
export async function getAudiencesForScoring() {
  return listAudiences(500);
}

/**
 * Step 2: Load an audience and return its account IDs.
 *
 * @param audienceId - The audience to load.
 * @returns {audienceId, audienceName, accountIds: number[], totalAccounts: number}
 */
export async function getAudienceAccountIds(audienceId: number) {
  const audience = await getAudience(audienceId);
  const accountIds: number[] = audience.account_ids ?? [];

  return {
    audienceId,
    audienceName: audience.audience_name ?? "",
    accountIds,
    totalAccounts: accountIds.length,
  };
}

/**
 * Step 4a: Gather all evidence for scoring a single account.
 *
 * Pulls summary (signal counts, top contacts), V2 full details (people, tech stack,
 * firmographics, inline signal content), and timeline (chronological events).
 *
 * Uses V2 batch — inline signal content means job posting text, social post content,
 * and context are included directly. The LLM can read actual evidence without extra calls.
 *
 * @param accountId - The account to gather evidence for.
 * @param timelineDays - How far back to look (default 90).
 * @returns {accountId, summary, fullDetails, timeline}
 *
 *   summary:      signal_counts, top contacts, CRM status
 *   fullDetails:   (V2) firmographics, technographics, traits, icp_people,
 *                  hiring: {job_title, job_posting, context},
 *                  socials: {post_content, platform, poster_person},
 *                  linkedin_engagement, job_changes
 *   timeline:      events [{date, signal_type, description}], total_events
 */
export async function getAccountEvidence(accountId: number, timelineDays = 90) {
  const [summary, full, timeline] = await Promise.all([
    getAccountSummary(accountId),
    getAccountsV2({ accountIds: [accountId] }),
    getAccountTimeline(accountId, timelineDays),
  ]);

  const accountData = full.accounts?.[0] ?? null;

  return { accountId, summary, fullDetails: accountData, timeline };
}

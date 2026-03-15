import {
  addAccountsToAudience,
  createAudience,
  getAccountSummary,
  getAccountTimeline,
  getAccountsV2,
  getAudience,
  listAudiences,
} from "../api/client";

// ---------------------------------------------------------------------------
// Step 1: List audiences for customer to pick
// ---------------------------------------------------------------------------

/**
 * List all audiences so customer can pick their account universe.
 */
export async function getAudiencesForScoring() {
  return listAudiences(500);
}

// ---------------------------------------------------------------------------
// Step 2: Load the source audience
// ---------------------------------------------------------------------------

/**
 * Load an audience and return its account IDs.
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

// ---------------------------------------------------------------------------
// Step 4: Gather evidence for scoring
// ---------------------------------------------------------------------------

/**
 * Pull all evidence for a single account. Uses V2 batch for inline signal
 * content — the LLM reads actual job descriptions, social posts, and context
 * directly without extra calls.
 *
 * @param accountId - Account to gather evidence for.
 * @param timelineDays - How far back to look (default 90).
 * @returns { accountId, summary, fullDetails, timeline }
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

/**
 * Pull evidence for a batch of accounts. Chunks into groups of 10 to avoid
 * overwhelming the API.
 */
export async function getAccountEvidenceBatch(
  accountIds: number[],
  timelineDays = 90,
  chunkSize = 10,
) {
  const results: Awaited<ReturnType<typeof getAccountEvidence>>[] = [];

  for (let i = 0; i < accountIds.length; i += chunkSize) {
    const chunk = accountIds.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((id) => getAccountEvidence(id, timelineDays)),
    );
    results.push(...chunkResults);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Step 5: Tiering
// ---------------------------------------------------------------------------

export interface ScoredAccount {
  accountId: number;
  accountName: string;
  score: number;
  reasoning: string;
}

export interface TierDefinition {
  name: string;
  minScore: number;
  maxScore: number;
}

/**
 * Bucket scored accounts into tiers.
 *
 * @param accounts - Scored accounts from the LLM scoring step.
 * @param tiers - Customer-defined tier boundaries, e.g.:
 *   [{ name: "Tier-1", minScore: 80, maxScore: 100 },
 *    { name: "Tier-2", minScore: 50, maxScore: 79 },
 *    { name: "Tier-3", minScore: 0, maxScore: 49 }]
 */
export function bucketIntoTiers(
  accounts: ScoredAccount[],
  tiers: TierDefinition[],
): Record<string, ScoredAccount[]> {
  const bucketed: Record<string, ScoredAccount[]> = {};
  for (const tier of tiers) {
    bucketed[tier.name] = [];
  }

  for (const account of accounts) {
    for (const tier of tiers) {
      if (account.score >= tier.minScore && account.score <= tier.maxScore) {
        bucketed[tier.name].push(account);
        break;
      }
    }
  }

  // Sort each tier by score descending
  for (const tier of Object.values(bucketed)) {
    tier.sort((a, b) => b.score - a.score);
  }

  return bucketed;
}

// ---------------------------------------------------------------------------
// Step 6: Pipe to tier audiences
// ---------------------------------------------------------------------------

/**
 * Create an audience for each tier. Returns the created audience IDs.
 *
 * @param tieredAccounts - Output of bucketIntoTiers.
 * @returns Array of { tierName, audienceId, totalAccounts }
 */
export async function createTierAudiences(
  tieredAccounts: Record<string, ScoredAccount[]>,
) {
  const results: { tierName: string; audienceId: number; totalAccounts: number }[] = [];

  for (const [tierName, accounts] of Object.entries(tieredAccounts)) {
    if (accounts.length === 0) continue;

    const accountIds = accounts.map((a) => a.accountId);
    const created = await createAudience(tierName, accountIds);

    results.push({
      tierName,
      audienceId: created.audience_id,
      totalAccounts: accounts.length,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Part 2: Add new accounts to existing tier audiences
// ---------------------------------------------------------------------------

/**
 * Add newly scored accounts to their existing tier audiences.
 * Used during daily scoring of new accounts (Part 2), not init.
 *
 * @param tierAudienceIds - Map of tier name → audience ID (from init createTierAudiences).
 * @param tieredAccounts - Output of bucketIntoTiers for the new accounts only.
 */
export async function addNewAccountsToTiers(
  tierAudienceIds: Record<string, number>,
  tieredAccounts: Record<string, ScoredAccount[]>,
) {
  const results: { tierName: string; audienceId: number; addedCount: number }[] = [];

  for (const [tierName, accounts] of Object.entries(tieredAccounts)) {
    if (accounts.length === 0) continue;

    const audienceId = tierAudienceIds[tierName];
    if (!audienceId) continue;

    const accountIds = accounts.map((a) => a.accountId);
    await addAccountsToAudience(audienceId, accountIds);

    results.push({
      tierName,
      audienceId,
      addedCount: accounts.length,
    });
  }

  return results;
}

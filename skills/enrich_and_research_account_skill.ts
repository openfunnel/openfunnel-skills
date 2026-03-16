import {
  searchByNameOrDomain,
  getAccountsV2,
  deepEnrich,
  listIcps,
} from "../api/client";

/**
 * Resolve a company by name or domain.
 *
 * Returns the best match or flags when clarification is needed.
 *
 * @param query - Company name or domain (e.g. "Stripe" or "stripe.com").
 * @returns {match, needsClarification, matches} — single match, or multiple for user to pick.
 */
export async function resolveCompany(query: string) {
  const result = await searchByNameOrDomain(query);
  const matches = result.matches ?? [];

  if (matches.length === 0) {
    return { match: null, needsClarification: false, matches: [] };
  }

  if (result.needs_clarification) {
    return { match: null, needsClarification: true, matches };
  }

  return { match: matches[0], needsClarification: false, matches };
}

/**
 * Fetch full V2 account data including people and inline signals.
 *
 * @param accountId - The account ID.
 * @returns V2 account object with icp_people, signals, firmographics.
 */
export async function fetchAccountV2(accountId: number) {
  const result = await getAccountsV2({ accountIds: [accountId] });
  return result.accounts?.[0] ?? null;
}

/**
 * Check enrichment state of an account and return a recommendation.
 *
 * @param account - V2 account object from fetchAccountV2.
 * @returns {state, peopleCount, signalCount, message}
 */
export function checkEnrichmentState(account: any) {
  const people = account?.icp_people ?? [];
  const signalCount = account?.signal_count ?? 0;
  const peopleCount = people.length;

  if (peopleCount === 0) {
    return {
      state: "no_people" as const,
      peopleCount,
      signalCount,
      message:
        `Found ${account.name ?? "this account"} but no contacts are enriched yet. ` +
        `Deep enrichment will discover the most receptive people at this account.\n\n` +
        `⚠️ Credit warning: Deep enrichment consumes credits from your plan.`,
    };
  }

  return {
    state: "has_people" as const,
    peopleCount,
    signalCount,
    message:
      `${account.name ?? "This account"} has ${peopleCount} contact(s) and ${signalCount} signal(s). ` +
      `Deep enrichment can improve coverage — more contacts, fresher signals.\n\n` +
      `⚠️ Credit warning: Deep enrichment consumes credits from your plan.`,
  };
}

/**
 * Extract a bare domain from a URL or domain string.
 *
 * "https://www.usepylon.com/about" → "usepylon.com"
 * "www.stripe.com" → "stripe.com"
 * "acme.io" → "acme.io"
 */
function extractDomain(input: string): string {
  let d = input.trim();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/\/.*$/, "");
  return d;
}

/**
 * Trigger deep enrichment for a domain.
 *
 * Accepts any format — full URL, www-prefixed, or bare domain.
 * Cleans it automatically before calling the API.
 *
 * Async operation — takes 15-30 minutes. Returns immediately with status.
 *
 * @param domain - Company domain in any format (e.g. "stripe.com", "https://www.stripe.com").
 * @param opts - Optional: goal, icpId, targetIcpRoles.
 * @returns {status, account_id, domain, message}
 */
export async function triggerDeepEnrich(
  domain: string,
  opts: { goal?: string; icpId?: number; targetIcpRoles?: string[] } = {},
) {
  const cleanDomain = extractDomain(domain);

  // API requires either icpId or targetIcpRoles. If neither provided, fetch
  // the user's first ICP profile as default.
  let icpId = opts.icpId;
  let targetIcpRoles = opts.targetIcpRoles;
  if (!icpId && (!targetIcpRoles || targetIcpRoles.length === 0)) {
    const icps = await listIcps();
    const firstIcp = icps.icps?.[0];
    if (firstIcp) {
      icpId = firstIcp.id;
    }
  }

  return deepEnrich({
    domain: cleanDomain,
    goal: opts.goal,
    icpId,
    targetIcpRoles,
  });
}

/**
 * Full enrich-and-research workflow.
 *
 * Steps:
 * 1. Resolve company by name/domain
 * 2. Fetch V2 details
 * 3. Check enrichment state and return recommendation
 *
 * The caller (agent or CLI) handles the user prompt for deep enrich
 * and the attack strategy generation.
 *
 * @param query - Company name or domain.
 * @returns {resolved, account, enrichmentState} or error states.
 */
export async function enrichAndResearchAccount(query: string) {
  // Step 1: Resolve
  const resolved = await resolveCompany(query);

  if (resolved.needsClarification) {
    return {
      step: "needs_clarification" as const,
      matches: resolved.matches,
      account: null,
      enrichmentState: null,
    };
  }

  if (!resolved.match) {
    return {
      step: "not_found" as const,
      matches: [],
      account: null,
      enrichmentState: null,
      message:
        `Could not find this company in the database. ` +
        `Provide the exact domain to run deep enrichment and add it.\n\n` +
        `⚠️ Credit warning: Deep enrichment consumes credits from your plan.`,
    };
  }

  // Step 2: Fetch V2
  const account = await fetchAccountV2(resolved.match.id);

  if (!account) {
    return {
      step: "fetch_failed" as const,
      matches: resolved.matches,
      account: null,
      enrichmentState: null,
    };
  }

  // Step 3: Check enrichment
  const enrichmentState = checkEnrichmentState(account);

  return {
    step: "ready" as const,
    matches: resolved.matches,
    account,
    enrichmentState,
    domain: extractDomain(account.website ?? resolved.match.domain ?? ""),
  };
}

/**
 * Poll an account after deep enrichment and wait for stabilization.
 *
 * Compares people count against the initial snapshot. Enrichment is considered
 * complete when people count has changed from the initial value AND remains
 * unchanged across `stableChecks` consecutive polls.
 *
 * @param accountId - The account ID to poll.
 * @param initialPeopleCount - People count before enrichment was triggered.
 * @param opts.pollIntervalMs - Milliseconds between polls (default 180_000 = 3 min).
 * @param opts.stableChecks - Consecutive unchanged polls to confirm done (default 2).
 * @param opts.timeoutMs - Max wait time in ms (default 2_700_000 = 45 min).
 * @param opts.onPoll - Optional callback invoked after each poll with current state.
 * @returns {done, timedOut, initialPeopleCount, finalPeopleCount, polls}
 */
export async function waitForEnrichment(
  accountId: number,
  initialPeopleCount: number,
  opts: {
    pollIntervalMs?: number;
    stableChecks?: number;
    timeoutMs?: number;
    onPoll?: (state: {
      poll: number;
      currentPeopleCount: number;
      changed: boolean;
      consecutiveStable: number;
    }) => void;
  } = {},
) {
  const pollInterval = opts.pollIntervalMs ?? 180_000;
  const stableChecks = opts.stableChecks ?? 2;
  const timeout = opts.timeoutMs ?? 2_700_000;

  let elapsed = 0;
  let polls = 0;
  let previousPeopleCount = initialPeopleCount;
  let consecutiveStable = 0;

  while (elapsed < timeout) {
    await new Promise((r) => setTimeout(r, pollInterval));
    elapsed += pollInterval;
    polls++;

    const account = await fetchAccountV2(accountId);
    const currentPeopleCount = account?.icp_people?.length ?? 0;
    const changed = currentPeopleCount !== initialPeopleCount;

    if (currentPeopleCount === previousPeopleCount) {
      consecutiveStable++;
    } else {
      consecutiveStable = 0;
    }

    opts.onPoll?.({
      poll: polls,
      currentPeopleCount,
      changed,
      consecutiveStable,
    });

    previousPeopleCount = currentPeopleCount;

    // Stabilized: data changed from initial AND hasn't moved in N consecutive polls
    if (changed && consecutiveStable >= stableChecks) {
      return {
        done: true,
        timedOut: false,
        initialPeopleCount,
        finalPeopleCount: currentPeopleCount,
        polls,
      };
    }
  }

  // Timed out
  return {
    done: previousPeopleCount !== initialPeopleCount,
    timedOut: true,
    initialPeopleCount,
    finalPeopleCount: previousPeopleCount,
    polls,
  };
}

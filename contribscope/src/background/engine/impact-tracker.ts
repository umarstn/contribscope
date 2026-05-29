import { ImpactData } from "../../shared/types";
import { fetchGraphQL, USER_PROFILE_QUERY, VIEWER_LOGIN_QUERY } from "../api/github-graphql";
import { getPackageDownloads } from "../api/npm-registry";

export async function calculateImpact(): Promise<ImpactData> {
  const viewerData = await fetchGraphQL<{ viewer: { login: string } }>(VIEWER_LOGIN_QUERY);
  const login = viewerData.viewer.login;
  const data = await fetchGraphQL<{ user: any }>(USER_PROFILE_QUERY, { login });
  
  const user = data.user;
  const totalMergedPRs = user.pullRequests.totalCount;
  
  // Estimate users impacted (npm downloads of contributed repos)
  // This is an estimation, we pick top repos from contributions
  const topRepos = user.contributionsCollection.pullRequestContributionsByRepository.map(
    (c: any) => c.repository.name
  );
  
  let usersImpacted = 0;
  for (const repo of topRepos.slice(0, 5)) {
    usersImpacted += await getPackageDownloads(repo);
  }

  const streakDays = calculateStreak(user.pullRequests.nodes);
  const streakAtRisk = isStreakAtRisk(user.pullRequests.nodes);

  return {
    totalMergedPRs,
    usersImpacted,
    topContributedRepos: topRepos.slice(0, 5),
    streakDays,
    streakAtRisk,
  };
}

function calculateStreak(prs: any[]): number {
  if (prs.length === 0) return 0;

  const dates = prs.map(pr => new Date(pr.updatedAt).toDateString());
  const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d).getTime());
  uniqueDates.sort((a, b) => b - a); // Newest first

  let streak = 0;
  let currentDate = new Date().setHours(0, 0, 0, 0);
  const oneDay = 24 * 60 * 60 * 1000;

  // Check if there's a contribution today or yesterday to start the streak
  if (uniqueDates[0] < currentDate - oneDay) return 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (uniqueDates[i] >= currentDate - (streak * oneDay)) {
      streak++;
    } else if (uniqueDates[i] < currentDate - (streak * oneDay)) {
      break;
    }
  }

  return streak;
}

function isStreakAtRisk(prs: any[]): boolean {
  if (prs.length === 0) return false;
  
  const lastContrib = new Date(prs[0].updatedAt).getTime();
  const now = Date.now();
  const twentyHours = 20 * 60 * 60 * 1000;

  return (now - lastContrib) > twentyHours && (now - lastContrib) < (24 * 60 * 60 * 1000);
}

import { RepoProfile, ScoredIssue, UserProfile } from "../../shared/types";

export function calculateMatchScore(
  userProfile: UserProfile,
  repoProfile: Pick<RepoProfile, "languages" | "techStack" | "stars" | "maintainerResponseTime" | "openIssuesCount">,
  scoredIssues: ScoredIssue[]
): number {
  const stackOverlap   = computeStackOverlap(userProfile, repoProfile) * 35;
  const contribLevel   = computeContribLevel(userProfile) * 25;
  const issueMatch     = computeIssueMatch(userProfile, scoredIssues) * 20;
  const repoActivity   = computeRepoActivity(repoProfile) * 12;
  const popularity     = computePopularity(repoProfile) * 8;

  return Math.round(stackOverlap + contribLevel + issueMatch + repoActivity + popularity);
}

function computeStackOverlap(user: UserProfile, repo: Pick<RepoProfile, "languages" | "techStack">): number {
  const userLangs = new Set(Object.keys(user.languages).map(l => l.toLowerCase()));
  const repoLangs = new Set(Object.keys(repo.languages).map(l => l.toLowerCase()));
  
  const techIntersect = user.techStack.filter(t => repo.techStack.map(rt => rt.toLowerCase()).includes(t.toLowerCase())).length;
  const langIntersect = [...userLangs].filter(l => repoLangs.has(l)).length;
  const langUnion = new Set([...userLangs, ...repoLangs]).size;
  
  const jaccardLang = langUnion > 0 ? langIntersect / langUnion : 0;
  const techScore = Math.min(techIntersect / Math.max(user.techStack.length, 1), 1);
  
  return (jaccardLang * 0.5 + techScore * 0.5);
}

function computeContribLevel(user: UserProfile): number {
  const base = Math.min(user.mergedPRCount / 20, 1); // 20 PRs = expert
  const sizeMultiplier = user.avgPRSize === "large" ? 1 : user.avgPRSize === "medium" ? 0.7 : 0.4;
  return base * sizeMultiplier;
}

function computeIssueMatch(user: UserProfile, issues: ScoredIssue[]): number {
  if (issues.length === 0) return 0;
  const maxDiff = user.mergedPRCount > 20 ? 80 : user.mergedPRCount > 5 ? 55 : 35;
  const accessible = issues.filter(i => i.difficultyScore <= maxDiff).length;
  return Math.min(accessible / Math.max(issues.length, 1), 1);
}

function computeRepoActivity(repo: Pick<RepoProfile, "maintainerResponseTime">): number {
  const h = repo.maintainerResponseTime;
  if (h < 24) return 1;
  if (h < 72) return 0.7;
  if (h < 168) return 0.4;
  return 0.1;
}

function computePopularity(repo: Pick<RepoProfile, "stars">): number {
  return Math.min(Math.log10(Math.max(repo.stars, 1)) / 5, 1);
}

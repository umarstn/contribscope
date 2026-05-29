import { UserProfile } from "../../shared/types";
import { fetchGraphQL, USER_PROFILE_QUERY, VIEWER_LOGIN_QUERY } from "../api/github-graphql";

export async function getUserProfile(): Promise<UserProfile> {
  const viewerData = await fetchGraphQL<{ viewer: { login: string } }>(VIEWER_LOGIN_QUERY);
  const login = viewerData.viewer.login;

  const data = await fetchGraphQL<{ user: any }>(USER_PROFILE_QUERY, { login });
  return parseUserProfile(data.user);
}

export function parseUserProfile(userData: any): UserProfile {
  const languages = calculateLanguages(userData.repositories.nodes);
  const techStack = extractTechStack(userData.repositories.nodes, userData.pullRequests.nodes);
  const mergedPRCount = userData.pullRequests.totalCount;
  const avgPRSize = calculateAvgPRSize(userData.pullRequests.nodes);
  
  return {
    login: userData.login,
    name: userData.name || userData.login,
    avatarUrl: userData.avatarUrl,
    languages,
    techStack,
    mergedPRCount,
    avgPRSize,
    streakDays: 0, // Will be calculated by impact-tracker
    lastFetchedAt: Date.now(),
  };
}

function calculateLanguages(repos: any[]): Record<string, number> {
  const langCounts: Record<string, number> = {};
  let totalSize = 0;

  repos.forEach((repo) => {
    repo.languages.edges.forEach((edge: any) => {
      const langName = edge.node.name;
      const size = edge.size;
      langCounts[langName] = (langCounts[langName] || 0) + size;
      totalSize += size;
    });
  });

  if (totalSize === 0) return {};

  const distribution: Record<string, number> = {};
  Object.keys(langCounts).forEach((lang) => {
    distribution[lang] = parseFloat((langCounts[lang] / totalSize).toFixed(4));
  });

  return distribution;
}

function extractTechStack(repos: any[], prs: any[]): string[] {
  const tags = new Set<string>();

  // Extract from repo primary languages
  repos.forEach((repo) => {
    repo.languages.edges.forEach((edge: any) => {
      const tag = normalizeTag(edge.node.name);
      if (tag) tags.add(tag);
    });
  });

  // Extract from PR repos
  prs.forEach((pr) => {
    if (pr.repository.primaryLanguage) {
      const tag = normalizeTag(pr.repository.primaryLanguage.name);
      if (tag) tags.add(tag);
    }
  });

  return Array.from(tags).slice(0, 15); // Limit to top 15 tags
}

function calculateAvgPRSize(prs: any[]): "small" | "medium" | "large" {
  if (prs.length === 0) return "small";

  const totalChanges = prs.reduce((sum, pr) => sum + pr.additions + pr.deletions, 0);
  const avg = totalChanges / prs.length;

  if (avg > 500) return "large";
  if (avg > 100) return "medium";
  return "small";
}

function normalizeTag(name: string): string {
  const n = name.toLowerCase();
  if (n === "typescript") return "typescript";
  if (n === "javascript") return "javascript";
  if (n === "react" || n === "react.js") return "react";
  if (n === "next.js" || n === "nextjs") return "nextjs";
  if (n === "vue.js" || n === "vue") return "vue";
  if (n === "node.js" || n === "nodejs") return "nodejs";
  if (n === "python") return "python";
  if (n === "rust") return "rust";
  if (n === "go") return "go";
  if (n === "java") return "java";
  if (n === "c++" || n === "cpp") return "cpp";
  
  // Return null for very generic or unknown tags to keep it clean
  const common = ["typescript", "javascript", "react", "nextjs", "vue", "nodejs", "python", "rust", "go", "java", "cpp", "ruby", "php", "swift", "kotlin", "html", "css"];
  if (common.includes(n)) return n;
  
  return n; // Fallback to lowercase
}

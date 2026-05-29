export interface UserProfile {
  login: string;
  name: string;
  avatarUrl: string;
  languages: Record<string, number>; // { "TypeScript": 0.45, "JavaScript": 0.30 }
  techStack: string[];               // tags normalisés: ["react", "nextjs", "nodejs"]
  mergedPRCount: number;
  avgPRSize: "small" | "medium" | "large"; // lignes modifiées
  streakDays: number;
  lastFetchedAt: number;             // timestamp ms
}

export interface RepoProfile {
  owner: string;
  name: string;
  fullName: string;
  stars: number;
  forks: number;
  languages: Record<string, number>;
  techStack: string[];
  openIssuesCount: number;
  maintainerResponseTime: number;    // heures moyennes
  lastActivityAt: string;
  matchScore: number;                // 0–100
  lastFetchedAt: number;
}

export interface ScoredIssue {
  id: number;
  number: number;
  title: string;
  url: string;
  labels: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  difficultyScore: number;           // 0–100
  difficulty: "easy" | "medium" | "advanced";
  relevanceScore: number;            // 0–100, pertinence pour l'user
  estimatedFiles: string[];          // fichiers probablement concernés
  techTags: string[];
}

export interface ImpactData {
  totalMergedPRs: number;
  usersImpacted: number;             // somme npm downloads
  topContributedRepos: string[];
  streakDays: number;
  streakAtRisk: boolean;             // true si pas de contrib depuis 20h
}

// Messages entre content script / popup et service worker
export type ExtMessage =
  | { type: "GET_REPO_DATA"; repoFullName: string }
  | { type: "GET_USER_PROFILE" }
  | { type: "GET_ISSUES"; repoFullName: string; filters: IssueFilters }
  | { type: "GET_IMPACT" }
  | { type: "AUTH_LOGIN" }
  | { type: "AUTH_LOGOUT" }
  | { type: "ISSUE_FEEDBACK"; issueId: number; feedback: "too_easy" | "too_hard" | "just_right" }
  | { type: "URL_CHANGED"; url: string }
  | { type: "OPEN_POPUP" };

export type ExtResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface IssueFilters {
  maxDifficulty?: "easy" | "medium" | "advanced";
  techTags?: string[];
  maxAge?: number; // jours
}

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttlMs: number;
}

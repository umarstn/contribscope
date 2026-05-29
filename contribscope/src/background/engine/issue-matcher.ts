import { ScoredIssue, UserProfile } from "../../shared/types";

export function scoreIssue(issue: any, userProfile: UserProfile): ScoredIssue {
  const difficultyScore = calculateDifficulty(issue);
  const techTags = extractTechTags(issue);
  const relevanceScore = calculateRelevance(issue, userProfile, techTags);

  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    labels: issue.labels.map((l: any) => l.name),
    commentsCount: issue.comments,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    difficultyScore,
    difficulty: getDifficultyLabel(difficultyScore),
    relevanceScore,
    estimatedFiles: extractFileMentions(issue),
    techTags,
  };
}

function calculateDifficulty(issue: any): number {
  let score = 0;

  // Labels
  const labels = issue.labels.map((l: any) => l.name.toLowerCase());
  if (labels.some((l: string) => l.includes("good first issue"))) score -= 30;
  if (labels.some((l: string) => l.includes("help wanted")))      score += 5;
  if (labels.some((l: string) => l.includes("blocked")))          score += 30;
  if (labels.some((l: string) => l.includes("breaking change")))  score += 25;
  if (labels.some((l: string) => l.includes("performance")))      score += 15;
  if (labels.some((l: string) => l.includes("security")))         score += 20;

  // Description length
  const bodyLen = (issue.body ?? "").length;
  if (bodyLen > 1000) score += 20;
  else if (bodyLen > 300) score += 8;
  else if (bodyLen < 80) score -= 5;

  // Comments
  const comments = issue.comments ?? 0;
  if (comments > 15) score += 20;
  else if (comments > 5) score += 10;

  // File mentions
  const fileMentions = extractFileMentions(issue);
  score += Math.min(fileMentions.length * 3, 15);

  // Age
  const ageMs = Date.now() - new Date(issue.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > 180 && comments < 3) score += 10;

  return Math.max(0, Math.min(100, score + 50));
}

function getDifficultyLabel(score: number): "easy" | "medium" | "advanced" {
  if (score < 35) return "easy";
  if (score < 65) return "medium";
  return "advanced";
}

function calculateRelevance(issue: any, user: UserProfile, techTags: string[]): number {
  let score = 50; // Base relevance

  // Tech stack overlap
  const overlap = techTags.filter(tag => user.techStack.includes(tag.toLowerCase())).length;
  score += overlap * 15;

  // User experience vs difficulty
  const maxDiff = user.mergedPRCount > 20 ? 100 : user.mergedPRCount > 5 ? 70 : 40;
  const issueDiff = calculateDifficulty(issue);
  
  if (issueDiff > maxDiff) score -= 20;
  if (Math.abs(issueDiff - maxDiff) < 20) score += 10;

  return Math.max(0, Math.min(100, score));
}

function extractTechTags(issue: any): string[] {
  const body = (issue.body ?? "").toLowerCase();
  const tags = new Set<string>();
  const common = ["typescript", "javascript", "react", "nextjs", "vue", "nodejs", "python", "rust", "go", "java", "cpp", "tailwind"];
  
  common.forEach(t => {
    if (body.includes(t)) tags.add(t);
  });
  
  return Array.from(tags);
}

function extractFileMentions(issue: any): string[] {
  const body = issue.body ?? "";
  const matches = body.match(/[\w/.-]+\.[a-z]{1,6}/g) ?? [];
  return Array.from(new Set(matches));
}

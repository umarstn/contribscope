import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "../../src/background/engine/score-calculator";
import { UserProfile, ScoredIssue } from "../../shared/types";

describe("Score Calculator", () => {
  const mockUser: UserProfile = {
    login: "testuser",
    name: "Test User",
    avatarUrl: "",
    languages: { "TypeScript": 0.8, "JavaScript": 0.2 },
    techStack: ["typescript", "react", "nodejs"],
    mergedPRCount: 10,
    avgPRSize: "medium",
    streakDays: 0,
    lastFetchedAt: Date.now(),
  };

  const mockRepo = {
    languages: { "TypeScript": 1.0 },
    techStack: ["typescript", "react"],
    stars: 1000,
    maintainerResponseTime: 12,
    openIssuesCount: 50,
  };

  const mockIssues: ScoredIssue[] = [
    { difficultyScore: 20 } as ScoredIssue,
    { difficultyScore: 40 } as ScoredIssue,
  ];

  it("should calculate a high score for a good match", () => {
    const score = calculateMatchScore(mockUser, mockRepo, mockIssues);
    expect(score).toBeGreaterThan(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should penalize slow maintainer response", () => {
    const fastScore = calculateMatchScore(mockUser, mockRepo, mockIssues);
    const slowRepo = { ...mockRepo, maintainerResponseTime: 200 };
    const slowScore = calculateMatchScore(mockUser, slowRepo, mockIssues);
    expect(slowScore).toBeLessThan(fastScore);
  });

  it("should boost for perfect stack match", () => {
    const perfectRepo = { ...mockRepo, techStack: ["typescript", "react", "nodejs"] };
    const score = calculateMatchScore(mockUser, perfectRepo, mockIssues);
    expect(score).toBeGreaterThan(70);
  });

  it("should handle low popularity repos", () => {
    const unpopularRepo = { ...mockRepo, stars: 1 };
    const score = calculateMatchScore(mockUser, unpopularRepo, mockIssues);
    expect(score).toBeLessThan(calculateMatchScore(mockUser, mockRepo, mockIssues));
  });
});

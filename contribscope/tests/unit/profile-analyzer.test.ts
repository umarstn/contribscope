import { describe, it, expect } from "vitest";
import { parseUserProfile } from "../../src/background/engine/profile-analyzer";

describe("Profile Analyzer", () => {
  const mockUserData = {
    login: "testuser",
    name: "Test User",
    avatarUrl: "https://example.com/avatar.png",
    repositories: {
      nodes: [
        {
          name: "repo1",
          languages: {
            edges: [
              { size: 1000, node: { name: "TypeScript" } },
              { size: 500, node: { name: "JavaScript" } },
            ],
          },
        },
        {
          name: "repo2",
          languages: {
            edges: [
              { size: 1500, node: { name: "TypeScript" } },
            ],
          },
        },
      ],
    },
    pullRequests: {
      totalCount: 10,
      nodes: [
        { additions: 50, deletions: 20, repository: { primaryLanguage: { name: "TypeScript" } } },
        { additions: 200, deletions: 100, repository: { primaryLanguage: { name: "JavaScript" } } },
      ],
    },
  };

  it("should correctly parse user profile data", () => {
    const profile = parseUserProfile(mockUserData);

    expect(profile.login).toBe("testuser");
    expect(profile.name).toBe("Test User");
    expect(profile.mergedPRCount).toBe(10);
  });

  it("should correctly calculate language distribution", () => {
    const profile = parseUserProfile(mockUserData);
    
    // Total size = 1000 + 500 + 1500 = 3000
    // TS = 2500 / 3000 = 0.8333
    // JS = 500 / 3000 = 0.1667
    expect(profile.languages["TypeScript"]).toBeCloseTo(0.8333, 4);
    expect(profile.languages["JavaScript"]).toBeCloseTo(0.1667, 4);
  });

  it("should extract and normalize tech stack", () => {
    const profile = parseUserProfile(mockUserData);
    
    expect(profile.techStack).toContain("typescript");
    expect(profile.techStack).toContain("javascript");
  });

  it("should correctly calculate average PR size", () => {
    // Avg = (70 + 300) / 2 = 185 -> medium
    const profile = parseUserProfile(mockUserData);
    expect(profile.avgPRSize).toBe("medium");
  });

  it("should handle empty data gracefully", () => {
    const emptyData = {
      login: "empty",
      name: null,
      avatarUrl: "",
      repositories: { nodes: [] },
      pullRequests: { totalCount: 0, nodes: [] },
    };
    
    const profile = parseUserProfile(emptyData);
    expect(profile.languages).toEqual({});
    expect(profile.techStack).toEqual([]);
    expect(profile.mergedPRCount).toBe(0);
    expect(profile.avgPRSize).toBe("small");
  });
});

import { RepoProfile } from "../../shared/types";
import { getRepo, getFileContent, getRecentPulls } from "../api/github-rest";

const STACK_DETECTORS: Array<{
  file: string;
  parser: (content: string) => string[];
}> = [
  {
    file: "package.json",
    parser: (c) => {
      try {
        const pkg = JSON.parse(c);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const tags: string[] = [];
        if ("react" in deps)          tags.push("react");
        if ("next" in deps)           tags.push("nextjs");
        if ("vue" in deps)            tags.push("vue");
        if ("nuxt" in deps)           tags.push("nuxt");
        if ("svelte" in deps)         tags.push("svelte");
        if ("express" in deps)        tags.push("nodejs", "express");
        if ("fastify" in deps)        tags.push("nodejs", "fastify");
        if ("typescript" in deps)     tags.push("typescript");
        if ("@types/react" in deps)   tags.push("react");
        if ("tailwindcss" in deps)    tags.push("tailwind");
        if ("prisma" in deps)         tags.push("prisma");
        if ("@nestjs/core" in deps)   tags.push("nestjs", "nodejs");
        return [...new Set(tags)];
      } catch { return []; }
    },
  },
  {
    file: "go.mod",
    parser: (c) => {
      const tags = ["go"];
      if (c.includes("gin-gonic"))  tags.push("gin");
      if (c.includes("go-chi"))     tags.push("chi");
      return tags;
    },
  },
  {
    file: "requirements.txt",
    parser: (c) => {
      const tags = ["python"];
      if (c.includes("django"))     tags.push("django");
      if (c.includes("fastapi"))    tags.push("fastapi");
      if (c.includes("flask"))      tags.push("flask");
      return tags;
    },
  },
  {
    file: "Cargo.toml",
    parser: (c) => {
      const tags = ["rust"];
      if (c.includes("actix-web")) tags.push("actix");
      if (c.includes("axum"))      tags.push("axum");
      return tags;
    },
  },
];

export async function analyzeRepo(owner: string, name: string): Promise<RepoProfile> {
  const repoData = await getRepo(owner, name);
  const techStack = await detectStack(owner, name);
  const maintainerResponseTime = await estimateResponseTime(owner, name);

  return {
    owner,
    name,
    fullName: repoData.full_name,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    languages: repoData.languages || {}, // Note: might need separate call if not in base repo response
    techStack,
    openIssuesCount: repoData.open_issues_count,
    maintainerResponseTime,
    lastActivityAt: repoData.updated_at,
    matchScore: 0, // Calculated later
    lastFetchedAt: Date.now(),
  };
}

async function detectStack(owner: string, repo: string): Promise<string[]> {
  const allTags = new Set<string>();

  for (const detector of STACK_DETECTORS) {
    const content = await getFileContent(owner, repo, detector.file);
    if (content) {
      detector.parser(content).forEach(tag => allTags.add(tag));
    }
  }

  return Array.from(allTags);
}

async function estimateResponseTime(owner: string, repo: string): Promise<number> {
  try {
    const pulls = await getRecentPulls(owner, repo);
    if (pulls.length === 0) return 48; // Default to 48h

    const responseTimes = pulls
      .filter(p => p.merged_at || p.closed_at)
      .map(p => {
        const created = new Date(p.created_at).getTime();
        const closed = new Date(p.merged_at || p.closed_at).getTime();
        return (closed - created) / (1000 * 60 * 60);
      });

    if (responseTimes.length === 0) return 48;
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  } catch {
    return 48;
  }
}

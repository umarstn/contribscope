import { getToken } from "../auth/token-store";

const GITHUB_REST_URL = "https://api.github.com";

export async function fetchRest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error("No GitHub token found.");
  }

  const response = await fetch(`${GITHUB_REST_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  return response.json();
}

export async function getRepo(owner: string, repo: string): Promise<any> {
  return fetchRest(`/repos/${owner}/${repo}`);
}

export async function getIssues(owner: string, repo: string, page = 1, perPage = 50): Promise<any[]> {
  return fetchRest(`/repos/${owner}/${repo}/issues?state=open&sort=updated&per_page=${perPage}&page=${page}`);
}

export async function getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const data: any = await fetchRest(`/repos/${owner}/${repo}/contents/${path}`);
    if (data.content && data.encoding === "base64") {
      return atob(data.content.replace(/\n/g, ""));
    }
    return null;
  } catch (error) {
    // File might not exist, which is fine for stack detection
    return null;
  }
}

export async function getRecentPulls(owner: string, repo: string): Promise<any[]> {
  return fetchRest(`/repos/${owner}/${repo}/pulls?state=closed&sort=updated&per_page=20`);
}

import { getToken } from "../auth/token-store";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export async function fetchGraphQL<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error("No GitHub token found. Please configure it in the options page.");
  }

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error("GraphQL Errors:", result.errors);
    throw new Error(result.errors[0].message || "GitHub GraphQL API error");
  }

  return result.data;
}

export const USER_PROFILE_QUERY = `
query UserProfile($login: String!) {
  user(login: $login) {
    login
    name
    avatarUrl
    repositories(first: 100, orderBy: { field: PUSHED_AT, direction: DESC }, isFork: false) {
      nodes {
        name
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
        stargazerCount
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      pullRequestContributionsByRepository(maxRepositories: 20) {
        repository { nameWithOwner languages(first: 5) { nodes { name } } }
        contributions(first: 10) { nodes { pullRequest { merged } } }
      }
    }
    pullRequests(states: MERGED, first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
      totalCount
      nodes {
        additions
        deletions
        repository { nameWithOwner primaryLanguage { name } }
      }
    }
  }
}
`;

export const VIEWER_LOGIN_QUERY = `
query {
  viewer {
    login
  }
}
`;

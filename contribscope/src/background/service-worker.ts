import { getUserProfile } from "./engine/profile-analyzer";
import { analyzeRepo } from "./engine/repo-analyzer";
import { scoreIssue } from "./engine/issue-matcher";
import { calculateMatchScore } from "./engine/score-calculator";
import { getCached, setCached } from "./cache/storage";
import { CACHE_KEYS, TTL } from "../shared/constants";
import { ExtMessage, ExtResponse, RepoProfile, ScoredIssue } from "../shared/types";
import { getIssues } from "./api/github-rest";

chrome.runtime.onMessage.addListener((message: ExtMessage, _sender, sendResponse) => {
  switch (message.type) {
    case "GET_USER_PROFILE":
      handleGetUserProfile(sendResponse);
      break;
    case "GET_REPO_DATA":
      handleGetRepoData(message.repoFullName, sendResponse);
      break;
    case "GET_ISSUES":
      handleGetIssues(message.repoFullName, sendResponse);
      break;
    case "OPEN_POPUP":
      chrome.action.openPopup?.();
      break;
  }
  return true; // Keep channel open
});

async function handleGetUserProfile(sendResponse: (response: ExtResponse<any>) => void) {
  try {
    const cacheKey = CACHE_KEYS.userProfile();
    const cachedProfile = await getCached(cacheKey);
    if (cachedProfile) return sendResponse({ success: true, data: cachedProfile });

    const profile = await getUserProfile();
    await setCached(cacheKey, profile, TTL.USER_PROFILE);
    sendResponse({ success: true, data: profile });
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetRepoData(repoFullName: string, sendResponse: (response: ExtResponse<RepoProfile>) => void) {
  try {
    const cacheKey = CACHE_KEYS.repoProfile(repoFullName);
    const cachedRepo = await getCached<RepoProfile>(cacheKey);
    if (cachedRepo) return sendResponse({ success: true, data: cachedRepo });

    const [owner, name] = repoFullName.split("/");
    const repoProfile = await analyzeRepo(owner, name);
    
    // Get user profile for scoring
    const userProfile = await getUserProfile();
    
    // Get a sample of issues for scoring
    const rawIssues = await getIssues(owner, name, 1, 10);
    const scoredIssues = rawIssues.map(issue => scoreIssue(issue, userProfile));
    
    repoProfile.matchScore = calculateMatchScore(userProfile, repoProfile, scoredIssues);

    await setCached(cacheKey, repoProfile, TTL.REPO_PROFILE);
    sendResponse({ success: true, data: repoProfile });
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetIssues(repoFullName: string, sendResponse: (response: ExtResponse<ScoredIssue[]>) => void) {
  try {
    const cacheKey = CACHE_KEYS.issues(repoFullName);
    const cachedIssues = await getCached<ScoredIssue[]>(cacheKey);
    if (cachedIssues) return sendResponse({ success: true, data: cachedIssues });

    const [owner, name] = repoFullName.split("/");
    const rawIssues = await getIssues(owner, name);
    const userProfile = await getUserProfile();
    
    const scoredIssues = rawIssues
      .filter(issue => !issue.pull_request) // Ensure we only get issues, not PRs
      .map(issue => scoreIssue(issue, userProfile))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    await setCached(cacheKey, scoredIssues, TTL.ISSUES);
    sendResponse({ success: true, data: scoredIssues });
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}

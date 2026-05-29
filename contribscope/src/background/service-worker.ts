import { getUserProfile } from "./engine/profile-analyzer";
import { analyzeRepo } from "./engine/repo-analyzer";
import { scoreIssue } from "./engine/issue-matcher";
import { calculateMatchScore } from "./engine/score-calculator";
import { calculateImpact } from "./engine/impact-tracker";
import { getCached, setCached } from "./cache/storage";
import { CACHE_KEYS, TTL } from "../shared/constants";
import { ExtMessage, ExtResponse, RepoProfile, ScoredIssue, ImpactData } from "../shared/types";
import { getIssues } from "./api/github-rest";

// Initialize alarms
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("STREAK_CHECK", { periodInMinutes: 60 * 6 }); // Check every 6 hours
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "STREAK_CHECK") {
    checkStreak();
  }
});

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
    case "GET_IMPACT":
      handleGetImpact(sendResponse);
      break;
    case "OPEN_POPUP":
      chrome.action.openPopup?.();
      break;
  }
  return true; // Keep channel open
});

async function checkStreak() {
  try {
    const impact = await calculateImpact();
    if (impact.streakAtRisk) {
      chrome.notifications.create("streak-warning", {
        type: "basic",
        iconUrl: "/icons/icon128.png",
        title: "🔥 Streak at Risk!",
        message: "You haven't contributed today yet. Keep your streak alive!",
        priority: 2
      });
    }
  } catch (error) {
    console.error("Streak check failed:", error);
  }
}

async function handleGetImpact(sendResponse: (response: ExtResponse<ImpactData>) => void) {
  try {
    const cacheKey = CACHE_KEYS.impact();
    const cachedImpact = await getCached<ImpactData>(cacheKey);
    if (cachedImpact) return sendResponse({ success: true, data: cachedImpact });

    const impact = await calculateImpact();
    await setCached(cacheKey, impact, TTL.IMPACT);
    sendResponse({ success: true, data: impact });
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}

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

import { getUserProfile } from "./engine/profile-analyzer";
import { getCached, setCached } from "./cache/storage";
import { CACHE_KEYS, TTL } from "../shared/constants";
import { ExtMessage, ExtResponse } from "../shared/types";

chrome.runtime.onMessage.addListener((message: ExtMessage, _sender, sendResponse) => {
  if (message.type === "GET_USER_PROFILE") {
    handleGetUserProfile(sendResponse);
    return true; // Keep channel open for async response
  }
  
  // Placeholder for other message types
  if (message.type === "OPEN_POPUP") {
    chrome.action.openPopup?.();
    return true;
  }
});

async function handleGetUserProfile(sendResponse: (response: ExtResponse<any>) => void) {
  try {
    const cacheKey = CACHE_KEYS.userProfile();
    const cachedProfile = await getCached(cacheKey);

    if (cachedProfile) {
      sendResponse({ success: true, data: cachedProfile });
      return;
    }

    const profile = await getUserProfile();
    await setCached(cacheKey, profile, TTL.USER_PROFILE);
    sendResponse({ success: true, data: profile });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    sendResponse({ success: false, error: error.message });
  }
}

import { CACHE_KEYS } from "../../shared/constants";

export async function storeToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [CACHE_KEYS.token()]: token });
}

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(CACHE_KEYS.token());
  const token = result[CACHE_KEYS.token()];
  return typeof token === "string" ? token : null;
}

export async function removeToken(): Promise<void> {
  await chrome.storage.local.remove(CACHE_KEYS.token());
}

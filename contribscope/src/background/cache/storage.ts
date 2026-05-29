import { CacheEntry } from "../../shared/types";

export async function getCached<T>(key: string): Promise<T | null> {
  const result = await chrome.storage.local.get(key);
  const entry = result[key] as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  if (Date.now() - entry.fetchedAt > entry.ttlMs) {
    await chrome.storage.local.remove(key);
    return null;
  }
  return entry.data;
}

export async function setCached<T>(key: string, data: T, ttlMs: number): Promise<void> {
  await chrome.storage.local.set({
    [key]: { data, fetchedAt: Date.now(), ttlMs } satisfies CacheEntry<T>
  });
}

export async function removeCached(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}

export async function clearCache(): Promise<void> {
  await chrome.storage.local.clear();
}

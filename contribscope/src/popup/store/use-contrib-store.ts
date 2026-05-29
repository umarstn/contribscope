import { create } from "zustand";
import { UserProfile, RepoProfile, ScoredIssue, ExtResponse, ImpactData } from "../../shared/types";

interface ContribState {
  user: UserProfile | null;
  currentRepo: RepoProfile | null;
  issues: ScoredIssue[];
  impact: ImpactData | null;
  loading: boolean;
  error: string | null;
  
  fetchUserProfile: () => Promise<void>;
  fetchRepoData: (fullName: string) => Promise<void>;
  fetchIssues: (fullName: string) => Promise<void>;
  fetchImpact: () => Promise<void>;
  clearError: () => void;
}

export const useContribStore = create<ContribState>((set) => ({
  user: null,
  currentRepo: null,
  issues: [],
  impact: null,
  loading: false,
  error: null,

  fetchUserProfile: async () => {
    set({ loading: true, error: null });
    chrome.runtime.sendMessage({ type: "GET_USER_PROFILE" }, (response: ExtResponse<UserProfile>) => {
      if (response.success) {
        set({ user: response.data, loading: false });
      } else {
        set({ error: response.error, loading: false });
      }
    });
  },

  fetchRepoData: async (fullName: string) => {
    set({ loading: true, error: null });
    chrome.runtime.sendMessage({ type: "GET_REPO_DATA", repoFullName: fullName }, (response: ExtResponse<RepoProfile>) => {
      if (response.success) {
        set({ currentRepo: response.data, loading: false });
      } else {
        set({ error: response.error, loading: false });
      }
    });
  },

  fetchIssues: async (fullName: string) => {
    set({ loading: true, error: null });
    chrome.runtime.sendMessage({ type: "GET_ISSUES", repoFullName: fullName }, (response: ExtResponse<ScoredIssue[]>) => {
      if (response.success) {
        set({ issues: response.data, loading: false });
      } else {
        set({ error: response.error, loading: false });
      }
    });
  },

  fetchImpact: async () => {
    set({ loading: true, error: null });
    chrome.runtime.sendMessage({ type: "GET_IMPACT" }, (response: ExtResponse<ImpactData>) => {
      if (response.success) {
        set({ impact: response.data, loading: false });
      } else {
        set({ error: response.error, loading: false });
      }
    });
  },

  clearError: () => set({ error: null }),
}));

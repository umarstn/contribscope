export const TTL = {
  USER_PROFILE: 6 * 60 * 60 * 1000,   // 6 heures
  REPO_PROFILE: 60 * 60 * 1000,         // 1 heure
  ISSUES:       15 * 60 * 1000,         // 15 minutes
  IMPACT:       60 * 60 * 1000,         // 1 heure
};

export const CACHE_KEYS = {
  userProfile: () => "profile:user",
  repoProfile: (fullName: string) => `repo:${fullName}`,
  issues:      (fullName: string) => `issues:${fullName}`,
  impact:      () => "impact:user",
  token:       () => "auth:token",
};

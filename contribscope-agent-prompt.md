# ContribScope — Agent Prompt (Claude Code / Cursor / Windsurf)

> Colle ce prompt au démarrage d'une session agent. Il contient tout le contexte
> nécessaire pour builder l'extension de A à Z sans ambiguïté.

---

## Contexte projet

Tu es l'agent principal de développement d'une extension Chromium appelée
**ContribScope**. Son objectif : aider les développeurs à trouver rapidement
des issues open source qui correspondent à leur niveau et leur stack technique,
directement depuis GitHub.

L'extension analyse le profil GitHub de l'utilisateur, détecte la stack d'un
repo visité, calcule un "match score", filtre les issues par pertinence et
suit les contributions dans le temps.

**Stack décidée (non négociable) :**
- Manifest V3 (Chromium standard)
- Vite 5 + React 18 + TypeScript strict
- Zustand (state management popup)
- Tailwind CSS (UI)
- Vitest + Testing Library (tests unitaires)
- Playwright (tests E2E)
- MSW v2 (mock GitHub API dans les tests)

---

## Structure de fichiers à créer

```
contribscope/
├── manifest.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── src/
│   ├── background/
│   │   ├── service-worker.ts        ← point d'entrée SW
│   │   ├── auth/
│   │   │   ├── oauth.ts             ← PKCE flow GitHub OAuth
│   │   │   └── token-store.ts       ← chrome.storage.local wrapper
│   │   ├── engine/
│   │   │   ├── profile-analyzer.ts  ← fetch + parse profil GitHub
│   │   │   ├── repo-analyzer.ts     ← détecte stack du repo courant
│   │   │   ├── issue-matcher.ts     ← filtre + trie issues
│   │   │   ├── score-calculator.ts  ← algorithme de scoring
│   │   │   └── impact-tracker.ts    ← npm downloads + streak
│   │   ├── cache/
│   │   │   └── storage.ts           ← TTL cache over chrome.storage.local
│   │   └── api/
│   │       ├── github-rest.ts       ← GitHub REST v3 client
│   │       ├── github-graphql.ts    ← GitHub GraphQL v4 client
│   │       └── npm-registry.ts      ← npm downloads API
│   │
│   ├── content/
│   │   ├── index.ts                 ← content script entry
│   │   ├── badge-injector.ts        ← injecte badge score dans la page
│   │   └── router-observer.ts       ← MutationObserver pour SPA routing
│   │
│   ├── popup/
│   │   ├── index.tsx                ← React root
│   │   ├── App.tsx
│   │   ├── store/
│   │   │   └── use-contrib-store.ts ← Zustand store
│   │   ├── components/
│   │   │   ├── TabBar.tsx
│   │   │   ├── IssueCard.tsx
│   │   │   ├── MatchScore.tsx       ← ring SVG animé
│   │   │   ├── StackBadge.tsx
│   │   │   ├── ImpactBar.tsx
│   │   │   └── EmptyState.tsx
│   │   └── pages/
│   │       ├── IssuesTab.tsx
│   │       ├── StackTab.tsx
│   │       └── ImpactTab.tsx
│   │
│   ├── options/
│   │   ├── index.tsx
│   │   └── OptionsPage.tsx          ← config GitHub token, préférences
│   │
│   └── shared/
│       ├── types.ts                 ← tous les types TypeScript
│       ├── constants.ts             ← TTL, scopes, API URLs
│       └── messages.ts              ← types des messages chrome.runtime
│
└── tests/
    ├── unit/
    │   ├── score-calculator.test.ts
    │   ├── issue-matcher.test.ts
    │   └── profile-analyzer.test.ts
    └── e2e/
        └── popup.spec.ts
```

---

## manifest.json — spec complète

```json
{
  "manifest_version": 3,
  "name": "ContribScope",
  "version": "1.0.0",
  "description": "Find your next OSS contribution in 10 seconds.",
  "permissions": [
    "storage",
    "identity",
    "notifications",
    "alarms",
    "activeTab"
  ],
  "host_permissions": [
    "https://api.github.com/*",
    "https://registry.npmjs.org/*"
  ],
  "background": {
    "service_worker": "dist/background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://github.com/*/*"],
      "js": ["dist/content/index.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options.html",
  "oauth2": {
    "client_id": "__GITHUB_CLIENT_ID__",
    "scopes": ["read:user", "repo", "public_repo"]
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## Types TypeScript partagés (src/shared/types.ts)

```typescript
export interface UserProfile {
  login: string;
  name: string;
  avatarUrl: string;
  languages: Record<string, number>; // { "TypeScript": 0.45, "JavaScript": 0.30 }
  techStack: string[];               // tags normalisés: ["react", "nextjs", "nodejs"]
  mergedPRCount: number;
  avgPRSize: "small" | "medium" | "large"; // lignes modifiées
  streakDays: number;
  lastFetchedAt: number;             // timestamp ms
}

export interface RepoProfile {
  owner: string;
  name: string;
  fullName: string;
  stars: number;
  forks: number;
  languages: Record<string, number>;
  techStack: string[];
  openIssuesCount: number;
  maintainerResponseTime: number;    // heures moyennes
  lastActivityAt: string;
  matchScore: number;                // 0–100
  lastFetchedAt: number;
}

export interface ScoredIssue {
  id: number;
  number: number;
  title: string;
  url: string;
  labels: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  difficultyScore: number;           // 0–100
  difficulty: "easy" | "medium" | "advanced";
  relevanceScore: number;            // 0–100, pertinence pour l'user
  estimatedFiles: string[];          // fichiers probablement concernés
  techTags: string[];
}

export interface ImpactData {
  totalMergedPRs: number;
  usersImpacted: number;             // somme npm downloads
  topContributedRepos: string[];
  streakDays: number;
  streakAtRisk: boolean;             // true si pas de contrib depuis 20h
}

// Messages entre content script / popup et service worker
export type ExtMessage =
  | { type: "GET_REPO_DATA"; repoFullName: string }
  | { type: "GET_USER_PROFILE" }
  | { type: "GET_ISSUES"; repoFullName: string; filters: IssueFilters }
  | { type: "GET_IMPACT" }
  | { type: "AUTH_LOGIN" }
  | { type: "AUTH_LOGOUT" }
  | { type: "ISSUE_FEEDBACK"; issueId: number; feedback: "too_easy" | "too_hard" | "just_right" };

export type ExtResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface IssueFilters {
  maxDifficulty?: "easy" | "medium" | "advanced";
  techTags?: string[];
  maxAge?: number; // jours
}

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttlMs: number;
}
```

---

## Algorithme de scoring — score-calculator.ts

Implémente **exactement** cet algorithme. Les poids sont calibrés et ne doivent
pas être modifiés sans test.

```typescript
// Score final = somme pondérée (0–100)

export function calculateMatchScore(
  userProfile: UserProfile,
  repoProfile: Pick<RepoProfile, "languages" | "techStack" | "stars" | "maintainerResponseTime" | "openIssuesCount">,
  scoredIssues: ScoredIssue[]
): number {
  const stackOverlap   = computeStackOverlap(userProfile, repoProfile) * 35;
  const contribLevel   = computeContribLevel(userProfile, repoProfile) * 25;
  const issueMatch     = computeIssueMatch(userProfile, scoredIssues) * 20;
  const repoActivity   = computeRepoActivity(repoProfile) * 12;
  const popularity     = computePopularity(repoProfile) * 8;

  return Math.round(stackOverlap + contribLevel + issueMatch + repoActivity + popularity);
}

// Stack overlap: intersection cosine-like entre langages user et repo
function computeStackOverlap(user: UserProfile, repo: Pick<RepoProfile, "languages" | "techStack">): number {
  const userLangs = new Set(Object.keys(user.languages).map(l => l.toLowerCase()));
  const repoLangs = new Set(Object.keys(repo.languages).map(l => l.toLowerCase()));
  const techIntersect = user.techStack.filter(t => repo.techStack.includes(t)).length;
  const langIntersect = [...userLangs].filter(l => repoLangs.has(l)).length;
  const langUnion = new Set([...userLangs, ...repoLangs]).size;
  const jaccardLang = langUnion > 0 ? langIntersect / langUnion : 0;
  const techScore = Math.min(techIntersect / Math.max(user.techStack.length, 1), 1);
  return (jaccardLang * 0.5 + techScore * 0.5);
}

// Niveau de contribution: compare tes PRs mergées vs complexité estimée du repo
function computeContribLevel(user: UserProfile, repo: any): number {
  const base = Math.min(user.mergedPRCount / 20, 1); // 20 PRs = expert
  const sizeMultiplier = user.avgPRSize === "large" ? 1 : user.avgPRSize === "medium" ? 0.7 : 0.4;
  return base * sizeMultiplier;
}

// Issue match: ratio d'issues accessibles vs total
function computeIssueMatch(user: UserProfile, issues: ScoredIssue[]): number {
  if (issues.length === 0) return 0;
  const maxDiff = user.mergedPRCount > 20 ? 80 : user.mergedPRCount > 5 ? 55 : 35;
  const accessible = issues.filter(i => i.difficultyScore <= maxDiff).length;
  return Math.min(accessible / Math.max(issues.length, 1), 1);
}

// Activité repo: maintainer response time (heures)
function computeRepoActivity(repo: Pick<RepoProfile, "maintainerResponseTime">): number {
  // < 24h = excellent, < 72h = bon, > 1 semaine = mauvais
  const h = repo.maintainerResponseTime;
  if (h < 24) return 1;
  if (h < 72) return 0.7;
  if (h < 168) return 0.4;
  return 0.1;
}

// Popularité: log-normalized stars
function computePopularity(repo: Pick<RepoProfile, "stars">): number {
  return Math.min(Math.log10(Math.max(repo.stars, 1)) / 5, 1);
}
```

---

## Difficulty scorer — issue-matcher.ts

```typescript
export function scoreDifficulty(issue: RawGitHubIssue): number {
  let score = 0;

  // Labels (le signal le plus fort)
  const labels = issue.labels.map((l: any) => l.name.toLowerCase());
  if (labels.some(l => l.includes("good first issue"))) score -= 30;
  if (labels.some(l => l.includes("help wanted")))      score += 5;
  if (labels.some(l => l.includes("blocked")))          score += 30;
  if (labels.some(l => l.includes("breaking change")))  score += 25;
  if (labels.some(l => l.includes("performance")))      score += 15;
  if (labels.some(l => l.includes("security")))         score += 20;

  // Longueur de la description
  const bodyLen = (issue.body ?? "").length;
  if (bodyLen > 1000) score += 20;
  else if (bodyLen > 300) score += 8;
  else if (bodyLen < 80) score -= 5;

  // Nombre de commentaires
  const comments = issue.comments ?? 0;
  if (comments > 15) score += 20;
  else if (comments > 5) score += 10;

  // Fichiers mentionnés dans le body
  const fileMentions = (issue.body ?? "").match(/[\w/.-]+\.[a-z]{1,6}/g) ?? [];
  score += Math.min(fileMentions.length * 3, 15);

  // Âge
  const ageMs = Date.now() - new Date(issue.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > 180 && comments < 3) score += 10; // vieille + silencieuse = hard

  const clamped = Math.max(0, Math.min(100, score + 50)); // base à 50
  return clamped;
}

export function difficultyLabel(score: number): "easy" | "medium" | "advanced" {
  if (score < 35) return "easy";
  if (score < 65) return "medium";
  return "advanced";
}
```

---

## GitHub OAuth PKCE flow — auth/oauth.ts

```typescript
// Pas de client_secret — PKCE uniquement
// redirect_uri = chrome.identity.getRedirectURL()

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const SCOPES = "read:user repo public_repo";

export async function launchOAuthFlow(): Promise<string> {
  const redirectUri = chrome.identity.getRedirectURL();
  const state = crypto.randomUUID();

  // Génération PKCE
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const responseUrl: string = await new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (url) => {
        if (chrome.runtime.lastError || !url) reject(chrome.runtime.lastError);
        else resolve(url);
      }
    );
  });

  const params = new URL(responseUrl).searchParams;
  if (params.get("state") !== state) throw new Error("State mismatch");
  const code = params.get("code");
  if (!code) throw new Error("No code in response");

  // Exchange code → token via GitHub (nécessite un proxy serverless si GitHub
  // ne supporte pas PKCE natif — déployer une Vercel Edge Function légère)
  // Alternative MVP : stocker directement un PAT généré par l'user dans options
  const token = await exchangeCodeForToken(code, verifier, redirectUri);
  await storeToken(token);
  return token;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
```

> **Note MVP :** GitHub ne supporte pas PKCE nativement pour les OAuth Apps.
> Deux options : (1) déployer une Vercel Edge Function `/api/exchange` qui fait
> le code→token swap avec le client_secret côté serveur (recommandé), ou
> (2) permettre à l'user de coller un PAT (Personal Access Token) dans les
> options — plus simple pour le MVP.

---

## Cache TTL — cache/storage.ts

```typescript
const TTL = {
  USER_PROFILE: 6 * 60 * 60 * 1000,   // 6 heures
  REPO_PROFILE: 60 * 60 * 1000,         // 1 heure
  ISSUES:       15 * 60 * 1000,         // 15 minutes
  IMPACT:       60 * 60 * 1000,         // 1 heure
};

export async function getCached<T>(key: string): Promise<T | null> {
  const result = await chrome.storage.local.get(key);
  const entry: CacheEntry<T> | undefined = result[key];
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

// Clés de cache
export const CACHE_KEYS = {
  userProfile: () => "profile:user",
  repoProfile: (fullName: string) => `repo:${fullName}`,
  issues:      (fullName: string) => `issues:${fullName}`,
  impact:      () => "impact:user",
  token:       () => "auth:token",
};
```

---

## Content script — badge-injector.ts

```typescript
// Injecte un badge "85% match" dans le header d'un repo GitHub
// Cible : <h1 class="d-flex..."> qui contient le nom du repo

export async function injectRepoBadge(matchScore: number): Promise<void> {
  // Retire l'ancien badge si présent
  document.getElementById("contribscope-badge")?.remove();

  const repoHeader = document.querySelector('[data-testid="repository-header"]')
    ?? document.querySelector(".repository-content h1");
  if (!repoHeader) return;

  const badge = document.createElement("span");
  badge.id = "contribscope-badge";
  badge.style.cssText = `
    display: inline-flex; align-items: center; gap: 4px;
    margin-left: 10px; padding: 2px 8px;
    background: #EEEDFE; color: #534AB7;
    border: 0.5px solid #CECBF6; border-radius: 20px;
    font-size: 12px; font-weight: 500; font-family: sans-serif;
    cursor: pointer; vertical-align: middle;
  `;
  badge.textContent = `⚡ ${matchScore}% match`;
  badge.title = "ContribScope — cliquez pour voir les issues recommandées";
  badge.onclick = () => chrome.runtime.sendMessage({ type: "OPEN_POPUP" });

  repoHeader.appendChild(badge);
}
```

---

## SPA Router Observer — router-observer.ts

```typescript
// GitHub est une SPA. Les navigations ne déclenchent pas de reload.
// On écoute les changements d'URL via webNavigation ET MutationObserver.

let currentRepo = "";

export function startRouterObserver(): void {
  // Écoute les push/popstate state (turbo navigation de GitHub)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "URL_CHANGED") handleUrlChange(msg.url);
  });

  // Observer DOM pour changements de titre (fallback)
  const observer = new MutationObserver(() => {
    const url = window.location.pathname;
    if (url !== currentRepo) {
      currentRepo = url;
      handleUrlChange(url);
    }
  });
  observer.observe(document.querySelector("title") ?? document.head, {
    childList: true, subtree: true
  });
}

function handleUrlChange(path: string): void {
  const match = path.match(/^\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return;
  const [, owner, repo] = match;
  chrome.runtime.sendMessage({
    type: "GET_REPO_DATA",
    repoFullName: `${owner}/${repo}`
  }, (response) => {
    if (response?.success) injectRepoBadge(response.data.matchScore);
  });
}
```

---

## GitHub GraphQL query — profil complet en 1 requête

```graphql
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
```

---

## Règles et contraintes importantes

### Performance
- Toutes les requêtes API passent par le **service worker uniquement**.
  Le popup et le content script font uniquement `chrome.runtime.sendMessage`.
- Batch GraphQL obligatoire : ne jamais faire 2 requêtes API si une seule
  query GraphQL peut couvrir les deux.
- Lazy loading des issues : charger les 20 premières, paginer à la demande.

### Sécurité
- Jamais de `eval()`, jamais de `innerHTML` avec data externe.
- Le token GitHub est stocké **uniquement** dans `chrome.storage.local`,
  jamais en `localStorage` ou en mémoire partagée.
- Content Security Policy dans le manifest : interdire les scripts inline.
- Valider **tous** les inputs venant des messages chrome.runtime (schema Zod).

### Qualité code
- TypeScript strict mode (`"strict": true` dans tsconfig).
- Pas de `any` explicite — utiliser `unknown` + type guards.
- Chaque fonction de l'engine doit avoir des tests unitaires.
- Couvrir les cas d'erreur : token invalide, rate limit, repo privé,
  pas d'issues, réseau offline.

### UX
- Le badge doit apparaître en **< 200ms** si le cache est valide.
- Si la requête API prend > 1s, afficher un spinner dans le popup.
- Toujours afficher l'état vide de façon utile (suggestions de repos
  similaires si pas d'issues accessibles).
- Respecter `prefers-reduced-motion` pour les animations.

---

## GitHub API — endpoints clés

| Endpoint | Usage | TTL cache |
|---|---|---|
| `GET /user` | Infos de base user connecté | 6h |
| `POST /graphql` (UserProfile query) | Profil complet + langages | 6h |
| `GET /repos/{owner}/{repo}` | Méta repo | 1h |
| `GET /repos/{owner}/{repo}/languages` | Distribution langages | 1h |
| `GET /repos/{owner}/{repo}/issues?state=open&per_page=50` | Issues ouvertes | 15min |
| `GET /repos/{owner}/{repo}/contents/{file}` | Détection stack (package.json etc.) | 1h |
| `GET /repos/{owner}/{repo}/pulls?state=closed&sort=updated` | Response time estimation | 1h |
| `https://registry.npmjs.org/downloads/point/last-month/{pkg}` | Downloads npm | 1h |

**Headers obligatoires sur toutes les requêtes GitHub :**
```
Authorization: Bearer {token}
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

---

## Détection de stack — repo-analyzer.ts

Fichiers à chercher dans l'ordre, résolution de tech tags :

```typescript
const STACK_DETECTORS: Array<{
  file: string;
  parser: (content: string) => string[];
}> = [
  {
    file: "package.json",
    parser: (c) => {
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
    },
  },
  {
    file: "pom.xml",
    parser: (c) => {
      const tags = ["java"];
      if (c.includes("spring-boot")) tags.push("spring-boot");
      if (c.includes("spring-web"))  tags.push("spring");
      if (c.includes("quarkus"))     tags.push("quarkus");
      return tags;
    },
  },
  {
    file: "build.gradle",
    parser: (c) => {
      const tags = ["java", "gradle"];
      if (c.includes("org.springframework.boot")) tags.push("spring-boot");
      return tags;
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
```

---

## Options page — fonctionnalités requises

1. **Connexion GitHub** — bouton OAuth ou champ PAT (Personal Access Token)
2. **Niveau de difficulté max** — slider Easy / Medium / Advanced
3. **Langages à exclure** — multiselect
4. **Objectif hebdomadaire** — nb de PRs cible (pour la gamification)
5. **Repos suivis** — liste des repos à surveiller en permanence
6. **Notification streak** — toggle on/off
7. **Déconnexion** — efface le token et tous les caches

---

## Tests — cas critiques à couvrir

### Unitaires (Vitest)
```typescript
// score-calculator.test.ts
describe("calculateMatchScore", () => {
  it("returns 100 for perfect stack match", ...)
  it("returns < 30 for completely different stack", ...)
  it("penalizes repos with slow maintainer response", ...)
  it("boosts repos with accessible issues", ...)
  it("never returns outside 0–100", ...)
})

// issue-matcher.test.ts
describe("scoreDifficulty", () => {
  it('marks "good first issue" as easy', ...)
  it("increases score for long descriptions", ...)
  it("increases score for issues with many comments", ...)
  it("flags old silent issues as harder", ...)
})
```

### E2E (Playwright)
```typescript
// popup.spec.ts
test("popup shows match score when visiting a repo", async ({ page, context }) => {
  // Mock GitHub API via MSW
  // Navigate to github.com/facebook/react
  // Open extension popup
  // Assert match score ring is visible
  // Assert at least one issue card is rendered
})
```

---

## Vite config — multi-entry pour extension

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup:   "popup.html",
        options: "options.html",
        background: "src/background/service-worker.ts",
        content:    "src/content/index.ts",
      },
      output: {
        entryFileNames: "[name]/index.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    target: "chrome112",
    outDir: "dist",
  },
});
```

---

## Plan d'exécution — ordre des tâches

Exécute **dans cet ordre exact**, phase par phase. Ne passe pas à la phase
suivante sans que les tests de la phase courante soient verts.

### Phase 0 — Bootstrap (2j)
1. Initialiser le projet Vite + React + TypeScript
2. Configurer Tailwind CSS
3. Créer la structure de fichiers (toute la structure listée ci-dessus)
4. Écrire `manifest.json`
5. Implémenter `chrome.storage.local` wrapper + TTL cache
6. Implémenter OAuth PKCE flow (ou PAT fallback pour MVP)
7. Tester l'auth manuellement : token récupéré, stocké, retrievable

### Phase 1 — Profile Analyzer (4j)
1. Écrire la query GraphQL UserProfile
2. Implémenter `profile-analyzer.ts` + parsing
3. Normaliser les techStack tags
4. Écrire les tests unitaires
5. Tester avec un vrai compte GitHub (le sien)

### Phase 2 — Repo Analyzer + Issue Matcher (5j)
1. Implémenter `repo-analyzer.ts` avec tous les STACK_DETECTORS
2. Implémenter `issue-matcher.ts` avec `scoreDifficulty`
3. Implémenter `score-calculator.ts` avec l'algorithme exact ci-dessus
4. Écrire les tests unitaires pour les 3 modules
5. Câbler dans le service worker : message GET_REPO_DATA → pipeline complet

### Phase 3 — UI Popup + Content Script (5j)
1. Implémenter le popup React (App.tsx + tous les composants)
2. Implémenter le Zustand store
3. Implémenter le content script + badge injector
4. Implémenter le router observer (MutationObserver + webNavigation)
5. Tester end-to-end sur GitHub (charger l'extension en mode développeur)

### Phase 4 — Gamification (3j)
1. Implémenter `impact-tracker.ts` (npm downloads + streak)
2. Implémenter les `chrome.alarms` pour la vérification daily
3. Implémenter les `chrome.notifications` (streak en danger)
4. Brancher l'onglet Impact dans le popup

### Phase 5 — Polish & Ship (4j)
1. Écrire les tests E2E Playwright
2. Fixer tous les bugs trouvés
3. Optimiser les performances (profiler les appels API, réduire les re-renders)
4. Préparer les assets Chrome Web Store (screenshots, description, privacy policy)
5. Soumettre à la review Chrome Web Store
6. Publier le repo en open source

---

## Commandes de développement

```bash
# Install
npm install

# Dev build (watch mode)
npm run dev

# Charger dans Chrome :
# 1. chrome://extensions
# 2. "Mode développeur" ON
# 3. "Charger l'extension non empaquetée" → sélectionner /dist

# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Build production
npm run build

# Package pour Web Store
npm run build && zip -r contribscope.zip dist/
```

---

## Variables d'environnement (.env)

```env
VITE_GITHUB_CLIENT_ID=your_github_oauth_app_client_id
VITE_TOKEN_EXCHANGE_URL=https://your-vercel-app.vercel.app/api/exchange
```

Ne jamais commiter `.env`. Ajouter au `.gitignore`.

---

## Checklist de validation finale

Avant de soumettre au Chrome Web Store :

- [ ] `manifest.json` : pas de permissions inutiles (aucun `<all_urls>`)
- [ ] Token GitHub : stocké uniquement dans `chrome.storage.local`
- [ ] Pas de `eval()`, pas de `innerHTML` avec data externe
- [ ] Content Security Policy configurée dans le manifest
- [ ] Tous les tests unitaires passent
- [ ] E2E testé sur Chrome stable + Chrome beta
- [ ] Popup fonctionne avec et sans connexion GitHub
- [ ] Gestion d'erreur : rate limit, réseau offline, repo privé, 0 issues
- [ ] `README.md` avec screenshots et instructions d'installation
- [ ] `PRIVACY_POLICY.md` mentionnant que le token reste local
- [ ] Screenshots 1280×800 px pour le Web Store (min 1, max 5)
- [ ] Icônes : 16x16, 48x48, 128x128 px (PNG)

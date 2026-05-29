import { injectRepoBadge } from "./badge-injector";

let currentPath = "";

export function startRouterObserver(): void {
  // Listen for messages from background (e.g., if we want to trigger from there)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "URL_CHANGED") handleUrlChange(msg.url);
  });

  // Observe DOM for title changes (GitHub's way of indicating navigation)
  const observer = new MutationObserver(() => {
    const path = window.location.pathname;
    if (path !== currentPath) {
      currentPath = path;
      handleUrlChange(path);
    }
  });

  observer.observe(document.querySelector("title") || document.head, {
    childList: true,
    subtree: true,
  });

  // Initial check
  currentPath = window.location.pathname;
  handleUrlChange(currentPath);
}

function handleUrlChange(path: string): void {
  const match = path.match(/^\/([^/]+)\/([^/]+)\/?$/);
  if (!match) {
    document.getElementById("contribscope-badge")?.remove();
    return;
  }

  const [, owner, repo] = match;
  chrome.runtime.sendMessage({
    type: "GET_REPO_DATA",
    repoFullName: `${owner}/${repo}`
  }, (response) => {
    if (response?.success && response.data.matchScore !== undefined) {
      injectRepoBadge(response.data.matchScore);
    }
  });
}

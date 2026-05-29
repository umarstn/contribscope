export async function injectRepoBadge(matchScore: number): Promise<void> {
  // Remove old badge if present
  document.getElementById("contribscope-badge")?.remove();

  const repoHeader = document.querySelector('[data-testid="repository-header"]')
    ?? document.querySelector(".repository-content h1")
    ?? document.querySelector("#repository-container-header h1");
    
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
    transition: transform 0.2s ease;
  `;
  badge.textContent = `⚡ ${matchScore}% match`;
  badge.title = "ContribScope — Click to see recommended issues";
  
  badge.onmouseenter = () => { badge.style.transform = "scale(1.05)"; };
  badge.onmouseleave = () => { badge.style.transform = "scale(1)"; };
  badge.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
  };

  // Find the right place to append (after the repo name)
  const repoName = repoHeader.querySelector("strong a") || repoHeader.querySelector("a") || repoHeader;
  repoName.after(badge);
}

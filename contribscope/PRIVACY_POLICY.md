# Privacy Policy

ContribScope ("the extension") is committed to protecting your privacy.

## Data Storage

- **GitHub Personal Access Token**: Your GitHub PAT is stored exclusively in your browser's local storage (`chrome.storage.local`). It is never transmitted to any server other than the official GitHub API (`api.github.com`).
- **Caching**: Data fetched from the GitHub API (user profile, repository data, issues) is cached locally to improve performance. This data is also stored only in your browser.

## Data Usage

The extension uses your data solely to:
1. Analyze your GitHub profile and repository history.
2. Calculate match scores and recommend issues.
3. Track your contribution impact and streaks.

## Third-Party Services

- **GitHub API**: The extension communicates directly with the GitHub API to fetch your data.
- **npm Registry API**: The extension may fetch download statistics from the npm registry to estimate impact.

## Security

We do not use `eval()` or `innerHTML` with external data to prevent Cross-Site Scripting (XSS) attacks. All API communication is performed over HTTPS.

## Changes to This Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on the extension's repository page.

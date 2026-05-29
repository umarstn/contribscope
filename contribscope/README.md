# ContribScope

Find your next Open Source contribution in 10 seconds.

ContribScope is a Chromium extension that helps developers find relevant GitHub issues based on their technical skills, experience level, and contribution history.

## Features

- **Match Score**: Get a personalized score (0-100) for every repository you visit on GitHub.
- **Recommended Issues**: See a curated list of open issues sorted by relevance and difficulty.
- **Stack Analysis**: Compare your primary languages and technologies with any repository.
- **Impact Tracking**: Track your total merged PRs, contribution streaks, and the impact (npm downloads) of your work.
- **Streak Reminders**: Receive notifications when your contribution streak is at risk.

## Installation

1. Clone this repository.
2. Run `npm install` and `npm run build`.
3. Open Chrome and go to `chrome://extensions`.
4. Enable **Developer mode** (top right).
5. Click **Load unpacked** and select the `dist` folder in the project directory.

## Configuration

1. Click the ContribScope icon in your browser toolbar.
2. Go to **Settings** (or right-click the extension and select Options).
3. Paste a **GitHub Personal Access Token (PAT)**. 
   - Required scopes: `read:user`, `repo`, `public_repo`.
4. Save the token and start exploring GitHub!

## Tech Stack

- **Vite 5 + React 18 + TypeScript**
- **Zustand**: State management
- **Tailwind CSS**: Styling
- **GitHub GraphQL & REST APIs**
- **Vitest**: Unit testing

## License

MIT

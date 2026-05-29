import React, { useEffect, useState } from "react";
import { useContribStore } from "./store/use-contrib-store";
import { MatchScore } from "./components/MatchScore";
import { IssuesTab } from "./pages/IssuesTab";
import { StackTab } from "./pages/StackTab";
import { ImpactTab } from "./pages/ImpactTab";
import { clsx } from "clsx";

const App: React.FC = () => {
  const { user, currentRepo, fetchUserProfile, fetchRepoData, fetchIssues } = useContribStore();
  const [activeTab, setActiveTab] = useState<"issues" | "stack" | "impact">("issues");

  useEffect(() => {
    fetchUserProfile();
    
    // Get current tab URL to detect repo
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url;
      if (url) {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (match) {
          const fullName = `${match[1]}/${match[2]}`;
          fetchRepoData(fullName);
          fetchIssues(fullName);
        }
      }
    });
  }, []);

  return (
    <div className="w-[350px] min-h-[500px] bg-white flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-indigo-100 shadow-lg">
            S
          </div>
          <h1 className="text-lg font-extrabold tracking-tight">ContribScope</h1>
        </div>
        {user && (
          <img src={user.avatarUrl} alt={user.login} className="w-8 h-8 rounded-full border-2 border-indigo-50 shadow-sm" />
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {currentRepo ? (
          <div className="p-4 bg-gradient-to-b from-indigo-50/50 to-transparent">
            <div className="flex items-center space-x-6 mb-4">
              <MatchScore score={currentRepo.matchScore} />
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Current Repo</h2>
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate w-40">
                  {currentRepo.name}
                </h3>
                <div className="flex items-center text-xs text-gray-500 font-medium">
                  <span className="mr-3">⭐ {currentRepo.stars.toLocaleString()}</span>
                  <span>🍴 {currentRepo.forks.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 mb-2">
              {[
                { id: "issues", label: "Issues" },
                { id: "stack", label: "Stack" },
                { id: "impact", label: "Impact" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                    activeTab === tab.id 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "issues" && <IssuesTab />}
            {activeTab === "stack" && <StackTab />}
            {activeTab === "impact" && <ImpactTab />}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-2">
              🐙
            </div>
            <h2 className="text-lg font-bold text-gray-800">No Repo Detected</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Open a GitHub repository to see how well it matches your skills and find your next contribution.
            </p>
            <button 
              onClick={() => window.open("https://github.com", "_blank")}
              className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors"
            >
              Go to GitHub
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <span>v1.0.0</span>
        <button 
          onClick={() => chrome.runtime.openOptionsPage()}
          className="hover:text-indigo-600 transition-colors"
        >
          Settings
        </button>
      </footer>
    </div>
  );
};

export default App;

import React, { useState, useEffect } from "react";
import { getToken, storeToken, removeToken } from "../background/auth/token-store";

export const OptionsPage: React.FC = () => {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    getToken().then((storedToken) => {
      if (storedToken) setToken(storedToken);
    });
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    try {
      await storeToken(token);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save token:", error);
      setStatus("error");
    }
  };

  const handleLogout = async () => {
    await removeToken();
    setToken("");
    setStatus("idle");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ContribScope Options</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <p className="mt-2 text-xs text-gray-500">
              Your token is stored locally in your browser and is only used to fetch data from the GitHub API.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleSave}
              disabled={status === "saving"}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                status === "saving" ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {status === "saving" ? "Saving..." : "Save Token"}
            </button>

            {token && (
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear Token
              </button>
            )}
          </div>

          {status === "success" && (
            <p className="text-sm text-green-600">Token saved successfully!</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600">Failed to save token. Please try again.</p>
          )}
        </div>

        <section className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">How to get a PAT?</h2>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
            <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">GitHub Settings &gt; Developer settings &gt; Personal access tokens</a>.</li>
            <li>Click <b>Generate new token (classic)</b>.</li>
            <li>Select <b>read:user</b>, <b>repo</b>, and <b>public_repo</b> scopes.</li>
            <li>Copy the generated token and paste it above.</li>
          </ol>
        </section>
      </div>
    </div>
  );
};

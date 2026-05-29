import React from "react";
import { useContribStore } from "../store/use-contrib-store";
import { IssueCard } from "../components/IssueCard";

export const IssuesTab: React.FC = () => {
  const { issues, loading, error, currentRepo } = useContribStore();

  if (loading && issues.length === 0) return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="text-sm text-gray-500 font-medium">Analyzing issues...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center">
      <p className="text-red-500 text-sm mb-4">Error: {error}</p>
      <button 
        onClick={() => currentRepo && useContribStore.getState().fetchIssues(currentRepo.fullName)}
        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-200 hover:bg-indigo-100 font-bold"
      >
        Retry
      </button>
    </div>
  );

  if (!currentRepo) return (
    <div className="p-8 text-center">
      <p className="text-sm text-gray-500">Visit a GitHub repository to see recommended issues.</p>
    </div>
  );

  if (issues.length === 0) return (
    <div className="p-8 text-center">
      <p className="text-sm text-gray-500">No open issues found for this repository.</p>
    </div>
  );

  return (
    <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recommended for you</h2>
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
};

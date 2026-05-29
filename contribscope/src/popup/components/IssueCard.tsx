import React from "react";
import { ScoredIssue } from "../../shared/types";
import { clsx } from "clsx";

interface IssueCardProps {
  issue: ScoredIssue;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-amber-100 text-amber-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", getDifficultyColor(issue.difficulty))}>
          {issue.difficulty}
        </span>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
          {issue.relevanceScore}% Relevance
        </span>
      </div>
      
      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
        <a href={issue.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600">
          #{issue.number} {issue.title}
        </a>
      </h3>

      <div className="flex flex-wrap gap-1 mt-2">
        {issue.techTags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

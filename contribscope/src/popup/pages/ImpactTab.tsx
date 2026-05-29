import React, { useEffect } from "react";
import { useContribStore } from "../store/use-contrib-store";

export const ImpactTab: React.FC = () => {
  const { impact, loading, error, fetchImpact } = useContribStore();

  useEffect(() => {
    fetchImpact();
  }, []);

  if (loading && !impact) return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="text-sm text-gray-500 font-medium">Calculating impact...</p>
    </div>
  );

  if (error) return <div className="p-8 text-center text-red-500 text-sm">Error: {error}</div>;
  if (!impact) return <div className="p-8 text-center text-gray-500 text-sm">No impact data available.</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Merged PRs</span>
          <span className="text-2xl font-extrabold text-gray-900">{impact.totalMergedPRs}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Users Impacted</span>
          <span className="text-2xl font-extrabold text-gray-900">{(impact.usersImpacted / 1000).toFixed(1)}k</span>
        </div>
      </div>

      <section className={`rounded-xl p-4 border ${
        impact.streakAtRisk ? "bg-amber-50 border-amber-200" : "bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-100"
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-xs font-bold uppercase tracking-widest mb-1 ${
              impact.streakAtRisk ? "text-amber-800" : "text-indigo-100"
            }`}>
              Current Streak
            </h2>
            <p className={`text-3xl font-black ${
              impact.streakAtRisk ? "text-amber-900" : "text-white"
            }`}>
              {impact.streakDays} Days
            </p>
          </div>
          <div className="text-4xl">
            {impact.streakAtRisk ? "⚠️" : "🔥"}
          </div>
        </div>
        {impact.streakAtRisk && (
          <p className="mt-2 text-xs font-bold text-amber-700 animate-pulse">
            Contribute today to keep your streak alive!
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Top Contributions</h2>
        <div className="space-y-2">
          {impact.topContributedRepos.map((repo, idx) => (
            <div key={repo} className="flex items-center text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-100">
              <span className="w-5 text-gray-300 mr-2 font-black">{idx + 1}</span>
              {repo}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

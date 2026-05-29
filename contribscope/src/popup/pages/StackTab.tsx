import React from "react";
import { useContribStore } from "../store/use-contrib-store";

export const StackTab: React.FC = () => {
  const { currentRepo, user } = useContribStore();

  if (!currentRepo || !user) return <div className="p-8 text-center text-gray-500 text-sm">No stack data available.</div>;

  const userLangs = Object.keys(user.languages);
  const repoLangs = Object.keys(currentRepo.languages);
  const commonLangs = userLangs.filter(l => repoLangs.includes(l));

  return (
    <div className="p-4 space-y-6">
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Language Match</h2>
        <div className="flex flex-wrap gap-2">
          {commonLangs.map(lang => (
            <div key={lang} className="flex items-center bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
              <span className="text-xs font-semibold text-indigo-700">{lang}</span>
            </div>
          ))}
          {commonLangs.length === 0 && <p className="text-xs text-gray-400 italic">No common languages detected.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Technical Stack</h2>
        <div className="flex flex-wrap gap-2">
          {currentRepo.techStack.map(tag => {
            const isMatch = user.techStack.includes(tag.toLowerCase());
            return (
              <div key={tag} className={`px-3 py-1 rounded border text-xs font-medium ${
                isMatch ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-600"
              }`}>
                {tag} {isMatch && "✓"}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-100 rounded-lg p-3">
        <h2 className="text-[10px] font-bold text-blue-800 uppercase mb-1">Expert Advice</h2>
        <p className="text-xs text-blue-700">
          {currentRepo.matchScore > 70 
            ? "Your skills are a great fit for this project! You'll likely be productive right away."
            : currentRepo.matchScore > 40
            ? "You have some relevant experience, but might need to spend some time learning the codebase."
            : "This project uses a stack you're less familiar with. It could be a great learning opportunity!"}
        </p>
      </section>
    </div>
  );
};

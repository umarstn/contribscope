import React from "react";

interface MatchScoreProps {
  score: number;
  size?: number;
}

export const MatchScore: React.FC<MatchScoreProps> = ({ score, size = 120 }) => {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return "#10B981"; // Emerald-500
    if (s >= 40) return "#F59E0B"; // Amber-500
    return "#EF4444"; // Red-500
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 0.5s ease" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{score}%</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Match</span>
      </div>
    </div>
  );
};

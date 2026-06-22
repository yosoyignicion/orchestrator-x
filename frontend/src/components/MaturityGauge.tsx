"use client";

import { useEffect, useState } from "react";

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function MaturityGauge({ score, size = 180, strokeWidth = 12, label }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Color interpolation: red → yellow → green → blue
  const hue = Math.min(score * 1.2, 220); // 0→red, 100→blue
  const color = score >= 70 ? `hsl(${hue}, 80%, 55%)` : score >= 40 ? `hsl(${hue}, 85%, 50%)` : `hsl(0, 80%, 55%)`;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        {/* Animated progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold tracking-tight text-foreground" style={{ color }}>
          {animatedScore}
        </span>
        <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
          {label || "Maturity"}
        </span>
      </div>
    </div>
  );
}

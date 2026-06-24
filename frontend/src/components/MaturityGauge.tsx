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

  // Escala escarlata: más intenso = mejor
  const color =
    score >= 80
      ? "hsl(10, 95%, 55%)"
      : score >= 60
        ? "hsl(10, 85%, 48%)"
        : score >= 40
          ? "hsl(10, 75%, 38%)"
          : "hsl(10, 70%, 28%)";

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
          stroke="oklch(0.12 0.02 275)"
          strokeWidth={strokeWidth}
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
          style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold tracking-tight" style={{ color }}>
          {animatedScore}
        </span>
        <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
          {label || "Maturity"}
        </span>
      </div>
    </div>
  );
}

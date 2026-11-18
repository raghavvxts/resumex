import React from "react";
import { motion } from "framer-motion";

export const ScoreRing = ({
  score,
  size = 80,
  color = "#FFFFFF",
  loading = false,
}: {
  score: number;
  size?: number;
  color?: string;
  loading?: boolean;
}) => {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={loading ? "rgba(255,255,255,0.05)" : color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={loading ? circ : circ - (score / 100) * circ}
          className={loading ? "" : "metric-ring"}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-2xl font-bold font-display leading-none ${loading ? "text-[#A1A1AA]" : "text-white"}`}
        >
          {loading ? "--" : score}
        </span>
        <span
          className={`text-[9px] mt-0.5 ${loading ? "text-[#A1A1AA]" : "text-[#A1A1AA]"}`}
        >
          /100
        </span>
      </div>
    </div>
  );
};

export const BarProgress = ({
  value,
  color = "bar-fill-blue",
  height = "h-1",
  loading = false,
}: {
  value: number;
  color?: string;
  height?: string;
  loading?: boolean;
}) => (
  <div className={`bar-track w-full ${height}`}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: loading ? 0 : `${Math.min(value, 100)}%` }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className={`${height} ${loading ? "bg-transparent" : color} rounded-full`}
    />
  </div>
);

export const Dot = ({
  color,
  loading = false,
}: {
  color: string;
  loading?: boolean;
}) => (
  <span
    className="w-2 h-2 rounded-full inline-block transition-colors duration-500"
    style={{ background: loading ? "rgba(255,255,255,0.1)" : color }}
  />
);

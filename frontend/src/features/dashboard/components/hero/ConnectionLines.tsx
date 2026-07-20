import React from "react";

export const ConnectionLines = ({ active = false }: { active?: boolean }) => {
  // Use a viewBox with numeric coordinates instead of percentages (SVG path d attribute doesn't support %)
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Resting line material */}
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
        {/* Glow effect for active pulses */}

      </defs>

      {/* Paths connecting the orbital modules to the core (center). Dotted and extremely subtle for high-end dashboard aesthetics. */}
      
      {/* ATS (Top) */}
      <path d="M 50 10 Q 50 30 50 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="1.5 3" />
      
      {/* Projects (Left) */}
      <path d="M 10 40 Q 30 45 50 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="1.5 3" />
      
      {/* Skills (Right) */}
      <path d="M 90 40 Q 70 45 50 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="1.5 3" />
      
      {/* Experience (Bottom Left) */}
      <path d="M 15 75 Q 30 65 50 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="1.5 3" />
      
      {/* Summary (Bottom Right) */}
      <path d="M 85 75 Q 70 65 50 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="1.5 3" />
      
      {/* Strategist (Bottom Center) */}
      <path d="M 50 90 Q 50 70 50 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="1.5 3" />

      {/* Active Pulse Animation Layer */}
      {active && (
        <g stroke="var(--accent-functional)" strokeWidth="0.5" className="animate-line-travel" strokeDasharray="5 150">
          <path d="M 50 10 Q 50 30 50 50" fill="none" />
          <path d="M 10 40 Q 30 45 50 50" fill="none" />
          <path d="M 90 40 Q 70 45 50 50" fill="none" />
          <path d="M 15 75 Q 30 65 50 50" fill="none" />
          <path d="M 85 75 Q 70 65 50 50" fill="none" />
          <path d="M 50 90 Q 50 70 50 50" fill="none" />
        </g>
      )}
    </svg>
  );
};

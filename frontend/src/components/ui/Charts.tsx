import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Dot } from "./Progress";

export const KeywordDonut = ({ matched, total, loading = false }: { matched: number; total: number; loading?: boolean }) => {
  const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
  const size = 100; const sw = 12; const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={loading ? "rgba(255,255,255,0.05)" : "#FFFFFF"} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={loading ? circ : circ - (pct / 100) * circ}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter: loading ? "none" : "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : `${pct}%`}</span>
          <span className={`text-[8px] font-medium ${loading ? 'text-[#374151]' : 'text-[#6B7280]'}`}>Keywords</span>
        </div>
      </div>
      <div className="space-y-2 text-caption flex-1">
        <div className="flex items-center gap-2"><Dot color="#FFFFFF" loading={loading} /><span className={loading ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}>Matched</span><span className={`font-bold ml-auto ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : `${pct}%`}</span></div>
        <div className="flex items-center gap-2"><Dot color="#9CA3AF" loading={loading} /><span className={loading ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}>Missing</span><span className={`font-bold ml-auto ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : `${total > 0 ? Math.round(((total - matched) / total) * 100) : 0}%`}</span></div>
        <div className="flex items-center gap-2"><Dot color="#D1D5DB" loading={loading} /><span className={loading ? 'text-[#4B5563]' : 'text-[#9CA3AF]'}>Found</span><span className={`font-bold ml-auto ${loading ? 'text-[#4B5563]' : 'text-white'}`}>{loading ? "--" : matched}</span></div>
      </div>
    </div>
  );
};

export const SkillsRadarChart = ({ scores, loading }: { scores?: Record<string, number>, loading?: boolean }) => {
  const data = scores && Object.keys(scores).length > 0 
    ? Object.keys(scores).slice(0, 5).map(k => ({ subject: k.replace(/_/g, ' ').toUpperCase(), A: scores[k], fullMark: 100 }))
    : [
        { subject: 'Technical', A: loading ? 0 : 85, fullMark: 100 },
        { subject: 'Leadership', A: loading ? 0 : 65, fullMark: 100 },
        { subject: 'Communication', A: loading ? 0 : 90, fullMark: 100 },
        { subject: 'Strategy', A: loading ? 0 : 75, fullMark: 100 },
        { subject: 'Execution', A: loading ? 0 : 60, fullMark: 100 },
      ];

  return (
    <div className="w-full h-[220px]" style={{ filter: loading ? "none" : "drop-shadow(0 0 20px rgba(147,51,234,0.15))" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Skills" dataKey="A" stroke="#a855f7" strokeWidth={2} fill="url(#radarGradient)" fillOpacity={0.6} isAnimationActive={!loading} />
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Sparkles, AlertCircle, Zap, BrainCircuit } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { PlaceholderView } from "../../../components/ui/PlaceholderView";
import { AILoader } from "../../../components/ui/Shared";
import { BarProgress } from "../../../components/ui/Progress";
import { generateSkillsAnalysis } from "../../../services/api/skills";

export const SkillsAnalysisView = () => {
  const { file, resumeText, jobDescription, selectedRole, yearsExperience, setShowConfigDrawer, setShowStrategist, setStrategistQuery } = useResumeContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const generate = async () => {
    if (!file && !resumeText) {
      setError("Please upload or paste a resume first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resData = await generateSkillsAnalysis(file, resumeText, file ? "pdf" : "text", jobDescription, selectedRole, yearsExperience);
      setData(resData);
      if (data) {
        setToast("Analysis refreshed!");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!file && !resumeText) return (
    <PlaceholderView 
      title="Skills Analysis" 
      icon={BrainCircuit}
      iconColor="text-emerald-400"
      description="Upload your resume to map out your technical gaps and get upskilling recommendations."
    />
  );

  const CategorySection = ({ title, dataObj, colorClass, barColor }: { title: string, dataObj: any, colorClass: string, barColor: string }) => {
    if (!dataObj) return null;
    return (
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-white">{title}</h3>
          <div className="flex items-center gap-3 flex-1 max-w-[200px]">
            <span className="text-label font-semibold text-[#9CA3AF] shrink-0">{dataObj.score}/100</span>
            <BarProgress value={dataObj.score} color={barColor} height="h-2" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {dataObj.skills.map((skill: string, i: number) => (
            <span key={i} className={`px-3 py-1.5 rounded-lg text-label font-medium border ${colorClass}`}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-title font-bold text-white mb-2">Skills Analysis</h2>
          <p className="text-[#9CA3AF] text-body-sm">AI-powered deep dive into your technical and soft skills.</p>
        </div>
        {!data && !loading && (
          <button onClick={generate} className="btn-primary px-10 py-4 text-[17px] font-semibold gap-3 sm:shrink-0 hover:-translate-y-0.5 transition-all">
            <Sparkles className="w-5 h-5" />
            Analyze Skills
          </button>
        )}
      </div>
      
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-lg text-sm font-medium z-50 animate-fade-in-up">
          {toast}
        </div>
      )}

      {loading && (
        <div className="py-20">
          <AILoader msg="Scanning and categorizing skills..." />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-red-400 text-body-sm">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategorySection title="Technical Expertise" dataObj={data.technical} colorClass="bg-blue-500/10 text-blue-300 border-blue-500/20" barColor="bg-blue-500" />
            <CategorySection title="Soft Skills" dataObj={data.soft} colorClass="bg-emerald-500/10 text-emerald-300 border-emerald-500/20" barColor="bg-emerald-500" />
            <CategorySection title="Domain Knowledge" dataObj={data.domain} colorClass="bg-purple-500/10 text-purple-300 border-purple-500/20" barColor="bg-purple-500" />
            
            {/* Gaps Section */}
            {data.gaps && data.gaps.length > 0 && (
              <div className="glass-card p-6" style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-[16px] font-bold text-white">Identified Gaps</h3>
                </div>
                <div className="space-y-3">
                  {data.gaps.map((gap: string, i: number) => (
                    <div 
                      key={i} 
                      className="flex flex-col gap-2 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-all cursor-pointer group"
                      onClick={() => {
                        setShowStrategist(true);
                        setStrategistQuery(`How can I address this skill gap in my resume: ${gap}?`);
                      }}
                    >
                      <div className="flex gap-3 items-start text-body-sm text-[#D1D5DB] leading-relaxed">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="flex-1">{gap}</span>
                      </div>
                      <div className="flex justify-end text-amber-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                        Fix This →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <button onClick={generate} disabled={loading}
              className="btn-secondary px-10 py-4 text-[17px] font-semibold gap-3 shadow-sm border-white/5 hover:bg-white/5 w-full sm:w-auto justify-center hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-5 h-5" />
              {loading ? "Re-Analyzing..." : "Re-Analyze"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

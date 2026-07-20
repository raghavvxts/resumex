import React from "react";
import { motion } from "framer-motion";
import { FileText as FileIcon, Sparkles, Shield, Briefcase, TrendingUp, PenTool, BarChart3, Lightbulb, AlertTriangle } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { ScoreRing, BarProgress, Dot } from "../../../components/ui/Progress";
import { SkillsRadarChart } from "../../../components/ui/Charts";
import { COMPANY_NAMES, ROLE_NAMES } from "../../../constants";

export const AnalysisResults = () => {
  const { result, loading, isReady, mode, selectedCompany, selectedRole, setShowConfigDrawer, setShowStrategist, setStrategistQuery, setShowResumeModal } = useResumeContext();

  const matchedKw = result?.matched_keywords?.length || 0;
  const totalKw = (result?.matched_keywords?.length || 0) + (result?.missing_keywords?.length || 0);
  const atsScore = result ? Math.round((result.keyword_coverage || 0)) : 0;
  const missingKw = result?.missing_keywords?.slice(0, 12) || [];

  const scoreLabel = result ? (result.score >= 70 ? "Great Resume" : result.score >= 40 ? "Good Resume" : "Needs Improvement") : "Awaiting Scan";
  const scoreDesc = result
    ? (result.score >= 70 ? "Solid fundamentals. A few improvements can make it exceptional." : result.score >= 40 ? "Good base. Add more keywords and quantified achievements." : "Add more detail, keywords, and structure.")
    : "Upload your resume to see how well it matches the target role.";

  const openStrategistWithQuery = (q: string) => {
    if (!isReady) return;
    setStrategistQuery(q);
    setShowStrategist(true);
  };

  const cardBase = "glass-card p-6 flex flex-col";
  const skeletonCls = (extra = "") => `${cardBase} ${extra} ${!isReady && loading ? "skeleton-pulse" : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-4 sm:p-6 md:p-8 flex flex-col relative z-10"
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-title font-bold text-white tracking-tight font-display">
            {isReady ? "Analysis Report" : "Dashboard"}
          </h2>
          <p className="text-[#6B7280] text-body-sm mt-1">
            {isReady
              ? `${result?.candidate_name || "Candidate"} · ${mode === "template" ? `${COMPANY_NAMES[selectedCompany]} — ${ROLE_NAMES[selectedRole]}` : mode === "audit" ? "General ATS Audit" : "Custom Job Description"}`
              : "No analysis currently active."}
          </p>
        </div>
        <div className="flex gap-2">
          {isReady && (
            <button onClick={() => setShowResumeModal(true)}
              className="btn-secondary px-5 py-2.5 text-[13px] font-semibold gap-2">
              <FileIcon className="w-4 h-4" />
              View Dossier
            </button>
          )}
          {!isReady && (
            <button onClick={() => setShowConfigDrawer(true)}
              className="btn-primary px-6 py-2.5 text-[14px] font-semibold gap-2">
              <Sparkles className="w-4 h-4" />
              Start Scan
            </button>
          )}
        </div>
      </div>

      <div className={`relative flex-1 transition-opacity duration-500 ${!isReady && loading ? "opacity-30 blur-sm pointer-events-none" : ""}`}>

        {/* ─── Row 1: Score + ATS + Role Match + Radar ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

          {/* Score Ring — tall left card (spans 2 rows) */}
          <div className={`${skeletonCls("justify-center items-center gap-4 lg:col-span-1 lg:row-span-2 min-h-[300px]")}`}>
            <ScoreRing score={result?.score || 0} color="#FFFFFF" loading={!isReady} />
            <div className="text-center mt-2">
              <p className="text-caption font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Overall Match</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Dot color="#FFFFFF" loading={!isReady} />
                <span className={`text-[15px] font-bold ${!isReady ? "text-[#6B7280]" : "text-white"}`}>{scoreLabel}</span>
              </div>
              <p className="text-label text-[#9CA3AF] leading-relaxed max-w-[200px] mx-auto">{scoreDesc}</p>
            </div>
          </div>

          {/* ATS Score */}
          <div className={`${skeletonCls("justify-between lg:col-span-1 min-h-[140px]")}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-caption font-bold uppercase tracking-widest text-[#9CA3AF]">ATS Score</p>
              <Shield className="w-4 h-4 text-[#9CA3AF]" />
            </div>
            <div>
              <p className={`text-4xl font-bold font-display ${!isReady ? "text-[#4B5563]" : "text-white"}`}>
                {isReady ? atsScore : "--"}<span className={`text-xl ${!isReady ? "text-[#374151]" : "text-white"}`}>%</span>
              </p>
              <div className="mt-2 mb-2"><BarProgress value={atsScore} color="bg-white/30" height="h-2" loading={!isReady} /></div>
              <p className="text-caption text-[#4B5563]">Keyword compatibility</p>
            </div>
          </div>

          {/* Role Match */}
          <div className={`${skeletonCls("justify-between lg:col-span-1 min-h-[140px]")}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-caption font-bold uppercase tracking-widest text-[#9CA3AF]">Role Match</p>
              <Briefcase className="w-4 h-4 text-[#9CA3AF]" />
            </div>
            <div>
              <p className={`text-4xl font-bold font-display ${!isReady ? "text-[#4B5563]" : "text-white"}`}>
                {isReady ? result?.score : "--"}<span className={`text-xl ${!isReady ? "text-[#374151]" : "text-white"}`}>%</span>
              </p>
              <div className="mt-2 mb-2"><BarProgress value={result?.score || 0} color="bg-white/30" height="h-2" loading={!isReady} /></div>
              <p className="text-caption text-[#4B5563]">Target job alignment</p>
            </div>
          </div>

          {/* Skills Radar — wide card next to score ring row 2 */}
          <div className={`${skeletonCls("justify-center items-center lg:col-span-2 min-h-[280px]")}`}>
            <p className={`text-[12px] font-bold uppercase tracking-widest mb-2 ${!isReady ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}>Skills Mapping</p>
            <SkillsRadarChart scores={result?.section_scores} loading={!isReady} />
          </div>

          {/* Missing Keywords — NEW */}
          <div className={`${skeletonCls("lg:col-span-2 min-h-[140px]")}`} style={{ background: isReady && missingKw.length > 0 ? "rgba(245,158,11,0.03)" : undefined, border: isReady && missingKw.length > 0 ? "1px solid rgba(245,158,11,0.12)" : undefined }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-caption font-bold uppercase tracking-widest text-[#9CA3AF]">Missing Keywords</p>
              <AlertTriangle className={`w-4 h-4 ${isReady && missingKw.length > 0 ? "text-amber-500" : "text-[#9CA3AF]"}`} />
            </div>
            {isReady && missingKw.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {missingKw.map((kw, i) => (
                  <span key={i}
                    onClick={() => openStrategistWithQuery(`How do I add "${kw}" to my resume?`)}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all hover:bg-amber-500/20"
                    style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}
                    title={`Click to get advice on adding "${kw}"`}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-label mt-2 ${!isReady ? "text-[#374151]" : "text-emerald-400"}`}>
                {isReady ? "✓ No critical gaps found" : "--"}
              </p>
            )}
          </div>

          {/* Keywords Found */}
          <div className={`${skeletonCls("justify-between lg:col-span-1 min-h-[140px]")}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-caption font-bold uppercase tracking-widest text-[#9CA3AF]">Keywords Found</p>
              <TrendingUp className="w-4 h-4 text-[#9CA3AF]" />
            </div>
            <div>
              <p className={`text-4xl font-bold font-display ${!isReady ? "text-[#4B5563]" : "text-white"}`}>
                {isReady ? matchedKw : "--"}
                <span className={`text-lg font-sans font-normal ${!isReady ? "text-[#374151]" : "text-[#9CA3AF]"}`}> / {isReady ? totalKw : "--"}</span>
              </p>
              <div className="mt-2 mb-2"><BarProgress value={totalKw > 0 ? (matchedKw / totalKw) * 100 : 0} color="bg-white/30" height="h-2" loading={!isReady} /></div>
              <p className="text-caption text-[#4B5563]">Keywords matched</p>
            </div>
          </div>

        </div>

        {/* ─── Row 3: AI Suggestions ─── */}
        <div className={`${cardBase} ${!isReady && loading ? "skeleton-pulse" : ""} mb-6`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <Sparkles className={`w-4 h-4 ${!isReady ? "text-[#4B5563]" : "text-white"}`} />
              </div>
              <div>
                <p className={`text-[14px] font-bold ${!isReady ? "text-[#6B7280]" : "text-white"}`}>AI Suggestions</p>
                <p className="text-caption text-[#9CA3AF]">Click any card to open the AI Strategist.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: PenTool,   title: "Improve Summary",    desc: "Make your profile more impactful in 2 lines.", prompt: "How can I improve my resume summary?" },
              { icon: BarChart3, title: "Add Project Metrics", desc: "Include measurable outcomes (%, $, users).", prompt: "How can I add measurable outcomes?" },
              { icon: Shield,    title: "Optimize for ATS",   desc: "Use industry keywords for better visibility.", prompt: "Can you analyze my resume and optimize it?" },
              { icon: Lightbulb, title: "Enhance Skills",     desc: "Group skills by category for clarity.", prompt: "How should I structure my skills?" },
            ].map((s, i) => (
              <div
                key={i}
                onClick={() => openStrategistWithQuery(s.prompt)}
                className={`p-4 rounded-xl transition-all flex flex-col justify-center min-h-[120px] group ${isReady ? "cursor-pointer hover:bg-white/10 hover:border-white/15 hover:-translate-y-0.5" : ""}`}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <s.icon className={`w-4 h-4 transition-colors ${!isReady ? "text-[#4B5563]" : "text-white group-hover:text-purple-400"}`} />
                  <p className={`text-[13px] font-bold ${!isReady ? "text-[#6B7280]" : "text-white"}`}>{s.title}</p>
                </div>
                <p className={`text-[12px] leading-relaxed ${!isReady ? "text-[#4B5563]" : "text-[#9CA3AF]"}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
